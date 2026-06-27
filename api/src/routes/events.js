import { Router } from "express";
import { getState } from "../data/state.js";

const router = Router();

router.get("/", (_req, res) => {
  const state = getState();
  res.json(state.events);
});

export default router;
