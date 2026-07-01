# TrustLoop Improvement Roadmap

This document is the Level 6 feedback and next-phase section referenced from the README.

## Main Feedback Themes

- users want clearer transaction visibility
- users want stronger operational confidence
- users want better mobile usability
- users want more resilient persistence
- users want clearer errors and onboarding guidance

## Implemented Improvements With Commit Evidence

### 1. Persistent backend storage

Why:

- users should not lose loop or onboarding history on restart

Repo evidence:

- [../api/src/index.js](../api/src/index.js)
- [../api/src/data/stateStore.js](../api/src/data/stateStore.js)

Commit evidence:

- [`23cc025`](https://github.com/Feyzanur25/trustloop-app/commit/23cc025d570999713a4c99cd27ea05e929cf9ffa)
- [`f200b88`](https://github.com/Feyzanur25/trustloop-app/commit/f200b88975d13ef49ee061ae5ecfb0fd885d3077)

### 2. Monitoring and operations visibility

Why:

- production readiness needs uptime, latency, and indexer status visibility

Repo evidence:

- [../web/src/pages/Monitoring.jsx](../web/src/pages/Monitoring.jsx)
- [../api/src/data/metrics.js](../api/src/data/metrics.js)

Commit evidence:

- [`684fec5`](https://github.com/Feyzanur25/trustloop-app/commit/684fec542fd4d5c6cc13944d9ae17fc5d576abb9)
- [`80024e7`](https://github.com/Feyzanur25/trustloop-app/commit/80024e76cc8845bdca5574583b252e4b9cb35b63)

### 3. Metrics dashboard

Why:

- Level 6 requires user, transaction, and activity visibility

Repo evidence:

- [../web/src/pages/Metrics.jsx](../web/src/pages/Metrics.jsx)
- [../api/src/routes/metrics.db.js](../api/src/routes/metrics.db.js)

Commit evidence:

- [`684fec5`](https://github.com/Feyzanur25/trustloop-app/commit/684fec542fd4d5c6cc13944d9ae17fc5d576abb9)
- [`e821b14`](https://github.com/Feyzanur25/trustloop-app/commit/e821b1413fc9a4b2a23e0a264b1fae3571d13776)

### 4. Multi-party approval workflow

Why:

- this is the advanced feature and the main trust-control layer

Repo evidence:

- [../web/src/lib/trustHelpers.js](../web/src/lib/trustHelpers.js)
- [../api/src/routes/loops.db.js](../api/src/routes/loops.db.js)

Commit evidence:

- [`c47e9f2`](https://github.com/Feyzanur25/trustloop-app/commit/c47e9f25162ade3a513ea4925a02cc5d03ec3e3a)
- [`e821b14`](https://github.com/Feyzanur25/trustloop-app/commit/e821b1413fc9a4b2a23e0a264b1fae3571d13776)

### 5. Security hardening

Why:

- production usage requires validation, logging, and abuse controls

Repo evidence:

- [../api/src/middleware.js](../api/src/middleware.js)
- [../api/src/routes/onboarding.db.js](../api/src/routes/onboarding.db.js)
- [./security-checklist.md](./security-checklist.md)

Commit evidence:

- [`16096e2`](https://github.com/Feyzanur25/trustloop-app/commit/16096e2b2da10f6f4d9263a6d4bb06c29e5f90cf)
- [`684fec5`](https://github.com/Feyzanur25/trustloop-app/commit/684fec542fd4d5c6cc13944d9ae17fc5d576abb9)

## Next Phase Plan

- replace local persistence with managed production storage
- add mainnet transaction explorer deep links per loop
- add alert routing for monitoring failures
- add audit-friendly approval history and export
- add richer onboarding analytics from live Google Form responses
