# Performance Optimization Guide

## Overview

This guide provides strategies to optimize TrustLoop for production performance.

## Frontend Optimization

### Bundle Size Analysis

```bash
# Analyze bundle size
cd web
npm run build

# Use Bundle Analyzer
npm install --save-dev @vitejs/plugin-visualize
# Then check dist/ folder
```

**Current Bundle Sizes:**
- Main bundle: ~180KB (gzipped)
- Vendor split: ~120KB
- CSS: ~45KB

**Target:** <250KB total (gzipped)

### Code Splitting

```javascript
// Implement route-based code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Metrics = lazy(() => import('./pages/Metrics'));
const Monitoring = lazy(() => import('./pages/Monitoring'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
```

### Image Optimization

- Use WebP format where possible
- Lazy load images: `<img loading="lazy" />`
- Compress images: 80% quality for JPGs
- Use appropriate dimensions

### CSS Optimization

```javascript
// Tailor mode in tailwind.config.js
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  // This automatically removes unused CSS
}
```

### JavaScript Minification

```bash
# Vite automatically minifies in production
npm run build

# Verify minification in dist/
```

### Caching Strategy

**HTTP Headers:**
```
Cache-Control: max-age=31536000  # Static assets (1 year)
Cache-Control: max-age=0, must-revalidate  # HTML (no cache)
Cache-Control: max-age=3600  # API responses (1 hour)
```

**localStorage Caching:**
```javascript
// Cache API responses locally
const cacheKey = `trustloop_${endpoint}`;
const cached = localStorage.getItem(cacheKey);

if (cached && Date.now() - JSON.parse(cached).timestamp < 5 * 60 * 1000) {
  return JSON.parse(cached).data;
}

const data = await fetch(endpoint);
localStorage.setItem(cacheKey, JSON.stringify({
  data,
  timestamp: Date.now()
}));
```

### Runtime Performance

**Event listener cleanup:**
```javascript
useEffect(() => {
  const handler = () => handleResize();
  window.addEventListener('resize', handler);
  
  return () => window.removeEventListener('resize', handler);  // Cleanup!
}, []);
```

**Debounce expensive operations:**
```javascript
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

const handleSearch = debounce((query) => {
  // API call
}, 300);
```

### Loading Performance

**Intersection Observer for lazy loading:**
```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadData(entry.target);
      observer.unobserve(entry.target);
    }
  });
});

document.querySelectorAll('.lazy-load').forEach(el => {
  observer.observe(el);
});
```

## Backend Optimization

### Database Query Optimization

**Create indexes:**
```javascript
// MongoDB index creation
db.loops.createIndex({ clientWallet: 1 });
db.loops.createIndex({ status: 1, createdAt: -1 });
db.events.createIndex({ transactionHash: 1 });
db.users.createIndex({ walletAddress: 1, createdAt: -1 });
```

**Avoid N+1 queries:**
```javascript
// ❌ Bad: N+1 queries
const loops = await Loop.find();
for (const loop of loops) {
  loop.events = await Event.find({ loopId: loop._id });
}

// ✅ Good: Single query with aggregation
const loops = await Loop.aggregate([
  {
    $lookup: {
      from: 'events',
      localField: '_id',
      foreignField: 'loopId',
      as: 'events'
    }
  }
]);
```

**Limit result set:**
```javascript
// ❌ Bad: Load all records
const loops = await Loop.find();

// ✅ Good: Paginate
const page = req.query.page || 1;
const limit = 50;
const loops = await Loop.find()
  .skip((page - 1) * limit)
  .limit(limit);
```

### Connection Pooling

```javascript
// In db.js - Configure connection pool
mongoose.connect(mongoUri, {
  maxPoolSize: 10,  // Connection pool size
  minPoolSize: 2,   // Minimum connections
  socketTimeoutMS: 45000,
  retryWrites: true,
});
```

### Response Compression

```javascript
// In index.js
const compression = require('compression');
app.use(compression());  // Gzip responses
```

### Caching Middleware

```javascript
// Redis cache (for Phase 2)
const redis = require('redis');
const client = redis.createClient();

app.get('/api/trustloops', async (req, res) => {
  const cacheKey = 'trustloops:all';
  
  // Check cache first
  const cached = await client.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));
  
  // Fetch from DB
  const loops = await Loop.find();
  
  // Cache for 5 minutes
  await client.setEx(cacheKey, 300, JSON.stringify(loops));
  
  res.json(loops);
});
```

### Async Queue Processing

```javascript
// For long-running operations (Phase 2)
const Bull = require('bull');
const indexQueue = new Bull('horizon-indexing');

// Producer
indexQueue.add({ startBlock: 1000 }, { repeat: { every: 30000 } });

// Consumer
indexQueue.process(async (job) => {
  const events = await indexHorizonEvents(job.data.startBlock);
  return events;
});
```

## API Load Testing

### Using Artillery

```yaml
# load-test.yml
config:
  target: "http://localhost:4000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up"
    - duration: 60
      arrivalRate: 100
      name: "Spike"

scenarios:
  - name: "Dashboard Flow"
    flow:
      - get:
          url: "/api/health"
          expect: 200
      - get:
          url: "/api/trustloops"
          expect: 200
      - get:
          url: "/api/dashboard/stats"
          expect: 200
      - post:
          url: "/api/trustloops"
          json:
            clientWallet: "GAAA..."
            freelancerWallet: "GBBB..."
            amount: 100
```

```bash
# Run test
artillery run load-test.yml

# Results: Latency, throughput, error rates
```

### Using Apache Bench

```bash
# Simple load test
ab -n 1000 -c 50 http://localhost:4000/api/health

# Results: Requests/sec, time per request
```

## Monitoring & Metrics

### Application Performance Monitoring (APM)

**Planned: New Relic or Datadog**

```javascript
// Basic metrics collection
const startTime = Date.now();
const data = await operation();
const duration = Date.now() - startTime;

if (duration > 1000) {
  logger.warn('Slow operation', { operation, duration });
}
```

### Benchmarking

**Current baseline:**
```
Single operation: ~200ms
CSV export: ~100ms
Dashboard load: ~1.5s
Metrics page: ~2s
```

**Improvement targets (Phase 2):**
- Single operation: <100ms (50% improvement)
- Dashboard load: <1s (33% improvement)
- Metrics page: <1.5s (25% improvement)

## Environment-Specific Optimization

### Development
- Source maps enabled
- Hot module reloading
- Detailed logging
- Slower performance acceptable

### Staging
- Minification enabled
- Some logging
- Performance testing
- Close to production

### Production
- Full optimization
- Minimal logging
- Monitoring enabled
- Fast response times required

## Checklist for Optimization

- [ ] Bundle size < 500KB (gzipped)
- [ ] First contentful paint < 2s
- [ ] API response time < 500ms (p95)
- [ ] Database queries indexed
- [ ] No console.log in production
- [ ] Unused CSS removed
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Error boundary implemented
- [ ] Performance monitoring active

## Common Performance Issues

| Issue | Solution |
|-------|----------|
| Slow dashboard load | Enable code splitting, lag loading |
| High API latency | Optimize queries, add indexes |
| Large bundle size | Remove unused dependencies |
| Memory leaks | Clean up event listeners, fix useEffect |
| Slow CSV export | Stream data instead of loading all |
| Flashing content | Skeleton loading screens |

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [MongoDB Performance](https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/)
- [Express Performance](https://expressjs.com/en/advanced/best-practice-performance.html)
