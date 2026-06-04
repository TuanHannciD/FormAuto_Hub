# NCKH Phase 2 Model API

Use the `formauto-implementation-worker` skill. Add `formauto-contract-guard` if contract drift appears.

Task:

Implement only NCKH Phase 2 Pass 2 model API.

Read first:

- `README.md`
- `AGENTS.md`
- `docs/ai/AI_DOC_ROUTING_MATRIX.md`
- `docs/ai/nckh/NCKH_PHASE_2_KICKOFF_PLAN.md`
- `docs/ai/nckh/NCKH_API_CONTRACT_GUIDE.md`
- `docs/ai/nckh/NCKH_ARCHITECTURE_BOUNDARIES.md`

Approved scope:

- create/list/detail/update/delete for `ResearchModel`
- explicit `Draft -> Active` transition support
- ownership enforcement
- multi-model-per-form support
- single-active-model enforcement per imported form
- delete behavior only within approved Phase 2 boundaries

Allowed file zones:

- `src/FormAutoHub.Api/Contracts/`
- `src/FormAutoHub.Api/Controllers/Nckh/`
- `src/FormAutoHub.Api/Services/Nckh/`
- `tests/FormAutoHub.Tests/`

Do not:

- add variables, mappings, relations, canvas, Google write/update, data collection, normalization, export, or frontend work
- invent `Archived`
- guess delete behavior for non-owned tables

Return with validation honesty using `Verified`, `Not run`, `Blocked`.
