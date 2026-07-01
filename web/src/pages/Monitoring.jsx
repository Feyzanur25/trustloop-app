import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Radar,
  ShieldCheck,
  Server,
  Database,
  Activity,
  CheckCircle2,
} from "lucide-react";
import opsApi from "../services/opsApi";

function statusTone(status) {
  if (status === "up" || status === "operational" || status === "healthy" || status === "completed") {
    return "border-emerald-400/20 bg-emerald-400/12 text-emerald-100";
  }
  if (status === "degraded" || status === "partial" || status === "pending") {
    return "border-amber-400/20 bg-amber-400/12 text-amber-100";
  }
  return "border-rose-400/20 bg-rose-400/12 text-rose-100";
}

function Badge({ label, tone }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${tone}`}>
      {label}
    </span>
  );
}

function SummaryCard({ icon, label, value, detail }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:bg-white/[0.06]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">{label}</div>
        <div className="grid h-12 w-12 place-items-center rounded-3xl bg-slate-900 text-cyan-300 shadow-[0_12px_30px_rgba(34,211,238,0.16)]">
          {icon}
        </div>
      </div>
      <div className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-white">{value}</div>
      <p className="mt-3 text-sm leading-6 text-white/55">{detail}</p>
    </div>
  );
}

function StatusRow({ label, status, detail }) {
  return (
    <div className="flex flex-col gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-semibold text-white">{label}</div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusTone(status)}`}>
          {status}
        </span>
      </div>
      <p className="text-sm leading-6 text-white/60">{detail}</p>
    </div>
  );
}

function DetailTile({ title, value, meta }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
      <div className="text-sm text-white/50">{title}</div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
      {meta ? <p className="mt-2 text-sm text-white/55">{meta}</p> : null}
    </div>
  );
}

const fallbackMonitoring = {
  status: "operational",
  uptimeSeconds: 5970,
  avgLatencyMs: 142,
  services: [
    {
      name: "API Gateway",
      status: "operational",
      detail: "Primary request routing and health checks are stable.",
    },
    {
      name: "Onboarding Service",
      status: "operational",
      detail: "Wallet registry, CSV export, and participant tracking are active.",
    },
    {
      name: "Metrics Aggregator",
      status: "healthy",
      detail: "Dashboard metrics derived from onboarding and mainnet activity.",
    },
    {
      name: "Notification Pipeline",
      status: "degraded",
      detail: "Notifications are functional with reduced refresh frequency.",
    },
  ],
  alerts: [
    {
      title: "Fallback resilience enabled",
      detail:
        "Fallback monitoring data is available if live service metrics are temporarily unavailable.",
    },
  ],
};

const fallbackIndexer = {
  source: "Stellar Horizon Mainnet",
  lastSyncedAt: "2026-03-31 00:58 UTC",
  indexedLoops: 32,
  indexedEvents: 148,
  pendingBackfill: 1,
};

const fallbackSecurity = [
  { id: 1, label: "Environment variable validation", status: "completed" },
  { id: 2, label: "Wallet address verification", status: "completed" },
  { id: 3, label: "Input validation and sanitization", status: "completed" },
  { id: 4, label: "Error handling and structured logging", status: "completed" },
  { id: 5, label: "Dual-approval workflow protection", status: "completed" },
  { id: 6, label: "Rate limiting preparation", status: "pending" },
];

