# Deployment

## Recommended Shape

- frontend on a static host
- backend on a trusted Node environment that holds sponsor secrets

## API Environment

- `NODE_ENV=production`
- `APP_URL`
- `API_URL`
- `ALLOWED_ORIGINS`
- `STELLAR_NETWORK`
- `STELLAR_HORIZON_URL`
- `STELLAR_NETWORK_PASSPHRASE`
- `STELLAR_SPONSOR_SECRET_KEY`
- `STELLAR_SPONSOR_PUBLIC_KEY`
- `STELLAR_CHALLENGE_SECRET_KEY`
- `STELLAR_WEB_AUTH_DOMAIN`
- `STELLAR_HOME_DOMAIN`

## Web Environment

- `VITE_API_BASE_URL`
- `VITE_STELLAR_NETWORK`
- `VITE_STELLAR_HORIZON_URL`

## Manual Post-Deploy Proof

After real deployment, capture:

- frontend URL
- API URL
- sponsor public key
- transaction hashes
- screenshots
- launch links
