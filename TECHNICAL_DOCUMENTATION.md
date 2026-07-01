# Technical Documentation

## Stack

- React 19, Vite, React Router
- Express 5
- Stellar SDK and Freighter API

## API Modules

- `api/src/config.js`
- `api/src/security.js`
- `api/src/validators.js`
- `api/src/repository.js`
- `api/src/stellar.js`
- `api/src/routes/`

## API Surface

- `POST /api/auth/challenge`
- `POST /api/auth/verify`
- `GET /api/network`
- `GET /api/health`
- `GET /api/trustloops`
- `GET /api/trustloops/:id`
- `POST /api/trustloops/prepare`
- `POST /api/trustloops/:id/prepare-action`
- `POST /api/trustloops/commit`
- `GET /api/events`
- `GET /api/onboarding`
- `POST /api/onboarding`
- `GET /api/metrics/overview`
- `GET /api/metrics/dashboard/stats`
- `GET /api/monitoring`
- `GET /api/monitoring/indexer`
- `GET /api/monitoring/security-checklist`

## Security Model

- SEP-10 wallet auth
- opaque bearer sessions
- participant-level authorization
- fee-sponsored transaction intents with expiry
- replay resistance on consumed intents
