import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Timer, ShieldCheck, Users, AlertCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { trustloopApi } from "../services/trustloopApi";
import CreateLoopModal from "../features/trustloops/CreateLoopModal.jsx";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function SkeletonLoader() {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(90deg,rgba(18,41,36,0.5),rgba(20,21,30,0.92)_52%,rgba(32,22,40,0.78))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl animate-fade-in">
      <div className="space-y-4">
        <div className="h-14 rounded-[18px] bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-shimmer" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-24 rounded-[22px] bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-shimmer" />
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="h-64 rounded-[24px] bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-shimmer" />
          ))}
        </div>
        <div className="h-80 rounded-[24px] bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-shimmer" />
      </div>
    </div>
  );
}

function StatPill({ icon, label, value, active = false }) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-[18px] border px-5 py-4 text-left transition",
        active ? "border-white/25 ring-1 ring-white/15 bg-white/5" : "border-white/10 bg-white/5",
      )}
    >
      <div className="flex items-center gap-2 text-[0.95rem] text-white/60">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="mt-2 text-[1.1rem] font-semibold text-white">{value}</div>
    </button>
  );
}

function statusBadge(status) {
  const base = "inline-flex items-center rounded-xl border px-3 py-1.5 text-sm font-semibold";
  switch (status) {
    case "Active":
      return `${base} border-emerald-400/20 bg-emerald-400/15 text-emerald-200`;
    case "Pending":
      return `${base} border-cyan-400/20 bg-cyan-400/15 text-cyan-200`;
    case "Completed":
      return `${base} border-fuchsia-500/20 bg-fuchsia-500/15 text-fuchsia-200`;
    default:
      return `${base} border-white/10 bg-white/10 text-white/70`;
  }
}

function scoreBadge(score) {
  return cn(
    "inline-flex items-center rounded-xl border px-3 py-1.5 text-sm font-semibold",
    score >= 70
      ? "border-emerald-400/20 bg-emerald-400/15 text-emerald-200"
      : score >= 40
      ? "border-cyan-400/20 bg-cyan-400/15 text-cyan-200"
      : "border-rose-500/20 bg-rose-500/15 text-rose-200",
  );
}

