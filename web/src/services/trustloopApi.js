// src/services/trustloopApi.js
import { buildDemoManageDataXdr } from "./demoTx";
import { signXdr } from "./wallet";
import { submitToHorizon } from "./submitTx";
import { http } from "./http";

const HORIZON_TESTNET = "https://horizon-testnet.stellar.org";
const STORAGE_KEY = "trustloop:loops:v1";

/** -------------------------
 * Helpers
 * ------------------------*/
function formatTime(iso) {
  try {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  } catch {
    return "—";
  }
}

function safeBase64ToText(b64) {
  try {
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(b64), (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch {
    return b64;
  }
}

function extractLoopId(text) {
  if (!text) return null;
  const m = String(text).match(/\bTL-\d{3,}\b/);
  return m ? m[0] : null;
}

function loadLocalLoops() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveLocalLoops(loops) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loops));
  } catch {
    // ignore
  }
}

function nextLoopId(existing) {
  const nums = existing
    .map((l) => String(l.id || ""))
    .map((id) => {
      const m = id.match(/^TL-(\d+)$/);
      return m ? Number(m[1]) : 0;
    });
  const max = nums.length ? Math.max(...nums) : 0;
  const n = max + 1;
  return `TL-${String(n).padStart(3, "0")}`;
}

function shortenGAddress(addr) {
  const a = String(addr || "").trim();
  if (!a) return "—";
  if (a.length <= 10) return a;
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

/** -------------------------
 * Horizon Events (account operations -> manage_data trust.*)
 * ------------------------*/
async function getHorizonTrustEvents({ walletPk, limit = 40 } = {}) {
  if (!walletPk) return [];

  const TRUST_KEYS = new Set(["trust.created", "trust.confirmed", "trust.closed"]);

  // 1) operations çek
  const res = await fetch(
    `${HORIZON_TESTNET}/accounts/${walletPk}/operations?order=desc&limit=${limit}&include_failed=false`
  );
  if (!res.ok) {
    throw new Error(`Horizon operations fetch failed (${res.status})`);
  }

  const json = await res.json();
  const ops = json?._embedded?.records || [];

  // 2) tx created_at cache (href bazlı)
  const txTimeCache = new Map();

  const events = [];

  for (const op of ops) {
    if (op?.type !== "manage_data") continue;

    const key = op?.name || "";
    if (!TRUST_KEYS.has(key)) continue;

    const valueText = op?.value ? safeBase64ToText(op.value) : "";
    const loopId = extractLoopId(valueText) || null;

    const action = key.split(".")[1] || key; // created/confirmed/closed

    // ✅ created_at op içinde yok -> transaction endpoint'inden al
    const txHref = op?._links?.transaction?.href;

    let timeIso = "";
    if (txHref) {
      if (txTimeCache.has(txHref)) {
        timeIso = txTimeCache.get(txHref) || "";
      } else {
        try {
          const txRes = await fetch(txHref);
          if (txRes.ok) {
            const txJson = await txRes.json();
            timeIso = txJson?.created_at || "";
          }
        } catch {
          timeIso = "";
        }
        txTimeCache.set(txHref, timeIso);
      }
    }

    events.push({
      time: formatTime(timeIso),
      type: key,
      loopId,
      detail: loopId ? `${loopId} ${action}` : `${action} ${valueText}`.trim(),
    });
  }

  // newest-first, "—" olanlar sona
  events.sort((a, b) => {
    if (a.time === "—" && b.time !== "—") return 1;
    if (b.time === "—" && a.time !== "—") return -1;
    return a.time < b.time ? 1 : -1;
  });

  return events;
}

/** -------------------------
 * Loops: localStorage + events ile status güncelle
 * ------------------------*/
function applyEventsToLoops(loops, events) {
  const byId = new Map(loops.map((l) => [l.id, { ...l }]));

  for (const ev of events) {
    if (!ev.loopId) continue;
    const loop = byId.get(ev.loopId);
    if (!loop) continue;

    loop.lastEvent = ev.type;

    if (ev.type === "trust.created") loop.status = "Pending";
    if (ev.type === "trust.confirmed") loop.status = "Active";
    if (ev.type === "trust.closed") loop.status = "Completed";
  }

  return Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id));
}

