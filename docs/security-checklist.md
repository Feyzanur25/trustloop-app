# TrustLoop Security Checklist

This checklist reflects the current repository state.

## Completed

- input validation exists for onboarding and trust loop creation
- loop closure is approval-gated
- request logging is enabled
- API rate limiting is enabled
- user-facing error handling exists in frontend and backend
- metrics and monitoring are visible in-app
- indexer visibility is exposed in-app and through API
- seeded onboarding data can be exported for review
- environment variable examples are documented
- deployment model expects HTTPS through the frontend and backend host

## Repository Evidence

- API middleware: [api/src/middleware.js](../api/src/middleware.js)
- API routes and validations: [api/src/index.js](../api/src/index.js)
- monitoring screen: [web/src/pages/Monitoring.jsx](../web/src/pages/Monitoring.jsx)
- onboarding export: [web/src/pages/Onboarding.jsx](../web/src/pages/Onboarding.jsx)

## Still External / Operational

These items depend on the final deployment environment and cannot be proven from local code alone:

- HTTPS certificate on deployed domains
- host-level WAF or firewall rules
- secret storage in the final hosting provider
- backup policy for production data
- production alert routing

## Demo Day Talking Points

1. TrustLoop does not allow silent closure of active loops.
2. Monitoring and security state are visible in the product itself.
3. API abuse is reduced through rate limiting.
4. User onboarding records and loop events are auditable.
5. All wallet-facing activity is limited to Stellar Testnet for safe demonstration.
