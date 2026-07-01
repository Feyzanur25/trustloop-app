import { Router } from "express";
import { assertObject, assertWalletAddress } from "../validators.js";
import { buildChallenge, verifyChallenge } from "../stellar.js";

const router = Router();

router.post("/challenge", async (req, res, next) => {
  try {
    const body = assertObject(req.body);
    const walletAddress = assertWalletAddress(body.walletAddress);
    const payload = await buildChallenge(walletAddress);
    res.status(201).json(payload);
  } catch (error) {
    next(error);
  }
});

router.post("/verify", async (req, res, next) => {
  try {
    const body = assertObject(req.body);
    const session = verifyChallenge({
      challengeId: String(body.challengeId || "").trim(),
      signedXdr: String(body.signedXdr || "").trim(),
    });
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

export default router;
