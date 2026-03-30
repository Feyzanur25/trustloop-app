# TrustLoop System Architecture

## Overview

TrustLoop is a distributed trust workflow manager built on Stellar Testnet with production-grade monitoring and analytics.

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│  Dashboard | Events | Metrics | Monitoring | Onboarding    │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS / REST API
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Backend API (Express.js)                        │
│  Health | TrustLoops | Events | Analytics | Monitoring      │
└────────────────────┬──────────────────────┬─────────────────┘
                     │                      │
         ┌───────────┴────────────┐    ┌────┴──────────┐
         │ MongoDB (Persistence)  │    │ Stellar API   │
         │ - Loops & Events       │    │ (Horizon)     │
         │ - Users & Feedback     │    │ - Indexing    │
         │ - Analytics Data       │    │ - Validation  │
         └───────────────────────┘    └───────────────┘
```

## Component Architecture

### Frontend Layer (`web/`)

**Pages:**
- `Dashboard.jsx` - Main UI, trust loop overview
- `LoopDetail.jsx` - Individual loop with multi-party approval
- `Events.jsx` - Event history feed
- `Metrics.jsx` - Usage analytics and charts
- `Monitoring.jsx` - System health dashboard
- `Onboarding.jsx` - User registration & CSV export

**Services:**
- `http.js` - HTTP client with retry logic
- `trustloopApi.js` - Trust loop API client
- `opsApi.js` - Stellar Horizon event indexing
- `soroban.js` - Soroban contract interaction (future)
- `wallet.js` - Freighter wallet integration
- `demoTx.js` - Demo transaction generator
- `demoTx.js` - Transaction submission

**UI Components:**
- `AppLayout.jsx` - Root layout with navbar
- `Sidebar.jsx` - Navigation menu
- `Modal.jsx` - Reusable modal component

### Backend Layer (`api/`)

**Core Files:**
- `index.js` - Express server setup, route handlers
- `db.js` - MongoDB connection & initialization
- `middleware.js` - Error handling, CORS, logging

**Data Models (`api/src/models/`):**
- `Loop.js` - Trust loop document schema
- `Event.js` - Indexed blockchain event schema
- `Approval.js` - Multi-party approval state
- `Onboarding.js` - User registration schema

**Endpoints:**
```
GET  /api/health                    # Health check
GET  /api/trustloops                # List loops
GET  /api/trustloops/:id            # Get loop detail
POST /api/trustloops                # Create loop
POST /api/trustloops/:id/confirm    # Confirm loop
POST /api/trustloops/:id/close      # Close loop
GET  /api/events                    # List events
GET  /api/dashboard/stats           # Quick stats
GET  /api/metrics/overview          # Detailed metrics
GET  /api/monitoring                # System health
GET  /api/indexer                   # Indexer status
GET  /api/security-checklist        # Security audit
```

### Data Layer

**MongoDB Collections:**

```javascript
// Loop Document
{
  _id: ObjectId,
  clientWallet: "GAAA...",
  freelancerWallet: "GBBB...",
  status: "pending|active|completed|cancelled",
  amount: 100,
  createdAt: Date,
  expirationDate: Date,
  score: Number,
  closedAt: Date,
  clientApproval: Boolean,
  freelancerApproval: Boolean
}

// Event Document
{
  _id: ObjectId,
  loopId: ObjectId,
  transactionHash: "abc123",
  operationType: "create|confirm|close",
  timestamp: Date,
  indexedAt: Date,
  blockNumber: Number,
  metadata: {}
}

