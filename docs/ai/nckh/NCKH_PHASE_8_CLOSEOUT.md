# NCKH_PHASE_8_CLOSEOUT

## Purpose

Record closeout evidence for the approved NCKH Phase 8 full-stack smoke validation pass.

## Closeout Status

Status: **Completed for the approved validation-only scope**.

Phase 8 is closed as a validation phase. This closeout did not add product behavior, API contracts, DTO fields, database fields, migrations, Google scopes, Google Sheets collection, watches, scheduled jobs, statistics, admin UI, credit/pricing, or production automation.

This document does not open NCKH Phase 9 implementation.

## Validation Scope

Validated areas:

- Release backend build.
- Release NCKH backend test subset.
- Next.js web build.
- Full NCKH Playwright regression.
- Local runtime restart for API and web.
- Authenticated API smoke with a real linked Google account.
- Chrome UI smoke through the user's Chrome profile, including real login and NCKH workspace navigation.
- Export endpoint checks for CSV, codebook, and SPSS syntax output.

## Validation Performed

Verified:

- `dotnet build FormAutoHub.sln -c Release` passed.
- `npm run build` in `apps/web` passed.
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build --filter Nckh` passed: 51 passed.
- `npx playwright test tests/nckh.spec.ts --workers=1 --reporter=line` passed: 29 passed.
- Local API was restarted at `http://localhost:5235`.
- Local web was restarted at `http://localhost:3000`.
- API and web stderr logs were empty after smoke.
- API login passed for `doba2311@gmail.com`.
- Profile showed `googleLinked: true` and `googleEmail: doba2311@gmail.com`.

Verified live API smoke against model `6665dd7f-c1cc-42f8-ba84-13c85eb29974`:

- `POST /api/v1/nckh/models/{modelId}/generate-form` with `{ "action": "Update" }` returned `200 OK`, `questionsCreated: 1`, and `reimported: true`.
- `POST /api/v1/nckh/models/{modelId}/collect` returned `200 OK`, `responsesCollected: 0`, `responsesSkipped: 541`, and `status: Success`.
- `POST /api/v1/nckh/models/{modelId}/normalize` returned `200 OK`, `respondentsProcessed: 541`, `variablesComputed: 1`, `missingDataCount: 1`, and `staleDatasetsMarked: 0`.
- `GET /api/v1/nckh/models/{modelId}/responses?page=1&pageSize=5` returned `200 OK` with `totalItems: 541`.
- `GET /api/v1/nckh/models/{modelId}/dataset?page=1&pageSize=5` returned `200 OK`, `totalItems: 541`, `hasStaleData: false`, and columns including `RespondentId`, `OBS2248`, and `SAT2248_mean`.
- CSV export returned `200 OK`, `text/csv`, and a non-empty body.
- Codebook export returned `200 OK`, `.xlsx`, and a non-empty body.
- SPSS syntax export returned `200 OK`, `text/plain`, and included the expected SPSS syntax header.

Verified Chrome UI smoke:

- Chrome automation worked after closing conflicting Chrome/extension state and clearing leftover Playwright Chromium processes.
- Browser opened `http://localhost:3000/login`.
- Login with `doba2311@gmail.com` reached `/dashboard`.
- `/dashboard/nckh` rendered the user `Tuấn`, linked Google status, and 6 imported forms.
- Opening `Untitled Form` reached `/dashboard/nckh/forms/4974389e-47f0-4831-adc5-fa1c38b55039`.
- Workspace rendered model `NCKH smoke 20260605102248` and `28 câu hỏi` after live generate/update.
- Tabs were clicked and verified for variables, mapping, relation/hypothesis, form generation, and export markers.

## Validation Not Completed

Not run:

- SPSS application execution of the generated SPSS syntax.
- Production large-dataset streaming/performance validation.
- Google Sheets response collection, because Google Sheets remains outside the approved NCKH scope unless separately selected later.
- Watches, Pub/Sub, scheduled jobs, statistical reports, NCKH admin UI, and NCKH credit/pricing.

Blocked:

- None for the approved Phase 8 validation-only closeout scope.

## Scope Alignment

Kept in scope:

- Full-stack validation over already-approved NCKH Phase 1-7.5 behavior.
- Browser and API smoke with a real linked Google account.
- Export endpoint verification from the completed Phase 6 backend scope.
- Chrome automation diagnostics only to unblock user-visible UI smoke.

Kept out of scope:

- new backend endpoints
- new DTO fields
- new database fields or migrations
- new Google OAuth scopes
- Google Sheets collection
- watches, Pub/Sub, scheduled jobs, or background workers
- statistical analysis, charting, generated reports, or SPSS execution
- NCKH admin UI
- NCKH credit/pricing
- abuse automation, fake accounts, captcha bypass, proxy rotation, or unauthorized form submission

## Residual Risks

- SPSS syntax was exported and checked as text, but not executed in SPSS.
- The live dataset smoke used the available linked account and existing form/model data; it is not a production scale/performance benchmark.
- Chrome automation initially failed while another extension UI/conflicting Chrome state was open; the final pass succeeded only after Chrome was fully closed and leftover Playwright Chromium processes were cleared.
- A failed first capture attempt may have invoked generate/update before the final rerun; the final verified state still passed with the recorded model/form state.

## Closeout Decision

NCKH Phase 8 is **Completed** for the approved validation-only scope.

No P0/P1 blocker remains in the approved Phase 8 full-stack smoke validation scope based on the recorded build, test, API, Playwright, and Chrome UI evidence.

## Later State

NCKH Phase 9 was later completed for the approved frontend-only Option A canvas UX scope. See `NCKH_PHASE_9_CLOSEOUT.md`.
