# PHASE_EXECUTION_RULES

## Purpose

Prevent phase creep and accidental approval of future work.

## Active Phase Rule

Default active phase is the current phase in `PROJECT_PHASE_ROADMAP.md`.

Current active phase: none selected after Phase 9 closeout.

Until the next phase is approved, only explicitly approved follow-up work may proceed.

Phase 9 closeout state:

- Phase 9 validation/debug scope is completed.
- Phase 9 does not approve automatic fixes after closeout.
- Any Phase 10, production-hardening, implementation, or fix follow-up requires explicit approval.

## In-Phase Work

No new active phase is selected.

Safe work after Phase 9 closeout is limited to:

- reading docs and reports
- answering status questions
- proposing next-phase or follow-up scope
- documentation updates explicitly approved by the user
- implementation/fix work only after explicit approval

PayOS remains the only approved payment provider. Captcha bypass, proxy rotation, fake-account behavior, unauthorized submission, spam tooling, and AI auto-submit without preview and confirmation remain forbidden.

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
- automatic bug fixes after Phase 9 closeout unless separately approved

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
