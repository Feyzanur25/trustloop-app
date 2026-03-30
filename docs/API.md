# TrustLoop API Documentation

## Base URL
- Development: `http://localhost:4000`
- Production: `https://trustloop-api.up.railway.app`

## Authentication
All endpoints use wallet-based verification. Include wallet address in request headers or body.

## Core Endpoints

### Health Check
```
GET /api/health
```
Returns server status and MongoDB connection state.

### Trust Loops

#### List All Loops
```
GET /api/trustloops?status=active&limit=50&offset=0
```

#### Get Loop Detail
```
GET /api/trustloops/:id
```

#### Create Loop
```
POST /api/trustloops
Body: {
  "clientWallet": "G...",
  "freelancerWallet": "G...",
  "amount": 100,
  "status": "pending",
  "expirationDate": "2026-04-30"
}
```

#### Confirm Loop (Pending → Active)
```
POST /api/trustloops/:id/confirm
```

#### Close Loop (Active → Completed)
```
POST /api/trustloops/:id/close
Body: {
  "clientApproval": true,
  "freelancerApproval": true
}
```

### Events

#### Get Indexed Events
```
GET /api/events?limit=100&loopId=:loopId
```

Returns on-chain events from Horizon with timestamps.

### Analytics

#### Dashboard Stats
```
GET /api/dashboard/stats
```
Response: `{ activeLoops, completedLoops, avgScore, totalUsers }`

#### Detailed Metrics
```
GET /api/metrics/overview
```
Response: Usage metrics, completion rate, retention data

### Monitoring

#### System Health
```
GET /api/monitoring
```
Response: API uptime, latency, error rates, alerts

#### Indexer Status
```
GET /api/indexer
```
Response: Last indexed block, event count, freshness

#### Security Checklist
```
GET /api/security-checklist
```
Response: Security status and completed items

## Response Format
All responses use standard JSON format:

```json
{
  "success": true,
  "data": { /* payload */ },
  "message": "Optional message"
}
```

## Error Handling

| Code | Meaning |
|------|---------|
| 200 | OK |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid wallet) |
| 404 | Not Found |
| 500 | Server Error |

## Rate Limiting (TBD)
- Planned: 100 requests per minute per wallet
- Current: Unlimited (development)

## Webhook Support (TBD)
- Planned: Event notifications via HTTP POST
- Status: Planned for Phase 2

## SDK / Client Libraries
- JavaScript/TypeScript: Coming soon
- Python: Coming soon
