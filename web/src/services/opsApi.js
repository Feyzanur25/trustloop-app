import { http } from "./http";
import trustloopApi from "./trustloopApi";

async function withFallback(request, fallback) {
  try {
    return await request();
  } catch {
    return await fallback();
  }
}

export const opsApi = {
  getMetricsOverview() {
    return withFallback(
      () => http("/api/metrics/overview"),
      () => trustloopApi.getAnalyticsSnapshot()
    );
  },

  getMonitoring() {
    return withFallback(
      () => http("/api/monitoring"),
      async () => ({
        status: "degraded",
        uptimeSeconds: 0,
        totalRequests: 0,
        totalErrors: 0,
        avgLatencyMs: 0,
        errorRate: 0,
        services: [
          { name: "API", status: "degraded", detail: "Fallback mode using local analytics" },
          { name: "Indexer", status: "up", detail: "Local event indexing available" },
          { name: "Wallet demo", status: "up", detail: "Freighter integration enabled" },
        ],
        alerts: [
          {
            severity: "medium",
            title: "Backend offline fallback",
            detail: "Metrics are currently generated from local browser state.",
          },
        ],
      })
    );
  },

  getIndexer() {
    return withFallback(
      () => http("/api/indexer"),
      () => trustloopApi.getIndexerSummary()
    );
  },

  getSecurityChecklist() {
    return withFallback(
      () => http("/api/security-checklist"),
      async () => trustloopApi.getSecurityChecklist()
    );
  },

  getOnboarding() {
    return withFallback(
      () => http("/api/onboarding"),
      async () => {
        const records = trustloopApi.listOnboardingProfiles();
        return { count: records.length, records };
      }
    );
  },

  createOnboarding(payload) {
    return withFallback(
      () =>
        http("/api/onboarding", {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      async () => trustloopApi.createOnboardingProfile(payload)
    );
  },
};

export default opsApi;
