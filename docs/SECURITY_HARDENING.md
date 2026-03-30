# Security Hardening Guide

This guide provides best practices for hardening TrustLoop for production deployment.

## Security Overview

TrustLoop implements security at multiple layers:

```
┌─────────────────────────────────────────┐
│    Application Security (OWASP Top 10)   │
├─────────────────────────────────────────┤
│    Data Security (MongoDB, env vars)     │
├─────────────────────────────────────────┤
│    API Security (CORS, validation)       │
├─────────────────────────────────────────┤
│    Network Security (HTTPS, TLS)         │
├─────────────────────────────────────────┤
│    Wallet Security (Non-custodial)       │
└─────────────────────────────────────────┘
```

## Secrets Management

### Environment Variables

**Never commit secrets!**

```bash
# ✅ Good: .env.local (excluded from git)
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/trustloop?retryWrites=true
HORIZON_API=https://horizon-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# .gitignore includes:
*.env
*.env.local
.env.*.local
```

### Managing Secrets

**Development:**
```bash
# Create .env.local
cp .env.example .env.local
# Edit .env.local with your credentials
```

**Production (Railway):**
```bash
# Set via Railway Dashboard
railway link
railway service select api
railway variable set MONGO_URI "..."
railway variable set API_KEY "..."
```

**Production (Vercel):**
```bash
# Set via Vercel Dashboard
vercel env add NEXT_PUBLIC_API_URL
vercel env add SECRET_API_KEY

# Only expose NEXT_PUBLIC_* to browser!
```

### Secret Rotation

- Rotate database passwords quarterly
- Rotate API keys bi-annually
- Audit secret access logs
- Remove revoked credentials

## Input Validation & Sanitization

### Backend Validation

```javascript
// middleware.js
const validateWallet = (req, res, next) => {
  const wallet = req.body.walletAddress || req.headers['x-wallet'];
  
  // ✅ Good: Validate format
  if (!/^G[A-Z0-9]{55}$/.test(wallet)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }
  
  // ✅ Good: Check length
  if (wallet.length !== 56) {
    return res.status(400).json({ error: 'Wallet address incorrect length' });
  }
  
  // ✅ Good: Whitelist character set
  if (!/^[A-Z0-9]+$/.test(wallet)) {
    return res.status(400).json({ error: 'Wallet contains invalid characters' });
  }
  
  req.wallet = wallet;
  next();
};
```

### Frontend Validation

```javascript
// Validate before sending to API
const validateForm = (formData) => {
  const errors = {};
  
  if (!formData.name || formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }
  
  if (!formData.email || !isValidEmail(formData.email)) {
    errors.email = 'Invalid email address';
  }
  
  if (!formData.wallet || !isValidWallet (formData.wallet)) {
    errors.wallet = 'Invalid Stellar wallet address';
  }
  
  return errors;
};

const isValidWallet = (wallet) => /^G[A-Z0-9]{55}$/.test(wallet);
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
```

## SQL Injection / NoSQL Injection Prevention

### MongoDB Injection Prevention

```javascript
// ✅ Good: Use Mongoose (parameterized queries)
const loop = await Loop.findById(req.params.id);

// ✅ Good: Use params, not string concatenation
const user = await User.findOne({ wallet: userInput });

// ❌ Bad: String concatenation (vulnerable!)
// const loop = await Loop.findOne({ _id: ObjectId(userInput) });
```

### Query Validation

```javascript
// Whitelist allowed query filters
const ALLOWED_FILTERS = ['status', 'clientWallet', 'createdAt'];

app.get('/api/trustloops', (req, res) => {
  const filters = {};
  
  for (const [key, value] of Object.entries(req.query)) {
    if (ALLOWED_FILTERS.includes(key)) {
      filters[key] = value;  // ✅ Safe
    }
  }
  
  Loop.find(filters).exec((err, loops) => {
    res.json(loops);
  });
});
```

## Cross-Site Scripting (XSS) Prevention

### HTML Encoding

```javascript
// ✅ Good: React auto-escapes text
<div>{userInput}</div>

// ✅ Good: Sanitize HTML if needed
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);
<div dangerouslySetInnerHTML={{ __html: clean }} />

// ❌ Bad: Directly inject HTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### Content Security Policy (CSP)

```javascript
// In Express middleware
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://horizon-testnet.stellar.org"
  );
  next();
});
```

## Cross-Site Request Forgery (CSRF) Prevention

```javascript
// ✅ Good: Express.js doesn't need CSRF for stateless APIs
// (No session cookies = no CSRF risk)

// ✅ Good: Verify wallet signature instead
app.post('/api/trustloops', async (req, res) => {
  const signature = req.headers['x-signature'];
  const message = req.body.message;
  
  // Verify signature matches wallet
  const verified = verifySignature(message, signature, req.wallet);
  if (!verified) {
    return res.status(401).json({ error: 'Signature verification failed' });
  }
  
  // Proceed with operation
});
```

## Rate Limiting

### Express Rate Limiter (Planned for Phase 2)

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // 100 requests per windowMs
  message: 'Too many requests, please try again later.',
  standardHeaders: true,  // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,  // Disable `X-RateLimit-*` headers
  skip: (req) => req.wallet === 'TRUSTED_WALLET',  // Skip for trusted wallets
});

// Apply to specific routes
app.post('/api/trustloops', limiter, createLoop);

// Or apply globally
app.use(limiter);
```

### Redis Rate Limiting (Advanced)

```javascript
const redis = require('redis');
const RedisRateLimiter = require('express-redis-rate-limit');

const client = redis.createClient();

const limiter = RedisRateLimiter({
  redisClient: client,
  windowMs: 15 * 60 * 1000,
  max: 100,
  rateMultiplier: 1,
});

app.use(limiter);
```

