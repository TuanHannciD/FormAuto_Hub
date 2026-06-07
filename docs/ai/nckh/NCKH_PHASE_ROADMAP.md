# NCKH_PHASE_ROADMAP

## Purpose

Define delivery phases for the NCKH Survey Platform, a module inside the FormAuto Hub ecosystem but tracked independently from the FormAuto Hub global phases.

## Current Phase

Current NCKH phase state: **Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6, Phase 7, Phase 7.5, Phase 8, and Phase 9 completed for their approved scopes; Phase 8 was validation-only; Phase 9 was frontend-only Option A and did not add backend contracts or canvas dependencies**.

Active NCKH follow-up: **none**. Every new NCKH phase or additional fix follow-up still requires explicit approval before implementation.

Progress source of truth:

- Read `NCKH_PROGRESS_LEDGER.md` first for implemented evidence and validation state.
- Read `NCKH_PHASE_1_CLOSEOUT.md` for the explicit Phase 1 closeout evidence snapshot.
- Read `NCKH_PHASE_2_CLOSEOUT.md` for the explicit Phase 2 closeout evidence snapshot.
- Read `NCKH_PHASE_3_KICKOFF_PLAN.md` only as historical Phase 3 planning context.
- Read `NCKH_PHASE_3_CONTRACT_DB_FREEZE.md` for the Phase 3 Pass 0 contract and DB review result.
- Read `NCKH_PHASE_3_CLOSEOUT.md` for the explicit Phase 3 closeout evidence snapshot.
- Read `NCKH_PHASE_4_CLOSEOUT.md` for the explicit Phase 4 closeout evidence snapshot.
- Read `NCKH_PHASE_5_CLOSEOUT.md` for the explicit Phase 5 closeout evidence snapshot.
- Read `NCKH_PHASE_6_CLOSEOUT.md` for the explicit Phase 6 closeout evidence snapshot.
- Read `NCKH_PHASE_6_KICKOFF_PLAN.md`, `NCKH_PHASE_6_CONTRACT_DB_FREEZE.md`, and `NCKH_PHASE_6_SINGLE_APPROVAL_PACKET.md` only as historical Phase 6 approval baseline context.
- Read `NCKH_PHASE_7_KICKOFF_PLAN.md`, `NCKH_PHASE_7_CONTRACT_UI_FREEZE.md`, and `NCKH_PHASE_7_SINGLE_APPROVAL_PACKET.md` before implementing Phase 7 frontend work.
- Read `NCKH_PHASE_7_CLOSEOUT.md` for the explicit Phase 7 closeout evidence snapshot.
- Read `NCKH_PHASE_7_5_KICKOFF_PLAN.md` before working on the approved Phase 7.5 Google consent and live dataset fix/validation follow-up.
- Read `NCKH_PHASE_7_5_CLOSEOUT.md` for the completed closeout evidence and user-confirmed live Google validation record.
- Read `NCKH_PHASE_8_CLOSEOUT.md` for the completed full-stack smoke validation evidence snapshot.
- Read `NCKH_PHASE_9_KICKOFF_PLAN.md` as the historical planning baseline for the completed frontend-only Option A canvas UX work.
- Read `NCKH_PHASE_9_CLOSEOUT.md` for the completed Phase 9 closeout evidence snapshot.
- Read `NCKH_PHASE_TRANSITION_GUIDE.md` before opening the next NCKH phase.

## Phase Dependency Map

```text
Phase 0 (Docs)
  |
  v
Phase 1 (OAuth + Forms API import - completed)
  |
  v
Phase 2 (Model + Variables + Mapping - completed)
  |
  +--> Phase 3 (Canvas Relations - completed)
  +--> Phase 4 (Form Generation - completed)
  |       |
  |       v
  |    [generated/owned form available for response testing]
  |       |
  |       v
  +--> Phase 5 (Data Collection + Normalization - completed)
          |
          v
       Phase 6 (Export - completed)
          |
          v
       Phase 7 (Frontend expansion - completed)
          |
          v
       Phase 7.5 (Google consent + live dataset fix/validation - completed)
          |
          v
       Phase 8 (Full-stack smoke validation - completed)
          |
          v
       Phase 9 (Canvas UX completion - completed)
```

