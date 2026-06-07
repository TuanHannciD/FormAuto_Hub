# NCKH_PROGRESS_LEDGER

## Purpose

Record the evidence-backed progress state for the NCKH Survey Platform so future work starts from repo truth instead of stale roadmap wording.

This file is the first NCKH-specific status document to read after `README.md`, `AGENTS.md`, and `docs/ai/AI_DOC_ROUTING_MATRIX.md`.

## Current Status

Global FormAuto Hub state: Phase 9 closeout completed; no next global phase selected.

NCKH state: Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6, Phase 7, Phase 7.5, Phase 8, and Phase 9 are completed for their approved scopes. Phase 8 was validation-only and did not add product behavior. Phase 9 was frontend-only Option A and did not add backend contracts or canvas dependencies.

Active NCKH follow-up: **none**.

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
| Phase 3 entities | `src/FormAutoHub.Api/Entities/Nckh/ModelRelation.cs`, `NodePosition.cs` | Implemented |
| Phase 3 migration | `src/FormAutoHub.Api/Data/Migrations/20260604131107_NckhPhase3_CanvasRelations.cs` | Implemented and applied in validation |
| Phase 3 API | `src/FormAutoHub.Api/Controllers/Nckh/ResearchCanvasController.cs` | Implemented |
| Phase 3 service | `src/FormAutoHub.Api/Services/Nckh/ResearchCanvasService.cs`, `ResearchFormService.cs` | Implemented |
| Phase 3 tests | `tests/FormAutoHub.Tests/NckhPhase3PersistenceTests.cs`, `NckhPhase3CanvasServiceTests.cs` | Tests pass in latest validation |
| Phase 3 closeout | `docs/ai/nckh/NCKH_PHASE_3_CLOSEOUT.md`, `docs/vi/nckh/NCKH_PHASE_3_CLOSEOUT.md` | Completed with runtime validation |
| Phase 4 API | `src/FormAutoHub.Api/Controllers/Nckh/ResearchFormsController.cs` | Implemented |
| Phase 4 service/integration | `src/FormAutoHub.Api/Services/Nckh/ResearchFormService.cs`, `src/FormAutoHub.Api/Integrations/Google/GoogleFormsApiService.cs` | Implemented |
| Phase 4 migration | `src/FormAutoHub.Api/Data/Migrations/20260604165518_NckhPhase4_FormGenerationTracking.cs` | Implemented and applied in validation |
| Phase 4 tests | `tests/FormAutoHub.Tests/NckhPhase4FormGenerationServiceTests.cs` | Tests pass in latest validation |
| Phase 4 closeout | `docs/ai/nckh/NCKH_PHASE_4_CLOSEOUT.md`, `docs/vi/nckh/NCKH_PHASE_4_CLOSEOUT.md` | Completed with local runtime validation; live Google smoke blocked |
| Phase 5 API | `src/FormAutoHub.Api/Controllers/Nckh/ResearchDataController.cs` | Implemented |
| Phase 5 service/integration | `src/FormAutoHub.Api/Services/Nckh/ResearchDataService.cs`, `src/FormAutoHub.Api/Integrations/Google/GoogleFormsApiService.cs` | Implemented |
| Phase 5 entities | `src/FormAutoHub.Api/Entities/Nckh/SurveyResponse.cs`, `NormalizedDataset.cs`, `DataCollectionLog.cs` | Implemented |
| Phase 5 migration | `src/FormAutoHub.Api/Data/Migrations/20260604211823_NckhPhase5_DataCollectionNormalization.cs` | Implemented and applied in validation |
| Phase 5 tests | `tests/FormAutoHub.Tests/NckhPhase5DataServiceTests.cs` | Tests pass in latest validation |
| Phase 5 closeout | `docs/ai/nckh/NCKH_PHASE_5_CLOSEOUT.md`, `docs/vi/nckh/NCKH_PHASE_5_CLOSEOUT.md` | Completed with local runtime validation; live Google response-read smoke blocked |
| Phase 6 planning | `docs/ai/nckh/NCKH_PHASE_6_KICKOFF_PLAN.md`, `docs/ai/nckh/NCKH_PHASE_6_CONTRACT_DB_FREEZE.md`, `docs/ai/nckh/NCKH_PHASE_6_SINGLE_APPROVAL_PACKET.md` | Approved baseline used for implementation |
| Phase 6 API/service | `src/FormAutoHub.Api/Controllers/Nckh/ResearchDataController.cs`, `src/FormAutoHub.Api/Services/Nckh/ResearchExportService.cs`, `src/FormAutoHub.Api/Contracts/NckhDtos.cs` | Implemented |
| Phase 6 tests | `tests/FormAutoHub.Tests/NckhPhase6ExportServiceTests.cs` | Tests pass in latest validation |
| Phase 6 closeout | `docs/ai/nckh/NCKH_PHASE_6_CLOSEOUT.md`, `docs/vi/nckh/NCKH_PHASE_6_CLOSEOUT.md` | Completed with local runtime validation |
| Phase 7 planning | `docs/ai/nckh/NCKH_PHASE_7_KICKOFF_PLAN.md`, `NCKH_PHASE_7_CONTRACT_UI_FREEZE.md`, `NCKH_PHASE_7_SINGLE_APPROVAL_PACKET.md` | Prepared; implementation requires explicit approval |
| Phase 7 frontend | `apps/web/app/dashboard/nckh/forms/[formId]/page.tsx`, `apps/web/lib/api.ts`, `apps/web/tests/nckh.spec.ts` | Implemented and browser-smoke validated |
| Phase 7 closeout | `docs/ai/nckh/NCKH_PHASE_7_CLOSEOUT.md`, `docs/vi/nckh/NCKH_PHASE_7_CLOSEOUT.md` | Completed with frontend build and Playwright validation |
| Phase 7.5 kickoff | `docs/ai/nckh/NCKH_PHASE_7_5_KICKOFF_PLAN.md`, `docs/vi/nckh/NCKH_PHASE_7_5_KICKOFF_PLAN.md` | Approved baseline used for the completed Phase 7.5 follow-up |
| Phase 7.5 closeout | `docs/ai/nckh/NCKH_PHASE_7_5_CLOSEOUT.md`, `docs/vi/nckh/NCKH_PHASE_7_5_CLOSEOUT.md` | Completed with source/build/targeted Playwright validation and user-confirmed live Google validation |
| Phase 8 closeout | `docs/ai/nckh/NCKH_PHASE_8_CLOSEOUT.md`, `docs/vi/nckh/NCKH_PHASE_8_CLOSEOUT.md` | Completed with Release build, backend NCKH tests, full Playwright NCKH regression, authenticated live API smoke, and Chrome UI smoke using the linked Google account |
| Phase 9 closeout | `docs/ai/nckh/NCKH_PHASE_9_CLOSEOUT.md`, `docs/vi/nckh/NCKH_PHASE_9_CLOSEOUT.md` | Completed with frontend-only Option A visual canvas, targeted Playwright validation, and desktop/mobile browser smoke |

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

