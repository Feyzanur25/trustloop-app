# TrustLoop User Guide

## What TrustLoop Does

TrustLoop tracks a trust workflow between two parties on Stellar Testnet:

- create a loop
- confirm it
- collect approvals
- close it when ready

## Dashboard

Open `/` to:

- view all loops
- search by loop ID, wallet snippet, role, or event type
- filter by status
- confirm pending loops
- close active loops when approvals allow it

## Creating a Loop

1. Open the dashboard.
2. Click `New Loop`.
3. Enter the counterparty Stellar wallet address.
4. Choose a role.
5. Choose `single` or `dual` approval policy.
6. Set the expiry window.
7. Submit.

Result:

- new loop enters `Pending`
- score is computed automatically
- a `trust.created` event is added

## Confirming a Loop

Pending loops show a `Confirm` action.

When confirmed:

- status becomes `Active`
- score increases according to workflow state
- a `trust.confirmed` event is added

## Approval Workflow

Open `/loops/:id` for any loop.

On the detail page you can:

- approve as `Client`
- approve as `Freelancer`
- revoke either approval
- view whether the loop is ready to close

If the loop uses dual approval, both approvals must be captured before closure.

## Closing a Loop

Only active loops can be closed.

If required approvals are missing:

- the API blocks closure
- the UI surfaces the error state

When closure succeeds:

- status becomes `Completed`
- expiry becomes `0`
- a `trust.closed` event is added

## Metrics Dashboard

Open `/metrics` to review:

- active users
- verified wallets
- transaction volume
- completion rate
- trust score averages
- daily throughput

## Monitoring Dashboard

Open `/monitoring` to review:

- API uptime
- average latency
- total requests and errors
- service health summary
- active alerts
- indexer visibility
- security checklist

## Onboarding Hub

Open `/onboarding` to:

- capture participant name, email, wallet address, feedback, and rating
- review the registry of users
- export a CSV

Seeded/demo onboarding evidence is also bundled in `docs/onboarding-template.csv` and `docs/onboarding-responses.xlsx`.

## Local Environment Notes

- backend should run on port `4000`
- frontend runs on Vite and proxies `/api` locally
- Freighter is optional for general app usage, but required for live signing flows
