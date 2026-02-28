// src/pages/LoopDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { trustloopApi } from "../services/trustloopApi";

export default function LoopDetail() {
  const { id } = useParams();
  const [loops, setLoops] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const [l, e] = await Promise.all([
        trustloopApi.getLoops(),
        trustloopApi.getEvents(),
      ]);
      setLoops(Array.isArray(l) ? l : []);
      setEvents(Array.isArray(e) ? e : []);
    } catch (err) {
      setError(err?.message || "Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const loop = useMemo(() => loops.find((x) => x.id === id), [loops, id]);
  const loopEvents = useMemo(
    () => events.filter((e) => e.loopId === id),
    [events, id]
  );

  if (loading) return <div className="p-6 text-white">Loading…</div>;

  if (error) {
    return (
      <div className="p-6 text-white">
        <div className="text-lg font-semibold">Error</div>
        <div className="mt-2 text-white/70">{error}</div>
        <button
          className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          onClick={load}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!loop) {
    return (
      <div className="p-6 text-white">
        <div className="text-lg font-semibold">Loop not found</div>
        <div className="mt-2 text-white/70">ID: {id}</div>
        <Link
          to="/"
          className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
        >
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">{loop.id}</div>
          <div className="text-sm text-white/70">
            {loop.counterparty} • {loop.role} • {loop.status}
          </div>
        </div>
        <Link
          to="/"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
        >
          Back
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl bg-black/20 border border-white/10 p-3">
          <div className="text-xs text-white/60">Score</div>
          <div className="mt-1 font-semibold">{loop.score}/100</div>
        </div>
        <div className="rounded-xl bg-black/20 border border-white/10 p-3">
          <div className="text-xs text-white/60">Expires</div>
          <div className="mt-1 font-semibold">{loop.expires || "—"}</div>
        </div>
        <div className="rounded-xl bg-black/20 border border-white/10 p-3">
          <div className="text-xs text-white/60">Last Event</div>
          <div className="mt-1 font-semibold">{loop.lastEvent || "—"}</div>
        </div>
        <div className="rounded-xl bg-black/20 border border-white/10 p-3">
          <div className="text-xs text-white/60">Tx Hash</div>
          <div className="mt-1 font-semibold break-all text-white/80">
            {loop.txHash || "—"}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-base font-semibold">Loop Events</div>
        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Time</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {loopEvents.map((e, idx) => (
                <tr key={`${e.time}-${idx}`} className="border-t border-white/10">
                  <td className="px-4 py-3 text-white/80">{e.time}</td>
                  <td className="px-4 py-3 text-white/85">{e.type}</td>
                  <td className="px-4 py-3 text-white/70">{e.detail}</td>
                </tr>
              ))}
              {!loopEvents.length ? (
                <tr className="border-t border-white/10">
                  <td className="px-4 py-6 text-white/60" colSpan={3}>
                    No events found for this loop yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}