Implemented by Phase 3 evidence:

- model relations
- node/canvas positions
- deterministic hypothesis output

Implemented by Phase 4 evidence:

- backend endpoint `POST /api/v1/nckh/models/{modelId}/generate-form`
- Google Forms write-scope guard using stored OAuth scopes
- Google Forms API create and batch-update create-item integration methods
- generated-form tracking fields on `ResearchForms`
- re-import/upsert of generated or updated form structure after successful Google write
- conservative question generation from existing observed mappings and form questions

Implemented by Phase 5 evidence:

- backend endpoint `POST /api/v1/nckh/models/{modelId}/collect`
- backend endpoint `GET /api/v1/nckh/models/{modelId}/responses`
- backend endpoint `POST /api/v1/nckh/models/{modelId}/normalize`
- backend endpoint `GET /api/v1/nckh/models/{modelId}/dataset`
- Google Forms response-read scope guard using stored OAuth scopes
- raw survey response persistence and collection logs
- normalized datasets with stale-state exposure
- stale dataset marking when variables or mappings change

Implemented by Phase 6 evidence:

- backend endpoint `GET /api/v1/nckh/models/{modelId}/export?format=csv|codebook|spss`
- CSV export from normalized dataset rows
- Excel `.xlsx` codebook export with `Variables`, `Mappings`, and `Notes` sheets
- SPSS `.sps` import syntax export
- stale normalized dataset export conflict behavior
- no new database tables, columns, migrations, export jobs, or export history

