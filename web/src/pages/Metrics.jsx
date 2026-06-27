import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import opsApi from "../services/opsApi";

const fallbackMetrics = {
  activeUsers: 32,
  verifiedWallets: 32,
  transactions7d: 37,
  completionRate: 25,
  avgTrustScore: 77,
  retentionRate: 66,
  approvalsReady: 2,
  activeLoops: 2,
  completedLoops: 1,
  loopsByStatus: {
    active: 2,
    pending: 1,
    completed: 1,
  },
  dailyTransactions: [
    { label: "03-24", count: 3 },
    { label: "03-25", count: 5 },
    { label: "03-26", count: 7 },
    { label: "03-27", count: 4 },
    { label: "03-28", count: 6 },
    { label: "03-29", count: 3 },
    { label: "03-30", count: 9 },
  ],
};

function StatCard({ icon, label, value, hint, accent }) {
  const accentClass =
    accent === "cyan"
      ? "border-cyan-300/20 bg-gradient-to-br from-cyan-500/10 to-cyan-400/5"
      : accent === "emerald"
      ? "border-emerald-300/20 bg-gradient-to-br from-emerald-400/10 to-emerald-300/5"
      : accent === "violet"
      ? "border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-500/10 to-fuchsia-400/5"
      : "border-white/10 bg-white/[0.04]";

  return (
    <div className={`rounded-[28px] border p-6 shadow-[0_18px_40px_rgba(0,0,0,0.18)] ${accentClass}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">{label}</div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-white shadow-[0_10px_30px_rgba(56,189,248,0.18)]">
          {icon}
        </div>
      </div>
      <div className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-white">{value}</div>
      <div className="mt-3 text-sm leading-6 text-white/60">{hint}</div>
    </div>
  );
}

function ThroughputColumn({ item, max }) {
  const safeMax = Math.max(1, max);
  const height = Math.max(32, Math.round((item.count / safeMax) * 180));

  return (
    <div className="flex min-w-[84px] flex-1 flex-col items-center gap-3 text-center">
      <div className="flex h-44 items-end w-full">
        <div
          className="mx-auto h-full min-h-[32px] w-14 rounded-t-[26px] bg-gradient-to-t from-emerald-400 to-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.2)]"
          style={{ height }}
        />
      </div>
      <div className="text-xs uppercase tracking-[0.16em] text-white/45">{item.label}</div>
      <div className="text-sm font-semibold text-white">{item.count}</div>
    </div>
  );
}

function StatusPill({ children, tone = "default" }) {
  const palette =
    tone === "success"
      ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/20"
      : tone === "warning"
      ? "bg-amber-500/15 text-amber-200 border border-amber-400/20"
      : tone === "info"
      ? "bg-cyan-500/15 text-cyan-200 border border-cyan-400/20"
      : "bg-white/5 text-white/70 border border-white/10";

  return (
    <span className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] ${palette}`}>
      {children}
    </span>
  );
}