## Authentication & Authorization

### Wallet-Based Authentication

```javascript
// ✅ Good: Non-custodial wallet verification
export const verifyWalletSignature = (message, signature, pubkey) => {
  const keypair = StellarSdk.Keypair.fromPublicKey(pubkey);
  return keypair.verify(message, signature);
};

// Usage in API
app.post('/api/trustloops', async (req, res) => {
  const { message, signature } = req.headers;
  const wallet = req.headers['x-wallet'];
  
  if (!verifyWalletSignature(message, signature, wallet)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Proceed with authenticated request
});
```

### Role-Based Access Control (Phase 2)

```javascript
// Define roles
const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  OPERATOR: 'operator',
};

// Middleware
const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// Usage
app.delete('/api/trustloops/:id', requireRole(ROLES.ADMIN), deleteLoop);
```

## HTTPS & TLS

### Production Deployment

**Vercel (Automatic HTTPS):**
- HTTPS enabled by default
- Auto-renewal of SSL certificates
- HTTP → HTTPS redirect

**Railway (Automatic HTTPS):**
- HTTPS provided out of box
- Private networking between services
- No CORS needed for same-origin requests

**Manual Deployment:**
```bash
# Get free SSL certificate via Let's Encrypt
certbot certonly --standalone -d trustloop.example.com

# Configure Express with HTTPS
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/trustloop.example.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/trustloop.example.com/fullchain.pem'),
};

https.createServer(options, app).listen(443);
```

## CORS Configuration

### Express CORS Setup

```javascript
const cors = require('cors');

// ✅ Good: Whitelist trusted origins
const corsOptions = {
  origin: [
    'http://localhost:5174',  // Local dev
    'http://localhost:5173',  // Alternative Vite port
    'https://trustloop.vercel.app',  // Production
    'https://trustloop-staging.vercel.app',  // Staging
  ],
  credentials: true,  // Allow cookies
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-Wallet', 'X-Signature'],
};

app.use(cors(corsOptions));
```

## Database Security

### MongoDB Best Practices

```javascript
// 1. Use connection string authentication
const mongoUri = process.env.MONGO_URI;
// mongodb+srv://username:password@cluster.mongodb.net/database

// 2. Enable IP whitelist
// MongoDB Atlas > Network Access > IP Whitelist
// Only allow production server IPs

// 3. Use role-based access
// Create database user with minimal required permissions
db.createUser({
  user: 'trustloop-app',
  pwd: 'strong-password-here',
  roles: [
    { role: 'readWrite', db: 'trustloop' }
  ]
});

// 4. Enable encryption at rest (Phase 2)
// MongoDB Atlas > Security > Enable Encryption

// 5. Enable audit logging (Phase 2)
// MongoDB > Admin > Audit Log
```

### Query Validation

```javascript
// Validate MongoDB query operators
const ALLOWED_OPERATORS = ['$eq', '$gt', '$lt', '$in'];

const validateQuery = (query) => {
  for (const key in query) {
    if (key.startsWith('$')) {
      if (!ALLOWED_OPERATORS.includes(key)) {
        throw new Error(`Operator ${key} not allowed`);
      }
    }
  }
  return query;
};
```

## Error Handling Security

### Don't Leak Sensitive Information

```javascript
// ❌ Bad: Leaks system details
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack,  // ❌ Exposes stack trace!
  });
});

// ✅ Good: Generic error message
app.use((err, req, res, next) => {
  console.error('Error:', err);  // Log internally
  
  res.status(err.status || 500).json({
    error: 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    // No stack trace or internals!
  });
});
```

## Logging & Monitoring

### Secure Logging

```javascript
// ✅ Good: Don't log sensitive data
logger.info('User login', { wallet: user.wallet });

// ❌ Bad: Logs sensitive data
logger.info('User created', { 
  password: user.password,  // ❌ Never!
  apiKey: user.apiKey,  // ❌ Never!
});

// ✅ Good: Redact sensitive fields
const redact = (obj, fields) => {
  const copy = { ...obj };
  fields.forEach(field => {
    if (copy[field]) copy[field] = '***REDACTED***';
  });
  return copy;
};

logger.info('Request', redact(req.body, ['password', 'apiKey']));
```

### Security Monitoring

```javascript
// Alert on suspicious activity
logger.warn('Multiple failed login attempts', { wallet, count });
logger.warn('Unusual API usage', { wallet, requests: 1000 });
logger.warn('Rate limit exceeded', { ip: req.ip });
```

## Dependency Security

### Keep Dependencies Updated

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update

# Check outdated packages
npm outdated
```

### Dependency Scanning (CI/CD)

```yaml
# .github/workflows/security.yml
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm audit --audit-level=moderate
```

## Security Checklist

- [ ] All environment variables in .env.local (not committed)
- [ ] Input validation on all API endpoints
- [ ] HTTPS/TLS enabled in production
- [ ] CORS whitelist configured
- [ ] Rate limiting implemented
- [ ] Error messages don't leak internals
- [ ] No console.log in production code
- [ ] Database password changed from default
- [ ] API keys rotated regularly
- [ ] Security headers configured
- [ ] Dependencies updated and audited
- [ ] SQL/NoSQL injection prevention tested
- [ ] XSS prevention implemented
- [ ] CSRF token or signature verification
- [ ] Monitoring and alerting enabled
- [ ] Regular security audits scheduled

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [Stellar Security](https://developers.stellar.org/docs/learn/fundamentals/security)
- [Express.js Helmet](https://helmetjs.github.io/)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)
