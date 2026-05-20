# Screen Map

## Purpose

Reference the authenticated user flow for selecting a credit package, selecting PayOS, creating a payment link, and waiting for backend verification.

## Main Sections

- Dashboard shell with credit balance.
- Verification safety alert.
- Four-step top-up stepper.
- Credit package cards.
- PayOS payment method selection.
- Order summary and create-link action.
- Verification notes.
- Recent top-up orders table.

## Implementation Notes

- The UI must not add credit on the frontend.
- Credit updates only after backend payment verification and ledger write.
- Package names, amounts, and prices are placeholders unless package contracts confirm them.
- Do not show other payment methods in the PayOS-first Phase 8 flow.

## Phase Alignment

Aligned with Phase 8 slices: PayOS payment link creation and user top-up flow.

## Deferred Items To Avoid

- Other payment providers.
- Frontend-only credit updates.
- Refund automation.
- Package management UI.
