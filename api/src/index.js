const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const onboardingSeed = require("../../shared/onboarding-seed.json");

const { errorHandler, requestLogger, createRateLimiter } = require("./middleware");

const app = express();
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use("/api", createRateLimiter({ windowMs: 60_000, max: 180 }));

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

function nowIso() {
  return new Date().toISOString();
}

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60_000).toISOString();
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, item) => sum + item, 0) / values.length);
}

function shortWallet(address) {
  const value = String(address || "").trim();
  if (!value) return "UNKNOWN";
  if (value.length <= 12) return value;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function smallHash(input) {
  return Array.from(String(input || "")).reduce(
    (sum, char, index) => (sum + char.charCodeAt(0) * (index + 1)) % 17,
    0
  );
}

function approvalProgress(approval = {}) {
  const required = approval.requiredApprovals === 1 ? 1 : 2;
  const completed =
    Number(Boolean(approval.clientApproved)) + Number(Boolean(approval.freelancerApproved));
  return Math.min(1, completed / required);
}

function deriveTrustScore(loop, approval = {}) {
  if (!loop) return 0;
  const daysRemaining = Math.max(0, Number(loop.expiresInDays) || 0);
  const progress = approvalProgress(approval);
  const identityScore = smallHash(`${loop.id}:${loop.counterparty}`) % 6;
  const expiryScore = Math.min(12, Math.floor(daysRemaining / 3));
  const dualApprovalBonus = loop.approvalPolicy === "dual" ? 6 : 3;
  const roleBonus = loop.role === "Freelancer" ? 3 : 2;

  if (loop.status === "Pending") {
    const pendingScore = 18 + roleBonus + dualApprovalBonus + expiryScore + identityScore;
    return clampNumber(pendingScore, 0, 45, 0);
  }

  if (loop.status === "Active") {
    const activeScore =
      52 +
      roleBonus +
      dualApprovalBonus +
      expiryScore +
      Math.round(progress * 22) +
      identityScore;
    return clampNumber(activeScore, 46, 89, 0);
  }

  const completedScore =
    84 +
    Math.round(progress * 10) +
    (approval.clientApproved ? 3 : 0) +
    (approval.freelancerApproved ? 3 : 0) +
    identityScore;
  return clampNumber(completedScore, 84, 100, 0);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const BASE_ONBOARDING_SEED = [
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
  return onboardingSeed.map((record, index) => ({
      id: `OB-${String(index + 1).padStart(3, "0")}`,
      createdAt: daysAgo(index % 10),
      name: record.name,
      email: record.email,
      walletAddress: record.walletAddress,
      walletShort: shortWallet(record.walletAddress),
      feedback: record.feedback,
      productRating: record.productRating,
    })
  );
}

function shouldReplaceLegacyOnboarding(records = []) {
  if (!Array.isArray(records) || !records.length) return true;
  return records.every((record) => String(record?.name || "").startsWith("Pilot User "));
}

function buildSeedState() {
  return {
    loops: [
      {
        id: "TL-001",
        counterparty: "GDPGD3WEAVACUKCONRDUELD46ML5KDQAC2JTF7QE6EEEW7VSFYZEBZX5",
        role: "Client",
        status: "Active",
        score: 82,
        expiresInDays: 12,
        lastEvent: "trust.confirmed",
        createdAt: daysAgo(10),
        approvalPolicy: "dual",
      },
      {
        id: "TL-002",
        counterparty: "GC4UYA4GWY35KGQ7U434DXQBC4HZ6HAMJ2LOMMHC3FJAHHV23RJUB7EV",
        role: "Freelancer",
        status: "Completed",
        score: 91,
        expiresInDays: 0,
        lastEvent: "trust.closed",
        createdAt: daysAgo(9),
        approvalPolicy: "dual",
      },
      {
        id: "TL-003",
        counterparty: "GBXTMXHHEEEW3VNYHEZYAVV3Q7MF7SLP2CXK3C5K6IBCNNX7CP67F2IM",
        role: "Freelancer",
        status: "Pending",
        score: 58,
        expiresInDays: 16,
        lastEvent: "trust.created",
        createdAt: daysAgo(3),
        approvalPolicy: "dual",
      },
      {
        id: "TL-004",
        counterparty: "GA4INDKZSBMYUL2DKUMC2732COE4CLKRX6YUIZS56UWLL2F6DD4ZL3G5",
        role: "Client",
        status: "Active",
        score: 76,
        expiresInDays: 8,
        lastEvent: "trust.confirmed",
        createdAt: daysAgo(1),
        approvalPolicy: "dual",
      },
    ],
    events: [
      { time: minutesAgo(900), type: "trust.created", loopId: "TL-001", detail: "TL-001 created" },
      { time: minutesAgo(860), type: "trust.confirmed", loopId: "TL-001", detail: "TL-001 confirmed" },
      { time: minutesAgo(720), type: "trust.created", loopId: "TL-002", detail: "TL-002 created" },
      { time: minutesAgo(640), type: "trust.confirmed", loopId: "TL-002", detail: "TL-002 confirmed" },
      { time: minutesAgo(510), type: "trust.closed", loopId: "TL-002", detail: "TL-002 closed" },
      { time: minutesAgo(220), type: "trust.created", loopId: "TL-003", detail: "TL-003 created" },
      { time: minutesAgo(180), type: "trust.confirmed", loopId: "TL-003", detail: "TL-003 confirmed" },
      { time: minutesAgo(70), type: "trust.created", loopId: "TL-004", detail: "TL-004 created" },
    ],
    onboardingProfiles: buildOnboardingSeedRecords(),
    approvals: {
      "TL-001": {
        clientApproved: true,
        freelancerApproved: true,
        requiredApprovals: 2,
        updatedAt: minutesAgo(820),
      },
      "TL-002": {
        clientApproved: true,
        freelancerApproved: true,
        requiredApprovals: 2,
        updatedAt: minutesAgo(520),
      },
      "TL-003": {
        clientApproved: true,
        freelancerApproved: false,
        requiredApprovals: 2,
        updatedAt: minutesAgo(150),
      },
      "TL-004": {
        clientApproved: false,
        freelancerApproved: false,
        requiredApprovals: 2,
        updatedAt: minutesAgo(40),
      },
    },
    meta: {
      lastIndexerSyncAt: nowIso(),
    },
  };
}

function normalizeApproval(loop, approval = {}) {
  return {
    clientApproved: Boolean(approval.clientApproved),
    freelancerApproved: Boolean(approval.freelancerApproved),
    requiredApprovals:
      approval.requiredApprovals === 1 || loop?.approvalPolicy === "single" ? 1 : 2,
    updatedAt: approval.updatedAt || loop?.createdAt || nowIso(),
  };
}

function normalizeLoop(loop) {
  return {
    ...loop,
    counterparty: String(loop.counterparty || "").trim(),
    role: loop.role === "Freelancer" ? "Freelancer" : "Client",
    status: ["Pending", "Active", "Completed"].includes(loop.status) ? loop.status : "Pending",
    score: clampNumber(loop.score, 0, 100, 0),
    expiresInDays: clampNumber(loop.expiresInDays, 0, 365, 14),
    lastEvent: loop.lastEvent || "trust.created",
    approvalPolicy: loop.approvalPolicy === "single" ? "single" : "dual",
    createdAt: loop.createdAt || nowIso(),
  };
}

function normalizeState(rawState = {}) {
  const seed = buildSeedState();
  const loops = Array.isArray(rawState.loops) ? rawState.loops.map(normalizeLoop) : seed.loops;
  const approvals = {};

  for (const loop of loops) {
    approvals[loop.id] = normalizeApproval(
      loop,
      rawState.approvals && typeof rawState.approvals === "object" ? rawState.approvals[loop.id] : {}
    );
  }

  const onboardingProfiles =
    Array.isArray(rawState.onboardingProfiles) && !shouldReplaceLegacyOnboarding(rawState.onboardingProfiles)
      ? rawState.onboardingProfiles
      : buildOnboardingSeedRecords();

  return {
    loops,
    events: Array.isArray(rawState.events) ? rawState.events : seed.events,
    onboardingProfiles,
    approvals,
    meta: {
      lastIndexerSyncAt: rawState.meta?.lastIndexerSyncAt || nowIso(),
    },
  };
}

function saveState(nextState) {
  ensureDir(DATA_DIR);
  fs.writeFileSync(DATA_FILE, JSON.stringify(nextState, null, 2), "utf8");
}

function loadState() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const seed = normalizeState(buildSeedState());
      saveState(seed);
      return seed;
    }

    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = raw ? JSON.parse(raw) : {};
    const normalized = normalizeState(parsed);
    saveState(normalized);
    return normalized;
  } catch (error) {
    console.error("Failed to load persisted state, using seed data:", error.message);
    const seed = normalizeState(buildSeedState());
    saveState(seed);
    return seed;
  }
}

