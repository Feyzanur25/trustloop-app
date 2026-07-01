import { config } from "./config.js";
import { AppError, unauthorized } from "./errors.js";
import { repository } from "./repository.js";
import { resolveSession } from "./stellar.js";

export function applySecurityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  if (config.isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
}

export function applyCors(req, res, next) {
  const origin = req.headers.origin;
  if (origin && config.allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "false");
  }

  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (origin && !config.allowedOrigins.includes(origin)) {
    next(new AppError("Origin not allowed.", 403));
    return;
  }

  next();
}

export function requestLogger(req, res, next) {
  const startedAt = Date.now();
  res.on("finish", () => {
    const elapsedMs = Date.now() - startedAt;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${elapsedMs}ms`);
  });
  next();
}

export function jsonErrorHandler(err, _req, res, _next) {
  const statusCode = err?.statusCode || 500;
  res.status(statusCode).json({
    error: err?.message || "Internal server error",
    statusCode,
    details: err?.details || null,
    timestamp: new Date().toISOString(),
  });
}

export function rateLimiter(req, res, next) {
  const now = Date.now();
  const key = `${req.ip}:${req.path}`;
  const state = repository.getState();
  const windowStart = now - config.rateLimitWindowMs;

  state.auth.rateLimits = state.auth.rateLimits.filter((item) => item.seenAt >= windowStart);
  const hits = state.auth.rateLimits.filter((item) => item.key === key).length;

  if (hits >= config.rateLimitMaxRequests) {
    next(new AppError("Too many requests. Please retry later.", 429));
    return;
  }

  state.auth.rateLimits.push({ key, seenAt: now });
  repository.save();
  next();
}

export function requireAuth(req, _res, next) {
  try {
    const header = String(req.headers.authorization || "");
    if (!header.startsWith("Bearer ")) {
      throw unauthorized();
    }
    const token = header.slice("Bearer ".length).trim();
    req.auth = resolveSession(token);
    next();
  } catch (error) {
    next(error);
  }
}