export default function Dashboard() {
  const [loops, setLoops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [userCount, setUserCount] = useState(0);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const [loopsData, profiles] = await Promise.all([
        trustloopApi.getLoops(),
        trustloopApi.listOnboardingProfiles(),
      ]);
      setLoops(Array.isArray(loopsData) ? loopsData : []);
      setUserCount(Array.isArray(profiles) ? profiles.length : 0);
      setWalletAddress(window?.stellarWalletAddress || null);
    } catch (e) {
      console.error("[Dashboard] load error", e);
      setError(e?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredLoops = useMemo(() => {
    return loops.slice(0, 6);
  }, [loops]);

  const overviewStats = useMemo(() => {
    const active = loops.filter((loop) => loop.status === "Active").length;
    const pending = loops.filter((loop) => loop.status === "Pending").length;
    const completed = loops.filter((loop) => loop.status === "Completed").length;
    const avgScore = loops.length
      ? Math.round(loops.reduce((sum, loop) => sum + Number(loop.score || 0), 0) / loops.length)
      : 0;

    return { active, pending, completed, avgScore };
  }, [loops]);

  const chartData = useMemo(() => {
    const scoreRanges = { "0-30": 0, "31-60": 0, "61-80": 0, "81-100": 0 };
    const statusCounts = { Active: 0, Pending: 0, Completed: 0 };

    loops.forEach((loop) => {
      const score = Number(loop.score) || 0;
      if (score <= 30) scoreRanges["0-30"]++;
      else if (score <= 60) scoreRanges["31-60"]++;
      else if (score <= 80) scoreRanges["61-80"]++;
      else scoreRanges["81-100"]++;

      if (statusCounts[loop.status] !== undefined) {
        statusCounts[loop.status]++;
      }
    });

    return {
      statusDistribution: [
        { name: "Active", value: statusCounts.Active, color: "#3b82f6" },
        { name: "Pending", value: statusCounts.Pending, color: "#6366f1" },
        { name: "Completed", value: statusCounts.Completed, color: "#8b5cf6" },
      ],
      scoreDistribution: Object.entries(scoreRanges).map(([name, value]) => ({
        name,
        value,
        color:
          name === "0-30"
            ? "#64748b"
            : name === "31-60"
            ? "#94a3b8"
            : name === "61-80"
            ? "#cbd5e1"
            : "#e2e8f0",
      })),
    };
  }, [loops]);

  if (loading) return <SkeletonLoader />;

  if (error) {
    const isNetworkError = error.toLowerCase().includes("network") || error.toLowerCase().includes("fetch");
    const title = isNetworkError ? "Connection issue" : "Unable to load dashboard";
    const suggestion = isNetworkError
      ? "Please check your internet connection and try again."
      : "Something went wrong while loading your data.";

    return (
      <div className="p-6">
        <div className="rounded-[24px] border border-red-500/20 bg-red-500/10 p-6 backdrop-blur-xl">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-8 w-8 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-lg font-semibold text-red-200">{title}</div>
              <div className="mt-2 text-red-100/80">{suggestion}</div>
              {!isNetworkError && (
                <div className="mt-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-100/90">
                  Details: {error}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  className="rounded-xl border border-red-400/30 bg-red-400/20 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-400/30 hover:border-red-400/40 focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:ring-offset-2 focus:ring-offset-transparent transition"
                  onClick={load}
                >
                  Try again
                </button>
                <button
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/15 hover:border-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent transition"
                  onClick={() => window.location.reload()}
                >
                  Refresh page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="surface-card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.24em] text-white/50">Dashboard</div>
                <h1 className="mt-2 text-3xl font-semibold text-white">TrustLoop snapshot</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
                  Compact overview of loop health, wallet status, and recent activity.
                </p>
              </div>
              <button
                className="btn-primary hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:ring-offset-2 focus:ring-offset-transparent transition-all"
                onClick={() => setCreateOpen(true)}
              >
                + New Loop
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatPill icon={<Users size={17} />} label="Active" value={overviewStats.active} />
              <StatPill icon={<Timer size={17} />} label="Pending" value={overviewStats.pending} />
              <StatPill icon={<ShieldCheck size={17} />} label="Avg Score" value={`${overviewStats.avgScore}/100`} />
              <StatPill icon={<CheckCircle2 size={17} />} label="Completed" value={overviewStats.completed} />
            </div>
          </div>

          <div className="surface-card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm uppercase tracking-[0.24em] text-white/50">Wallet</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)}` : "No wallet connected"}
                </div>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
                {walletAddress ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="mt-5 grid gap-3">
              <button
                className="btn-secondary w-full hover:bg-white/10 hover:border-white/20 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent transition-all"
                onClick={async () => {
                  try {
                    await trustloopApi.restoreMyLocalLoopsToServer();
                    await load();
                  } catch (e) {
                    alert(e?.message || "Restore failed");
                  }
                }}
                title="Browser'daki kaydedilmiş loop/event/approval cache'ini backend'e aktarır"
              >
                Restore local loops
              </button>

              <button
                className="btn-secondary w-full hover:bg-white/10 hover:border-white/20 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent transition-all"
                onClick={async () => {
                  try {
                    const { getConnectedWallet, connectWallet } = await import("../services/wallet.js");
                    const existing = await getConnectedWallet().catch(() => null);
                    if (existing) {
                      alert(`Wallet already connected:\n${existing.slice(0, 8)}...${existing.slice(-6)}`);
                      return;
                    }
                    const address = await connectWallet();
                    if (address) {
                      setWalletAddress(address);
                      alert(`Wallet connected:\n${address.slice(0, 8)}...${address.slice(-6)}`);
                    }
                  } catch (e) {
                    alert(e?.message || "Wallet connection failed");
                  }
                }}
              >
                Manage wallet
              </button>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 text-sm text-white/60">
                Quick wallet and trust loop controls from one place.
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <div className="surface-card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm uppercase tracking-[0.24em] text-white/50">Analytics</div>
                <div className="mt-2 text-lg font-semibold text-white">Status distribution</div>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
                {loops.length} total
              </span>
            </div>
            <div className="mt-6 h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.statusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" />
                  <YAxis stroke="rgba(255,255,255,0.4)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.88)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "white",
                    }}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {chartData.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="surface-card p-6">
            <div className="text-sm uppercase tracking-[0.24em] text-white/50">Score range</div>
            <div className="mt-5 grid gap-3">
              {chartData.scoreDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </div>
                  <span className="font-medium text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="surface-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.24em] text-white/50">Recent loops</div>
              <div className="mt-2 text-lg font-semibold text-white">Latest activity</div>
            </div>
            <Link
              to="/loops"
              className="btn-secondary hover:bg-white/10 hover:border-white/20 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent transition-all"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed text-left text-sm text-white/90">
              <thead className="bg-white/[0.04] text-white/65">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Counterparty</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoops.map((loop) => (
                  <tr key={loop.id} className="border-t border-white/10 hover:bg-white/[0.04] transition">
                    <td className="px-4 py-3 font-semibold">{loop.id}</td>
                    <td className="px-4 py-3 text-white/80 truncate">{loop.counterparty}</td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(loop.status)}>{loop.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={scoreBadge(Number(loop.score) || 0)}>{loop.score}/100</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/loops/${loop.id}`}
                        className="rounded-[18px] border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-medium hover:bg-white/15 hover:border-white/20 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent transition-all"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {!filteredLoops.length && (
                  <tr>
                    <td className="px-4 py-8 text-center text-white/60" colSpan={5}>
                      No loops found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-white/10 px-4 py-3 text-sm text-white/50 bg-white/5">
            {userCount} users onboarded
          </div>
        </div>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setCreateOpen(false)} />
          <div className="relative w-full max-w-2xl px-4">
            <CreateLoopModal
              onClose={() => setCreateOpen(false)}
              onCreated={async () => {
                setCreateOpen(false);
                await load();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
