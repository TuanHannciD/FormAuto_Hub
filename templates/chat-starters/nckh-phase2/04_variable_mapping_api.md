# NCKH Phase 2 Variable And Mapping API

Use the `formauto-implementation-worker` skill. Add `formauto-contract-guard` if needed.

Task:

Implement only NCKH Phase 2 Pass 3-4 for `ResearchVariable` and `ObservedQuestionMapping`.

Read first:

- `README.md`
- `AGENTS.md`
- `docs/ai/AI_DOC_ROUTING_MATRIX.md`
- `docs/ai/nckh/NCKH_PHASE_2_KICKOFF_PLAN.md`
- `docs/ai/nckh/NCKH_API_CONTRACT_GUIDE.md`
- `docs/ai/nckh/NCKH_DOMAIN_ENTITIES_OVERVIEW.md`

Approved scope:

- variable CRUD
- mapping CRUD through separate endpoint(s)
- validation for variable code, scale payload, ownership, duplicate observed code, and cross-model misuse

Do not:

- put mappings back into nested variable payloads
- add relation or node-position behavior
- add Google write/update, data collection, normalization, export, or frontend work
- invent warning flows that depend on later phases unless already documented as future-only

Allowed file zones:

- `src/FormAutoHub.Api/Contracts/`
- `src/FormAutoHub.Api/Controllers/Nckh/`
- `src/FormAutoHub.Api/Services/Nckh/`
- `tests/FormAutoHub.Tests/`

Return with validation honesty using `Verified`, `Not run`, `Blocked`.
