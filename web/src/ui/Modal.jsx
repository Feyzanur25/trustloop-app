import { X } from "lucide-react";

export function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-start justify-center p-6 md:items-center">
        <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="text-base font-semibold text-white">{title}</div>
            <button
              className="rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10"
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
