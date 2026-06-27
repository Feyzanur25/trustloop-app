import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, PlusCircle, Repeat, Settings, Activity, BarChart } from "lucide-react";

import { BrandLogo } from "./BrandLogo";


function itemClass(active) {
  return [
    "flex items-center gap-2 rounded-xl px-3 py-2 text-[0.95rem]",
    active
      ? "border border-white/10 bg-[rgba(255,255,255,0.06)] shadow-[0_12px_32px_rgba(0,0,0,0.22)]"
      : "hover:bg-white/5 text-white/80 border border-transparent",
  ].join(" ");
}

export function Sidebar({
  onCreate,
  logo,
  name = "TrustLoop",
  tagline,
  banner,
  logoAlt,
}) {

  const { pathname } = useLocation();

  const isDashboard = pathname === "/";
  const isEvents = pathname.startsWith("/events");

  return (
    <aside className="col-span-12 md:col-span-3 lg:col-span-2">
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
        <div className="flex items-center gap-3 rounded-[22px] border border-white/5 bg-white/[0.03] p-3">
          <BrandLogo
            logo={logo}
            name={name}
            size="md"
            banner={banner}
            logoAlt={logoAlt}
          />
          <div className="min-w-0">
            <div className="text-[0.98rem] font-semibold tracking-[-0.04em] text-white truncate">
              {name}
            </div>
            {tagline ? (
              <div className="text-[0.72rem] text-white/50 truncate">{tagline}</div>
            ) : null}
          </div>
        </div>

        <nav className="mt-6 space-y-1 text-sm">
          <Link className={itemClass(isDashboard)} to="/">
            <LayoutDashboard size={18} /> Dashboard
          </Link>

          <button
            className="w-full flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/5 text-white/80 text-left"
            onClick={onCreate}
            type="button"
          >
            <PlusCircle size={18} /> Create Loop
          </button>

          <Link className={itemClass(isEvents)} to="/events">
            <Repeat size={18} /> Events
          </Link>

          <Link className={itemClass(pathname.startsWith("/monitoring"))} to="/monitoring">
            <Activity size={18} /> Monitoring
          </Link>

          <Link className={itemClass(pathname.startsWith("/metrics"))} to="/metrics">
            <BarChart size={18} /> Metrics
          </Link>

          <div className="pt-3 mt-3 border-t border-white/10" />

          <a
            className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/5 text-white/80"
            href="#"
          >
            <Settings size={18} /> Settings
          </a>
        </nav>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-white/60">Network</div>
          <div className="mt-1 text-sm font-semibold">Stellar Testnet</div>
        </div>
      </div>
    </aside>
  );
}

