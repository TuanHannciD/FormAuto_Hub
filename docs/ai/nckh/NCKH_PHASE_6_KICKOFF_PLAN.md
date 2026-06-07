# NCKH_PHASE_6_KICKOFF_PLAN

## Purpose

Define the approval-gated kickoff plan for NCKH Phase 6 so Export work can proceed without widening into frontend expansion, charting, statistical analysis, scheduled jobs, Google Sheets collection, credit, or admin UI.

This document is a planning and handoff artifact. It does not mark Phase 6 as implemented or completed.

## Phase Goal

Open the next post-Phase-5 implementation slice for the NCKH module:

- export the latest normalized dataset as CSV
- export an Excel codebook describing model variables and observed mappings
- export SPSS syntax for importing the CSV dataset
- keep export backend-only and read-only against existing Phase 5 data

Phase 6 is an export phase. It does not approve frontend tabs, charts, statistical calculations, report generation, automatic SPSS execution, scheduled export, Google Sheets collection, credit/pricing, admin UI, or automatic response submission.

## Current Repo Truth

- NCKH Phase 1 is completed for OAuth link and Google Forms read/import.
- NCKH Phase 2 is completed for model, variables, and observed question mappings.
- NCKH Phase 3 is completed for backend-only relations, node positions, and deterministic hypothesis output.
- NCKH Phase 4 is completed for backend-only Google Form generation/update.
- NCKH Phase 5 is completed for backend-only Data Collection & Normalization, with live Google response-read smoke blocked until credentials/consent/submitted responses are available.
- Phase 6 is the next proposed NCKH phase.
- Phase 6 implementation remains approval-gated until contract review and file-format review are accepted.
- Phase 5 closeout evidence is the dependency baseline for Phase 6 planning.

## Proposed Phase 6 Scope

In scope for this kickoff plan:

- authenticated researcher export for an owned research model
- CSV dataset export from `NormalizedDatasets.NormalizedDataJson`
- Excel codebook export from `ResearchVariables`, `ObservedQuestionMappings`, and `ResearchFormQuestions`
- SPSS syntax export that references the CSV dataset filename and normalized columns
- file responses only, without persisting export jobs or export history
- backend tests and authenticated HTTP smoke for the approved route surface

## Out Of Scope

Not allowed in Phase 6:

- frontend export UI or new dashboard tabs
- statistical analysis or statistical result reports
- Cronbach Alpha, EFA, regression, T-test, ANOVA, or charting
- automatic SPSS execution
- scheduled/background export jobs
- Google Sheets collection or Drive export
- Google Forms watches / Cloud Pub/Sub
- NCKH credit/pricing
- NCKH admin UI
- multi-researcher collaboration
- automatic response submission

## Entry Gates

Before any implementation worker starts, confirm all of the following:

1. The user explicitly approves opening NCKH Phase 6 implementation.
2. Contract review is completed for route surface, query values, content types, file names, and error behavior.
3. File-format review is completed for CSV, Excel codebook, and SPSS syntax contents.
4. DB review confirms Phase 6 does not require new tables or columns.
5. The flow does not silently pull in Phase 7-8 concerns.
6. `docs/ai/nckh` and `docs/vi/nckh` stay synced for any contract or phase-state change.

## Decisions To Freeze Before Code

1. Route surface
   - Proposed: one backend endpoint `GET /api/v1/nckh/models/{modelId}/export?format=csv|codebook|spss`.
   - Proposed: no POST export jobs and no persisted export records in Phase 6.

2. Ownership and readiness
   - Proposed: model must belong to the authenticated user.
   - Proposed: export requires at least one normalized dataset row.
   - Proposed: export returns conflict if normalized data is stale; user must re-run normalize first.

3. CSV dataset
   - Proposed: UTF-8 CSV with BOM for Excel compatibility.
   - Proposed: header order follows the dataset column order: `RespondentId`, observed codes, then variable mean columns.
   - Proposed: missing values export as empty cells.
   - Proposed: array values export as semicolon-separated values in one cell.

