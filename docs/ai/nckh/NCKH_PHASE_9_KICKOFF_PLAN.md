# NCKH_PHASE_9_KICKOFF_PLAN

## Purpose

Define the historical NCKH Phase 9 scope baseline for canvas UX completion and workflow polish after the Phase 7 table/list canvas baseline.

## Approval Status

Status: **Completed later for frontend-only Option A**. See `NCKH_PHASE_9_CLOSEOUT.md`.

This document records the kickoff baseline. Current completion evidence is tracked in `NCKH_PHASE_9_CLOSEOUT.md`.

This phase belongs to the independent NCKH module track. It does not reopen FormAuto Hub global Phase 9, which is already closed.

## Phase Goal

Complete the NCKH model canvas experience so researchers can visually inspect variables, relations, saved node positions, and generated hypothesis flow through a dashboard-native UI.

Phase 7 intentionally used a compact table/list canvas UI and did not add React Flow or another canvas dependency. Phase 9 later used Option A to finish that canvas experience without adding a canvas dependency.

## Dependency Decision

Phase 9 must choose one implementation path before code changes:

- Option A: keep the table/list canvas UI and polish it with shared components only.
- Option B: approve one frontend-only canvas dependency, such as React Flow, for visual node/edge editing.

Assumption: adding a frontend canvas dependency requires explicit implementation approval for Phase 9. This planning approval alone does not add or approve a package change.

## Proposed Scope

Phase 9 may include, after separate implementation approval:

- visual canvas for research variables and model relations
- node position display and save/load over the existing Phase 3 API
- relation create/delete/list over the existing Phase 3 API
- hypothesis display over existing backend behavior
- the three saved action-button placement zones from the Phase 7 UI note:
  - primary canvas toolbar actions
  - selected node/relation contextual actions
  - save/status actions for persisted positions
- Vietnamese-first copy for visible UI, validation, blocked states, success states, and errors
- shared/base components for alerts, buttons, dropdowns, badges, tables, empty states, and page headers
- responsive desktop/mobile behavior
- fallback table/list behavior when the visual canvas is unavailable, empty, or blocked

## Scope Boundaries

Do not add in Phase 9 unless a separate contract task is approved:

- backend endpoints
- DTO fields
- database fields
- entities or EF Core migrations
- statuses or lifecycle states
- Google OAuth scopes
- Google Sheets collection
- Google Forms watches, Pub/Sub, scheduled jobs, or background workers
- statistical analysis, charting, generated research reports, or SPSS execution
- NCKH admin UI
- NCKH credit/pricing
- multi-researcher collaboration

Phase 9 must not change the Phase 7.5 Google consent path. Missing Google consent remains a blocked external/integration state, not a canvas UX concern.

## Required Passes

### Pass 0 - Contract And UI Inventory

Inspect the existing canvas API and frontend workspace before implementation.

Files likely involved:

- `src/FormAutoHub.Api/Controllers/Nckh/ResearchCanvasController.cs`
- `src/FormAutoHub.Api/Services/Nckh/ResearchCanvasService.cs`
- `apps/web/lib/api.ts`
- `apps/web/app/dashboard/nckh/forms/[formId]/page.tsx`
- `apps/web/components/**`

Acceptance:

- list current canvas endpoints and frontend wrappers
- confirm whether current contracts are sufficient for visual canvas behavior
- identify the final dependency option before code changes
- report any contract gap instead of inventing a new backend contract

### Pass 1 - Canvas Design And Dependency Decision

Define the exact UI behavior for the chosen path.

Acceptance:

- choose Option A or Option B explicitly
- define the three action-button placement zones in the workspace
- define empty/loading/error/blocked/saved states in Vietnamese
- confirm the shared components to reuse

### Pass 2 - Canvas Implementation

Implement the approved frontend-only canvas UI.

Acceptance:

- variables render as nodes or list items depending on the approved option
- relations render as edges or relation rows depending on the approved option
- node positions can be saved and reloaded through existing APIs
- relation actions continue using existing backend contracts
- fallback list/table behavior remains usable

### Pass 3 - State, Copy, And Shared Component Cleanup

Harden UX and remove page-local patterns that duplicate shared components.

Acceptance:

- visible UI copy is Vietnamese except technical terms
- alerts, dropdowns, buttons, badges, tables, and empty states use shared/base components where available
- no custom table/dropdown/status primitive is introduced when a shared component exists
- mobile layout remains coherent

### Pass 4 - Validation

Run frontend validation appropriate to the implementation.

Minimum validation if frontend code changes:

- `npm run build` in `apps/web`
- targeted Playwright smoke for the NCKH workspace canvas path
- browser or screenshot verification that the canvas is not blank on desktop and mobile
- console/network inspection for fatal frontend errors

Additional validation if a canvas dependency is added:

- verify package install/build state
- verify canvas container sizing and hydration
- verify drag/save/reload behavior does not shift layout unexpectedly

### Pass 5 - Closeout

Prepare closeout docs only after implementation and validation.

Acceptance:

- update both `docs/ai/nckh` and `docs/vi/nckh`
- report `Verified`, `Not run`, and `Blocked`
- preserve all Deferred items
- do not claim backend, database, Google, statistics, admin, or credit readiness from canvas UX work

## Acceptance Criteria

- The canvas area clearly represents variables and relations using the approved UI path.
- Node positions can be saved and reloaded through existing Phase 3 APIs.
- Relation actions use existing Phase 3 APIs.
- The three saved action-button placement zones are reflected in the UI design.
- Fallback table/list behavior remains available and understandable.
- All visible NCKH Phase 9 UI copy is Vietnamese except accepted technical terms.
- Shared/base components are reused before page-local UI primitives.
- Build and targeted browser validation pass before closeout.

## Stop Conditions

Stop and report before widening scope when:

- the desired visual canvas behavior requires new backend fields or endpoints
- the canvas dependency causes a build/hydration/runtime blocker
- existing node-position or relation contracts are insufficient for the requested UX
- mobile layout cannot remain coherent without a larger redesign
- implementation would touch Google consent, data collection, export, statistics, admin, or credit behavior

## Deferred

- Backend API changes.
- Database changes.
- New Google scopes.
- Google Sheets or background sync.
- Statistical reports or charting.
- SPSS execution.
- Collaboration features.
- NCKH admin UI.
- NCKH credit/pricing.