## Phase 0 - Docs & Scope Baseline

Status: Completed baseline, subject to future sync as scope changes.

Includes:

- requirement package
- entity model and domain overview
- module map and architecture boundaries
- phase roadmap
- proposed API contract guide
- progress ledger and transition guide

Exit criteria:

- required docs exist in `docs/ai/nckh` and `docs/vi/nckh`
- docs are semantically synced
- Deferred items are labeled
- implementation state is supported by repo evidence, not roadmap claims alone

## Phase 1 - Backend Foundation + Google OAuth Link + Forms API Import

Status: Completed for the approved Phase 1 scope. See `NCKH_PHASE_1_CLOSEOUT.md` for the closeout evidence snapshot and current validation record.

Implemented evidence:

- Entities: `ResearchForm`, `ResearchFormQuestion`
- Migration: `NckhPhase1_FormsAndOAuth`
- DbContext set: `ResearchForms`
- Controller: `ResearchFormsController`
- Service: `ResearchFormService`
- Contracts: `NckhGoogleLink*`, `NckhImportForm*`, `NckhForm*`
- Frontend routes: `/dashboard/nckh`, `/dashboard/nckh/callback`
- Tests: `NckhPhase1OAuthAndFormsTests`, `apps/web/tests/nckh.spec.ts`

Implemented scope:

- Google OAuth link endpoint for NCKH Forms read permission
- Google token exchange/storage through existing Google auth integration
- Google Forms API read/import path for form structure
- Persist imported forms and questions
- User-scoped form list/detail APIs
- Frontend NCKH dashboard and callback shell

Scope boundaries:

- Does not create or update Google Forms.
- Does not read Google Sheets responses.
- Does not create research models, variables, mappings, relations, datasets, or exports.
- Does not approve credit/pricing for NCKH.

Validation state:

- Current closeout evidence includes repo evidence, current build/test/web build validation, and user-confirmed manual testing for the approved Phase 1 API/browser scope.

## Phase 2 - Model & Variable Management

Status: Completed for the approved backend-only Phase 2 scope. See `NCKH_PHASE_2_CLOSEOUT.md` for closeout evidence and validation record.

Implemented scope:

- Entities: `ResearchModel`, `ResearchVariable`, `ObservedQuestionMapping`
- Services for model, variable, and mapping workflows
- Controllers for model, variable, and mapping CRUD
- Multiple models per imported form are allowed
- Constraint: at most one `Active` model per imported form
- Explicit `Draft -> Active` activation
- Backend-only delivery
- Mapping uses separate endpoint(s), not nested variable payloads
- Delete behavior stays inside the owned Phase 2 cascade path: `ResearchModel -> ResearchVariable -> ObservedQuestionMapping`
- `ObservedQuestionMapping -> ResearchFormQuestion` uses restrict delete behavior

Scope boundaries:

- No credit deduction.
- No canvas relation implementation.
- No form generation.
- No response collection or normalization.
- No export.
- No frontend implementation inside Phase 2.
- `Archived` lifecycle remains out of Phase 2 scope.
- Warning behavior when editing variables after data exists remains deferred until Phase 5 data behavior is approved.

## Phase 3 - Canvas Relations & Hypothesis

Status: Completed for the approved backend-only Phase 3 scope. See `NCKH_PHASE_3_CLOSEOUT.md` for closeout evidence and validation record.

Proposed scope:

- Entities: `ModelRelation`, `NodePosition`
- Relation CRUD
- Save/load node positions
- Auto-generate hypothesis codes and text from variables

Planning document:

- `NCKH_PHASE_3_KICKOFF_PLAN.md`
- `NCKH_PHASE_3_CONTRACT_DB_FREEZE.md`
- `NCKH_PHASE_3_SINGLE_APPROVAL_PACKET.md`

Scope boundaries:

- No AI-generated hypothesis text.
- No statistical analysis.

## Phase 4 - Form Generation & Update

Status: Completed for the approved backend-only Phase 4 scope. See `NCKH_PHASE_4_CLOSEOUT.md` for closeout evidence and validation record.

Planning documents:

