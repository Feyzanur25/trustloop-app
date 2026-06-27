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

import { BrandLogo } from "./BrandLogo";
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
        <div className="absolute -top-40 left-1/3 h-[540px] w-[540px] rounded-full bg-emerald-400/14 blur-[140px]" />
        <div className="absolute top-[38%] -left-36 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[540px] w-[540px] rounded-full bg-slate-950/80 blur-[140px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1440px] items-stretch justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="grid w-full max-w-[1380px] min-h-screen grid-cols-12 gap-5 rounded-[30px] border border-white/10 bg-gradient-to-br from-[#03050b]/95 via-[#04080f]/95 to-[#05121a]/95 p-4 shadow-[0_28px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-5 lg:p-6">
          <aside className="col-span-12 md:col-span-3 lg:col-span-2 flex h-full flex-col">
            <div className="flex h-full flex-col justify-between rounded-[26px] border border-white/10 bg-[rgba(5,10,20,0.94)] p-4 shadow-[inset_0_0_40px_rgba(16,185,129,0.08)]">
              <div className="space-y-5">
                <div className="rounded-[24px] border border-white/10 bg-slate-950/95 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
                  <div className="flex items-center gap-3">
                    <BrandLogo size="sm" className="rounded-2xl" />
                    <div>
                      <div className="text-base font-semibold text-white">TrustLoop</div>
                      <div className="text-xs text-white/50">Chain-native trust loops</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-slate-950/95 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/50">Wallet</div>
                      <button
                        onClick={walletPk ? onDisconnect : onConnect}
                        disabled={walletBusy}
                        className="rounded-[10px] border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1.5 text-[0.7rem] font-semibold text-emerald-200 transition hover:bg-emerald-500/15 disabled:opacity-60"
                      >
                        {walletPk ? "Disconnect" : walletBusy ? "Connecting" : "Connect"}
                      </button>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white">
                      {walletPk ? `${walletPk.slice(0, 4)}...${walletPk.slice(-4)}` : "Not connected"}
                    </div>
                  </div>

                  <button
                    onClick={onSign}
                    disabled={!walletPk || signBusy}
                    className="mt-4 w-full rounded-[16px] border border-white/10 bg-gradient-to-r from-emerald-500/15 to-cyan-400/10 px-3 py-3 text-sm font-semibold text-white hover:bg-gradient-to-r hover:from-emerald-500/25 hover:to-cyan-400/15 disabled:opacity-60"
                    title={!walletPk ? "Connect first" : "Sign demo tx"}
                  >
                    {signBusy ? "Signing..." : "Sign Demo Tx"}
                  </button>

                  {walletError ? (
                    <div className="mt-3 text-xs text-rose-300">{walletError}</div>
                  ) : (
                    <div className="mt-3 text-xs leading-6 text-white/50">
                      Freighter wallet ready
                      <br />
                      Connect and submit transactions.
                    </div>
                  )}
                </div>

                <nav className="space-y-2">
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
