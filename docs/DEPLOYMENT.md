# Deployment Guide

## Development Setup

### Local Development (with MongoDB)

```bash
# Start MongoDB, API, and Web with Docker Compose
docker-compose up

# Or manually:
# Terminal 1: MongoDB
mongo

# Terminal 2: API
cd api
npm install
npm start

# Terminal 3: Web
cd web
npm install
npm run dev
```

Access:
- Frontend: http://localhost:5174
- API: http://localhost:4000
- MongoDB: mongodb://localhost:27017

## Production Deployment

### Option 1: Docker (Recommended)

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.yml up --build

# Or manually build
docker build -t trustloop-api ./api
docker run -p 4000:4000 \
  -e MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/trustloop \
  -e NODE_ENV=production \
  trustloop-api
```

### Option 2: Heroku (Backend)

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create trustloop-api

# Set environment variables
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### Option 3: Railway / Render

Both platforms support:
- Automatic deployments from Git
- MongoDB integration
- Environment variable management

### Vercel (Frontend)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variables:
   - `VITE_API_BASE_URL`: Your API URL
   - `VITE_STELLAR_NETWORK`: TESTNET
   - `VITE_STELLAR_HORIZON_URL`: https://horizon-testnet.stellar.org

## Environment Variables

### API (.env)

```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/trustloop
STELLAR_NETWORK=TESTNET
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
```

### Web (.env)

```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_STELLAR_NETWORK=TESTNET
VITE_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

## Database

### MongoDB Atlas Setup

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Create database user
4. Add IP whitelist
5. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`

### MongoDB Local

```bash
# Install MongoDB
# Ubuntu/Debian
sudo apt-get install mongodb

# macOS
brew install mongodb-community

# Start MongoDB
mongod

# Or with Docker
docker run -d -p 27017:27017 mongo:7.0
```

## Monitoring & Health Checks

### API Health Endpoint

```bash
curl http://localhost:4000/api/health
```

Response:
```json
{
  "ok": true,
  "status": "healthy",
  "timestamp": "2026-03-29T00:00:00Z",
  "uptimeSeconds": 3600
}
```

### Monitoring Dashboard

Access at `/monitoring` after deployment

## CI/CD Pipeline

GitHub Actions automatically:
- Lints code on PR
- Runs security checks
- Builds and tests
- Deploys on merge to main

See `.github/workflows/ci-cd.yml` for configuration

## Troubleshooting

### API won't start

```bash
# Check port
lsof -i :4000

# Check MongoDB connection
mongodb+srv://user:pass@cluster.mongodb.net/trustloop

# Check logs
heroku logs --tail
```

### Frontend can't reach API

1. Verify `VITE_API_BASE_URL` is set correctly
2. Check CORS in API: `CORS_ORIGIN`
3. Verify API is running: `curl http://api-url/api/health`

### Database connection errors

1. Check MongoDB URI format
2. Verify IP whitelist (MongoDB Atlas)
3. Create database and collections if needed

## Security Checklist

- [ ] Set strong database passwords
- [ ] Enable HTTPS/SSL
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Backup database regularly
- [ ] Monitor error logs
- [ ] Update dependencies regularly

## Performance Tips

- Enable caching headers
- Minify and compress assets (done by Vite)
- Use CDN for static files
- Optimize database queries
- Monitor API response times
