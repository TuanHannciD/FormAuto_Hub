# Screen Map

## Purpose

Reference the admin page for top-up order search, payment verification review, and PayOS callback/webhook visibility.

## Main Sections

- Admin navigation and topbar.
- KPI cards for pending verification, paid orders, verification errors, and reconciliation needs.
- Filter bar by order/user, status, date range, and payment method.
- Top-up order table.
- Detail drawer/panel in the HTML export for selected order context.
- Callback/webhook timeline in the detail area.

## Implementation Notes

- Do not add a manual credit grant action from this mock.
- Credit is granted only after verified PayOS payment handling and ledger write.
- Keep callback/webhook history read-only unless backend scope approves actions.
- Sample table columns and statuses are placeholders until Phase 8 contracts are reviewed.

## Phase Alignment

Aligned with Phase 8 slices: admin payment history and reconciliation view.

## Deferred Items To Avoid

- Refund automation.
- Manual credit adjustment.
- Admin user management.
- Other payment providers.
