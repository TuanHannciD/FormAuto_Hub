# NCKH_PHASE_5_CLOSEOUT

## Purpose

Record closeout evidence for the approved NCKH Phase 5 backend-only Data Collection & Normalization slice.

## Closeout Status

Status: **Completed for the approved backend-only Phase 5 scope, with live Google Forms response-read smoke blocked by missing real Google credentials, response-read consent, and a submitted live Google Form in this environment**.

This closeout does not claim production readiness for live Google response collection until a real Google OAuth account with `https://www.googleapis.com/auth/forms.responses.readonly` and an accessible form with submitted responses are validated.

## Implementation Summary

Implemented:

- `POST /api/v1/nckh/models/{modelId}/collect`
- `GET /api/v1/nckh/models/{modelId}/responses`
- `POST /api/v1/nckh/models/{modelId}/normalize`
- `GET /api/v1/nckh/models/{modelId}/dataset`
- stored-scope guard for `https://www.googleapis.com/auth/forms.responses.readonly`
- `403 Forbidden` when the stored Google consent lacks Forms response-read permission
- Google Forms responses list integration method
- raw response persistence and idempotent upsert by `(ModelId, GoogleResponseId)`
- collection attempt logging through `DataCollectionLogs`
- raw response listing without exposing full `RawDataJson`
- normalization from mapped Google question IDs into observed-code columns
- numeric Likert/Scale mean columns using `{VariableCode}_mean`
- missing, blank, or unparseable values as JSON null with missing count
- stale normalized dataset marking when variables or mappings change

## Files Changed

Main implementation files:

- `src/FormAutoHub.Api/Contracts/NckhDtos.cs`
- `src/FormAutoHub.Api/Controllers/Nckh/ResearchDataController.cs`
- `src/FormAutoHub.Api/Services/Nckh/ResearchDataService.cs`
- `src/FormAutoHub.Api/Services/Nckh/ResearchFormService.cs`
- `src/FormAutoHub.Api/Integrations/Google/GoogleFormsApiService.cs`
- `src/FormAutoHub.Api/Program.cs`
- `src/FormAutoHub.Api/Entities/Nckh/SurveyResponse.cs`
- `src/FormAutoHub.Api/Entities/Nckh/NormalizedDataset.cs`
- `src/FormAutoHub.Api/Entities/Nckh/DataCollectionLog.cs`
- `src/FormAutoHub.Api/Entities/Nckh/ResearchModel.cs`
- `src/FormAutoHub.Api/Data/FormAutoHubDbContext.cs`
- `src/FormAutoHub.Api/Data/Migrations/20260604211823_NckhPhase5_DataCollectionNormalization.cs`
- `src/FormAutoHub.Api/Data/Migrations/20260604211823_NckhPhase5_DataCollectionNormalization.Designer.cs`
- `src/FormAutoHub.Api/Data/Migrations/FormAutoHubDbContextModelSnapshot.cs`
- `tests/FormAutoHub.Tests/FoundationTests.cs`
- `tests/FormAutoHub.Tests/NckhPhase5DataServiceTests.cs`

Documentation updates:

- `docs/ai/nckh/NCKH_PHASE_5_CLOSEOUT.md`
- `docs/vi/nckh/NCKH_PHASE_5_CLOSEOUT.md`
- `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/vi/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/vi/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/ai/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/vi/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/ai/nckh/NCKH_API_CONTRACT_GUIDE.md`
- `docs/vi/nckh/NCKH_API_CONTRACT_GUIDE.md`
- `docs/ai/nckh/NCKH_DOMAIN_ENTITIES_OVERVIEW.md`
- `docs/vi/nckh/NCKH_DOMAIN_ENTITIES_OVERVIEW.md`
- `docs/ai/AI_DOC_ROUTING_MATRIX.md`
- `docs/vi/AI_DOC_ROUTING_MATRIX.md`

## API Contract Finalized

Implemented endpoints:

- `POST /api/v1/nckh/models/{modelId}/collect`
- `GET /api/v1/nckh/models/{modelId}/responses?page=1&pageSize=20`
- `POST /api/v1/nckh/models/{modelId}/normalize`
- `GET /api/v1/nckh/models/{modelId}/dataset?page=1&pageSize=20`

Collection response:

```json
{
  "logId": "guid",
  "responsesCollected": 8,
  "responsesSkipped": 2,
  "status": "Success",
  "errorMessage": null
}
```

Normalization response:

```json
{
  "respondentsProcessed": 45,
  "variablesComputed": 3,
  "missingDataCount": 2,
  "staleDatasetsMarked": 0
}
```

Dataset response includes:

- `columns`
- `hasStaleData`
- `items[].respondentId`
- `items[].values`
- `items[].isStale`
- `items[].normalizedAt`
- standard pagination fields

Status behavior:

- `400`: invalid request or normalization without observed mappings
- `401`: app authentication failure, Google account not linked, or Google token unavailable
- `403`: missing `https://www.googleapis.com/auth/forms.responses.readonly`
- `404`: model/form not found in the current user scope
- `502`: Google Forms response API failure

