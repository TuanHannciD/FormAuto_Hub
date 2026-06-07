# NCKH_PHASE_7_5_KICKOFF_PLAN

## Purpose

Define the approved NCKH Phase 7.5 fix and live-validation follow-up after Phase 7 frontend expansion exposed Google consent and live dataset blockers.

## Approval Status

Status: **Approved and open as a fix/validation follow-up**.

User approval: Phase 7.5 was approved to fix the blockers found during the live browser smoke with account `doba2311@gmail.com`.

This is not a new feature phase. It is a narrow follow-up to make the completed Phase 4, Phase 5, Phase 6, and Phase 7 surfaces work through the real browser/full-stack flow where external Google consent and live data are required.

## Baseline Evidence

Live browser smoke with the imported NCKH form verified:

- login with `doba2311@gmail.com`
- NCKH dashboard opens
- imported form `Untitled Form` loads with 11 questions
- new model creation through UI
- variable creation through UI
- observed question mapping through UI
- canvas relation creation through UI
- default node position save through UI
- model activation from `Draft` to `Active`

Observed blockers:

- `POST /api/v1/nckh/models/{modelId}/generate-form` returned `403` from the browser flow, indicating missing Google Forms body write consent or equivalent write permission.
- `POST /api/v1/nckh/models/{modelId}/collect` returned `403` with detail: `Google Forms response read scope is required. Please re-consent with Forms responses permission.`
- `GET /api/v1/nckh/models/{modelId}/export?format=csv|codebook|spss` returned `409` with detail: `At least one normalized dataset row is required before export.`

## Approved Scope

Phase 7.5 includes:

- inspect the NCKH Google OAuth scope request in the frontend
- ensure the Google link/re-consent path requests the approved scopes needed by existing NCKH Phase 4 and Phase 5 behavior
- re-consent the live account through the browser flow
- retest `generate-form` using a real Google credential with write consent
- retest `collect` using a real Google credential with `https://www.googleapis.com/auth/forms.responses.readonly`
- require at least one submitted Google Form response before claiming export readiness
- run `collect -> normalize -> export csv/codebook/spss` through the browser/full-stack flow
- record results with `Verified`, `Not run`, and `Blocked`

## Scope Boundaries

Do not add:

- new NCKH API endpoints
- new DTO fields, database fields, statuses, lifecycle states, or migrations unless a separate defect proves they are required and receives explicit approval
- Google Sheets response collection
- Google Forms watches or Cloud Pub/Sub
- scheduled collection jobs
- statistical analysis, charting, or generated research reports
- NCKH admin UI
- NCKH credit/pricing
- fake responses or seeded data used as evidence for live Google closeout

The Phase 7.5 fix must not bypass Google scope guards. If Google consent is missing, the correct behavior is still `Blocked` until the account is re-consented.

## Required Passes

### Pass 0 - Scope Inspection

Check current code and config for NCKH OAuth scopes.

Files likely involved:

- `apps/web/app/dashboard/nckh/page.tsx`
- `apps/web/app/dashboard/nckh/callback/page.tsx`
- `src/FormAutoHub.Api/Services/Nckh/ResearchFormService.cs`
- `src/FormAutoHub.Api/Services/Nckh/ResearchDataService.cs`

Acceptance:

- list current requested scopes
- list backend-required scopes
- identify whether the blocker is frontend OAuth scope, stored token scope, Google account consent, submitted response availability, or code behavior

### Pass 1 - Minimal Scope Fix If Needed

If the OAuth URL does not request required approved scopes, update only the NCKH Google link scope string and keep the existing callback flow.

Approved scope targets:

- Forms read/import scope already used by Phase 1
- Forms body write scope required by Phase 4 generate/update behavior
- `https://www.googleapis.com/auth/forms.responses.readonly` required by Phase 5 response collection

Acceptance:

- OAuth URL requests the approved scopes
- no unrelated Google Sheets, watch, background job, or admin scope is added
- frontend build passes if code changed

### Pass 2 - Live Re-consent

Use the browser to re-link Google for the target account.

Acceptance:

- Google callback returns to `/dashboard/nckh`
- NCKH dashboard remains authenticated
- subsequent generate/collect calls no longer fail because of missing stored Google scope

### Pass 3 - Live Generate And Collection

Run through the browser:

- open imported form workspace
- use an active model with variables and mappings
- run `Tạo form từ model`
- ensure at least one real response exists on the target Google Form used for collection
- run `Thu thập responses`

Acceptance:

- generate-form returns `200`, or any remaining Google error is captured as `Blocked` with exact status and detail
- collect returns `200`, or any remaining Google error is captured as `Blocked` with exact status and detail

### Pass 4 - Normalize And Export

Run through the browser:

- `Chuẩn hóa dataset`
- export CSV dataset
- export Excel codebook
- export SPSS syntax

Acceptance:

- normalize returns `200`
- dataset has at least one normalized row before export is claimed complete
- CSV, codebook, and SPSS export return `200` and download files

### Pass 5 - Closeout Prep

If all required live checks pass, prepare Phase 7.5 closeout docs in both language layers.

Acceptance:

- validation report uses `Verified`, `Not run`, and `Blocked`
- remaining external blockers are not described as completed
- Phase 8 remains a later full-stack smoke candidate unless explicitly opened

## Validation Required

Minimum validation after code changes:

- `npm run build` in `apps/web` if frontend changes
- targeted browser smoke with the real account
- inspect actual HTTP statuses for NCKH endpoints used in the browser flow
- run existing NCKH Playwright regression when practical: `npx playwright test tests/nckh.spec.ts --workers=1 --reporter=line`

Backend validation is required only if backend code changes.

## Stop Conditions

Stop and report instead of widening scope when:

- Google consent cannot be completed
- Google returns provider-side errors outside app control
- the target form has no submitted responses and the user cannot provide one
- export remains blocked because no normalized dataset row exists
- a fix would require new API contracts, database changes, Google Sheets, scheduled jobs, or statistical-analysis features

