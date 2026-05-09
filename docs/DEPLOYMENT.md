# TrustLoop Deployment Guide

## Recommended Setup

Use a split deployment:

- frontend: Vercel or Netlify
- backend: Railway, Render, Fly.io, or another Node host

## Local Development

### API

```powershell
cd api
npm install
npm run dev
```

### Frontend

```powershell
cd web
npm install
npm run dev
```

## Environment Variables

### API

Copy [api/.env.example](../api/.env.example) to `.env` and adjust as needed.

Current backend supports:

- `PORT`
- `NODE_ENV`
- `CORS_ORIGIN`

### Frontend

Copy [web/.env.example](../web/.env.example) to `.env.local`.

Typical production values:

```env
VITE_API_BASE_URL=https://your-api-domain.example
VITE_STELLAR_NETWORK=TESTNET
VITE_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

## Vercel Frontend

Set the project root to `web/`.

Recommended settings:

- build command: `npm run build`
- output directory: `dist`
- install command: `npm install`

Environment variables:

- `VITE_API_BASE_URL`
- `VITE_STELLAR_NETWORK`
- `VITE_STELLAR_HORIZON_URL`

## Backend Host

For the API, use:

- Node 18+
- start command: `npm start`
- working directory: `api/`

Health check:

`GET /api/health`

## Deployment Validation

After deploy, verify:

1. `GET /api/health` responds
2. frontend dashboard loads
3. onboarding submission succeeds
4. loop creation works
5. metrics page loads
6. monitoring page loads

## Submission URLs To Fill In

- frontend URL: `ADD_DEPLOYED_FRONTEND_URL`
- backend URL: `ADD_DEPLOYED_API_URL`
- public repository URL: `ADD_PUBLIC_GITHUB_REPO_URL`
