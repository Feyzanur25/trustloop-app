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
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { trustloopApi } from "../services/trustloopApi";
import CreateLoopModal from "../features/trustloops/CreateLoopModal.jsx";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function SortIcon({ column, sortColumn, sortOrder }) {
  if (column !== sortColumn) return <span className="text-white/30">⇅</span>;
  return sortOrder === "asc" ? (
    <span className="text-emerald-400">↑</span>
  ) : (
    <span className="text-emerald-400">↓</span>
  );
}

function SkeletonLoader() {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(90deg,rgba(18,41,36,0.5),rgba(20,21,30,0.92)_52%,rgba(32,22,40,0.78))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl">
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="flex gap-3">
          <div className="h-11 w-full rounded-[18px] bg-white/5 animate-shimmer" />
          <div className="h-11 w-40 rounded-[18px] bg-white/5 animate-shimmer" />
        </div>

        {/* Stats Pills Skeleton */}
        <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-[18px] border border-white/10 bg-white/5 p-5 animate-shimmer"
              style={{ height: "100px" }}
            />
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="rounded-[24px] border border-white/10 bg-white/5 p-5 animate-shimmer"
              style={{ height: "350px" }}
            />
          ))}
        </div>

        {/* Timeline Skeleton */}
        <div className="mt-8 rounded-[24px] border border-white/10 bg-white/5 p-5 animate-shimmer" style={{ height: "300px" }} />

        {/* Table Skeleton */}
        <div className="mt-8 space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-lg bg-white/5 animate-shimmer"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatPill({ icon, label, value, tone = "default", active = false, onClick }) {
  const toneClass =
    tone === "completed"
      ? "bg-fuchsia-500/[0.07]"
      : "bg-emerald-400/[0.04]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[18px] border px-5 py-4 text-left transition",
        toneClass,
        active ? "border-white/25 ring-1 ring-white/15" : "border-white/10"
      )}
    >
      <div className="flex items-center gap-2 text-[0.95rem] text-white/60">
        <span className="text-white/60">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="mt-2 text-[1.05rem] font-semibold leading-none text-white">
        {value}
      </div>
    </button>
  );
}

function statusBadge(status) {
  const base =
    "inline-flex items-center rounded-xl border px-3 py-1.5 text-sm font-semibold";

  switch (status) {
    case "Active":
      return `${base} border-emerald-400/20 bg-emerald-400/15 text-emerald-200`;
    case "Pending":
      return `${base} border-cyan-400/20 bg-cyan-400/15 text-cyan-200`;
    case "Completed":
      return `${base} border-fuchsia-500/20 bg-fuchsia-500/15 text-fuchsia-200`;
    default:
      return `${base} border-rose-500/20 bg-rose-500/15 text-rose-200`;
  }
}

function scoreBadge(score) {
  return cn(
    "inline-flex items-center rounded-xl border px-3 py-1.5 text-sm font-semibold",
    score >= 70
      ? "border-emerald-400/20 bg-emerald-400/15 text-emerald-200"
      : score >= 40
      ? "border-cyan-400/20 bg-cyan-400/15 text-cyan-200"
      : "border-rose-500/20 bg-rose-500/15 text-rose-200"
  );
}

