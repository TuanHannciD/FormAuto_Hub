# NCKH Phase 2 Contract And DB Freeze

Use the `formauto-contract-guard` skill first. Add `formauto-db-risk-reviewer` for the DB section.

Task:

Review NCKH Phase 2 only. Do not write production code.

Read first:

- `README.md`
- `AGENTS.md`
- `docs/ai/AI_DOC_ROUTING_MATRIX.md`
- `docs/ai/nckh/NCKH_PHASE_2_KICKOFF_PLAN.md`
- `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/ai/nckh/NCKH_DOMAIN_ENTITIES_OVERVIEW.md`
- `docs/ai/nckh/NCKH_API_CONTRACT_GUIDE.md`
- `docs/ai/nckh/NCKH_ARCHITECTURE_BOUNDARIES.md`

Approved scope to protect:

- `ResearchModel`, `ResearchVariable`, `ObservedQuestionMapping`
- multiple models per imported form
- at most one `Active` model per imported form
- explicit `Draft -> Active` transition in Phase 2
- backend-only Phase 2
- mapping endpoint(s) separate from variable payloads
- delete model allowed only after FK/dependency review to non-owned tables

Return:

- confirmed contract surface
- confirmed DB surface
- remaining approval gaps if any
- risky or conflicting doc wording
- safe route surface for Pass 1-4
- DB constraints and index recommendations that are consistent with approved scope

Do not:

- invent new statuses beyond `Draft` and `Active`
- pull `Archived` into Phase 2
- invent frontend scope
- invent Phase 3+ entities or behavior
