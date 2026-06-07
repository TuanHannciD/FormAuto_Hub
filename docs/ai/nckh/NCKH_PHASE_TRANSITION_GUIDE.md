# NCKH_PHASE_TRANSITION_GUIDE

## Purpose

Define how to move from the closed FormAuto Hub global phase state into a specific NCKH phase without confusing NCKH work with a new FormAuto Hub global phase.

## Current Baseline

- FormAuto Hub global phase: Phase 9 closeout completed; no next global phase selected.
- NCKH is a separate module track inside the same repository.
- NCKH Phase 1 is completed for its approved scope.
- NCKH Phase 2 is completed for its approved backend-only scope.
- NCKH Phase 3 is completed for its approved backend-only scope.
- NCKH Phase 4 is completed for its approved backend-only scope; live Google Forms write smoke remains blocked until credentials/write consent are available.
- NCKH Phase 5 is completed for its approved backend-only scope; live Google Forms response-read smoke remains blocked until credentials/response-read consent/submitted responses are available.
- NCKH Phase 6 is completed for its approved backend-only export scope; no database migration was added.
- NCKH Phase 7 is completed for its approved frontend-only scope.
- NCKH Phase 7.5 is completed for its approved fix/live-validation follow-up; live Google validation was user-confirmed on 2026-06-05.
- NCKH Phase 8 is completed for its approved validation-only full-stack smoke scope; it did not add product behavior.
- NCKH Phase 9 is completed for its approved frontend-only Option A canvas UX scope.

## Required Startup Order For NCKH Work

1. Read `README.md`.
2. Read `AGENTS.md`.
3. Read `docs/ai/AI_DOC_ROUTING_MATRIX.md`.
4. Read `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`.
5. Read this file.
6. Read `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`.
7. Read phase-specific NCKH docs:
   - closeout evidence: `NCKH_PHASE_1_CLOSEOUT.md`
   - Phase 2 closeout evidence: `NCKH_PHASE_2_CLOSEOUT.md`
   - Phase 2 kickoff plan: `NCKH_PHASE_2_KICKOFF_PLAN.md`
   - Phase 3 kickoff plan: `NCKH_PHASE_3_KICKOFF_PLAN.md`
   - Phase 3 contract/DB freeze: `NCKH_PHASE_3_CONTRACT_DB_FREEZE.md`
   - Phase 3 single approval packet: `NCKH_PHASE_3_SINGLE_APPROVAL_PACKET.md`
   - Phase 3 closeout evidence: `NCKH_PHASE_3_CLOSEOUT.md`
   - Phase 4 kickoff plan: `NCKH_PHASE_4_KICKOFF_PLAN.md`
   - Phase 4 contract/DB freeze: `NCKH_PHASE_4_CONTRACT_DB_FREEZE.md`
   - Phase 4 approval packet: `NCKH_PHASE_4_SINGLE_APPROVAL_PACKET.md`
   - Phase 4 closeout evidence: `NCKH_PHASE_4_CLOSEOUT.md`
   - Phase 5 kickoff plan: `NCKH_PHASE_5_KICKOFF_PLAN.md`
   - Phase 5 contract/DB freeze: `NCKH_PHASE_5_CONTRACT_DB_FREEZE.md`
   - Phase 5 approval packet: `NCKH_PHASE_5_SINGLE_APPROVAL_PACKET.md`
   - Phase 5 closeout evidence: `NCKH_PHASE_5_CLOSEOUT.md`
   - Phase 6 kickoff plan: `NCKH_PHASE_6_KICKOFF_PLAN.md`
   - Phase 6 contract/DB freeze: `NCKH_PHASE_6_CONTRACT_DB_FREEZE.md`
   - Phase 6 approval packet: `NCKH_PHASE_6_SINGLE_APPROVAL_PACKET.md`
   - Phase 6 closeout evidence: `NCKH_PHASE_6_CLOSEOUT.md`
   - Phase 7 kickoff plan: `NCKH_PHASE_7_KICKOFF_PLAN.md`
   - Phase 7 contract/UI freeze: `NCKH_PHASE_7_CONTRACT_UI_FREEZE.md`
   - Phase 7 approval packet: `NCKH_PHASE_7_SINGLE_APPROVAL_PACKET.md`
   - Phase 7 closeout evidence: `NCKH_PHASE_7_CLOSEOUT.md`
   - Phase 7.5 kickoff/fix plan: `NCKH_PHASE_7_5_KICKOFF_PLAN.md`
   - Phase 7.5 closeout evidence: `NCKH_PHASE_7_5_CLOSEOUT.md`
   - Phase 8 closeout evidence: `NCKH_PHASE_8_CLOSEOUT.md`
   - Phase 9 kickoff baseline: `NCKH_PHASE_9_KICKOFF_PLAN.md`
   - Phase 9 closeout evidence: `NCKH_PHASE_9_CLOSEOUT.md`
   - requirements: `NCKH_REQUIREMENT_PACKAGE.md`
   - module ownership: `NCKH_MODULE_MAP.md`
   - architecture boundaries: `NCKH_ARCHITECTURE_BOUNDARIES.md`
   - domain model: `NCKH_DOMAIN_ENTITIES_OVERVIEW.md`
   - proposed APIs: `NCKH_API_CONTRACT_GUIDE.md`

