import { Router } from "express";
import { parseOnboardingInput } from "../validators.js";
import { repository } from "../repository.js";
import { shortWallet } from "../utils/helpers.js";

const router = Router();

router.get("/", (_req, res) => {
  const state = repository.getState();
  res.json({
    count: state.onboardingProfiles.length,
    records: state.onboardingProfiles,
  });
});

router.post("/", (req, res, next) => {
  try {
    const payload = parseOnboardingInput(req.body);
    const state = repository.getState();
  const record = {
    id: `OB-${String(state.onboardingProfiles.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
    ...payload,
    walletShort: shortWallet(payload.walletAddress),
  };

  state.onboardingProfiles.unshift(record);
    repository.save();
  res.status(201).json(record);
  } catch (error) {
    next(error);
  }
});

export default router;