- `NCKH_PHASE_4_KICKOFF_PLAN.md`
- `NCKH_PHASE_4_CONTRACT_DB_FREEZE.md`
- `NCKH_PHASE_4_SINGLE_APPROVAL_PACKET.md`
- `NCKH_PHASE_4_CLOSEOUT.md`

Proposed scope:

- Google Forms API create/update support
- Generate Google Form questions from approved model/variable mappings
- Re-import form structure after generation/update

Scope boundaries:

- Must verify the researcher owns or is authorized to update the target form.
- Must not delete a Google Form not created or owned through the approved flow.
- Live Google Forms write smoke remains blocked until real credentials and Forms body write consent are available.

## Phase 5 - Data Collection & Normalization

Status: Completed for the approved backend-only Phase 5 scope. See `NCKH_PHASE_5_CLOSEOUT.md` for closeout evidence and validation record.

Planning documents:

- `NCKH_PHASE_5_KICKOFF_PLAN.md`
- `NCKH_PHASE_5_CONTRACT_DB_FREEZE.md`
- `NCKH_PHASE_5_SINGLE_APPROVAL_PACKET.md`
- `NCKH_PHASE_5_CLOSEOUT.md`

Implemented scope:

- Google Forms responses API manual response pull
- Deduplication and collection logging
- Normalize raw responses into observed codes
- Compute simple Likert means
- Missing data stored as null
- Stale normalized dataset marking when variables or mappings change

Scope boundaries:

- No auto-submit to Google Forms.
- No real-time sync.
- No scheduled pull.
- No export in Phase 5.
- Google Sheets collection remains an alternate path only if explicitly approved later.
- Live Google Forms response-read smoke remains blocked until real credentials, response-read consent, and submitted responses are available.

## Phase 6 - Export

Status: Completed for the approved backend-only Phase 6 scope. See `NCKH_PHASE_6_CLOSEOUT.md` for closeout evidence and validation record.

Planning documents:

- `NCKH_PHASE_6_KICKOFF_PLAN.md`
- `NCKH_PHASE_6_CONTRACT_DB_FREEZE.md`
- `NCKH_PHASE_6_SINGLE_APPROVAL_PACKET.md`
- `NCKH_PHASE_6_CLOSEOUT.md`

Implemented scope:

- Export dataset CSV
- Export Excel codebook
- Export SPSS syntax
- No database migration, table, column, export job, or export history was added

Scope boundaries:

- No charting.
- No statistical analysis report.
- No automatic SPSS execution.
- No frontend expansion in Phase 6.
- No new database tables or columns in Phase 6.

## Phase 7 - Frontend Expansion

Status: Completed for the approved frontend-only Phase 7 scope. See `NCKH_PHASE_7_CLOSEOUT.md` for closeout evidence and validation record.

Planning documents:

- `NCKH_PHASE_7_KICKOFF_PLAN.md`
- `NCKH_PHASE_7_CONTRACT_UI_FREEZE.md`
- `NCKH_PHASE_7_SINGLE_APPROVAL_PACKET.md`
- `NCKH_PHASE_7_CLOSEOUT.md`

Implemented scope:

- Extend `/dashboard/nckh` beyond Phase 1 form import/listing
- form/model workspace pages and tabs for overview, variables, mapping, canvas, generate form, data, and export
- frontend UI over existing Phase 1-6 backend APIs only
- table/list canvas management UI without adding React Flow or another frontend dependency

Scope boundaries:

- Reuse FormAuto Hub Next.js, shadcn/ui, and Tailwind baseline.
- No separate NCKH admin UI unless approved.
- No new API endpoints, DTO fields, database migrations, Google scopes, Google Sheets collection, scheduled jobs, statistical analysis, charts, credit/pricing, or collaboration behavior.
- Live Google write/read and real dataset file-download checks remain for a later approved validation phase.

## Phase 7.5 - Google Consent And Live Dataset Fix/Validation

Status: Completed for the approved fix/live-validation follow-up. See `NCKH_PHASE_7_5_KICKOFF_PLAN.md` and `NCKH_PHASE_7_5_CLOSEOUT.md`.

Triggering evidence:

- live browser testing with `doba2311@gmail.com` verified model, variable, mapping, relation, node-position, and activation flows
- live `generate-form` was blocked by missing Google Forms body write consent/scope
- live `collect` was blocked by missing `https://www.googleapis.com/auth/forms.responses.readonly`
- live export was blocked by missing normalized dataset rows after collection was blocked

Approved scope:

- inspect and minimally fix the NCKH Google OAuth scope request if it does not include the already-approved scopes needed by Phase 4 and Phase 5
- re-consent the target Google account through the browser flow
- retest live generate, collect, normalize, and export
- keep results honest with `Verified`, `Not run`, and `Blocked`

Scope boundaries:

- no new API endpoints, DTO fields, database fields, statuses, lifecycle states, or migrations unless a separate approved defect proves they are required
- no Google Sheets response collection
- no watches, Pub/Sub, scheduled jobs, statistical analysis, NCKH admin UI, or NCKH credit/pricing
- no fake responses or seeded rows as evidence for live Google/export closeout

Closeout state:

- OAuth scope string/code alignment is verified by source inspection.
- `apps/web` build and targeted Phase 7 Workspace Playwright regression passed.
- User confirmed on 2026-06-05 that live Google re-consent and live `generate -> collect -> normalize -> export` validation work.

## Phase 8 - Full-stack Smoke Validation

Status: Completed for the approved validation-only scope. See `NCKH_PHASE_8_CLOSEOUT.md`.

Current readiness note:

- The previously observed UI blocker where the generate action always sent `action: "Create"` has been fixed in code.
- Model responses now expose `hasGeneratedForm`; the UI sends `action: "Create"` for first generation and `action: "Update"` when a generated form already exists.
- Phase 8 live browser/full-stack retest has been completed and recorded in closeout evidence.

Validated scope:

- Browser smoke with Playwright and Chrome UI automation
- Authenticated HTTP smoke
- Database-backed checks
- Google OAuth / Forms checks as applicable to approved phases
- Export file verification using the completed Phase 6 backend endpoint

Report labels:

- Verified
- Not run
- Blocked

## Phase 9 - Canvas UX Completion And Workflow Polish

Status: Completed for the approved frontend-only Option A scope. See `NCKH_PHASE_9_CLOSEOUT.md`.

This phase is part of the independent NCKH module track and does not reopen FormAuto Hub global Phase 9.

Implemented scope:

- visual canvas layer after the Phase 7 table/list baseline
- Option A: keep the dashboard-native table/list baseline and do not add React Flow or another canvas dependency
- visually represent variables, relations, saved node positions, and generated hypothesis flow using existing API data
- preserve the three saved action-button placement zones from the Phase 7 UI note: toolbar, contextual actions, and save/status
- reuse shared/base UI components before page-local primitives
- keep all visible copy Vietnamese-first except accepted technical terms
- preserve fallback table/list behavior

Scope boundaries:

- no backend endpoints, DTO fields, database fields, entities, migrations, statuses, or lifecycle states
- no Google OAuth scope changes or Google consent behavior changes
- no Google Sheets collection, watches, scheduled jobs, statistical reports, NCKH admin UI, or NCKH credit/pricing
- adding a frontend canvas dependency remains out of the completed Phase 9 Option A scope

## Go/No-Go Gates

| Gate | Condition | Timing |
|---|---|---|
| Phase approval | User explicitly approves the target NCKH phase or fix follow-up | Before implementation |
| Contract guard | API DTOs, statuses, lifecycle, and routes are checked | Before contract-sensitive implementation |
| DB risk review | Entity relationships, delete behavior, indexes, and migrations are reviewed | Before migration work |
| Runtime validation | Build/test plus applicable HTTP/browser/database smoke | Before closeout |
| Docs sync | `docs/ai/nckh` and `docs/vi/nckh` updated together | Every doc-changing task |

## Deferred

- React Flow or another canvas editing dependency unless explicitly approved later
- Google Sheets API response pull unless explicitly selected for Phase 5 implementation
- Google Forms watches / Cloud Pub/Sub
- scheduled data collection
- statistical analysis inside the app
- multi-researcher collaboration
- NCKH credit/pricing model
- NCKH admin UI
