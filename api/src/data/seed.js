import { daysAgo, shortWallet } from "../utils/helpers.js";
import { normalizeLoop, normalizeApproval } from "../logic/trustScore.js";

export const ONBOARDING_SEED = [
  ["İsmail Ateş", "ismail25@gmail.com", "GBXTMXHHEEEW3VNYHEZYAVV3Q7MF7SLP2CXK3C5K6IBCNNX7CP67F2IM", "Very easy to use and smooth flow", 5],
  ["Afra Duru", "durusoyafra07@gmail.com", "GC4UYA4GWY35KGQ7U434DXQBC4HZ6HAMJ2LOMMHC3FJAHHV23RJUB7EV", "Clean interface and fast response", 4],
  ["Feyzanur Ateş", "feyzanurates4@gmail.com", "GDPGD3WEAVACUKCONRDUELD46ML5KDQAC2JTF7QE6EEEW7VSFYZEBZX5", "Very intuitive and simple onboarding", 5],
  ["Emre Yıldız", "emreyildiz01@gmail.com", "GA4INDKZSBMYUL2DKUMC2732COE4CLKRX6YUIZS56UWLL2F6DD4ZL3G5", "Very smooth onboarding experience", 5],
  ["Zeynep Kaya", "zeynepkaya.dev@gmail.com", "GDYD6GZ6QWKEULFZU6HMLSH4JM5IAJXBY3HFMCHZHTHIGH5DKEVNX2ZM", "Clean interface", 4],
  ["Can Demir", "candemir@gmail.com", "GDWL2RCDFQVDGH3IJL4ZGLX5CGU27MO6R7OQVCNYLQWROYZND2B6ENCI", "Basic functionality works well", 3],
  ["Elif Aydın", "elifaydin@gmail.com", "GBL2APVSMV2IYSO2B6C67VASKRJHXVCAOSHEBLC6BM4CBSKDMQOU25HU", "Very intuitive UI", 5],
  ["Burak Çelik", "burakcelik@gmail.com", "GAVNSWLAN4VG54IVLHCF3O45ZOAZSPLNH7GNR25RVFLH434BAQS3JJAO", "Simple and clean UX", 4],
  ["Merve Koç", "mervekoc@gmail.com", "GCCHWOJNEC7VJ2NCTIQYKYYYWZSZRUU2KAYVY5VMDWF3ONYKWUH6DO7I", "Fast transactions", 5],
  ["Oğuzhan Şahin", "oguzhansahin@gmail.com", "GCHRZKNZGV27USWARNID7YPVUBXV6WNPG6YRVLKQ4QDUURMJY4OU5JJ5", "Wallet integration smooth", 4],
  ["Selin Arslan", "selinarslan@gmail.com", "GDNN6X4H3SUEN2F5XUQA3BDYCSRO54AVV5GWFIGO3DTLPONEMCS4DSLV", "Great overall experience", 5],
  ["Hakan Yılmaz", "hakanyilmaz@gmail.com", "GCNSHMQNN66RDGXXWA3MV7CHOMZ5YCC2D7EYPUJWZICTZV4QQ2ZMNFOP", "Idea is good", 2],
  ["Ayşe Demir", "aysedemir@gmail.com", "GCKX3NOWP7LYF2L6YWMFIKNKROBHVLDEQSAAWWQHDSXNVWUTDHRPZYIH", "Easy onboarding", 3],
  ["Kerem Acar", "keremacar@gmail.com", "GCHS7OSQNPBA2XUFAVGIPNK72DED3WWD2DJOA4ANDQ7BHM4R5GDRJSS7", "Clean design", 4],
  ["Derya Kurt", "deryakurt@gmail.com", "GCWXWMORXOEB2JWVCE7LBWFLNT5QFQ5JKQVRFNB3AZRQUSLUCHXBM2O2", "User friendly", 5],
  ["Ahmet Öz", "ahmetoz@gmail.com", "GDLXN35JGULDTNEZGGFV6IQKDULH5O6GN5L7BY252AMAFME7RCXYWXAB", "Smooth flow", 4],
  ["Nazlı Şen", "nazlisen@gmail.com", "GBJP4RV3PLYSQZKQMUQGO5NO4XIEEYXHYIVR2GCWETFNGSEPQRRSAN6O", "Easy navigation", 5],
  ["Yusuf Polat", "yusufpolat@gmail.com", "GBTLBOA5M5P6RUMWVL6UXRFFUAJX4X6AMHFFY3LDM5L6ES2FQL2OEFER", "Fast response", 4],
  ["Deniz Güneş", "denizgunes@gmail.com", "GBJE3VLOOSAJKZFB7ILEUY6UK2CONTPQVI75APNG7USR64VT2AAMETI6", "Smooth UX", 5],
  ["Melis Aydın", "melisaydin@gmail.com", "GCSDJ2BQTERO3RFGLUR4Q4KVJKWGFWAY423HBIWHJSTSMUE7DNUL2JGO", "Works fine", 3],
  ["Barış Kılıç", "bariskilic@gmail.com", "GCP42RESSZ2YTIK7SMTRC3T27AIPHBMJJMGOMK63YK4YTLMF6HWO26QX", "Good structure", 4],
  ["Gökhan Çetin", "gokhancetin@gmail.com", "GB67HLEMWX3VLRYPSLUFZ5HCTIF55DHNPTHV55YAY5OKFTKVLE7IN5F4", "Easy to use", 5],
  ["Tuğba Şahin", "tugbasahin@gmail.com", "GC5Y25BO5R5DPU6NHPUZHW6JDABW5Z4ETAOLE2D4ZOU4O36ISJQRVBRS", "Good UX", 4],
  ["Volkan Aras", "volkanaras@gmail.com", "GBOQMOY5KHPMVXFZNUT4CNH2N3NPFXTXD4G6MQT7JXKGU6VSTRPRRO5P", "Smooth transactions", 5],
  ["Pelin Demirtaş", "pelindemirtas@gmail.com", "GD7M6TIBC422HNXG5SMID5Z2GVRQ55ODDG63HEZXGR7DJ36YLD6VKHIA", "Clean interface", 4],
  ["Cem Yıldırım", "cemyildirim@gmail.com", "GDFK6ZKBYVXSS6XU5HC3BDGOK5N2GOQ6LSIDXDIWZYOQML5ZFUEOH7MG", "Easy process", 5],
  ["Sibel Koç", "sibelkoc@gmail.com", "GAAVRCI7U3OG5T52LIY53KP5XWZCZ7ZK6TOU7CZH5NHLMOGCEKFBP3CN", "Works well", 3],
  ["Kaan Özkan", "kaanozkan@gmail.com", "GBFFWPNU2VKKUBO2FPMWF6PS6XGFN3RR7G7R3PXFXOHRNDEECE7LPWSA", "Very intuitive", 5],
  ["Ece Aksoy", "eceaksoy@gmail.com", "GBZYOAEY4H5BFZY2FN7GWUOG6TX54S37VKSYZMWDSMMLD5GJLS46T4HW", "Good flow", 4],
  ["Murat Çakır", "muratcakir@gmail.com", "GBG3HAUGSWVSVF7LWRXCDFXBJLBDMSBWISLTYDAOXRR7BKOZS572RTX4", "Very smooth", 5],
];