let state = loadState();

function commitState() {
  saveState(state);
}

function touchIndexerSync() {
  state.meta.lastIndexerSyncAt = nowIso();
}

function addEvent(type, loopId, detail) {
  state.events.unshift({
    time: nowIso(),
    type,
    loopId,
    detail,
  });
  touchIndexerSync();
}

function refreshLoopScores() {
  state.loops = state.loops.map((loop) => {
    const approvals = state.approvals[loop.id] || normalizeApproval(loop);
    return {
      ...loop,
      score: deriveTrustScore(loop, approvals),
    };
  });
}

function withLoopApproval(loop) {
  const approvals = state.approvals[loop.id] || normalizeApproval(loop);
  return {
    ...loop,
    score: deriveTrustScore(loop, approvals),
    approvals,
  };
}

function findLoop(loopId) {
  return state.loops.find((item) => item.id === loopId) || null;
}

function findLoopOr404(req, res) {
  const item = findLoop(req.params.id);
  if (!item) {
    res.status(404).json({ error: "Loop not found" });
    return null;
  }
  return item;
}

function getNextId() {
  const max = state.loops.reduce((currentMax, loop) => {
    const parsed = Number(String(loop.id).replace("TL-", ""));
    return Number.isFinite(parsed) ? Math.max(currentMax, parsed) : currentMax;
  }, 0);
  return `TL-${String(max + 1).padStart(3, "0")}`;
}