Implemented by Phase 7 evidence:

- frontend workspace route `/dashboard/nckh/forms/{formId}`
- model workspace tabs for overview, variables, mapping, canvas, generate form, data, and export
- frontend UI over existing Phase 1-6 backend APIs
- table/list canvas management without adding a frontend dependency
- CSV, codebook, and SPSS export actions wired to the existing export endpoint

Not implemented by Phase 1/2/3/4/5/6/7 evidence:

- response collection from Google Sheets
- NCKH admin UI
- NCKH credit/pricing

## Validation State

Verified in the latest docs and validation pass:

- Repo files were scanned for NCKH docs, entities, controller/service/contracts, migration, frontend routes, and tests.
- dotnet build FormAutoHub.sln -c Release passed for the current NCKH Phase 3 backend slice.
- dotnet build FormAutoHub.sln -c Release passed for the current NCKH Phase 4 backend slice.
- dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build passed: 133 passed, 0 failed.
- EF Core database update applied `20260604165518_NckhPhase4_FormGenerationTracking` to temporary LocalDB database `FormAutoHubNckhPhase4Smoke2`.
- Authenticated HTTP smoke passed on `http://127.0.0.1:5103` with a real JWT for `POST /api/v1/nckh/models/{modelId}/generate-form` missing-write-scope behavior.
- NCKH Phase 4 smoke databases were dropped and the API process was stopped after validation.
- dotnet build FormAutoHub.sln -c Release passed for the current NCKH Phase 5 backend slice.
- dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build passed: 137 passed, 0 failed.
- EF Core database update applied `20260604211823_NckhPhase5_DataCollectionNormalization` to temporary LocalDB database `FormAutoHubNckhPhase5Smoke1`.
- Authenticated HTTP smoke passed on `http://localhost:5235` with a real JWT for Phase 5 collect, responses, normalize, and dataset endpoints.
- Runtime smoke verified missing `forms.responses.readonly` returns `403 Forbidden`; responses, normalize, and dataset returned `200 OK` against seeded DB-backed data.
- NCKH Phase 5 API smoke process was stopped after validation.
- dotnet build FormAutoHub.sln -c Release passed for the current NCKH Phase 6 backend slice.
- dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build passed: 142 passed, 0 failed.
- EF Core database update applied existing migrations through Phase 5 to temporary LocalDB database `FormAutoHubNckhPhase6Smoke2`; no Phase 6 migration was created.
- Authenticated HTTP smoke passed on `http://127.0.0.1:5237` with a real JWT for Phase 6 CSV, codebook, SPSS, and stale-conflict export behavior.
- Runtime smoke verified CSV export, codebook export, and SPSS export returned `200 OK` with expected content types, attachment filenames, and non-empty bodies; SPSS syntax included `GET DATA` and did not include `EXECUTE`.
- Runtime smoke verified stale normalized dataset export returns `409 Conflict`.
- NCKH Phase 6 smoke database was dropped, smoke files were removed, and the API process was stopped after validation.
- `npm run build` in `apps/web` passed for the NCKH Phase 7 frontend slice.
- `npx playwright test tests/nckh.spec.ts -g "Phase 7 Workspace" --workers=1 --reporter=line` passed: 3 passed.
- `npx playwright test tests/nckh.spec.ts --workers=1 --reporter=json` passed: 26 passed, 0 failed.
- Phase 7 browser smoke verified `/dashboard/nckh/forms/{formId}`, model tabs, variables tab, and export actions with mocked authenticated NCKH APIs.

- User-confirmed manual testing for the NCKH Phase 1 flow was recorded on 2026-06-01 for all 6 scoped checks: POST /api/v1/nckh/auth/google-link, POST /api/v1/nckh/forms/import, GET /api/v1/nckh/forms, GET /api/v1/nckh/forms/{formId}, /dashboard/nckh, and /dashboard/nckh/callback.

Not run in the latest docs and validation pass:

- Playwright smoke for NCKH Phase 4 frontend, because Phase 4 is backend-only and no frontend scope was implemented.
- live Google Forms create/update smoke with Forms body write scope, because no real Google OAuth credential/write-consented account is available in this environment.
- frontend build during the Phase 4 closeout pass, because no frontend file changed in the current Phase 4 scope.
- live Google Forms response collection smoke with Forms response-read scope, because no real Google OAuth credential, response-read consent, and submitted responses are available in this environment.
- frontend build during the Phase 5 closeout pass, because no frontend file changed in the current Phase 5 scope.
- frontend build and Playwright smoke during the Phase 6 closeout pass, because Phase 6 is backend-only and no frontend file changed.
- SPSS execution during the Phase 6 closeout pass, because Phase 6 only generates import syntax and automatic SPSS execution remains Deferred.
- production large-dataset performance/streaming validation during the Phase 6 closeout pass, because the MVP export implementation generates files in memory.
- live Google Forms write/read smoke during the Phase 7 closeout pass, because the Phase 7 frontend validation used mocked APIs and this environment does not provide real Google credentials, write/read consent, or submitted responses.
- real binary export download against a live normalized dataset during the Phase 7 closeout pass, because browser smoke used mocked API responses.

Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6, and Phase 7 now have closeout evidence plus validation evidence for their approved scopes. Keep future claims outside those scopes or beyond the recorded validation evidence explicit.

Latest Phase 7.5 live browser evidence:

- Verified with account `doba2311@gmail.com`: login, NCKH dashboard, imported `Untitled Form`, model creation, variable creation, observed mapping creation, canvas relation creation, default node position save, and model activation from `Draft` to `Active`.
- Blocked: `generate-form` returned `403` in the browser flow because Google Forms body write consent/scope was not available.
- Blocked: `collect` returned `403` with detail `Google Forms response read scope is required. Please re-consent with Forms responses permission.`
- Blocked: CSV/codebook/SPSS export returned `409` with detail `At least one normalized dataset row is required before export.` because collection was blocked and no live normalized dataset row existed.

Latest Phase 7.5 closeout evidence:

- Verified: current frontend OAuth request includes `forms.body.readonly`, `forms.body`, `forms.responses.readonly`, and `userinfo.email`.
- Verified: current frontend OAuth request uses `prompt=consent`.
- Verified: backend guards still require Forms body write scope for generation and Forms responses read scope for collection.
- Verified: `npm run build` in `apps/web` passed.
- Verified: `npx playwright test tests/nckh.spec.ts -g "Phase 7 Workspace" --workers=1 --reporter=line` passed: 3 passed.
- Verified: user confirmed on 2026-06-05 that live Google re-consent and live `generate -> collect -> normalize -> export` work through the app.
- Not run: full `npx playwright test tests/nckh.spec.ts --workers=1 --reporter=line` did not complete within the 120-second command timeout.
- Blocked: none reported for the approved Phase 7.5 scope after user-confirmed live validation.

Latest NCKH Phase 8 validation evidence:

- Fixed: the NCKH workspace no longer always sends `action: "Create"` for `POST /api/v1/nckh/models/{modelId}/generate-form`.
- Implemented: `NckhResearchModelResponse.hasGeneratedForm` exposes whether a generated form already exists for the model.
- UI behavior: when `hasGeneratedForm` is `false`, the generate panel sends `action: "Create"`; when `hasGeneratedForm` is `true`, it shows `Cập nhật form từ mô hình` and sends `action: "Update"`.
- UI copy: the Google write-permission warning was shortened to a Vietnamese user-facing message without exposing backend/scope/403 terminology.
- Verified: `dotnet build FormAutoHub.sln -c Release` passed.
- Verified: `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build --filter Nckh` passed: 51 passed.
- Verified: `npm run build` in `apps/web` passed.
- Verified: `npx playwright test tests/nckh.spec.ts --workers=1 --reporter=line` passed: 29 passed.
- Verified: local API and web servers were restarted for runtime smoke on `http://localhost:5235` and `http://localhost:3000`.
- Verified with linked account `doba2311@gmail.com`: profile had `googleLinked: true` and Google email `doba2311@gmail.com`.
- Verified live API smoke for model `6665dd7f-c1cc-42f8-ba84-13c85eb29974`: generate/update returned `200 OK` with `questionsCreated: 1` and `reimported: true`; collect returned `200 OK` with `responsesSkipped: 541`; normalize returned `200 OK` with `respondentsProcessed: 541`, `variablesComputed: 1`, and `missingDataCount: 1`; responses and dataset list endpoints returned `totalItems: 541`; CSV, codebook, and SPSS exports returned `200 OK` with expected non-empty content.
- Verified Chrome UI smoke through the user's Chrome profile after clearing conflicting extension/automation state: login, NCKH dashboard, linked Google status, imported form workspace, generated model, and tabs for variables, mapping, relations, form generation, and export rendered and were clickable.
- Not run: SPSS application execution of exported syntax.
- Not run: production large-dataset streaming/performance validation.

