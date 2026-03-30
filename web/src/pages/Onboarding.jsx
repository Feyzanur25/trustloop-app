import React, { useEffect, useState } from "react";
import { Download, UserPlus, Users } from "lucide-react";
import opsApi from "../services/opsApi";
import trustloopApi from "../services/trustloopApi";

function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function Onboarding() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    walletAddress: "",
    feedback: "",
    productRating: 5,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    const data = await opsApi.getOnboarding();
    setRecords(data.records || []);
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await opsApi.createOnboarding(form);
      setForm({
        name: "",
        email: "",
        walletAddress: "",
        feedback: "",
        productRating: 5,
      });
      setMessage("New onboarding record captured.");
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 rounded-[28px] border border-white/10 bg-[linear-gradient(120deg,rgba(27,19,40,0.8),rgba(19,29,35,0.95))] p-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm uppercase tracking-[0.24em] text-white/45">Growth</div>
          <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
            User Onboarding Hub
          </div>
        </div>
        <div className="flex gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm hover:bg-white/[0.08]"
            onClick={() => downloadCsv("trustloop-onboarding.csv", trustloopApi.exportOnboardingCsv())}
          >
            <Download size={16} />
            Export CSV
          </button>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            {records.length}+ user records ready
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.25fr]">
        <form
          onSubmit={onSubmit}
          className="rounded-[24px] border border-white/10 bg-black/15 p-5"
        >
          <div className="flex items-center gap-2 text-lg font-semibold text-white">
            <UserPlus size={18} />
            <span>Add participant</span>
          </div>

          <div className="mt-5 space-y-4">
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
              required
            />
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
              required
            />
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none"
              placeholder="Wallet address"
              value={form.walletAddress}
              onChange={(e) =>
                setForm((current) => ({ ...current, walletAddress: e.target.value }))
              }
              required
            />
            <textarea
              className="min-h-32 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none"
              placeholder="Product feedback"
              value={form.feedback}
              onChange={(e) => setForm((current) => ({ ...current, feedback: e.target.value }))}
            />
            <select
              className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none"
              value={form.productRating}
              onChange={(e) =>
                setForm((current) => ({ ...current, productRating: Number(e.target.value) }))
              }
            >
              <option value={5}>5 - Excellent</option>
              <option value={4}>4 - Good</option>
              <option value={3}>3 - Okay</option>
              <option value={2}>2 - Weak</option>
              <option value={1}>1 - Poor</option>
            </select>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-2xl border border-emerald-400/20 bg-emerald-400/15 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-400/20 disabled:opacity-60"
            >
              {busy ? "Saving..." : "Save onboarding record"}
            </button>
            {message ? <div className="text-sm text-emerald-200">{message}</div> : null}
          </div>
        </form>

        <section className="rounded-[24px] border border-white/10 bg-black/15 p-5">
          <div className="flex items-center gap-2 text-lg font-semibold text-white">
            <Users size={18} />
            <span>Verified user registry</span>
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            <div className="max-h-[560px] overflow-auto">
              <table className="min-w-full text-left text-sm text-white/80">
                <thead className="bg-white/[0.04] text-white/55">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Wallet</th>
                    <th className="px-4 py-3">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-t border-white/10">
                      <td className="px-4 py-3">{record.name}</td>
                      <td className="px-4 py-3 text-white/60">{record.email}</td>
                      <td className="px-4 py-3">{record.walletShort || record.walletAddress}</td>
                      <td className="px-4 py-3">{record.productRating}/5</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
