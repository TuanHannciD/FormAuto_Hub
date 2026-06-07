# NCKH_PHASE_7_CONTRACT_UI_FREEZE

## Purpose

Freeze the allowed frontend/API contract boundary for NCKH Phase 7 before implementation.

## Freeze Result

Phase 7 is allowed to implement frontend screens over existing NCKH Phase 1-6 APIs only.

No new backend contract, DTO field, database field, entity, status, lifecycle state, Google scope, or migration is approved by this freeze.

## Confirmed Backend Contract Surfaces

Phase 7 may consume the documented and implemented NCKH endpoints for:

- Google OAuth link and form import/list/detail
- research model CRUD and activation
- research variable CRUD
- observed question mapping CRUD
- canvas relations and node positions
- Google Form generation/update through the existing backend endpoint
- response collection, raw response listing, normalization, and dataset listing
- export in `csv`, `codebook`, and `spss` formats

If a desired UI action is not supported by the existing API guide or current implementation, the UI must omit the action or show a disabled/unavailable state rather than invent a contract.

## Frontend File Zones

Allowed implementation zones after separate implementation approval:

- `apps/web/app/dashboard/nckh/**`
- `apps/web/lib/api.ts` for typed wrappers over existing NCKH endpoints
- `apps/web/tests/**` for NCKH browser smoke/tests
- `apps/web/components/**` only when a reusable shared primitive is genuinely needed

Allowed documentation zones:

- `docs/ai/nckh/**`
- `docs/vi/nckh/**`
- `docs/ai/AI_DOC_ROUTING_MATRIX.md`
- `docs/vi/AI_DOC_ROUTING_MATRIX.md`

Forbidden zones unless separately approved:

- `src/FormAutoHub.Api/Entities/**`
- `src/FormAutoHub.Api/Data/Migrations/**`
- backend controllers/services/contracts except for a separately approved contract task
- payment, credit, admin, and non-NCKH dashboard modules

## UI Rules

- Use the existing dashboard shell and shared component inventory.
- Prefer `BaseTable`, `PaginationControls`, `StatusBadge`, shared `Button/Input/Card/Dialog/Alert/EmptyState`, and existing toast helpers where applicable.
- Keep copy Vietnamese-first.
- Use compact dashboard layouts, tables for list-heavy data, tabs/sections for model workspace, dialogs/sheets for focused mutations, and badges for status.
- Define loading, empty, error, permission, blocked, and saved states.
- Do not place cards inside cards.
- Do not add marketing-style hero content.

## Data-State Rules

- A blocked Google scope state must be shown as blocked/unavailable, not treated as a generic failure.
- Stale normalized dataset export conflict must guide the user to re-normalize before export.
- Destructive actions must use explicit confirmation when existing backend behavior allows deletion.
- Frontend must not expose raw response JSON unless an existing backend endpoint explicitly returns it.

## Assumptions

Assumption: Phase 7 can use route params under `/dashboard/nckh` for form and model workspace pages if the implementation keeps backend API contracts unchanged.

Assumption: React Flow may be used for the canvas only if it is already available or can be added as a frontend dependency in the implementation task without backend contract changes. If adding the dependency is not acceptable, use a simpler table/list canvas management UI first.

## Deferred

- backend API additions
- database migrations
- new Google scopes
- Google Sheets collection
- scheduled sync or background workers
- charts, statistical analysis, generated analysis reports, SPSS execution
- NCKH admin UI
- NCKH credit/pricing
- multi-researcher collaboration

## Review Gate

Before Phase 7 implementation is closed, confirm:

- no backend contract was invented
- no DB migration was added
- UI can complete the main workflow with the existing APIs
- browser smoke covered the primary NCKH workspace path
- blocked live Google checks are labeled honestly

