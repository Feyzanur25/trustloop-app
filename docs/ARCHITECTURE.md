# TrustLoop Architecture

## Overview

TrustLoop is a two-tier application:

- `web/` contains the React frontend
- `api/` contains the Express backend

The app models a trust loop lifecycle:

1. create a loop
2. confirm it
3. capture approvals
4. close it when requirements are satisfied

## Runtime Topology

```text
Browser (React + Vite)
  -> /api requests
Express API
  -> JSON-backed persistent store
  -> optional Horizon event reads from Stellar Mainnet
```

## Frontend

### Pages

- `Dashboard.jsx`
  Main loop overview, search, sorting, and actions.
- `LoopDetail.jsx`
  Loop-level approval and closure state.
- `Events.jsx`
  Indexed event stream.
- `Metrics.jsx`
  Product and operational metrics.
- `Monitoring.jsx`
  Service health, indexer status, and security checklist.
- `Onboarding.jsx`
  User registry and export workflow.

### Services

- `http.js`
  Shared fetch wrapper with structured errors.
- `trustloopApi.js`
  Main frontend data service for loops, approvals, onboarding, and events.
- `opsApi.js`
  Operations-oriented reads for metrics, monitoring, and indexer state.
- `wallet.js`
  Freighter wallet connection and signing helpers.
- `submitTx.js`
  Horizon transaction submission helper.

## Backend

### Core files

- `api/src/index.js`
  API routes, persistence, metrics assembly, security checklist, monitoring state.
- `api/src/middleware.js`
  Error handling, request logging, and rate limiting.

### Persistence model

Server data is persisted in `api/data/store.json` and contains:

- trust loops
- events
- approvals
- onboarding profiles
- metadata such as last index sync time

This is intentionally simple and local-friendly. It is suitable for demo readiness and can be replaced later by a production database.

## Data Model

### Trust loop

```json
{
  "id": "TL-001",
  "counterparty": "G...",
  "role": "Client",
  "status": "Pending | Active | Completed",
  "score": 72,
  "expiresInDays": 14,
  "lastEvent": "trust.confirmed",
  "approvalPolicy": "single | dual",
  "createdAt": "2026-05-08T10:00:00.000Z"
}
```

### Approval

```json
{
  "clientApproved": true,
  "freelancerApproved": false,
  "requiredApprovals": 2,
  "updatedAt": "2026-05-08T10:30:00.000Z"
}
```

### Onboarding profile

```json
{
  "id": "OB-001",
  "name": "User Name",
  "email": "user@example.com",
  "walletAddress": "G...",
  "feedback": "Loved the approval flow",
  "productRating": 5,
  "createdAt": "2026-05-08T11:00:00.000Z"
}
```

## Security and Operational Controls

- server-side input validation
- API rate limiting
- structured request logging
- user-facing error handling
- approval-gated closure flow
- monitoring and security visibility exposed in-app

## Data Indexing

TrustLoop exposes indexed activity through:

- `GET /api/events`
- `GET /api/indexer`

The current backend maintains server-side event history and the frontend can also read optional Horizon trust events for wallet-specific views.

## Deployment Shape

Recommended deployment split:

- frontend on Vercel or Netlify
- backend on Railway, Render, Fly.io, or another Node host

The frontend should point to the backend through `VITE_API_BASE_URL`, or use the Vite proxy during local development.