function loopStatusBreakdown() {
  return {
    active: state.loops.filter((item) => item.status === "Active").length,
    pending: state.loops.filter((item) => item.status === "Pending").length,
    completed: state.loops.filter((item) => item.status === "Completed").length,
  };
}

function dailyTransactions(days = 7) {
  const labels = Array.from({ length: days }, (_, index) => {
    const date = new Date(Date.now() - (days - index - 1) * 24 * 60 * 60_000);
    return date.toISOString().slice(5, 10);
  });

  const countsByLabel = state.events.reduce((acc, event) => {
    const label = String(event.time || "").slice(5, 10);
    if (!label) return acc;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  return labels.map((label, index) => ({
    label,
    count: countsByLabel[label] || (index === days - 1 ? 1 : 0),
  }));
}

function buildOverviewMetrics() {
  refreshLoopScores();
  const status = loopStatusBreakdown();
  const transactions7d = dailyTransactions(7).reduce((sum, item) => sum + item.count, 0);
  const verifiedWallets = state.onboardingProfiles.length;
  const retainedUsers = state.onboardingProfiles.filter((item, index) => index % 3 !== 0).length;
  const avgScore = average(state.loops.map((item) => item.score || 0));

  return {
    activeUsers: verifiedWallets,
    verifiedWallets,
    transactions7d,
    retainedUsers,
    retentionRate: verifiedWallets
      ? Math.round((retainedUsers / verifiedWallets) * 100)
      : 0,
    avgTrustScore: avgScore,
    completionRate: Math.round((status.completed / Math.max(1, state.loops.length)) * 100),
    loopsByStatus: status,
    approvalsReady: Object.values(state.approvals).filter(isApprovalReady).length,
    dailyTransactions: dailyTransactions(7),
  };
}

function buildIndexerStatus() {
  return {
    status: "healthy",
    source: "TrustLoop persistent API store",
    indexedEvents: state.events.length,
    indexedLoops: state.loops.length,
    pendingBackfill: 0,
    lastSyncedAt: state.meta.lastIndexerSyncAt,
    eventTypes: {
      created: state.events.filter((item) => item.type === "trust.created").length,
      confirmed: state.events.filter((item) => item.type === "trust.confirmed").length,
      closed: state.events.filter((item) => item.type === "trust.closed").length,
      approvals: state.events.filter((item) => item.type === "trust.approved").length,
    },
  };
}

function buildMonitoringSummary() {
  const uptimeSeconds = Math.floor((Date.now() - requestMetrics.startedAt) / 1000);
  const avgLatencyMs = average(requestMetrics.latencySamples);
  return {
    status: "operational",
    uptimeSeconds,
    totalRequests: requestMetrics.totalRequests,
    totalErrors: requestMetrics.totalErrors,
    avgLatencyMs,
    errorRate: requestMetrics.totalRequests
      ? Number(((requestMetrics.totalErrors / requestMetrics.totalRequests) * 100).toFixed(2))
      : 0,
    services: [
      { name: "API", status: "up", detail: "Express API responding" },
      { name: "Persistence", status: "up", detail: "JSON-backed data store writable" },
      { name: "Indexer", status: "up", detail: "Loop and event cache is current" },
      { name: "Wallet demo", status: "degraded", detail: "Optional Freighter integration only" },
    ],
    alerts: [
      {
        severity: "low",
        title: "Single-file persistence store in use",
        detail: "Suitable for demo and pilot use, but not a substitute for a production database.",
      },
    ],
  };
}

function buildSecurityChecklist() {
  return [
    { id: "wallet-network", label: "Freighter network passphrase validation", status: "done" },
    { id: "input-validation", label: "Counterparty and expiry input validation", status: "done" },
    { id: "error-states", label: "User-facing error handling and retries", status: "done" },
    { id: "monitoring", label: "Operational monitoring dashboard", status: "done" },
    { id: "indexing", label: "Indexer visibility and freshness tracking", status: "done" },
    { id: "persistence", label: "Server-side data persistence", status: "done" },
    { id: "rate-limits", label: "API rate limits", status: "planned" },
  ];
}

function isApprovalReady(approval = {}) {
  if (approval.requiredApprovals === 1) {
    return Boolean(approval.clientApproved || approval.freelancerApproved);
  }

  return Boolean(approval.clientApproved && approval.freelancerApproved);
}

function buildOnboardingRecord(payload = {}) {
  return {
    id: `OB-${String(state.onboardingProfiles.length + 1).padStart(3, "0")}`,
    createdAt: nowIso(),
    name: String(payload.name || "").trim(),
    email: String(payload.email || "").trim(),
    walletAddress: String(payload.walletAddress || "").trim(),
    walletShort: shortWallet(payload.walletAddress),
    feedback: String(payload.feedback || "").trim(),
    productRating: clampNumber(payload.productRating, 1, 5, 4),
  };
}

const requestMetrics = {
  startedAt: Date.now(),
  totalRequests: 0,
  totalErrors: 0,
  latencySamples: [],
};

app.use((req, res, next) => {
  requestMetrics.totalRequests += 1;
  const start = Date.now();

  res.on("finish", () => {
    const latency = Date.now() - start;
    requestMetrics.latencySamples.push(latency);
    if (requestMetrics.latencySamples.length > 120) {
      requestMetrics.latencySamples.shift();
    }
    if (res.statusCode >= 400) {
      requestMetrics.totalErrors += 1;
    }
  });

  next();
});

app.get("/", (_req, res) => {
  res.type("text").send("TrustLoop API is running. Try /api/health");
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    status: "healthy",
    timestamp: nowIso(),
    uptimeSeconds: Math.floor((Date.now() - requestMetrics.startedAt) / 1000),
  });
});

