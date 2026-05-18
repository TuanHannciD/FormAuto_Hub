# Top-up Order Detail Screen Map

## Purpose

Authenticated user-facing detail page for `/dashboard/top-up-orders/[id]`.

The page lets a user inspect one manual top-up request, its status, related references, and admin response state.

## Main Areas

- App shell: left sidebar and top app bar.
- Page header:
  - title
  - status badge
  - back-to-list action
  - copy request id action
- Summary cards:
  - request id
  - package
  - requested credits
  - status
- Request detail card.
- Status timeline.
- Manual processing panel.
- Related links panel:
  - top-up order id
  - credit transaction state
  - notification state
  - audit note
- Notes and admin response section.
- Reference states:
  - not found
  - error
  - loading

## Implementation Notes

- Use this screen as a user-facing detail reference only.
- Do not add admin approve/reject buttons to this page unless admin UI scope is explicitly approved.
- Treat sample request IDs, status history, dates, and notes as placeholder UI data only.
- Keep payment gateway text as Deferred/MVP-disabled information only.

## Phase Alignment

This reference extends the Phase 5 top-up order UI with an individual detail view.

Payment gateway checkout and admin top-up approval/rejection UI remain out of scope unless explicitly approved.
