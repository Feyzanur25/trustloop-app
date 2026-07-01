import { Router } from "express";
import { buildOverviewMetrics } from "../logic/trustScore.js";
import { repository } from "../repository.js";

const router = Router();

router.get("/overview", (_req, res) => {
  const state = repository.getState();
  res.json(buildOverviewMetrics(state));
});

router.get("/dashboard/stats", (_req, res) => {
  const state = repository.getState();
  const overview = buildOverviewMetrics(state);
  res.json({
    loopsActive: overview.loopsByStatus.active,
    loopsPending: overview.loopsByStatus.pending,
    loopsCompleted: overview.loopsByStatus.completed,
    trustScoreAvg: overview.avgTrustScore,
  });
});

export default router;

