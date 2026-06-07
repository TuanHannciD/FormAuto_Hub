# NCKH_PHASE_5_CONTRACT_DB_FREEZE

## Purpose

Record the Pass 0 contract, Google response-read scope, and database freeze review for NCKH Phase 5 before any production implementation starts.

This file is a review and approval artifact. It does not mark Phase 5 as implemented or completed.

## Review Result

Status: **Ready for explicit Phase 5 implementation approval after user accepts the freeze decisions below**.

Phase 5 may proceed to implementation only after this freeze is accepted. Until then, response collection routes, DTOs, Google response-read scope, collection statuses, normalization behavior, and persistence changes remain proposed.

## Source Evidence Read

- `NCKH_PROGRESS_LEDGER.md`
- `NCKH_PHASE_TRANSITION_GUIDE.md`
- `NCKH_PHASE_ROADMAP.md`
- `NCKH_PHASE_4_CLOSEOUT.md`
- `NCKH_PHASE_5_KICKOFF_PLAN.md`
- `NCKH_REQUIREMENT_PACKAGE.md`
- `NCKH_DOMAIN_ENTITIES_OVERVIEW.md`
- `NCKH_API_CONTRACT_GUIDE.md`
- `NCKH_MODULE_MAP.md`
- `NCKH_ARCHITECTURE_BOUNDARIES.md`
- Official Google Forms API response docs for response-read scope review
- Official Google Sheets API scope docs for Sheets-read alternative review

## Current Confirmed Baseline

- NCKH Phase 1, Phase 2, Phase 3, and Phase 4 are completed for their approved scopes.
- Existing route prefix is `/api/v1/nckh`.
- Phase 1 has Google Forms read/import behavior.
- Phase 2 has model, variable, and observed mapping behavior.
- Phase 3 has relation, node-position, and deterministic hypothesis behavior.
- Phase 4 has backend Google Form generation/update behavior.
- Current implemented `ResearchModel.Status` values are `Draft` and `Active` only.
- `Archived` remains Deferred.
- Phase 5 must not add export, frontend expansion, scheduled jobs, watches, Pub/Sub, credit, admin UI, or statistical analysis.

## Google Scope Review

Approval status: **Proposed for Phase 5 implementation approval**.

Preferred response-read scope:

- `https://www.googleapis.com/auth/forms.responses.readonly`

Reason:

- The Google Forms API `forms.responses.list` and `forms.responses.get` routes retrieve form responses and avoid requiring spreadsheet file discovery for the Phase 5 MVP.

Alternative Sheets-read scope if implementation explicitly chooses linked response spreadsheets:

- `https://www.googleapis.com/auth/spreadsheets.readonly`

Rules:

- The scope must be requested only through explicit user Google consent.
- The implementation must not silently assume existing Phase 1 Forms body read consent or Phase 4 Forms body write consent includes response-read permission.
- If the stored Google token lacks the approved Phase 5 scope, the API must return a clear re-consent-required error instead of attempting response collection.
- The Phase 5 MVP should use the Forms responses API unless a later approval explicitly chooses the Sheets path.
- Google Sheets write scope remains Deferred.
- Drive-wide scopes remain Deferred unless a later approval proves they are required.

Scope risk notes:

- Google Sheets scopes apply to spreadsheet files and cannot be limited to one sheet; this is why the freeze prefers the narrower Forms responses API path for Phase 5 MVP.
- Live validation still requires a real Google OAuth account with the approved response-read scope and a Google Form with submitted responses.

## Freeze Decision: Phase 5 Route Surface

Approval status: **Proposed for Phase 5 implementation approval**.

### Collect Responses

Endpoint:

- `POST /api/v1/nckh/models/{modelId}/collect`

Request:

```json
{}
```

Response 200:

```json
{
  "logId": "guid",
  "responsesCollected": 8,
  "responsesSkipped": 2,
  "status": "Success",
  "errorMessage": null
}
```

Allowed status values:

- `Success`
- `Partial`
- `Failed`

Expected status mapping:

