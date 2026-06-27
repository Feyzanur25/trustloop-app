// Custom error class
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }
}

function createRateLimiter({ windowMs = 60_000, max = 120 } = {}) {
  const bucket = new Map();

  return (req, res, next) => {
    const key =
      req.ip ||
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown";
    const now = Date.now();
    const entry = bucket.get(key);

    if (!entry || entry.resetAt <= now) {
      bucket.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({
        error: "Too many requests. Please retry shortly.",
        statusCode: 429,
        timestamp: new Date().toISOString(),
      });
    }

    entry.count += 1;
    bucket.set(key, entry);
    return next();
  };
}

// Error handling middleware
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`, {
    method: req.method,
    path: req.path,
    statusCode: err.statusCode || 500,
    timestamp: new Date().toISOString(),
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
      timestamp: err.timestamp,
    });
  }



  // Generic error
  res.status(500).json({
    error: "Internal server error",
    statusCode: 500,
    timestamp: new Date().toISOString(),
  });
}

// Request logging middleware
function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
}

// Async error wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export { AppError, errorHandler, requestLogger, asyncHandler, createRateLimiter };
