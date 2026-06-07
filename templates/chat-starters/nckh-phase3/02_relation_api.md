# NCKH Phase 3 Relation API

Use the `formauto-implementation-worker` skill. Add `formauto-contract-guard` if route or DTO drift is suspected.

Task:

Implement only NCKH Phase 3 relation CRUD using the approved persistence foundation.

Read first:

- `README.md`
- `AGENTS.md`
- `docs/ai/AI_DOC_ROUTING_MATRIX.md`
- `docs/ai/nckh/NCKH_PHASE_3_CONTRACT_DB_FREEZE.md`
- `docs/ai/nckh/NCKH_PHASE_3_SINGLE_APPROVAL_PACKET.md`
- `docs/ai/nckh/NCKH_API_CONTRACT_GUIDE.md`
- `docs/ai/nckh/NCKH_MODULE_MAP.md`
- current Phase 3 persistence diff/result from Worker A

Approved endpoints:

- `POST /api/v1/nckh/models/{modelId}/relations`
- `GET /api/v1/nckh/models/{modelId}/relations`
- `GET /api/v1/nckh/relations/{relationId}`
- `PUT /api/v1/nckh/relations/{relationId}`
- `DELETE /api/v1/nckh/relations/{relationId}`

Approved behavior:

- enforce current-user ownership through model and variables
- both variables must belong to the same model
- reject self-relation
- reject duplicate directed relation
- allow inverse relation
- allow only `Positive` and `Negative`
- create/update/delete only when model is `Draft`
- `Active` models are read-only for relation edits
- generate deterministic `HypothesisCode` and `HypothesisText`
- no AI provider calls

Allowed file zones:

- `src/FormAutoHub.Api/Contracts/`
- `src/FormAutoHub.Api/Controllers/Nckh/`
- `src/FormAutoHub.Api/Services/Nckh/`
- `tests/FormAutoHub.Tests/`

Do not:

- add node-position UI
- add frontend changes
- add Google integration, data collection, normalization, export, credit/pricing, admin UI, statistics, or AI behavior
- implement `Archived`

Stop and report if:

- Worker A schema is missing or unsafe
- current route/service patterns conflict with the approved packet
- relation API cannot be implemented without expanding scope

Return:

- summary
- files changed
- tests added/updated
- validation run/not run
- blockers if any

