# NCKH_PHASE_7_KICKOFF_PLAN

## Purpose

Define the approval-gated kickoff plan for NCKH Phase 7 so frontend expansion can proceed over the completed Phase 1-6 backend contracts without widening into new API, database, Google integration, statistics, credit, or admin scope.

## Approved Task

User approval recorded: open the next NCKH task after Phase 6 closeout.

Approved task in this pass: Phase 7 kickoff, UI/contract freeze, and worker-ready implementation packet.

Implementation remains a separate step after this planning/freeze pass is accepted.

## Current Baseline

- NCKH Phase 1 through Phase 6 are completed for their approved scopes.
- Phase 7 is the next frontend expansion candidate.
- Existing frontend shell: `/dashboard/nckh` and `/dashboard/nckh/callback`.
- Existing frontend stack: Next.js dashboard, shadcn/ui-style components, Tailwind CSS, lucide-react.
- Existing shared components must be reused before creating page-local UI primitives.
- Backend contracts for form import, models, variables, mappings, canvas, form generation, data collection, normalization, dataset listing, and export are already implemented.

## Phase Goal

Make the NCKH module usable from the dashboard for the completed backend workflow:

1. import/list forms,
2. open a form/model workspace,
3. manage research models,
4. manage variables and observed mappings,
5. view/edit the canvas relation surface,
6. generate/update a Google Form through the approved backend endpoint,
7. collect and normalize responses,
8. inspect normalized dataset rows,
9. export CSV, codebook, and SPSS syntax files.

## In Scope

- Extend `/dashboard/nckh` from the Phase 1 shell into a frontend workspace.
- Add model-oriented navigation under the NCKH dashboard using documented backend APIs only.
- Add UI for existing Phase 2 model, variable, and observed mapping APIs.
- Add UI for existing Phase 3 canvas relation and node-position APIs.
- Add UI for existing Phase 4 generate-form endpoint.
- Add UI for existing Phase 5 collect, responses, normalize, and dataset endpoints.
- Add UI for existing Phase 6 export endpoint.
- Use Vietnamese-first dashboard copy.
- Define loading, empty, error, permission, blocked, and success states for each major panel.
- Add focused frontend tests or Playwright smoke for the main dashboard flow when implementation changes frontend files.

## Out Of Scope

- New backend endpoints.
- New DTO fields or status values.
- New database tables, columns, migrations, or lifecycle states.
- Google Sheets response collection.
- Google Forms watches, Pub/Sub, scheduled jobs, or background workers.
- Statistical analysis, charts, generated reports, or SPSS execution.
- NCKH admin UI.
- NCKH credit/pricing.
- Multi-researcher collaboration.
- Production live Google validation claims without real credentials and consent.

## Proposed Frontend Surfaces

### NCKH Home

- Google link status.
- Import Google Form.
- Imported form list.
- Entry points to form/model workspace.

### Form Workspace

- Form summary and question list.
- Research model list for the imported form.
- Create model action.
- Active model indicator.

### Model Workspace

Tabs or equivalent dashboard sections:

- Overview
- Variables
- Mapping
- Canvas
- Generate form
- Data
- Export

## Delivery Passes

### Pass 0 - UI/Contract Freeze

Output:

- `NCKH_PHASE_7_CONTRACT_UI_FREEZE.md`
- `NCKH_PHASE_7_SINGLE_APPROVAL_PACKET.md`

Rules:

- Confirm Phase 7 consumes existing APIs only.
- Confirm no DB migration is needed.
- Confirm shared frontend components and shell rules.

### Pass 1 - Route And Data Client Foundation

Output:

- frontend routes for form/model workspace
- typed API client additions only for existing NCKH contracts
- shared page state helpers if needed

Validation:

- frontend build
- focused type/lint checks available in the repo

### Pass 2 - Models, Variables, And Mapping UI

Output:

- model list/create/activate/delete flow if supported by existing API
- variable CRUD UI
- observed mapping UI
- stale-data messaging where existing API state exposes it

Validation:

- browser smoke for model/variable/mapping workflow

### Pass 3 - Canvas UI

Output:

- relation CRUD UI
- node-position save/load UI
- deterministic hypothesis display

Validation:

- browser smoke for create relation and reload saved positions

### Pass 4 - Generate, Data, And Export UI

Output:

- generate form action using the existing Phase 4 endpoint
- collect/responses/normalize/dataset UI using existing Phase 5 endpoints
- CSV/codebook/SPSS export actions using existing Phase 6 endpoint

Validation:

- browser smoke for blocked Google scope states and seeded/local backend states
- file-download behavior check where practical

### Pass 5 - Closeout

Output:

- Phase 7 closeout docs in `docs/ai/nckh` and `docs/vi/nckh`
- progress ledger, roadmap, transition guide, and routing matrix sync

Validation:

- build/test results
- browser smoke results
- clear `Blocked` labels for any live Google checks that cannot run

## Stop Conditions

Stop and ask for approval if implementation requires:

- a new API endpoint, field, status, lifecycle state, table, or migration
- new Google scopes beyond completed Phase 5 response-read handling
- Google Sheets, Drive-wide scopes, watches, Pub/Sub, or scheduled sync
- statistical analysis, charting, generated reports, or SPSS execution
- NCKH admin, credit, pricing, or collaboration behavior
- replacing the existing dashboard shell or shared UI component baseline

## Validation Expectations

Minimum implementation validation for Phase 7:

- frontend build for `apps/web`
- relevant unit/component tests if the repo has them for the touched surface
- Playwright/browser smoke for the NCKH dashboard route and primary workspace flow
- API-backed smoke against an authenticated local session when frontend behavior depends on backend data
- server/browser logs inspected after smoke

Use labels:

- Verified
- Not run
- Blocked

## Reviewer Focus

Review Phase 7 for:

- frontend-only scope discipline
- no invented API/DTO/database contracts
- reuse of shared dashboard components
- Vietnamese-first copy
- correct loading/empty/error/permission states
- no weakening of Google scope guards or ownership checks
- honest validation labels

