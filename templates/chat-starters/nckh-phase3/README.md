# NCKH Phase 3 Handoff Pack

Use this pack to delegate NCKH Phase 3 work immediately to the existing Codex sub-agents already available in this repo.

## One-Time Approval Gate

Before dispatching implementation workers, get explicit user approval for:

- `docs/ai/nckh/NCKH_PHASE_3_SINGLE_APPROVAL_PACKET.md`

Once approved, workers should not re-ask the decisions captured there unless they find a real conflict in current source or validation.

Recommended approval wording:

```text
Approved: Open NCKH Phase 3 implementation using NCKH_PHASE_3_SINGLE_APPROVAL_PACKET.md and NCKH_PHASE_3_CONTRACT_DB_FREEZE.md as the approved baseline.
```

## Required Reading Before Any Worker

Every worker should read these first:

1. `README.md`
2. `AGENTS.md`
3. `docs/ai/AI_DOC_ROUTING_MATRIX.md`
4. `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`
5. `docs/ai/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
6. `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`
7. `docs/ai/nckh/NCKH_PHASE_2_CLOSEOUT.md`
8. `docs/ai/nckh/NCKH_PHASE_3_KICKOFF_PLAN.md`
9. `docs/ai/nckh/NCKH_PHASE_3_CONTRACT_DB_FREEZE.md`
10. `docs/ai/nckh/NCKH_PHASE_3_SINGLE_APPROVAL_PACKET.md`
11. `docs/ai/nckh/NCKH_DOMAIN_ENTITIES_OVERVIEW.md`
12. `docs/ai/nckh/NCKH_API_CONTRACT_GUIDE.md`
13. `docs/ai/nckh/NCKH_ARCHITECTURE_BOUNDARIES.md`
14. `docs/ai/nckh/NCKH_MODULE_MAP.md`

## Approved Baseline To Preserve

- backend-only Phase 3
- implement only `ModelRelation` and `NodePosition`
- relation CRUD
- node-position save/load
- deterministic hypothesis code/text only
- `Direction`: `Positive`, `Negative`
- reject self-relation
- reject duplicate directed relation
- inverse relation allowed
- relations and positions editable only while model is `Draft`
- `Active` models are read-only for Phase 3 edits
- `Archived`, AI, statistics, Google write scope, Google Sheets, data collection, normalization, export, credit/pricing, admin UI, and frontend canvas remain Deferred

## Suggested Order

1. `01_persistence_foundation.md`
2. `02_relation_api.md`
3. `03_node_positions_hypothesis.md`
4. `04_validation_closeout_docs.md`
5. `05_review.md`

## Sub-Agent Mapping

- `01_persistence_foundation.md` -> `formauto-implementation-worker` plus contract awareness
- `02_relation_api.md` -> `formauto-implementation-worker` plus contract awareness
- `03_node_positions_hypothesis.md` -> `formauto-implementation-worker` plus contract awareness
- `04_validation_closeout_docs.md` -> `formauto-http-behavior-tester` plus `formauto-controlled-doc-editor`
- `05_review.md` -> `formauto-reviewer` plus `formauto-contract-guard` and `formauto-db-risk-reviewer`

## Stop Rules

- Stop if source code conflicts with the approved packet in a way that cannot be resolved with the smallest scoped change.
- Stop if migration generation cannot satisfy SQL Server FK/delete/check/index rules.
- Stop if implementation would require React Flow frontend, Google write scope, Google Sheets, data collection, normalization, export, credit/pricing, admin UI, statistical analysis, or AI provider calls.
- Stop if runtime validation fails and the cause is not safely fixable within Phase 3 scope.

