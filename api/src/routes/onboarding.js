import { Router } from "express";
import { isValidEmail, isValidStellarPublicKey, nowIso } from "../utils/helpers.js";
import { getState, setState } from "../data/state.js";

const router = Router();

router.get("/", (_req, res) => {
  const state = getState();
  res.json({
    count: state.onboardingProfiles.length,
    records: state.onboardingProfiles,
  });
});

router.post("/", (req, res) => {
  const { name, email, walletAddress } = req.body ?? {};
  if (!name || !email || !walletAddress) {
    return res.status(400).json({ error: "name, email and walletAddress are required" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "email must be a valid email address" });
  }

  if (!isValidStellarPublicKey(walletAddress)) {
    return res.status(400).json({ error: "walletAddress must be a valid Stellar public key" });
  }

  const state = getState();
  const record = {
    id: `OB-${String(state.onboardingProfiles.length + 1).padStart(3, "0")}`,
    createdAt: nowIso(),
    name: String(name).trim(),
    email: String(email).trim(),
    walletAddress: String(walletAddress).trim(),
    walletShort: `${String(walletAddress).trim().slice(0, 4)}...${String(walletAddress).trim().slice(-4)}`,
    feedback: String(req.body.feedback || "").trim(),
    productRating: Math.min(5, Math.max(1, Number(req.body.productRating) || 4)),
  };

  state.onboardingProfiles.unshift(record);
  setState(state);
  res.status(201).json(record);
});

export default router;
