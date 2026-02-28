const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// -------------------- Helpers (time + utils) --------------------
function isoNow() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}
function isoNowMinusMinutes(m) {
  const d = new Date(Date.now() - m * 60_000);
  return d.toISOString().slice(0, 16).replace("T", " ");
}

function clampNumber(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

// -------------------- In-memory store --------------------
const loops = [
  {
    id: "TL-001",
    counterparty: "GBDY...RVNE",
    role: "Freelancer",
    status: "Pending",
    score: 0,
    expiresInDays: 14,
    lastEvent: "trust.created",
  },
  {
    id: "TL-002",
    counterparty: "GASD...91PQ",
    role: "Client",
    status: "Active",
    score: 78,
    expiresInDays: 9,
    lastEvent: "trust.confirmed",
  },
  {
    id: "TL-003",
    counterparty: "GZK1...X2AA",
    role: "Freelancer",
    status: "Completed",
    score: 92,
    expiresInDays: 0,
    lastEvent: "trust.closed",
  },
];

// -------------------- Events feed (global) --------------------
// UI için standardize: { time, type, loopId, detail }
const events = [
  {
    time: isoNowMinusMinutes(36),
    type: "trust.created",
    loopId: "TL-001",
    detail: "TL-001 created",
  },
  {
    time: isoNowMinusMinutes(18),
    type: "trust.confirmed",
    loopId: "TL-002",
    detail: "TL-002 confirmed",
  },
  {
    time: isoNowMinusMinutes(4),
    type: "trust.closed",
    loopId: "TL-003",
    detail: "TL-003 closed",
  },
];

function addEvent(type, loopId, detail) {
  events.unshift({ time: isoNow(), type, loopId, detail });
}

// -------------------- ID + find helpers --------------------
function getNextId() {
  const max = loops.reduce((acc, l) => {
    const n = Number(String(l.id).replace("TL-", ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `TL-${String(max + 1).padStart(3, "0")}`;
}

function findLoopOr404(req, res) {
  const item = loops.find((l) => l.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: "not found" });
    return null;
  }
  return item;
}

// -------------------- Routes --------------------
app.get("/", (_req, res) => {
  res.type("text").send("TrustLoop API is running ✅  Try /api/health");
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/trustloops", (_req, res) => res.json(loops));

app.get("/api/trustloops/:id", (req, res) => {
  const item = findLoopOr404(req, res);
  if (!item) return;
  res.json(item);
});

// Global events feed
app.get("/api/events", (_req, res) => res.json(events));

// Dashboard stats
app.get("/api/dashboard/stats", (_req, res) => {
  const active = loops.filter((l) => l.status === "Active").length;
  const pending = loops.filter((l) => l.status === "Pending").length;
  const completed = loops.filter((l) => l.status === "Completed").length;

  const nonPending = loops.filter((l) => l.status !== "Pending");
  const avgScore = Math.round(
    nonPending.reduce((a, b) => a + (b.score || 0), 0) /
      Math.max(1, nonPending.length)
  );

  res.json({
    loopsActive: active,
    loopsPending: pending,
    loopsCompleted: completed,
    trustScoreAvg: avgScore,
  });
});

// Create loop
app.post("/api/trustloops", (req, res) => {
  const { counterparty, role, expiresInDays } = req.body ?? {};

  if (!counterparty || typeof counterparty !== "string") {
    return res.status(400).json({ error: "counterparty required (string)" });
  }

  const validRole = role === "Client" ? "Client" : "Freelancer";
  const validExpires = clampNumber(expiresInDays, 1, 90, 14);

  const item = {
    id: getNextId(),
    counterparty: counterparty.trim(),
    role: validRole,
    status: "Pending",
    score: 0,
    expiresInDays: validExpires,
    lastEvent: "trust.created",
  };

  loops.unshift(item);
  addEvent("trust.created", item.id, `${item.id} created`);

  return res.status(201).json(item);
});

// Confirm loop (Pending -> Active)
app.post("/api/trustloops/:id/confirm", (req, res) => {
  const item = findLoopOr404(req, res);
  if (!item) return;

  if (item.status !== "Pending") {
    return res
      .status(400)
      .json({ error: "Only Pending loops can be confirmed" });
  }

  item.status = "Active";
  item.score = clampNumber(item.score || 0, 0, 100, 75); // demo bump
  item.lastEvent = "trust.confirmed";

  addEvent("trust.confirmed", item.id, `${item.id} confirmed`);
  return res.json(item);
});

// Close loop (Active -> Completed)
app.post("/api/trustloops/:id/close", (req, res) => {
  const item = findLoopOr404(req, res);
  if (!item) return;

  if (item.status !== "Active") {
    return res.status(400).json({ error: "Only Active loops can be closed" });
  }

  item.status = "Completed";
  item.expiresInDays = 0;
  item.lastEvent = "trust.closed";

  addEvent("trust.closed", item.id, `${item.id} closed`);
  return res.json(item);
});

// -------------------- Start --------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`API running at http://localhost:${PORT}`)
);
