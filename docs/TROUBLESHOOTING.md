# TrustLoop Troubleshooting Guide

## Quick Diagnostics

### Health Check

```bash
# 1. Check API health
curl http://localhost:4000/api/health

# Expected response:
# { "status": "ok", "mongodb": "connected", "timestamp": "2026-03-30T..." }

# 2. Check MongoDB connection
curl http://localhost:4000/api/health | jq '.mongodb'

# 3. Check Frontend loading
curl -I http://localhost:5174

# Expected: HTTP 200
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Cannot connect to MongoDB" | MongoDB not running | `docker run -d -p 27017:27017 mongo:7.0` |
| "Wallet not found" | Freighter not connected | Open Freighter, select Testnet, connect wallet |
| "Invalid transaction" | Wrong Testnet | Switch Freighter to Stellar Testnet |
| "CORS error" | Cross-origin request denied | Check CORS config in `api/src/index.js` |
| "API timeout" | Server not responding | Check if `npm run dev` running in api/ |

## Local Development Issues

### Frontend Won't Load

**Problem:** `http://localhost:5174` gives error

```bash
# 1. Check if web server is running
lsof -i :5174

# If not, start it
cd web
npm install  # If first time
npm run dev

# 2. Check for port conflicts
netstat -ano | findstr :5174  # Windows
lsof -i :5174  # Mac/Linux

# 3. Clear cache
rm -rf web/.vite
npm run dev
```

**Problem:** Page loads but components missing

```bash
# 1. Check for errors in browser console (F12)
# 2. Check Network tab → see if API calls fail
# 3. Try hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
# 4. Clear localStorage
localStorage.clear()
location.reload()
```

### API Won't Start

**Problem:** `npm run dev` fails

```bash
# 1. Check if Node is installed
node --version
npm --version

# Should show version numbers

# 2. Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 3. Check .env configuration
cat .env  # Should have MONGO_URI

# 4. Check MongoDB is running
docker ps | grep mongo

# 5. Check port not in use
lsof -i :4000  # Mac/Linux
netstat -ano | findstr :4000  # Windows

# 6. Check logs for specific error
npm run dev 2>&1 | tee api.log
```

### MongoDB Connection Fails

**Problem:** "connect ECONNREFUSED 127.0.0.1:27017"

```bash
# 1. Start MongoDB
docker run -d -p 27017:27017 mongo:7.0

# 2. Check if it's running
docker ps | grep mongo

# 3. Test connection
mongo mongodb://localhost:27017

# 4. Check MONGO_URI in .env
echo $MONGO_URI

# Expected format:
# mongodb://localhost:27017/trustloop
# OR
# mongodb+srv://user:pass@cluster.mongodb.net/trustloop
```

### Freighter Wallet Issues

**Problem:** Wallet won't connect

```javascript
// Check browser console for wallet errors
console.log(window.stellar);  // Should show Freighter object

// If undefined:
// 1. Install Freighter extension
// 2. Check if enabled (open extension)
// 3. Try different browser (Chrome > Firefox)
// 4. Restart browser
```

**Problem:** Can't sign transaction

```javascript
// 1. Make sure you're on Testnet
//    - Open Freighter → Settings → Network (should be "Testnet")
// 2. Make sure account has XLM
//    - Go to https://stellar.expert/explorer/testnet
//    - View your account
//    - Should have XLM balance
// 3. Try signing in browser console
const keypair = StellarSdk.Keypair.randomKeyPair();
const message = "test";
const signature = keypair.sign(Buffer.from(message)).toString('hex');
```

## Docker Issues

### `docker-compose up` Fails

```bash
# 1. Check if Docker is running
docker ps

# If not: Start Docker Desktop / Docker daemon

# 2. Check docker-compose version
docker-compose --version

# If old: Update via Docker Desktop

# 3. Try rebuild
docker-compose down
docker-compose up --build

# 4. Check logs
docker-compose logs api
docker-compose logs web
docker-compose logs mongo
```

### Service Keeps Restarting

```bash
# Check logs
docker-compose logs api --tail 50

# Common issues:
# - Port already in use
# - Environment variable missing
# - Application crash

# Restart and check
docker-compose restart api
docker-compose logs api
```

### Out of Disk Space

```bash
# Clean up Docker
docker system prune -a

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune
```

## Database Issues

### Can't Connect to MongoDB

```bash
# 1. Check if MongoDB is running
docker ps | grep mongo

# 2. Verify connection string
echo $MONGO_URI
# Should show valid MongoDB URI

# 3. Test with MongoDB client
mongosh "mongodb://localhost:27017"

# 4. Check authentication
# If using MongoDB Atlas:
# - Check username/password
# - Check IP whitelist (add 0.0.0.0/0 for development only)
```

### Queries Returning Empty

```bash
# 1. Check if collection exists
db.loops.countDocuments()

# 2. Insert test data
db.loops.insertOne({
  status: "test",
  createdAt: new Date()
})

# 3. Query and verify
db.loops.find().pretty()

# 4. Check indexes
db.loops.getIndexes()
```

### Slow Queries

```bash
# 1. Enable query logging
db.setProfilingLevel(1, { slowms: 100 })

# 2. Check profiling data
db.system.profile.find().sort({ ts: -1 }).limit(10).pretty()

# 3. Add indexes
db.loops.createIndex({ status: 1 })
db.loops.createIndex({ createdAt: -1 })

# 4. Analyze query performance
db.loops.explain("executionStats").find({ status: "active" })
```

## API Issues

### 404 Endpoints

