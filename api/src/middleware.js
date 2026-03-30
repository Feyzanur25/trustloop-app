// Custom error class
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }
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

module.exports = { AppError, errorHandler, requestLogger, asyncHandler };
