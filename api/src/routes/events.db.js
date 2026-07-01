import { Router } from "express";
import { repository } from "../repository.js";

const router = Router();

router.get("/", (_req, res) => {
  const state = repository.getState();
  res.json(state.events);
});

export default router;

