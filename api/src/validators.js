import { StrKey } from "stellar-sdk";
import { badRequest } from "./errors.js";

export function isNonEmptyString(value, maxLength = 255) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

export function assertObject(value, message = "Request body must be an object") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw badRequest(message);
  }
  return value;
}

export function assertWalletAddress(value, fieldName = "walletAddress") {
  const trimmed = String(value || "").trim();
  if (!trimmed || !StrKey.isValidEd25519PublicKey(trimmed)) {
    throw badRequest(`${fieldName} must be a valid Stellar public key.`);
  }
  return trimmed;
}

export function assertEmail(value) {
  const email = String(value || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw badRequest("email must be a valid email address.");
  }
  return email.toLowerCase();
}

export function assertEnum(value, allowed, fieldName) {
  if (!allowed.includes(value)) {
    throw badRequest(`${fieldName} must be one of: ${allowed.join(", ")}.`);
  }
  return value;
}

export function assertInteger(value, fieldName, { min, max, fallback } = {}) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed)) {
    throw badRequest(`${fieldName} must be an integer.`);
  }
  if (Number.isFinite(min) && parsed < min) {
    throw badRequest(`${fieldName} must be >= ${min}.`);
  }
  if (Number.isFinite(max) && parsed > max) {
    throw badRequest(`${fieldName} must be <= ${max}.`);
  }
  return parsed;
}

export function sanitizeText(value, maxLength = 500) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function parseLoopInput(payload) {
  const body = assertObject(payload);
  return {
    counterparty: assertWalletAddress(body.counterparty, "counterparty"),
    role: assertEnum(body.role === "Freelancer" ? "Freelancer" : "Client", ["Client", "Freelancer"], "role"),
    expiresInDays: assertInteger(body.expiresInDays, "expiresInDays", { min: 1, max: 90, fallback: 14 }),
    approvalPolicy: assertEnum(body.approvalPolicy === "single" ? "single" : "dual", ["single", "dual"], "approvalPolicy"),
  };
}

export function parseActorInput(payload) {
  const body = assertObject(payload);
  return {
    actor: assertEnum(body.actor, ["Client", "Freelancer"], "actor"),
  };
}

export function parseOnboardingInput(payload) {
  const body = assertObject(payload);
  const name = sanitizeText(body.name, 80);
  if (!isNonEmptyString(name, 80)) {
    throw badRequest("name is required.");
  }

  return {
    name,
    email: assertEmail(body.email),
    walletAddress: assertWalletAddress(body.walletAddress),
    feedback: sanitizeText(body.feedback, 800),
    productRating: assertInteger(body.productRating, "productRating", { min: 1, max: 5, fallback: 5 }),
  };
}