**Problem:** `GET /api/trustloops` returns 404

```bash
# 1. Check if API is running
curl http://localhost:4000/api/health

# 2. Verify endpoint path
# Check api/src/index.js for route definitions

# 3. Check request headers
curl -H "Content-Type: application/json" http://localhost:4000/api/trustloops

# 4. Common typo: Check trailing slashes
# /api/trustloops/ vs /api/trustloops
```

### 500 Internal Server Error

```bash
# 1. Check API logs
docker-compose logs api --tail 100

# 2. Look for specific error message

# 3. Check request body format
curl -X POST http://localhost:4000/api/trustloops \
  -H "Content-Type: application/json" \
  -d '{"clientWallet":"...", "freelancerWallet":"..."}'

# 4. Verify required fields are present
```

### Slow API Response

```bash
# 1. Check database query performance
# (See Database section above)

# 2. Check for errors in logs
docker-compose logs api | grep -i error

# 3. Monitor CPU/memory usage
docker stats

# 4. Check network latency
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:4000/api/health

# curl-format.txt contents:
# time_namelookup:  %{time_namelookup}\n
# time_connect:     %{time_connect}\n
# time_appconnect:  %{time_appconnect}\n
# time_pretransfer: %{time_pretransfer}\n
# time_redirect:    %{time_redirect}\n
# time_starttransfer: %{time_starttransfer}\n
# time_total:       %{time_total}\n
```

## Frontend Issues

### Page Goes Blank

**Problem:** Dashboard loads but shows nothing

```javascript
// Check browser console (F12) for errors:
// 1. Network tab → see if API calls failing
// 2. Console tab → check for JavaScript errors
// 3. Try logging API response
fetch('/api/trustloops')
  .then(r => r.json())
  .then(data => console.log('API response:', data))
  .catch(e => console.error('API error:', e))
```

### CSV Export Doesn't Work

```javascript
// 1. Check if data has CSV export route
// Look for link to /onboarding page

// 2. Verify form has data before export click
// Open onboarding form
// Fill it completely
// Click Export CSV

// 3. Check browser security
// Some browsers block downloads
// Check Downloads folder
// May need to right-click "Save As"

// 4. Check browser logs for errors
// F12 → Console tab
```

### Mobile Not Responsive

```javascript
// 1. Test viewport settings
// F12 → Settings → Emulation → Device (iPhone 12)

// 2. Check CSS media queries in index.css
// Should have @media (max-width: 768px) rules

// 3. Check Tailwind responsive classes
// text-sm md:text-base lg:text-lg

// 4. Test actual mobile device
// May behave differently than emulator
```

## Production Issues

### Vercel Deployment Fails

```bash
# 1. Check build logs
vercel logs

# 2. Check environment variables
vercel env list

# 3. Verify build command
vercel deploy --prod --debug

# 4. Common issues:
# - Missing environment variable
# - Port not set to PORT env var
# - Dependencies not in package.json
```

### Railway Deployment Fails

```bash
# 1. Check deployment logs
railway logs

# 2. Check environment variables
railway variable list

# 3. Verify it can reach MongoDB
MONGO_URI must be accessible from Railway

# 4. Check service status
railway service list
```

### Application Crashes in Production

```bash
# 1. Check error logs
Vercel: vercel logs
Railway: railway logs

# 2. Monitor metrics
Vercel: Vercel Dashboard → Monitoring
Railway: Railway Dashboard → Metrics

# 3. Check external dependencies
# - Is MongoDB up?
# - Is Horizon API up?
# - Are rate limits exceeded?

# 4. Roll back if needed
git revert HEAD
git push
# Deployment redeploys automatically
```

## Performance Issues

### Slow Dashboard Load

```javascript
// 1. Check Network tab (F12)
// Identify slow requests (>2s)

// 2. Check if API slow or frontend slow
// Time API: curl -w "@curl-format.txt" ...
// Time frontend: check Lighthouse report

// 3. Lighthouse audit
// F12 → Lighthouse → Generate report

// 4. Optimize based on results
```

### High Memory Usage

```javascript
// 1. Check what's using memory
// Browser DevTools → Performance → Memory

// 2. Look for memory leaks
// Create ~100 loops
// Check memory growth over time

// 3. Check for infinite loops in code
// Might be missing dependency in useEffect

// 4. Check for circular references
// Data structure might reference itself
```

## Getting Help

### Check Logs First

```bash
# API logs
docker-compose logs api | grep -i error

# Web browser console
F12 → Console tab → look for red errors

# MongoDB logs
docker-compose logs mongo | tail -50
```

### Collect System Information

```bash
# System info needed for support
uname -a  # OS version
node --version
npm --version
docker --version
docker-compose --version
git --version

# Collect in one file
{
  uname -a
  node --version
  npm --version
  docker --version
  docker-compose --version
} > system-info.txt
```

### Create Minimal Reproduction

```bash
# To report a bug, provide:
# 1. Steps to reproduce
# 2. Expected vs actual behavior
# 3. Error message (with logs)
# 4. Environment (OS, browser, versions)
# 5. Screen recording (if UI issue)
```

## Resource Links

- [MongoDB Documentation](https://docs.mongodb.com/manual/)
- [Express.js Guide](https://expressjs.com/)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Stellar Documentation](https://developers.stellar.org/)
- [Freighter API Docs](https://github.com/stellar/js-stellar-sdk)
- [Docker Documentation](https://docs.docker.com/)
- [Vercel Status](https://www.vercel-status.com/)
- [Railway Status](https://railway.link/status)
