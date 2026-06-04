# NCKH_PHASE_2_CLOSEOUT

## Purpose

Record the closeout evidence for NCKH Phase 2 so future work starts from validated repository truth instead of kickoff-plan wording.

## Decision

NCKH Phase 2 is **Completed** for its approved backend-only scope.

Final review decision: **APPROVE**.

## Approved Scope Delivered

Implemented:

- `ResearchModel` persistence and API
- `ResearchVariable` persistence and API
- `ObservedQuestionMapping` persistence and API
- multiple models per imported form
- at most one `Active` model per imported form
- explicit `Draft -> Active` activation
- mapping CRUD through separate endpoint(s), not nested variable payloads
- model delete within the owned cascade path
- database uniqueness for active model, variable code, and mappings
- authenticated backend validation through HTTP smoke

## Backend Files Of Interest

- `src/FormAutoHub.Api/Entities/Nckh/ResearchModel.cs`
- `src/FormAutoHub.Api/Entities/Nckh/ResearchVariable.cs`
- `src/FormAutoHub.Api/Entities/Nckh/ObservedQuestionMapping.cs`
- `src/FormAutoHub.Api/Data/FormAutoHubDbContext.cs`
- `src/FormAutoHub.Api/Data/Migrations/20260602193837_NckhPhase2_PersistenceFoundation.cs`
- `src/FormAutoHub.Api/Contracts/NckhDtos.cs`
- `src/FormAutoHub.Api/Controllers/Nckh/ResearchModelsController.cs`
- `src/FormAutoHub.Api/Controllers/Nckh/ResearchVariablesController.cs`
- `src/FormAutoHub.Api/Services/Nckh/ResearchModelService.cs`
- `src/FormAutoHub.Api/Services/Nckh/ResearchFormService.cs`
- `tests/FormAutoHub.Tests/NckhPhase2PersistenceTests.cs`
- `tests/FormAutoHub.Tests/NckhPhase2ModelApiTests.cs`
- `tests/FormAutoHub.Tests/NckhPhase2VariableMappingApiTests.cs`

## API Surface Implemented

Model endpoints:

- `POST /api/v1/nckh/models`
- `GET /api/v1/nckh/models`
- `GET /api/v1/nckh/models/{modelId}`
- `PUT /api/v1/nckh/models/{modelId}`
- `POST /api/v1/nckh/models/{modelId}/activate`
- `DELETE /api/v1/nckh/models/{modelId}`

Variable endpoints:

- `POST /api/v1/nckh/models/{modelId}/variables`
- `GET /api/v1/nckh/models/{modelId}/variables`
- `PUT /api/v1/nckh/variables/{variableId}`
- `DELETE /api/v1/nckh/variables/{variableId}`

Mapping endpoints:

- `POST /api/v1/nckh/variables/{variableId}/mappings`
- `GET /api/v1/nckh/variables/{variableId}/mappings`
- `GET /api/v1/nckh/models/{modelId}/mappings`
- `PUT /api/v1/nckh/mappings/{mappingId}`
- `DELETE /api/v1/nckh/mappings/{mappingId}`

## Database Contract Implemented

- `ResearchModels`
  - FK to `Users`
  - FK to `ResearchForms` with restrict/no-action delete toward the imported form
  - filtered unique index on `FormId` where `Status = 'Active'`
- `ResearchVariables`
  - FK to `ResearchModels` with cascade delete
  - unique index on `(ModelId, Code)`
- `ObservedQuestionMappings`
  - FK to `ResearchVariables` with cascade delete
  - FK to `ResearchFormQuestions` with restrict/no-action delete
  - unique index on `(VariableId, FormQuestionId)`
  - unique index on `(VariableId, ObservedCode)`

The migration is reversible and only creates/drops the three Phase 2 tables.

## Validation Performed

Verified:

- `dotnet test tests\FormAutoHub.Tests\FormAutoHub.Tests.csproj -c Release` passed: 122 passed, 0 failed.
- `dotnet build FormAutoHub.sln -c Release` passed.
- `dotnet ef database update` with `ASPNETCORE_ENVIRONMENT=Development` applied `20260602193837_NckhPhase2_PersistenceFoundation` successfully.
- Runtime API smoke passed on `http://127.0.0.1:5097` using a real JWT from `/api/auth/register`.
- Runtime smoke SQL-seeded one `ResearchForm` and one `ResearchFormQuestion` for the smoke user.
- Runtime smoke covered model create, list, detail, update, activate, and delete.
- Runtime smoke covered variable create, list, update, and delete.
- Runtime smoke covered mapping create, list by variable, list by model, update, and delete.
- Smoke data was cleaned after validation.
- API process was stopped after validation.

## Validation Not Performed

Not run:

- frontend build for this closeout pass, because Phase 2 is backend-only and no frontend files are part of the current Phase 2 implementation scope
- Playwright/browser smoke for Phase 2, because Phase 2 does not implement frontend UI
- live Google OAuth or live Google Forms import, because Phase 2 does not change Phase 1 Google behavior
- high-concurrency race testing for simultaneous activation attempts

## Scope Boundaries Preserved

Deferred / not implemented in Phase 2:

- `Archived` lifecycle
- `ModelRelation`
- `NodePosition`
- React Flow canvas
- Google Forms create/update
- Google Sheets response pull
- response collection
- normalization or dataset generation
- CSV/Excel/SPSS export
- credit deduction or pricing
- NCKH admin UI
- background jobs, watches, or Pub/Sub
- frontend delete-confirmation dialog

## Residual Risks

- Future Phase 3+ dependents must re-review model and variable delete behavior before adding relations, node positions, datasets, exports, or collected responses.
- Concurrent activation relies on both service pre-check and SQL Server filtered unique index; normal runtime smoke passed, but high-concurrency race testing was not separately performed.
- Future frontend delete UX must still implement the approved exact-name confirmation and impact-summary behavior before exposing delete actions in UI.

## Next Recommended Step

The next implementation candidate is **NCKH Phase 3 - Canvas Relations & Hypothesis**.

Phase 3 remains **Deferred / Proposed** until the user explicitly approves it and contract/DB review is completed.
