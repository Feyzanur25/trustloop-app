import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Clock3, RefreshCcw, Sparkles, ShieldCheck, Repeat } from "lucide-react";
import trustloopApi from "../services/trustloopApi";

function badge(type) {
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border";
  if (type === "trust.created")
    return `${base} bg-emerald-400/15 text-emerald-200 border-emerald-400/20`;
  if (type === "trust.confirmed")
    return `${base} bg-cyan-400/15 text-cyan-200 border-cyan-400/20`;
  if (type === "trust.closed")
    return `${base} bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/20`;
  return `${base} bg-white/5 text-white/70 border-white/10`;
}

function StatCard({ label, value, detail, accent }) {
  return (
    <div className={`rounded-[28px] border border-white/10 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.16)] ${accent}`}>
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/60">{label}</p>
      <div className="mt-4 text-4xl font-semibold text-white">{value}</div>
      <p className="mt-3 text-sm leading-6 text-white/55">{detail}</p>
    </div>
  );
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const ev = await trustloopApi.getEvents();
      setEvents(Array.isArray(ev) ? ev : []);
    } catch (e) {
      setEvents([]);
      setError(e?.message || "Events fetch failed");
    } finally {
      setBusy(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const totals = events.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.type === "trust.created") acc.created += 1;
        if (item.type === "trust.confirmed") acc.confirmed += 1;
        if (item.type === "trust.closed") acc.closed += 1;
        return acc;
      },
      { total: 0, created: 0, confirmed: 0, closed: 0 }
    );
    return totals;
  }, [events]);

  const recentEvents = useMemo(
    () => events.slice(0, 8),
    [events]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-white/10 bg-slate-950/95 p-8 text-center text-white shadow-[0_24px_60px_rgba(0,0,0,0.16)]">
          Loading events…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-white/10 bg-slate-950/95 p-8 shadow-[0_35px_120px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="section-title">Activity</div>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
              TrustLoop event stream and operational insights.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
              Review the most important trust events, track lifecycle state changes, and understand platform flows with a cleaner event feed.
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={load}
            disabled={busy}
          >
            <RefreshCcw size={16} />
            {busy ? "Refreshing…" : "Refresh events"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-100">
          <div className="font-semibold">Event stream unavailable</div>
          <p className="mt-2 text-white/70">{error}</p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard
          label="Total events"
          value={summary.total}
          detail="Recent trust flow activity from Horizon testnet." 
          accent=""
        />
        <StatCard
          label="Created"
          value={summary.created}
          detail="Trust operations started in the current event window."
          accent=""
        />
        <StatCard
          label="Confirmed"
          value={summary.confirmed}
          detail="Trust pairs that reached confirmation status."
          accent=""
        />
        <StatCard
          label="Closed"
          value={summary.closed}
          detail="Completed trust loops with final settlement."
          accent=""
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.95fr]">
        <section className="rounded-[28px] border border-white/10 bg-black/15 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">Event feed</div>
              <h2 className="mt-3 text-2xl font-semibold text-white">Latest trust activity</h2>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
              {events.length} events loaded
            </div>
          </div>

          <div className="mt-6 max-h-[500px] overflow-auto rounded-2xl border border-white/10 bg-black/20">
            <table className="min-w-full text-sm border-separate border-spacing-0">
              <thead className="bg-white/[0.04] text-white/60">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Time</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Type</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Loop</th>
                  <th className="px-4 py-3 text-left font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {events.length ? (
                  events.map((event, idx) => (
                    <tr
                      key={`${event.time}-${event.type}-${idx}`}
                      className="border-t border-white/10 transition hover:bg-white/5"
                    >
                      <td className="px-4 py-4 text-white/80">{event.time || "—"}</td>
                      <td className="px-4 py-4"> <span className={badge(event.type)}>{event.type}</span> </td>
                      <td className="px-4 py-4 text-white/85 font-semibold">{event.loopId || "—"}</td>
                      <td className="px-4 py-4 text-white/60">{event.detail || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-white/10">
                    <td className="px-4 py-6 text-center text-white/60" colSpan={4}>
                      No event activity available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-white/10 bg-black/15 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-white/50">
              <Sparkles size={16} />
              Overview
            </div>
            <p className="mt-4 text-sm leading-6 text-white/65">
              Events are collected from Horizon testnet operations and reflected as trust lifecycle changes for participant loops.
            </p>
            <div className="mt-6 grid gap-3">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                <div className="text-sm text-white/50">Most recent event</div>
                <div className="mt-3 text-white">{recentEvents[0]?.type || "No events"}</div>
                <div className="mt-1 text-xs text-white/45">{recentEvents[0]?.time || "—"}</div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                <div className="text-sm text-white/50">Top loop impacted</div>
                <div className="mt-3 text-white">{recentEvents[0]?.loopId || "—"}</div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                <div className="text-sm text-white/50">Event trend</div>
                <div className="mt-3 flex items-center gap-2 text-white">
                  <Repeat size={16} />
                  <span>{events.length ? "Live activity stream" : "Waiting for activity"}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-cyan-400/15 bg-cyan-500/[0.06] p-6 shadow-[0_24px_60px_rgba(34,211,238,0.14)]">
            <div className="flex items-center gap-3 text-lg font-semibold text-white">
              <Clock3 size={20} />
              Event cadence
            </div>
            <p className="mt-2 text-sm text-white/70">
              Refresh to capture the latest Horizon activity. The event table shows state changes and loop progression for trust events.
            </p>
          </section>
        </aside>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm text-white/55">
        Source: Horizon testnet operations → manage_data events for trust flow monitoring.
      </div>
    </div>
  );
}
