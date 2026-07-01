# Security Review

## Fixed Issues

1. Missing wallet-backed authentication on mutating endpoints
2. Authorization based on client-supplied actor values
3. Open CORS policy
4. Weak default security headers
5. Direct browser-side transaction submission
6. Replay exposure on repeated sponsorship submissions
7. Placeholder-heavy and unverifiable documentation

## Remaining Risks

- file-backed persistence is not suitable for horizontally scaled production
- sponsor keys require hardened deployment practices
- automated tests are still missing
