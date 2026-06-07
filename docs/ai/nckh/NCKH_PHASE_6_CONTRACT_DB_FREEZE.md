# NCKH_PHASE_6_CONTRACT_DB_FREEZE

## Purpose

Record the Pass 0 contract, file-format, and database freeze review for NCKH Phase 6 before any production implementation starts.

This file is a review and approval artifact. It does not mark Phase 6 as implemented or completed.

## Review Result

Status: **Ready for explicit Phase 6 implementation approval after user accepts the freeze decisions below**.

Phase 6 may proceed to implementation only after this freeze is accepted. Until then, export route behavior, file formats, content types, stale-data policy, and no-DB-change decision remain proposed.

## Source Evidence Read

- `NCKH_PROGRESS_LEDGER.md`
- `NCKH_PHASE_TRANSITION_GUIDE.md`
- `NCKH_PHASE_ROADMAP.md`
- `NCKH_PHASE_5_CLOSEOUT.md`
- `NCKH_PHASE_6_KICKOFF_PLAN.md`
- `NCKH_DOMAIN_ENTITIES_OVERVIEW.md`
- `NCKH_API_CONTRACT_GUIDE.md`
- `NCKH_MODULE_MAP.md`
- `NCKH_ARCHITECTURE_BOUNDARIES.md`

## Current Confirmed Baseline

- NCKH Phase 1 through Phase 5 are completed for their approved scopes.
- Existing route prefix is `/api/v1/nckh`.
- Phase 5 provides `NormalizedDatasets`, `SurveyResponses`, and dataset listing.
- Phase 6 must not add frontend expansion, scheduled jobs, export queues, Google Sheets collection, credit, admin UI, charting, or statistical analysis.
- Current implemented `ResearchModel.Status` values are `Draft` and `Active` only.
- `Archived` remains Deferred.

## Freeze Decision: Phase 6 Route Surface

Approval status: **Proposed for Phase 6 implementation approval**.

Endpoint:

- `GET /api/v1/nckh/models/{modelId}/export?format=csv|codebook|spss`

Formats:

- `csv`: normalized dataset CSV
- `codebook`: Excel `.xlsx` codebook
- `spss`: SPSS `.sps` syntax

No request body.

Expected status mapping:

- `200`: export file generated
- `400`: missing or unsupported `format`
- `401`: unauthenticated request
- `404`: model not found in current user's scope
- `409`: no normalized dataset rows, or normalized data is stale and must be regenerated

## Freeze Decision: File Responses

Approval status: **Proposed for Phase 6 implementation approval**.

Response content types:

- CSV: `text/csv; charset=utf-8`
- Codebook: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- SPSS syntax: `text/plain; charset=utf-8`

Recommended filenames:

- `nckh-model-{modelId}-dataset.csv`
- `nckh-model-{modelId}-codebook.xlsx`
- `nckh-model-{modelId}-spss.sps`

The service may sanitize model names later, but Phase 6 does not require model-name filenames.

## Freeze Decision: Ownership And Readiness

Approval status: **Proposed for Phase 6 implementation approval**.

Rules:

- The model must belong to the current authenticated user.
- Export reads only existing Phase 2 and Phase 5 data.
- Export requires at least one `NormalizedDataset` row.
- Export must return `409 Conflict` if any normalized dataset row for the model is stale.
- Export must not trigger collection, normalization, Google API calls, or submission.

## Freeze Decision: CSV Dataset

Approval status: **Proposed for Phase 6 implementation approval**.

Rules:

- Encode as UTF-8 with BOM for Excel compatibility.
- Header order follows dataset listing columns: `RespondentId`, observed codes, then variable mean columns.
- Each `NormalizedDataset` row becomes one CSV row.
- Missing/null values export as empty cells.
- Numeric JSON values export with invariant-culture decimal formatting.
- Array values export as semicolon-separated values inside one quoted cell.
- Do not include full `SurveyResponses.RawDataJson`.

## Freeze Decision: Excel Codebook

Approval status: **Proposed for Phase 6 implementation approval**.

Rules:

- Generate `.xlsx` without adding DB persistence.
- Include a `Variables` sheet with variable code, name, type, scale type, scale point, min/max, and sort order.
- Include a `Mappings` sheet with variable code, observed code, Google question ID, question text, question type, required flag, and sort order.
- Include a `Notes` sheet with model ID, export timestamp, dataset stale status, and Deferred-statistics note.
- Do not include raw response JSON or Google tokens.
- Do not include statistical analysis outputs.

## Freeze Decision: SPSS Syntax

Approval status: **Proposed for Phase 6 implementation approval**.

Rules:

- Generate `.sps` text that imports the CSV filename produced by the CSV export contract.
- Include variable names using normalized column names.
- Include variable labels from variable names and observed question text where safely derivable.
- Treat mean columns as numeric.
- Treat text/nominal/ordinal observed columns conservatively as string unless numeric parsing is safe by scale type.
- Do not invent value labels when option metadata is unavailable.
- Do not include statistical commands such as RELIABILITY, FACTOR, REGRESSION, T-TEST, ONEWAY, or GLM.
- Do not execute SPSS.

## Freeze Decision: Persistence

Approval status: **Proposed for Phase 6 implementation approval**.

Rules:

- No new tables.
- No new columns.
- No EF Core migration.
- No export job table.
- No export history table.
- No credit or usage ledger entry for NCKH export in Phase 6.

DB risk notes:

- Export reads JSON from `NormalizedDatasets.NormalizedDataJson`; large datasets may require streaming later, but Phase 6 MVP can generate files in memory for the current backend-only scope.
- If production datasets become large, introduce paging/streaming in a later explicitly approved performance hardening slice.

## Required Implementation Safeguards

- Controllers own HTTP/file response handling only.
- Services own export workflow and file generation.
- Do not return framework-specific HTTP results from services.
- Do not expose raw response JSON by default.
- Do not add Google scopes or Google API calls.
- Do not add frontend routes.

## Deferred

- frontend export UI
- export jobs/history
- scheduled export
- Google Sheets collection
- Google Drive export
- statistical analysis
- charting and reports
- automatic SPSS execution
- credit/pricing
- NCKH admin UI
- multi-researcher collaboration
- production-readiness claims without current runtime validation

## Approval Needed Before Implementation

Approve or revise these freeze decisions before assigning an implementation worker:

- route surface: `GET /api/v1/nckh/models/{modelId}/export?format=csv|codebook|spss`
- content types and filenames
- stale dataset conflict behavior
- CSV header/value formatting
- Excel codebook sheet contents
- SPSS syntax boundaries
- no-DB-change decision

## Next Pass If Approved

Proceed to **Phase 6 Pass 1 - Export Service And File Generation** only after this freeze is explicitly accepted.
