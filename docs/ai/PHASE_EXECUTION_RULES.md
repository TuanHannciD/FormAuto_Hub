# PHASE_EXECUTION_RULES

## Purpose

Prevent phase creep and accidental approval of future work.

## Active Phase Rule

Default active phase is the current phase in `PROJECT_PHASE_ROADMAP.md`.

Current active phase: Phase 6 - Production integrations.

## In-Phase Work

Phase 6 allows only explicitly approved production integration work, such as:

- Google OAuth
- official Google Forms API
- payment gateway
- AI mapping/generation
- webhook integrations
- production background jobs
- focused documentation sync for Phase 6 changes

Phase 6 does not make every integration automatically approved. Each integration requires explicit approval, contract definition, and safety review. Captcha bypass, proxy rotation, fake-account behavior, unauthorized submission, spam tooling, and AI auto-submit without preview and confirmation remain forbidden.

## Deferred Items

The following must remain Deferred until approved:

- authentication implementation details
- JWT claim structure
- Google OAuth
- official Google Forms API
- payment gateway
- background job framework
- AI answer generation
- AI mapping
- refund behavior after failed submission
- exact credit pricing
- exact credit cost per action
- admin user management UI
- package management UI
- email notifications
- webhooks
- deployment platform

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