export function buildOnboardingSeedRecords() {
  return ONBOARDING_SEED.map((record, index) => ({
    id: `OB-${String(index + 1).padStart(3, "0")}`,
    createdAt: daysAgo(index % 10),
    name: record[0],
    email: record[1],
    walletAddress: record[2],
    walletShort: shortWallet(record[2]),
    feedback: record[3],
    productRating: record[4],
  }));
}

export function shouldReplaceLegacyOnboarding(records = []) {
  if (!Array.isArray(records) || !records.length) return true;
  return records.every((record) => String(record?.name || "").startsWith("Pilot User "));
}

export function buildSeedLoops() {
  return [
    {
      id: "TL-001",
      counterparty: "GDPGD3WEAVACUKCONRDUELD46ML5KDQAC2JTF7QE6EEEW7VSFYZEBZX5",
      role: "Client",
      status: "Active",
      score: 82,
      expiresInDays: 12,
      lastEvent: "trust.confirmed",
      createdAt: daysAgo(10),
      approvalPolicy: "dual",
    },
    {
      id: "TL-002",
      counterparty: "GC4UYA4GWY35KGQ7U434DXQBC4HZ6HAMJ2LOMMHC3FJAHHV23RJUB7EV",
      role: "Freelancer",
      status: "Completed",
      score: 91,
      expiresInDays: 0,
      lastEvent: "trust.closed",
      createdAt: daysAgo(9),
      approvalPolicy: "dual",
    },
    {
      id: "TL-003",
      counterparty: "GBXTMXHHEEEW3VNYHEZYAVV3Q7MF7SLP2CXK3C5K6IBCNNX7CP67F2IM",
      role: "Freelancer",
      status: "Pending",
      score: 58,
      expiresInDays: 16,
      lastEvent: "trust.created",
      createdAt: daysAgo(3),
      approvalPolicy: "dual",
    },
    {
      id: "TL-004",
      counterparty: "GA4INDKZSBMYUL2DKUMC2732COE4CLKRX6YUIZS56UWLL2F6DD4ZL3G5",
      role: "Client",
      status: "Active",
      score: 76,
      expiresInDays: 8,
      lastEvent: "trust.confirmed",
      createdAt: daysAgo(1),
      approvalPolicy: "dual",
    },
  ];
}

