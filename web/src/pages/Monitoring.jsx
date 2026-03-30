import React, { useEffect, useState } from "react";
import { AlertTriangle, Radar, ShieldCheck, Server } from "lucide-react";
import opsApi from "../services/opsApi";

function statusTone(status) {
  if (status === "up" || status === "operational" || status === "healthy") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  }
  if (status === "degraded") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-100";
  }
  return "border-rose-400/20 bg-rose-400/10 text-rose-100";
}

export default function Monitoring() {
  const [monitoring, setMonitoring] = useState(null);
  const [indexer, setIndexer] = useState(null);
  const [security, setSecurity] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      opsApi.getMonitoring(),
      opsApi.getIndexer(),
      opsApi.getSecurityChecklist(),
    ])
      .then(([monitoringData, indexerData, securityData]) => {
        setMonitoring(monitoringData);
        setIndexer(indexerData);
        setSecurity(Array.isArray(securityData) ? securityData : []);
      })
      .catch((err) => setError(err?.message || "Monitoring unavailable"));
  }, []);

  if (error) return <div className="p-6 text-white">{error}</div>;
  if (!monitoring || !indexer) return <div className="p-6 text-white">Loading monitoring...</div>;

  return (
    <div className="space-y-6 rounded-[28px] border border-white/10 bg-[linear-gradient(120deg,rgba(15,25,42,0.9),rgba(18,31,39,0.8))] p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm uppercase tracking-[0.24em] text-white/45">Operations</div>
          <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
            Monitoring & Security
          </div>
        </div>
        <div
          className={`rounded-2xl border px-4 py-2 text-sm ${statusTone(
            monitoring.status
          )}`}
        >
          {monitoring.status}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Server size={17} />
            API uptime
          </div>
          <div className="mt-3 text-3xl font-semibold text-white">
            {Math.round((monitoring.uptimeSeconds || 0) / 60)}m
          </div>
        </div>
        <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Radar size={17} />
            Average latency
          </div>
          <div className="mt-3 text-3xl font-semibold text-white">
            {monitoring.avgLatencyMs || 0}ms
          </div>
        </div>
        <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <ShieldCheck size={17} />
            Indexed events
          </div>
          <div className="mt-3 text-3xl font-semibold text-white">
            {indexer.indexedEvents || 0}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <section className="rounded-[24px] border border-white/10 bg-black/15 p-5">
          <div className="text-lg font-semibold text-white">Service status</div>
          <div className="mt-4 space-y-3">
            {monitoring.services?.map((service) => (
              <div
                key={service.name}
                className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
              >
                <div>
                  <div className="font-medium text-white">{service.name}</div>
                  <div className="text-sm text-white/55">{service.detail}</div>
                </div>
                <div className={`rounded-full border px-3 py-1 text-xs ${statusTone(service.status)}`}>
                  {service.status}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-black/15 p-5">
          <div className="text-lg font-semibold text-white">Indexer visibility</div>
          <div className="mt-4 space-y-4 text-sm text-white/70">
            <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
              <div className="text-white/50">Source</div>
              <div className="mt-1 text-white">{indexer.source}</div>
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
              <div className="text-white/50">Backfill queue</div>
              <div className="mt-1 text-white">{indexer.pendingBackfill ?? 0}</div>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-[24px] border border-white/10 bg-black/15 p-5">
        <div className="text-lg font-semibold text-white">Security checklist</div>
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
    </div>
  );
}
