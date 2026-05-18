# Credit Transactions Screen Map

## Purpose

Authenticated ledger page for `/dashboard/credit-transactions`.

The page lets users audit credit balance changes separately from tool usage logs.

## Main Areas

- App shell: left sidebar and top app bar.
- Page header: title, export action, advanced filter action, read-only ledger badge.
- KPI cards:
  - current balance
  - total credits added
  - total credits deducted
  - transactions this month
- Ledger explanation strip distinguishing `CreditTransactions` from `UsageLogs`.
- Filter toolbar:
  - date range
  - transaction type
  - source
  - search
  - apply/reset actions
- Main ledger table:
  - time
  - transaction id
  - type
  - source
  - delta
  - balance after
  - linked record
  - note
  - detail action
- Reconciliation panel.
- Reference states:
  - empty
  - error
  - loading

## Implementation Notes

- Keep the ledger table full-width because it contains dense financial/audit columns.
- Use positive/negative color treatment for credit deltas.
- Treat sample transaction IDs, source IDs, notes, dates, and balances as placeholder UI data only.
- Keep credit ledger behavior separate from usage log behavior unless backend contracts explicitly connect them.

## Phase Alignment

This reference maps to the Phase 5 credit transactions page and Phase 2 credit management behavior.

Payment gateway UI, package management UI, admin user management UI, and manual credit adjustment UI remain Deferred unless explicitly approved.
