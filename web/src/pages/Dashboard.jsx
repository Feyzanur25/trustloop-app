// web/src/pages/Dashboard.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Bell,
  ChevronDown,
  CheckCircle2,
  Timer,
  ShieldCheck,
  Users,
} from "lucide-react";

import { trustloopApi } from "../services/trustloopApi";
import CreateLoopModal from "../features/trustloops/CreateLoopModal.jsx"; // ✅ default import

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function StatPill({ icon, label, value }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-white/60">
        <span className="text-white/60">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function statusBadge(status) {
  const base =
    "inline-flex items-center rounded-lg px-2 py-1 text-xs font-semibold border";
  switch (status) {
    case "Active":
      return `${base} bg-emerald-400/15 text-emerald-200 border-emerald-400/20`;
    case "Pending":
      return `${base} bg-cyan-400/15 text-cyan-200 border-cyan-400/20`;
    case "Completed":
      return `${base} bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/20`;
    case "Expired":
    default:
      return `${base} bg-rose-500/15 text-rose-200 border-rose-500/20`;
  }
}

export default function Dashboard() {
  const [loops, setLoops] = useState([]);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");

  // satır bazlı "busy"
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const [l, s] = await Promise.all([
        trustloopApi.getLoops(),
        trustloopApi.getStats(),
      ]);

      setLoops(Array.isArray(l) ? l : []);
      setStats(s || null);
    } catch (e) {
      setError(e?.message || "Fetch failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredLoops = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return loops;

    return loops.filter((l) => {
      const s = `${l.id} ${l.counterparty} ${l.role} ${l.status} ${l.lastEvent}`.toLowerCase();
      return s.includes(needle);
    });
  }, [loops, query]);

  const onConfirm = async (id) => {
    setError(null);
    setBusyId(id);
    try {
      // Eğer senin API'de confirmLoop yoksa bu butonu kaldır.
      await trustloopApi.confirmLoop(id);
      await load();
    } catch (e) {
      setError(e?.message || "Confirm failed");
    } finally {
      setBusyId(null);
    }
  };

  const onCloseLoop = async (id) => {
    setError(null);
    setBusyId(id);
    try {
      // Eğer senin API'de closeLoop yoksa bu butonu kaldır.
      await trustloopApi.closeLoop(id);
      await load();
    } catch (e) {
      setError(e?.message || "Close failed");
    } finally {
      setBusyId(null);
    }
  };

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

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
        {/* top bar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-[420px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
              size={18}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
              placeholder="Search loops, addresses, events..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10">
              <Bell size={18} />
            </button>

            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10">
              <div className="h-7 w-7 rounded-full bg-white/15 border border-white/10" />
              <div className="text-sm">Your Wallet</div>
              <ChevronDown size={16} className="text-white/60" />
            </button>

            <button
              className="rounded-xl bg-emerald-400/20 border border-emerald-400/30 px-4 py-2 text-sm font-semibold hover:bg-emerald-400/25"
              onClick={() => setCreateOpen(true)}
            >
              New Loop
            </button>
          </div>
        </div>

        {/* overview */}
        <div className="mt-6">
          <div className="text-lg font-semibold">Overview</div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm text-white/70">
              On-chain trust signals derived from confirmations & events.
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatPill
                icon={<Users size={16} />}
                label="Active Loops"
                value={`${stats?.activeLoops ?? 0}`}
              />
              <StatPill
                icon={<Timer size={16} />}
                label="Pending"
                value={`${stats?.pending ?? 0}`}
              />
              <StatPill
                icon={<ShieldCheck size={16} />}
                label="Avg Score"
                value={`${stats?.avgScore ?? 0}/100`}
              />
              <StatPill
                icon={<CheckCircle2 size={16} />}
                label="Completed"
                value={`${stats?.completed ?? 0}`}
              />
            </div>
          </div>
        </div>

        {/* table */}
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-base font-semibold">Your TrustLoops</div>
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              onClick={() => setCreateOpen(true)}
            >
              + Create Loop
            </button>
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">ID</th>
                  <th className="px-4 py-3 text-left font-medium">Counterparty</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Score</th>
                  <th className="px-4 py-3 text-left font-medium">Expires</th>
                  <th className="px-4 py-3 text-left font-medium">Last Event</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredLoops.map((l) => {
                  const isBusy = busyId === l.id;

                  return (
                    <tr
                      key={l.id}
                      className="border-t border-white/10 hover:bg-white/5"
                    >
                      <td className="px-4 py-3 font-semibold">{l.id}</td>

                      <td className="px-4 py-3 text-white/85">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-white/10 border border-white/10" />
                          {l.counterparty}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-white/85">{l.role}</td>

                      <td className="px-4 py-3">
                        <span className={statusBadge(l.status)}>{l.status}</span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-lg px-2 py-1 text-xs font-semibold border",
                            l.score >= 70
                              ? "bg-emerald-400/15 text-emerald-200 border-emerald-400/20"
                              : l.score >= 40
                              ? "bg-cyan-400/15 text-cyan-200 border-cyan-400/20"
                              : "bg-rose-500/15 text-rose-200 border-rose-500/20"
                          )}
                        >
                          {l.score}/100
                        </span>
                      </td>

                      <td className="px-4 py-3 text-white/85">
                        {l.expiresInDays > 0 ? `${l.expiresInDays} days` : "—"}
                      </td>

                      <td className="px-4 py-3 text-white/70">{l.lastEvent}</td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/loops/${l.id}`}
                            className="inline-flex rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                          >
                            View
                          </Link>

                          {l.status === "Pending" ? (
                            <button
                              disabled={isBusy}
                              onClick={() => onConfirm(l.id)}
                              className={cn(
                                "inline-flex rounded-xl px-3 py-1.5 text-xs font-semibold border",
                                isBusy
                                  ? "bg-white/5 border-white/10 text-white/40 cursor-not-allowed"
                                  : "bg-emerald-400/20 border-emerald-400/30 hover:bg-emerald-400/25"
                              )}
                              title="Confirm (Pending → Active)"
                            >
                              {isBusy ? "Confirming…" : "Confirm"}
                            </button>
                          ) : null}

                          {l.status === "Active" ? (
                            <button
                              disabled={isBusy}
                              onClick={() => onCloseLoop(l.id)}
                              className={cn(
                                "inline-flex rounded-xl px-3 py-1.5 text-xs font-semibold border",
                                isBusy
                                  ? "bg-white/5 border-white/10 text-white/40 cursor-not-allowed"
                                  : "bg-fuchsia-500/15 border-fuchsia-500/20 hover:bg-fuchsia-500/20"
                              )}
                              title="Close (Active → Completed)"
                            >
                              {isBusy ? "Closing…" : "Close"}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!filteredLoops.length ? (
                  <tr className="border-t border-white/10">
                    <td className="px-4 py-6 text-white/60" colSpan={8}>
                      No loops found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-xs text-white/50">
            Now: Confirm/Close actions update loops + events. Next: Soroban events.
          </div>
        </div>
      </div>

      {/* ✅ Modal wrapper */}
      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setCreateOpen(false)}
          />
          <div className="relative">
            <CreateLoopModal
              onClose={() => setCreateOpen(false)}
              onCreated={async () => {
                setCreateOpen(false);
                await load();
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
