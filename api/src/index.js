import "dotenv/config";
import express from "express";
import { assertConfig, config } from "./config.js";
import { applyCors, applySecurityHeaders, jsonErrorHandler, rateLimiter, requestLogger } from "./security.js";
import { repository } from "./repository.js";
import authRouter from "./routes/auth.js";
import loopsRouter from "./routes/loops.db.js";
import eventsRouter from "./routes/events.db.js";
import onboardingRouter from "./routes/onboarding.db.js";
import metricsRouter from "./routes/metrics.db.js";
import monitoringRouter from "./routes/monitoring.db.js";

const app = express();
const configIssues = assertConfig();

app.disable("x-powered-by");
app.use(applySecurityHeaders);
app.use(applyCors);
app.use(express.json({ limit: "50kb" }));
app.use(requestLogger);
app.use("/api", rateLimiter);
app.use((req, _res, next) => {
  repository.cleanup();
  next();
});

app.get("/", (_req, res) => {
  res.type("text").send("TrustLoop API is running.");
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: configIssues.length === 0,
    status: configIssues.length === 0 ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    network: config.network,
    storageDriver: config.storageDriver,
    configIssues,
  });
});

app.get("/api/network", (_req, res) => {
  res.json({
    network: config.network,
    label: config.networkLabel,
    passphrase: config.networkPassphrase,
    horizonUrl: config.horizonUrl,
    feeSponsorshipEnabled: config.enableSponsorship,
    sponsorPublicKey: config.sponsorPublicKey || null,
  });
});

app.use("/api/auth", authRouter);
app.use("/api/trustloops", loopsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/onboarding", onboardingRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/monitoring", monitoringRouter);

app.use((_req, res) => {
  res.status(404).json({
    error: "Not found",
    statusCode: 404,
  });
});

app.use(jsonErrorHandler);

if (process.env.VERCEL !== "1") {
  app.listen(config.port, () => {
    console.log(`TrustLoop API listening on http://localhost:${config.port}`);
  });
}

export default app;