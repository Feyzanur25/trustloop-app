# TrustLoop Testing & QA Guide

## Local Development Testing

### Prerequisites
- Node.js 18+
- MongoDB running (via docker-compose)
- Freighter wallet extension installed
- Test Stellar account with XLM balance

### Setup

```bash
# Start services
docker-compose up

# Or manually
docker run -d -p 27017:27017 mongo:7.0

# Terminal 2: Start API
cd api
npm install
npm run dev

# Terminal 3: Start Web
cd web
npm install
npm run dev
```

Access: http://localhost:5174

### Manual Testing Checklist

#### Dashboard Tests
- [ ] Connect Freighter wallet (Testnet)
- [ ] Create a new trust loop with valid wallet address
- [ ] Verify loop appears in dashboard
- [ ] Sort loops by different columns
- [ ] Search for loop by ID
- [ ] Verify auto-refresh every 30 seconds

#### Loop Workflow Tests
- [ ] Create loop (status: pending)
- [ ] Click "Confirm" button
- [ ] Verify status changes to "active"
- [ ] Navigate to loop detail page
- [ ] Verify approval gates don't show close button initially
- [ ] Request both approvals
- [ ] Verify close button becomes available
- [ ] Close loop (status: completed)

#### Metrics Page Tests
- [ ] Open /metrics
- [ ] Verify active loops count displays
- [ ] Verify completion rate calculates correctly
- [ ] Check trust score distribution chart
- [ ] Verify historical data persists
- [ ] Check mobile responsiveness

#### Monitoring Page Tests
- [ ] Open /monitoring
- [ ] Check API uptime percentage
- [ ] Verify latency charts display
- [ ] Check indexer freshness
- [ ] Verify security checklist items
- [ ] Check service status indicators

#### Onboarding Tests
- [ ] Open /onboarding
- [ ] Fill form with valid data
- [ ] Try submitting with missing required fields (should fail)
- [ ] Try invalid wallet address (should fail)
- [ ] Submit valid form
- [ ] Verify success notification
- [ ] Click "Export CSV"
- [ ] Verify downloaded file has headers and data
- [ ] Open CSV in spreadsheet app

#### Error Handling Tests
- [ ] Disconnect Freighter wallet mid-operation
- [ ] Verify error message displays
- [ ] Retry operation
- [ ] Verify recovery works
- [ ] Kill API server
- [ ] Verify frontend shows connection error
- [ ] Restart API
- [ ] Verify frontend recovers

#### Mobile Responsiveness Tests
- [ ] Open dashboard on mobile device/emulator
- [ ] Verify sidebar collapses
- [ ] Verify buttons are clickable size (44px+)
- [ ] Check tables scroll horizontally
- [ ] Test form inputs on mobile keyboard
- [ ] Verify modal is fullscreen on mobile

### Automated Testing (TBD)

```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react vitest

# Run tests
npm test

# Coverage report
npm run test:coverage
```

**Test Files Structure (Planned):**
```
web/src/__tests__/
  ├── pages/
  │   ├── Dashboard.test.jsx
  │   ├── LoopDetail.test.jsx
  │   └── Metrics.test.jsx
  ├── services/
  │   ├── http.test.js
  │   └── trustloopApi.test.js
  └── fixtures/
      └── mockData.js

api/test/
  ├── api.test.js
  ├── db.test.js
  └── fixtures/
      └── seedData.js
```

## Production Testing

### Pre-Deployment Checklist

#### Code Quality
- [ ] No console.log statements in production code
- [ ] No commented-out code blocks
- [ ] ESLint passes: `npm run lint`
- [ ] Prettier formatted: `npm run format`
- [ ] TypeScript errors resolved (if using TS)

#### Security
- [ ] No hardcoded API keys or secrets
- [ ] Environment variables documented
- [ ] CORS whitelist configured
- [ ] Rate limiting enabled
- [ ] Error messages don't leak internals
- [ ] Security headers set in Express