## Database Contract Finalized

Added entities:

### SurveyResponses

- `Id` GUID PK
- `ModelId` GUID FK to `ResearchModels.Id`
- `GoogleResponseId` string
- `RespondentId` nullable string
- `RawDataJson` string
- `ResponseTimestamp` nullable `DateTimeOffset`
- `CreatedAt` `DateTimeOffset`
- `UpdatedAt` `DateTimeOffset`

Indexes:

- unique `(ModelId, GoogleResponseId)`
- `(ModelId, RespondentId)`
- `(ModelId, ResponseTimestamp)`

### NormalizedDatasets

- `Id` GUID PK
- `ModelId` GUID FK to `ResearchModels.Id`
- `SurveyResponseId` GUID FK to `SurveyResponses.Id`
- `RespondentId` nullable string
- `NormalizedDataJson` string
- `IsStale` bool default false
- `NormalizedAt` `DateTimeOffset`
- `CreatedAt` `DateTimeOffset`
- `UpdatedAt` `DateTimeOffset`

Indexes:

- unique `(ModelId, SurveyResponseId)`
- `(ModelId, RespondentId)`
- `(ModelId, IsStale)`
- `(ModelId, NormalizedAt)`

### DataCollectionLogs

- `Id` GUID PK
- `ModelId` GUID FK to `ResearchModels.Id`
- `Status` string: `Success`, `Partial`, `Failed`
- `ResponsesCollected` int
- `ResponsesSkipped` int
- `ErrorMessage` nullable string
- `StartedAt` `DateTimeOffset`
- `CompletedAt` nullable `DateTimeOffset`
- `CreatedAt` `DateTimeOffset`

Indexes:

- `(ModelId, StartedAt)`
- `(ModelId, Status)`

Delete behavior:

- `ResearchModel -> SurveyResponses`: cascade
- `ResearchModel -> NormalizedDatasets`: cascade
- `ResearchModel -> DataCollectionLogs`: cascade
- `SurveyResponse -> NormalizedDatasets`: no-action to avoid multiple cascade paths

## Validation Performed

Verified:

- `dotnet build FormAutoHub.sln -c Release` passed.
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build` passed: 137 passed, 0 failed.
- EF Core database update applied all migrations through `20260604211823_NckhPhase5_DataCollectionNormalization` to temporary LocalDB database `FormAutoHubNckhPhase5Smoke1`.
- Authenticated HTTP smoke passed on `http://localhost:5235` with a real JWT from `/api/auth/register` or `/api/auth/login`.
- Runtime smoke seeded an owned NCKH form, model, question, variable, observed mapping, raw survey response, and Google external login.
- Runtime smoke verified `POST /api/v1/nckh/models/{modelId}/collect` returns `403 Forbidden` with a response-read re-consent message when the stored Google scope lacks `forms.responses.readonly`.
- Runtime smoke verified `GET /api/v1/nckh/models/{modelId}/responses` returns `200 OK` and does not expose full `RawDataJson`.
- Runtime smoke verified `POST /api/v1/nckh/models/{modelId}/normalize` returns `200 OK` with one respondent processed.
- Runtime smoke verified `GET /api/v1/nckh/models/{modelId}/dataset` returns `200 OK` with columns `RespondentId`, `SAT_1`, and `SAT_mean`.
- Server logs were inspected after smoke. No fatal error was observed; EF logged one query warning for multiple collection includes on dataset listing.
- Temporary smoke database was dropped and the API smoke process was stopped after validation.

## Validation Not Performed

Blocked:

- Live Google Forms response collection with `https://www.googleapis.com/auth/forms.responses.readonly`, because this environment does not have a real Google OAuth credential, response-read consent, and submitted Google Form responses available.

Not run:

- Frontend build and Playwright smoke, because Phase 5 is backend-only and no frontend file changed.
- Export-file validation, because CSV/Excel/SPSS export remains Deferred.

## Scope Alignment

Kept in scope:

- backend-only manual collection endpoint
- Forms response-read scope guard
- raw response persistence and list endpoint
- collection logging
- normalization endpoint and dataset list endpoint
- stale dataset marking for variable/mapping changes
- EF Core migration for approved Phase 5 tables

Kept out of scope:

- Google Sheets collection
- CSV/Excel/SPSS export
- frontend expansion
- scheduled collection
- real-time sync
- Google Forms watches / Cloud Pub/Sub
- statistical analysis
- credit/pricing
- NCKH admin UI
- automatic response submission

## Residual Risks

- Live Google Forms response payload shape must be validated with real credentials before production use.
- `Partial` collection status is reserved by the approved contract, but the current Google list call either succeeds or fails as one external call in the implemented MVP path.
- Dataset listing logs an EF multiple-collection include performance warning under the seeded smoke path; it is not a correctness failure, but should be reviewed if dataset payloads grow.
- Raw response JSON may contain personal data; default list endpoint avoids returning full raw payload, and future endpoints must keep that boundary.

## Next Candidate

Next proposed phase: **NCKH Phase 6 - Export**.

Phase 6 remains proposed and requires separate approval before implementation.
