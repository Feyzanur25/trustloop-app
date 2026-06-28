import { Router } from "express";
import { buildMonitoringSummary, buildIndexerStatus, buildSecurityChecklist } from "../logic/trustScore.js";
import { getStateAsync } from "../data/state.js";
import { getMetrics as getRequestMetrics } from "../data/metrics.js";

const router = Router();

router.get("/", async (_req, res) => {
  const state = await getStateAsync();
  const metrics = getRequestMetrics();
  res.json(buildMonitoringSummary(metrics));
});

router.get("/indexer", async (_req, res) => {
  const state = await getStateAsync();
  res.json(buildIndexerStatus(state));
});

router.get("/security-checklist", (_req, res) => {
  res.json(buildSecurityChecklist());
});

export default router;

