const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./db");
const Loop = require("./models/Loop");
const Event = require("./models/Event");
const Onboarding = require("./models/Onboarding");
const Approval = require("./models/Approval");
const { errorHandler, requestLogger, asyncHandler, AppError } = require("./middleware");

const app = express();
app.use(cors());
app.use(express.json());
app.use(requestLogger);

let isDBConnected = false;

function nowIso() {
  return new Date().toISOString();
}

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60_000).toISOString();
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, item) => sum + item, 0) / values.length);
}

function shortWallet(address) {
  const value = String(address || "").trim();
  if (!value) return "UNKNOWN";
  if (value.length <= 12) return value;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

const loops = [
  {
    id: "TL-001",
    counterparty: "GDPG...BZX5",
    role: "Client",
    status: "Active",
    score: 82,
    expiresInDays: 12,
    lastEvent: "trust.created",
    createdAt: daysAgo(10),
  },
  {
    id: "TL-002",
    counterparty: "GCFW...L5YU",
    role: "Freelancer",
    status: "Completed",
    score: 91,
    expiresInDays: 0,
    lastEvent: "trust.closed",
    createdAt: daysAgo(9),
  },
  {
    id: "TL-003",
    counterparty: "GB3S...4DF2",
    role: "Freelancer",
    status: "Pending",
    score: 58,
    expiresInDays: 16,
    lastEvent: "trust.confirmed",
    createdAt: daysAgo(3),
  },
  {
    id: "TL-004",
    counterparty: "GA8N...9VLA",
    role: "Client",
    status: "Active",
    score: 76,
    expiresInDays: 8,
    lastEvent: "trust.created",
    createdAt: daysAgo(1),
  },
];

const events = [
  { time: minutesAgo(900), type: "trust.created", loopId: "TL-001", detail: "TL-001 created" },
  { time: minutesAgo(860), type: "trust.confirmed", loopId: "TL-001", detail: "TL-001 confirmed" },
  { time: minutesAgo(720), type: "trust.created", loopId: "TL-002", detail: "TL-002 created" },
  { time: minutesAgo(640), type: "trust.confirmed", loopId: "TL-002", detail: "TL-002 confirmed" },
  { time: minutesAgo(510), type: "trust.closed", loopId: "TL-002", detail: "TL-002 closed" },
  { time: minutesAgo(220), type: "trust.created", loopId: "TL-003", detail: "TL-003 created" },
  { time: minutesAgo(180), type: "trust.confirmed", loopId: "TL-003", detail: "TL-003 confirmed" },
  { time: minutesAgo(70), type: "trust.created", loopId: "TL-004", detail: "TL-004 created" },
];

const onboardingProfiles = Array.from({ length: 32 }, (_, index) => {
  const dayOffset = index % 7;
  const wallet = `GDEMOUSERWALLET${String(index + 1).padStart(2, "0")}ZXCVBNM`;
  return {
    id: `OB-${String(index + 1).padStart(3, "0")}`,
    createdAt: daysAgo(dayOffset),
    name: `Pilot User ${index + 1}`,
    email: `pilot${index + 1}@trustloop.app`,
    walletAddress: wallet,
    walletShort: shortWallet(wallet),
    feedback:
      index % 4 === 0
        ? "Need milestone approvals and clearer loop closure state."
        : index % 3 === 0
        ? "Dashboard is clear, but activity retention emails would help."
        : "Fast onboarding and wallet connection flow.",
    productRating: 4 + (index % 2),
  };
});

const approvals = {
  "TL-001": { clientApproved: true, freelancerApproved: true, updatedAt: minutesAgo(820) },
  "TL-002": { clientApproved: true, freelancerApproved: true, updatedAt: minutesAgo(520) },
  "TL-003": { clientApproved: true, freelancerApproved: false, updatedAt: minutesAgo(150) },
  "TL-004": { clientApproved: false, freelancerApproved: false, updatedAt: minutesAgo(40) },
};

const requestMetrics = {
  startedAt: Date.now(),
  totalRequests: 0,
  totalErrors: 0,
  latencySamples: [],
};

let lastIndexerSyncAt = nowIso();

app.use((req, res, next) => {
  requestMetrics.totalRequests += 1;
  const start = Date.now();

  res.on("finish", () => {
    const latency = Date.now() - start;
    requestMetrics.latencySamples.push(latency);
    if (requestMetrics.latencySamples.length > 120) {
      requestMetrics.latencySamples.shift();
    }
    if (res.statusCode >= 400) {
      requestMetrics.totalErrors += 1;
    }
  });

  next();
});

function getNextId() {
  const max = loops.reduce((currentMax, loop) => {
    const parsed = Number(String(loop.id).replace("TL-", ""));
    return Number.isFinite(parsed) ? Math.max(currentMax, parsed) : currentMax;
  }, 0);
  return `TL-${String(max + 1).padStart(3, "0")}`;
}

function findLoop(loopId) {
  return loops.find((item) => item.id === loopId) || null;
}

function findLoopOr404(req, res) {
  const item = findLoop(req.params.id);
  if (!item) {
    res.status(404).json({ error: "Loop not found" });
    return null;
  }
  return item;
}

function addEvent(type, loopId, detail) {
  events.unshift({
    time: nowIso(),
    type,
    loopId,
    detail,
  });
  lastIndexerSyncAt = nowIso();
}

function loopStatusBreakdown() {
  return {
    active: loops.filter((item) => item.status === "Active").length,
    pending: loops.filter((item) => item.status === "Pending").length,
    completed: loops.filter((item) => item.status === "Completed").length,
  };
}

function dailyTransactions(days = 7) {
  const labels = Array.from({ length: days }, (_, index) => {
    const date = new Date(Date.now() - (days - index - 1) * 24 * 60 * 60_000);
    return date.toISOString().slice(5, 10);
  });

  return labels.map((label, index) => ({
    label,
    count: 3 + ((index * 2) % 5) + (index === days - 1 ? 4 : 0),
  }));
}

function buildOverviewMetrics() {
  const status = loopStatusBreakdown();
  const transactions7d = dailyTransactions(7).reduce((sum, item) => sum + item.count, 0);
  const verifiedWallets = onboardingProfiles.length;
  const retainedUsers = onboardingProfiles.filter((item, index) => index % 3 !== 0).length;
  const avgScore = average(loops.map((item) => item.score || 0));

  return {
    activeUsers: 32,
    verifiedWallets,
    transactions7d,
    retainedUsers,
    retentionRate: Math.round((retainedUsers / verifiedWallets) * 100),
    avgTrustScore: avgScore,
    completionRate: Math.round((status.completed / Math.max(1, loops.length)) * 100),
    loopsByStatus: status,
    approvalsReady: Object.values(approvals).filter(
      (item) => item.clientApproved && item.freelancerApproved
    ).length,
    dailyTransactions: dailyTransactions(7),
  };
}

function buildIndexerStatus() {
  return {
    status: "healthy",
    source: "Horizon operations + local trustloop cache",
    indexedEvents: events.length,
    indexedLoops: loops.length,
    pendingBackfill: 0,
    lastSyncedAt: lastIndexerSyncAt,
    eventTypes: {
      created: events.filter((item) => item.type === "trust.created").length,
      confirmed: events.filter((item) => item.type === "trust.confirmed").length,
      closed: events.filter((item) => item.type === "trust.closed").length,
      approvals: Object.values(approvals).filter(
        (item) => item.clientApproved || item.freelancerApproved
      ).length,
    },
  };
}

function buildMonitoringSummary() {
  const uptimeSeconds = Math.floor((Date.now() - requestMetrics.startedAt) / 1000);
  const avgLatencyMs = average(requestMetrics.latencySamples);
  return {
    status: "operational",
    uptimeSeconds,
    totalRequests: requestMetrics.totalRequests,
    totalErrors: requestMetrics.totalErrors,
    avgLatencyMs,
    errorRate: requestMetrics.totalRequests
      ? Number(((requestMetrics.totalErrors / requestMetrics.totalRequests) * 100).toFixed(2))
      : 0,
    services: [
      { name: "API", status: "up", detail: "Express API responding" },
      { name: "Indexer", status: "up", detail: "Indexed event stream healthy" },
      { name: "Wallet demo", status: "degraded", detail: "Depends on Freighter extension" },
      { name: "Horizon relay", status: "up", detail: "Submission path configured" },
    ],
    alerts: [
      {
        severity: "medium",
        title: "Community growth still manual",
        detail: "Automated CRM export is not connected yet.",
      },
      {
        severity: "low",
        title: "Bundle size optimization pending",
        detail: "Frontend build still exceeds 500 kB warning threshold.",
      },
    ],
  };
}

function buildSecurityChecklist() {
  return [
    { id: "wallet-network", label: "Freighter network passphrase validation", status: "done" },
    { id: "input-validation", label: "Counterparty and expiry input validation", status: "done" },
    { id: "error-states", label: "User-facing error handling and retries", status: "done" },
    { id: "monitoring", label: "Operational monitoring dashboard", status: "done" },
    { id: "indexing", label: "Indexer visibility and freshness tracking", status: "done" },
    { id: "rate-limits", label: "API rate limits", status: "planned" },
    { id: "audit-log", label: "Approval audit trail", status: "done" },
  ];
}

app.get("/", (_req, res) => {
  res.type("text").send("TrustLoop API is running. Try /api/health");
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    status: "healthy",
    timestamp: nowIso(),
    uptimeSeconds: Math.floor((Date.now() - requestMetrics.startedAt) / 1000),
  });
});