function buildStatsFromLoops(loops) {
  const activeLoops = loops.filter((l) => l.status === "Active").length;
  const pending = loops.filter((l) => l.status === "Pending").length;
  const completed = loops.filter((l) => l.status === "Completed").length;

  const scores = loops.map((l) => Number(l.score) || 0);
  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  // ✅ hem yeni hem eski field isimleri (UI kırılmasın)
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

/** -------------------------
 * Chain write helpers (manage_data trust.*)
 * ------------------------*/
async function createLoop({ walletPk, counterparty, role, expiresInDays }) {
  if (!walletPk) throw new Error("Önce cüzdanı bağla.");

  const local = loadLocalLoops();
  const id = nextLoopId(local);

  let submitRes = null;
  let txHash = null;

  // Blockchain transaction dene
  try {
    const xdr = await buildDemoManageDataXdr(walletPk, {
      loopId: id,
      action: "created",
    });

    const signedXdr = await signXdr(xdr, "TESTNET");
    submitRes = await submitToHorizon(signedXdr, "TESTNET");
    txHash = submitRes?.hash;
    console.log("Blockchain transaction successful:", txHash);
  } catch (chainError) {
    console.warn("Blockchain transaction failed, using API fallback:", chainError.message);
  }

  // Loop objesi oluştur (API ile uyumlu: create = Pending)
  const newLoop = {
    id,
    counterparty: shortenGAddress(counterparty),
    role: role || "Client",
    status: "Pending",
    score: 0,
    expiresInDays: Number(expiresInDays) || 14,
    lastEvent: "trust.created",
    createdAt: new Date().toISOString(),
    txHash: txHash,
  };

  // Önce localStorage'a kaydet
  saveLocalLoops([newLoop, ...local]);

  // Backend API'ye de kaydet
  try {
    const apiLoop = await http("/api/trustloops", {
      method: "POST",
      body: JSON.stringify({
        counterparty: counterparty.trim(),
        role: role || "Client",
        expiresInDays: Number(expiresInDays) || 14,
      }),
    });
    
    console.log("API response:", apiLoop);
    
    // API'den gelen veriyi kullanarak localStorage'ı güncelle
    if (apiLoop && apiLoop.id) {
      const mergedLoop = { ...newLoop, ...apiLoop };
      const existingLoops = loadLocalLoops();
      const filtered = existingLoops.filter(l => l.id !== id && l.id !== apiLoop.id);
      saveLocalLoops([mergedLoop, ...filtered]);
      return { loop: mergedLoop, tx: submitRes };
    }
  } catch (apiError) {
    console.warn("API save failed, continuing with local data:", apiError.message);
  }

  return { loop: newLoop, tx: submitRes };
}

async function confirmLoop(loopId) {
  if (!loopId) throw new Error("loopId missing");

  const { getConnectedWallet } = await import("./wallet");
  const walletPk = await getConnectedWallet();
  if (!walletPk) throw new Error("Önce cüzdanı bağla.");

  let submitRes = null;

  try {
    const xdr = await buildDemoManageDataXdr(walletPk, {
      loopId,
      action: "confirmed",
    });

    const signedXdr = await signXdr(xdr, "TESTNET");
    submitRes = await submitToHorizon(signedXdr, "TESTNET");
  } catch (chainError) {
    console.warn("Blockchain confirm failed:", chainError.message);
  }

  // LocalStorage güncelle
  const local = loadLocalLoops();
  const updated = local.map((l) =>
    l.id === loopId ? { ...l, status: "Active", lastEvent: "trust.confirmed" } : l
  );
  saveLocalLoops(updated);

  // API'ye de bildir
  try {
    await http(`/api/trustloops/${loopId}/confirm`, { method: "POST" });
  } catch (apiError) {
    console.warn("API confirm failed:", apiError.message);
  }

  return submitRes;
}

async function closeLoop(loopId) {
  if (!loopId) throw new Error("loopId missing");

  const { getConnectedWallet } = await import("./wallet");
  const walletPk = await getConnectedWallet();
  if (!walletPk) throw new Error("Önce cüzdanı bağla.");

  let submitRes = null;

  try {
    const xdr = await buildDemoManageDataXdr(walletPk, {
      loopId,
      action: "closed",
    });

    const signedXdr = await signXdr(xdr, "TESTNET");
    submitRes = await submitToHorizon(signedXdr, "TESTNET");
  } catch (chainError) {
    console.warn("Blockchain close failed:", chainError.message);
  }

  // LocalStorage güncelle
  const local = loadLocalLoops();
  const updated = local.map((l) =>
    l.id === loopId ? { ...l, status: "Completed", lastEvent: "trust.closed" } : l
  );
  saveLocalLoops(updated);

  // API'ye de bildir
  try {
    await http(`/api/trustloops/${loopId}/close`, { method: "POST" });
  } catch (apiError) {
    console.warn("API close failed:", apiError.message);
  }

  return submitRes;
}

/** -------------------------
 * Public API (tek kaynak)
 * ------------------------*/
const trustloopApi = {
  async getEvents() {
    const { getConnectedWallet } = await import("./wallet");
    const walletPk = await getConnectedWallet();
    return await getHorizonTrustEvents({ walletPk, limit: 80 });
  },

  async getLoops() {
    const local = loadLocalLoops();
    const { getConnectedWallet } = await import("./wallet");
    const walletPk = await getConnectedWallet();
    const events = await getHorizonTrustEvents({ walletPk, limit: 120 }).catch(() => []);
    return applyEventsToLoops(local, events);
  },

  async getStats() {
    try {
      // Backend stats - reliable demo data
      const backendStats = await http("/api/dashboard/stats");
      return {
        activeLoops: backendStats.loopsActive ?? 0,
        pending: backendStats.loopsPending ?? 0,
        completed: backendStats.loopsCompleted ?? 0,
        avgScore: backendStats.trustScoreAvg ?? 0,
      };
    } catch (backendError) {
      console.warn("Backend stats failed, using client fallback:", backendError.message);
      // Fallback to client-side
      const loops = await this.getLoops();
      return buildStatsFromLoops(loops);
    }
  },

  async createLoop(payload) {
    return await createLoop(payload);
  },

  async confirmLoop(loopId) {
    return await confirmLoop(loopId);
  },

  async closeLoop(loopId) {
    return await closeLoop(loopId);
  },
};

// ✅ named + default export (ikisi de var, çakışma yok)
export { trustloopApi };
export default trustloopApi;