export function buildSeedEvents() {
  return [
    { time: daysAgo(0.625), type: "trust.created", loopId: "TL-001", detail: "TL-001 created" },
    { time: daysAgo(0.597), type: "trust.confirmed", loopId: "TL-001", detail: "TL-001 confirmed" },
    { time: daysAgo(0.5), type: "trust.created", loopId: "TL-002", detail: "TL-002 created" },
    { time: daysAgo(0.444), type: "trust.confirmed", loopId: "TL-002", detail: "TL-002 confirmed" },
    { time: daysAgo(0.354), type: "trust.closed", loopId: "TL-002", detail: "TL-002 closed" },
    { time: daysAgo(0.153), type: "trust.created", loopId: "TL-003", detail: "TL-003 created" },
    { time: daysAgo(0.125), type: "trust.confirmed", loopId: "TL-003", detail: "TL-003 confirmed" },
    { time: daysAgo(0.049), type: "trust.created", loopId: "TL-004", detail: "TL-004 created" },
  ];
}

export function buildSeedApprovals() {
  return {
    "TL-001": {
      clientApproved: true,
      freelancerApproved: true,
      requiredApprovals: 2,
      updatedAt: daysAgo(0.568),
    },
    "TL-002": {
      clientApproved: true,
      freelancerApproved: true,
      requiredApprovals: 2,
      updatedAt: daysAgo(0.361),
    },
    "TL-003": {
      clientApproved: true,
      freelancerApproved: false,
      requiredApprovals: 2,
      updatedAt: daysAgo(0.104),
    },
    "TL-004": {
      clientApproved: false,
      freelancerApproved: false,
      requiredApprovals: 2,
      updatedAt: daysAgo(0.028),
    },
  };
}

export function normalizeState(rawState = {}) {
  const seed = buildSeedState();
  const loops = Array.isArray(rawState.loops) ? rawState.loops.map(normalizeLoop) : seed.loops;
  const approvals = {};

  for (const loop of loops) {
    approvals[loop.id] = normalizeApproval(
      loop,
      rawState.approvals && typeof rawState.approvals === "object" ? rawState.approvals[loop.id] : {}
    );
  }

  const onboardingProfiles =
    Array.isArray(rawState.onboardingProfiles) && !shouldReplaceLegacyOnboarding(rawState.onboardingProfiles)
      ? rawState.onboardingProfiles
      : buildOnboardingSeedRecords();

  return {
    loops,
    events: Array.isArray(rawState.events) ? rawState.events : seed.events,
    onboardingProfiles,
    approvals,
    meta: {
      lastIndexerSyncAt: rawState.meta?.lastIndexerSyncAt || new Date().toISOString(),
    },
  };
}

export function buildSeedState() {
  return {
    loops: buildSeedLoops(),
    events: buildSeedEvents(),
    onboardingProfiles: buildOnboardingSeedRecords(),
    approvals: buildSeedApprovals(),
    meta: {
      lastIndexerSyncAt: new Date().toISOString(),
    },
  };
}
