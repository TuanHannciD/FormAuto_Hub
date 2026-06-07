# NCKH_PHASE_5_KICKOFF_PLAN

## Purpose

Define the approval-gated kickoff plan for NCKH Phase 5 so Data Collection & Normalization work can proceed without widening into export, frontend expansion, scheduled sync, Google Forms watches, statistics, credit, or admin UI.

This document is a planning and handoff artifact. It does not mark Phase 5 as implemented or completed.

## Phase Goal

Open the next post-Phase-4 implementation slice for the NCKH module:

- manually collect submitted Google Form responses for an owned research model
- store raw responses idempotently
- log each collection attempt
- normalize raw answer values into observed-code columns based on approved mappings
- compute simple variable-level Likert means
- expose backend-only APIs for collect, raw response listing, normalize, and dataset listing

Phase 5 is a backend-only data phase. It does not approve export files, frontend tabs, scheduled pull, real-time sync, Google Forms watches, Cloud Pub/Sub, statistical analysis, NCKH credit/pricing, admin UI, or automatic response submission.

## Current Repo Truth

- NCKH Phase 1 is completed for OAuth link and Google Forms read/import.
- NCKH Phase 2 is completed for model, variables, and observed question mappings.
- NCKH Phase 3 is completed for backend-only relations, node positions, and deterministic hypothesis output.
- NCKH Phase 4 is completed for backend-only Google Form generation/update, with live Google write smoke blocked until credentials/write consent are available.
- Phase 5 is the next proposed NCKH phase.
- Phase 5 implementation remains approval-gated until contract review, DB review, and Google response-read scope review are accepted.
- Phase 4 closeout evidence is the dependency baseline for Phase 5 planning.

## Proposed Phase 5 Scope

In scope for this kickoff plan:

- manual response collection initiated by an authenticated researcher
- Google response read integration behind the existing NCKH auth boundary
- request/response DTOs for collection, raw response listing, normalization, and dataset listing
- persistence changes only if approved in `NCKH_PHASE_5_CONTRACT_DB_FREEZE.md`
- idempotent raw response upsert by Google response ID
- collection logging with success, partial, and failed outcomes
- normalization from `SurveyResponses.RawDataJson` into `NormalizedDatasets.NormalizedDataJson`
- simple Likert mean calculation across mapped observed items for each variable
- missing data represented as JSON null
- backend tests and authenticated HTTP smoke for the approved route surface

## Out Of Scope

Not allowed in Phase 5:

- CSV, Excel, or SPSS export
- frontend expansion or React Flow work
- scheduled pull, background jobs, watches, Pub/Sub, or real-time sync
- automatic response submission
- Google Form create/update changes beyond using Phase 4 output as input data
- statistical analysis beyond simple arithmetic mean for Likert variables
- charting, reports, Cronbach Alpha, EFA, regression, T-test, ANOVA
- NCKH credit/pricing
- NCKH admin UI
- multi-researcher collaboration

## Entry Gates

Before any implementation worker starts, confirm all of the following:

1. The user explicitly approves opening NCKH Phase 5 implementation.
2. Contract review is completed for routes, DTOs, response shapes, collection statuses, and error behavior.
3. DB review is completed for new entities, relationships, delete behavior, indexes, migrations, JSON storage, and rollback behavior.
4. Google response-read scope is explicitly approved for Phase 5 runtime configuration.
5. The flow does not silently pull in Phase 6-8 concerns.
6. `docs/ai/nckh` and `docs/vi/nckh` stay synced for any contract or phase-state change.

## Decisions To Freeze Before Code

1. Google response authorization
   - Candidate scope: `https://www.googleapis.com/auth/forms.responses.readonly` for reading Google Form responses through the Forms API.
   - Alternative scope for spreadsheet-backed collection: `https://www.googleapis.com/auth/spreadsheets.readonly` if implementation chooses linked Google Sheets response spreadsheets.
   - Freeze recommendation: prefer Forms responses API first for Phase 5 MVP to avoid requiring spreadsheet discovery and extra Sheets file assumptions.
   - Deferred: Google Sheets implementation unless explicitly selected in the freeze.

2. Collection target
   - Proposed: collect responses for the model's current `ResearchForm.GoogleFormId`.
   - Proposed: require the model and form to belong to the current user.
   - Proposed: allow `Draft` and `Active` models because response collection does not mutate model structure.

3. Deduplication
   - Proposed: upsert by `(ModelId, GoogleResponseId)`.
   - Proposed: repeated collection skips unchanged responses and updates changed raw payloads if Google timestamps indicate a newer submission state.

