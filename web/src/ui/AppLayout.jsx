// src/ui/AppLayout.jsx
import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Repeat, ChevronDown } from "lucide-react";

import { submitToHorizon } from "../services/submitTx";

import {
  connectWallet,
  disconnectWallet,
  getConnectedWallet,
  signXdr,
} from "../services/wallet";

import { buildDemoManageDataXdr } from "../services/demoTx";

function navClass({ isActive }) {
  return [
    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
    isActive
      ? "bg-white/10 border border-white/10"
      : "hover:bg-white/5 text-white/80",
  ].join(" ");
}

export default function AppLayout() {
  const [walletPk, setWalletPk] = useState(null);
  const [walletError, setWalletError] = useState(null);
  const [walletBusy, setWalletBusy] = useState(false);
  const [signBusy, setSignBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const pk = await getConnectedWallet();
        if (pk) setWalletPk(pk);
      } catch {
        // sessiz geç
      }
    })();
  }, []);

  const onConnect = async () => {
    setWalletError(null);
    setWalletBusy(true);
    try {
      const pk = await connectWallet();
      setWalletPk(pk);
    } catch (e) {
      setWalletPk(null);
      setWalletError(e?.message || "Wallet connect failed");
    } finally {
      setWalletBusy(false);
    }
  };

  const onDisconnect = () => {
    disconnectWallet();
    setWalletPk(null);
    setWalletError(null);
  };

  // Demo: Zincire sadece kısa bir event basacağız (64 byte sınırına takılmayacak)
  const onSign = async () => {
    setWalletError(null);
    setSignBusy(true);

    try {
      if (!walletPk) throw new Error("Önce cüzdanı bağla.");

      // ✅ Kısa data (value max 64 bytes)
      const loopId = "TL-001";
      const action = "created"; // trust.created

      // 1) XDR üret
      const xdr = await buildDemoManageDataXdr(walletPk, { loopId, action });

      // 2) Freighter ile imzala
      const signedXdr = await signXdr(xdr, "TESTNET");

      // 3) Horizon’a gönder (submit)
      const result = await submitToHorizon(signedXdr, "TESTNET");

      console.log("✅ Submitted:", result);
      alert(`✅ Submitted! Hash: ${result.hash}`);
    } catch (e) {
      console.error(e);
      setWalletError(e?.message || "Sign/Submit failed");
    } finally {
      setSignBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-white">
      {/* glow background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/3 h-[520px] w-[520px] rounded-full bg-emerald-400/20 blur-[120px]" />
        <div className="absolute top-1/3 -left-40 h-[520px] w-[520px] rounded-full bg-cyan-400/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* sidebar */}
          <aside className="col-span-12 md:col-span-3 lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-400/20 border border-emerald-400/30" />
                <div className="font-semibold">TrustLoop</div>
              </div>

              <nav className="mt-6 space-y-1">
                <NavLink to="/" className={navClass} end>
                  <LayoutDashboard size={18} /> Dashboard
                </NavLink>

                <NavLink to="/events" className={navClass}>
                  <Repeat size={18} /> Events
                </NavLink>
              </nav>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-white/60">Network</div>
                <div className="mt-1 text-sm font-semibold">Stellar Testnet</div>
              </div>

              {/* Wallet box */}
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-white/60">Wallet</div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <button
                    onClick={walletPk ? onDisconnect : onConnect}
                    disabled={walletBusy}
                    className="w-full inline-flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-60"
                  >
                    <span className="truncate">
                      {walletPk
                        ? `${walletPk.slice(0, 4)}…${walletPk.slice(-4)}`
                        : walletBusy
                        ? "Connecting..."
                        : "Connect"}
                    </span>
                    <ChevronDown size={16} className="text-white/60" />
                  </button>
                </div>

                {/* Sign button (demo) */}
                <button
                  onClick={onSign}
                  disabled={!walletPk || signBusy}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-60"
                  title={!walletPk ? "Önce connect" : "Demo tx imzala + submit"}
                >
                  {signBusy ? "Signing..." : "Sign Demo Tx"}
                </button>

                {walletError ? (
                  <div className="mt-2 text-xs text-rose-300">{walletError}</div>
                ) : (
                  <div className="mt-2 text-xs text-white/50">
                    Freighter (Testnet) — next step: sign & submit.
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* main */}
          <main className="col-span-12 md:col-span-9 lg:col-span-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