- `400` validation failure or model not ready for collection
- `401` unauthenticated request or Google account not linked/token unavailable
- `403` missing approved response-read scope or target form not readable
- `404` model/form not found in current user's scope
- `409` unsafe stale mapping conflict that prevents reliable collection
- `502` Google response API failure

### List Raw Responses

Endpoint:

- `GET /api/v1/nckh/models/{modelId}/responses?page=1&pageSize=20`

Response 200:

```json
{
  "items": [
    {
      "id": "guid",
      "googleResponseId": "response-id",
      "respondentId": "respondent-id-or-null",
      "responseTimestamp": "2026-06-05T10:00:00Z",
      "createdAt": "2026-06-05T10:05:00Z",
      "updatedAt": "2026-06-05T10:05:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalItems": 1,
  "totalPages": 1
}
```

Raw payload exposure rule:

- Do not return full `RawDataJson` in list responses by default.

### Normalize Data

Endpoint:

- `POST /api/v1/nckh/models/{modelId}/normalize`

Request:

```json
{}
```

Response 200:

```json
{
  "respondentsProcessed": 45,
  "variablesComputed": 3,
  "missingDataCount": 2,
  "staleDatasetsMarked": 0
}
```

### List Normalized Dataset

Endpoint:

- `GET /api/v1/nckh/models/{modelId}/dataset?page=1&pageSize=20`

Response 200:

```json
{
  "columns": ["RespondentId", "TH1", "TH2", "TH_mean"],
  "hasStaleData": false,
  "items": [
    {
      "respondentId": "respondent-id-or-null",
      "values": {
        "TH1": 5,
        "TH2": 4,
        "TH_mean": 4.5
      },
      "isStale": false,
      "normalizedAt": "2026-06-05T10:10:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalItems": 1,
  "totalPages": 1
}
```

Pagination:

- Use existing page/pageSize/totalItems/totalPages standard.
- Clamp `pageSize` to `1..100`.

## Freeze Decision: Ownership And Model Readiness

Approval status: **Proposed for Phase 5 implementation approval**.

Rules:

- The model must belong to the current authenticated user.
- The model's form must belong to the same user.
- Collection is allowed for `Draft` and `Active` models.
- The model must have at least one observed mapping before normalization.
- Collection may succeed even before mappings are complete, because raw response storage does not require all questions to be mapped.
- Normalization must process only mapped questions.

## Freeze Decision: Collection Behavior

Approval status: **Proposed for Phase 5 implementation approval**.

Rules:

- Collection is manual only.
- Each collection attempt writes one `DataCollectionLog`.
- Responses are upserted idempotently by `(ModelId, GoogleResponseId)`.
- Unchanged duplicate responses are skipped and counted in `responsesSkipped`.
- Partial Google failures may preserve successfully collected responses and mark the log `Partial`.
- Failed collection must not create fake response rows.
- No automatic form submission is allowed.

## Freeze Decision: Normalization Behavior

Approval status: **Proposed for Phase 5 implementation approval**.

Rules:

- Raw responses remain the source of truth.
- Normalized rows are regenerated/upserted per `(ModelId, RespondentId)`.
- Output columns use observed codes from `ObservedQuestionMapping.ObservedCode`.
- Variable mean columns use `{VariableCode}_mean`.
- Likert means are simple arithmetic means over non-null numeric observed values.
- Missing, blank, or unparseable values are stored as JSON null and counted as missing data.
- Nominal and ordinal values are preserved as normalized answer values; no statistical encoding is invented in Phase 5.
- Do not run Cronbach Alpha, EFA, regression, T-test, ANOVA, or other statistical analysis.

## Freeze Decision: Stale Dataset Behavior

Approval status: **Proposed for Phase 5 implementation approval**.

Rules:

- If variable or mapping definitions change after normalized rows exist, affected normalized rows must be marked stale before or during the write that changes mappings/variables.
- Phase 5 implementation may add minimal stale-marking calls to existing variable/mapping update/delete flows.
- `normalize` may regenerate rows from raw responses and set `IsStale = false` for rows it recomputes.
- Dataset list must expose `hasStaleData`.

## Freeze Decision: Persistence