#### Performance
- [ ] Bundle size < 500KB (gzipped)
- [ ] First contentful paint < 2s
- [ ] API response time < 500ms (p95)
- [ ] Database queries indexed
- [ ] No N+1 query problems
- [ ] Images optimized and lazy-loaded

#### Documentation
- [ ] README updated with deployment links
- [ ] API documentation complete
- [ ] Architecture documented
- [ ] Deployment guide updated
- [ ] User guide written
- [ ] Security checklist completed

#### Data Validation
- [ ] 30+ active users registered
- [ ] CSV export tested with real data
- [ ] All wallet addresses valid (Stellar Explorer verified)
- [ ] Metrics dashboard shows realistic numbers
- [ ] Monitoring dashboard reflects prod setup

### Deployment Testing

#### Vercel Frontend Deployment
```bash
# Test build locally
npm run build
npm run preview

# Deploy to Vercel
vercel --prod
```

**Post-Deploy Tests:**
- [ ] Frontend loads at production URL
- [ ] API calls use correct base URL
- [ ] Wallet connection works
- [ ] Form submission succeeds
- [ ] CSV export works
- [ ] Mobile responsive

#### Railway API Deployment
```bash
# Test with production env vars
railway up
railway status
railway logs
```

**Post-Deploy Tests:**
- [ ] API health check passes
- [ ] MongoDB connection stable
- [ ] Horizon polling works
- [ ] All endpoints respond correctly
- [ ] Error logging works
- [ ] Monitoring dashboard shows live data

#### Load Testing (TBD)

```bash
# Install load testing tool
npm install -g artillery

# Create load test config
cat > load-test.yml << EOF
config:
  target: "https://trustloop-api.up.railway.app"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "API Load Test"
    flow:
      - get:
          url: "/api/health"
      - get:
          url: "/api/trustloops"
EOF

# Run load test
artillery run load-test.yml
```

## Monitoring & Alerts (Production)

### Metrics to Track
- API response time (p50, p95, p99)
- Error rate (5xx errors)
- Database query time
- Active user sessions
- Event indexing lag
- MongoDB disk usage

### Alert Thresholds
- API response time > 2s
- Error rate > 1%
- Database CPU > 80%
- Disk usage > 80%
- Event lag > 10 minutes

### Logging Strategy

**Frontend (Browser Console):**
```javascript
console.log(`[${new Date().toISOString()}] Action: create_loop`, { loopId, status });
```

**Backend (Server Logs):**
```javascript
logger.info('Loop created', { loopId, clientWallet, status });
logger.error('Database error', { error, query, collection });
```

**Log Aggregation (TBD):**
- Planned: ELK Stack or Datadog
- Current: Console logs + Railway built-in logs

## Bug Reporting Template

```markdown
## Bug: [Brief title]

**Environment:**
- OS: [Windows/Mac/Linux]
- Browser: [Chrome/Firefox/Safari]
- Frontend Version: [commit hash]
- API Version: [commit hash]

**Steps to Reproduce:**
1.
2.
3.

**Expected Behavior:**
...

**Actual Behavior:**
...

**Screenshots/Videos:**
[Attach if possible]

**Browser Console Errors:**
```
[Paste error]
```

**API Logs:**
```
[Paste API error]
```

**Workaround:**
[If known]
```

## Known Limitations

- **Testnet Only:** Real financial applications need Mainnet
- **30 Second Refresh:** Real-time updates planned for Phase 2
- **Single Region:** Global deployment planned for Phase 3
- **Manual Approval:** Automated approval workflows planned
- **No Rate Limiting:** API rate limits planned for Phase 2

## Performance Benchmarks

### Current Performance (Development)
- Dashboard load: ~1.5s
- Metrics load: ~2s
- API response: ~200ms
- CSV export: ~100ms

### Production Targets
- Dashboard load: <1s
- Metrics load: <1.5s
- API response: <300ms (p95)
- CSV export: <200ms

## Continuous Integration

### GitHub Actions workflow (`.github/workflows/ci-cd.yml`)
- Tests run on every push
- Build verification
- Security scanning
- Auto-deploy on main branch merge

```yaml
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run lint
      - run: npm run build
```
