# NCKH_PHASE_7_CLOSEOUT

## Purpose

Record closeout evidence for the approved NCKH Phase 7 frontend expansion slice.

## Closeout Status

Status: **Completed for the approved frontend-only Phase 7 scope**.

This closeout does not claim new backend API readiness, new database readiness, live Google write/read production readiness, statistical analysis readiness, NCKH admin readiness, or credit/pricing readiness.

## Implementation Summary

Implemented:

- NCKH form workspace route: `/dashboard/nckh/forms/{formId}`
- form detail loading over the existing Phase 1 form detail API
- model list/create/activate/delete UI over existing Phase 2 model APIs
- variable create/delete/list UI over existing Phase 2 variable APIs
- observed mapping create/delete/list UI over existing Phase 2 mapping APIs
- relation create/delete/list UI over existing Phase 3 canvas relation APIs
- node-position save/list UI over existing Phase 3 position APIs
- Google Form generation action over existing Phase 4 generate-form API
- response collection, raw response listing, normalization, and dataset preview over existing Phase 5 APIs
- CSV/codebook/SPSS export actions over existing Phase 6 export API
- typed frontend API contracts for existing NCKH Phase 2-6 response shapes
- Playwright coverage for the Phase 7 workspace route and tabs/actions

Implementation note: Phase 7 uses a compact table/list canvas management UI and does not add React Flow or another frontend dependency.

## Files Changed

Main implementation files:

- `apps/web/lib/api.ts`
- `apps/web/app/dashboard/nckh/forms/[formId]/page.tsx`
- `apps/web/tests/nckh.spec.ts`

Documentation updates:

- `docs/ai/nckh/NCKH_PHASE_7_CLOSEOUT.md`
- `docs/vi/nckh/NCKH_PHASE_7_CLOSEOUT.md`
- `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/vi/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/vi/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/ai/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/vi/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/ai/AI_DOC_ROUTING_MATRIX.md`
- `docs/vi/AI_DOC_ROUTING_MATRIX.md`

## API Contract Impact

No backend API contract changes were made.

Confirmed:

- no backend controllers changed
- no backend services changed
- no DTO fields added to backend contracts
- no new route surface added
- no new status or lifecycle value introduced
- frontend types were added only to consume existing NCKH API shapes

## Database Contract Impact

No database changes were made.

Confirmed:

- no new entity
- no new table
- no new column
- no EF Core migration
- no export job/history table

## Validation Performed

Verified:

- `npm run build` in `apps/web` passed.
- `npx playwright test tests/nckh.spec.ts -g "Phase 7 Workspace" --workers=1 --reporter=line` passed: 3 passed.
- `npx playwright test tests/nckh.spec.ts --workers=1 --reporter=json` passed: 26 passed, 0 failed.
- Browser smoke covered `/dashboard/nckh/forms/{formId}` with mocked authenticated NCKH APIs.
- Browser smoke verified the Phase 7 workspace route renders model tabs.
- Browser smoke verified the variables tab consumes the existing backend contract shape.
- Browser smoke verified CSV, codebook, and SPSS export actions are visible without adding new backend contracts.
- Dev server logs were inspected after smoke; route requests returned `200` and no fatal frontend server error was observed in the inspected tail.

## Validation Not Performed

Not run:

- `dotnet build` / backend tests, because Phase 7 did not change backend code.
- Live Google Forms create/update smoke, because this environment does not provide real Google OAuth credentials and Forms body write consent.
- Live Google Forms response-read smoke, because this environment does not provide real Google OAuth credentials, response-read consent, and submitted responses.
- Real file download against a live database-backed normalized dataset, because Playwright Phase 7 used mocked API responses.

## Scope Alignment

Kept in scope:

- frontend-only NCKH workspace
- existing Phase 1-6 API consumption
- Vietnamese-first dashboard copy
- loading, empty, error, blocked, and success states
- table/list canvas management without new dependency

Kept out of scope:

- backend endpoints
- DTO/database contract changes
- Google Sheets collection
- scheduled jobs, watches, Pub/Sub, or background workers
- charts, statistical analysis, generated reports, or SPSS execution
- NCKH admin UI
- NCKH credit/pricing
- multi-researcher collaboration

## Residual Risks

- Full live Google write/read workflow still needs real credentials and consent to validate blocked paths beyond mocks.
- File export button behavior is wired to the existing endpoint, but end-to-end binary download validation against a seeded live dataset should be repeated in a full-stack validation phase.
- The table/list canvas UI is intentionally basic; a future approved UI polish slice may add React Flow or richer diagram behavior without changing backend contracts.

## Next Candidate

Current next follow-up: **NCKH Phase 7.5 - Google Consent And Live Dataset Fix/Validation**.

This supersedes the earlier Phase 8 next-candidate wording after live browser testing found concrete Google consent and live dataset blockers. See `NCKH_PHASE_7_5_KICKOFF_PLAN.md`.
