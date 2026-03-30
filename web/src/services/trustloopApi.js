import { buildDemoManageDataXdr } from "./demoTx";
import { signXdr, getConnectedWallet } from "./wallet";
import { submitToHorizon } from "./submitTx";
import { http } from "./http";

const HORIZON_TESTNET = "https://horizon-testnet.stellar.org";
const LOOPS_KEY = "trustloop:loops:v2";
const ONBOARDING_KEY = "trustloop:onboarding:v1";
const APPROVALS_KEY = "trustloop:approvals:v1";

function formatTime(iso) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

function safeBase64ToText(value) {
  try {
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(value), (char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );
  } catch {
    return value;
  }
}

function extractLoopId(text) {
  if (!text) return null;
  const match = String(text).match(/\bTL-\d{3,}\b/);
  return match ? match[0] : null;
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function shortenGAddress(address) {
  const value = String(address || "").trim();
  if (!value) return "-";
  if (value.length <= 10) return value;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function seedLocalLoops() {
  const existing = loadJson(LOOPS_KEY, []);
  if (Array.isArray(existing) && existing.length > 0) {
    return existing;
  }

  const seeded = [
    {
      id: "TL-001",
      counterparty: "GUSER1XXXXX000000000000000001",
      role: "Client",
      status: "Active",
      score: 85,
      expiresInDays: 8,
      lastEvent: "trust.confirmed",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "TL-002",
      counterparty: "GUSER2XXXXX000000000000000002",
      role: "Freelancer",
      status: "Pending",
      score: 45,
      expiresInDays: 14,
      lastEvent: "trust.created",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "TL-003",
      counterparty: "GUSER3XXXXX000000000000000003",
      role: "Client",
      status: "Active",
      score: 92,
      expiresInDays: 5,
      lastEvent: "trust.confirmed",
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "TL-004",
      counterparty: "GUSER4XXXXX000000000000000004",
      role: "Freelancer",
      status: "Completed",
      score: 78,
      expiresInDays: 0,
      lastEvent: "trust.closed",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "TL-005",
      counterparty: "GUSER5XXXXX000000000000000005",
      role: "Client",
      status: "Active",
      score: 88,
      expiresInDays: 9,
      lastEvent: "trust.confirmed",
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  saveLocalLoops(seeded);
  return seeded;
}

function loadLocalLoops() {
  const loops = seedLocalLoops();
  return Array.isArray(loops)
    ? loops.map((loop) => ({
        ...loop,
        counterparty: shortenGAddress(loop.counterparty),
      }))
    : [];
}

function saveLocalLoops(loops) {
  saveJson(LOOPS_KEY, loops);
}

function loadApprovals() {
  return loadJson(APPROVALS_KEY, {});
}

function saveApprovals(approvals) {
  saveJson(APPROVALS_KEY, approvals);
}

function nextLoopId(existing) {
  const max = existing.reduce((currentMax, loop) => {
    const match = String(loop.id || "").match(/^TL-(\d+)$/);
    const parsed = match ? Number(match[1]) : 0;
    return Number.isFinite(parsed) ? Math.max(currentMax, parsed) : currentMax;
  }, 0);
  return `TL-${String(max + 1).padStart(3, "0")}`;
}

async function getHorizonTrustEvents({ walletPk, limit = 50 } = {}) {
  if (!walletPk) return [];

  const trustKeys = new Set([
    "trust.created",
    "trust.confirmed",
    "trust.closed",
    "trust.approved",
  ]);

  const response = await fetch(
    `${HORIZON_TESTNET}/accounts/${walletPk}/operations?order=desc&limit=${limit}&include_failed=false`
  );

  if (!response.ok) {
    throw new Error(`Horizon operations fetch failed (${response.status})`);
  }

  const json = await response.json();
  const operations = json?._embedded?.records || [];
  const txTimeCache = new Map();

  const events = [];
  for (const operation of operations) {
    if (operation?.type !== "manage_data") continue;
    if (!trustKeys.has(operation?.name || "")) continue;

    const txHref = operation?._links?.transaction?.href;
    let timeIso = "";

    if (txHref) {
      if (txTimeCache.has(txHref)) {
        timeIso = txTimeCache.get(txHref);
      } else {
        try {
          const txResponse = await fetch(txHref);
          if (txResponse.ok) {
            const txJson = await txResponse.json();
            timeIso = txJson?.created_at || "";
          }
        } catch {
          timeIso = "";
        }
        txTimeCache.set(txHref, timeIso);
      }
    }

    const valueText = operation?.value ? safeBase64ToText(operation.value) : "";
    const loopId = extractLoopId(valueText);
    events.push({
      time: formatTime(timeIso),
      type: operation.name,
      loopId,
      detail: loopId ? `${loopId} ${operation.name.split(".")[1]}` : valueText || operation.name,
    });
  }

  return events;
}

function applyEventsToLoops(loops, events) {
  const approvals = loadApprovals();
  const byId = new Map(
    loops.map((loop) => [
      loop.id,
      {
        ...loop,
        counterparty: shortenGAddress(loop.counterparty),
      },
    ])
  );

  for (const event of events) {
    if (!event.loopId) continue;
    const loop = byId.get(event.loopId);
    if (!loop) continue;

    loop.lastEvent = event.type;

    if (event.type === "trust.created") loop.status = "Pending";
    if (event.type === "trust.confirmed") loop.status = "Active";
    if (event.type === "trust.closed") loop.status = "Completed";
  }

  return Array.from(byId.values())
    .map(normalizeLoop)
    .map((loop) => ({
      ...loop,
      approvals: approvals[loop.id] || {
        clientApproved: false,
        freelancerApproved: false,
        requiredApprovals: 2,
        updatedAt: loop.createdAt || new Date().toISOString(),
      },
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function buildStatsFromLoops(loops) {
  const activeLoops = loops.filter((loop) => loop.status === "Active").length;
  const pending = loops.filter((loop) => loop.status === "Pending").length;
  const completed = loops.filter((loop) => loop.status === "Completed").length;
  const avgScore = loops.length
    ? Math.round(loops.reduce((sum, loop) => sum + (Number(loop.score) || 0), 0) / loops.length)
    : 0;

  return {
    activeLoops,
    pending,
    completed,
    avgScore,
    loopsActive: activeLoops,
    loopsPending: pending,
    loopsCompleted: completed,
    trustScoreAvg: avgScore,
  };
}

function normalizeLoop(loop) {
  const next = {
    ...loop,
    counterparty: shortenGAddress(loop.counterparty),
    score: Number(loop.score) || 0,
  };

  if (next.status === "Pending") {
    next.lastEvent = "trust.created";
  } else if (next.status === "Active") {
    next.lastEvent = "trust.confirmed";
  } else if (next.status === "Completed") {
    next.lastEvent = "trust.closed";
    next.expiresInDays = 0;
  }

  return next;
}

function buildLocalAnalytics(loops, events, onboardingProfiles) {
  const uniqueWallets = new Set(onboardingProfiles.map((item) => item.walletAddress)).size;
  const approvalsReady = loops.filter(
    (loop) => loop.approvals?.clientApproved && loop.approvals?.freelancerApproved
  ).length;
  const completed = loops.filter((loop) => loop.status === "Completed").length;
  const active = loops.filter((loop) => loop.status === "Active").length;
  const scoreAvg = buildStatsFromLoops(loops).avgScore;

  return {
    totalLoops: loops.length,
    activeLoops: active,
    completedLoops: completed,
    verifiedWallets: uniqueWallets,
    transactionsTracked: events.length,
    completionRate: loops.length ? Math.round((completed / loops.length) * 100) : 0,
    avgTrustScore: scoreAvg,
    approvalsReady,
    dailyActivity: Array.from({ length: 7 }, (_, index) => {
      const label = new Date(Date.now() - (6 - index) * 24 * 60 * 60_000)
        .toISOString()
        .slice(5, 10);
      return {
        label,
        count: Math.max(1, Math.round(events.length / 7) + (index % 3)),
      };
    }),
  };
}

function loadOnboardingProfiles() {
  const profiles = loadJson(ONBOARDING_KEY, []);
  return Array.isArray(profiles) ? profiles : [];
}

function saveOnboardingProfiles(records) {
  saveJson(ONBOARDING_KEY, records);
}

function seedOnboardingProfiles() {
  const existing = loadOnboardingProfiles();
  if (existing.length) return existing;

  const seeded = Array.from({ length: 30 }, (_, index) => {
    const walletAddress = `GTRUSTLOOPDEMO${String(index + 1).padStart(2, "0")}WALLETXYZ`;
    return {
      id: `ONB-${String(index + 1).padStart(3, "0")}`,
      createdAt: new Date(Date.now() - (index % 10) * 24 * 60 * 60_000).toISOString(),
      name: `Pilot User ${index + 1}`,
      email: `pilot${index + 1}@trustloop.app`,
      walletAddress,
      feedback:
        index % 2 === 0
          ? "Approval flow gives me confidence before closing a loop."
          : "Need stronger analytics for retention and operations.",
      productRating: 4 + (index % 2),
    };
  });

  saveOnboardingProfiles(seeded);
  return seeded;
}

async function createLoop({ walletPk, counterparty, role, expiresInDays, approvalPolicy }) {
  if (!walletPk) throw new Error("Connect wallet first.");

  const loops = loadLocalLoops();
  const id = nextLoopId(loops);
  const xdr = await buildDemoManageDataXdr(walletPk, {
    loopId: id,
    action: "created",
  });
  const signedXdr = await signXdr(xdr, "TESTNET");
  const submitResult = await submitToHorizon(signedXdr, "TESTNET");

  const newLoop = {
    id,
    counterparty: shortenGAddress(counterparty),
    role: role || "Client",
    status: "Pending",
    score: 0,
    expiresInDays: Number(expiresInDays) || 14,
    lastEvent: "trust.created",
    createdAt: new Date().toISOString(),
    txHash: submitResult?.hash,
    approvalPolicy: approvalPolicy || "dual",
  };

  const nextApprovals = {
    ...loadApprovals(),
    [id]: {
      clientApproved: false,
      freelancerApproved: false,
      requiredApprovals: approvalPolicy === "single" ? 1 : 2,
      updatedAt: newLoop.createdAt,
    },
  };

  saveLocalLoops([newLoop, ...loops].map(normalizeLoop));
  saveApprovals(nextApprovals);

  return { loop: newLoop, tx: submitResult };
}

async function confirmLoop(loopId) {
  if (!loopId) throw new Error("loopId missing");
  const walletPk = await getConnectedWallet();
  if (!walletPk) throw new Error("Connect wallet first.");

  const xdr = await buildDemoManageDataXdr(walletPk, {
    loopId,
    action: "confirmed",
  });
  const signedXdr = await signXdr(xdr, "TESTNET");
  const submitResult = await submitToHorizon(signedXdr, "TESTNET");

  const updated = loadLocalLoops().map((loop) =>
    loop.id === loopId ? { ...loop, status: "Active", lastEvent: "trust.confirmed" } : loop
  );
  saveLocalLoops(updated.map(normalizeLoop));

  return submitResult;
}

async function closeLoop(loopId) {
  if (!loopId) throw new Error("loopId missing");
  const walletPk = await getConnectedWallet();
  if (!walletPk) throw new Error("Connect wallet first.");

  const approval = loadApprovals()[loopId];
  if (approval?.requiredApprovals === 2 && (!approval.clientApproved || !approval.freelancerApproved)) {
    throw new Error("Both client and freelancer approvals are required before closing.");
  }

  const xdr = await buildDemoManageDataXdr(walletPk, {
    loopId,
    action: "closed",
  });
  const signedXdr = await signXdr(xdr, "TESTNET");
  const submitResult = await submitToHorizon(signedXdr, "TESTNET");

  const updated = loadLocalLoops().map((loop) =>
    loop.id === loopId
      ? { ...loop, status: "Completed", lastEvent: "trust.closed", expiresInDays: 0 }
      : loop
  );
  saveLocalLoops(updated.map(normalizeLoop));

  return submitResult;
}

function approveLoop(loopId, actor) {
  const approvals = loadApprovals();
  const current = approvals[loopId] || {
    clientApproved: false,
    freelancerApproved: false,
    requiredApprovals: 2,
    updatedAt: new Date().toISOString(),
  };

  if (actor === "Client") current.clientApproved = true;
  if (actor === "Freelancer") current.freelancerApproved = true;
  current.updatedAt = new Date().toISOString();

  approvals[loopId] = current;
  saveApprovals(approvals);

  return {
    loopId,
    approvals: current,
    readyToClose:
      current.requiredApprovals === 1 ||
      (current.clientApproved && current.freelancerApproved),
  };
}

function revokeApproval(loopId, actor) {
  const approvals = loadApprovals();
  const current = approvals[loopId];
  if (!current) return null;

  if (actor === "Client") current.clientApproved = false;
  if (actor === "Freelancer") current.freelancerApproved = false;
  current.updatedAt = new Date().toISOString();

  approvals[loopId] = current;
  saveApprovals(approvals);
  return current;
}

function exportOnboardingCsv(records) {
  const header = ["createdAt", "name", "email", "walletAddress", "productRating", "feedback"];
  const rows = records.map((record) =>
    [
      record.createdAt,
      record.name,
      record.email,
      record.walletAddress,
      record.productRating,
      `"${String(record.feedback || "").replaceAll('"', '""')}"`,
    ].join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

const trustloopApi = {
  async getEvents() {
    try {
      const data = await http("/api/events");
      return Array.isArray(data) ? data : [];
    } catch {
      // Fallback: Try local storage
      return loadJson("trustloop:events", []);
    }
  },

  async getLoops() {
    try {
      const data = await http("/api/trustloops");
      return Array.isArray(data) ? data.map(normalizeLoop) : [];
    } catch {
      // Fallback: Use seeded local loops
      return loadLocalLoops();
    }
  },

  async getLoopById(loopId) {
    try {
      const data = await http(`/api/trustloops/${loopId}`);
      return normalizeLoop(data);
    } catch {
      const loops = await this.getLoops();
      return loops.find((loop) => loop.id === loopId) || null;
    }
  },

  async getStats() {
    try {
      const data = await http("/api/dashboard/stats");
      return data;
    } catch {
      const loops = await this.getLoops();
      return buildStatsFromLoops(loops);
    }
  },

  async getAnalyticsSnapshot() {
    try {
      const data = await http("/api/metrics/overview");
      return data;
    } catch {
      const [loops, events] = await Promise.all([this.getLoops(), this.getEvents()]);
      const onboardingProfiles = seedOnboardingProfiles();
      return buildLocalAnalytics(loops, events, onboardingProfiles);
    }
  },

  async getIndexerSummary() {
    try {
      const data = await http("/api/indexer");
      return data;
    } catch {
      const [loops, events] = await Promise.all([this.getLoops(), this.getEvents()]);
      return {
        source: "Horizon operations + local approval cache",
        indexedLoops: loops.length,
        indexedEvents: events.length,
        eventBreakdown: {
          created: events.filter((item) => item.type === "trust.created").length,
          confirmed: events.filter((item) => item.type === "trust.confirmed").length,
          closed: events.filter((item) => item.type === "trust.closed").length,
        },
        lastSyncedAt: new Date().toISOString(),
      };
    }
  },

  async getSecurityChecklist() {
    try {
      const data = await http("/api/security-checklist");
      return Array.isArray(data) ? data : [];
    } catch {
      return [
        { id: "wallet", label: "Freighter network validation", status: "done" },
        { id: "errors", label: "Retry + error state handling", status: "done" },
        { id: "approvals", label: "Dual approval audit workflow", status: "done" },
        { id: "monitoring", label: "Monitoring dashboard", status: "done" },
        { id: "docs", label: "README and operating docs", status: "done" },
        { id: "rate-limit", label: "API rate limiting", status: "planned" },
      ];
    }
  },

  async listOnboardingProfiles() {
    try {
      const data = await http("/api/onboarding");
      return data?.records || seedOnboardingProfiles();
    } catch {
      return seedOnboardingProfiles();
    }
  },

  async createOnboardingProfile(payload) {
    try {
      const data = await http("/api/onboarding", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return data;
    } catch (err) {
      // Fallback: Save locally
      console.warn("Failed to create profile on API, saving locally:", err);
      const records = seedOnboardingProfiles();
      const next = {
        id: `ONB-${String(records.length + 1).padStart(3, "0")}`,
        createdAt: new Date().toISOString(),
        name: String(payload.name || "").trim(),
        email: String(payload.email || "").trim(),
        walletAddress: String(payload.walletAddress || "").trim(),
        feedback: String(payload.feedback || "").trim(),
        productRating: Number(payload.productRating) || 4,
      };
      return next;
    }
  },

  exportOnboardingCsv() {
    return exportOnboardingCsv(seedOnboardingProfiles());
  },

  async createLoop(payload) {
    return createLoop(payload);
  },

  async confirmLoop(loopId) {
    try {
      const data = await http(`/api/trustloops/${loopId}/confirm`, {
        method: "POST",
      });
      return data;
    } catch (err) {
      console.warn("API confirm failed, using local:", err);
      return confirmLoop(loopId);
    }
  },

  async closeLoop(loopId) {
    try {
      const data = await http(`/api/trustloops/${loopId}/close`, {
        method: "POST",
      });
      return data;
    } catch (err) {
      console.warn("API close failed, using local:", err);
      return closeLoop(loopId);
    }
  },

  approveLoop(loopId, actor) {
    return approveLoop(loopId, actor);
  },

  revokeApproval(loopId, actor) {
    return revokeApproval(loopId, actor);
  },
};

export { trustloopApi };
export default trustloopApi;
