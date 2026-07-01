import { Router } from "express";
import {
  findLoop,
  withLoopApproval,
  isApprovalReady,
  deriveTrustScore,
  normalizeLoop,
  normalizeApproval,
} from "../logic/trustScore.js";
import { conflict, forbidden, notFound } from "../errors.js";
import { repository } from "../repository.js";
import { requireAuth } from "../security.js";
import { parseActorInput, parseLoopInput } from "../validators.js";
import { buildSponsoredManageDataTransaction, submitSponsoredTransaction } from "../stellar.js";

const router = Router();

function addEvent(state, type, loopId, detail, txHash = null) {
  state.events.unshift({
    id: `EV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    time: new Date().toISOString(),
    type,
    loopId,
    detail,
    txHash,
  });
  state.meta.lastIndexerSyncAt = new Date().toISOString();
}

function getParticipantWallets(loop) {
  return loop.role === "Client"
    ? { clientWallet: loop.initiatorWallet, freelancerWallet: loop.counterparty }
    : { clientWallet: loop.counterparty, freelancerWallet: loop.initiatorWallet };
}

function assertParticipant(loop, walletAddress) {
  const { clientWallet, freelancerWallet } = getParticipantWallets(loop);
  if (walletAddress !== clientWallet && walletAddress !== freelancerWallet) {
    throw forbidden("Authenticated wallet is not part of this trust loop.");
  }
}

function assertActorAuthorization(loop, walletAddress, actor) {
  const { clientWallet, freelancerWallet } = getParticipantWallets(loop);
  if (actor === "Client" && walletAddress !== clientWallet) {
    throw forbidden("Only the client wallet can perform this action.");
  }
  if (actor === "Freelancer" && walletAddress !== freelancerWallet) {
    throw forbidden("Only the freelancer wallet can perform this action.");
  }
}

function buildLoopResponse(state, loop) {
  return withLoopApproval(loop, state.approvals);
}

function actionDetail(action) {
  return action === "revoke" ? "revoked" : `${action}d`;
}

router.get("/", (_req, res) => {
  const state = repository.getState();
  res.json(state.loops.map((loop) => buildLoopResponse(state, loop)));
});

router.get("/:id", (req, res) => {
  const state = repository.getState();
  const item = findLoop(req.params.id, state.loops);
  if (!item) {
    return res.status(404).json({ error: "Loop not found" });
  }
  res.json(buildLoopResponse(state, item));
});

router.post("/prepare", requireAuth, async (req, res, next) => {
  try {
    const payload = parseLoopInput(req.body);
    const walletAddress = req.auth.walletAddress;
    const state = repository.getState();
    const nextId = `TL-${String(state.loops.length + 1).padStart(3, "0")}`;
    const tx = await buildSponsoredManageDataTransaction({
      walletAddress,
      action: "create",
      loopId: nextId,
      memo: `create:${nextId}`,
      detail: `${nextId}:create`,
    });
    const intent = state.auth.sponsorshipIntents.find((item) => item.id === tx.intentId);
    intent.mutation = { type: "create", payload, loopId: nextId };
    repository.save();
    res.status(201).json({ ...tx, loopId: nextId });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/prepare-action", requireAuth, async (req, res, next) => {
  try {
    const state = repository.getState();
    const loop = findLoop(req.params.id, state.loops);
    if (!loop) throw notFound("Loop not found");

    const action = String(req.body?.action || "").trim();
    assertParticipant(loop, req.auth.walletAddress);

    if (!["confirm", "close", "approve", "revoke"].includes(action)) {
      throw conflict("Unsupported action.");
    }

    let mutation = { type: action, loopId: loop.id };
    if (action === "approve" || action === "revoke") {
      const { actor } = parseActorInput(req.body);
      assertActorAuthorization(loop, req.auth.walletAddress, actor);
      mutation.actor = actor;
    }

    if (action === "confirm" && loop.status !== "Pending") {
      throw conflict("Only pending loops can be confirmed.");
    }
    if (action === "close" && loop.status !== "Active") {
      throw conflict("Only active loops can be closed.");
    }

    const tx = await buildSponsoredManageDataTransaction({
      walletAddress: req.auth.walletAddress,
      action,
      loopId: loop.id,
      memo: `${action}:${loop.id}`,
      detail: `${loop.id}:${action}`,
    });
    const intent = state.auth.sponsorshipIntents.find((item) => item.id === tx.intentId);
    intent.mutation = mutation;
    repository.save();
    res.status(201).json(tx);
  } catch (error) {
    next(error);
  }
});

router.post("/commit", requireAuth, async (req, res, next) => {
  try {
    const state = repository.getState();
    const intentId = String(req.body?.intentId || "").trim();
    const signedXdr = String(req.body?.signedXdr || "").trim();
    const intent = state.auth.sponsorshipIntents.find((item) => item.id === intentId);
    if (!intent || !intent.mutation) {
      throw notFound("Prepared transaction not found.");
    }

    const submission = await submitSponsoredTransaction({
      intentId,
      signedXdr,
      walletAddress: req.auth.walletAddress,
    });

    let loop = null;
    if (intent.mutation.type === "create") {
      const item = normalizeLoop({
        id: intent.mutation.loopId,
        counterparty: intent.mutation.payload.counterparty,
        role: intent.mutation.payload.role,
        status: "Pending",
        score: 0,
        expiresInDays: intent.mutation.payload.expiresInDays,
        lastEvent: "trust.created",
        createdAt: new Date().toISOString(),
        approvalPolicy: intent.mutation.payload.approvalPolicy,
        initiatorWallet: req.auth.walletAddress,
        lastTxHash: submission.hash,
      });
      state.loops.unshift(item);
      state.approvals[item.id] = normalizeApproval(item, {
        requiredApprovals: item.approvalPolicy === "single" ? 1 : 2,
        updatedAt: new Date().toISOString(),
      });
      item.score = deriveTrustScore(item, state.approvals[item.id]);
      addEvent(state, "trust.created", item.id, `${item.id} created`, submission.hash);
      loop = item;
    } else {
      loop = findLoop(intent.mutation.loopId, state.loops);
      if (!loop) throw notFound("Loop not found.");
      assertParticipant(loop, req.auth.walletAddress);
      const approval = state.approvals[loop.id] || normalizeApproval(loop);

      if (intent.mutation.type === "confirm") {
        loop.status = "Active";
        loop.lastEvent = "trust.confirmed";
        loop.lastTxHash = submission.hash;
        addEvent(state, "trust.confirmed", loop.id, `${loop.id} confirmed`, submission.hash);
      }

      if (intent.mutation.type === "close") {
        if (!isApprovalReady(approval)) {
          throw conflict("Required approvals must be captured before closing.");
        }
        loop.status = "Completed";
        loop.expiresInDays = 0;
        loop.lastEvent = "trust.closed";
        loop.lastTxHash = submission.hash;
        addEvent(state, "trust.closed", loop.id, `${loop.id} closed`, submission.hash);
      }

      if (intent.mutation.type === "approve" || intent.mutation.type === "revoke") {
        assertActorAuthorization(loop, req.auth.walletAddress, intent.mutation.actor);
        if (intent.mutation.actor === "Client") {
          approval.clientApproved = intent.mutation.type === "approve";
        }
        if (intent.mutation.actor === "Freelancer") {
          approval.freelancerApproved = intent.mutation.type === "approve";
        }
        approval.updatedAt = new Date().toISOString();
        state.approvals[loop.id] = approval;
        loop.lastEvent = intent.mutation.type === "approve" ? "trust.approved" : "trust.approval_revoked";
        loop.lastTxHash = submission.hash;
        addEvent(
          state,
          loop.lastEvent,
          loop.id,
          `${loop.id} ${String(intent.mutation.actor).toLowerCase()} ${actionDetail(intent.mutation.type)}`,
          submission.hash,
        );
      }

      loop.score = deriveTrustScore(loop, state.approvals[loop.id] || approval);
    }

    repository.save();
    res.json({
      loop: buildLoopResponse(state, loop),
      transaction: submission,
      readyToClose: loop ? isApprovalReady(state.approvals[loop.id]) : false,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

