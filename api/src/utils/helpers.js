import fs from "fs";
import path from "path";

export function nowIso() {
  return new Date().toISOString();
}


export function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60_000).toISOString();
}

export function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, item) => sum + item, 0) / values.length);
}

export function shortWallet(address) {
  const value = String(address || "").trim();
  if (!value) return "UNKNOWN";
  if (value.length <= 12) return value;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function smallHash(input) {
  return Array.from(String(input || "")).reduce(
    (sum, char, index) => (sum + char.charCodeAt(0) * (index + 1)) % 17,
    0
  );
}

export function approvalProgress(approval = {}) {
  const required = approval.requiredApprovals === 1 ? 1 : 2;
  const completed =
    Number(Boolean(approval.clientApproved)) + Number(Boolean(approval.freelancerApproved));
  return Math.min(1, completed / required);
}

export function isApprovalReady(approval = {}) {
  if (approval.requiredApprovals === 1) {
    return Boolean(approval.clientApproved || approval.freelancerApproved);
  }
  return Boolean(approval.clientApproved && approval.freelancerApproved);
}

export function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function getDataPaths() {
  // ESM doesn't provide __dirname/__filename. Reconstruct from import.meta.url.
  const filePath = new URL(import.meta.url);
  const moduleDir = path.dirname(filePath.pathname);

  // filePath.pathname in Windows may start with /C:/..., so normalize to a real path.
  const normalizedModuleDir = moduleDir.replace(/^\//, "");

  // helpers.js -> api/src/utils/helpers.js; persisted store is api/data/store.json
  const DATA_DIR = path.resolve(normalizedModuleDir, "../../data");

  const DATA_FILE = path.join(DATA_DIR, "store.json");
  return { DATA_DIR, DATA_FILE };
}

