# NCKH Phase 3 Persistence Foundation

Use the `formauto-implementation-worker` skill. Add `formauto-contract-guard` if contract drift is suspected.

Task:

Implement only NCKH Phase 3 Pass 1 persistence foundation for `ModelRelation` and `NodePosition`.

Read first:

- `README.md`
- `AGENTS.md`
- `docs/ai/AI_DOC_ROUTING_MATRIX.md`
- `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/ai/nckh/NCKH_PHASE_2_CLOSEOUT.md`
- `docs/ai/nckh/NCKH_PHASE_3_KICKOFF_PLAN.md`
- `docs/ai/nckh/NCKH_PHASE_3_CONTRACT_DB_FREEZE.md`
- `docs/ai/nckh/NCKH_PHASE_3_SINGLE_APPROVAL_PACKET.md`
- `docs/ai/nckh/NCKH_DOMAIN_ENTITIES_OVERVIEW.md`
- `docs/ai/nckh/NCKH_ARCHITECTURE_BOUNDARIES.md`

Approved scope:

- add `ModelRelation`
- add `NodePosition`
- add DbSets
- add `OnModelCreating` rules
- add EF Core migration
- add persistence-scope tests where appropriate

Critical rules:

- `Direction` values are `Positive` and `Negative` only.
- `ModelRelation.ModelId -> ResearchModels` uses cascade delete.
- `ModelRelation.FromVariableId -> ResearchVariables` uses restrict delete.
- `ModelRelation.ToVariableId -> ResearchVariables` uses restrict delete.
- `NodePosition.ModelId -> ResearchModels` uses cascade delete.
- `NodePosition.VariableId -> ResearchVariables` uses cascade delete.
- `NodePosition.RelationId -> ModelRelations` uses cascade delete.
- Add unique `(ModelId, FromVariableId, ToVariableId)`.
- Add unique `(ModelId, HypothesisCode)`.
- Add SQL Server-compatible filtered unique indexes for node positions.
- Add check constraints for self-relation rejection and exactly-one node target.
- Migration must be reversible.

Allowed file zones:

- `src/FormAutoHub.Api/Entities/Nckh/`
- `src/FormAutoHub.Api/Data/FormAutoHubDbContext.cs`
- `src/FormAutoHub.Api/Data/Migrations/`
- `tests/FormAutoHub.Tests/`

Do not:

- add controllers or frontend changes
- add Google Forms write/update, Google Sheets, data collection, normalization, export, credit/pricing, admin UI, AI, or statistics
- implement `Archived`
- alter Phase 1 or Phase 2 tables except adding reviewed FK references from Phase 3 tables

Stop and report if:

- SQL Server migration cannot satisfy the approved FK/delete/check/index rules
- current source contradicts the approved packet
- persistence cannot be implemented without later-phase behavior

Return:

- summary
- files changed
- migration name
- tests added/updated
- validation run/not run
- blockers if any

