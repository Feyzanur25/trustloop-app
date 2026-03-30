import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, ShieldCheck, TimerReset } from "lucide-react";
import { trustloopApi } from "../services/trustloopApi";

function tone(status) {
  if (status === "Completed") return "border-fuchsia-500/20 bg-fuchsia-500/15 text-fuchsia-100";
  if (status === "Active") return "border-emerald-400/20 bg-emerald-400/15 text-emerald-100";
  return "border-cyan-400/20 bg-cyan-400/15 text-cyan-100";
}

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
      const [loopList, eventList] = await Promise.all([
        trustloopApi.getLoops(),
        trustloopApi.getEvents(),
      ]);
      setLoops(Array.isArray(loopList) ? loopList : []);
      setEvents(Array.isArray(eventList) ? eventList : []);
    } catch (err) {
      setError(err?.message || "Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const loop = useMemo(() => loops.find((item) => item.id === id), [loops, id]);
  const loopEvents = useMemo(
    () => events.filter((item) => item.loopId === id),
    [events, id]
  );

  const onApprove = async (actor) => {
    trustloopApi.approveLoop(id, actor);
    await load();
  };

  const onRevoke = async (actor) => {
    trustloopApi.revokeApproval(id, actor);
    await load();
  };

  if (loading) return <div className="p-6 text-white">Loading...</div>;
  if (error) return <div className="p-6 text-white">{error}</div>;
  if (!loop) {
    return (
      <div className="p-6 text-white">
        <div className="text-lg font-semibold">Loop not found</div>
        <Link
          to="/"
          className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
        >
          Back
        </Link>
      </div>
    );
  }

  const approvals = loop.approvals || {
    clientApproved: false,
    freelancerApproved: false,
    requiredApprovals: 2,
    updatedAt: "-",
  };

  const readyToClose =
    approvals.requiredApprovals === 1 ||
    (approvals.clientApproved && approvals.freelancerApproved);

  return (
    <div className="space-y-6 rounded-[28px] border border-white/10 bg-[linear-gradient(120deg,rgba(16,27,34,0.94),rgba(20,18,34,0.88))] p-6 text-white backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm uppercase tracking-[0.24em] text-white/45">TrustLoop</div>
          <div className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{loop.id}</div>
          <div className="mt-2 text-sm text-white/60">
            {loop.counterparty} · {loop.role} · {loop.status}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`rounded-2xl border px-4 py-2 text-sm ${tone(loop.status)}`}>
            {loop.status}
          </div>
          <Link
            to="/"
            className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm hover:bg-white/[0.08]"
          >
            Back
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
          <div className="text-xs text-white/55">Trust score</div>
          <div className="mt-2 text-2xl font-semibold">{loop.score}/100</div>
        </div>
        <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
          <div className="text-xs text-white/55">Expires in</div>
          <div className="mt-2 text-2xl font-semibold">{loop.expiresInDays || 0} days</div>
        </div>
        <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
          <div className="text-xs text-white/55">Last event</div>
          <div className="mt-2 text-lg font-semibold">{loop.lastEvent || "-"}</div>
        </div>
        <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
          <div className="text-xs text-white/55">Approval policy</div>
          <div className="mt-2 text-lg font-semibold">
            {approvals.requiredApprovals === 2 ? "Dual approval" : "Single approval"}
          </div>
        </div>
      </div>

      <section className="rounded-[24px] border border-white/10 bg-black/15 p-5">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <ShieldCheck size={18} />
          <span>Advanced feature: Multi-party approval workflow</span>
        </div>
        <div className="mt-2 text-sm text-white/60">
          This loop cannot be closed until the required participant approvals are captured.
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-sm font-medium text-white">Client approval</div>
            <div className="mt-2 text-sm text-white/60">
              State: {approvals.clientApproved ? "approved" : "waiting"}
            </div>
            <div className="mt-4 flex gap-3">
              <button
                className="rounded-2xl border border-emerald-400/20 bg-emerald-400/15 px-4 py-2 text-sm"
                onClick={() => onApprove("Client")}
              >
                Approve
              </button>
              <button
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm"
                onClick={() => onRevoke("Client")}
              >
                Revoke
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-sm font-medium text-white">Freelancer approval</div>
            <div className="mt-2 text-sm text-white/60">
              State: {approvals.freelancerApproved ? "approved" : "waiting"}
            </div>
            <div className="mt-4 flex gap-3">
              <button
                className="rounded-2xl border border-emerald-400/20 bg-emerald-400/15 px-4 py-2 text-sm"
                onClick={() => onApprove("Freelancer")}
              >
                Approve
              </button>
              <button
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm"
                onClick={() => onRevoke("Freelancer")}
              >
                Revoke
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-white/[0.04] px-4 py-4">
            <div className="flex items-center gap-2 text-sm text-white/55">
              <CheckCircle2 size={16} />
              Ready to close
            </div>
            <div className="mt-2 text-xl font-semibold">{readyToClose ? "Yes" : "No"}</div>
          </div>
          <div className="rounded-2xl bg-white/[0.04] px-4 py-4">
            <div className="flex items-center gap-2 text-sm text-white/55">
              <TimerReset size={16} />
              Approval sync
            </div>
            <div className="mt-2 text-sm font-medium">{approvals.updatedAt || "-"}</div>
          </div>
          <div className="rounded-2xl bg-white/[0.04] px-4 py-4">
            <div className="text-sm text-white/55">Milestone guardrail</div>
            <div className="mt-2 text-sm font-medium text-white/80">
              Close action is blocked until both sides approve the final state.
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-black/15 p-5">
        <div className="text-lg font-semibold">Loop events</div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-white/55">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {loopEvents.length ? (
                loopEvents.map((event, index) => (
                  <tr key={`${event.time}-${index}`} className="border-t border-white/10">
                    <td className="px-4 py-3 text-white/65">{event.time}</td>
                    <td className="px-4 py-3">{event.type}</td>
                    <td className="px-4 py-3 text-white/65">{event.detail}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-white/10">
                  <td className="px-4 py-6 text-white/55" colSpan={3}>
                    No events found for this loop yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
