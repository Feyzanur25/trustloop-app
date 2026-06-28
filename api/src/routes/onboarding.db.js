import { Router } from "express";
import { nowIso, shortWallet } from "../utils/helpers.js";
import { getStateAsync, setState } from "../data/state.js";

const router = Router();

router.get("/", async (_req, res) => {
  const state = await getStateAsync();
  res.json({
    count: state.onboardingProfiles.length,
    records: state.onboardingProfiles,
  });
});

router.post("/", async (req, res) => {
  const { name, email, walletAddress } = req.body ?? {};
  if (!name || !email || !walletAddress) {
    return res.status(400).json({ error: "name, email and walletAddress are required" });
  }

  const state = await getStateAsync();
  const record = {
    id: `OB-${String(state.onboardingProfiles.length + 1).padStart(3, "0")}`,
    createdAt: nowIso(),
    name: String(name).trim(),
    email: String(email).trim(),
    walletAddress: String(walletAddress).trim(),
    walletShort: shortWallet(walletAddress),
    feedback: String(req.body.feedback || "").trim(),
    productRating: Math.min(5, Math.max(1, Number(req.body.productRating) || 4)),
  };

  state.onboardingProfiles.unshift(record);
  await setState(state);
  res.status(201).json(record);
});

export default router;

