import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Timer, ShieldCheck, Users, Eye } from "lucide-react";

import { trustloopApi } from "../services/trustloopApi";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
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

export default function Loops() {
  const [loops, setLoops] = useState([]);
  const [onboardingProfiles, setOnboardingProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllUsers, setShowAllUsers] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const [loopsData, profilesData] = await Promise.all([
        trustloopApi.getLoops(),
        trustloopApi.listOnboardingProfiles(),
      ]);
      setLoops(Array.isArray(loopsData) ? loopsData : []);
      setOnboardingProfiles(Array.isArray(profilesData) ? profilesData : []);
    } catch (e) {
      console.error("[Loops] load error", e);
      setError(e?.message || "Failed to load loops");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const overviewStats = useMemo(() => {
    const active = loops.filter((loop) => loop.status === "Active").length;
    const pending = loops.filter((loop) => loop.status === "Pending").length;
    const completed = loops.filter((loop) => loop.status === "Completed").length;
    const avgScore = loops.length
      ? Math.round(loops.reduce((sum, loop) => sum + Number(loop.score || 0), 0) / loops.length)
      : 0;

    return { active, pending, completed, avgScore };
  }, [loops]);

  const loopIdByWallet = useMemo(() => {
    return loops.reduce((acc, loop) => {
      const wallet = String(loop.linkedWalletAddress || loop.counterparty || "").trim();
      if (wallet && !acc[wallet]) {
        acc[wallet] = loop.id;
      }
      return acc;
    }, {});
  }, [loops]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(90deg,rgba(18,41,36,0.5),rgba(20,21,30,0.92)_52%,rgba(32,22,40,0.78))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl">
          <div className="space-y-4">
            <div className="h-14 rounded-[18px] bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-shimmer" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-24 rounded-[22px] bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-shimmer" />
              ))}
            </div>
            <div className="h-80 rounded-[24px] bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isNetworkError = error.toLowerCase().includes("network") || error.toLowerCase().includes("fetch");
    const title = isNetworkError ? "Connection issue" : "Unable to load loops";
    const suggestion = isNetworkError
      ? "Please check your internet connection and try again."
      : "Something went wrong while loading your data.";

    return (
      <div className="p-6">
        <div className="rounded-[24px] border border-red-500/20 bg-red-500/10 p-6 backdrop-blur-xl">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🔍</div>
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
                  className="rounded-xl border border-red-400/30 bg-red-400/20 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-400/25 transition"
                  onClick={load}
                >
                  Try again
                </button>
                <button
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 transition"
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
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(90deg,rgba(18,41,36,0.5),rgba(20,21,30,0.92)_52%,rgba(32,22,40,0.78))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.24em] text-white/50">Loops</div>
            <h1 className="mt-2 text-3xl font-semibold text-white">All trust loops</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
              Complete list of all trust loops with status and scores.
            </p>
          </div>
          <Link to="/" className="btn-secondary">
            Back to dashboard
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[18px] border border-white/10 bg-white/5 px-5 py-4">
            <div className="flex items-center gap-2 text-[0.95rem] text-white/60">
              <Users size={17} />
              <span>Active</span>
            </div>
            <div className="mt-2 text-[1.1rem] font-semibold text-white">{overviewStats.active}</div>
          </div>
          <div className="rounded-[18px] border border-white/10 bg-white/5 px-5 py-4">
            <div className="flex items-center gap-2 text-[0.95rem] text-white/60">
              <Timer size={17} />
              <span>Pending</span>
            </div>
            <div className="mt-2 text-[1.1rem] font-semibold text-white">{overviewStats.pending}</div>
          </div>
          <div className="rounded-[18px] border border-white/10 bg-white/5 px-5 py-4">
            <div className="flex items-center gap-2 text-[0.95rem] text-white/60">
              <ShieldCheck size={17} />
              <span>Avg Score</span>
            </div>
            <div className="mt-2 text-[1.1rem] font-semibold text-white">{overviewStats.avgScore}/100</div>
          </div>
          <div className="rounded-[18px] border border-white/10 bg-white/5 px-5 py-4">
            <div className="flex items-center gap-2 text-[0.95rem] text-white/60">
              <CheckCircle2 size={17} />
              <span>Completed</span>
            </div>
            <div className="mt-2 text-[1.1rem] font-semibold text-white">{overviewStats.completed}</div>
          </div>
        </div>
      </div>

      <div className="surface-card overflow-hidden">
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
              {loops.map((loop) => (
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
              {!loops.length && (
                <tr>
                  <td className="px-4 py-8 text-center text-white/60" colSpan={5}>
                    No loops found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-white/10 px-4 py-3 text-sm text-white/50 bg-white/5 flex items-center justify-between">
          <span>Showing all {loops.length} loops</span>
          <button
            onClick={() => setShowAllUsers(!showAllUsers)}
            className="inline-flex items-center gap-2 rounded-[18px] border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-medium hover:bg-white/15 hover:border-white/20 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent transition-all"
          >
            <Eye size={14} />
            {showAllUsers ? "Hide All Users" : "View All Users"}
          </button>
        </div>
      </div>

      {showAllUsers && (
        <div className="surface-card overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">All Users ({onboardingProfiles.length})</h3>
            <p className="mt-1 text-sm text-white/60">Complete list of all registered users with their loop IDs</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed text-left text-sm text-white/90">
              <thead className="bg-white/[0.04] text-white/65">
                <tr>
                  <th className="px-4 py-3">Loop ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Wallet Address</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Feedback</th>
                </tr>
              </thead>
              <tbody>
                {onboardingProfiles.map((profile) => {
                  const loopId = loopIdByWallet[String(profile.walletAddress || "").trim()] || "-";
                  return (
                    <tr key={profile.id || loopId} className="border-t border-white/10 hover:bg-white/[0.04] transition">
                      <td className="px-4 py-3 font-semibold text-cyan-300">{loopId}</td>
                      <td className="px-4 py-3 text-white/90 font-medium">{profile.name}</td>
                      <td className="px-4 py-3 text-white/70 truncate">{profile.email}</td>
                      <td className="px-4 py-3 text-white/70 font-mono text-xs truncate">{profile.walletAddress}</td>
                      <td className="px-4 py-3">
                        <span className={scoreBadge(Number(profile.productRating) || 0)}>
                          {profile.productRating}/5
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/70 truncate max-w-xs">{profile.feedback}</td>
                    </tr>
                  );
                })}
                {!onboardingProfiles.length && (
                  <tr>
                    <td className="px-4 py-8 text-center text-white/60" colSpan={6}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-white/10 px-4 py-3 text-sm text-white/50 bg-white/5">
            Total {onboardingProfiles.length} users registered
          </div>
        </div>
      )}
    </div>
  );
}