4. Excel codebook
   - Proposed: `.xlsx` file with sheets for variables, observed mappings, and export notes.
   - Proposed: no raw response payloads in the codebook.
   - Proposed: no statistical results in the codebook.

5. SPSS syntax
   - Proposed: `.sps` text file that imports the CSV filename produced by the API.
   - Proposed: include variable names, basic variable labels, and value/missing handling where safely derivable.
   - Proposed: do not invent value labels for nominal/ordinal questions unless option metadata exists.
   - Proposed: do not execute SPSS or generate statistical commands.

6. Persistence
   - Proposed: no new database entities, migrations, or export ledger in Phase 6.
   - Proposed: export is derived read-only from Phase 2 and Phase 5 tables.

## Contract Guardrails

- Do not treat proposed Phase 6 endpoints as implemented until the freeze is accepted and code exists.
- Do not add frontend export buttons or tabs in Phase 6.
- Do not add background jobs, Pub/Sub, watches, credit, pricing, admin UI, or statistical analysis.
- Do not expose `SurveyResponses.RawDataJson` in export files.
- Do not add new lifecycle statuses.

## Suggested Delivery Passes

### Pass 0 - Contract And File-Format Freeze

Goal:

- lock route surface, file formats, ownership/readiness rules, stale-data behavior, no-DB-change decision, and validation plan

Expected outputs:

- accepted `NCKH_PHASE_6_CONTRACT_DB_FREEZE.md`
- accepted `NCKH_PHASE_6_SINGLE_APPROVAL_PACKET.md`

### Pass 1 - Export Service And DTO/Result Plumbing

Goal:

- add only the service/controller behavior needed for approved read-only exports

Stop conditions:

- implementation requires a new DB table, export queue, frontend behavior, or statistical analysis

### Pass 2 - File Format Implementations

Goal:

- implement CSV, Excel codebook, and SPSS syntax generation from approved data sources

Stop conditions:

- requested codebook or SPSS content requires unmodeled option metadata or statistical output

### Pass 3 - Validation And Closeout Prep

Minimum validation target:

- `dotnet build FormAutoHub.sln -c Release`
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release`
- authenticated HTTP smoke for all three export formats
- verify response content type, filename, and non-empty file body
- inspect server logs after smoke checks

## Worker-Ready Handoff Prompts

### Worker A - Contract/File Freeze

"Review NCKH Phase 6 only. Do not write production code. Confirm export route surface, file formats, stale dataset behavior, no-DB-change decision, validation plan, and approval gaps. Separate Confirmed, Proposed, Assumption, Deferred, and Approval Needed."

### Worker B - Implementation

"Implement only the approved NCKH Phase 6 Export slice from `NCKH_PHASE_6_SINGLE_APPROVAL_PACKET.md`. Do not add frontend expansion, scheduled jobs, Google Sheets collection, credit, pricing, admin UI, charting, statistical analysis, or automatic SPSS execution. Add focused tests and runtime HTTP smoke coverage."

### Worker C - Review

"Review the NCKH Phase 6 slice for scope discipline, file-format correctness, stale-data safety, contract safety, no raw response exposure, validation honesty, and docs sync. Lead with findings."

## Documentation Sync Needed When Phase 6 Opens

If implementation is approved, keep these in sync:

- `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/vi/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/vi/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/ai/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/vi/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/ai/nckh/NCKH_API_CONTRACT_GUIDE.md`
- `docs/vi/nckh/NCKH_API_CONTRACT_GUIDE.md`

Do not mark Phase 6 completed from kickoff wording alone.

## Deferred

- frontend expansion
- scheduled export
- export history or export jobs
- Google Sheets collection
- Google Forms watches / Cloud Pub/Sub
- statistical analysis
- charting and reports
- automatic SPSS execution
- credit/pricing
- NCKH admin UI
- production-readiness claims without current runtime validation