Approval status: **Proposed for Phase 5 implementation approval**.

Approved new entities if implementation confirms they are absent and required:

### SurveyResponse

- `Id` GUID PK
- `ModelId` GUID FK to `ResearchModels.Id`
- `GoogleResponseId` string
- `RespondentId` string nullable
- `RawDataJson` nvarchar(max)
- `ResponseTimestamp` nullable `DateTimeOffset`
- `CreatedAt` `DateTimeOffset`
- `UpdatedAt` `DateTimeOffset`

Indexes:

- unique `(ModelId, GoogleResponseId)`
- `(ModelId, RespondentId)`
- `(ModelId, ResponseTimestamp)`

### NormalizedDataset

- `Id` GUID PK
- `ModelId` GUID FK to `ResearchModels.Id`
- `SurveyResponseId` GUID FK to `SurveyResponses.Id`
- `RespondentId` string nullable
- `NormalizedDataJson` nvarchar(max)
- `IsStale` bool default false
- `NormalizedAt` `DateTimeOffset`
- `CreatedAt` `DateTimeOffset`
- `UpdatedAt` `DateTimeOffset`

Indexes:

- unique `(ModelId, SurveyResponseId)`
- `(ModelId, RespondentId)`
- `(ModelId, IsStale)`
- `(ModelId, NormalizedAt)`

### DataCollectionLog

- `Id` GUID PK
- `ModelId` GUID FK to `ResearchModels.Id`
- `Status` string allowed values: `Success`, `Partial`, `Failed`
- `ResponsesCollected` int
- `ResponsesSkipped` int
- `ErrorMessage` string nullable
- `StartedAt` `DateTimeOffset`
- `CompletedAt` nullable `DateTimeOffset`
- `CreatedAt` `DateTimeOffset`

Indexes:

- `(ModelId, StartedAt)`
- `(ModelId, Status)`

Delete behavior:

- `ResearchModel -> SurveyResponses`: cascade delete is allowed because NCKH model deletion is user-owned and Phase 5 data belongs to the model.
- `ResearchModel -> NormalizedDatasets`: cascade delete is allowed.
- `ResearchModel -> DataCollectionLogs`: cascade delete is allowed.
- `SurveyResponse -> NormalizedDatasets`: restrict/no-action is preferred to avoid multiple cascade paths; delete normalized rows explicitly before raw response deletion if needed.

DB risk notes:

- JSON storage is acceptable for Phase 5 MVP because the normalized schema is model-specific and export is not implemented in this phase.
- Querying inside JSON should be avoided in Phase 5; list endpoints paginate rows and parse JSON in service code only where needed.
- Migration must be reversible and must not alter Phase 1/2/3/4 semantics.

## Required Implementation Safeguards

- Keep Google response integration outside model/variable services.
- Controllers own HTTP only; services own workflow and validation orchestration.
- No Google tokens or secrets in DTO responses.
- No new model lifecycle status.
- No export files or export endpoints.
- No scheduled/background behavior.
- No automatic response submission.
- Raw response data may contain personal data; avoid returning full raw JSON in default list responses.

## Deferred

- CSV/Excel/SPSS export
- frontend expansion
- scheduled data collection
- real-time sync
- Google Forms watches / Cloud Pub/Sub
- statistical analysis
- credit/pricing
- NCKH admin UI
- multi-researcher collaboration
- automatic response submission
- production-readiness claims without current runtime validation

## Approval Needed Before Implementation

Approve or revise these freeze decisions before assigning an implementation worker:

- preferred Google response-read scope: `https://www.googleapis.com/auth/forms.responses.readonly`
- route surface: collect, responses, normalize, dataset
- collection statuses: `Success`, `Partial`, `Failed`
- manual-only collection
- idempotency by `(ModelId, GoogleResponseId)`
- raw response, normalized dataset, and collection log persistence fields
- stale dataset behavior when variables/mappings change
- normalization rules and missing-data behavior

## Next Pass If Approved

Proceed to **Phase 5 Pass 1 - Google Response Collection Integration** only after this freeze is explicitly accepted.