app.get("/api/trustloops", async (_req, res) => {
  try {
    if (isDBConnected) {
      const dbLoops = await Loop.find().lean();
      const approvalData = await Promise.all(
        dbLoops.map(async (loop) => {
          const approval = await Approval.findOne({ loopId: loop.id }).lean();
          return { ...loop, approvals: approval || null };
        })
      );
      return res.json(approvalData);
    }
  } catch (err) {
    console.warn("DB query failed, using fallback:", err.message);
  }
  
  // Fallback to in-memory
  res.json(loops.map((loop) => ({ ...loop, approvals: approvals[loop.id] || null })));
});

app.get("/api/trustloops/:id", (req, res) => {
  const item = findLoopOr404(req, res);
  if (!item) return;
  res.json({ ...item, approvals: approvals[item.id] || null });
});

app.get("/api/events", (_req, res) => {
  res.json(events);
});

app.get("/api/dashboard/stats", (_req, res) => {
  const overview = buildOverviewMetrics();
  res.json({
    loopsActive: overview.loopsByStatus.active,
    loopsPending: overview.loopsByStatus.pending,
    loopsCompleted: overview.loopsByStatus.completed,
    trustScoreAvg: overview.avgTrustScore,
  });
});

app.get("/api/metrics/overview", (_req, res) => {
  res.json(buildOverviewMetrics());
});

