# NCKH Phase 2 Handoff Pack

Use this pack to delegate NCKH Phase 2 work immediately to the existing Codex sub-agents already available in this repo.

## Approved Baseline

Read these first before using any prompt in this pack:

1. `README.md`
2. `AGENTS.md`
3. `docs/ai/AI_DOC_ROUTING_MATRIX.md`
4. `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`
5. `docs/ai/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
6. `docs/ai/nckh/NCKH_PHASE_2_KICKOFF_PLAN.md`
7. `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`
8. `docs/ai/nckh/NCKH_DOMAIN_ENTITIES_OVERVIEW.md`
9. `docs/ai/nckh/NCKH_API_CONTRACT_GUIDE.md`

## Phase 2 Truth To Preserve

- multiple models per imported form are allowed
- at most one `Active` model per imported form
- Phase 2 is backend-only
- `ObservedQuestionMapping` uses separate endpoint(s)
- Phase 2 supports `Draft -> Active`
- `Archived` remains out of scope
- model delete is allowed only after FK/dependency review to non-owned tables
- future frontend delete confirmation UX is approved as a later follow-up, not as Phase 2 frontend work

## Suggested Order

1. `01_contract_db_freeze.md`
2. `02_persistence_foundation.md`
3. `03_model_api.md`
4. `04_variable_mapping_api.md`
5. `05_review.md`

## Sub-Agent Mapping

- `01_contract_db_freeze.md` -> `formauto-contract-guard` plus `formauto-db-risk-reviewer`
- `02_persistence_foundation.md` -> `formauto-implementation-worker`
- `03_model_api.md` -> `formauto-implementation-worker`
- `04_variable_mapping_api.md` -> `formauto-implementation-worker`
- `05_review.md` -> `formauto-reviewer`

## Stop Rules

- Stop if a prompt would require Phase 3 relations, canvas, Google write scope, data collection, normalization, export, or frontend implementation.
- Stop if a contract or DB detail conflicts with `NCKH_PHASE_2_KICKOFF_PLAN.md`.
- Stop if a worker would need to invent statuses, fields, routes, or delete behavior.
