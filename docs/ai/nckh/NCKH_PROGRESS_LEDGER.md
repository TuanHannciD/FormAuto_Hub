# NCKH_PROGRESS_LEDGER

## Purpose

Record the evidence-backed progress state for the NCKH Survey Platform so future work starts from repo truth instead of stale roadmap wording.

This file is the first NCKH-specific status document to read after `README.md`, `AGENTS.md`, and `docs/ai/AI_DOC_ROUTING_MATRIX.md`.

## Current Status

Global FormAuto Hub state: Phase 9 closeout completed; no next global phase selected.

NCKH state: Phase 1 and Phase 2 are completed for their approved scopes. Phase 3 is the next proposed phase and is not approved by default.

No NCKH implementation phase is currently active unless a user explicitly approves one.

## Evidence Summary

| Area | Evidence | Status |
|---|---|---|
| Phase 0 docs | `docs/ai/nckh/*.md`, `docs/vi/nckh/*.md` | Baseline exists; sync must be preserved |
| Phase 1 entities | `src/FormAutoHub.Api/Entities/Nckh/ResearchForm.cs`, `ResearchFormQuestion.cs` | Implemented |
| Phase 1 migration | `src/FormAutoHub.Api/Data/Migrations/20260530051057_NckhPhase1_FormsAndOAuth.cs` | Implemented |
| Phase 1 DbContext | `src/FormAutoHub.Api/Data/FormAutoHubDbContext.cs` | Implemented for `ResearchForms` |
| Phase 1 API | `src/FormAutoHub.Api/Controllers/Nckh/ResearchFormsController.cs` | Implemented |
| Phase 1 service | `src/FormAutoHub.Api/Services/Nckh/ResearchFormService.cs` | Implemented |
| Phase 1 DTOs | `src/FormAutoHub.Api/Contracts/NckhDtos.cs` | Implemented |
| Phase 1 frontend | `apps/web/app/dashboard/nckh/page.tsx`, `apps/web/app/dashboard/nckh/callback/page.tsx` | Implemented |
| Phase 1 tests | `tests/FormAutoHub.Tests/NckhPhase1OAuthAndFormsTests.cs`, `apps/web/tests/nckh.spec.ts` | Test files exist |
| Phase 2 entities | `src/FormAutoHub.Api/Entities/Nckh/ResearchModel.cs`, `ResearchVariable.cs`, `ObservedQuestionMapping.cs` | Implemented |
| Phase 2 migration | `src/FormAutoHub.Api/Data/Migrations/20260602193837_NckhPhase2_PersistenceFoundation.cs` | Implemented and applied in validation |
| Phase 2 API | `src/FormAutoHub.Api/Controllers/Nckh/ResearchModelsController.cs`, `ResearchVariablesController.cs` | Implemented |
| Phase 2 services | `src/FormAutoHub.Api/Services/Nckh/ResearchModelService.cs`, `ResearchFormService.cs` | Implemented |
| Phase 2 tests | `tests/FormAutoHub.Tests/NckhPhase2PersistenceTests.cs`, `NckhPhase2ModelApiTests.cs`, `NckhPhase2VariableMappingApiTests.cs` | Tests pass in latest validation |
| Phase 3+ backend | Relations, canvas positions, data collection, normalization, export code | Deferred / not implemented |

## Implemented Phase 1 Behavior

Implemented:

- NCKH route prefix `/api/v1/nckh`
- authenticated Google link endpoint: `POST /api/v1/nckh/auth/google-link`
- authenticated form import endpoint: `POST /api/v1/nckh/forms/import`
- authenticated form list endpoint: `GET /api/v1/nckh/forms`
- authenticated form detail endpoint: `GET /api/v1/nckh/forms/{formId}`
- Google Forms read scope requirement
- imported form/question persistence
- duplicate imported form guard per user/form
- frontend shell for NCKH dashboard and OAuth callback

Implemented by Phase 2 evidence:

- research model CRUD
- multiple models per imported form
- single `Active` model enforcement per imported form
- explicit `Draft -> Active` activation endpoint
- variable CRUD under a model
- observed question mapping CRUD through separate endpoints
- database uniqueness for variable codes and observed mappings
- delete model within the owned Phase 2 cascade path

Not implemented by Phase 1/2 evidence:

- model relations
- node/canvas positions
- Google Form create/update
- response collection from Google Sheets
- normalization datasets
- CSV/Excel/SPSS export
- NCKH admin UI
- NCKH credit/pricing

## Validation State

Verified in the latest docs and validation pass:

- Repo files were scanned for NCKH docs, entities, controller/service/contracts, migration, frontend routes, and tests.
- dotnet build FormAutoHub.sln -c Release passed for the current NCKH Phase 2 backend slice.
- dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release passed: 122 passed, 0 failed.
- EF Core database update applied `20260602193837_NckhPhase2_PersistenceFoundation` in the Development SQL Server database.
- Authenticated HTTP smoke passed on `http://127.0.0.1:5097` with a real JWT for model, variable, and mapping CRUD plus `Draft -> Active` activation.
- NCKH Phase 2 smoke data was cleaned and the API process was stopped after validation.
- User-confirmed manual testing for the NCKH Phase 1 flow was recorded on 2026-06-01 for all 6 scoped checks: POST /api/v1/nckh/auth/google-link, POST /api/v1/nckh/forms/import, GET /api/v1/nckh/forms, GET /api/v1/nckh/forms/{formId}, /dashboard/nckh, and /dashboard/nckh/callback.

Not run in the latest docs and validation pass:

- Playwright smoke for NCKH Phase 2 frontend, because Phase 2 is backend-only and no frontend scope was implemented.
- live Google OAuth flow or live Google Forms API import during the Phase 2 closeout pass; these belong to Phase 1 behavior and were not changed by Phase 2.
- frontend build during the Phase 2 closeout pass, because no frontend file changed in the current Phase 2 scope.

Phase 1 and Phase 2 now have closeout evidence plus validation evidence for their approved scopes. Keep future claims outside those scopes or beyond the recorded validation evidence explicit.

## Phase State Table

| NCKH phase | State | Next action |
|---|---|---|
| Phase 0 - Docs baseline | Completed baseline | Keep AI/VI synced |
| Phase 1 - OAuth + Forms API import | Completed | Keep Phase 1 boundaries intact |
| Phase 2 - Model + Variables + Mapping | Completed | See `NCKH_PHASE_2_CLOSEOUT.md`; Phase 3 remains approval-gated |
| Phase 3 - Canvas Relations | Proposed | Requires approval after/with Phase 2 dependency clarity |
| Phase 4 - Form Generation | Proposed | Requires approval and Google Forms write-scope review |
| Phase 5 - Data Collection + Normalization | Proposed | Requires approval and Google Sheets scope review |
| Phase 6 - Export | Proposed | Requires approval after data model is implemented |
| Phase 7 - Frontend expansion | Proposed | Requires approved backend contracts first |
| Phase 8 - Full-stack smoke validation | Proposed | Run after approved implementation phases |

## Sync Rules

- When this file changes, update `docs/vi/nckh/NCKH_PROGRESS_LEDGER.md` in the same task.
- When phase state changes, update `NCKH_PHASE_ROADMAP.md` and `NCKH_PHASE_TRANSITION_GUIDE.md` in both language layers.
- Do not mark a phase completed without source/test/runtime evidence.
- Use `Implemented with repo evidence` when code exists but current runtime validation was not re-run.
- Use `Completed` only when the phase has closeout evidence and required validation has been run.

## Deferred

- NCKH Phase 3+ implementation until explicitly approved.
- Any new API contracts, database fields, lifecycle states, or Google scopes outside Phase 1/2 until reviewed and approved.
- Production-readiness claims until current validation is run.