## Transition Rule

Do not phrase NCKH work as "FormAuto Hub Phase 10" unless the user explicitly chooses a FormAuto Hub global Phase 10.

Use this wording instead:

- "Open NCKH Phase 5"
- "Open NCKH Phase 7.5"
- "Open NCKH Phase 9"
- "NCKH Phase 2 closeout/fix follow-up"
- "NCKH Phase 1 validation/fix follow-up"

Do not call NCKH canvas work "FormAuto Hub Phase 9". FormAuto Hub global Phase 9 is already closed. Use "NCKH Phase 9 - Canvas UX Completion And Workflow Polish" when referring to the completed NCKH canvas work.

## Go/No-Go Checklist

Before implementing a new NCKH phase, confirm:

- The user explicitly approved the target phase or fix follow-up.
- The target phase is listed as current candidate or proposed in `NCKH_PHASE_ROADMAP.md`.
- The current implementation evidence in `NCKH_PROGRESS_LEDGER.md` does not conflict with the requested scope.
- API routes, DTOs, statuses, and lifecycle states have contract review when touched.
- Entity fields, relationships, delete behavior, indexes, and migrations have DB risk review when touched.
- Google OAuth/Forms/Sheets scopes are explicitly approved for the phase.
- Frontend work has approved backend contracts or is limited to documented shell/UI states.
- `docs/ai/nckh` and `docs/vi/nckh` will be updated together if docs change.

## Safe Work Without Opening A Phase

Allowed without opening a new implementation phase:

- reading docs and source evidence
- answering phase/status questions
- proposing NCKH scope
- doc-only sync approved by the user
- validation-only checks approved by the user

Not allowed without explicit approval:

- adding NCKH entities or migrations
- adding NCKH API contracts
- implementing Phase 8+ services/controllers/frontend flows
- enabling new Google scopes beyond the approved Phase 7.5 Google consent fix path
- treating proposed Phase 8+ behavior as completed

## Recommended Next Candidate

There is no active NCKH follow-up after Phase 9 closeout.

Phase 7 closeout evidence is available in `NCKH_PHASE_7_CLOSEOUT.md`. Phase 7.5 kickoff scope and closeout evidence are available in `NCKH_PHASE_7_5_KICKOFF_PLAN.md` and `NCKH_PHASE_7_5_CLOSEOUT.md`. Phase 8 full-stack smoke evidence is available in `NCKH_PHASE_8_CLOSEOUT.md`. Phase 9 canvas UX evidence is available in `NCKH_PHASE_9_CLOSEOUT.md`.

Before any follow-up that depends on completed Phase 7.5 work, review the completed implementation baseline covering:

- Phase 2 model, variable, and mapping APIs
- Phase 3 canvas relation APIs
- Phase 4 form generation APIs
- Phase 5 collection and normalization APIs
- Phase 6 export APIs and file contracts
- Phase 7 frontend workspace behavior
- live Google credential/consent availability
- Phase 8 full-stack smoke results and residual validation limits
- Phase 9 frontend-only Option A canvas UX behavior and residual limits

Phase 5 implemented the preferred `https://www.googleapis.com/auth/forms.responses.readonly` guard. Google Sheets collection remains an alternate path only if explicitly approved later.

Use `NCKH_PHASE_7_CLOSEOUT.md`, `NCKH_PHASE_7_5_KICKOFF_PLAN.md`, `NCKH_PHASE_7_5_CLOSEOUT.md`, `NCKH_PHASE_8_CLOSEOUT.md`, and `NCKH_PHASE_9_CLOSEOUT.md` as the dependency baseline before any follow-up that depends on the completed Phase 7.5/Phase 8/Phase 9 work.

No later NCKH candidate is selected after Phase 9 closeout.

## Closeout Rule

When a NCKH phase is completed, create or update closeout evidence before moving the roadmap:

- implementation summary
- files changed
- API/database contracts finalized
- validation run and results
- validation not run
- residual risks
- Deferred items preserved
- next candidate phase

If closeout evidence is missing, mark the phase as `Implemented with repo evidence` or `Partially implemented`, not `Completed`.

## Deferred

- React Flow or another canvas editing dependency unless explicitly approved later.
- Any FormAuto Hub global Phase 10 decision by implication.
- Any production readiness claim without current runtime validation.
