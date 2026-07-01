import { http } from "./http";
import { authenticateWallet, signXdr, getConnectedWallet } from "./wallet";

async function signAndCommit(prepared) {
  const signedXdr = await signXdr(prepared.xdr);
  const result = await http("/api/trustloops/commit", {
    method: "POST",
    body: JSON.stringify({
      intentId: prepared.intentId,
      signedXdr,
    }),
  });
  return result;
}

async function ensureAuth() {
  await authenticateWallet();
}

const trustloopApi = {
  async getNetwork() {
    return http("/api/network");
  },

  async getLoops() {
    return http("/api/trustloops");
  },

  async getLoopById(loopId) {
    return http(`/api/trustloops/${loopId}`);
  },

  async getEvents() {
    return http("/api/events");
  },

  async getStats() {
    return http("/api/metrics/dashboard/stats");
  },

  async getAnalyticsSnapshot() {
    return http("/api/metrics/overview");
  },

  async getIndexerSummary() {
    return http("/api/monitoring/indexer");
  },

  async getSecurityChecklist() {
    return http("/api/monitoring/security-checklist");
  },

  async listOnboardingProfiles() {
    const response = await http("/api/onboarding");
    return Array.isArray(response?.records) ? response.records : [];
  },

  async createOnboardingProfile(payload) {
    return http("/api/onboarding", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async createLoop(payload) {
    await ensureAuth();
    const prepared = await http("/api/trustloops/prepare", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const result = await signAndCommit(prepared);
    return result.loop;
  },

  async confirmLoop(loopId) {
    await ensureAuth();
    const prepared = await http(`/api/trustloops/${loopId}/prepare-action`, {
      method: "POST",
      body: JSON.stringify({ action: "confirm" }),
    });
    const result = await signAndCommit(prepared);
    return result.loop;
  },

  async closeLoop(loopId) {
    await ensureAuth();
    const prepared = await http(`/api/trustloops/${loopId}/prepare-action`, {
      method: "POST",
      body: JSON.stringify({ action: "close" }),
    });
    const result = await signAndCommit(prepared);
    return result.loop;
  },

  async approveLoop(loopId, actor) {
    await ensureAuth();
    const prepared = await http(`/api/trustloops/${loopId}/prepare-action`, {
      method: "POST",
      body: JSON.stringify({ action: "approve", actor }),
    });
    return signAndCommit(prepared);
  },

  async revokeApproval(loopId, actor) {
    await ensureAuth();
    const prepared = await http(`/api/trustloops/${loopId}/prepare-action`, {
      method: "POST",
      body: JSON.stringify({ action: "revoke", actor }),
    });
    return signAndCommit(prepared);
  },

  async getWalletStatus() {
    const walletAddress = await getConnectedWallet().catch(() => null);
    return { walletAddress };
  },
};

export { trustloopApi };
export default trustloopApi;
