import { Router } from "express";
import {
  findLoop,
  withLoopApproval,
  getNextId,
  addEvent as _addEvent,
  isApprovalReady,
  deriveTrustScore,
  normalizeLoop,
  normalizeApproval,
} from "../logic/trustScore.js";
import { clampNumber, nowIso } from "../utils/helpers.js";
import { getStateAsync, setState, addEvent } from "../data/state.js";

const router = Router();

router.get("/", async (_req, res) => {
  const state = await getStateAsync();
  res.json(state.loops.map(withLoopApproval));
});

router.get("/:id", async (req, res) => {
  const state = await getStateAsync();
  const item = findLoop(req.params.id, state.loops);
  if (!item) {
    return res.status(404).json({ error: "Loop not found" });
  }
  res.json(withLoopApproval(item));
});

router.post("/", async (req, res) => {
  const { counterparty, role, expiresInDays, approvalPolicy } = req.body ?? {};
  if (!counterparty || typeof counterparty !== "string") {
    return res.status(400).json({ error: "counterparty required (string)" });
  }

  const state = await getStateAsync();
  const id = getNextId(state.loops);
  const item = normalizeLoop({
    id,
    counterparty,
    role,
    status: "Pending",
    score: 0,
    expiresInDays: clampNumber(expiresInDays, 1, 90, 14),
    lastEvent: "trust.created",
    createdAt: nowIso(),
    approvalPolicy: approvalPolicy === "single" ? "single" : "dual",
  });

  state.loops.unshift(item);
  state.approvals[item.id] = normalizeApproval(item, {
    clientApproved: false,
    freelancerApproved: false,
    requiredApprovals: item.approvalPolicy === "single" ? 1 : 2,
    updatedAt: nowIso(),
  });
  item.score = deriveTrustScore(item, state.approvals[item.id]);

  // Add event + update meta
  await addEvent("trust.created", item.id, `${item.id} created`);
  await setState(state);

  res.status(201).json(withLoopApproval(item));
});

router.post("/:id/confirm", async (req, res) => {
  const state = await getStateAsync();
  const item = findLoop(req.params.id, state.loops);
  if (!item) return res.status(404).json({ error: "Loop not found" });
  if (item.status !== "Pending") {
    return res.status(400).json({ error: "Only Pending loops can be confirmed" });
  }

  item.status = "Active";
  item.lastEvent = "trust.confirmed";
  item.score = deriveTrustScore(item, state.approvals[item.id]);

  await addEvent("trust.confirmed", item.id, `${item.id} confirmed`);
  await setState(state);

  res.json(withLoopApproval(item));
});

router.post("/:id/close", async (req, res) => {
  const state = await getStateAsync();
  const item = findLoop(req.params.id, state.loops);
  if (!item) return res.status(404).json({ error: "Loop not found" });

  if (item.status !== "Active") {
    return res.status(400).json({ error: "Only Active loops can be closed" });
  }

  const approval = state.approvals[item.id] || normalizeApproval(item);
  if (!isApprovalReady(approval)) {
    return res.status(400).json({
      error: "Required approvals must be captured before closing",
    });
  }

  item.status = "Completed";
  item.expiresInDays = 0;
  item.lastEvent = "trust.closed";
  item.score = deriveTrustScore(item, approval);

  await addEvent("trust.closed", item.id, `${item.id} closed`);
  await setState(state);

  res.json(withLoopApproval(item));
});

router.post("/:id/approve", async (req, res) => {
  const state = await getStateAsync();
  const item = findLoop(req.params.id, state.loops);
  if (!item) return res.status(404).json({ error: "Loop not found" });

  const actor = req.body?.actor === "Freelancer" ? "Freelancer" : "Client";
  const entry = normalizeApproval(item, state.approvals[item.id]);

  if (actor === "Client") entry.clientApproved = true;
  if (actor === "Freelancer") entry.freelancerApproved = true;
  entry.updatedAt = nowIso();

  state.approvals[item.id] = entry;
  item.score = deriveTrustScore(item, entry);

  await addEvent("trust.approved", item.id, `${item.id} ${actor.toLowerCase()} approval captured`);
  await setState(state);

  res.json({
    loopId: item.id,
    approvals: entry,
    readyToClose: isApprovalReady(entry),
  });
});

router.post("/:id/revoke", async (req, res) => {
  const state = await getStateAsync();
  const item = findLoop(req.params.id, state.loops);
  if (!item) return res.status(404).json({ error: "Loop not found" });

  const actor = req.body?.actor === "Freelancer" ? "Freelancer" : "Client";
  const entry = normalizeApproval(item, state.approvals[item.id]);

  if (actor === "Client") entry.clientApproved = false;
  if (actor === "Freelancer") entry.freelancerApproved = false;
  entry.updatedAt = nowIso();

  state.approvals[item.id] = entry;
  item.score = deriveTrustScore(item, entry);

  await addEvent("trust.approval_revoked", item.id, `${item.id} ${actor.toLowerCase()} approval revoked`);
  await setState(state);

  res.json({
    loopId: item.id,
    approvals: entry,
    readyToClose: isApprovalReady(entry),
  });
});

export default router;

