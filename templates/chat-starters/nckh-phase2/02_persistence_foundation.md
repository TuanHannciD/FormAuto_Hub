# NCKH Phase 2 Persistence Foundation

Use the `formauto-implementation-worker` skill.

Task:

Implement only NCKH Phase 2 Pass 1 persistence foundation.

Read first:

- `README.md`
- `AGENTS.md`
- `docs/ai/AI_DOC_ROUTING_MATRIX.md`
- `docs/ai/nckh/NCKH_PHASE_2_KICKOFF_PLAN.md`
- `docs/ai/nckh/NCKH_DOMAIN_ENTITIES_OVERVIEW.md`
- `docs/ai/nckh/NCKH_ARCHITECTURE_BOUNDARIES.md`

Approved scope:

- add `ResearchModel`
- add `ResearchVariable`
- add `ObservedQuestionMapping`
- add DbSets
- add `OnModelCreating` rules
- add migration
- add persistence-scope tests where appropriate

Critical rules:

- allow multiple models per imported form
- enforce at most one `Active` model per imported form
- support `Draft -> Active`
- keep `Archived` out of scope
- `ObservedQuestionMapping -> ResearchFormQuestion` uses `DeleteBehavior.Restrict`
- do not touch Phase 3 entities
- do not add controllers or frontend changes

Allowed file zones:

- `src/FormAutoHub.Api/Entities/Nckh/`
- `src/FormAutoHub.Api/Data/FormAutoHubDbContext.cs`
- `src/FormAutoHub.Api/Data/Migrations/`
- `tests/FormAutoHub.Tests/`

Stop and report if:

- single-active enforcement is unclear at DB level
- delete behavior to non-owned tables is unclear
- migration needs Phase 3 fields or routes to make sense
