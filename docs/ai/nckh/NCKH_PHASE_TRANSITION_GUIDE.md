# NCKH_PHASE_TRANSITION_GUIDE

## Purpose

Define how to move from the closed FormAuto Hub global phase state into a specific NCKH phase without confusing NCKH work with a new FormAuto Hub global phase.

## Current Baseline

- FormAuto Hub global phase: Phase 9 closeout completed; no next global phase selected.
- NCKH is a separate module track inside the same repository.
- NCKH Phase 1 is completed for its approved scope.
- NCKH Phase 2 is completed for its approved backend-only scope.
- NCKH Phase 3 is the next proposed phase and is not active until explicitly approved.

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
   - requirements: `NCKH_REQUIREMENT_PACKAGE.md`
   - module ownership: `NCKH_MODULE_MAP.md`
   - architecture boundaries: `NCKH_ARCHITECTURE_BOUNDARIES.md`
   - domain model: `NCKH_DOMAIN_ENTITIES_OVERVIEW.md`
   - proposed APIs: `NCKH_API_CONTRACT_GUIDE.md`

## Transition Rule

Do not phrase NCKH work as "FormAuto Hub Phase 10" unless the user explicitly chooses a FormAuto Hub global Phase 10.

Use this wording instead:

- "Open NCKH Phase 3"
- "NCKH Phase 2 closeout/fix follow-up"
- "NCKH Phase 1 validation/fix follow-up"

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
- implementing Phase 3+ services/controllers/frontend flows
- enabling new Google scopes
- treating proposed Phase 3+ behavior as completed

## Recommended Next Candidate

The next implementation candidate is **NCKH Phase 3 - Canvas Relations & Hypothesis**.

Before Phase 3 implementation, prepare a narrow kickoff plan covering:

- exact relation and node-position entities and fields to add
- ownership and model-status constraints
- relation validation and duplicate/self-relation behavior
- whether hypothesis text/code generation is deterministic only or needs a separate approval
- delete behavior when variables or mappings are removed
- migration and rollback risk
- API contract surface
- frontend dependency, if any, including React Flow only after backend contracts are approved
- validation plan

Use `NCKH_PHASE_2_CLOSEOUT.md` as the dependency baseline before any Phase 3 planning.

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

- Any NCKH Phase 3+ implementation without explicit approval.
- Any FormAuto Hub global Phase 10 decision by implication.
- Any production readiness claim without current runtime validation.
