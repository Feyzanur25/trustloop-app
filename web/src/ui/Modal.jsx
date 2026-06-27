import { X } from "lucide-react";

export function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-start justify-center p-4 md:items-center md:p-6">
        <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,22,36,0.92),rgba(7,10,18,0.96))] shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="text-base font-semibold text-white">{title}</div>
            <button
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-white/75 transition hover:bg-white/[0.08] hover:text-white"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <div className="px-5 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
