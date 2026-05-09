# TrustLoop Troubleshooting

## API Not Reachable

Check:

```powershell
curl http://localhost:4000/api/health
```

If that fails:

1. start the API from `api/`
2. verify port `4000` is free
3. verify frontend proxy points to the same API URL

## Frontend Loads But Data Is Missing

Common causes:

- API is not running
- `VITE_API_BASE_URL` points to the wrong host
- stale browser local storage

Try:

1. open browser devtools network tab
2. verify `/api/trustloops` responds
3. refresh once after restarting the backend

## Loop Creation Looks Duplicated

This usually comes from stale local cache left over from older builds.

Current behavior:

- when the API is reachable, frontend state is refreshed from backend data
- old local-only loop state is overwritten

If needed, clear local storage and reload.

## Onboarding Records Look Corrupted

Use the shared source of truth:

- onboarding seed: `shared/onboarding-seed.json`
- CSV evidence: `docs/onboarding-template.csv`
- Excel evidence: `docs/onboarding-responses.xlsx`

## Score Values Look Wrong

Trust scores are derived from:

- loop status
- approval progress
- approval policy
- expiry window
- a small per-loop identity variation

If all scores look identical, verify both frontend and backend are running the latest code.
