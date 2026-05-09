# TrustLoop

TrustLoop is a Stellar Testnet workflow application for creating, confirming, approving, monitoring, and closing trust loops between two parties.

The repository is structured to satisfy the technical side of the Level 6 / Black Belt requirements:

- live metrics dashboard
- monitoring dashboard
- security checklist
- indexed event visibility
- onboarding registry with export
- advanced feature: multi-party approval before closure
- production-oriented API with persistence, validation, logging, and rate limiting

## Current Status

Implemented in this repository:

- React + Vite frontend
- Express API backend
- persistent backend storage via JSON-backed server store
- 30+ seeded onboarding users
- CSV export and bundled XLSX evidence file
- metrics, monitoring, and security dashboards
- multi-party approval workflow
- data indexing visibility endpoint and dashboard

External evidence still required before final submission:

- public GitHub repository URL
- public frontend deployment URL
- public backend deployment URL
- real Google Form link
- real exported Google Sheet / Excel link
- real community post link
- real screenshot links
- real public commit links in the improvement section
- actual commit count in Git history

## Quick Start

### Local development

```powershell
# API
cd api
npm install
npm run dev

# Frontend
cd web
npm install
npm run dev
```

Local URLs:

- frontend: `http://localhost:5173`
- API: `http://localhost:4000`
- metrics dashboard: `http://localhost:5173/metrics`
- monitoring dashboard: `http://localhost:5173/monitoring`
- onboarding hub: `http://localhost:5173/onboarding`

### Environment files

- API example: [api/.env.example](./api/.env.example)
- web example: [web/.env.example](./web/.env.example)

## Product Features

- dashboard with trust loop overview, search, sorting, and actions
- loop detail page with approval state and closure readiness
- event feed with indexed trust activity
- metrics dashboard for usage, throughput, and score health
- monitoring dashboard for uptime, latency, alerts, and system visibility
- onboarding hub for collecting user details and exporting records
- advanced multi-party approval workflow before loop closure

## Tech Stack

### Frontend

- React 19
- Vite
- Tailwind CSS
- Recharts
- Lucide React

### Backend

- Node.js
- Express
- JSON-backed persistent store in `api/data/store.json`
- request logging and rate limiting middleware

### Stellar

- Stellar Testnet
- Horizon testnet endpoint
- Freighter wallet integration

## Application Routes

- `/` dashboard
- `/events` indexed trust loop events
- `/metrics` metrics dashboard
- `/monitoring` monitoring and security view
- `/onboarding` onboarding registry and export
- `/loops/:id` loop detail and approval workflow

## Advanced Feature

### Multi-party approval workflow

TrustLoop implements a multi-signature style approval flow at the application level:

1. a loop is created in `Pending`
2. it is confirmed into `Active`
3. approvals are captured from the required parties
4. closure remains blocked until approval requirements are satisfied

Proof:

- UI: [web/src/pages/LoopDetail.jsx](./web/src/pages/LoopDetail.jsx)
- service logic: [web/src/services/trustloopApi.js](./web/src/services/trustloopApi.js)
- API logic: [api/src/index.js](./api/src/index.js)

## Level 6 Requirement Matrix

| Requirement | Repository Status | Evidence |
| --- | --- | --- |
| 30+ verified active users | Seeded/demo-ready | [docs/onboarding-template.csv](./docs/onboarding-template.csv), [docs/onboarding-responses.xlsx](./docs/onboarding-responses.xlsx) |
| Metrics dashboard live | Implemented | route `/metrics`, [docs/user-guide.md](./docs/user-guide.md) |
| Security checklist completed | Implemented | [docs/security-checklist.md](./docs/security-checklist.md) |
| Monitoring active | Implemented | route `/monitoring`, [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) |
| Data indexing implemented | Implemented | `/api/indexer`, [docs/API.md](./docs/API.md) |
| Full documentation | Implemented | this README + `docs/` |
| 1 community contribution | External proof required | add final public link |
| 1 advanced feature implemented | Implemented | multi-party approval workflow |
| 15+ meaningful commits | External Git history required | check public Git history |
| 30+ meaningful commits | External Git history required | target this higher threshold because the brief is inconsistent |
| Production-ready application | Technically prepared | deployment + public evidence still needed |

## Required README Submission Fields

### Live Demo Link

- frontend: `ADD_DEPLOYED_FRONTEND_URL`
- backend: `ADD_DEPLOYED_API_URL`

### Metrics Dashboard

- route: `/metrics`
- screenshot or public image link: `ADD_METRICS_SCREENSHOT_LINK`

### Monitoring Dashboard

- route: `/monitoring`
- screenshot or public image link: `ADD_MONITORING_SCREENSHOT_LINK`

### Security Checklist

- document: [docs/security-checklist.md](./docs/security-checklist.md)

### Community Contribution

- template: [docs/community-post-template.md](./docs/community-post-template.md)
- final public post link: `ADD_COMMUNITY_POST_URL`

### Data Indexing

TrustLoop indexes trust loop activity from API state and surfaces freshness/volume via:

- `GET /api/indexer`
- monitoring dashboard `/monitoring`

Technical references:

- [api/src/index.js](./api/src/index.js)
- [docs/API.md](./docs/API.md)
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

### Exported User Response Sheet

- CSV artifact: [docs/onboarding-template.csv](./docs/onboarding-template.csv)
- Excel artifact: [docs/onboarding-responses.xlsx](./docs/onboarding-responses.xlsx)
- real Google Sheet or Form export link: `ADD_REAL_RESPONSE_SHEET_URL`

## 30+ User Wallet Addresses

The current seeded/demo wallet registry used by the onboarding dataset:

```text
GBXTMXHHEEEW3VNYHEZYAVV3Q7MF7SLP2CXK3C5K6IBCNNX7CP67F2IM
GC4UYA4GWY35KGQ7U434DXQBC4HZ6HAMJ2LOMMHC3FJAHHV23RJUB7EV
GDPGD3WEAVACUKCONRDUELD46ML5KDQAC2JTF7QE6EEEW7VSFYZEBZX5
GA4INDKZSBMYUL2DKUMC2732COE4CLKRX6YUIZS56UWLL2F6DD4ZL3G5
GDYD6GZ6QWKEULFZU6HMLSH4JM5IAJXBY3HFMCHZHTHIGH5DKEVNX2ZM
GDWL2RCDFQVDGH3IJL4ZGLX5CGU27MO6R7OQVCNYLQWROYZND2B6ENCI
GBL2APVSMV2IYSO2B6C67VASKRJHXVCAOSHEBLC6BM4CBSKDMQOU25HU
GAVNSWLAN4VG54IVLHCF3O45ZOAZSPLNH7GNR25RVFLH434BAQS3JJAO
GCCHWOJNEC7VJ2NCTIQYKYYYWZSZRUU2KAYVY5VMDWF3ONYKWUH6DO7I
GCHRZKNZGV27USWARNID7YPVUBXV6WNPG6YRVLKQ4QDUURMJY4OU5JJ5
GDNN6X4H3SUEN2F5XUQA3BDYCSRO54AVV5GWFIGO3DTLPONEMCS4DSLV
GCNSHMQNN66RDGXXWA3MV7CHOMZ5YCC2D7EYPUJWZICTZV4QQ2ZMNFOP
GCKX3NOWP7LYF2L6YWMFIKNKROBHVLDEQSAAWWQHDSXNVWUTDHRPZYIH
GCHS7OSQNPBA2XUFAVGIPNK72DED3WWD2DJOA4ANDQ7BHM4R5GDRJSS7
GCWXWMORXOEB2JWVCE7LBWFLNT5QFQ5JKQVRFNB3AZRQUSLUCHXBM2O2
GDLXN35JGULDTNEZGGFV6IQKDULH5O6GN5L7BY252AMAFME7RCXYWXAB
GBJP4RV3PLYSQZKQMUQGO5NO4XIEEYXHYIVR2GCWETFNGSEPQRRSAN6O
GBTLBOA5M5P6RUMWVL6UXRFFUAJX4X6AMHFFY3LDM5L6ES2FQL2OEFER
GBJE3VLOOSAJKZFB7ILEUY6UK2CONTPQVI75APNG7USR64VT2AAMETI6
GCSDJ2BQTERO3RFGLUR4Q4KVJKWGFWAY423HBIWHJSTSMUE7DNUL2JGO
GCP42RESSZ2YTIK7SMTRC3T27AIPHBMJJMGOMK63YK4YTLMF6HWO26QX
GB67HLEMWX3VLRYPSLUFZ5HCTIF55DHNPTHV55YAY5OKFTKVLE7IN5F4
GC5Y25BO5R5DPU6NHPUZHW6JDABW5Z4ETAOLE2D4ZOU4O36ISJQRVBRS
GBOQMOY5KHPMVXFZNUT4CNH2N3NPFXTXD4G6MQT7JXKGU6VSTRPRRO5P
GD7M6TIBC422HNXG5SMID5Z2GVRQ55ODDG63HEZXGR7DJ36YLD6VKHIA
GDFK6ZKBYVXSS6XU5HC3BDGOK5N2GOQ6LSIDXDIWZYOQML5ZFUEOH7MG
GAAVRCI7U3OG5T52LIY53KP5XWZCZ7ZK6TOU7CZH5NHLMOGCEKFBP3CN
GBFFWPNU2VKKUBO2FPMWF6PS6XGFN3RR7G7R3PXFXOHRNDEECE7LPWSA
GBZYOAEY4H5BFZY2FN7GWUOG6TX54S37VKSYZMWDSMMLD5GJLS46T4HW
GBG3HAUGSWVSVF7LWRXCDFXBJLBDMSBWISLTYDAOXRR7BKOZS572RTX4
```

## User Onboarding Evidence

### Google Form setup

- guide: [docs/google-form-template.md](./docs/google-form-template.md)

### Export files

- CSV: [docs/onboarding-template.csv](./docs/onboarding-template.csv)
- Excel: [docs/onboarding-responses.xlsx](./docs/onboarding-responses.xlsx)

### Improvement plan based on feedback

- roadmap: [docs/improvement-roadmap.md](./docs/improvement-roadmap.md)
- note: replace placeholder commit links in that document with your real public commit URLs before submission

## Documentation Index

- architecture: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- API reference: [docs/API.md](./docs/API.md)
- user guide: [docs/user-guide.md](./docs/user-guide.md)
- deployment guide: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- testing guide: [docs/TESTING.md](./docs/TESTING.md)
- troubleshooting guide: [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
- security checklist: [docs/security-checklist.md](./docs/security-checklist.md)
- improvement roadmap: [docs/improvement-roadmap.md](./docs/improvement-roadmap.md)
- submission pack: [docs/level6-submission.md](./docs/level6-submission.md)
- demo day pitch: [docs/demo-day-pitch.md](./docs/demo-day-pitch.md)
- community post template: [docs/community-post-template.md](./docs/community-post-template.md)

## Validation Commands

```powershell
cd web
npm run lint
npm run build

cd ..\api
node --check src/index.js
```

## Final Submission Notes

This repository now contains the application code, dashboards, export artifacts, and documentation structure needed for a Level 6 submission. The remaining non-code items are public deployment, public social proof, public commit history, and real user collection links.
