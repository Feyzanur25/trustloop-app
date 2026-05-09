# TrustLoop Testing Guide

## Validation Commands

### Frontend

```powershell
cd web
npm run lint
npm run build
```

### Backend

```powershell
cd api
node --check src/index.js
```

## Manual Test Checklist

### Dashboard

- dashboard loads without auto-refresh looping
- search filters loops correctly
- sorting works on table columns
- confirm action moves pending loops to active
- close action is blocked until approvals are ready

### Loop detail

- approvals can be captured
- approvals can be revoked
- ready-to-close state updates visibly

### Onboarding

- form rejects missing required fields
- valid onboarding record is saved
- CSV export works
- registry updates after submission

### Metrics

- `/metrics` loads with non-empty cards and charts
- trust score ranges change when loop state changes

### Monitoring

- `/monitoring` loads uptime, latency, alerts, and security checklist
- `/api/indexer` reflects event counts

## Release Checklist

- `npm run lint` passes
- `npm run build` passes
- backend syntax check passes
- README links are updated with real public URLs
- social post link added
- deployment screenshots added
- real Google Form and response sheet links added
