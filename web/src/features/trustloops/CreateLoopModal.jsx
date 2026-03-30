import React, { useState } from "react";
import trustloopApi from "../../services/trustloopApi";
import { getConnectedWallet } from "../../services/wallet";

export default function CreateLoopModal({ onClose, onCreated }) {
  const [counterparty, setCounterparty] = useState("");
  const [role, setRole] = useState("Client");
  const [expiresIn, setExpiresIn] = useState(14);
  const [approvalPolicy, setApprovalPolicy] = useState("dual");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const onCreate = async () => {
    setError(null);
    setBusy(true);

    try {
      const walletPk = await getConnectedWallet();
      if (!walletPk) throw new Error("Connect your wallet first.");

      const trimmed = counterparty.trim();
      if (!trimmed || trimmed.length < 20) {
        throw new Error("Enter a valid Stellar wallet address.");
      }

      await trustloopApi.createLoop({
        walletPk,
        counterparty: trimmed,
        role,
        expiresInDays: expiresIn,
        approvalPolicy,
      });

      await onCreated?.();
      onClose?.();
    } catch (e) {
      setError(e?.message || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => !busy && onClose?.()}
        role="button"
        tabIndex={-1}
      />

      <div className="relative w-[540px] max-w-[92vw] rounded-[28px] border border-white/10 bg-[#0b1220] p-6 text-white">
        <div className="text-xl font-semibold">Create TrustLoop</div>
        <div className="mt-1 text-sm text-white/55">
          Launch a new loop with expiry rules and approval policy.
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <div className="mb-1 text-sm text-white/80">Counterparty address</div>
            <input
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
              placeholder="G... or M... wallet address"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-sm text-white/80">Role</div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
              >
                <option value="Client">Client</option>
                <option value="Freelancer">Freelancer</option>
              </select>
            </div>

            <div>
              <div className="mb-1 text-sm text-white/80">Approval policy</div>
              <select
                value={approvalPolicy}
                onChange={(e) => setApprovalPolicy(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
              >
                <option value="dual">Dual approval</option>
                <option value="single">Single approval</option>
              </select>
            </div>
          </div>

          <div>
            <div className="mb-1 text-sm text-white/80">Expires in (days)</div>
            <input
              type="range"
              min="1"
              max="30"
              value={expiresIn}
              onChange={(e) => setExpiresIn(Number(e.target.value))}
              className="w-full"
            />
            <div className="mt-1 text-xs text-white/60">{expiresIn} days</div>
          </div>

          {error ? <div className="text-sm text-rose-300">{error}</div> : null}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-2xl border border-white/10 px-4 py-2 hover:bg-white/5 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onCreate}
              disabled={busy}
              className="rounded-2xl border border-emerald-400/20 bg-emerald-500/80 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {busy ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