export default function Metrics() {
  const [data, setData] = useState(fallbackMetrics);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMetrics() {
      try {
        const response = await opsApi.getMetricsOverview();
        if (!active) return;

        if (response && typeof response === "object") {
          setData((current) => ({
            ...current,
            ...response,
            loopsByStatus: response.loopsByStatus || current.loopsByStatus,
            dailyTransactions:
              response.dailyTransactions || response.dailyActivity || current.dailyTransactions,
          }));
          setUsingFallback(false);
          setError("");
        }
      } catch (err) {
        if (!active) return;
        setUsingFallback(true);
        setError(err?.message || "Live metrics unavailable. Showing demo data.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMetrics();
    return () => {
      active = false;
    };
  }, []);

  const bars = useMemo(() => data.dailyTransactions || data.dailyActivity || [], [data]);

  const maxBar = useMemo(
    () => Math.max(...bars.map((item) => Number(item.count) || 0), 1),
    [bars]
  );

  const loopsByStatus = useMemo(
    () =>
      data.loopsByStatus || {
        active: data.activeLoops || 0,
        pending: 0,
        completed: data.completedLoops || 0,
      },
    [data]
  );

  const healthSummary = useMemo(() => {
    const completed = Number(loopsByStatus.completed || 0);
    const total =
      Number(loopsByStatus.active || 0) +
      Number(loopsByStatus.pending || 0) +
      Number(loopsByStatus.completed || 0);

    if (total === 0) return "No workflow data yet";
    if (completed / total >= 0.5) return "Healthy loop completion";
    if (completed / total >= 0.25) return "Moderate completion progress";
    return "Early-stage workflow activity";
  }, [loopsByStatus]);

  const avgDaily = Math.round(
    (bars.reduce((sum, item) => sum + Number(item.count), 0) || 0) / Math.max(1, bars.length)
  );

  const trendChange = Math.round(
    ((bars[bars.length - 1]?.count || 0) - (bars[0]?.count || 0)) /
      Math.max(1, bars[0]?.count || 1) *
      100
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-white/10 bg-slate-950/95 p-8 shadow-[0_35px_120px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="section-title">Level 6 Operations</div>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              TrustLoop metrics designed for clarity and speed.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
              A clean, responsive page that highlights trust loop health, wallet adoption, and testnet throughput.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatusPill tone={usingFallback ? "warning" : "success"}>
              {usingFallback ? "Demo mode" : "Live mode"}
            </StatusPill>
            <StatusPill tone="info">{healthSummary}</StatusPill>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-[24px] border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Users size={20} />}
          label="Active users"
          value={data.activeUsers ?? 0}
          hint="Verified participants engaged in loops"
          accent="cyan"
        />
        <StatCard
          icon={<Wallet size={20} />}
          label="Verified wallets"
          value={data.verifiedWallets ?? 0}
          hint="Authenticated testnet identities"
          accent="emerald"
        />
        <StatCard
          icon={<Activity size={20} />}
          label="7-day tx volume"
          value={data.transactions7d ?? 0}
          hint="Recent throughput across loops"
          accent="violet"
        />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          label="Completion rate"
          value={`${data.completionRate ?? 0}%`}
          hint="Finished loops versus active targets"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-[28px] border border-white/10 bg-slate-950/90 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">Throughput</div>
              <h2 className="mt-3 text-2xl font-semibold text-white">Daily transaction flow</h2>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
              {bars.length} days of data
            </div>
          </div>

          <div className="mt-6 overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {bars.map((item) => (
                <ThroughputColumn key={item.label} item={item} max={maxBar} />
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-sm text-white/50">Peak daily volume</div>
              <div className="mt-3 text-2xl font-semibold text-white">{Math.max(...bars.map((item) => Number(item.count)))}</div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-sm text-white/50">Average daily</div>
              <div className="mt-3 text-2xl font-semibold text-white">{avgDaily}</div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-sm text-white/50">7-day momentum</div>
              <div className="mt-3 text-2xl font-semibold text-white">{trendChange >= 0 ? "+" : ""}{trendChange}%</div>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm text-white/65">
            The chart shows recent loop activity with clearer proportional bars for every day of testnet throughput.
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[28px] border border-white/10 bg-slate-950/90 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">Trust score</div>
                <div className="mt-3 text-3xl font-semibold text-white">{data.avgTrustScore ?? 0}/100</div>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-[26px] bg-gradient-to-br from-cyan-500/15 to-emerald-500/15 text-cyan-200">
                <TrendingUp size={24} />
              </div>
            </div>
            <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/60">
              Average trust score across active and completed loops. Use this as a single, easy health metric.
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/90 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-5">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">Network status</div>
              <div className="mt-3 text-lg font-semibold text-white">Stellar Testnet · Online</div>
            </div>
            <div className="space-y-3 border-t border-white/10 bg-white/[0.03] p-5 text-sm text-white/60">
              <div className="flex items-center justify-between">
                <span>Approval-ready loops</span>
                <span className="font-semibold text-white">{data.approvalsReady ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Active loops</span>
                <span className="font-semibold text-white">{loopsByStatus.active ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Completed loops</span>
                <span className="font-semibold text-white">{loopsByStatus.completed ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/90 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">Audit-ready summary</div>
            <div className="mt-4 space-y-4">
              {[
                ["Retention rate", `${data.retentionRate ?? 0}%`],
                ["Approval-ready loops", data.approvalsReady ?? 0],
                ["Active loops", loopsByStatus.active ?? 0],
                ["Completed loops", loopsByStatus.completed ?? 0],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white/80">
                  <span>{label}</span>
                  <span className="font-semibold text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
