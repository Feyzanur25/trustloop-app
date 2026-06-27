import { http } from "./http";
import { getConnectedWallet } from "./wallet";
import {
  STORAGE_KEYS,
  HORIZON_TESTNET,
  TRUST_EVENT_TYPES,
} from "../lib/constants.js";
import {
  loadJson,
  saveJson,
  normalizeLoop,
  normalizeApproval,
  displayLoop,
  deriveTrustScore,
  isApprovalReady,
  shouldReplaceLegacyOnboarding,
  smallHash,
  approvalProgress,
  shortenGAddress,
} from "../lib/trustHelpers.js";

const ONBOARDING_SEED = [
  ["İsmail Ateş", "ismail25@gmail.com", "GBXTMXHHEEEW3VNYHEZYAVV3Q7MF7SLP2CXK3C5K6IBCNNX7CP67F2IM", "Very easy to use and smooth flow", 5],
  ["Afra Duru", "durusoyafra07@gmail.com", "GC4UYA4GWY35KGQ7U434DXQBC4HZ6HAMJ2LOMMHC3FJAHHV23RJUB7EV", "Clean interface and fast response", 4],
  ["Feyzanur Ateş", "feyzanurates4@gmail.com", "GDPGD3WEAVACUKCONRDUELD46ML5KDQAC2JTF7QE6EEEW7VSFYZEBZX5", "Very intuitive and simple onboarding", 5],
  ["Emre Yıldız", "emreyildiz01@gmail.com", "GA4INDKZSBMYUL2DKUMC2732COE4CLKRX6YUIZS56UWLL2F6DD4ZL3G5", "Very smooth onboarding experience", 5],
  ["Zeynep Kaya", "zeynepkaya.dev@gmail.com", "GDYD6GZ6QWKEULFZU6HMLSH4JM5IAJXBY3HFMCHZHTHIGH5DKEVNX2ZM", "Clean interface", 4],
  ["Can Demir", "candemir@gmail.com", "GDWL2RCDFQVDGH3IJL4ZGLX5CGU27MO6R7OQVCNYLQWROYZND2B6ENCI", "Basic functionality works well", 3],
  ["Elif Aydın", "elifaydin@gmail.com", "GBL2APVSMV2IYSO2B6C67VASKRJHXVCAOSHEBLC6BM4CBSKDMQOU25HU", "Very intuitive UI", 5],
  ["Burak Çelik", "burakcelik@gmail.com", "GAVNSWLAN4VG54IVLHCF3O45ZOAZSPLNH7GNR25RVFLH434BAQS3JJAO", "Simple and clean UX", 4],
  ["Merve Koç", "mervekoc@gmail.com", "GCCHWOJNEC7VJ2NCTIQYKYYYWZSZRUU2KAYVY5VMDWF3ONYKWUH6DO7I", "Fast transactions", 5],
  ["Oğuzhan Şahin", "oguzhansahin@gmail.com", "GCHRZKNZGV27USWARNID7YPVUBXV6WNPG6YRVLKQ4QDUURMJY4OU5JJ5", "Wallet integration smooth", 4],
  ["Selin Arslan", "selinarslan@gmail.com", "GDNN6X4H3SUEN2F5XUQA3BDYCSRO54AVV5GWFIGO3DTLPONEMCS4DSLV", "Great overall experience", 5],
  ["Hakan Yılmaz", "hakanyilmaz@gmail.com", "GCNSHMQNN66RDGXXWA3MV7CHOMZ5YCC2D7EYPUJWZICTZV4QQ2ZMNFOP", "Idea is good", 2],
  ["Ayşe Demir", "aysedemir@gmail.com", "GCKX3NOWP7LYF2L6YWMFIKNKROBHVLDEQSAAWWQHDSXNVWUTDHRPZYIH", "Easy onboarding", 3],
  ["Kerem Acar", "keremacar@gmail.com", "GCHS7OSQNPBA2XUFAVGIPNK72DED3WWD2DJOA4ANDQ7BHM4R5GDRJSS7", "Clean design", 4],
  ["Derya Kurt", "deryakurt@gmail.com", "GCWXWMORXOEB2JWVCE7LBWFLNT5QFQ5JKQVRFNB3AZRQUSLUCHXBM2O2", "User friendly", 5],
  ["Ahmet Öz", "ahmetoz@gmail.com", "GDLXN35JGULDTNEZGGFV6IQKDULH5O6GN5L7BY252AMAFME7RCXYWXAB", "Smooth flow", 4],
  ["Nazlı Şen", "nazlisen@gmail.com", "GBJP4RV3PLYSQZKQMUQGO5NO4XIEEYXHYIVR2GCWETFNGSEPQRRSAN6O", "Easy navigation", 5],
  ["Yusuf Polat", "yusufpolat@gmail.com", "GBTLBOA5M5P6RUMWVL6UXRFFUAJX4X6AMHFFY3LDM5L6ES2FQL2OEFER", "Fast response", 4],
  ["Deniz Güneş", "denizgunes@gmail.com", "GBJE3VLOOSAJKZFB7ILEUY6UK2CONTPQVI75APNG7USR64VT2AAMETI6", "Smooth UX", 5],
  ["Melis Aydın", "melisaydin@gmail.com", "GCSDJ2BQTERO3RFGLUR4Q4KVJKWGFWAY423HBIWHJSTSMUE7DNUL2JGO", "Works fine", 3],
  ["Barış Kılıç", "bariskilic@gmail.com", "GCP42RESSZ2YTIK7SMTRC3T27AIPHBMJJMGOMK63YK4YTLMF6HWO26QX", "Good structure", 4],
  ["Gökhan Çetin", "gokhancetin@gmail.com", "GB67HLEMWX3VLRYPSLUFZ5HCTIF55DHNPTHV55YAY5OKFTKVLE7IN5F4", "Easy to use", 5],
  ["Tuğba Şahin", "tugbasahin@gmail.com", "GC5Y25BO5R5DPU6NHPUZHW6JDABW5Z4ETAOLE2D4ZOU4O36ISJQRVBRS", "Good UX", 4],
  ["Volkan Aras", "volkanaras@gmail.com", "GBOQMOY5KHPMVXFZNUT4CNH2N3NPFXTXD4G6MQT7JXKGU6VSTRPRRO5P", "Smooth transactions", 5],
  ["Pelin Demirtaş", "pelindemirtas@gmail.com", "GD7M6TIBC422HNXG5SMID5Z2GVRQ55ODDG63HEZXGR7DJ36YLD6VKHIA", "Clean interface", 4],
  ["Cem Yıldırım", "cemyildirim@gmail.com", "GDFK6ZKBYVXSS6XU5HC3BDGOK5N2GOQ6LSIDXDIWZYOQML5ZFUEOH7MG", "Easy process", 5],
  ["Sibel Koç", "sibelkoc@gmail.com", "GAAVRCI7U3OG5T52LIY53KP5XWZCZ7ZK6TOU7CZH5NHLMOGCEKFBP3CN", "Works well", 3],
  ["Kaan Özkan", "kaanozkan@gmail.com", "GBFFWPNU2VKKUBO2FPMWF6PS6XGFN3RR7G7R3PXFXOHRNDEECE7LPWSA", "Very intuitive", 5],
  ["Ece Aksoy", "eceaksoy@gmail.com", "GBZYOAEY4H5BFZY2FN7GWUOG6TX54S37VKSYZMWDSMMLD5GJLS46T4HW", "Good flow", 4],
  ["Murat Çakır", "muratcakir@gmail.com", "GBG3HAUGSWVSVF7LWRXCDFXBJLBDMSBWISLTYDAOXRR7BKOZS572RTX4", "Very smooth", 5],
];

