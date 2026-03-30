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
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  }
  if (status === "degraded" || status === "partial" || status === "pending") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-100";
  }
  return "border-rose-400/20 bg-rose-400/10 text-rose-100";
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
      detail: "Dashboard metrics derived from onboarding and testnet activity.",
    },
    {
      name: "Notification Pipeline",
      status: "degraded",
      detail: "Notifications are functional with reduced refresh frequency during demo mode.",
    },
  ],
  alerts: [
    {
      title: "Demo mode resilience enabled",
      detail:
        "Fallback monitoring data is available if live service metrics are temporarily unavailable.",
    },
  ],
};

const fallbackIndexer = {
  source: "Stellar Horizon Testnet",
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

function SmallCard({ icon, label, value, hint }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center gap-2 text-sm text-white/60">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-white/50">{hint}</div>
    </div>
  );
}

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
        setError(err?.message || "Monitoring unavailable. Showing demo monitoring data.");
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
    () => security.filter((item) =>
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

  return (
    <div className="space-y-6 rounded-[28px] border border-white/10 bg-[linear-gradient(120deg,rgba(15,25,42,0.9),rgba(18,31,39,0.8))] p-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="text-sm uppercase tracking-[0.24em] text-white/45">
            Operations
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
            Monitoring & Security
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Production-readiness monitoring for TrustLoop, including service health,
            indexer visibility, latency tracking, and security checklist coverage
            across Stellar Testnet validation flows.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className={`rounded-2xl border px-4 py-2 text-sm ${statusTone(monitoring.status)}`}>
            {usingFallback ? "Demo monitoring active" : monitoring.status}
          </div>
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
            {operationalServices}/{monitoring.services?.length || 0} services healthy
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SmallCard
          icon={<Server size={17} />}
          label="API uptime"
          value={`${uptimeMinutes}m`}
          hint="Current monitored runtime window"
        />
        <SmallCard
          icon={<Radar size={17} />}
          label="Average latency"
          value={`${monitoring.avgLatencyMs || 0}ms`}
          hint="Observed response latency"
        />
        <SmallCard
          icon={<Database size={17} />}
          label="Indexed events"
          value={indexer.indexedEvents || 0}
          hint="Tracked trust loop and event activity"
        />
        <SmallCard
          icon={<ShieldCheck size={17} />}
          label="Security checks"
          value={`${completedSecurityChecks}/${security.length}`}
          hint="Checklist completion status"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Activity size={16} />
            Monitoring mode
          </div>
          <div className="mt-3 text-lg font-semibold text-white">
            Testnet-backed operational visibility
          </div>
          <div className="mt-1 text-sm text-white/50">
            Includes service health, indexer sync, and controlled demo validation.
          </div>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <CheckCircle2 size={16} />
            Readiness summary
          </div>
          <div className="mt-3 text-lg font-semibold text-white">
            {completedSecurityChecks >= 5 ? "Strong security posture" : "Partial security completion"}
          </div>
          <div className="mt-1 text-sm text-white/50">
            Based on current checklist completion and service health signals.
          </div>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <ShieldCheck size={16} />
            Indexing source
          </div>
          <div className="mt-3 text-lg font-semibold text-white">
            {indexer.source || "Stellar Testnet"}
          </div>
          <div className="mt-1 text-sm text-white/50">
            Event data is monitored and surfaced for dashboard and review flows.
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <section className="rounded-[24px] border border-white/10 bg-black/15 p-5">
          <div className="text-lg font-semibold text-white">Service status</div>
          <div className="mt-2 text-sm text-white/50">
            Core runtime services involved in the production-readiness demo.
          </div>

          <div className="mt-4 space-y-3">
            {(monitoring.services || []).map((service) => (
              <div
                key={service.name}
                className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
              >
                <div>
                  <div className="font-medium text-white">{service.name}</div>
                  <div className="text-sm text-white/55">{service.detail}</div>
                </div>
                <div
                  className={`rounded-full border px-3 py-1 text-xs ${statusTone(service.status)}`}
                >
                  {service.status}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-black/15 p-5">
          <div className="text-lg font-semibold text-white">Indexer visibility</div>
          <div className="mt-2 text-sm text-white/50">
            Current indexing status for trust loops and related events.
          </div>

          <div className="mt-4 space-y-4 text-sm text-white/70">
            <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
              <div className="text-white/50">Source</div>
              <div className="mt-1 text-white">{indexer.source || "-"}</div>
            </div>

            <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
              <div className="text-white/50">Last sync</div>
              <div className="mt-1 text-white">{indexer.lastSyncedAt || "-"}</div>
            </div>

            <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
              <div className="text-white/50">Indexed loops</div>
              <div className="mt-1 text-white">{indexer.indexedLoops || 0}</div>
            </div>

            <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
              <div className="text-white/50">Indexed events</div>
              <div className="mt-1 text-white">{indexer.indexedEvents || 0}</div>
            </div>

            <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
              <div className="text-white/50">Backfill queue</div>
              <div className="mt-1 text-white">{indexer.pendingBackfill ?? 0}</div>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-[24px] border border-white/10 bg-black/15 p-5">
        <div className="text-lg font-semibold text-white">Security checklist</div>
        <div className="mt-2 text-sm text-white/50">
          Readiness items covering validation, wallet safety, and operational safeguards.
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {security.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
            >
              <span className="text-sm text-white/75">{item.label}</span>
              <span className={`rounded-full border px-3 py-1 text-xs ${statusTone(item.status)}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {monitoring.alerts?.length ? (
        <section className="rounded-[24px] border border-amber-400/15 bg-amber-500/[0.06] p-5">
          <div className="flex items-center gap-2 text-lg font-semibold text-white">
            <AlertTriangle size={18} />
            Active alerts
          </div>
          <div className="mt-2 text-sm text-white/60">
            Operational notices surfaced during monitoring and demo validation.
          </div>

          <div className="mt-4 space-y-3">
            {monitoring.alerts.map((alert) => (
              <div key={alert.title} className="rounded-2xl bg-black/15 px-4 py-3">
                <div className="font-medium text-white">{alert.title}</div>
                <div className="mt-1 text-sm text-white/65">{alert.detail}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 text-sm text-white/55">
        {loading
          ? "Loading monitoring..."
          : usingFallback
          ? "Showing resilient demo monitoring data because live monitoring endpoints are currently unavailable."
          : "Live monitoring data loaded successfully from operations services."}
      </div>
    </div>
  );
}