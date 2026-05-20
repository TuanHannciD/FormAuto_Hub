# Screen Map

## Purpose

Reference the user-facing return page after PayOS payment, including success, failed, pending, and unverified states.

## Main Sections

- Topbar with dashboard navigation and credit balance.
- Payment result header.
- No-frontend-credit alert.
- Processing timeline.
- Order summary.
- Four result-state reference panel.
- Actions to return to dashboard, view top-up history, or create a new top-up order.

## Implementation Notes

- The frontend must not grant credit.
- The page should explain that credit updates only after backend verification.
- Keep masked payment references.
- Treat all sample statuses as UI placeholders until lifecycle review confirms final values.

## Phase Alignment

Aligned with Phase 8 slices: PayOS return handling and payment result UX.

## Deferred Items To Avoid

- Refund automation.
- Other payment providers.
- Manual credit adjustment.
