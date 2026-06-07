# NCKH_PHASE_4_CLOSEOUT

## Purpose

Record closeout evidence for the approved NCKH Phase 4 backend-only Google Form Generation & Update slice.

## Closeout Status

Status: **Completed for the approved backend-only Phase 4 scope, with live Google Forms smoke blocked by missing real Google credentials/write consent in this environment**.

This closeout does not claim production readiness for live Google Forms create/update until a real Google OAuth account with `https://www.googleapis.com/auth/forms.body` is validated.

## Implementation Summary

Implemented:

- `POST /api/v1/nckh/models/{modelId}/generate-form`
- request action values: `create`, `update`
- response fields: `formId`, `googleFormId`, `formUrl`, `questionsCreated`, `questionsUpdated`, `questionsDeleted`, `reimported`
- write-scope guard using stored Google OAuth scopes
- `403 Forbidden` when the user has only Forms read scope and must re-consent for Forms body write permission
- Google Forms API create and batch-update create-item integration methods
- generated-form tracking on `ResearchForms`
- re-import/upsert of generated or updated Google Form structure after successful Google write
- conservative question generation from existing `ObservedQuestionMapping` and `ResearchFormQuestion` data
- validation rejection for choice-style questions when option metadata is unavailable

## Files Changed

Main implementation files:

- `src/FormAutoHub.Api/Contracts/NckhDtos.cs`
- `src/FormAutoHub.Api/Controllers/Nckh/ResearchFormsController.cs`
- `src/FormAutoHub.Api/Services/Nckh/ResearchFormService.cs`
- `src/FormAutoHub.Api/Integrations/Google/GoogleFormsApiService.cs`
- `src/FormAutoHub.Api/Integrations/Google/GoogleOAuthService.cs`
- `src/FormAutoHub.Api/Entities/Nckh/ResearchForm.cs`
- `src/FormAutoHub.Api/Data/FormAutoHubDbContext.cs`
- `src/FormAutoHub.Api/Data/Migrations/20260604165518_NckhPhase4_FormGenerationTracking.cs`
- `src/FormAutoHub.Api/Data/Migrations/20260604165518_NckhPhase4_FormGenerationTracking.Designer.cs`
- `src/FormAutoHub.Api/Data/Migrations/FormAutoHubDbContextModelSnapshot.cs`
- `tests/FormAutoHub.Tests/NckhPhase4FormGenerationServiceTests.cs`

Related test compatibility updates:

- `tests/FormAutoHub.Tests/NckhPhase1OAuthAndFormsTests.cs`
- `tests/FormAutoHub.Tests/NckhPhase2VariableMappingApiTests.cs`
- `tests/FormAutoHub.Tests/NckhPhase3CanvasServiceTests.cs`

Documentation updates:

- `docs/ai/nckh/NCKH_PHASE_4_CLOSEOUT.md`
- `docs/vi/nckh/NCKH_PHASE_4_CLOSEOUT.md`
- `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/vi/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/vi/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/ai/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/vi/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/ai/nckh/NCKH_API_CONTRACT_GUIDE.md`
- `docs/vi/nckh/NCKH_API_CONTRACT_GUIDE.md`

## API Contract Finalized

Implemented endpoint:

- `POST /api/v1/nckh/models/{modelId}/generate-form`

Request:

```json
{
  "action": "create"
}
```

or:

```json
{
  "action": "update"
}
```

Response:

```json
{
  "formId": "guid",
  "googleFormId": "google-form-id",
  "formUrl": "https://docs.google.com/forms/d/google-form-id/edit",
  "questionsCreated": 1,
  "questionsUpdated": 0,
  "questionsDeleted": 0,
  "reimported": true
}
```

Status behavior:

- `400`: invalid action, unsupported question type, or model not ready
- `401`: app authentication or Google token unavailable
- `403`: missing Google Forms write scope or target form not accessible for write
- `404`: model/form not found in the current user scope
- `409`: duplicate generated form or unsafe conflict
- `502`: Google Forms API create/update/re-import failure

## Database Contract Finalized

Added to `ResearchForms`:

- `GeneratedFromModelId` nullable GUID FK to `ResearchModels.Id`
- `GenerationSource` string default `Imported`
- `LastGeneratedAt` nullable `DateTimeOffset`
- `LastSyncedAt` nullable `DateTimeOffset`

Delete behavior:

- `GeneratedFromModelId -> ResearchModels`: restrict/no-action

Indexes:

- `(UserId, GeneratedFromModelId)`
- EF-created FK index on `GeneratedFromModelId`

## Validation Performed

Verified:

- `dotnet build FormAutoHub.sln -c Release` passed.
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build` passed: 133 passed, 0 failed.
- EF Core database update applied `20260604165518_NckhPhase4_FormGenerationTracking` to temporary LocalDB database `FormAutoHubNckhPhase4Smoke2`.
- Authenticated HTTP smoke passed on `http://127.0.0.1:5103` using a real JWT from `/api/auth/register`.
- Runtime smoke seeded an owned model, variable, question, observed mapping, and Google login with readonly Forms scope.
- Runtime smoke verified `POST /api/v1/nckh/models/{modelId}/generate-form` returns `403 Forbidden` with re-consent-required message when write scope is missing.
- Server logs were inspected after smoke; no exception was observed. The only noted warning was local HTTPS redirect detection under HTTP smoke.
- Temporary smoke databases were dropped and API smoke process was stopped.

## Validation Not Performed

Blocked:

- Live Google Forms create/update smoke with `https://www.googleapis.com/auth/forms.body`, because this environment does not have a real Google OAuth credential/write-consented account available.
- Publish/response availability validation for forms created after 2026-06-30, because it requires live Google Forms API credentials and an actual generated form.

Not run:

- Frontend build and Playwright smoke, because Phase 4 is backend-only and no frontend file changed.

## Scope Alignment

Kept in scope:

- backend-only Google Form create/update route
- write-scope guard
- minimal generated-form tracking fields
- conservative question generation from approved mapping data
- re-import/upsert after successful Google write

Kept out of scope:

- Google Sheets response pull
- response collection
- normalization/export
- statistical analysis
- credit/pricing
- NCKH admin UI
- React Flow/frontend expansion
- scheduled jobs
- Google Forms watches / Cloud Pub/Sub
- AI-generated questionnaire text
- automatic response submission

## Residual Risks

- The live Google Forms payload shape must be verified with real credentials before production use.
- Update behavior currently appends mapped questions and re-imports structure; it does not delete unmatched existing Google questions.
- Choice-style question generation remains blocked until option metadata is modeled/imported.
- Google Forms created with the API after 2026-06-30 may be unpublished by default; live validation is required before claiming forms are immediately response-ready.

## Next Candidate

Next proposed phase: **NCKH Phase 5 - Data Collection + Normalization**.

Phase 5 remains proposed and requires separate approval plus Google Sheets scope review.
