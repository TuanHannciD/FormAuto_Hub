# PHASE_EXECUTION_RULES

## Purpose

Prevent phase creep and accidental approval of future work.

## Active Phase Rule

Default active phase is the current phase in `PROJECT_PHASE_ROADMAP.md`.

Current active phase: none selected after Phase 8 closeout.

Until the next phase is approved, only documented follow-up work for the completed Phase 8 scope may proceed.

Approved post-closeout follow-up:

- Admin credit package management is approved only for creating and updating existing `CreditPackages` fields: `Name`, `Credits`, `Price`, and `IsActive`.
- Inactive packages may be hidden from normal user top-up selection.
- Package hard delete, discounts, subscription pricing, package colors, and merchandising metadata remain Deferred.

## In-Phase Work

Phase 8 allows only the approved admin, revenue, and PayOS automated credit top-up scope:

- dedicated admin area
- admin revenue and credit reporting
- PayOS payment link creation for top-up orders
- PayOS callback/webhook handling
- PayOS authenticity verification before applying credit
- automatic credit grant after verified PayOS payment
- idempotent credit application to prevent duplicate credit grants
- payment and credit transaction history for admin review
- focused documentation sync for Phase 8 changes

Phase 8 does not approve every payment or production integration. PayOS is the only approved payment provider for this phase. Each API contract, database field, status, lifecycle rule, webhook verification rule, and validation plan still requires review before implementation. Captcha bypass, proxy rotation, fake-account behavior, unauthorized submission, spam tooling, and AI auto-submit without preview and confirmation remain forbidden.

## Deferred Items

The following must remain Deferred until approved:

- authentication implementation details
- JWT claim structure
- Google OAuth
- official Google Forms API
- payment providers other than PayOS
- background job framework
- AI answer generation
- AI mapping
- refund behavior after failed submission
- exact credit pricing
- exact credit cost per action
- admin user management UI
- package management behavior beyond the approved credit package create/update/active-state follow-up
- email notifications
- webhooks
- deployment platform
- automated refund behavior
- subscription billing

Future candidate guidance:

- Google OAuth, official Google Forms API, Google Forms watches/Cloud Pub/Sub notification handling, background jobs, non-PayOS payment providers, refunds, and subscription billing remain Deferred until a task explicitly approves the production scope.
- Approval must cover the integration target, API contracts, database fields, statuses, lifecycle states, token storage model, notification ingestion model, background job framework choice, and validation plan when applicable.
- If the approved future scope needs UI and existing UI docs are missing or incomplete, ask for UI direction or sync UI docs before implementing UI.

## Phase 3 Credit Rule

- Credit is deducted only when preview generation succeeds.
- Cost is 1 credit per successfully generated preview response.
- Form analysis does not deduct credit.
- Submission does not deduct additional credit.
- Failed preview generation does not deduct credit.
- Every credit deduction must go through `CreditManagement` and write `CreditTransactions`.

## Phase Fit Response

When a task may exceed phase scope, respond with:

- In phase
- Out of phase
- Safe subset
- Approval needed
