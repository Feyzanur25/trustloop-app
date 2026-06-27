export function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function normalizeLoop(loop) {
  if (!loop || typeof loop !== 'object') return null;
  return {
    ...loop,
    id: String(loop.id || "").trim(),
    counterparty: String(loop.counterparty || "").trim(),
    role: String(loop.role || "Client").trim(),
    status: String(loop.status || "Pending").trim(),
    score: Number(loop.score) || 0,
    expiresInDays: Number(loop.expiresInDays) || 14,
    lastEvent: String(loop.lastEvent || "").trim() || null,
    createdAt: String(loop.createdAt || new Date().toISOString()).trim(),
    approvalPolicy: String(loop.approvalPolicy || "dual").trim(),
  };
}

export function normalizeApproval(loop, approvals) {
  const policy = String(loop?.approvalPolicy || "dual").trim();
  const required = policy === "single" ? 1 : 2;
  const base = {
    clientApproved: false,
    freelancerApproved: false,
    requiredApprovals: required,
    updatedAt: new Date().toISOString(),
  };

  if (!approvals || typeof approvals !== 'object') return base;

  return {
    clientApproved: Boolean(approvals.clientApproved),
    freelancerApproved: Boolean(approvals.freelancerApproved),
    requiredApprovals: Number(approvals.requiredApprovals) || required,
    updatedAt: String(approvals.updatedAt || base.updatedAt).trim(),
  };
}

export function displayLoop(loop) {
  if (!loop) return null;
  return {
    ...loop,
    score: Number(loop.score) || 0,
    expiresInDays: Number(loop.expiresInDays) || 0,
  };
}

export function deriveTrustScore(loop, approvals) {
  if (!loop) return 0;
  const statusScore = loop.status === "Completed" ? 100 : loop.status === "Active" ? 75 : loop.status === "Pending" ? 40 : 0;
  const approvalScore = approvals ? (approvals.clientApproved ? 10 : 0) + (approvals.freelancerApproved ? 10 : 0) : 0;
  return Math.min(100, Math.max(0, statusScore + approvalScore + Number(loop.score || 0) / 10));
}

export function isApprovalReady(approvals) {
  if (!approvals || typeof approvals !== 'object') return false;
  const required = Number(approvals.requiredApprovals) || 2;
  let count = 0;
  if (approvals.clientApproved) count++;
  if (approvals.freelancerApproved) count++;
  return count >= required;
}

export function shouldReplaceLegacyOnboarding(existing) {
  if (!Array.isArray(existing)) return true;
  if (existing.length === 0) return false;
  const first = existing[0];
  return !first.walletAddress || !first.productRating;
}

export function smallHash(text) {
  const str = String(text || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).slice(0, 8);
}

export function approvalProgress(approvals) {
  if (!approvals || typeof approvals !== 'object') return 0;
  const required = Number(approvals.requiredApprovals) || 2;
  let count = 0;
  if (approvals.clientApproved) count++;
  if (approvals.freelancerApproved) count++;
  return Math.round((count / required) * 100);
}

export function shortenGAddress(address) {
  const str = String(address || "");
  if (str.length <= 12) return str;
  return `${str.slice(0, 6)}...${str.slice(-4)}`;
}