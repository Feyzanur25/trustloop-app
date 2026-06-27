import React from "react";

export function BrandLogo({
  logo,
  name = "TrustLoop",
  size = "md",
  className = "",
  fallbackText,
}) {
  const sizeClasses = {
    sm: "h-10 w-10 text-[0.72rem]",
    md: "h-14 w-14 text-[0.9rem]",
    lg: "h-20 w-20 text-[1.05rem]",
  };

  const baseClass = `${sizeClasses[size] || sizeClasses.md} relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.22)] ${className}`;

  if (logo) {
    return (
      <div className={baseClass}>
        <img
          src={logo}
          alt={name}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
    );
  }

  return (
    <div className={`${baseClass} flex items-center justify-center bg-slate-950 text-white`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_30%)]" />
      <div className="relative z-10 flex h-full w-full items-center justify-center">
        <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
          <defs>
            <linearGradient id="chainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
          <path
            d="M20 24a8 8 0 0 1 0 16h-4a8 8 0 0 1 0-16h4z"
            fill="none"
            stroke="url(#chainGradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M44 40a8 8 0 0 1 0-16h4a8 8 0 0 1 0 16h-4z"
            fill="none"
            stroke="url(#chainGradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M24 20a8 8 0 0 1 16 0v-4a8 8 0 0 1-16 0v4z"
            fill="none"
            stroke="url(#chainGradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M40 44a8 8 0 0 1-16 0v4a8 8 0 0 1 16 0v-4z"
            fill="none"
            stroke="url(#chainGradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="32" cy="32" r="8" fill="rgba(15,23,42,0.95)" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}

export function BrandBanner({
  banner,
  name = "TrustLoop",
  className = "",
  height = "h-48",
}) {
  if (banner) {
    return (
      <div className={`${height} relative overflow-hidden rounded-[26px] border border-white/10 ${className}`}>
        <img src={banner} alt={`${name} banner`} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
      </div>
    );
  }

  return (
    <div
      className={`${height} relative overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-r from-slate-900 via-slate-950 to-[#091113] ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_35%)]" />
      <div className="absolute top-6 left-6 h-1 w-20 rounded-full bg-white/10" />
      <div className="absolute bottom-8 right-8 h-1.5 w-14 rounded-full bg-white/10" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.02)_45%,transparent_100%)]" />
    </div>
  );
}
