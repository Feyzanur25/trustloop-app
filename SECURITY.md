# Security Policy

## Protections

- request validation and sanitization
- strict CORS allowlist
- security response headers
- SEP-10 wallet authentication
- participant-level authorization
- expiring sponsorship intents
- replay checks for consumed intents
- API rate limiting

## Secret Handling

- keep sponsor and challenge keys server-side only
- never commit `.env`
- rotate keys if compromise is suspected
