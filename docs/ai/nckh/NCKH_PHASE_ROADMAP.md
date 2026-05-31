# NCKH_PHASE_ROADMAP

## Purpose

Define delivery phases for the NCKH Survey Platform, a module inside the FormAuto Hub ecosystem but tracked independently from the FormAuto Hub global phases.

## Current Phase

Current NCKH phase state: **Phase 1 implemented with repo evidence; Phase 2 is the next candidate and is not approved for implementation yet**.

No NCKH implementation phase is active by default. Every new NCKH phase or fix follow-up requires explicit approval before implementation.

Progress source of truth:

- Read `NCKH_PROGRESS_LEDGER.md` first for implemented evidence and validation state.
- Read `NCKH_PHASE_TRANSITION_GUIDE.md` before opening the next NCKH phase.

## Phase Dependency Map

```text
Phase 0 (Docs)
  |
  v
Phase 1 (OAuth + Forms API import - implemented with repo evidence)
  |
  v
Phase 2 (Model + Variables + Mapping - next candidate, needs approval)
  |
  +--> Phase 3 (Canvas Relations - proposed)
  +--> Phase 4 (Form Generation - proposed)
  |       |
  |       v
  |    [generated/owned form available for response testing]
  |       |
  |       v
  +--> Phase 5 (Data Collection + Normalization - proposed)
          |
          v
       Phase 6 (Export - proposed)
          |
          v
       Phase 7 (Frontend expansion - proposed)
          |
          v
       Phase 8 (Full-stack smoke validation - proposed)
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

Status: Implemented with repo evidence. Runtime/live validation should be re-run before treating it as production-ready.

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

- Unit/integration and browser smoke evidence exists in repo files, but current runtime validation has not been re-run in this doc sync task.

## Phase 2 - Model & Variable Management

Status: Next candidate. Needs explicit approval before implementation.

Proposed scope:

- Entities: `ResearchModel`, `ResearchVariable`, `ObservedQuestionMapping`
- Services for model, variable, and mapping workflows
- Controllers for model, variable, and mapping CRUD
- Constraint: one active MVP model per imported form unless explicitly changed
- Cascade/delete behavior must be reviewed before migration
- Warning behavior when editing variables after data exists remains proposed until Phase 5 data behavior is approved

Scope boundaries:

- No credit deduction.
- No canvas relation implementation.
- No form generation.
- No response collection or normalization.
- No export.

## Phase 3 - Canvas Relations & Hypothesis

Status: Proposed. Needs explicit approval.

Proposed scope:

- Entities: `ModelRelation`, `NodePosition`
- Relation CRUD
- Save/load node positions
- Auto-generate hypothesis codes and text from variables

Scope boundaries:

- No AI-generated hypothesis text.
- No statistical analysis.

## Phase 4 - Form Generation & Update

Status: Proposed. Needs explicit approval.

Proposed scope:

- Google Forms API create/update support
- Generate Google Form questions from approved model/variable mappings
- Re-import form structure after generation/update

Scope boundaries:

- Must verify the researcher owns or is authorized to update the target form.
- Must not delete a Google Form not created or owned through the approved flow.

## Phase 5 - Data Collection & Normalization

Status: Proposed. Needs explicit approval.

Proposed scope:

- Google Sheets API manual response pull
- Deduplication and collection logging
- Normalize raw responses into observed codes
- Compute simple Likert means
- Missing data stored as null

Scope boundaries:

- No auto-submit to Google Forms.
- No real-time sync.
- No scheduled pull.

## Phase 6 - Export

Status: Proposed. Needs explicit approval.

Proposed scope:

- Export dataset CSV
- Export Excel codebook
- Export SPSS syntax

Scope boundaries:

- No charting.
- No statistical analysis report.
- No automatic SPSS execution.

## Phase 7 - Frontend Expansion

Status: Proposed. Needs explicit approval.

Proposed scope:

- Extend `/dashboard/nckh` beyond Phase 1 form import/listing
- Model detail pages and tabs for form, variables, canvas, data, and export
- React Flow canvas if Phase 3 is approved

Scope boundaries:

- Reuse FormAuto Hub Next.js, shadcn/ui, and Tailwind baseline.
- No separate NCKH admin UI unless approved.

## Phase 8 - Full-stack Smoke Validation

Status: Proposed. Needs explicit approval after implementation phases.

Proposed scope:

- Browser smoke with Playwright
- Authenticated HTTP smoke
- Database-backed checks
- Google OAuth / Forms / Sheets checks as applicable to approved phases
- Export file verification if Phase 6 is implemented

Report labels:

- Verified
- Not run
- Blocked

## Go/No-Go Gates

| Gate | Condition | Timing |
|---|---|---|
| Phase approval | User explicitly approves the target NCKH phase or fix follow-up | Before implementation |
| Contract guard | API DTOs, statuses, lifecycle, and routes are checked | Before contract-sensitive implementation |
| DB risk review | Entity relationships, delete behavior, indexes, and migrations are reviewed | Before migration work |
| Runtime validation | Build/test plus applicable HTTP/browser/database smoke | Before closeout |
| Docs sync | `docs/ai/nckh` and `docs/vi/nckh` updated together | Every doc-changing task |

## Deferred

- NCKH Phase 2+ implementation until approved
- Google Sheets API response pull until Phase 5 approval
- Google Forms create/update until Phase 4 approval
- Google Forms watches / Cloud Pub/Sub
- scheduled data collection
- statistical analysis inside the app
- multi-researcher collaboration
- NCKH credit/pricing model
- NCKH admin UI
