# Screen Map

## Purpose

Reference the separate `/admin` shell, admin navigation, topbar, and unauthorized access state for Phase 8.

## Main Sections

- Admin sidebar with finance/payment navigation.
- Admin topbar with route context and account badge.
- Permission status for an authorized admin session.
- No-permission state with a return-to-dashboard action.
- Quick summary cards for revenue, pending top-ups, and payment alerts.

## Implementation Notes

- Implement admin authorization in the app/backend, not from the mock.
- Use the no-permission state when the user is authenticated but lacks `Admin` role.
- Keep the admin shell visually separate from the normal dashboard shell.

## Phase Alignment

Aligned with Phase 8 slice: admin area shell and authorization guard.

## Deferred Items To Avoid

- Admin user management.
- Manual credit adjustment.
- Other payment providers.
