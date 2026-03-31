// web/src/pages/Events.jsx
import React, { useCallback, useEffect, useState } from "react";
import trustloopApi from "../services/trustloopApi";



function badge(type) {
  const base =
    "inline-flex items-center rounded-lg px-2 py-1 text-xs font-semibold border";
  if (type === "trust.created")
    return `${base} bg-emerald-400/15 text-emerald-200 border-emerald-400/20`;
  if (type === "trust.confirmed")
    return `${base} bg-cyan-400/15 text-cyan-200 border-cyan-400/20`;
  if (type === "trust.closed")
    return `${base} bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/20`;
  return `${base} bg-white/5 text-white/70 border-white/10`;
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

  if (loading) {
    return <div className="p-6 text-white">Loading…</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-white">
        <div className="text-lg font-semibold">Error</div>
        <div className="mt-2 text-white/70">{error}</div>
        <button
          className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          onClick={load}
          disabled={busy}
        >
          {busy ? "Refreshing…" : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Events</div>
        <button
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-60"
          onClick={load}
          disabled={busy}
        >
          {busy ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/70">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Time</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Loop</th>
              <th className="px-4 py-3 text-left font-medium">Detail</th>
            </tr>
          </thead>

          <tbody>
            {events.map((e, idx) => (
              <tr
                key={`${e.time}-${e.type}-${idx}`}
                className="border-t border-white/10 hover:bg-white/5"
              >
                <td className="px-4 py-3 text-white/80">{e.time || "—"}</td>

                <td className="px-4 py-3">
                  <span className={badge(e.type)}>{e.type}</span>
                </td>

                <td className="px-4 py-3 text-white/85 font-semibold">
                  {e.loopId || "—"}
                </td>

                <td className="px-4 py-3 text-white/70">{e.detail || "—"}</td>
              </tr>
            ))}

            {!events.length ? (
              <tr className="border-t border-white/10">
                <td className="px-4 py-6 text-white/60" colSpan={4}>
                  No events yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-white/50">
        Source: Horizon testnet account operations → manage_data (trust.*)
      </div>
    </div>
  );
}