# NCKH_PROGRESS_LEDGER

## Purpose

Record the evidence-backed progress state for the NCKH Survey Platform so future work starts from repo truth instead of stale roadmap wording.

This file is the first NCKH-specific status document to read after `README.md`, `AGENTS.md`, and `docs/ai/AI_DOC_ROUTING_MATRIX.md`.

## Current Status

Global FormAuto Hub state: Phase 9 closeout completed; no next global phase selected.

NCKH state: Phase 1 has implementation evidence in the repo. Phase 2 is the next candidate and is not approved by default.

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
| Phase 2+ backend | Research model, variables, mappings, relations, data, export code | Not found in current evidence pass |

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

Not implemented by Phase 1 evidence:

- research model CRUD
- variable CRUD
- observed question mapping CRUD
- model relations
- node/canvas positions
- Google Form create/update
- response collection from Google Sheets
- normalization datasets
- CSV/Excel/SPSS export
- NCKH admin UI
- NCKH credit/pricing

## Validation State

Verified in this doc sync task:

- Repo files were scanned for NCKH docs, entities, controller/service/contracts, migration, frontend routes, and tests.

Not run in this doc sync task:

- `dotnet build`
- `dotnet test`
- `npm run build`
- Playwright smoke
- live Google OAuth flow
- live Google Forms API import
- migration apply against a current database

Do not claim current runtime readiness from this ledger alone. Re-run applicable validation before closeout of any implementation task.

## Phase State Table

| NCKH phase | State | Next action |
|---|---|---|
| Phase 0 - Docs baseline | Completed baseline | Keep AI/VI synced |
| Phase 1 - OAuth + Forms API import | Implemented with repo evidence | Re-run validation before production/runtime claims |
| Phase 2 - Model + Variables + Mapping | Next candidate, not active | Requires approval, contract guard, DB risk review |
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

- NCKH Phase 2+ implementation until explicitly approved.
- Any new API contracts, database fields, lifecycle states, or Google scopes outside Phase 1 until reviewed and approved.
- Production-readiness claims until current validation is run.
