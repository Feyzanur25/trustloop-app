import React, { useEffect, useMemo, useState } from "react";
import { Download, UserPlus, Users } from "lucide-react";
import opsApi from "../services/opsApi";

function normalizeRecord(record) {
  return {
    id: record.id,
    createdAt: record.createdAt || new Date().toISOString(),
    name: record.name || "",
    email: record.email || "",
    walletAddress: record.walletAddress || "",
    productRating: Number(record.productRating) || 0,
    feedback:
      record.feedback ||
      record.likedMost ||
      record.improvementSuggestion ||
      "Shared product feedback",
  };
}

function downloadCsv(filename, rows) {
  const headers = ["Created At", "Full Name", "Email", "Wallet Address", "Rating", "Feedback"];

  const escapeCsv = (value) => {
    const stringValue = String(value ?? "");
    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.createdAt,
        row.name,
        row.email,
        row.walletAddress,
        row.productRating,
        row.feedback,
      ]
        .map(escapeCsv)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function Onboarding() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    walletAddress: "",
    feedback: "",
    productRating: 5,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadRecords() {
      try {
        const response = await opsApi.getOnboarding();
        if (!active) return;

        const nextRecords = Array.isArray(response?.records)
          ? response.records.map(normalizeRecord)
          : [];
        setRecords(nextRecords);
        setError("");
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Could not load onboarding records.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRecords();

    return () => {
      active = false;
    };
  }, []);

  const averageRating = useMemo(() => {
    if (!records.length) return 0;
    const total = records.reduce(
      (sum, record) => sum + Number(record.productRating || 0),
      0
    );
    return (total / records.length).toFixed(1);
  }, [records]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const created = await opsApi.createOnboarding({
        name: form.name.trim(),
        email: form.email.trim(),
        walletAddress: form.walletAddress.trim(),
        feedback: form.feedback.trim(),
        productRating: Number(form.productRating),
      });

      setRecords((current) => [normalizeRecord(created), ...current]);
      setForm({
        name: "",
        email: "",
        walletAddress: "",
        feedback: "",
        productRating: 5,
      });
      setMessage("New onboarding record captured.");
    } catch (err) {
      setError(err?.message || "Could not save onboarding record.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="surface-shell space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title">Growth</div>
          <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
            User Onboarding Hub
          </div>
          <div className="mt-2 text-sm text-white/55">
            Verified onboarding records, user ratings, and Stellar Testnet wallet registry
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="btn-secondary inline-flex items-center gap-2"
            onClick={() => downloadCsv("trustloop-onboarding.csv", records)}
            type="button"
          >
            <Download size={16} />
            Export CSV
          </button>

          <div className="stat-pill border-emerald-400/20 bg-emerald-400/10 text-emerald-100">
            {records.length}+ user records ready
          </div>

          <div className="stat-pill border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
            Avg. rating: {averageRating}/5
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

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
              className="input-field"
              placeholder="Full name"
              value={form.name}
              onChange={(e) =>
                setForm((current) => ({ ...current, name: e.target.value }))
              }
              required
            />

            <input
              className="input-field"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((current) => ({ ...current, email: e.target.value }))
              }
              required
            />

            <input
              className="input-field"
              placeholder="Wallet address"
              value={form.walletAddress}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  walletAddress: e.target.value,
                }))
              }
              required
            />

            <textarea
              className="input-field min-h-32"
              placeholder="Product feedback"
              value={form.feedback}
              onChange={(e) =>
                setForm((current) => ({ ...current, feedback: e.target.value }))
              }
            />

            <select
              className="input-field"
              value={form.productRating}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  productRating: Number(e.target.value),
                }))
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

            {message ? (
              <div className="text-sm text-emerald-200">{message}</div>
            ) : null}
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
                <thead className="sticky top-0 bg-white/[0.04] text-white/55 backdrop-blur">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Wallet</th>
                    <th className="px-4 py-3">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading &&
                    records.map((record) => (
                      <tr key={record.id} className="border-t border-white/10">
                        <td className="px-4 py-3">{record.name}</td>
                        <td className="px-4 py-3 text-white/60">{record.email}</td>
                        <td
                          className="px-4 py-3 font-mono text-xs text-white/75"
                          title={record.walletAddress}
                        >
                          {record.walletAddress.slice(0, 8)}...
                          {record.walletAddress.slice(-8)}
                        </td>
                        <td className="px-4 py-3">{record.productRating}/5</td>
                      </tr>
                    ))}

                  {!loading && !records.length ? (
                    <tr className="border-t border-white/10">
                      <td className="px-4 py-6 text-white/55" colSpan={4}>
                        No onboarding records yet.
                      </td>
                    </tr>
                  ) : null}

                  {loading ? (
                    <tr className="border-t border-white/10">
                      <td className="px-4 py-6 text-white/55" colSpan={4}>
                        Loading onboarding records...
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
