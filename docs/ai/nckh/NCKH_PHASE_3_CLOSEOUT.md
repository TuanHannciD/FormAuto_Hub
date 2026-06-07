# NCKH_PHASE_3_CLOSEOUT

## Purpose

Record closeout evidence for NCKH Phase 3 so future work starts from validated repository truth instead of kickoff or freeze wording alone.

## Decision

NCKH Phase 3 is **Completed** for the approved backend-only Canvas Relations & Hypothesis scope.

Final implementation decision: **APPROVE WITH DOCUMENTED SQL Server DELETE-BEHAVIOR ADJUSTMENT**.

## Approved Scope Delivered

Implemented:

- `ModelRelation` persistence and API.
- `NodePosition` persistence and API.
- Relation CRUD under `/api/v1/nckh`.
- Node-position save/load under `/api/v1/nckh`.
- Deterministic hypothesis code/text generation.
- `Direction` allowed values: `Positive`, `Negative`.
- Same-model variable validation.
- Self-relation rejection.
- Duplicate directed relation rejection by `(ModelId, FromVariableId, ToVariableId)`.
- Inverse directed relation allowed.
- Draft-only edit guard for relations and positions.
- Variable delete guard when relations reference the variable.
- Variable node-position cleanup before allowed variable delete.

## Backend Files Of Interest

- `src/FormAutoHub.Api/Entities/Nckh/ModelRelation.cs`
- `src/FormAutoHub.Api/Entities/Nckh/NodePosition.cs`
- `src/FormAutoHub.Api/Entities/Nckh/ResearchModel.cs`
- `src/FormAutoHub.Api/Entities/Nckh/ResearchVariable.cs`
- `src/FormAutoHub.Api/Data/FormAutoHubDbContext.cs`
- `src/FormAutoHub.Api/Data/Migrations/20260604131107_NckhPhase3_CanvasRelations.cs`
- `src/FormAutoHub.Api/Contracts/NckhDtos.cs`
- `src/FormAutoHub.Api/Controllers/Nckh/ResearchCanvasController.cs`
- `src/FormAutoHub.Api/Services/Nckh/ResearchCanvasService.cs`
- `src/FormAutoHub.Api/Services/Nckh/ResearchFormService.cs`
- `src/FormAutoHub.Api/Program.cs`
- `tests/FormAutoHub.Tests/NckhPhase3PersistenceTests.cs`
- `tests/FormAutoHub.Tests/NckhPhase3CanvasServiceTests.cs`
- `tests/FormAutoHub.Tests/FoundationTests.cs`

## API Surface Implemented

Relation endpoints:

- `POST /api/v1/nckh/models/{modelId}/relations`
- `GET /api/v1/nckh/models/{modelId}/relations`
- `GET /api/v1/nckh/relations/{relationId}`
- `PUT /api/v1/nckh/relations/{relationId}`
- `DELETE /api/v1/nckh/relations/{relationId}`

Node position endpoints:

- `GET /api/v1/nckh/models/{modelId}/positions`
- `PUT /api/v1/nckh/models/{modelId}/positions`

## Database Contract Implemented

- `ModelRelations`
  - FK to `ResearchModels` with cascade delete.
  - FK `FromVariableId -> ResearchVariables` with restrict/no-action delete.
  - FK `ToVariableId -> ResearchVariables` with restrict/no-action delete.
  - Unique index on `(ModelId, FromVariableId, ToVariableId)`.
  - Unique index on `(ModelId, HypothesisCode)`.
  - Check constraint rejecting self-relation.
- `NodePositions`
  - FK to `ResearchModels` with restrict/no-action delete.
  - FK to `ResearchVariables` with restrict/no-action delete.
  - FK to `ModelRelations` with cascade delete.
  - SQL Server-compatible filtered unique indexes for variable and relation node positions.
  - Check constraint requiring exactly one of `VariableId` or `RelationId`.
  - `PositionX` and `PositionY` stored as decimal `(18, 2)`.

## Approved SQL Server Delete-Behavior Adjustment

The Phase 3 freeze originally proposed cascade delete for all three `NodePosition` parents. SQL Server rejected that shape with multiple cascade path errors during `dotnet ef database update`.

Approved implementation adjustment:

- Keep `ModelRelation.ModelId -> ResearchModels` cascade.
- Keep `NodePosition.RelationId -> ModelRelations` cascade.
- Use restrict/no-action for `NodePosition.ModelId -> ResearchModels`.
- Use restrict/no-action for `NodePosition.VariableId -> ResearchVariables`.
- Preserve effective variable delete behavior in service by deleting variable node positions before removing a variable, after confirming no relations reference it.

This adjustment avoids SQL Server multiple cascade paths while preserving Phase 3 ownership and cleanup behavior.

## Validation Performed

Verified:

- `dotnet build FormAutoHub.sln -c Release` passed.
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build` passed: 129 passed, 0 failed.
- `dotnet ef database update --configuration Release --project src/FormAutoHub.Api/FormAutoHub.Api.csproj --startup-project src/FormAutoHub.Api/FormAutoHub.Api.csproj` applied migration `20260604131107_NckhPhase3_CanvasRelations` to temporary LocalDB database `FormAutoHubNckhPhase3Smoke3`.
- Authenticated HTTP smoke passed on `http://127.0.0.1:5101` using a real JWT from `/api/auth/register`.
- Runtime smoke SQL-seeded one `ResearchForm`, one `ResearchModel`, and two `ResearchVariables` for the smoke user.
- Runtime smoke covered relation create, list, detail, update, and delete.
- Runtime smoke covered node-position save and load for variable and relation nodes.
- Runtime smoke verified deterministic hypothesis output.
- API process was stopped after validation.
- Temporary LocalDB smoke databases were dropped after validation.
- Server log tail was inspected after smoke checks and no `fail:` or unhandled exception was found.

## Validation Not Performed

Not run:

- frontend build, because Phase 3 is backend-only and no frontend files changed.
- Playwright/browser smoke, because Phase 3 does not implement frontend UI.
- live Google OAuth or live Google Forms import, because Phase 3 does not change Phase 1 Google behavior.
- high-concurrency relation creation race testing.

## Scope Boundaries Preserved

Deferred / not implemented in Phase 3:

- `Archived` lifecycle behavior
- AI-generated hypothesis text
- statistical analysis
- Google Forms create/update
- Google Sheets response pull
- response collection
- normalization/export
- credit/pricing
- NCKH admin UI
- React Flow/frontend canvas implementation
- production background jobs, watches, or Pub/Sub

## Residual Risks

- Concurrent relation creation can still race on `HypothesisCode`; the database unique index protects integrity, but high-concurrency retry behavior was not separately hardened in this phase.
- Frontend canvas behavior remains unimplemented until a later approved frontend phase.
- Future Phase 4+ work must not treat relation/hypothesis data as statistical analysis output.

## Next Recommended Step

The next implementation candidate is **NCKH Phase 4 - Form Generation & Update**, but it remains Proposed and requires explicit approval plus Google Forms write-scope review before implementation.
