# NCKH_PHASE_7_5_CLOSEOUT

## Purpose

Record closeout evidence for the approved NCKH Phase 7.5 Google consent and live dataset fix/validation follow-up.

## Closeout Status

Status: **Completed with user-confirmed live Google validation**.

Phase 7.5 is closed for its approved fix/validation scope.

The live Google flow was confirmed by the user on 2026-06-05 after manual testing. This closeout distinguishes user-confirmed live evidence from tool-run validation performed by the agent.

This document does not open Phase 8 or Phase 9 implementation.

## Completed Work

Verified from current code inspection:

- The NCKH frontend Google OAuth URL requests the approved scopes needed by the existing Phase 1, Phase 4, and Phase 5 behavior:
  - `https://www.googleapis.com/auth/forms.body.readonly`
  - `https://www.googleapis.com/auth/forms.body`
  - `https://www.googleapis.com/auth/forms.responses.readonly`
  - `https://www.googleapis.com/auth/userinfo.email`
- The OAuth request uses `prompt=consent`, so re-consent can request the updated scope set.
- Backend Phase 4 form generation still guards the stored Google token scopes for the Forms body write scope.
- Backend Phase 5 collection still guards the stored Google token scopes for `https://www.googleapis.com/auth/forms.responses.readonly`.
- No backend API, DTO, database, status, lifecycle, Google Sheets, watch, scheduled job, admin, credit, or pricing scope was added as part of this closeout attempt.

User-confirmed live validation on 2026-06-05:

- Live Google re-consent works with the required NCKH scopes.
- Live Google-backed NCKH flow works after re-consent.
- Live generation, collection, normalization, and export flow works through the app.

## Validation Performed

Verified:

- `npm run build` in `apps/web` passed.
- `npx playwright test tests/nckh.spec.ts -g "Phase 7 Workspace" --workers=1 --reporter=line` passed: 3 passed.
- Current code inspection confirmed frontend requested scopes align with backend-required scopes.
- User-confirmed manual live Google validation passed on 2026-06-05.

## Validation Not Completed

Blocked:

- None for the approved Phase 7.5 closeout scope after user-confirmed live validation.

Not run:

- Full `npx playwright test tests/nckh.spec.ts --workers=1 --reporter=line` did not complete within the current 120-second command timeout, so it is not counted as passed.
- Backend build/test were not run in this closeout attempt because the inspected Phase 7.5 change set is frontend scope/config/copy oriented and no backend code was changed in this pass.
- The agent did not directly operate the live Google browser session; the live Google evidence is user-confirmed manual validation.

## Remaining Blockers

- None reported by the user for the approved Phase 7.5 live Google validation scope.

## Scope Alignment

Kept in scope:

- OAuth scope inspection.
- Frontend requested scope verification.
- Backend guard verification by source inspection.
- Frontend build and targeted Playwright regression.

Kept out of scope:

- new backend endpoints
- DTO fields
- database fields or EF Core migrations
- Google Sheets collection
- Google Forms watches, Pub/Sub, scheduled jobs, or background workers
- statistical analysis, charting, generated reports, or SPSS execution
- NCKH admin UI
- NCKH credit/pricing
- fake or seeded responses used as live closeout evidence

## Closeout Decision

Phase 7.5 is **Completed**.

No P0/P1 blocker remains in the approved Phase 7.5 Google consent and live dataset fix/validation scope based on user-confirmed manual live testing.

## Next Candidate

Next candidate: **NCKH Phase 8 - Full-stack Smoke Validation**.

Phase 8 remains a separate candidate and still requires explicit user approval before execution.
