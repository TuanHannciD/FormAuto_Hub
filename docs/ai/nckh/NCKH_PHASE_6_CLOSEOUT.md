# NCKH_PHASE_6_CLOSEOUT

## Purpose

Record closeout evidence for the approved NCKH Phase 6 backend-only Export slice.

## Closeout Status

Status: **Completed for the approved backend-only Phase 6 scope**.

This closeout does not claim frontend export readiness, statistical analysis readiness, scheduled export readiness, or production performance readiness for large datasets.

## Implementation Summary

Implemented:

- `GET /api/v1/nckh/models/{modelId}/export?format=csv`
- `GET /api/v1/nckh/models/{modelId}/export?format=codebook`
- `GET /api/v1/nckh/models/{modelId}/export?format=spss`
- read-only export service over existing Phase 2 and Phase 5 data
- CSV dataset export from `NormalizedDatasets.NormalizedDataJson`
- Excel `.xlsx` codebook with `Variables`, `Mappings`, and `Notes` sheets
- SPSS `.sps` import syntax generation without `EXECUTE` or statistical commands
- stale normalized dataset conflict guard
- no new database tables, columns, migrations, export jobs, export history, credit behavior, or Google calls

## Files Changed

Main implementation files:

- `src/FormAutoHub.Api/Contracts/NckhDtos.cs`
- `src/FormAutoHub.Api/Controllers/Nckh/ResearchDataController.cs`
- `src/FormAutoHub.Api/Services/Nckh/ResearchExportService.cs`
- `src/FormAutoHub.Api/Program.cs`
- `tests/FormAutoHub.Tests/NckhPhase6ExportServiceTests.cs`

Documentation updates:

- `docs/ai/nckh/NCKH_PHASE_6_CLOSEOUT.md`
- `docs/vi/nckh/NCKH_PHASE_6_CLOSEOUT.md`
- `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/vi/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/vi/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/ai/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/vi/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/ai/nckh/NCKH_API_CONTRACT_GUIDE.md`
- `docs/vi/nckh/NCKH_API_CONTRACT_GUIDE.md`
- `docs/ai/AI_DOC_ROUTING_MATRIX.md`
- `docs/vi/AI_DOC_ROUTING_MATRIX.md`

## API Contract Finalized

Implemented endpoint:

- `GET /api/v1/nckh/models/{modelId}/export?format=csv|codebook|spss`

Format values:

- `csv`
- `codebook`
- `spss`

Response content types:

- CSV: `text/csv; charset=utf-8`
- Codebook: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- SPSS syntax: `text/plain; charset=utf-8`

Status behavior:

- `400`: missing or unsupported export format
- `401`: unauthenticated request
- `404`: model not found in current user's scope
- `409`: no normalized dataset rows, or normalized data is stale and must be regenerated

## Database Contract Finalized

No database changes were added in Phase 6.

Confirmed:

- no new tables
- no new columns
- no EF Core migration
- no export job/history table
- no credit/pricing or usage ledger behavior for NCKH export

## Validation Performed

Verified:

- `dotnet build FormAutoHub.sln -c Release` passed.
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build` passed: 142 passed, 0 failed.
- EF Core database update applied existing migrations through Phase 5 to temporary LocalDB database `FormAutoHubNckhPhase6Smoke2`; no Phase 6 migration was created.
- Authenticated HTTP smoke passed on `http://127.0.0.1:5237` with a real JWT from `/api/auth/register` or `/api/auth/login`.
- Runtime smoke seeded an owned NCKH form, model, questions, variable, mappings, survey response, and normalized dataset.
- Runtime smoke verified CSV export returns `200 OK`, `text/csv; charset=utf-8`, expected attachment filename, and non-empty body.
- Runtime smoke verified codebook export returns `200 OK`, `.xlsx` content type, expected attachment filename, and non-empty body.
- Runtime smoke verified SPSS export returns `200 OK`, `text/plain; charset=utf-8`, expected attachment filename, non-empty body, `GET DATA` syntax, and no `EXECUTE` command.
- Runtime smoke verified stale normalized dataset export returns `409 Conflict`.
- Server logs were inspected after smoke. No fatal error was observed.
- Temporary smoke database was dropped, smoke files were removed, and the API smoke process was stopped after validation.

## Validation Not Performed

Not run:

- Frontend build and Playwright smoke, because Phase 6 is backend-only and no frontend file changed.
- Live Google Forms response collection, because Phase 6 does not call Google APIs.
- Production large-dataset performance/streaming validation, because Phase 6 MVP generates files in memory.
- SPSS execution, because automatic SPSS execution is Deferred.

## Scope Alignment

Kept in scope:

- backend-only export route
- CSV dataset export
- Excel codebook export
- SPSS import syntax export
- stale dataset conflict behavior
- no-DB-change implementation

Kept out of scope:

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

## Residual Risks

- Large datasets may need streaming or paging in a later approved performance hardening slice.
- SPSS syntax is import-focused and intentionally does not include statistical commands or generated value labels without option metadata.
- The `.xlsx` codebook is generated without adding a package; future formatting improvements can be handled in a UI/export polish slice.

## Next Candidate

Next implementation candidate: **NCKH Phase 7 - Frontend Expansion**.

Phase 7 kickoff, UI/contract freeze, and single approval packet have been prepared after this closeout. Phase 7 implementation still requires separate approval before code changes.
