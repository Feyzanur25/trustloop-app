import { Router } from "express";
import { buildMonitoringSummary, buildIndexerStatus, buildSecurityChecklist } from "../logic/trustScore.js";
import { getState } from "../data/state.js";
import { getMetrics as getRequestMetrics } from "../data/metrics.js";

const router = Router();

router.get("/", (_req, res) => {
  const state = getState();
  const metrics = getRequestMetrics();
  res.json(buildMonitoringSummary(metrics));
});

router.get("/indexer", (_req, res) => {
  const state = getState();
  res.json(buildIndexerStatus(state));
});

router.get("/security-checklist", (_req, res) => {
  res.json(buildSecurityChecklist());
});

export default router;
