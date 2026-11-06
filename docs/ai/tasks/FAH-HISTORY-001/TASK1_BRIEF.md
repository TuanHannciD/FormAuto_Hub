# Task 1 brief — FAH-HISTORY-001

Read this first: these are your requirements.

Work in D:/TinHoc/FormAuto_Hub. Read README, AGENTS, authority/execution/routing, and the approved spec docs/ai/tasks/FAH-HISTORY-001/INDEX.md (VI paired). Read only Task 1 plus Global Constraints/file map/proposed interfaces from IMPLEMENTATION_PLAN.md, not other task implementation steps.

Execute Task 1 only: produce paired CONTRACTS.md, DB_REVIEW.md, CUTOVER.md in docs/ai/tasks/FAH-HISTORY-001 and docs/vi/tasks/FAH-HISTORY-001. Read actual relevant source/entities/DTO/integration/tests to substantiate choices. These documents are concrete proposals for review, not permission to implement production code or update canonical docs. No external provider/network calls, DB mutations, startup, install, commit/push/deploy/cleanup.

Task 1 deliverables:
1. Exact proposed owner-scoped history list/detail routes, command send/fingerprint/response IDs/confirmation, generation fee/hold/settlement DTOs, 400/404/409 behavior; page>=1, pageSize1..20 default10, stable time/id ordering.
2. Exact proposed schema fields/types/nullability/keys/lengths/indexes/FKs: batch, immutable job items, reservation/event evidence, settlement unique attempt->ledger, legacy policy. No cascading ledger/audit deletion. Consistent lock order user/account -> project -> batch -> item for all spend paths; explain EF retry/idempotency transaction boundaries.
3. State transition matrix planned/possible dispatch/outcome/settlement/release/unknown. Distinguish unknown from failed, no auto-retry or TTL release, command replay read-only. Finalize proposed C# interfaces/types for Tasks2–5.
4. Legacy first-success entitlement: known unattempted retains prepaid free first send; previously successful pays on resend. For confirmed failure without success propose prepaid first-success entitlement retained, consumed atomically on success, explicitly a new decision requiring user review, not adopted silently. Unknown requires reconciliation.
5. Read-only form compatibility criteria; inspect GoogleFormsClient and define testable success/rejected/unknown evidence. Current 2xx/302 alone is insufficient. Do not invent reliable Google receipt support; identify inability to prove success candidly and propose fail-closed support/evidence constraints.
6. Cutover quiesce/drain, proven legacy grouping/backfill without timestamp guessing, old client/resume behavior, operator reconciliation policy/evidence/authorization and activation gates. Keep physical purge/NCKH/official Google API/worker out of scope.
7. Report any unresolved user decisions compactly with recommendation, reason and consequence. Self-review English/Vietnamese equivalence, links UTF-8, max400 lines per file, pricing0/1/2+send1, quota20, 1–100/batch10. Do not ask the human yourself; report to root.

Author report: write paired TASK1_REPORT.md in same dossiers with Summary/Files/Scope/Validation performed/not performed/Risks/Next. Return only status, file list, one-line checks and specific concerns/decisions. Root will dispatch fresh independent review. Do not create agents, not even reviewers. Do not edit PROGRESS.md or other authored task docs.
