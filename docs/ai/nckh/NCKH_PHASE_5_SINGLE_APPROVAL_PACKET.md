# NCKH_PHASE_5_SINGLE_APPROVAL_PACKET

## Purpose

Collect the remaining NCKH Phase 5 approvals into one decision so implementation sub-agents can work without stopping for already-reviewed contract, Google scope, database, collection, or normalization choices.

This file is an approval packet. It does not mark Phase 5 as implemented or completed.

## One-Time Approval Statement

If the user approves this packet, the following are approved as the Phase 5 implementation baseline:

- Open NCKH Phase 5 implementation for backend-only Data Collection & Normalization.
- Use `NCKH_PHASE_5_CONTRACT_DB_FREEZE.md` as the authoritative Phase 5 contract, Google scope, and DB freeze baseline.
- Implement only manual response collection, raw response listing, normalization, and normalized dataset listing.
- Prefer Google Forms responses API with `https://www.googleapis.com/auth/forms.responses.readonly` for the Phase 5 MVP.
- Keep implementation backend-only unless a later explicit approval opens frontend work.

## Decisions Approved By This Packet

### Google Scope Contract

- Preferred response-read scope: `https://www.googleapis.com/auth/forms.responses.readonly`.
- Existing Phase 1 Forms body read consent and Phase 4 Forms body write consent must not be treated as response-read consent.
- If the stored Google token lacks the approved Phase 5 scope, return a re-consent-required error.
- `https://www.googleapis.com/auth/spreadsheets.readonly` remains an alternate path only if a later approval explicitly chooses linked Google Sheets collection.
- Google Sheets write scope and Drive-wide scopes remain Deferred.

### API Contract

Approved backend-only endpoints:

- `POST /api/v1/nckh/models/{modelId}/collect`
- `GET /api/v1/nckh/models/{modelId}/responses`
- `POST /api/v1/nckh/models/{modelId}/normalize`
- `GET /api/v1/nckh/models/{modelId}/dataset`

Collection response includes:

- `logId`
- `responsesCollected`
- `responsesSkipped`
- `status`
- `errorMessage`

Normalization response includes:

- `respondentsProcessed`
- `variablesComputed`
- `missingDataCount`
- `staleDatasetsMarked`

### Ownership And Readiness Contract

- Model must belong to the current authenticated user.
- Form must belong to the same user.
- Collection is allowed for `Draft` and `Active` models.
- Collection may store raw responses before mappings are complete.
- Normalization requires at least one observed mapping.
- Normalization processes mapped questions only.

### Collection Contract

- Collection is manual only.
- Each attempt writes one `DataCollectionLog`.
- Raw responses are upserted idempotently by `(ModelId, GoogleResponseId)`.
- Unchanged duplicates are skipped.
- Partial Google failures may preserve successful rows and mark the log `Partial`.
- Failed collection must not create fake response rows.
- No automatic response submission.

### Normalization Contract

- Raw responses remain the source of truth.
- Normalized rows are upserted per `(ModelId, SurveyResponseId)`.
- Observed columns use `ObservedQuestionMapping.ObservedCode`.
- Variable mean columns use `{VariableCode}_mean`.
- Likert means use simple arithmetic mean over non-null numeric observed values.
- Missing, blank, or unparseable values are stored as JSON null and counted.
- Nominal and ordinal values are preserved without invented statistical encoding.
- Statistical analysis remains Deferred.

### Persistence Contract

Approved new entities if implementation confirms they are absent and required:

- `SurveyResponse`
- `NormalizedDataset`
- `DataCollectionLog`

Approved key constraints:

- unique `(ModelId, GoogleResponseId)` on `SurveyResponses`
- unique `(ModelId, SurveyResponseId)` on `NormalizedDatasets`
- collection log status values: `Success`, `Partial`, `Failed`
- model-owned cascade for Phase 5 data tables
- restrict/no-action from `SurveyResponse` to `NormalizedDataset` if required to avoid multiple cascade paths

### Stale Dataset Contract

- Variable or mapping changes after normalized data exists must mark affected normalized rows stale.
- `normalize` may regenerate rows from raw responses and clear stale state for recomputed rows.
- Dataset listing must expose whether stale data exists.

## Approved Sub-Agent Flow

Use this order:

1. Google response collection integration workflow
2. API route and DTO implementation
3. Approved persistence changes and collection logging
4. Normalization service and dataset listing
5. Validation and closeout docs
6. Final review

Implementation workers must stop only for a real conflict with current source, failed Google scope/runtime configuration that cannot follow this packet, migration design that cannot follow this packet, or a validation blocker. They should not stop to re-ask the approved decisions above.

## Still Deferred

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

## Validation Required Before Closeout

Minimum required validation before Phase 5 can be marked completed:

- `dotnet build FormAutoHub.sln -c Release`
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release`
- `dotnet ef database update` if migrations are added
- authenticated HTTP smoke for collect, responses, normalize, and dataset endpoints
- live Google Forms responses smoke when credentials and approved scopes are available
- clear `Blocked` label if live Google validation cannot run because credentials/scopes/responses are unavailable
- log inspection after smoke checks
- smoke data cleanup

Not required unless frontend files change:

- `npm run build`
- Playwright/browser smoke
