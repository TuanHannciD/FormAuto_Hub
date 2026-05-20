# PHASE_8_KICKOFF_PLAN

## Purpose

Define the kickoff scope for Phase 8: admin operations, revenue reporting, and PayOS automated credit top-up.

## Phase Goal

Build a dedicated admin area and replace the manual-only MVP credit top-up path with a PayOS-first automated top-up flow.

## Confirmed Scope

- Dedicated admin area for financial and operational management.
- Admin dashboard for revenue, top-up orders, credit sales, credit usage, and payment status.
- PayOS is the first approved payment provider.
- Users can start a credit top-up that creates a PayOS payment link.
- PayOS callback/webhook handling confirms payment outcome.
- PayOS authenticity verification is required before credit is granted.
- Credit is granted automatically only after a valid paid PayOS event is confirmed.
- Duplicate PayOS callbacks/webhooks must not grant duplicate credit.
- Every automatic credit grant must write a `CreditTransactions` ledger entry.
- Top-up order state must reflect the verified payment outcome.
- Admin users can review payment history and credit transaction history.
- Admin users can configure PayOS settings from the admin area.

## Actors

- Admin user: reviews revenue, top-up orders, payment outcomes, and credit activity.
- Normal user: starts PayOS credit top-up from the dashboard.
- PayOS: external payment provider for payment link creation and payment confirmation.

## Affected Areas

- Admin frontend area.
- Top-up order workflow.
- Credit management workflow.
- Payment integration service for PayOS.
- API contracts for admin reporting and PayOS top-up flow.
- EF Core persistence for any approved payment metadata.
- Validation and test coverage for payment verification and idempotency.

## Contract Guardrails

- Do not finalize API contracts until each endpoint is reviewed.
- Do not add database fields until the entity and migration plan is reviewed.
- Do not invent payment statuses without a lifecycle review.
- Do not store PayOS secrets in source-controlled configuration.
- Store PayOS configuration in the database through `PaymentProviderSettings`.
- Encrypt PayOS `ApiKey` and `ChecksumKey` before storage.
- Never return raw PayOS secrets to the frontend.
- Do not grant credit from an unverified callback/webhook.
- Do not bypass `CreditTransactions`.
- Do not weaken anti-abuse or unauthorized submission rules.

## Suggested Delivery Slices

1. Admin area shell and authorization guard.
2. Admin revenue and credit reporting read models using existing data.
3. PayOS configuration model, encryption boundary, and admin settings API.
4. PayOS payment link creation for top-up orders.
5. PayOS callback/webhook verification and idempotent payment handling.
6. Automatic credit grant through the existing credit transaction discipline.
7. Admin payment history and reconciliation view.
8. End-to-end validation and Phase 8 closeout docs.

## Validation Expectations

- Backend build.
- Frontend build.
- Unit tests for PayOS verification and idempotency.
- API tests for top-up creation, callback handling, and duplicate callback behavior.
- Ledger validation that every automatic credit grant writes `CreditTransactions`.
- Admin authorization tests.
- Manual or mocked PayOS sandbox smoke when credentials are available.

## Assumptions

Assumption: PayOS is the first payment provider for Phase 8.

Assumption: Exact PayOS credential names, webhook signature inputs, and payment payload shape must be confirmed from PayOS documentation before implementation.

Assumption: Existing top-up and credit entities should be reused where possible, but any new fields must be reviewed before migration.

Approved decision: PayOS provider configuration is stored in the database, not primarily in `appsettings`.

Approved decision: `ApiKey` and `ChecksumKey` must be encrypted before storage and exposed to UI only as masked values.

## Deferred

- VNPay, MoMo, Stripe, or other payment providers.
- Subscription billing.
- Automated refund behavior.
- Manual credit adjustment unless separately approved.
- Package management UI unless separately approved.
- Admin user management UI unless separately approved.
- Official Google Forms API.
- Google Forms watches or background sync.
- AI mapping/generation.
- Production background job framework unless a PayOS task explicitly proves it is needed.
