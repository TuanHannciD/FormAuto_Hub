# NCKH Phase 3 Node Positions And Hypothesis Output

Use the `formauto-implementation-worker` skill. Add `formauto-contract-guard` if DTO behavior drifts.

Task:

Implement only approved node-position save/load behavior and complete deterministic hypothesis output coverage for NCKH Phase 3.

Read first:

- `README.md`
- `AGENTS.md`
- `docs/ai/AI_DOC_ROUTING_MATRIX.md`
- `docs/ai/nckh/NCKH_PHASE_3_CONTRACT_DB_FREEZE.md`
- `docs/ai/nckh/NCKH_PHASE_3_SINGLE_APPROVAL_PACKET.md`
- current Worker A and Worker B results/diffs

Approved endpoints:

- `GET /api/v1/nckh/models/{modelId}/positions`
- `PUT /api/v1/nckh/models/{modelId}/positions`

Approved behavior:

- support `Variable` and `Relation` node types only
- exactly one of `variableId` or `relationId` must be set per position
- referenced variable or relation must belong to the same model
- save/load only in current user's model scope
- save positions only while model is `Draft`
- `Active` models are read-only for position edits
- persist decimal coordinates with two decimal places
- do not enforce frontend viewport bounds
- deterministic hypothesis output must remain repeatable and non-AI

Allowed file zones:

- `src/FormAutoHub.Api/Contracts/`
- `src/FormAutoHub.Api/Controllers/Nckh/`
- `src/FormAutoHub.Api/Services/Nckh/`
- `tests/FormAutoHub.Tests/`

Do not:

- add React Flow frontend
- add AI provider calls
- add statistical analysis
- add Google Forms write/update, Google Sheets, response collection, normalization, export, credit/pricing, or admin UI
- implement `Archived`

Stop and report if:

- Worker A/B output is missing or conflicts with the approved packet
- node-position behavior requires frontend-specific React Flow payload as backend contract
- implementation would need later-phase behavior

Return:

- summary
- files changed
- tests added/updated
- validation run/not run
- blockers if any