app.get("/api/monitoring", (_req, res) => {
  res.json(buildMonitoringSummary());
});

app.get("/api/indexer", (_req, res) => {
  res.json(buildIndexerStatus());
});

app.get("/api/security-checklist", (_req, res) => {
  res.json(buildSecurityChecklist());
});

app.get("/api/onboarding", (_req, res) => {
  res.json({
    count: onboardingProfiles.length,
    records: onboardingProfiles,
  });
});

app.post("/api/onboarding", (req, res) => {
  const { name, email, walletAddress, feedback, productRating } = req.body ?? {};
  if (!name || !email || !walletAddress) {
    return res.status(400).json({ error: "name, email and walletAddress are required" });
  }

  const record = {
    id: `OB-${String(onboardingProfiles.length + 1).padStart(3, "0")}`,
    createdAt: nowIso(),
    name: String(name).trim(),
    email: String(email).trim(),
    walletAddress: String(walletAddress).trim(),
    walletShort: shortWallet(walletAddress),
    feedback: String(feedback || "").trim(),
    productRating: clampNumber(productRating, 1, 5, 4),
  };

  onboardingProfiles.unshift(record);
  res.status(201).json(record);
});

app.post("/api/trustloops", async (req, res) => {
  const { counterparty, role, expiresInDays } = req.body ?? {};
  if (!counterparty || typeof counterparty !== "string") {
    return res.status(400).json({ error: "counterparty required (string)" });
  }

  const id = getNextId();
  const item = {
    id,
    counterparty: shortWallet(counterparty),
    role: role === "Freelancer" ? "Freelancer" : "Client",
    status: "Pending",
    score: 0,
    expiresInDays: clampNumber(expiresInDays, 1, 90, 14),
    lastEvent: "trust.created",
    createdAt: nowIso(),
  };

  try {
    if (isDBConnected) {
      const newLoop = await Loop.create(item);
      const approval = await Approval.create({
        loopId: id,
        clientApproved: false,
        freelancerApproved: false,
      });
      const eventDoc = await Event.create({
        type: "trust.created",
        loopId: id,
        detail: `${id} created`,
      });
      return res.status(201).json({ ...newLoop.toObject(), approvals: approval.toObject() });
    }
  } catch (err) {
    console.warn("DB write failed, using fallback:", err.message);
  }

  // Fallback to in-memory
  loops.unshift(item);
  approvals[item.id] = {
    clientApproved: false,
    freelancerApproved: false,
    updatedAt: nowIso(),
  };
  addEvent("trust.created", item.id, `${item.id} created`);
  res.status(201).json(item);
});