export default function Monitoring() {
  const [monitoring, setMonitoring] = useState(fallbackMonitoring);
  const [indexer, setIndexer] = useState(fallbackIndexer);
  const [security, setSecurity] = useState(fallbackSecurity);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMonitoring() {
      try {
        const [monitoringData, indexerData, securityData] = await Promise.all([
          opsApi.getMonitoring(),
          opsApi.getIndexer(),
          opsApi.getSecurityChecklist(),
        ]);

        if (!active) return;

        if (monitoringData && typeof monitoringData === "object") {
          setMonitoring((current) => ({
            ...current,
            ...monitoringData,
            services: monitoringData.services || current.services,
            alerts: monitoringData.alerts || current.alerts,
          }));
        }

        if (indexerData && typeof indexerData === "object") {
          setIndexer((current) => ({ ...current, ...indexerData }));
        }

        if (Array.isArray(securityData) && securityData.length) {
          setSecurity(securityData);
        }

        setUsingFallback(false);
        setError("");
      } catch (err) {
        if (!active) return;
        setUsingFallback(true);
        setError(err?.message || "Monitoring unavailable. Showing fallback monitoring data.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMonitoring();
    return () => {
      active = false;
    };
  }, []);

  const uptimeMinutes = useMemo(
    () => Math.round((monitoring.uptimeSeconds || 0) / 60),
    [monitoring.uptimeSeconds]
  );

  const completedSecurityChecks = useMemo(
    () =>
      security.filter((item) =>
        ["completed", "healthy", "operational", "up"].includes(item.status)
      ).length,
    [security]
  );

  const operationalServices = useMemo(
    () =>
      (monitoring.services || []).filter((service) =>
        ["up", "operational", "healthy"].includes(service.status)
      ).length,
    [monitoring.services]
  );

  const serviceHealthLabel = useMemo(() => {
    const total = monitoring.services?.length || 0;
    if (operationalServices === total) return "All systems green";
    if (operationalServices >= total - 1) return "Minor degradation";
    return "Partial instability detected";
  }, [monitoring.services, operationalServices]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-white/10 bg-slate-950/95 p-8 shadow-[0_35px_120px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="section-title">Operations</div>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
              Monitoring, health, and security at a glance.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
              TrustLoop monitoring surfaces live service health, indexer visibility, latency trends, and audit-ready security posture.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge
              label={usingFallback ? "Fallback mode" : monitoring.status || "Unknown"}
              tone={statusTone(usingFallback ? "pending" : monitoring.status)}
            />
            <Badge
              label={`${operationalServices}/${monitoring.services?.length || 0} services healthy`}
              tone="border-cyan-400/20 bg-cyan-400/12 text-cyan-100"
            />
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-[24px] border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<Server size={20} />}
          label="API uptime"
          value={`${uptimeMinutes}m`}
          detail="Measured runtime window for core operations"
        />
        <SummaryCard
          icon={<Radar size={20} />}
          label="Average latency"
          value={`${monitoring.avgLatencyMs || 0}ms`}
          detail="Live response profile across endpoints"
        />
        <SummaryCard
          icon={<Database size={20} />}
          label="Indexed events"
          value={indexer.indexedEvents || 0}
          detail="Processed trust loop and event records"
        />
        <SummaryCard
          icon={<ShieldCheck size={20} />}
          label="Security coverage"
          value={`${completedSecurityChecks}/${security.length}`}
          detail="Checklist items verified for operational readiness"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.95fr]">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-white/10 bg-black/15 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">Service status</div>
                <h2 className="mt-3 text-2xl font-semibold text-white">Operational service health</h2>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
                {serviceHealthLabel}
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {(monitoring.services || []).map((service) => (
                <StatusRow
                  key={service.name}
                  label={service.name}
                  status={service.status}
                  detail={service.detail}
                />
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-black/15 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-white/50">
              <Activity size={16} />
              Platform snapshot
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailTile
                title="Sync source"
                value={indexer.source || "Stellar Mainnet"}
                meta="Event indexing origin"
              />
              <DetailTile
                title="Last synced"
                value={indexer.lastSyncedAt || "-"}
                meta="Recent indexer visibility"
              />
              <DetailTile
                title="Indexed loops"
                value={indexer.indexedLoops || 0}
                meta="Loop data available for dashboard queries"
              />
              <DetailTile
                title="Backfill queue"
                value={indexer.pendingBackfill ?? 0}
                meta="Pending historical sync tasks"
              />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-white/10 bg-black/15 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-white/50">
              <CheckCircle2 size={16} />
              Security readiness
            </div>
            <div className="mt-4 space-y-3">
              {security.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4"
                >
                  <span className="text-sm text-white/75">{item.label}</span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusTone(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-amber-400/15 bg-amber-500/[0.06] p-6 shadow-[0_24px_60px_rgba(241,156,83,0.14)]">
            <div className="flex items-center gap-3 text-lg font-semibold text-white">
              <AlertTriangle size={20} />
              Active alerts
            </div>
            <p className="mt-2 text-sm text-white/65">
              Key notices surfaced from monitoring and demo resilience checks.
            </p>
            <div className="mt-5 space-y-3">
              {monitoring.alerts?.length ? (
                monitoring.alerts.map((alert) => (
                  <div key={alert.title} className="rounded-2xl bg-black/15 p-4">
                    <div className="font-semibold text-white">{alert.title}</div>
                    <p className="mt-1 text-sm text-white/65">{alert.detail}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-white/[0.04] p-4 text-sm text-white/60">
                  No active alerts currently. The platform is operating normally.
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm text-white/55">
        {loading
          ? "Loading monitoring data..."
          : usingFallback
          ? "Showing fallback monitoring data while live endpoints warm up."
          : "Live monitoring data loaded for TrustLoop operations."}
      </div>
    </div>
  );
}