Latest NCKH Phase 9 closeout evidence:

- Implemented: visual canvas layer in the `Sơ đồ quan hệ` tab using existing variable, relation, and position API data.
- Implemented: relation edges, variable nodes, relation marker nodes, status/save zone, contextual relation actions, and fallback relation table.
- Decision: Option A; no React Flow or other canvas dependency was added.
- Verified: `npm run build` in `apps/web` passed.
- Verified: `npx playwright test tests/nckh.spec.ts -g "visual canvas" --workers=1 --reporter=json` passed: 1 passed.
- Verified: `npx playwright test tests/nckh.spec.ts -g "Phase 7 Workspace" --workers=1 --reporter=json` passed: 6 passed.
- Verified: desktop and mobile browser smoke rendered `SER -> SAT` with `pageErrors=0`; screenshots saved under `apps/web/test-results/phase9-canvas-smoke/`.
- Not run: backend build/test because Phase 9 did not change backend code.
- Not run: drag-and-drop node editing because Option A did not add a canvas editing dependency.

## Phase State Table

| NCKH phase | State | Next action |
|---|---|---|
| Phase 0 - Docs baseline | Completed baseline | Keep AI/VI synced |
| Phase 1 - OAuth + Forms API import | Completed | Keep Phase 1 boundaries intact |
| Phase 2 - Model + Variables + Mapping | Completed | See `NCKH_PHASE_2_CLOSEOUT.md`; keep Phase 2 boundaries intact |
| Phase 3 - Canvas Relations | Completed | See `NCKH_PHASE_3_CLOSEOUT.md`; keep backend-only boundaries intact |
| Phase 4 - Form Generation | Completed | See `NCKH_PHASE_4_CLOSEOUT.md`; live Google write smoke remains blocked until credentials/scope are available |
| Phase 5 - Data Collection + Normalization | Completed | See `NCKH_PHASE_5_CLOSEOUT.md`; live Google response-read smoke remains blocked until credentials/scope/submitted responses are available |
| Phase 6 - Export | Completed | See `NCKH_PHASE_6_CLOSEOUT.md`; no DB migration was added |
| Phase 7 - Frontend expansion | Completed | See `NCKH_PHASE_7_CLOSEOUT.md`; live Google/full-stack blockers moved to Phase 7.5 |
| Phase 7.5 - Google consent and live dataset fix/validation | Completed | See `NCKH_PHASE_7_5_CLOSEOUT.md`; live Google validation was user-confirmed on 2026-06-05 |
| Phase 8 - Full-stack smoke validation | Completed | See `NCKH_PHASE_8_CLOSEOUT.md`; validation-only scope completed with live API and Chrome UI smoke |
| Phase 9 - Canvas UX completion and workflow polish | Completed | See `NCKH_PHASE_9_CLOSEOUT.md`; frontend-only Option A completed without backend or dependency changes |

## Sync Rules

- When this file changes, update `docs/vi/nckh/NCKH_PROGRESS_LEDGER.md` in the same task.
- When phase state changes, update `NCKH_PHASE_ROADMAP.md` and `NCKH_PHASE_TRANSITION_GUIDE.md` in both language layers.
- Do not mark a phase completed without source/test/runtime evidence.
- Use `Implemented with repo evidence` when code exists but current runtime validation was not re-run.
- Use `Completed` only when the phase has closeout evidence and required validation has been run.

## Deferred

- Any API contracts, database fields, lifecycle states, or Google scopes outside the accepted Phase 6 packet and completed Phase 6 implementation until reviewed and approved.
- Production-readiness claims until current validation is run.
