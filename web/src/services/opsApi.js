import { http } from "./http";
import trustloopApi from "./trustloopApi";

export const opsApi = {
  getMetricsOverview() {
    return http("/api/metrics/overview");
  },

  getMonitoring() {
    return http("/api/monitoring");
  },

  getIndexer() {
    return http("/api/monitoring/indexer");
  },

  getSecurityChecklist() {
    return http("/api/monitoring/security-checklist");
  },

  getOnboarding() {
    return http("/api/onboarding");
  },

  createOnboarding(payload) {
    return trustloopApi.createOnboardingProfile(payload);
  },
};

export default opsApi;
