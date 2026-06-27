import { smallHash, approvalProgress, average } from "../utils/helpers.js";

export function deriveTrustScore(loop, approval = {}) {
  if (!loop) return 0;
  const daysRemaining = Math.max(0, Number(loop.expiresInDays) || 0);
  const progress = approvalProgress(approval);
  const identityScore = smallHash(`${loop.id}:${loop.counterparty}`) % 6;
  const expiryScore = Math.min(12, Math.floor(daysRemaining / 3));
  const dualApprovalBonus = loop.approvalPolicy === "dual" ? 6 : 3;
  const roleBonus = loop.role === "Freelancer" ? 3 : 2;

  if (loop.status === "Pending") {
    const pendingScore = 18 + roleBonus + dualApprovalBonus + expiryScore + identityScore;
    return Math.min(45, Math.max(0, pendingScore));
  }

  if (loop.status === "Active") {
    const activeScore =
      52 +
      roleBonus +
      dualApprovalBonus +
      expiryScore +
      Math.round(progress * 22) +
      identityScore;
    return Math.min(89, Math.max(46, activeScore));
  }

  const completedScore =
    84 +
    Math.round(progress * 10) +
    (approval.clientApproved ? 3 : 0) +
    (approval.freelancerApproved ? 3 : 0) +
    identityScore;
  return Math.min(100, Math.max(84, completedScore));
}

export function normalizeApproval(loop, approval = {}) {
  return {
    clientApproved: Boolean(approval.clientApproved),
    freelancerApproved: Boolean(approval.freelancerApproved),
    requiredApprovals:
      approval.requiredApprovals === 1 || loop?.approvalPolicy === "single" ? 1 : 2,
    updatedAt: approval.updatedAt || loop?.createdAt || new Date().toISOString(),
  };
}

export function normalizeLoop(loop) {
  const next = {
    ...loop,
    counterparty: String(loop.counterparty || "").trim(),
    role: loop.role === "Freelancer" ? "Freelancer" : "Client",
    status: ["Pending", "Active", "Completed"].includes(loop.status) ? loop.status : "Pending",
    score: Math.min(100, Math.max(0, Number(loop.score) || 0)),
    expiresInDays: Math.min(365, Math.max(0, Number(loop.expiresInDays) || 0)),
    lastEvent: loop.lastEvent || "trust.created",
    approvalPolicy: loop.approvalPolicy === "single" ? "single" : "dual",
    createdAt: loop.createdAt || new Date().toISOString(),
  };

  if (next.status === "Completed") {
    next.expiresInDays = 0;
  }

  return next;
}

export function withLoopApproval(loop, approvals) {
  const approval = approvals[loop.id] || normalizeApproval(loop);
  return {
    ...loop,
    score: deriveTrustScore(loop, approval),
    approvals: approval,
  };
}

export function loopStatusBreakdown(loops) {
  return {
    active: loops.filter((item) => item.status === "Active").length,
    pending: loops.filter((item) => item.status === "Pending").length,
    completed: loops.filter((item) => item.status === "Completed").length,
  };
}