4. Logging
   - Proposed statuses: `Success`, `Partial`, `Failed`.
   - Proposed: every collection attempt writes one `DataCollectionLog`, even when Google returns no new responses.

5. Normalization
   - Proposed: normalize only mapped questions.
   - Proposed: output columns use `ObservedQuestionMapping.ObservedCode` and variable-level mean columns use `{VariableCode}_mean`.
   - Proposed: missing or unparseable answer values are stored as JSON null and counted as missing data.
   - Proposed: Likert means are simple arithmetic means across non-null mapped observed values.

6. Stale dataset behavior
   - Proposed: changing variables or mappings after normalized data exists marks affected model datasets stale in Phase 5 implementation.
   - Proposed: `normalize` may regenerate the latest dataset rows and clear stale state for processed respondents.

7. Persistence
   - Decision needed: exact entity fields for `SurveyResponses`, `NormalizedDatasets`, and `DataCollectionLogs`.
   - Do not add database fields until DB review approves exact names and semantics.

## Contract Guardrails

- Do not treat proposed Phase 5 endpoints in `NCKH_API_CONTRACT_GUIDE.md` as final until the freeze is accepted.
- Do not enable Google response-read or Sheets scope without explicit approval and runtime configuration.
- Do not add export endpoints or files in Phase 5.
- Do not add scheduled jobs, Pub/Sub, watches, frontend tabs, credit/pricing, admin UI, or statistical analysis.
- Do not store Google OAuth tokens or raw respondent data in DTOs beyond approved response payloads.

## Suggested Delivery Passes

### Pass 0 - Contract And DB Freeze

Goal:

- lock route surface, request/response shapes, Google scope, persistence fields, delete behavior, indexes, stale-data behavior, and validation plan

Expected outputs:

- accepted `NCKH_PHASE_5_CONTRACT_DB_FREEZE.md`
- accepted `NCKH_PHASE_5_SINGLE_APPROVAL_PACKET.md`

### Pass 1 - Google Response Collection Integration

Goal:

- add only the integration behavior needed for approved manual response collection

Stop conditions:

- Google response-read scope is unclear
- implementation requires Sheets, Drive, scheduled jobs, or frontend behavior outside the freeze

### Pass 2 - Raw Response Persistence And Logging

Goal:

- implement approved raw response upsert and collection log behavior

Stop conditions:

- deduplication cannot be satisfied by approved identifiers
- transaction boundaries cannot preserve log honesty

### Pass 3 - Normalization Service And Dataset API

Goal:

- normalize mapped answers into observed-code columns and simple Likert means

Stop conditions:

- requested computation becomes statistical analysis rather than normalization
- mappings are stale or ambiguous without an approved conflict policy

### Pass 4 - Validation And Closeout Prep

Minimum validation target:

- `dotnet build FormAutoHub.sln -c Release`
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release`
- `dotnet ef database update` if migrations are added
- authenticated HTTP smoke for collect, responses, normalize, and dataset routes
- live Google Forms responses smoke only when valid credentials/scopes are available
- log inspection after smoke checks

## Worker-Ready Handoff Prompts

### Worker A - Contract/DB Freeze

"Review NCKH Phase 5 only. Do not write production code. Confirm Google response-read scope, manual collection workflow, route surface, DTOs, persistence fields, deduplication, logging, normalization, stale dataset behavior, validation plan, and remaining approval gaps. Separate Confirmed, Proposed, Assumption, Deferred, and Approval Needed."

### Worker B - Implementation

"Implement only the approved NCKH Phase 5 Data Collection & Normalization slice from `NCKH_PHASE_5_SINGLE_APPROVAL_PACKET.md`. Do not add export, frontend expansion, scheduled jobs, Pub/Sub, watches, credit, pricing, admin UI, or statistical analysis. Add focused tests and runtime smoke coverage."

### Worker C - Review

"Review the NCKH Phase 5 slice for scope discipline, Google scope safety, idempotency, normalization correctness, contract safety, migration risk, validation honesty, and docs sync. Lead with findings."

## Documentation Sync Needed When Phase 5 Opens

If implementation is approved, keep these in sync:

- `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/vi/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/vi/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/ai/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/vi/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- Phase 5 contract/entity/API docs if the approved surface changes

Do not mark Phase 5 completed from kickoff wording alone.

## Deferred

- CSV/Excel/SPSS export
- frontend expansion
- scheduled data collection
- real-time sync
- Google Forms watches / Cloud Pub/Sub
- statistical analysis
- credit/pricing
- NCKH admin UI
- automatic response submission
- production-readiness claims without current runtime validation