// Onboarding Document
{
  _id: ObjectId,
  name: String,
  email: String,
  walletAddress: "GAAA...",
  rating: 1-5,
  feedback: String,
  createdAt: Date,
  verifiedAt: Date
}
```

### External Integrations

**Stellar Horizon:**
- Real-time event polling every 30s
- Transaction verification
- Account balance queries
- Testnet validation

**Freighter Wallet:**
- User authentication via wallet connection
- Transaction signing
- Keypair management (browser-based, non-custodial)

## Deployment Architecture

### Local Development
```
docker-compose up
├── Frontend (port 5174)
├── API (port 4000)
└── MongoDB (port 27017)
```

### Production Deployment Options

**Option 1: Vercel + Railway**
- Frontend: Vercel (serverless)
- Backend: Railway (containerized Node.js)
- Database: Railway MongoDB or MongoDB Atlas

**Option 2: Railway Full Stack**
- Single Railway project with both services
- Automatic deployments from git
- Built-in monitoring and logging

**Option 3: Heroku**
- Single Heroku dyno (if small scale)
- MongoDB Atlas for database
- GitHub Actions for deployment

**Option 4: AWS/GCP**
- ECS/Cloud Run for containers
- CloudSQL/DocumentDB for database
- CloudFront for CDN
- CloudWatch for monitoring

## Data Flow

### Creating a Trust Loop

```
User (Frontend)
  ↓
  ├─ Connect Freighter Wallet ─→ Wallet.js
  ├─ Fill Loop Details (counterparty, amount)
  └─ Submit Form
       ↓
  HTTP POST /api/trustloops
       ↓
Backend - Loop Creation
  ├─ Validate wallet signature
  ├─ Verify counterparty wallet exists
  ├─ Create Loop document in MongoDB
  └─ Return loop ID
       ↓
Frontend
  ├─ Poll /api/events for confirmation
  └─ Show success message
       ↓
Background - Event Indexing
  ├─ Horizon polls every 30s
  ├─ Finds matching transactions
  └─ Creates Event documents
```

### Monitoring & Analytics

```
Frontend Dashboard (auto-refresh 30s)
  ↓
GET /api/dashboard/stats → Quick metrics
  ↓
Backend Aggregation
  ├─ Count active loops
  ├─ Calculate completion rate
  ├─ Compute trust scores
  ├─ Aggregate user metrics
  └─ Check system health
       ↓
Response with:
  - Active users
  - Completion rate %
  - Average trust score
  - API uptime
  - Last indexed event
```

## Security Architecture

**Principles:**
1. Non-custodial - User keeps private keys in Freighter
2. Testnet-only - No real assets at risk during development
3. Transparent - Security status visible in-app
4. Validated - Multi-party approval required for closure

**Data Protection:**
- MongoDB connection string in environment variables
- CORS configured for known domains only
- API validates wallet signatures
- Error messages user-friendly (don't leak internals)
- Rate limiting planned for Phase 2

**Deployment Security:**
- HTTPS/SSL enforced in production
- Environment variables for secrets
- Health checks configured
- Monitoring for suspicious activity

## Performance Optimization

**Frontend:**
- Skeleton loading screens (shimmer effect)
- Event-driven updates (no constant polling)
- API response caching (frontend memory)
- Code splitting with Vite

**Backend:**
- Database query optimization (indexes on common fields)
- Connection pooling for MongoDB
- Error middleware prevents crashes
- Horizon polling batching

**Monitoring:**
- API response time tracking
- Error rate alerting
- Database performance metrics
- Indexer freshness checks

## Scalability Roadmap

**Phase 1 (Current):** 30-100 active users
- Single MongoDB instance
- Single API instance
- Horizon polling sufficient

**Phase 2:** 100-1000 active users
- MongoDB replica set for HA
- API auto-scaling (Railway/Heroku)
- WebSocket for real-time updates
- Redis cache layer

**Phase 3:** 1000+ active users
- Distributed backend (multiple regions)
- Database sharding
- Message queue (event processing)
- CDN for frontend assets

## Troubleshooting

**API not responding:**
- Check MongoDB connection: `GET /api/health`
- Review environment variables (.env)
- Check logs: `docker-compose logs api`

**Events not indexing:**
- Check Horizon API status
- Verify transaction hash exists on Testnet
- Check indexer endpoint: `GET /api/indexer`

**Frontend not updating:**
- Clear browser cache (hard refresh)
- Check API connectivity
- Review browser console for errors

## Maintenance

**Regular Tasks:**
- Monitor MongoDB disk usage
- Review API error logs weekly
- Update dependencies monthly
- Verify Horizon API availability
- Test failover procedures

**Backup Strategy:**
- MongoDB Atlas automated backups
- GitHub repo as code backup
- Environment variable backup in manager
