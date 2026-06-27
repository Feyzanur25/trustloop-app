const requestMetrics = {
  startedAt: Date.now(),
  totalRequests: 0,
  totalErrors: 0,
  latencySamples: [],
};

export function recordRequest(statusCode) {
  requestMetrics.totalRequests += 1;
  if (statusCode >= 400) {
    requestMetrics.totalErrors += 1;
  }
}

export function recordLatency(latencyMs) {
  requestMetrics.latencySamples.push(latencyMs);
  if (requestMetrics.latencySamples.length > 120) {
    requestMetrics.latencySamples.shift();
  }
}

export function getMetrics() {
  return { ...requestMetrics };
}

export function resetMetrics() {
  requestMetrics.startedAt = Date.now();
  requestMetrics.totalRequests = 0;
  requestMetrics.totalErrors = 0;
  requestMetrics.latencySamples = [];
}