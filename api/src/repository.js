import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizeLoop, normalizeApproval, deriveTrustScore } from "./logic/trustScore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.resolve(__dirname, "../data/store.json");

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function createSeedState() {
  return {
    loops: [],
    events: [],
    onboardingProfiles: [],
    approvals: {},
    meta: {
      lastIndexerSyncAt: new Date().toISOString(),
      lastCleanupAt: new Date().toISOString(),
    },
    auth: {
      sessions: [],
      challenges: [],
      sponsorshipIntents: [],
      rateLimits: [],
    },
  };
}

function readState() {
  ensureParentDir(storePath);
  if (!fs.existsSync(storePath)) {
    const seed = createSeedState();
    fs.writeFileSync(storePath, JSON.stringify(seed, null, 2));
    return seed;
  }

  try {
    const raw = JSON.parse(fs.readFileSync(storePath, "utf8"));
    return normalizeState(raw);
  } catch {
    const seed = createSeedState();
    fs.writeFileSync(storePath, JSON.stringify(seed, null, 2));
    return seed;
  }
}

function writeState(state) {
  ensureParentDir(storePath);
  fs.writeFileSync(storePath, JSON.stringify(state, null, 2));
}

function nextLoopId(loops) {
  const max = loops.reduce((currentMax, loop) => {
    const match = String(loop.id || "").match(/^TL-(\d+)$/);
    const value = match ? Number(match[1]) : 0;
    return Number.isFinite(value) ? Math.max(currentMax, value) : currentMax;
  }, 0);
  return `TL-${String(max + 1).padStart(3, "0")}`;
}

function loopStatusForIndex(index) {
  const pattern = ["Active", "Completed", "Pending"];
  return pattern[index % pattern.length];
}

function ensureLoopEvent(events, type, loopId, detail, time) {
  const exists = events.some((event) => event.type === type && event.loopId === loopId);
  if (!exists) {
    events.push({
      id: `EV-${loopId}-${type}`,
      time,
      type,
      loopId,
      detail,
    });
  }
}

function ensureOnboardingLoops(state) {
  const walletSet = new Set(
    state.loops
      .map((loop) => String(loop.linkedWalletAddress || loop.counterparty || "").trim())
      .filter(Boolean),
  );

  for (const [index, profile] of state.onboardingProfiles.entries()) {
    const walletAddress = String(profile.walletAddress || "").trim();
    if (!walletAddress || walletSet.has(walletAddress)) {
      continue;
    }

    const status = loopStatusForIndex(index);
    const createdAt = profile.createdAt || new Date().toISOString();
    const loop = normalizeLoop({
      id: nextLoopId(state.loops),
      counterparty: walletAddress,
      role: index % 2 === 0 ? "Client" : "Freelancer",
      status,
      score: 0,
      expiresInDays: status === "Completed" ? 0 : 7 + (index % 21),
      lastEvent:
        status === "Completed"
          ? "trust.closed"
          : status === "Active"
          ? "trust.confirmed"
          : "trust.created",
      createdAt,
      approvalPolicy: "dual",
      initiatorWallet: walletAddress,
      linkedOnboardingId: profile.id,
      linkedWalletAddress: walletAddress,
    });

    state.loops.push(loop);
    state.approvals[loop.id] = normalizeApproval(loop, {
      clientApproved: status === "Completed",
      freelancerApproved: status === "Completed",
      requiredApprovals: 2,
      updatedAt: createdAt,
    });

    ensureLoopEvent(state.events, "trust.created", loop.id, `${loop.id} created for ${profile.name}`, createdAt);
    if (status === "Active" || status === "Completed") {
      ensureLoopEvent(state.events, "trust.confirmed", loop.id, `${loop.id} confirmed`, createdAt);
    }
    if (status === "Completed") {
      ensureLoopEvent(state.events, "trust.closed", loop.id, `${loop.id} closed`, createdAt);
    }

    walletSet.add(walletAddress);
  }
}

export function normalizeState(input) {
  const base = createSeedState();
  const state = {
    ...base,
    ...input,
    loops: Array.isArray(input?.loops) ? input.loops.map(normalizeLoop) : [],
    events: Array.isArray(input?.events) ? input.events : [],
    onboardingProfiles: Array.isArray(input?.onboardingProfiles) ? input.onboardingProfiles : [],
    approvals: input?.approvals && typeof input.approvals === "object" ? input.approvals : {},
    meta: { ...base.meta, ...(input?.meta || {}) },
    auth: {
      ...base.auth,
      ...(input?.auth || {}),
      sessions: Array.isArray(input?.auth?.sessions) ? input.auth.sessions : [],
      challenges: Array.isArray(input?.auth?.challenges) ? input.auth.challenges : [],
      sponsorshipIntents: Array.isArray(input?.auth?.sponsorshipIntents) ? input.auth.sponsorshipIntents : [],
      rateLimits: Array.isArray(input?.auth?.rateLimits) ? input.auth.rateLimits : [],
    },
  };

  ensureOnboardingLoops(state);

  state.loops = state.loops.map((loop) => {
    const approval = normalizeApproval(loop, state.approvals[loop.id]);
    state.approvals[loop.id] = approval;
    return {
      ...loop,
      score: deriveTrustScore(loop, approval),
    };
  });

  return state;
}

class Repository {
  constructor() {
    this.state = readState();
    writeState(this.state);
  }

  getState() {
    return this.state;
  }

  save() {
    this.state = normalizeState(this.state);
    writeState(this.state);
    return this.state;
  }

  cleanup(now = Date.now()) {
    this.state.auth.challenges = this.state.auth.challenges.filter((item) => new Date(item.expiresAt).getTime() > now);
    this.state.auth.sessions = this.state.auth.sessions.filter((item) => new Date(item.expiresAt).getTime() > now);
    this.state.auth.sponsorshipIntents = this.state.auth.sponsorshipIntents.filter(
      (item) => item.status === "consumed" || new Date(item.expiresAt).getTime() > now,
    );
    this.state.meta.lastCleanupAt = new Date(now).toISOString();
  }
}

export const repository = new Repository();
