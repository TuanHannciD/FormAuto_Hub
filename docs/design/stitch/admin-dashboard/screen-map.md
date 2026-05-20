# Screen Map

## Purpose

Reference the Phase 8 admin overview for revenue, credit activity, PayOS payment status, and operational alerts.

## Main Sections

- Admin dashboard header.
- Metric cards for total revenue, credit sold, credit used, and top-up outcomes.
- Recent payments table.
- Webhook/payment alert list.
- Quick reconciliation panel.

## Implementation Notes

- Treat table rows, money amounts, dates, and status labels as placeholders until API contracts are reviewed.
- Preserve the warning that credit must not be granted until payment verification succeeds.
- Do not expose PayOS secrets or raw sensitive payloads in the UI.

## Phase Alignment

Aligned with Phase 8 slices: admin revenue reporting and payment status visibility.

## Deferred Items To Avoid

- Refund automation.
- Admin user management.
- Other payment providers.
- Manual credit adjustment.