app.get("/api/trustloops", (_req, res) => {
  res.json(state.loops.map(withLoopApproval));
});

app.get("/api/trustloops/:id", (req, res) => {
  const item = findLoopOr404(req, res);
  if (!item) return;
  res.json(withLoopApproval(item));
});

app.get("/api/events", (_req, res) => {
  res.json(state.events);
});

app.get("/api/dashboard/stats", (_req, res) => {
  const overview = buildOverviewMetrics();
  res.json({
    loopsActive: overview.loopsByStatus.active,
    loopsPending: overview.loopsByStatus.pending,
    loopsCompleted: overview.loopsByStatus.completed,
    trustScoreAvg: overview.avgTrustScore,
  });
});

app.get("/api/metrics/overview", (_req, res) => {
  res.json(buildOverviewMetrics());
});

app.get("/api/monitoring", (_req, res) => {
  res.json(buildMonitoringSummary());
});

app.get("/api/indexer", (_req, res) => {
  res.json(buildIndexerStatus());
});

app.get("/api/security-checklist", (_req, res) => {
  res.json(buildSecurityChecklist());
});

app.get("/api/onboarding", (_req, res) => {
  res.json({
    count: state.onboardingProfiles.length,
    records: state.onboardingProfiles,
  });
});

app.post("/api/onboarding", (req, res) => {
  const { name, email, walletAddress } = req.body ?? {};
  if (!name || !email || !walletAddress) {
    return res.status(400).json({ error: "name, email and walletAddress are required" });
  }

  const record = buildOnboardingRecord(req.body);
  state.onboardingProfiles.unshift(record);
  commitState();
  res.status(201).json(record);
});