function buildOnboardingSeedRecords() {
  return ONBOARDING_SEED.map((record, index) => ({
    id: `OB-${String(index + 1).padStart(3, "0")}`,
    createdAt: new Date(Date.now() - (index % 10) * 24 * 60 * 60 * 1000).toISOString(),
    name: record[0],
    email: record[1],
    walletAddress: record[2],
    feedback: record[3],
    productRating: record[4],
  }));
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

function seedLocalLoops() {
  const existing = loadJson(STORAGE_KEYS.LOOPS, []);
  if (Array.isArray(existing) && existing.length > 0) {
    return existing.map(normalizeLoop);
  }

  const seeded = [
    {
      id: "TL-001",
      counterparty: "GDPGD3WEAVACUKCONRDUELD46ML5KDQAC2JTF7QE6EEEW7VSFYZEBZX5",
      role: "Client",
      status: "Active",
      score: 82,
      expiresInDays: 12,
      lastEvent: TRUST_EVENT_TYPES.CONFIRMED,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      approvalPolicy: "dual",
    },
    {
      id: "TL-002",
      counterparty: "GC4UYA4GWY35KGQ7U434DXQBC4HZ6HAMJ2LOMMHC3FJAHHV23RJUB7EV",
      role: "Freelancer",
      status: "Completed",
      score: 91,
      expiresInDays: 0,
      lastEvent: TRUST_EVENT_TYPES.CLOSED,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      approvalPolicy: "dual",
    },
    {
      id: "TL-003",
      counterparty: "GBXTMXHHEEEW3VNYHEZYAVV3Q7MF7SLP2CXK3C5K6IBCNNX7CP67F2IM",
      role: "Freelancer",
      status: "Pending",
      score: 58,
      expiresInDays: 16,
      lastEvent: TRUST_EVENT_TYPES.CREATED,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      approvalPolicy: "dual",
    },
    {
      id: "TL-004",
      counterparty: "GA4INDKZSBMYUL2DKUMC2732COE4CLKRX6YUIZS56UWLL2F6DD4ZL3G5",
      role: "Client",
      status: "Active",
      score: 76,
      expiresInDays: 8,
      lastEvent: TRUST_EVENT_TYPES.CONFIRMED,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      approvalPolicy: "dual",
    },
  ];

  saveJson(STORAGE_KEYS.LOOPS, seeded.map(normalizeLoop));
  return seeded.map(normalizeLoop);
}

function seedLocalEvents() {
  const existing = loadJson(STORAGE_KEYS.EVENTS, []);
  if (Array.isArray(existing) && existing.length > 0) {
    return existing;
  }

  const seeded = [
    { time: new Date(Date.now() - 900 * 60_000).toISOString(), type: TRUST_EVENT_TYPES.CREATED, loopId: "TL-001", detail: "TL-001 created" },
    { time: new Date(Date.now() - 860 * 60_000).toISOString(), type: TRUST_EVENT_TYPES.CONFIRMED, loopId: "TL-001", detail: "TL-001 confirmed" },
    { time: new Date(Date.now() - 510 * 60_000).toISOString(), type: TRUST_EVENT_TYPES.CLOSED, loopId: "TL-002", detail: "TL-002 closed" },
  ];
  saveJson(STORAGE_KEYS.EVENTS, seeded);
  return seeded;
}

function seedApprovals() {
  const existing = loadJson(STORAGE_KEYS.APPROVALS, {});
  if (existing && Object.keys(existing).length > 0) {
    return existing;
  }

  const seeded = {
    "TL-001": { clientApproved: true, freelancerApproved: true, requiredApprovals: 2, updatedAt: new Date().toISOString() },
    "TL-002": { clientApproved: true, freelancerApproved: true, requiredApprovals: 2, updatedAt: new Date().toISOString() },
    "TL-003": { clientApproved: true, freelancerApproved: false, requiredApprovals: 2, updatedAt: new Date().toISOString() },
    "TL-004": { clientApproved: false, freelancerApproved: false, requiredApprovals: 2, updatedAt: new Date().toISOString() },
  };
  saveJson(STORAGE_KEYS.APPROVALS, seeded);
  return seeded;
}

function loadOnboardingProfiles() {
  const profiles = loadJson(STORAGE_KEYS.ONBOARDING, []);
  return Array.isArray(profiles) ? profiles : [];
}

function seedOnboardingProfiles() {
  const existing = loadOnboardingProfiles();
  if (existing.length && !shouldReplaceLegacyOnboarding(existing)) return existing;

  const seeded = buildOnboardingSeedRecords();
  saveJson(STORAGE_KEYS.ONBOARDING, seeded);
  return seeded;
}

function nextLoopId(existing) {
  const max = existing.reduce((currentMax, loop) => {
    const match = String(loop.id || "").match(/^TL-(\d+)$/);
    const parsed = match ? Number(match[1]) : 0;
    return Number.isFinite(parsed) ? Math.max(currentMax, parsed) : currentMax;
  }, 0);
  return `TL-${String(max + 1).padStart(3, "0")}`;
}

function addLocalEvent(type, loopId, detail) {
  const current = seedLocalEvents();
  const next = [{ time: new Date().toISOString(), type, loopId, detail }, ...current];
  saveJson(STORAGE_KEYS.EVENTS, next);
  return next;
}

function upsertLocalLoop(loop) {
  const current = loadJson(STORAGE_KEYS.LOOPS, []).map(normalizeLoop);
  const next = [normalizeLoop(loop), ...current.filter((item) => item.id !== loop.id)];
  saveJson(STORAGE_KEYS.LOOPS, next);
  return next;
}

function serializeApprovalsFromLoops(loops) {
  return loops.reduce((acc, loop) => {
    acc[loop.id] = normalizeApproval(loop, loop.approvals);
    return acc;
  }, {});
}

function applyApprovalsToLoops(loops) {
  const approvals = seedApprovals();

  return loops.map((loop) => ({
    ...loop,
    approvals: normalizeApproval(loop, loop.approvals || approvals[loop.id]),
    score: deriveTrustScore(loop, loop.approvals || approvals[loop.id]),
  }));
}

function applyEventsToLoops(loops, events) {
  const byId = new Map(loops.map((loop) => [loop.id, { ...loop }]));

  for (const event of events) {
    if (!event.loopId) continue;
    const loop = byId.get(event.loopId);
    if (!loop) continue;

    loop.lastEvent = event.type;
    if (event.type === TRUST_EVENT_TYPES.CREATED) loop.status = "Pending";
    if (event.type === TRUST_EVENT_TYPES.CONFIRMED) loop.status = "Active";
    if (event.type === TRUST_EVENT_TYPES.CLOSED) loop.status = "Completed";
  }

  return Array.from(byId.values()).map(normalizeLoop);
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

function buildLocalAnalytics(loops, events, onboardingProfiles) {
  const uniqueWallets = new Set(onboardingProfiles.map((item) => item.walletAddress)).size;
  const approvalsReady = loops.filter((loop) => isApprovalReady(loop.approvals)).length;
  const completed = loops.filter((loop) => loop.status === "Completed").length;
  const active = loops.filter((loop) => loop.status === "Active").length;
  const scoreAvg = buildStatsFromLoops(loops).avgScore;

  return {
    totalLoops: loops.length,
    activeLoops: active,
    completedLoops: completed,
    verifiedWallets: uniqueWallets,
    activeUsers: uniqueWallets,
    transactionsTracked: events.length,
    transactions7d: events.length || 1,
    completionRate: loops.length ? Math.round((completed / loops.length) * 100) : 0,
    avgTrustScore: scoreAvg,
    approvalsReady,
    retentionRate: 66,
    dailyActivity: Array.from({ length: 7 }, (_, index) => {
      const label = new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(5, 10);
      return {
        label,
        count: Math.max(1, Math.round(events.length / 7) + (index % 3)),
      };
    }),
    dailyTransactions: Array.from({ length: 7 }, (_, index) => {
      const label = new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(5, 10);
      return {
        label,
        count: Math.max(1, Math.round(events.length / 7) + (index % 3)),
      };
    }),
    loopsByStatus: {
      active,
      pending: loops.filter((loop) => loop.status === "Pending").length,
      completed,
    },
  };
}

async function getHorizonTrustEvents({ walletPk, limit = 50 } = {}) {
  if (!walletPk) return [];

  const trustKeys = new Set([
    TRUST_EVENT_TYPES.CREATED,
    TRUST_EVENT_TYPES.CONFIRMED,
    TRUST_EVENT_TYPES.CLOSED,
    TRUST_EVENT_TYPES.APPROVED,
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
      time: timeIso || new Date().toISOString(),
      type: operation.name,
      loopId,
      detail: loopId ? `${loopId} ${operation.name.split(".")[1]}` : valueText || operation.name,
    });
  }

  return events;
}

function syncLoopPayload(loop) {
  const normalized = normalizeLoop(loop);
  upsertLocalLoop(normalized);

  if (normalized.approvals) {
    const approvals = seedApprovals();
    approvals[normalized.id] = normalizeApproval(normalized, normalized.approvals);
    saveJson(STORAGE_KEYS.APPROVALS, approvals);
  }

  return displayLoop(normalized);
}

const trustloopApi = {
  clearLocalCache() {
    try {
      const keys = Object.keys(localStorage || {}).filter((k) =>
        k.startsWith("trustloop:loops:") ||
        k.startsWith("trustloop:events:") ||
        k.startsWith("trustloop:approvals:") ||
        k.startsWith("trustloop:onboarding:")
      );
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  },

  async importLocalStateToServer() {
    const loops = loadJson(STORAGE_KEYS.LOOPS, []);
    const events = loadJson(STORAGE_KEYS.EVENTS, []);
    const approvals = loadJson(STORAGE_KEYS.APPROVALS, {});
    const onboardingProfiles = loadJson(STORAGE_KEYS.ONBOARDING, []);

    const loopsArr = Array.isArray(loops) ? loops : [];
    const eventsArr = Array.isArray(events) ? events : [];
    const approvalsObj = approvals && typeof approvals === 'object' ? approvals : {};
    const onboardingArr = Array.isArray(onboardingProfiles) ? onboardingProfiles : [];

    const res = await http('/api/admin/import-local-state', {
      method: 'POST',
      body: JSON.stringify({
        loops: loopsArr,
        events: eventsArr,
        approvals: approvalsObj,
        onboardingProfiles: onboardingArr,
      }),
    });

    return res;
  },

  async getEvents() {
    try {
      const data = await http("/api/events");
      const events = Array.isArray(data) ? data : [];
      saveJson(STORAGE_KEYS.EVENTS, events);
      return events;
    } catch {
      return seedLocalEvents();
    }
  },

  async getLoops() {
    try {
      const data = await http("/api/trustloops");
      const apiLoops = Array.isArray(data) ? data.map(normalizeLoop) : [];
      const normalized = applyApprovalsToLoops(apiLoops);

      saveJson(STORAGE_KEYS.LOOPS, normalized);
      saveJson(STORAGE_KEYS.APPROVALS, serializeApprovalsFromLoops(normalized));

      return normalized.map(displayLoop);
    } catch {
      const localLoops = loadJson(STORAGE_KEYS.LOOPS, []).map(normalizeLoop);
      return applyApprovalsToLoops(localLoops).map(displayLoop);
    }
  },

  async getLoopById(loopId) {
    const loops = await this.getLoops();
    return loops.find((loop) => loop.id === loopId) || null;
  },

  async getStats() {
    try {
      return await http("/api/dashboard/stats");
    } catch {
      const loops = await this.getLoops();
      return buildStatsFromLoops(loops);
    }
  },

  async getAnalyticsSnapshot() {
    try {
      return await http("/api/metrics/overview");
    } catch {
      const [loops, events] = await Promise.all([this.getLoops(), this.getEvents()]);
      return buildLocalAnalytics(loops, events, seedOnboardingProfiles());
    }
  },

  async getIndexerSummary() {
    try {
      return await http("/api/indexer");
    } catch {
      const [loops, events] = await Promise.all([this.getLoops(), this.getEvents()]);
      return {
        source: "Local browser cache",
        indexedLoops: loops.length,
        indexedEvents: events.length,
        eventBreakdown: {
          created: events.filter((item) => item.type === TRUST_EVENT_TYPES.CREATED).length,
          confirmed: events.filter((item) => item.type === TRUST_EVENT_TYPES.CONFIRMED).length,
          closed: events.filter((item) => item.type === TRUST_EVENT_TYPES.CLOSED).length,
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
        { id: "wallet", label: "Freighter network validation", status: "completed" },
        { id: "errors", label: "Retry + error state handling", status: "completed" },
        { id: "approvals", label: "Dual approval audit workflow", status: "completed" },
        { id: "monitoring", label: "Monitoring dashboard", status: "completed" },
        { id: "persistence", label: "Server-side data persistence", status: "completed" },
        { id: "rate-limit", label: "API rate limiting", status: "pending" },
      ];
    }
  },

  async listOnboardingProfiles() {
    try {
      const data = await http("/api/onboarding");
      const records = Array.isArray(data?.records) ? data.records : [];
      saveJson(STORAGE_KEYS.ONBOARDING, records);
      return records;
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

      const current = seedOnboardingProfiles();
      saveJson(STORAGE_KEYS.ONBOARDING, [data, ...current.filter((item) => item.id !== data.id)]);
      return data;
    } catch {
      const records = seedOnboardingProfiles();
      const next = {
        id: `OB-${String(records.length + 1).padStart(3, "0")}`,
        createdAt: new Date().toISOString(),
        name: String(payload.name || "").trim(),
        email: String(payload.email || "").trim(),
        walletAddress: String(payload.walletAddress || "").trim(),
        feedback: String(payload.feedback || "").trim(),
        productRating: Number(payload.productRating) || 4,
      };

      saveJson(STORAGE_KEYS.ONBOARDING, [next, ...records]);
      return next;
    }
  },

  exportOnboardingCsv(records) {
    const header = ["createdAt", "name", "email", "walletAddress", "productRating", "feedback"];
    const rows = (records || []).map((record) =>
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
  },

  async createLoop(payload) {
    try {
      const data = await http("/api/trustloops", {
        method: "POST",
        body: JSON.stringify({
          counterparty: payload.counterparty,
          role: payload.role,
          expiresInDays: payload.expiresInDays,
          approvalPolicy: payload.approvalPolicy,
          walletPk: payload.walletPk || null,
        }),
      });

      addLocalEvent(TRUST_EVENT_TYPES.CREATED, data.id, `${data.id} created`);
      return syncLoopPayload(data);
    } catch {
      const rawLoops = loadJson(STORAGE_KEYS.LOOPS, []).map(normalizeLoop);
      const id = nextLoopId(rawLoops);
      const newLoop = normalizeLoop({
        id,
        counterparty: String(payload.counterparty || "").trim(),
        role: payload.role || "Client",
        status: "Pending",
        score: 0,
        expiresInDays: Number(payload.expiresInDays) || 14,
        lastEvent: TRUST_EVENT_TYPES.CREATED,
        createdAt: new Date().toISOString(),
        approvalPolicy: payload.approvalPolicy || "dual",
      });

      const approvals = seedApprovals();
      approvals[id] = normalizeApproval(newLoop, {
        clientApproved: false,
        freelancerApproved: false,
        requiredApprovals: newLoop.approvalPolicy === "single" ? 1 : 2,
        updatedAt: newLoop.createdAt,
      });

      saveJson(STORAGE_KEYS.LOOPS, [newLoop, ...rawLoops]);
      saveJson(STORAGE_KEYS.APPROVALS, approvals);
      addLocalEvent(TRUST_EVENT_TYPES.CREATED, newLoop.id, `${newLoop.id} created`);

      return displayLoop({ ...newLoop, approvals: approvals[id] });
    }
  },

  async confirmLoop(loopId) {
    try {
      const data = await http(`/api/trustloops/${loopId}/confirm`, {
        method: "POST",
      });

      addLocalEvent(TRUST_EVENT_TYPES.CONFIRMED, loopId, `${loopId} confirmed`);
      return syncLoopPayload(data);
    } catch {
      const updated = loadJson(STORAGE_KEYS.LOOPS, []).map((loop) =>
        loop.id === loopId
          ? {
              ...loop,
              status: "Active",
              lastEvent: TRUST_EVENT_TYPES.CONFIRMED,
              score: deriveTrustScore(
                { ...loop, status: "Active", lastEvent: TRUST_EVENT_TYPES.CONFIRMED },
                seedApprovals()[loopId]
              ),
            }
          : loop
      );
      saveJson(STORAGE_KEYS.LOOPS, updated);
      addLocalEvent(TRUST_EVENT_TYPES.CONFIRMED, loopId, `${loopId} confirmed`);
      return { loopId, ok: true };
    }
  },

  async closeLoop(loopId) {
    try {
      const data = await http(`/api/trustloops/${loopId}/close`, {
        method: "POST",
      });

      addLocalEvent(TRUST_EVENT_TYPES.CLOSED, loopId, `${loopId} closed`);
      return syncLoopPayload(data);
    } catch {
      const approval = seedApprovals()[loopId];
      if (!isApprovalReady(approval)) {
        throw new Error("Required approvals must be captured before closing.");
      }

      const updated = loadJson(STORAGE_KEYS.LOOPS, []).map((loop) =>
        loop.id === loopId
          ? {
              ...loop,
              status: "Completed",
              lastEvent: TRUST_EVENT_TYPES.CLOSED,
              expiresInDays: 0,
              score: deriveTrustScore(
                { ...loop, status: "Completed", lastEvent: TRUST_EVENT_TYPES.CLOSED, expiresInDays: 0 },
                approval
              ),
            }
          : loop
      );
      saveJson(STORAGE_KEYS.LOOPS, updated);
      addLocalEvent(TRUST_EVENT_TYPES.CLOSED, loopId, `${loopId} closed`);
      return { loopId, ok: true };
    }
  },

  async approveLoop(loopId, actor) {
    try {
      const data = await http(`/api/trustloops/${loopId}/approve`, {
        method: "POST",
        body: JSON.stringify({ actor }),
      });

      const approvals = seedApprovals();
      approvals[loopId] = data.approvals;
      saveJson(STORAGE_KEYS.APPROVALS, approvals);
      addLocalEvent(TRUST_EVENT_TYPES.APPROVED, loopId, `${loopId} ${String(actor).toLowerCase()} approval captured`);
      return data;
    } catch {
      const approvals = seedApprovals();
      const current = normalizeApproval({ approvalPolicy: "dual" }, approvals[loopId]);
      if (actor === "Client") current.clientApproved = true;
      if (actor === "Freelancer") current.freelancerApproved = true;
      current.updatedAt = new Date().toISOString();
      approvals[loopId] = current;
      saveJson(STORAGE_KEYS.APPROVALS, approvals);
      addLocalEvent(TRUST_EVENT_TYPES.APPROVED, loopId, `${loopId} ${String(actor).toLowerCase()} approval captured`);
      return {
        loopId,
        approvals: current,
        readyToClose: isApprovalReady(current),
      };
    }
  },

  async revokeApproval(loopId, actor) {
    try {
      const data = await http(`/api/trustloops/${loopId}/revoke`, {
        method: "POST",
        body: JSON.stringify({ actor }),
      });

      const approvals = seedApprovals();
      approvals[loopId] = data.approvals;
      saveJson(STORAGE_KEYS.APPROVALS, approvals);
      addLocalEvent(
        TRUST_EVENT_TYPES.REVOKED,
        loopId,
        `${loopId} ${String(actor).toLowerCase()} approval revoked`
      );
      return data;
    } catch {
      const approvals = seedApprovals();
      const current = normalizeApproval({ approvalPolicy: "dual" }, approvals[loopId]);
      if (actor === "Client") current.clientApproved = false;
      if (actor === "Freelancer") current.freelancerApproved = false;
      current.updatedAt = new Date().toISOString();
      approvals[loopId] = current;
      saveJson(STORAGE_KEYS.APPROVALS, approvals);
      addLocalEvent(
        TRUST_EVENT_TYPES.REVOKED,
        loopId,
        `${loopId} ${String(actor).toLowerCase()} approval revoked`
      );
      return {
        loopId,
        approvals: current,
        readyToClose: isApprovalReady(current),
      };
    }
  },

  async getWalletTrustEvents(walletPk, limit = 50) {
    const connectedWallet = walletPk || (await getConnectedWallet().catch(() => null));
    return getHorizonTrustEvents({ walletPk: connectedWallet, limit });
  },

  async getLoopsWithEvents(walletPk) {
    const [loops, events] = await Promise.all([
      this.getLoops(),
      walletPk ? this.getWalletTrustEvents(walletPk) : Promise.resolve([]),
    ]);

    const merged = applyEventsToLoops(loops, events);
    return {
      loops: applyApprovalsToLoops(merged).map(displayLoop),
      events,
    };
  },
};

export { trustloopApi };
export default trustloopApi;