export default function Dashboard() {
  const [loops, setLoops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [events, setEvents] = useState([]);
  const [sortColumn, setSortColumn] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [notifOpen, setNotifOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const [l, e, w] = await Promise.all([
        trustloopApi.getLoops(),
        trustloopApi.getEvents(),
        (async () => {
          try {
            const { getConnectedWallet } = await import("../services/wallet");
            return await getConnectedWallet();
          } catch {
            return null;
          }
        })(),
      ]);

      const nextLoops = Array.isArray(l) ? l : [];
      const nextEvents = Array.isArray(e) ? e : [];
      setLoops(nextLoops);
      setEvents(nextEvents);
      setWalletAddress(w);
    } catch (e) {
      const errorMsg = e?.message || "Failed to load data";
      console.error("[Dashboard Load Error]", errorMsg, e);
      
      // User-friendly error messages
      if (e?.statusCode === 0) {
        setError("Network error: Cannot connect to API. Make sure the backend is running on http://localhost:4000");
      } else if (e?.statusCode === 404) {
        setError("API endpoint not found");
      } else if (e?.statusCode >= 500) {
        setError("Server error: Backend is experiencing issues");
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const interval = setInterval(() => {
      load();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [load]);

  const filteredLoops = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let result = loops.filter((loop) => {
      const matchesStatus = statusFilter === "all" ? true : loop.status === statusFilter;
      if (!matchesStatus) return false;
      if (!needle) return true;

      const haystack =
        `${loop.id} ${loop.counterparty} ${loop.role} ${loop.status} ${loop.lastEvent}`.toLowerCase();
      return haystack.includes(needle);
    });

    // Apply sorting
    result.sort((a, b) => {
      let aValue = a[sortColumn] || "";
      let bValue = b[sortColumn] || "";

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [loops, query, statusFilter, sortColumn, sortOrder]);

  const overviewStats = useMemo(() => {
    const activeLoops = loops.filter((loop) => loop.status === "Active").length;
    const pending = loops.filter((loop) => loop.status === "Pending").length;
    const completed = loops.filter((loop) => loop.status === "Completed").length;
    const avgScore = loops.length
      ? Math.round(loops.reduce((sum, loop) => sum + (Number(loop.score) || 0), 0) / loops.length)
      : 0;

    return {
      activeLoops,
      pending,
      completed,
      avgScore,
    };
  }, [loops]);

  const chartData = useMemo(() => {
    const scoreRanges = {
      "0-30": 0,
      "31-60": 0,
      "61-80": 0,
      "81-100": 0,
    };
    const statusCounts = {
      Active: 0,
      Pending: 0,
      Completed: 0,
    };

    loops.forEach((loop) => {
      const score = Number(loop.score) || 0;
      if (score <= 30) scoreRanges["0-30"]++;
      else if (score <= 60) scoreRanges["31-60"]++;
      else if (score <= 80) scoreRanges["61-80"]++;
      else scoreRanges["81-100"]++;

      if (loop.status === "Active") statusCounts.Active++;
      else if (loop.status === "Pending") statusCounts.Pending++;
      else if (loop.status === "Completed") statusCounts.Completed++;
    });

    return {
      scoreDistribution: Object.entries(scoreRanges).map(([range, count]) => ({
        name: range,
        value: count,
        color:
          count === 0
            ? "#ffffff20"
            : range === "0-30"
            ? "#ef4444"
            : range === "31-60"
            ? "#f97316"
            : range === "61-80"
            ? "#eab308"
            : "#22c55e",
      })),
      statusDistribution: [
        { name: "Active", value: statusCounts.Active, color: "#10b981" },
        { name: "Pending", value: statusCounts.Pending, color: "#06b6d4" },
        { name: "Completed", value: statusCounts.Completed, color: "#ec4899" },
      ],
    };
  }, [loops]);

  const onConfirm = async (id) => {
    setError(null);
    setBusyId(id);
    try {
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
      await trustloopApi.closeLoop(id);
      await load();
    } catch (e) {
      setError(e?.message || "Close failed");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <SkeletonLoader />;

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-[24px] border border-red-500/20 bg-red-500/10 p-6 backdrop-blur-xl">
          <div className="flex items-start gap-4">
            <div className="text-3xl">⚠️</div>
            <div className="flex-1">
              <div className="text-lg font-semibold text-red-200">Something went wrong</div>
              <div className="mt-2 text-red-100/80">{error}</div>
              <div className="mt-4 flex gap-3">
                <button
                  className="rounded-xl border border-red-400/30 bg-red-400/20 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-400/25 transition"
                  onClick={load}
                >
                  🔄 Retry
                </button>
                <button
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 transition"
                  onClick={() => window.location.reload()}
                >
                  ↻ Reload Page
                </button>
              </div>
              <div className="mt-4 rounded-lg bg-black/30 p-3 text-xs text-white/50 font-mono">
                <div className="mb-1 font-semibold">Troubleshooting:</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check if API is running: http://localhost:4000</li>
                  <li>Frontend should be on http://localhost:5174</li>
                  <li>Check browser console (F12) for more details</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(90deg,rgba(18,41,36,0.5),rgba(20,21,30,0.92)_52%,rgba(32,22,40,0.78))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl animate-fade-in">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-[530px]">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/45"
              size={18}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full rounded-[18px] border border-white/10 bg-black/15 pl-12 pr-4 text-[0.95rem] text-white outline-none placeholder:text-white/35 focus:border-white/20"
              placeholder="Search loops, addresses, events..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={cn(
                  "rounded-[18px] border px-4 py-3 hover:bg-white/[0.09] transition",
                  notifOpen
                    ? "border-emerald-400/30 bg-emerald-400/20"
                    : "border-white/10 bg-white/[0.05]"
                )}
              >
                <div className="relative">
                  <Bell size={18} />
                  {events.length > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                      {Math.min(events.length, 9)}
                    </div>
                  )}
                </div>
              </button>

              {/* Notification Panel */}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-[18px] border border-white/10 bg-black/40 backdrop-blur-xl p-4 shadow-lg z-50">
                  <div className="text-sm font-semibold text-white mb-3">Notifications</div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {events.length > 0 ? (
                      events.slice(0, 5).map((event, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition text-xs"
                        >
                          <div className="font-medium text-white/80">{event.detail}</div>
                          <div className="text-white/50 text-xs mt-1">{event.time}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-white/50 py-4 text-center">No notifications</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Wallet Menu */}
            <div className="relative">
              <button
                onClick={() => setWalletOpen(!walletOpen)}
                className={cn(
                  "flex items-center gap-3 rounded-[18px] border px-4 py-3 hover:bg-white/[0.09] transition",
                  walletOpen
                    ? "border-emerald-400/30 bg-emerald-400/20"
                    : "border-white/10 bg-white/[0.05]"
                )}
              >
                <div className="h-9 w-9 rounded-full border border-white/10 bg-white/10" />
                <div className="text-[0.95rem] font-medium">Your Wallet</div>
                <ChevronDown
                  size={17}
                  className={cn("text-white/60 transition", walletOpen && "rotate-180")}
                />
              </button>

              {/* Wallet Dropdown */}
              {walletOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-[18px] border border-white/10 bg-black/40 backdrop-blur-xl p-4 shadow-lg z-50">
                  <div className="text-sm font-semibold text-white mb-4">Account</div>
                  
                  {walletAddress ? (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-white/5">
                        <div className="text-xs text-white/50 mb-1">Connected Wallet</div>
                        <div className="font-mono text-sm text-emerald-300 break-all">
                          {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                        </div>
                      </div>
                      <button className="w-full px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium text-white transition">
                        Copy Address
                      </button>
                      <button className="w-full px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium text-white transition">
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-white/50 py-4">
                      No wallet connected
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              className="rounded-[18px] border border-emerald-400/30 bg-emerald-400/20 px-6 py-3 text-[0.98rem] font-semibold hover:bg-emerald-400/25"
              onClick={() => setCreateOpen(true)}
            >
              New Loop
            </button>
          </div>
        </div>

        <div className="mt-8">
          <div className="text-[1rem] font-semibold text-white">
            Overview
          </div>
          <div className="mt-5 rounded-[24px] border border-white/10 bg-black/15 p-5">
            <div className="text-[0.95rem] text-white/70">
              On-chain trust signals derived from confirmations & events.
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <StatPill
                icon={<Users size={17} />}
                label="Active Loops"
                value={overviewStats.activeLoops}
                active={statusFilter === "Active"}
                onClick={() =>
                  setStatusFilter((current) => (current === "Active" ? "all" : "Active"))
                }
              />
              <StatPill
                icon={<Timer size={17} />}
                label="Pending"
                value={overviewStats.pending}
                active={statusFilter === "Pending"}
                onClick={() =>
                  setStatusFilter((current) => (current === "Pending" ? "all" : "Pending"))
                }
              />
              <StatPill
                icon={<ShieldCheck size={17} />}
                label="Avg Score"
                value={`${overviewStats.avgScore}/100`}
                active={statusFilter === "all"}
                onClick={() => setStatusFilter("all")}
              />
              <StatPill
                icon={<CheckCircle2 size={17} />}
                label="Completed"
                value={overviewStats.completed}
                tone="completed"
                active={statusFilter === "Completed"}
                onClick={() =>
                  setStatusFilter((current) => (current === "Completed" ? "all" : "Completed"))
                }
              />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="text-[1rem] font-semibold text-white mb-4">
            Analytics
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {/* Score Distribution Chart */}
            <div className="rounded-[24px] border border-white/10 bg-black/15 p-5">
              <div className="text-[0.95rem] font-medium text-white mb-4">Trust Score Distribution</div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData.scoreDistribution.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "white",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2 text-sm">
                {chartData.scoreDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-white/70">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.name}
                    </div>
                    <span className="font-medium text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Distribution Chart */}
            <div className="rounded-[24px] border border-white/10 bg-black/15 p-5">
              <div className="text-[0.95rem] font-medium text-white mb-4">Loops by Status</div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData.statusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" />
                  <YAxis stroke="rgba(255,255,255,0.4)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "white",
                    }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]}>
                    {chartData.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="text-[1rem] font-semibold text-white mb-4">
            Activity Timeline
          </div>
          <div className="rounded-[24px] border border-white/10 bg-black/15 p-5">
            {events.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {events.slice(0, 10).map((event, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 pb-3 border-b border-white/5 last:border-0"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-sm",
                          event.type === "trust.created"
                            ? "bg-blue-500/20 text-blue-300"
                            : event.type === "trust.confirmed"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : event.type === "trust.closed"
                            ? "bg-fuchsia-500/20 text-fuchsia-300"
                            : "bg-amber-500/20 text-amber-300"
                        )}
                      >
                        {event.type === "trust.created"
                          ? "+"
                          : event.type === "trust.confirmed"
                          ? "✓"
                          : event.type === "trust.closed"
                          ? "✕"
                          : "◆"}
                      </div>
                      {idx < events.length - 1 && (
                        <div className="w-0.5 h-6 bg-white/10" />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {event.detail}
                          </div>
                          <div className="text-xs text-white/40 mt-1">
                            {event.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-white/50">
                No events yet
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[1rem] font-semibold text-white">
              Your TrustLoops
            </div>
            <button
              className="self-start rounded-[18px] border border-white/10 bg-white/[0.05] px-5 py-3 text-[0.95rem] hover:bg-white/[0.09] sm:self-auto"
              onClick={() => setCreateOpen(true)}
            >
              + Create Loop
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-black/15">
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed text-left text-sm text-white/90">
                <colgroup>
                  <col className="w-[95px]" />
                  <col className="w-[315px]" />
                  <col className="w-[120px]" />
                  <col className="w-[135px]" />
                  <col className="w-[95px]" />
                  <col className="w-[100px]" />
                  <col className="w-[130px]" />
                  <col className="w-[150px]" />
                </colgroup>
                <thead className="bg-white/[0.04] text-white/65">
                  <tr>
                    <th
                      className="px-5 py-4 text-[0.95rem] font-medium cursor-pointer hover:text-white/85 select-none"
                      onClick={() => {
                        if (sortColumn === "id") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortColumn("id");
                          setSortOrder("asc");
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        ID
                        <SortIcon column="id" sortColumn={sortColumn} sortOrder={sortOrder} />
                      </div>
                    </th>
                    <th
                      className="px-5 py-4 text-[0.95rem] font-medium cursor-pointer hover:text-white/85 select-none"
                      onClick={() => {
                        if (sortColumn === "counterparty") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortColumn("counterparty");
                          setSortOrder("asc");
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        Counterparty
                        <SortIcon column="counterparty" sortColumn={sortColumn} sortOrder={sortOrder} />
                      </div>
                    </th>
                    <th
                      className="px-5 py-4 text-[0.95rem] font-medium cursor-pointer hover:text-white/85 select-none"
                      onClick={() => {
                        if (sortColumn === "role") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortColumn("role");
                          setSortOrder("asc");
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        Role
                        <SortIcon column="role" sortColumn={sortColumn} sortOrder={sortOrder} />
                      </div>
                    </th>
                    <th
                      className="px-5 py-4 text-[0.95rem] font-medium cursor-pointer hover:text-white/85 select-none"
                      onClick={() => {
                        if (sortColumn === "status") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortColumn("status");
                          setSortOrder("asc");
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        <SortIcon column="status" sortColumn={sortColumn} sortOrder={sortOrder} />
                      </div>
                    </th>
                    <th
                      className="px-5 py-4 text-[0.95rem] font-medium cursor-pointer hover:text-white/85 select-none"
                      onClick={() => {
                        if (sortColumn === "score") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortColumn("score");
                          setSortOrder("desc");
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        Score
                        <SortIcon column="score" sortColumn={sortColumn} sortOrder={sortOrder} />
                      </div>
                    </th>
                    <th
                      className="px-5 py-4 text-[0.95rem] font-medium cursor-pointer hover:text-white/85 select-none"
                      onClick={() => {
                        if (sortColumn === "expiresInDays") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortColumn("expiresInDays");
                          setSortOrder("asc");
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        Expires
                        <SortIcon column="expiresInDays" sortColumn={sortColumn} sortOrder={sortOrder} />
                      </div>
                    </th>
                    <th className="px-5 py-4 text-[0.95rem] font-medium">Last Event</th>
                    <th className="px-5 py-4 text-right text-[0.95rem] font-medium">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLoops.map((loop) => {
                    const isBusy = busyId === loop.id;

                    return (
                      <tr
                        key={loop.id}
                        className="border-t border-white/10 hover:bg-white/[0.03]"
                      >
                        <td className="px-5 py-4 text-[0.95rem] font-semibold">
                          {loop.id}
                        </td>

                        <td className="px-5 py-4 text-[0.95rem] text-white/85">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="h-9 w-9 rounded-full border border-white/10 bg-white/10" />
                            <span className="truncate">{loop.counterparty}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-[0.95rem] text-white/85">
                          {loop.role}
                        </td>

                        <td className="px-5 py-4">
                          <span className={statusBadge(loop.status)}>
                            {loop.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className={scoreBadge(loop.score)}>
                            {loop.score}/100
                          </span>
                        </td>

                        <td className="px-5 py-4 text-[0.95rem] text-white/85">
                          {loop.expiresInDays > 0 ? `${loop.expiresInDays} days` : "14 days"}
                        </td>

                        <td className="px-5 py-4 text-[0.95rem] text-white/65">
                          <span className="block truncate">{loop.lastEvent}</span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-3">
                            <Link
                              to={`/loops/${loop.id}`}
                              className="inline-flex rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium hover:bg-white/[0.09]"
                            >
                              View
                            </Link>

                            {loop.status === "Pending" ? (
                              <button
                                disabled={isBusy}
                                onClick={() => onConfirm(loop.id)}
                                className={cn(
                                  "inline-flex rounded-2xl border px-4 py-2 text-sm font-semibold",
                                  isBusy
                                    ? "cursor-not-allowed border-white/10 bg-white/5 text-white/40"
                                    : "border-emerald-400/30 bg-emerald-400/20 text-white hover:bg-emerald-400/25"
                                )}
                              >
                                {isBusy ? "Confirming..." : "Confirm"}
                              </button>
                            ) : null}

                            {loop.status === "Active" ? (
                              <button
                                disabled={isBusy}
                                onClick={() => onCloseLoop(loop.id)}
                                className={cn(
                                  "inline-flex rounded-2xl border px-4 py-2 text-sm font-semibold",
                                  isBusy
                                    ? "cursor-not-allowed border-white/10 bg-white/5 text-white/40"
                                    : "border-fuchsia-500/20 bg-fuchsia-500/15 text-fuchsia-100 hover:bg-fuchsia-500/20"
                                )}
                              >
                                {isBusy ? "Closing..." : "Close"}
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {!filteredLoops.length ? (
                    <tr className="border-t border-white/10">
                      <td className="px-5 py-8 text-white/60" colSpan={8}>
                        No loops found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 text-sm text-white/45">
            Now: Confirm/Close actions update loops and events. Next: Soroban
            events.
          </div>
        </div>
      </div>

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
