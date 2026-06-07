# NCKH_PHASE_6_SINGLE_APPROVAL_PACKET

## Purpose

Collect the remaining NCKH Phase 6 approvals into one decision so implementation sub-agents can work without stopping for already-reviewed route, file-format, stale-data, and no-DB-change choices.

This file is an approval packet. It does not mark Phase 6 as implemented or completed.

## One-Time Approval Statement

If the user approves this packet, the following are approved as the Phase 6 implementation baseline:

- Open NCKH Phase 6 implementation for backend-only Export.
- Use `NCKH_PHASE_6_CONTRACT_DB_FREEZE.md` as the authoritative Phase 6 contract, file-format, and DB freeze baseline.
- Implement only CSV dataset export, Excel codebook export, and SPSS syntax export.
- Keep implementation backend-only unless a later explicit approval opens frontend work.
- Do not add DB tables, DB columns, export jobs, or export history in Phase 6.

## Decisions Approved By This Packet

### API Contract

Approved backend-only endpoint:

- `GET /api/v1/nckh/models/{modelId}/export?format=csv|codebook|spss`

Approved format values:

- `csv`
- `codebook`
- `spss`

### Ownership And Readiness Contract

- Model must belong to the current authenticated user.
- Export reads existing normalized data only.
- Export requires at least one normalized dataset row.
- Export returns `409 Conflict` when normalized data is stale.
- Export must not trigger Google calls, collection, normalization, or submission.

### CSV Contract

- UTF-8 with BOM.
- Header order follows dataset columns.
- Null values become empty cells.
- Numeric values use invariant-culture formatting.
- Array values become semicolon-separated cell values.
- Full raw response JSON must not be exported.

### Excel Codebook Contract

- Generate `.xlsx` codebook.
- Include `Variables`, `Mappings`, and `Notes` sheets.
- Include model/variable/mapping metadata only.
- Do not include raw responses, Google tokens, or statistical outputs.

### SPSS Syntax Contract

- Generate `.sps` syntax referencing the CSV filename.
- Include import syntax, variable names, and labels where safely derivable.
- Do not invent value labels when option metadata is unavailable.
- Do not include statistical commands.
- Do not execute SPSS.

### Persistence Contract

- No new database entities.
- No new EF Core migration.
- No export job/history table.
- No credit/pricing or usage ledger behavior for NCKH export in Phase 6.

## Approved Sub-Agent Flow

Use this order:

1. Export controller/service route
2. CSV dataset generation
3. Excel codebook generation
4. SPSS syntax generation
5. Tests and authenticated HTTP smoke
6. Closeout docs and final review

Implementation workers must stop only for a real conflict with current source, missing package capability for `.xlsx` generation that cannot be handled in the approved backend stack, file-format ambiguity that cannot follow this packet, or a validation blocker.

## Still Deferred

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

## Validation Required Before Closeout

Minimum required validation before Phase 6 can be marked completed:

- `dotnet build FormAutoHub.sln -c Release`
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release`
- authenticated HTTP smoke for `csv`, `codebook`, and `spss` exports
- verify response content type, filename, and non-empty body for each format
- verify stale dataset conflict behavior
- inspect server logs after smoke checks
- smoke data cleanup

Not required unless frontend files change:

- `npm run build`
- Playwright/browser smoke
