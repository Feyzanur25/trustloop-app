import { Router } from "express";
import { buildOverviewMetrics } from "../logic/trustScore.js";
import { getStateAsync } from "../data/state.js";

const router = Router();

router.get("/overview", async (_req, res) => {
  const state = await getStateAsync();
  res.json(buildOverviewMetrics(state));
});

router.get("/dashboard/stats", async (_req, res) => {
  const state = await getStateAsync();
  const overview = buildOverviewMetrics(state);
  res.json({
    loopsActive: overview.loopsByStatus.active,
    loopsPending: overview.loopsByStatus.pending,
    loopsCompleted: overview.loopsByStatus.completed,
    trustScoreAvg: overview.avgTrustScore,
  });
});

export default router;

