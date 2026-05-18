# Top-up Request Screen Map

## Purpose

Authenticated Phase 2 page for creating manual credit top-up requests and checking recent request status.

The page supports the MVP manual approval flow. It does not represent a payment gateway checkout.

## Main Areas

- App shell: left sidebar and top app bar.
- Page header: title, subtitle, and MVP payment status badge.
- Balance summary: current credits, pending requests, expected credits after approval.
- New request form:
  - credit package selection
  - manual recording method
  - admin note
  - submit and history actions
  - pending-approval helper alert
- Manual approval process panel:
  - user submits request
  - admin checks information
  - admin approves and credits balance
  - system writes `CreditTransactions`
- Recent requests table:
  - request id
  - package
  - credits
  - method
  - status
  - created date
  - updated date
  - filters and pagination summary

## Implementation Notes

- Use this screen as a layout and copy reference for the future Next.js dashboard.
- Keep the dashboard pattern consistent with shadcn/ui: sidebar, cards, form fields, badges, table, filters, pagination.
- Keep copy in Vietnamese with proper diacritics.
- Treat package names, sample request IDs, sample dates, and amounts as placeholder UI data only.
- Do not treat the listed statuses as final backend contract truth without checking current DTO/domain definitions.

## Phase Alignment

This page fits Phase 2 because it focuses on account and credit management.

Payment gateway checkout, package management, admin user management, and manual credit adjustment remain Deferred unless explicitly approved.
