import { Router } from "express";
import { getStateAsync } from "../data/state.js";

const router = Router();

router.get("/", async (_req, res) => {
  const state = await getStateAsync();
  res.json(state.events);
});

export default router;

