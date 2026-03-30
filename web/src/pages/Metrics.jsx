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

function Card({ icon, label, value, hint, accent = "default" }) {
  const accentClass =
    accent === "success"
      ? "border-emerald-400/20 bg-emerald-400/[0.07]"
      : accent === "info"
      ? "border-cyan-400/20 bg-cyan-400/[0.07]"
      : "border-white/10 bg-white/[0.04]";

  return (
    <div className={`rounded-[22px] border p-5 ${accentClass}`}>
      <div className="flex items-center gap-2 text-sm text-white/60">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
        {value}
      </div>
      <div className="mt-2 text-sm text-white/50">{hint}</div>
    </div>
  );
}

function Bar({ item, max }) {
  const safeMax = Math.max(1, max);
  const height = Math.max(18, Math.round((item.count / safeMax) * 120));

  return (
    <div className="flex min-w-[74px] flex-1 flex-col items-center gap-2">
      <div className="flex h-32 items-end">
        <div
          className="w-11 rounded-t-2xl bg-gradient-to-t from-emerald-500/60 to-cyan-400/80 shadow-[0_0_30px_rgba(45,212,191,0.15)]"
          style={{ height }}
        />
      </div>
      <div className="text-xs text-white/50">{item.label}</div>
      <div className="text-sm font-medium text-white/85">{item.count}</div>
    </div>
  );
}

function StatusPill({ children }) {
  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">
      {children}
    </div>
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
              response.dailyTransactions ||
              response.dailyActivity ||
              current.dailyTransactions,
          }));
          setUsingFallback(false);
          setError("");
        }
      } catch (err) {
        if (!active) return;
        setUsingFallback(true);
        setError(err?.message || "Live metrics unavailable. Showing demo metrics.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMetrics();

    return () => {
      active = false;
    };
  }, []);

  const bars = useMemo(
    () => data.dailyTransactions || data.dailyActivity || [],
    [data]
  );

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

  return (
    <div className="space-y-6 rounded-[28px] border border-white/10 bg-[linear-gradient(120deg,rgba(13,40,37,0.45),rgba(20,21,30,0.9)_55%,rgba(16,24,34,0.95))] p-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="text-sm uppercase tracking-[0.24em] text-white/45">
            Level 6 Ops
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
            Metrics Dashboard
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Live metrics derived from onboarding records, verified wallet activity,
            and controlled Stellar Testnet transaction flows used for product
            validation and demo readiness.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <StatusPill>
            {usingFallback ? "Demo metrics active" : "Live metrics ready for demo"}
          </StatusPill>
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
            {healthSummary}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          icon={<Users size={17} />}
          label="Active Users"
          value={data.activeUsers ?? data.verifiedWallets ?? 0}
          hint="Target is 30+ verified users"
          accent="success"
        />
        <Card
          icon={<Wallet size={17} />}
          label="Verified Wallets"
          value={data.verifiedWallets ?? 0}
          hint="Onboarding records with wallet addresses"
          accent="info"
        />
        <Card
          icon={<Activity size={17} />}
          label="7d Transactions"
          value={data.transactions7d ?? data.transactionsTracked ?? 0}
          hint="Event throughput and user activity"
        />
        <Card
          icon={<CheckCircle2 size={17} />}
          label="Completion Rate"
          value={`${data.completionRate ?? 0}%`}
          hint="Completed loops / total loops"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <TrendingUp size={16} />
            Throughput quality
          </div>
          <div className="mt-3 text-lg font-semibold text-white">
            {Number(data.transactions7d ?? 0) >= 30
              ? "Strong demo activity"
              : "Moderate activity"}
          </div>
          <div className="mt-1 text-sm text-white/50">
            Based on recent transaction and event volume.
          </div>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Users size={16} />
            Onboarding coverage
          </div>
          <div className="mt-3 text-lg font-semibold text-white">
            {data.verifiedWallets ?? 0} verified wallets tracked
          </div>
          <div className="mt-1 text-sm text-white/50">
            Includes participant onboarding and registry records.
          </div>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <ShieldCheck size={16} />
            Validation mode
          </div>
          <div className="mt-3 text-lg font-semibold text-white">
            Testnet-backed demo validation
          </div>
          <div className="mt-1 text-sm text-white/50">
            Metrics include controlled test scenarios for production-readiness review.
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-[24px] border border-white/10 bg-black/15 p-5">
          <div className="flex items-center gap-2 text-lg font-semibold text-white">
            <BarChart3 size={18} />
            <span>Daily Throughput</span>
          </div>
          <div className="mt-2 text-sm text-white/50">
            Recent activity based on onboarding interactions and loop-related testnet events.
          </div>

          <div className="mt-5 flex gap-3 overflow-x-auto">
            {bars.map((item) => (
              <Bar key={item.label} item={item} max={maxBar} />
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-black/15 p-5">
          <div className="text-lg font-semibold text-white">KPI Snapshot</div>
          <div className="mt-2 text-sm text-white/50">
            Core health indicators used during production-readiness review.
          </div>

          <div className="mt-4 space-y-4 text-sm text-white/75">
            <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
              <span>Average trust score</span>
              <span className="font-semibold text-white">
                {data.avgTrustScore ?? 0}/100
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
              <span>Retention rate</span>
              <span className="font-semibold text-white">
                {data.retentionRate ?? 0}%
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
              <span>Approval-ready loops</span>
              <span className="font-semibold text-white">
                {data.approvalsReady ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
              <span>Active loops</span>
              <span className="font-semibold text-white">
                {loopsByStatus.active ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
              <span>Pending loops</span>
              <span className="font-semibold text-white">
                {loopsByStatus.pending ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
              <span>Completed loops</span>
              <span className="font-semibold text-white">
                {loopsByStatus.completed ?? 0}
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 text-sm text-white/55">
        {loading
          ? "Loading metrics..."
          : usingFallback
          ? "Showing resilient demo metrics because live overview data is currently unavailable."
          : "Live overview loaded successfully from the metrics service."}
      </div>
    </div>
  );
}