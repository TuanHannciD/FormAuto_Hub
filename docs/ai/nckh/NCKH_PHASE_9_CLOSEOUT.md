# NCKH_PHASE_9_CLOSEOUT

## Purpose

Record closeout evidence for the approved NCKH Phase 9 canvas UX completion and workflow polish implementation.

## Closeout Status

Status: **Completed for the approved frontend-only Option A scope**.

Phase 9 used Option A from `NCKH_PHASE_9_KICKOFF_PLAN.md`: keep the existing dashboard-native table/list canvas baseline and add a visual canvas layer without adding a frontend canvas dependency.

This closeout did not add backend endpoints, DTO fields, database fields, migrations, Google scopes, Google Sheets collection, watches, scheduled jobs, statistics, admin UI, credit/pricing, or production automation.

## Completed Work

Implemented in the NCKH form workspace:

- Visual canvas section in the `Sơ đồ quan hệ` tab.
- Variable nodes rendered from existing variable API data.
- Relation edges rendered from existing relation API data.
- Relation marker nodes rendered from existing relation API data.
- Saved node positions loaded from the existing Phase 3 positions API.
- `Lưu bố cục` action continues to call the existing `PUT /api/v1/nckh/models/{modelId}/positions` contract.
- Canvas toolbar action zone remains the existing create-relation form.
- Contextual action zone lists recent relations with delete actions using the existing relation delete API.
- Save/status action zone shows saved positions and saves the current default layout.
- Fallback relation table remains available under the visual canvas.
- Visible UI copy remains Vietnamese-first.

## Files Changed

- `apps/web/app/dashboard/nckh/forms/[formId]/page.tsx`
- `apps/web/tests/nckh.spec.ts`
- `docs/ai/nckh/NCKH_PHASE_9_CLOSEOUT.md`
- `docs/vi/nckh/NCKH_PHASE_9_CLOSEOUT.md`
- NCKH progress, roadmap, transition, and routing docs in both language layers.

## Contract And Dependency Decision

Decision: **Option A**.

Existing contracts were sufficient:

- `GET /api/v1/nckh/models/{modelId}/relations`
- `POST /api/v1/nckh/models/{modelId}/relations`
- `DELETE /api/v1/nckh/relations/{relationId}`
- `GET /api/v1/nckh/models/{modelId}/positions`
- `PUT /api/v1/nckh/models/{modelId}/positions`

No React Flow or other canvas dependency was added.

## Validation Performed

Verified:

- `npm run build` in `apps/web` passed.
- `npx playwright test tests/nckh.spec.ts -g "visual canvas" --workers=1 --reporter=json` passed: 1 passed.
- `npx playwright test tests/nckh.spec.ts -g "Phase 7 Workspace" --workers=1 --reporter=json` passed: 6 passed.
- Desktop browser smoke verified the canvas renders relation marker `SER -> SAT` and had `pageErrors=0`.
- Mobile browser smoke verified the canvas renders relation marker `SER -> SAT` and had `pageErrors=0`.
- Screenshots were saved under `apps/web/test-results/phase9-canvas-smoke/desktop.png` and `apps/web/test-results/phase9-canvas-smoke/mobile.png`.

Environment repair during validation:

- The first Playwright attempt was blocked by stale `.next` artifacts and an old Next dev server process.
- `.next` was cleared and the old process on port 3000 was stopped before rerunning validation.

## Validation Not Completed

Not run:

- Backend build/test, because Phase 9 did not change backend code.
- Live Google API smoke, because Phase 9 did not change Google consent, collection, generation, or export behavior.
- Full NCKH Playwright regression outside the targeted workspace group.
- Drag-and-drop node editing, because Option A did not add a visual canvas editing dependency.

Blocked:

- None for the approved frontend-only Option A scope.

## Scope Alignment

Kept in scope:

- frontend-only canvas UX completion
- existing Phase 3 relation and position contracts
- Vietnamese-first copy
- shared/base buttons, badges, tables, empty state, and page layout primitives
- desktop/mobile browser verification

Kept out of scope:

- backend endpoints
- DTO fields
- database fields or migrations
- new Google OAuth scopes
- Google Sheets collection
- watches, Pub/Sub, scheduled jobs, or background workers
- statistical analysis, charting, generated reports, or SPSS execution
- NCKH admin UI
- NCKH credit/pricing
- React Flow or other canvas dependency

## Residual Risks

- The visual canvas is an inspection and default-layout persistence layer, not a drag-and-drop editor.
- Relation and position behavior still depends on the existing Phase 3 backend contracts.
- Production-scale canvas density was not benchmarked.

## Closeout Decision

NCKH Phase 9 is **Completed** for the approved frontend-only Option A scope.

No P0/P1 blocker remains in the approved Phase 9 canvas UX completion scope based on build, targeted Playwright, and desktop/mobile browser evidence.

## Next Candidate

No active NCKH follow-up is selected after Phase 9 closeout.

Future NCKH work requires explicit approval and must preserve the Deferred items listed above.
