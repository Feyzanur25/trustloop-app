import fs from "fs";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { errorHandler, requestLogger, createRateLimiter } from "./middleware.js";
import { getStateAsync, addEvent, refreshLoopScoresInState, importLocalState } from "./data/state.js";


import { buildMonitoringSummary } from "./logic/trustScore.js";
import { recordRequest, recordLatency, getMetrics as getRequestMetrics } from "./data/metrics.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const onboardingSeed = JSON.parse(fs.readFileSync(join(__dirname, "../../shared/onboarding-seed.json"), "utf-8"));

const app = express();
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use("/api", createRateLimiter({ windowMs: 60_000, max: 180 }));

app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const latency = Date.now() - start;
    recordRequest(res.statusCode);
    recordLatency(latency);
  });

  next();
});

app.get("/", (_req, res) => {
  res.type("text").send("TrustLoop API is running. Try /api/health");
});

app.get("/api/health", (_req, res) => {
  const metrics = getRequestMetrics();
  res.json({
    ok: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - metrics.startedAt) / 1000),
  });
});

import loopsRouter from "./routes/loops.db.js";

import eventsRouter from "./routes/events.db.js";
import onboardingRouter from "./routes/onboarding.db.js";
import metricsRouter from "./routes/metrics.db.js";
import monitoringRouter from "./routes/monitoring.db.js";


app.use("/api/trustloops", loopsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/onboarding", onboardingRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/monitoring", monitoringRouter);

app.get("/api/indexer", async (_req, res) => {

  const state = await getStateAsync();

  const indexerStatus = {
    status: "healthy",
    source: "TrustLoop persistent API store",
    indexedEvents: state.events.length,
    indexedLoops: state.loops.length,
    pendingBackfill: 0,
    lastSyncedAt: state.meta.lastIndexerSyncAt,
    eventTypes: {
      created: state.events.filter((item) => item.type === "trust.created").length,
      confirmed: state.events.filter((item) => item.type === "trust.confirmed").length,
      closed: state.events.filter((item) => item.type === "trust.closed").length,
      approvals: state.events.filter((item) => item.type === "trust.approved").length,
    },
  };
  res.json(indexerStatus);
});

app.get("/api/security-checklist", (_req, res) => {
  res.json([
    { id: "wallet-network", label: "Freighter network passphrase validation", status: "done" },
    { id: "input-validation", label: "Counterparty and expiry input validation", status: "done" },
    { id: "error-states", label: "User-facing error handling and retries", status: "done" },
    { id: "monitoring", label: "Operational monitoring dashboard", status: "done" },
    { id: "indexing", label: "Indexer visibility and freshness tracking", status: "done" },
    { id: "persistence", label: "Server-side data persistence", status: "done" },
    { id: "rate-limits", label: "API rate limits", status: "planned" },
  ]);
});

app.post("/api/admin/import-local-state", async (req, res) => {

  const { loops, events, onboardingProfiles, approvals } = req.body ?? {};

  const nextRaw = {
    loops: Array.isArray(loops) ? loops : [],
    events: Array.isArray(events) ? events : [],
    onboardingProfiles: Array.isArray(onboardingProfiles) ? onboardingProfiles : [],
    approvals: approvals && typeof approvals === "object" ? approvals : {},
    meta: {
      lastIndexerSyncAt: new Date().toISOString(),
    },
  };

  const result = await importLocalState(nextRaw);


  res.json({
    ok: true,
    loopsImported: result.loops.length,
    eventsImported: result.events.length,
    onboardingImported: result.onboardingProfiles.length,
  });
});

app.use((err, req, res, next) => {
  if (!res.headersSent) {
    return errorHandler(err, req, res, next);
  }
});

app.use((_req, res) => {
  res.status(404).json({
    error: "Not found",
    statusCode: 404,
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT} (persistent DB mode)`);


});