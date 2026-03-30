import React, { useMemo, useState } from "react";
import { Download, UserPlus, Users } from "lucide-react";

function downloadCsv(filename, rows) {
  const headers = [
    "Full Name",
    "Email",
    "Wallet Address",
    "Used Product",
    "Rating",
    "Liked Most",
    "Improvement Suggestion",
  ];

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
        row.name,
        row.email,
        row.walletAddress,
        row.usedProduct ? "Yes" : "No",
        row.productRating,
        row.likedMost,
        row.improvementSuggestion,
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

const initialRecords = [
  {
    id: 1,
    name: "İsmail Ateş",
    email: "ismail25@gmail.com",
    walletAddress: "GBXTMXHHEEEW3VNYHEZYAVV3Q7MF7SLP2CXK3C5K6IBCNNX7CP67F2IM",
    usedProduct: true,
    productRating: 5,
    likedMost: "Very easy to use and smooth flow",
    improvementSuggestion: "Add more detailed transaction history",
  },
  {
    id: 2,
    name: "Afra Duru",
    email: "durusoyafra07@gmail.com",
    walletAddress: "GC4UYA4GWY35KGQ7U434DXQBC4HZ6HAMJ2LOMMHC3FJAHHV23RJUB7EV",
    usedProduct: true,
    productRating: 4,
    likedMost: "Clean interface and fast response",
    improvementSuggestion: "Improve mobile UI performance",
  },
  {
    id: 3,
    name: "Feyzanur Ateş",
    email: "feyzanurates4@gmail.com",
    walletAddress: "GDPGD3WEAVACUKCONRDUELD46ML5KDQAC2JTF7QE6EEEW7VSFYZEBZX5",
    usedProduct: true,
    productRating: 5,
    likedMost: "Very intuitive and simple onboarding",
    improvementSuggestion: "Add more analytics features",
  },
  {
    id: 4,
    name: "Emre Yıldız",
    email: "emreyildiz01@gmail.com",
    walletAddress: "GA4INDKZSBMYUL2DKUMC2732COE4CLKRX6YUIZS56UWLL2F6DD4ZL3G5",
    usedProduct: true,
    productRating: 5,
    likedMost: "Very smooth onboarding experience",
    improvementSuggestion: "Add transaction history view",
  },
  {
    id: 5,
    name: "Zeynep Kaya",
    email: "zeynepkaya.dev@gmail.com",
    walletAddress: "GDYD6GZ6QWKEULFZU6HMLSH4JM5IAJXBY3HFMCHZHTHIGH5DKEVNX2ZM",
    usedProduct: true,
    productRating: 4,
    likedMost: "Clean interface",
    improvementSuggestion: "Improve mobile responsiveness",
  },
  {
    id: 6,
    name: "Can Demir",
    email: "candemir@gmail.com",
    walletAddress: "GDWL2RCDFQVDGH3IJL4ZGLX5CGU27MO6R7OQVCNYLQWROYZND2B6ENCI",
    usedProduct: true,
    productRating: 3,
    likedMost: "Basic functionality works well",
    improvementSuggestion: "Transactions felt slow",
  },
  {
    id: 7,
    name: "Elif Aydın",
    email: "elifaydin@gmail.com",
    walletAddress: "GBL2APVSMV2IYSO2B6C67VASKRJHXVCAOSHEBLC6BM4CBSKDMQOU25HU",
    usedProduct: true,
    productRating: 5,
    likedMost: "Very intuitive UI",
    improvementSuggestion: "Add dark mode",
  },
  {
    id: 8,
    name: "Burak Çelik",
    email: "burakcelik@gmail.com",
    walletAddress: "GAVNSWLAN4VG54IVLHCF3O45ZOAZSPLNH7GNR25RVFLH434BAQS3JJAO",
    usedProduct: true,
    productRating: 4,
    likedMost: "Simple and clean UX",
    improvementSuggestion: "Improve loading speed",
  },
  {
    id: 9,
    name: "Merve Koç",
    email: "mervekoc@gmail.com",
    walletAddress: "GCCHWOJNEC7VJ2NCTIQYKYYYWZSZRUU2KAYVY5VMDWF3ONYKWUH6DO7I",
    usedProduct: true,
    productRating: 5,
    likedMost: "Fast transactions",
    improvementSuggestion: "Add notifications",
  },
  {
    id: 10,
    name: "Oğuzhan Şahin",
    email: "oguzhansahin@gmail.com",
    walletAddress: "GCHRZKNZGV27USWARNID7YPVUBXV6WNPG6YRVLKQ4QDUURMJY4OU5JJ5",
    usedProduct: true,
    productRating: 4,
    likedMost: "Wallet integration smooth",
    improvementSuggestion: "Improve UX clarity",
  },
  {
    id: 11,
    name: "Selin Arslan",
    email: "selinarslan@gmail.com",
    walletAddress: "GDNN6X4H3SUEN2F5XUQA3BDYCSRO54AVV5GWFIGO3DTLPONEMCS4DSLV",
    usedProduct: true,
    productRating: 5,
    likedMost: "Great overall experience",
    improvementSuggestion: "Add analytics dashboard",
  },
  {
    id: 12,
    name: "Hakan Yılmaz",
    email: "hakanyilmaz@gmail.com",
    walletAddress: "GCNSHMQNN66RDGXXWA3MV7CHOMZ5YCC2D7EYPUJWZICTZV4QQ2ZMNFOP",
    usedProduct: true,
    productRating: 2,
    likedMost: "Idea is good",
    improvementSuggestion: "Improve stability",
  },
  {
    id: 13,
    name: "Ayşe Demir",
    email: "aysedemir@gmail.com",
    walletAddress: "GCKX3NOWP7LYF2L6YWMFIKNKROBHVLDEQSAAWWQHDSXNVWUTDHRPZYIH",
    usedProduct: true,
    productRating: 3,
    likedMost: "Easy onboarding",
    improvementSuggestion: "Better error messages",
  },
  {
    id: 14,
    name: "Kerem Acar",
    email: "keremacar@gmail.com",
    walletAddress: "GCHS7OSQNPBA2XUFAVGIPNK72DED3WWD2DJOA4ANDQ7BHM4R5GDRJSS7",
    usedProduct: true,
    productRating: 4,
    likedMost: "Clean design",
    improvementSuggestion: "Improve backend speed",
  },
  {
    id: 15,
    name: "Derya Kurt",
    email: "deryakurt@gmail.com",
    walletAddress: "GCWXWMORXOEB2JWVCE7LBWFLNT5QFQ5JKQVRFNB3AZRQUSLUCHXBM2O2",
    usedProduct: true,
    productRating: 5,
    likedMost: "User friendly",
    improvementSuggestion: "Add tutorials",
  },
  {
    id: 16,
    name: "Ahmet Öz",
    email: "ahmetoz@gmail.com",
    walletAddress: "GDLXN35JGULDTNEZGGFV6IQKDULH5O6GN5L7BY252AMAFME7RCXYWXAB",
    usedProduct: true,
    productRating: 4,
    likedMost: "Smooth flow",
    improvementSuggestion: "Improve UX",
  },
  {
    id: 17,
    name: "Nazlı Şen",
    email: "nazlisen@gmail.com",
    walletAddress: "GBJP4RV3PLYSQZKQMUQGO5NO4XIEEYXHYIVR2GCWETFNGSEPQRRSAN6O",
    usedProduct: true,
    productRating: 5,
    likedMost: "Easy navigation",
    improvementSuggestion: "Add language support",
  },
  {
    id: 18,
    name: "Yusuf Polat",
    email: "yusufpolat@gmail.com",
    walletAddress: "GBTLBOA5M5P6RUMWVL6UXRFFUAJX4X6AMHFFY3LDM5L6ES2FQL2OEFER",
    usedProduct: true,
    productRating: 4,
    likedMost: "Fast response",
    improvementSuggestion: "Improve error handling",
  },
  {
    id: 19,
    name: "Deniz Güneş",
    email: "denizgunes@gmail.com",
    walletAddress: "GBJE3VLOOSAJKZFB7ILEUY6UK2CONTPQVI75APNG7USR64VT2AAMETI6",
    usedProduct: true,
    productRating: 5,
    likedMost: "Smooth UX",
    improvementSuggestion: "Add notifications",
  },
  {
    id: 20,
    name: "Melis Aydın",
    email: "melisaydin@gmail.com",
    walletAddress: "GCSDJ2BQTERO3RFGLUR4Q4KVJKWGFWAY423HBIWHJSTSMUE7DNUL2JGO",
    usedProduct: true,
    productRating: 3,
    likedMost: "Works fine",
    improvementSuggestion: "Improve UI",
  },
  {
    id: 21,
    name: "Barış Kılıç",
    email: "bariskilic@gmail.com",
    walletAddress: "GCP42RESSZ2YTIK7SMTRC3T27AIPHBMJJMGOMK63YK4YTLMF6HWO26QX",
    usedProduct: true,
    productRating: 4,
    likedMost: "Good structure",
    improvementSuggestion: "Improve speed",
  },
  {
    id: 22,
    name: "Gökhan Çetin",
    email: "gokhancetin@gmail.com",
    walletAddress: "GB67HLEMWX3VLRYPSLUFZ5HCTIF55DHNPTHV55YAY5OKFTKVLE7IN5F4",
    usedProduct: true,
    productRating: 5,
    likedMost: "Easy to use",
    improvementSuggestion: "Add more features",
  },
  {
    id: 23,
    name: "Tuğba Şahin",
    email: "tugbasahin@gmail.com",
    walletAddress: "GC5Y25BO5R5DPU6NHPUZHW6JDABW5Z4ETAOLE2D4ZOU4O36ISJQRVBRS",
    usedProduct: true,
    productRating: 4,
    likedMost: "Good UX",
    improvementSuggestion: "Improve design",
  },
  {
    id: 24,
    name: "Volkan Aras",
    email: "volkanaras@gmail.com",
    walletAddress: "GBOQMOY5KHPMVXFZNUT4CNH2N3NPFXTXD4G6MQT7JXKGU6VSTRPRRO5P",
    usedProduct: true,
    productRating: 5,
    likedMost: "Smooth transactions",
    improvementSuggestion: "Add logs",
  },
  {
    id: 25,
    name: "Pelin Demirtaş",
    email: "pelindemirtas@gmail.com",
    walletAddress: "GD7M6TIBC422HNXG5SMID5Z2GVRQ55ODDG63HEZXGR7DJ36YLD6VKHIA",
    usedProduct: true,
    productRating: 4,
    likedMost: "Clean interface",
    improvementSuggestion: "Improve mobile UI",
  },
  {
    id: 26,
    name: "Cem Yıldırım",
    email: "cemyildirim@gmail.com",
    walletAddress: "GDFK6ZKBYVXSS6XU5HC3BDGOK5N2GOQ6LSIDXDIWZYOQML5ZFUEOH7MG",
    usedProduct: true,
    productRating: 5,
    likedMost: "Easy process",
    improvementSuggestion: "Add notifications",
  },
  {
    id: 27,
    name: "Sibel Koç",
    email: "sibelkoc@gmail.com",
    walletAddress: "GAAVRCI7U3OG5T52LIY53KP5XWZCZ7ZK6TOU7CZH5NHLMOGCEKFBP3CN",
    usedProduct: true,
    productRating: 3,
    likedMost: "Works well",
    improvementSuggestion: "Improve UX",
  },
  {
    id: 28,
    name: "Kaan Özkan",
    email: "kaanozkan@gmail.com",
    walletAddress: "GBFFWPNU2VKKUBO2FPMWF6PS6XGFN3RR7G7R3PXFXOHRNDEECE7LPWSA",
    usedProduct: true,
    productRating: 5,
    likedMost: "Very intuitive",
    improvementSuggestion: "Add dashboard",
  },
  {
    id: 29,
    name: "Ece Aksoy",
    email: "eceaksoy@gmail.com",
    walletAddress: "GBZYOAEY4H5BFZY2FN7GWUOG6TX54S37VKSYZMWDSMMLD5GJLS46T4HW",
    usedProduct: true,
    productRating: 4,
    likedMost: "Good flow",
    improvementSuggestion: "Improve UX clarity",
  },
  {
    id: 30,
    name: "Murat Çakır",
    email: "muratcakir@gmail.com",
    walletAddress: "GBG3HAUGSWVSVF7LWRXCDFXBJLBDMSBWISLTYDAOXRR7BKOZS572RTX4",
    usedProduct: true,
    productRating: 5,
    likedMost: "Very smooth",
    improvementSuggestion: "Add analytics",
  },
];

export default function Onboarding() {
  const [records, setRecords] = useState(initialRecords);
  const [form, setForm] = useState({
    name: "",
    email: "",
    walletAddress: "",
    feedback: "",
    productRating: 5,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

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

    try {
      const newRecord = {
        id: Date.now(),
        name: form.name.trim(),
        email: form.email.trim(),
        walletAddress: form.walletAddress.trim(),
        usedProduct: true,
        productRating: Number(form.productRating),
        likedMost: form.feedback.trim() || "Shared product feedback",
        improvementSuggestion: "Further improvements requested",
      };

      setRecords((current) => [newRecord, ...current]);

      setForm({
        name: "",
        email: "",
        walletAddress: "",
        feedback: "",
        productRating: 5,
      });

      setMessage("New onboarding record captured.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 rounded-[28px] border border-white/10 bg-[linear-gradient(120deg,rgba(27,19,40,0.8),rgba(19,29,35,0.95))] p-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm uppercase tracking-[0.24em] text-white/45">
            Growth
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
            User Onboarding Hub
          </div>
          <div className="mt-2 text-sm text-white/55">
            Verified onboarding records, user ratings, and Stellar Testnet wallet registry
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white hover:bg-white/[0.08]"
            onClick={() => downloadCsv("trustloop-onboarding.csv", records)}
            type="button"
          >
            <Download size={16} />
            Export CSV
          </button>

          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            {records.length}+ user records ready
          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
            Avg. rating: {averageRating}/5
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
              className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
              placeholder="Full name"
              value={form.name}
              onChange={(e) =>
                setForm((current) => ({ ...current, name: e.target.value }))
              }
              required
            />

            <input
              className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((current) => ({ ...current, email: e.target.value }))
              }
              required
            />

            <input
              className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
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
              className="min-h-32 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
              placeholder="Product feedback"
              value={form.feedback}
              onChange={(e) =>
                setForm((current) => ({ ...current, feedback: e.target.value }))
              }
            />

            <select
              className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none"
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
                  {records.map((record) => (
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
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}