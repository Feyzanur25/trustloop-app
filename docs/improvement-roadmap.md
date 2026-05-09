# TrustLoop Improvement Roadmap

This roadmap is intended for the Level 6 README improvement section.

## Feedback Themes From The Seeded User Set

- users want clearer notifications
- users want persistent history and reliable records
- users want stronger metrics visibility
- users want mobile-friendly flows
- users want smoother error handling

## Improvements Already Reflected In The Repository

### 1. Persistent backend storage

Why:

- users should not lose loop or onboarding history on restart

Current repo evidence:

- [api/src/index.js](../api/src/index.js)

Public commit link:

- `ADD_REAL_PUBLIC_COMMIT_LINK_FOR_PERSISTENCE`

### 2. Monitoring and operations visibility

Why:

- production-readiness requires visible uptime, latency, and alert state

Current repo evidence:

- [web/src/pages/Monitoring.jsx](../web/src/pages/Monitoring.jsx)
- [api/src/index.js](../api/src/index.js)

Public commit link:

- `ADD_REAL_PUBLIC_COMMIT_LINK_FOR_MONITORING`

### 3. Metrics dashboard

Why:

- Level 6 requires user and transaction visibility

Current repo evidence:

- [web/src/pages/Metrics.jsx](../web/src/pages/Metrics.jsx)

Public commit link:

- `ADD_REAL_PUBLIC_COMMIT_LINK_FOR_METRICS`

### 4. Multi-party approval workflow

Why:

- this is the advanced feature and core trust differentiator

Current repo evidence:

- [web/src/pages/LoopDetail.jsx](../web/src/pages/LoopDetail.jsx)
- [api/src/index.js](../api/src/index.js)

Public commit link:

- `ADD_REAL_PUBLIC_COMMIT_LINK_FOR_APPROVAL_WORKFLOW`

### 5. Security hardening

Why:

- production readiness requires input validation, logging, and rate limiting

Current repo evidence:

- [api/src/middleware.js](../api/src/middleware.js)
- [docs/security-checklist.md](./security-checklist.md)

Public commit link:

- `ADD_REAL_PUBLIC_COMMIT_LINK_FOR_SECURITY_HARDENING`

## Next Phase Plan

These are strong next-month goals after the current submission:

- move from seeded/demo onboarding to real public responses
- deploy frontend and backend publicly with monitoring evidence
- replace local persistent store with managed production storage
- add stronger audit logging for approvals and closure history
- add deeper wallet and event verification against Horizon
