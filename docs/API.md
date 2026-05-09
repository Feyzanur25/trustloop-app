# TrustLoop API Reference

## Base URL

- local: `http://localhost:4000`
- deployed: `ADD_DEPLOYED_API_URL`

## Response Style

The API returns plain JSON payloads. Errors use:

```json
{
  "error": "Human readable message",
  "statusCode": 400,
  "timestamp": "2026-05-08T10:00:00.000Z"
}
```

## Core Endpoints

### Health

`GET /api/health`

Returns:

- API status
- server timestamp
- uptime seconds

### Trust loops

`GET /api/trustloops`

Returns all loops with approval state.

`GET /api/trustloops/:id`

Returns one loop with approval state.

`POST /api/trustloops`

Request body:

```json
{
  "counterparty": "G...",
  "role": "Client",
  "expiresInDays": 14,
  "approvalPolicy": "dual"
}
```

`POST /api/trustloops/:id/confirm`

Moves a loop from `Pending` to `Active`.

`POST /api/trustloops/:id/approve`

Request body:

```json
{
  "actor": "Client"
}
```

Captures an approval for `Client` or `Freelancer`.

`POST /api/trustloops/:id/revoke`

Request body:

```json
{
  "actor": "Freelancer"
}
```

Revokes the selected approval.

`POST /api/trustloops/:id/close`

Closes an active loop only if the required approval state is satisfied.

### Events

`GET /api/events`

Returns indexed trust loop events in reverse chronological order.

### Onboarding

`GET /api/onboarding`

Returns:

```json
{
  "count": 30,
  "records": []
}
```

`POST /api/onboarding`

Request body:

```json
{
  "name": "User Name",
  "email": "user@example.com",
  "walletAddress": "G...",
  "feedback": "Clear workflow",
  "productRating": 5
}
```

### Metrics and monitoring

`GET /api/dashboard/stats`

Quick summary used by the dashboard.

`GET /api/metrics/overview`

Detailed metrics for the metrics dashboard.

`GET /api/monitoring`

Monitoring summary including uptime, request counts, latency, and alerts.

`GET /api/indexer`

Indexer visibility including event totals and freshness.

`GET /api/security-checklist`

Security checklist state exposed for the monitoring screen.

## Rate Limiting

All `/api` routes are protected by a lightweight in-memory rate limiter.

Current default:

- window: 60 seconds
- limit: 180 requests per client

If exceeded, the API returns `429 Too Many Requests`.

## Notes

- the backend is currently designed for demo and pilot environments
- persistence is server-side and survives restart through `api/data/store.json`
- wallet signing is optional for core UI flows, but available for Stellar demo interactions
