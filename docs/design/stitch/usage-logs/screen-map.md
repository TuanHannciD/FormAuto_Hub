# Usage Logs Screen Map

## Purpose

Authenticated Phase 2 page for reviewing tool usage history, credit usage, workflow results, and blocked actions.

The page supports auditability and operational review. It does not implement submission automation, payment processing, or official Google integration.

## Main Areas

- App shell: left sidebar and top app bar.
- Page header: title, subtitle, CSV export action, advanced filter action.
- KPI summary:
  - actions this month
  - credits used
  - preview count
  - limited action count
- Safety summary strip:
  - preview before confirmation
  - 1-5 response limit
  - credit deduction only for valid actions
  - no spam, proxy, captcha bypass
  - latest limited log callout
- Filter toolbar:
  - date range
  - action type
  - result
  - form project
  - search
  - apply/reset actions
- Usage log table:
  - time
  - log id
  - action
  - form
  - credits used
  - response count
  - result
  - actor
  - detail action
- Reference states:
  - empty state
  - error state
  - loading state

## Implementation Notes

- Use this screen as a layout and copy reference for the future Next.js dashboard.
- Keep the table full-width because usage logs are dense and need readable columns.
- Keep filters compact and visible above the table.
- Treat sample log IDs, dates, counts, actors, and status labels as placeholder UI data only.
- Do not treat table columns or sample statuses as final backend contract truth without checking current domain/DTO definitions.
- Keep credit ledger behavior separate from usage log behavior unless backend contracts explicitly say otherwise.

## Phase Alignment

This page fits Phase 2 because it focuses on account and credit management visibility, usage history, and audit review.

Payment gateway, official Google Forms API, AI answer generation, AI auto-submit, and production submission flows remain Deferred unless explicitly approved.
