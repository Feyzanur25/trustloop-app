import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Repeat,
  ChevronDown,
  Activity,
  Shield,
  Users,
} from "lucide-react";

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
    "flex items-center gap-2 rounded-[18px] px-4 py-3 text-[0.95rem] transition",
    isActive
      ? "border border-white/10 bg-white/10 text-white"
      : "text-white/80 hover:bg-white/[0.06] hover:text-white",
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
        // ignore persisted wallet lookup failures
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

  const onSign = async () => {
    setWalletError(null);
    setSignBusy(true);

    try {
      if (!walletPk) throw new Error("Once wallet bagla.");

      const loopId = "TL-001";
      const action = "created";
      const xdr = await buildDemoManageDataXdr(walletPk, { loopId, action });
      const signedXdr = await signXdr(xdr, "TESTNET");
      const result = await submitToHorizon(signedXdr, "TESTNET");

      console.log("Submitted:", result);
      alert(`Submitted. Hash: ${result.hash}`);
    } catch (e) {
      console.error(e);
      setWalletError(e?.message || "Sign/Submit failed");
    } finally {
      setSignBusy(false);
    }
  };

  return (
    <div className="min-h-screen text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/3 h-[540px] w-[540px] rounded-full bg-emerald-400/16 blur-[140px]" />
        <div className="absolute top-[38%] -left-36 h-[520px] w-[520px] rounded-full bg-cyan-400/14 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[540px] w-[540px] rounded-full bg-fuchsia-500/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1440px] items-start justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="grid w-full max-w-[1380px] grid-cols-12 gap-5 rounded-[30px] border border-white/10 bg-[#15161c]/80 p-4 shadow-[0_28px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-5 lg:p-6">
          <aside className="col-span-12 md:col-span-3 lg:col-span-2">
            <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-[18px] border border-emerald-400/25 bg-emerald-400/15" />
                <div className="text-[1.1rem] font-semibold tracking-[-0.03em]">
                  TrustLoop
                </div>
              </div>

              <nav className="mt-7 space-y-2">
                <NavLink to="/" className={navClass} end>
                  <LayoutDashboard size={18} /> Dashboard
                </NavLink>

                <NavLink to="/metrics" className={navClass}>
                  <Activity size={18} /> Metrics
                </NavLink>

                <NavLink to="/monitoring" className={navClass}>
                  <Shield size={18} /> Monitoring
                </NavLink>

                <NavLink to="/onboarding" className={navClass}>
                  <Users size={18} /> Onboarding
                </NavLink>

                <NavLink to="/events" className={navClass}>
                  <Repeat size={18} /> Events
                </NavLink>
              </nav>

              <div className="mt-8 rounded-[22px] border border-white/10 bg-white/[0.05] p-4">
                <div className="text-xs text-white/60">Network</div>
                <div className="mt-1 text-[0.98rem] font-semibold">Stellar Testnet</div>
              </div>

              <div className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.05] p-4">
                <div className="text-xs text-white/60">Wallet</div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    onClick={walletPk ? onDisconnect : onConnect}
                    disabled={walletBusy}
                    className="inline-flex w-full items-center justify-between rounded-[16px] border border-white/10 bg-white/[0.04] px-3 py-3 text-sm hover:bg-white/[0.08] disabled:opacity-60"
                  >
                    <span className="truncate">
                      {walletPk
                        ? `${walletPk.slice(0, 4)}...${walletPk.slice(-4)}`
                        : walletBusy
                        ? "Connecting..."
                        : "Connect"}
                    </span>
                    <ChevronDown size={16} className="text-white/60" />
                  </button>
                </div>

                <button
                  onClick={onSign}
                  disabled={!walletPk || signBusy}
                  className="mt-3 w-full rounded-[16px] border border-white/10 bg-white/10 px-3 py-3 text-sm hover:bg-white/15 disabled:opacity-60"
                  title={!walletPk ? "Once connect" : "Demo tx imzala ve submit et"}
                >
                  {signBusy ? "Signing..." : "Sign Demo Tx"}
                </button>

                {walletError ? (
                  <div className="mt-3 text-xs text-rose-300">{walletError}</div>
                ) : (
                  <div className="mt-3 text-xs leading-6 text-white/50">
                    Freighter (Testnet)
                    <br />
                    - next step: sign and submit.
                  </div>
                )}
              </div>
            </div>
          </aside>

          <main className="col-span-12 md:col-span-9 lg:col-span-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
