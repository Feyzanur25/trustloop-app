import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, PlusCircle, Repeat, Settings } from "lucide-react";

function itemClass(active) {
  return [
    "flex items-center gap-2 rounded-xl px-3 py-2",
    active
      ? "bg-white/10 border border-white/10"
      : "hover:bg-white/5 text-white/80 border border-transparent",
  ].join(" ");
}

export function Sidebar({ onCreate }) {
  const { pathname } = useLocation();

  const isDashboard = pathname === "/";
  const isEvents = pathname.startsWith("/events");

  return (
    <aside className="col-span-12 md:col-span-3 lg:col-span-2">
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-emerald-400/20 border border-emerald-400/30" />
          <div className="font-semibold">TrustLoop</div>
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
