# PHASE_EXECUTION_RULES

## Purpose

Prevent phase creep and accidental approval of future work.

## Active Phase Rule

Default active phase is the current global phase in `PROJECT_PHASE_ROADMAP.md`.

Current global active phase: none selected after Phase 9 closeout.

Active approved follow-up slice: none. Phase 6 AI mapping/generation scoped implementation is completed.

Until the next global phase or follow-up is approved, only explicitly approved follow-up work may proceed. The completed Phase 6 AI slice must not become full Phase 6 production integration by implication.

Phase 9 closeout state:

- Phase 9 validation/debug scope is completed.
- Phase 9 does not approve automatic fixes after closeout.
- Any Phase 10, production-hardening, implementation, or fix follow-up requires explicit approval.

## In-Phase Work

No new global active phase is selected.

There is no current approved implementation lane.

Safe work after Phase 9 closeout is limited to:

- reading docs and reports
- answering status questions
- proposing next-phase or follow-up scope
- documentation updates explicitly approved by the user
- implementation/fix work only after explicit approval
- validation or fix follow-up for the completed Phase 6 AI scoped slice only when explicitly approved and kept within reviewed API/database/provider/audit/safety boundaries

PayOS remains the only approved payment provider. Captcha bypass, proxy rotation, fake-account behavior, unauthorized submission, spam tooling, and AI auto-submit without preview and confirmation remain forbidden.

## Deferred Items

The following remain Deferred outside already approved contracts/scopes. Phase 7 auth and the separate NCKH track are implemented; this list does not undo their approvals. Use current API contracts and the NCKH progress ledger for their exact boundaries:

- authentication or JWT claim changes beyond the approved Phase 7 contracts
- Google OAuth beyond approved identity login and the separate approved NCKH scope
- official Google Forms API outside the separate approved NCKH scope
- payment providers other than PayOS
- background job framework
- AI answer generation outside the approved Phase 6 AI scoped follow-up slice
- AI mapping outside the approved Phase 6 AI scoped follow-up slice
- refund behavior after failed submission
- new credit pricing/cost behavior beyond approved package, Phase 3 and scoped AI contracts
- admin user management UI
- package management behavior beyond the approved credit package create/update/active-state follow-up
- email notifications
- webhooks beyond the approved Phase 8 PayOS contract
- deployment platform beyond the explicitly approved GitHub Actions + GHCR + fingerprint-verified SSH/Docker Compose single-host foundation
- automated refund behavior
- subscription billing
- automatic bug fixes after Phase 9 closeout unless separately approved

Future candidate guidance:

- Broader Google OAuth/Forms integration beyond the approved identity/NCKH scopes, Google Forms watches/Cloud Pub/Sub notification handling, background jobs, non-PayOS payment providers, refunds, and subscription billing remain Deferred until a task explicitly approves the production scope.
- AI mapping/generation has an approved Phase 6 scoped follow-up slice. Implementation still requires staying inside the approved API, database, provider, audit, safety, and validation boundaries.
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
