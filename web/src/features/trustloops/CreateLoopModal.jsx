// src/features/trustloops/CreateLoopModal.jsx
import React, { useState } from "react";
import trustloopApi from "../../services/trustloopApi";
import { getConnectedWallet } from "../../services/wallet";

export default function CreateLoopModal({ open, onClose, onCreated }) {
  const [counterparty, setCounterparty] = useState("");
  const [role, setRole] = useState("Client");
  const [expiresIn, setExpiresIn] = useState(14);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const onCreate = async () => {
    setError(null);
    setBusy(true);

    try {
      const walletPk = await getConnectedWallet();
      if (!walletPk) throw new Error("Önce cüzdanı bağla.");

      if (!counterparty || counterparty.trim().length < 20) {
        throw new Error("Geçerli bir Stellar adresi gir.");
      }

      await trustloopApi.createLoop({
        walletPk,
        counterparty: counterparty.trim(),
        role,
        expiresInDays: expiresIn,
      });

      onClose?.();
      onCreated?.(); // ✅ parent refresh
    } catch (e) {
      setError(e?.message || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        role="button"
        tabIndex={-1}
      />

      {/* modal */}
      <div className="relative rounded-2xl bg-[#0B1220] p-6 w-[520px] max-w-[92vw] border border-white/10 text-white">
        <div className="text-lg font-semibold mb-4">Create TrustLoop</div>

        <div className="space-y-4">
          <div>
            <div className="text-sm mb-1 text-white/80">Counterparty address</div>
            <input
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
              placeholder="G... / M... address"
            />
          </div>

          <div>
            <div className="text-sm mb-1 text-white/80">Role</div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
            >
              <option>Client</option>
              <option>Freelancer</option>
            </select>
          </div>

          <div>
            <div className="text-sm mb-1 text-white/80">Expires in (days)</div>
            <input
              type="range"
              min="1"
              max="30"
              value={expiresIn}
              onChange={(e) => setExpiresIn(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-white/60 mt-1">{expiresIn} days</div>
          </div>

          {error && <div className="text-rose-300 text-sm">{error}</div>}

          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5"
              disabled={busy}
            >
              Cancel
            </button>

            <button
              onClick={onCreate}
              disabled={busy}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
            >
              {busy ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}