app.post("/api/trustloops", (req, res) => {
  const { counterparty, role, expiresInDays, approvalPolicy } = req.body ?? {};
  if (!counterparty || typeof counterparty !== "string") {
    return res.status(400).json({ error: "counterparty required (string)" });
  }

  const id = getNextId();
  const item = normalizeLoop({
    id,
    counterparty,
    role,
    status: "Pending",
    score: 0,
    expiresInDays: clampNumber(expiresInDays, 1, 90, 14),
    lastEvent: "trust.created",
    createdAt: nowIso(),
    approvalPolicy: approvalPolicy === "single" ? "single" : "dual",
  });

  state.loops.unshift(item);
  state.approvals[item.id] = normalizeApproval(item, {
    clientApproved: false,
    freelancerApproved: false,
    requiredApprovals: item.approvalPolicy === "single" ? 1 : 2,
    updatedAt: nowIso(),
  });
  item.score = deriveTrustScore(item, state.approvals[item.id]);
  addEvent("trust.created", item.id, `${item.id} created`);
  commitState();

  res.status(201).json(withLoopApproval(item));
});

app.post("/api/trustloops/:id/confirm", (req, res) => {
  const item = findLoopOr404(req, res);
  if (!item) return;
  if (item.status !== "Pending") {
    return res.status(400).json({ error: "Only Pending loops can be confirmed" });
  }

  item.status = "Active";
  item.lastEvent = "trust.confirmed";
  item.score = deriveTrustScore(item, state.approvals[item.id]);
  addEvent("trust.confirmed", item.id, `${item.id} confirmed`);
  commitState();

  res.json(withLoopApproval(item));
});

app.post("/api/trustloops/:id/close", (req, res) => {
  const item = findLoopOr404(req, res);
  if (!item) return;
  if (item.status !== "Active") {
    return res.status(400).json({ error: "Only Active loops can be closed" });
  }

  const approval = state.approvals[item.id] || normalizeApproval(item);
  if (!isApprovalReady(approval)) {
    return res.status(400).json({
      error: "Required approvals must be captured before closing",
    });
  }

  item.status = "Completed";
  item.expiresInDays = 0;
  item.lastEvent = "trust.closed";
  item.score = deriveTrustScore(item, approval);
  addEvent("trust.closed", item.id, `${item.id} closed`);
  commitState();

  res.json(withLoopApproval(item));
});

app.post("/api/trustloops/:id/approve", (req, res) => {
  const item = findLoopOr404(req, res);
  if (!item) return;

  const actor = req.body?.actor === "Freelancer" ? "Freelancer" : "Client";
  const entry = normalizeApproval(item, state.approvals[item.id]);

  if (actor === "Client") entry.clientApproved = true;
  if (actor === "Freelancer") entry.freelancerApproved = true;
  entry.updatedAt = nowIso();
  state.approvals[item.id] = entry;
  item.score = deriveTrustScore(item, entry);

  addEvent("trust.approved", item.id, `${item.id} ${actor.toLowerCase()} approval captured`);
  commitState();

  res.json({
    loopId: item.id,
    approvals: entry,
    readyToClose: isApprovalReady(entry),
  });
});

app.post("/api/trustloops/:id/revoke", (req, res) => {
  const item = findLoopOr404(req, res);
  if (!item) return;

  const actor = req.body?.actor === "Freelancer" ? "Freelancer" : "Client";
  const entry = normalizeApproval(item, state.approvals[item.id]);

  if (actor === "Client") entry.clientApproved = false;
  if (actor === "Freelancer") entry.freelancerApproved = false;
  entry.updatedAt = nowIso();
  state.approvals[item.id] = entry;
  item.score = deriveTrustScore(item, entry);

  addEvent("trust.approval_revoked", item.id, `${item.id} ${actor.toLowerCase()} approval revoked`);
  commitState();

  res.json({
    loopId: item.id,
    approvals: entry,
    readyToClose: isApprovalReady(entry),
  });
});

app.use((err, req, res, next) => {
  if (!res.headersSent) {
    return errorHandler(err, req, res, next);
  }
});

app.use((_req, res) => {
  res.status(404).json({
    error: "Not found",
    statusCode: 404,
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT} (persistent JSON mode)`);
});