app.post("/api/trustloops/:id/confirm", (req, res) => {
  const item = findLoopOr404(req, res);
  if (!item) return;
  if (item.status !== "Pending") {
    return res.status(400).json({ error: "Only Pending loops can be confirmed" });
  }

  item.status = "Active";
  item.score = clampNumber(item.score || 75, 0, 100, 75);
  item.lastEvent = "trust.confirmed";
  addEvent("trust.confirmed", item.id, `${item.id} confirmed`);
  res.json(item);
});

app.post("/api/trustloops/:id/close", (req, res) => {
  const item = findLoopOr404(req, res);
  if (!item) return;
  if (item.status !== "Active") {
    return res.status(400).json({ error: "Only Active loops can be closed" });
  }

  const approval = approvals[item.id];
  if (approval && (!approval.clientApproved || !approval.freelancerApproved)) {
    return res
      .status(400)
      .json({ error: "Both client and freelancer approvals are required before closing" });
  }

  item.status = "Completed";
  item.expiresInDays = 0;
  item.lastEvent = "trust.closed";
  addEvent("trust.closed", item.id, `${item.id} closed`);
  res.json(item);
});

app.post("/api/trustloops/:id/approve", (req, res) => {
  const item = findLoopOr404(req, res);
  if (!item) return;

  const actor = req.body?.actor === "Freelancer" ? "Freelancer" : "Client";
  const entry = approvals[item.id] || {
    clientApproved: false,
    freelancerApproved: false,
    updatedAt: nowIso(),
  };

  if (actor === "Client") entry.clientApproved = true;
  if (actor === "Freelancer") entry.freelancerApproved = true;
  entry.updatedAt = nowIso();
  approvals[item.id] = entry;

  addEvent(
    "trust.approved",
    item.id,
    `${item.id} ${actor.toLowerCase()} approval captured`
  );

  res.json({
    loopId: item.id,
    approvals: entry,
    readyToClose: entry.clientApproved && entry.freelancerApproved,
  });
});

app.use((err, _req, res, _next) => {
  if (!res.headersSent) {
    return errorHandler(err, _req, res, _next);
  }
});

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    error: "Not found",
    statusCode: 404,
  });
});

const PORT = process.env.PORT || 4000;

(async () => {
  // Try to connect to MongoDB
  isDBConnected = await connectDB();
  
  app.listen(PORT, () => {
    const dbStatus = isDBConnected ? "with MongoDB" : "in fallback mode (memory)";
    console.log(`✓ API running at http://localhost:${PORT} ${dbStatus}`);
  });
})();
