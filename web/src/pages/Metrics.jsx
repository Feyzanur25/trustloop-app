import React, { useEffect, useState } from "react";
import { Activity, BarChart3, CheckCircle2, Users, Wallet } from "lucide-react";
import opsApi from "../services/opsApi";

function Card({ icon, label, value, hint }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center gap-2 text-sm text-white/60">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">{value}</div>
      <div className="mt-2 text-sm text-white/50">{hint}</div>
    </div>
  );
}

function Bar({ item, max }) {
  const height = Math.max(16, Math.round((item.count / Math.max(1, max)) * 120));
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <div className="flex h-32 items-end">
        <div
          className="w-10 rounded-t-2xl bg-gradient-to-t from-emerald-500/60 to-cyan-400/80"
          style={{ height }}
        />
      </div>
      <div className="text-xs text-white/50">{item.label}</div>
      <div className="text-sm text-white/80">{item.count}</div>
    </div>
  );
}

export default function Metrics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    opsApi
      .getMetricsOverview()
      .then(setData)
      .catch((err) => setError(err?.message || "Metrics unavailable"));
  }, []);

  if (error) {
    return <div className="p-6 text-white">{error}</div>;
  }

  if (!data) {
    return <div className="p-6 text-white">Loading metrics...</div>;
  }

  const bars = data.dailyTransactions || data.dailyActivity || [];
  const maxBar = Math.max(...bars.map((item) => item.count), 1);
  const loopsByStatus = data.loopsByStatus || {
    active: data.activeLoops || 0,
    pending: 0,
    completed: data.completedLoops || 0,
  };

  return (
    <div className="space-y-6 rounded-[28px] border border-white/10 bg-[linear-gradient(120deg,rgba(13,40,37,0.45),rgba(20,21,30,0.9)_55%,rgba(16,24,34,0.95))] p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm uppercase tracking-[0.24em] text-white/45">Level 6 Ops</div>
          <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
            Metrics Dashboard
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">
          Live metrics ready for demo
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          icon={<Users size={17} />}
          label="Active Users"
          value={data.activeUsers ?? data.verifiedWallets ?? 0}
          hint="Target is 30+ verified users"
        />
        <Card
          icon={<Wallet size={17} />}
          label="Verified Wallets"
          value={data.verifiedWallets ?? 0}
          hint="Onboarding records with wallet addresses"
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

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-[24px] border border-white/10 bg-black/15 p-5">
          <div className="flex items-center gap-2 text-lg font-semibold text-white">
            <BarChart3 size={18} />
            <span>Daily Throughput</span>
          </div>
          <div className="mt-5 flex gap-3 overflow-x-auto">
            {bars.map((item) => (
              <Bar key={item.label} item={item} max={maxBar} />
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-black/15 p-5">
          <div className="text-lg font-semibold text-white">KPI Snapshot</div>
          <div className="mt-4 space-y-4 text-sm text-white/75">
            <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
              <span>Average trust score</span>
              <span className="font-semibold text-white">{data.avgTrustScore ?? 0}/100</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
              <span>Retention rate</span>
              <span className="font-semibold text-white">{data.retentionRate ?? 0}%</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
              <span>Approval-ready loops</span>
              <span className="font-semibold text-white">{data.approvalsReady ?? 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
              <span>Active loops</span>
              <span className="font-semibold text-white">{loopsByStatus.active}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
              <span>Pending loops</span>
              <span className="font-semibold text-white">{loopsByStatus.pending}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
              <span>Completed loops</span>
              <span className="font-semibold text-white">{loopsByStatus.completed}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