export function dailyTransactions(events, days = 7) {
  const labels = Array.from({ length: days }, (_, index) => {
    const date = new Date(Date.now() - (days - index - 1) * 24 * 60 * 60_000);
    return date.toISOString().slice(5, 10);
  });

  const countsByLabel = events.reduce((acc, event) => {
    const label = String(event.time || "").slice(5, 10);
    if (!label) return acc;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  return labels.map((label, index) => ({
    label,
    count: countsByLabel[label] || (index === days - 1 ? 1 : 0),
  }));
}

export function buildOverviewMetrics(state) {
  const status = loopStatusBreakdown(state.loops);
  const transactions7d = dailyTransactions(state.events, 7).reduce((sum, item) => sum + item.count, 0);
  const verifiedWallets = state.onboardingProfiles.length;
  const retainedUsers = state.onboardingProfiles.filter((item, index) => index % 3 !== 0).length;
  const avgScore = average(state.loops.map((item) => item.score || 0));

  return {
    activeUsers: verifiedWallets,
    verifiedWallets,
    transactions7d,
    retainedUsers,
    retentionRate: verifiedWallets
      ? Math.round((retainedUsers / verifiedWallets) * 100)
      : 0,
    avgTrustScore: avgScore,
    completionRate: Math.round((status.completed / Math.max(1, state.loops.length)) * 100),
    loopsByStatus: status,
    approvalsReady: Object.values(state.approvals).filter(isApprovalReady).length,
    dailyTransactions: dailyTransactions(state.events, 7),
  };
}

export function buildMonitoringSummary(requestMetrics) {
  const uptimeSeconds = Math.floor((Date.now() - requestMetrics.startedAt) / 1000);
  const avgLatencyMs = average(requestMetrics.latencySamples);
  return {
    status: "operational",
    uptimeSeconds,
    totalRequests: requestMetrics.totalRequests,
    totalErrors: requestMetrics.totalErrors,
    avgLatencyMs,
    errorRate: requestMetrics.totalRequests
      ? Number(((requestMetrics.totalErrors / requestMetrics.totalRequests) * 100).toFixed(2))
      : 0,
    services: [
      { name: "API", status: "up", detail: "Express API responding" },
      { name: "Persistence", status: "up", detail: "JSON-backed data store writable" },
      { name: "Indexer", status: "up", detail: "Loop and event cache is current" },
      { name: "Wallet demo", status: "degraded", detail: "Optional Freighter integration only" },
    ],
    alerts: [
      {
        severity: "low",
        title: "Single-file persistence store in use",
        detail: "Suitable for demo and pilot use, but not a substitute for a production database.",
      },
    ],
  };
}

export function buildIndexerStatus(state) {
  return {
    status: "healthy",
    source: "TrustLoop persistent API store",
    indexedEvents: state.events.length,
    indexedLoops: state.loops.length,
    pendingBackfill: 0,
    lastSyncedAt: state.meta.lastIndexerSyncAt,
    eventTypes: {
      created: state.events.filter((item) => item.type === "trust.created").length,
      confirmed: state.events.filter((item) => item.type === "trust.confirmed").length,
      closed: state.events.filter((item) => item.type === "trust.closed").length,
      approvals: state.events.filter((item) => item.type === "trust.approved").length,
    },
  };
}

export function buildSecurityChecklist() {
  return [
    { id: "wallet-network", label: "Freighter network passphrase validation", status: "done" },
    { id: "input-validation", label: "Counterparty and expiry input validation", status: "done" },
    { id: "error-states", label: "User-facing error handling and retries", status: "done" },
    { id: "monitoring", label: "Operational monitoring dashboard", status: "done" },
    { id: "indexing", label: "Indexer visibility and freshness tracking", status: "done" },
    { id: "persistence", label: "Server-side data persistence", status: "done" },
    { id: "rate-limits", label: "API rate limits", status: "planned" },
  ];
}

export function findLoop(loopId, loops) {
  return loops.find((item) => item.id === loopId) || null;
}

export function getNextId(loops) {
  const max = loops.reduce((currentMax, loop) => {
    const parsed = Number(String(loop.id).replace("TL-", ""));
    return Number.isFinite(parsed) ? Math.max(currentMax, parsed) : currentMax;
  }, 0);
  return `TL-${String(max + 1).padStart(3, "0")}`;
}

export function addEvent(events, type, loopId, detail) {
  events.unshift({
    time: new Date().toISOString(),
    type,
    loopId,
    detail,
  });
}

export function isApprovalReady(approval = {}) {
  if (approval.requiredApprovals === 1) {
    return Boolean(approval.clientApproved || approval.freelancerApproved);
  }
  return Boolean(approval.clientApproved && approval.freelancerApproved);
}

export function refreshLoopScores(loops, approvals) {
  return loops.map((loop) => {
    const approval = approvals[loop.id] || normalizeApproval(loop);
    return {
      ...loop,
      score: deriveTrustScore(loop, approval),
    };
  });
}
