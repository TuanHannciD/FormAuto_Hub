# Task 4 — Local implementation report

## Summary

Implemented approved FAH-HISTORY-001 Task4 locally in `fah-history-001`, base `df5cce54f4a8516ab9dd0bf2b5dff561c1cb8d5c`. Current state after R1 I1 fix round1: source/tests/report are frozen for fresh scoped R2 review. The original implementation evidence below is pre-R1 history; the final section supersedes current counts/hash and records the fix. This is an author handoff, not Done, integration or release. All Task2/3 work/evidence was preserved. No nested agents, install, live provider, process/listener, commit or deployment.

V2 admission now snapshots/reserves and dispatches only after an acknowledged PossibleDispatch commit; settlement uses typed immutable evidence. Direct rules generates an affordable zero-fee batch and reserves successful-send fees atomically. Replay never refreshes compatibility, generates, holds, debits, logs or takes over a runner. Production paid sending remains blocked: current parser cannot prove complete metadata and current Google body/status/redirect cannot prove a receipt.

## Files changed

28 Task4 source/test files (19 production, 9 tests) with before/after SHA256 are listed in `artifacts/reports/fah-history-001/task4-final-manifest.json`; manifest SHA256 **221679bbdc5b17cd994030e38032832ca3d2731d6657f298af3fde60364f2446**. Baseline is the47-file starting manifest plus working-tree-filtered HEAD for previously clean tracked files.

- Contracts: `Phase3Dtos.cs`, new `SubmissionCompatibilityDtos.cs`: exact v2 request primary constructors, read-only job fees/items/counters. No public legacy mutating overload remains.
- Controllers: `SubmissionsController.cs`, `GeneratedResponsesController.cs`, `AiResponsesController.cs`, new `GenerationContractFence.cs`: typed HTTP codes/ProblemDetails, no-store and owner-first generation version fence.
- Integrations/DI: `GoogleFormsClient.cs`, new `GoogleSubmissionEvidence.cs`, `Program.cs`: typed outcome boundary, strict HTTPS target identity, one POST/no automatic redirects, bounded body hash/redirect trace, Unknown for all unproven real receipts; fail-closed compatibility registration.
- Services: `SubmissionService.cs`, `SubmissionAdmission.cs`, `DirectRuleSubmissionService.cs`, new `SubmissionCompatibilityService.cs`/`SubmissionContractException.cs`, `CreditReservationService.cs`, `SubmissionSettlementService.cs`, `SubmissionItemMutation.cs`; minimal `ResponseGenerationService.cs` removal of transitional direct price1 and `AiGenerationService.cs` owner query for controller fence. No model/schema/migration change.
- Tests: `DirectRuleSubmissionServiceTests.cs`, `DirectRuleSubmissionSqlServerTests.cs`, `FahErrSubmissionPersistenceTests.cs`, `GenerationHistorySqlTests.cs`, `Phase3FormAutomationTests.cs`; new `SubmissionV2Tests.cs`, `SubmissionV2Fixture.cs`, `GenerationHistorySubmissionSqlTests.cs`, `GoogleFormsOutcomeTests.cs`.
- Paired reports here/`docs/vi`; prior checkpoint content retained as `artifacts/reports/fah-history-001/task4-checkpoint-{ai,vi}.md`; every RED/intermediate log retained.

## Scope alignment

Owner authorization precedes project validation/activity; exact server fingerprint/replay, selected1–100 distinct IDs and confirmation/duplicate warning, batch membership/expiry and proven legacy eligibility are revalidated under Users/account→projects→batch→response/item locks. Available is rechecked; immutable snapshots and hold survive logical eviction. Direct rules retains one action with affordable floor(Available/1), no second confirmation; rules generation0/AI1/2 remains.

Provider I/O is outside SQL transactions/retries. Confirmed synthetic success settles its own hold once, rejection releases, Unknown holds/fences/stops. Pause/cancel requests only control; runner acknowledgement releases Planned only. Counters, RunnerAcknowledgedAt, FinishedAt and active predicate retain exact v2/legacy meanings; reconciliation does not rewrite operational history. No resume endpoint/worker.

Legacy Available claims first success prepaid0, consumes once, restores after confirmed rejection, and retains claim on Unknown; consumed entitlement cannot reopen. Old Success/Failed bool logs without terminal classification fail `OutcomeUnresolved`. No timestamp grouping, backfill, fabricated historical hold/ledger or operator mutation tool. No-hold reconciliation tooling remains Deferred; these items never enter ordinary settlement.

## Validation performed

Date2026-11-05; this worktree; Release/cached dependencies; no restore/install. Commands exit0 unless explicitly historical RED below. Logs under `artifacts/reports/fah-history-001/`.

| Status | Command/result/artifact |
|---|---|
| Verified | `dotnet build FormAutoHub.sln -c Release --no-restore`:0 errors,3 existing NU1603 warnings; `task4-final-build4.log`. |
| Verified | `dotnet test FormAutoHub.sln -c Release --no-restore`:**387 passed/0 failed/46 opt-in skipped**,433 total; `task4-final-test4.log`. |
| Verified | Exact guarded localhost / DESKTOP-TS5JR7L / `FormAutoHub_History_Safety_20261104`; filter `FullyQualifiedName~GenerationHistorySubmissionSqlTests`:**7 passed/0 failed/skipped**; `task4-final-sql-safety3.log`. |
| Verified | Same Safety DB; filter `GenerationHistorySqlTests|GenerationCreditReservationSqlTests|GenerationCreditReservationConsumerSqlTests`:**23 passed/0 failed/skipped**; `task4-final-sql-regression.log`. Thus30 distinct Safety SQL tests across the two runs. |
| Verified | Exact guarded Baseline `FormAutoHub_History_Baseline_20261105`; filter `GenerationCreditReservationMigrationTests`:**1 passed/0 failed/skipped**; `task4-final-sql-baseline.log`. No new migration or DB reset. |
| Verified | `GoogleFormsOutcomeTests`:18 passed (`task4-google-outcomes2.log`); HTTP control mapping1 passed (`task4-control-http-green2.log`), also included in full suite. |
| Verified | EF `has-pending-model-changes --project src/FormAutoHub.Api --configuration Release --no-build`:none (`task4-final-pending4.log`); `git diff --check`:0 whitespace errors (`task4-final-diff4.log`, harmless LF normalization warning). |

SQL independently counts10 receiver invocations,7 debit transactions,7 item usage rows,10 submission logs,30 reservation events,1 held/2 released for7success/2reject/1Unknown. Reordered exact command replay does not add provider/compatibility/accounting activity; a deliberate new confirmed warning-accepted resend costs1. Direct rollback proves batch/generation/hold/job/usage roll back together. Two projects contend over Available while first job can settle its own hold at Available0. In-flight pause/cancel and concurrent append/eviction preserve snapshots; only Planned releases after acknowledgement. Integrated SQL legacy success/rejection/Unknown replay preserves entitlement and no double charge.

| Injected SQL fault | Receiver calls | Debits | Outstanding | Durable state / active fence |
|---|---:|---:|---:|---|
| admission commit ack lost |0|0|1|Running/Planned; ack=null, finish=null; active |
| pre-call save fails |0|0|0|Failed/NotDispatched; ack/finish set; inactive |
| pre-call commit ack lost |0|0|1|Failed/PossibleDispatch; ack/finish set; active |
| post-receiver outcome save fails |1|0|1|Failed/PossibleDispatch; ack/finish set; active |
| post-receiver outcome commit ack lost |1|1|0|Completed/Succeeded; ack/finish set; inactive |

Exact ISO runner acknowledgement/finish values and evaluated active predicate are printed in `task4-final-sql-safety3.log`. Unknown7/2/1 ends Failed with ack/finish set and active=true. Paused acknowledgement keeps finish=null/active=true; explicit cancel then sets finish and clears fence when no unresolved item remains.

RED evidence is actual behavior, not compile errors: `task4-red-boundaries.log`4 failures; `task4-red-admission.log`3fail/3pass; `task4-red-cutover-expiry.log`2fail/9pass; `task4-red-insufficient.log`1fail; `task4-red-owner-selection.log`2fail; `task4-red-legacy-classification.log`2fail; `task4-red-control-http.log`1fail. Intermediate full39 failures and later green counts remain historical in their logs. Initial compile-only test edits are not claimed as TDD proof.

Regression migration preserves original intent/case counts: Direct24 cases now check per-item fees/holds, fingerprint conflict and GET-only legacy recovery; FahErr14 cases retain fault/inner-cause/transport/cancellation/control and NCKH tests, with per-item usage and Unknown semantics; Phase3 six send cases use v2 and explicit resends. Older Direct SQL callers/assertions now use v2, synthetic verified outcomes, prepaid common selection, own-hold/lost-ack projections and in-flight control. Original old DB name/guards remain unchanged and were not opened. Their current equivalent coverage maps to Task4 Safety tests: rejected atomic admission/direct rollback; owner/replay/active guard; same/different command; shared account/two project; pause/cancel/eviction; five fault phases. No old success assertion depends on version0.

## Validation not performed

- Not run:46 opt-in cases in full run.30 Safety+1 Baseline ran separately; remaining15 older SQL cases require their own owners/databases and were not taken over. Migrated old Direct SQL tests compile but are not claimed as executed.
- Not run: API restart/authenticated HTTP, browser rendering/hydration/chunks and actual provider behavior. Brief forbids API startup/new process; runnable integration gate remains open for root/Task6.
- Blocked: accepted real Google metadata/receipt provenance and operator reconciliation adequacy. Synthetic typed receiver proves local mechanics only; production compatibility and result classifier remain fail-closed.
- Pending: fresh independent safety/credit review by root. Self-review is not independent review.

## Risks / Deferred items

Real public Google parser cannot prove full inventory/required/options/validation/constraints/receipt facts; `SubmissionCompatibilityService` returns `FormEvidenceUnavailable` for supported identity, `FormIncompatible` otherwise, without inventing facts or performing network calls. Every unproven real Google body/status/redirect is Unknown; there is no production positive-marker classifier. Production paid-send enablement is not authorized/ready. No generalized parser rewrite, new provider, official Forms/OAuth/NCKH change, frontend, backfill/operator tool, TTL/auto-release/auto-retry/resume, physical deletion or live activation.

## Next recommended step

Root packages this frozen manifest/report for independent safety/credit review. Resolve findings with new focused evidence/re-review; then continue approved Task5/6 and applicable runtime gates. Do not infer integration or release from local verification.

## Independent R1 fix round1 / current R2 handoff — 2026-11-05

R1 `artifacts/reports/fah-history-001/task4-review-r1.md` reported **I1 Important, 0 Critical**. The initial runner item query was outside `try/finally` after acknowledged admission; a query failure/cancellation could leave a never-dispatched Running/Planned hold without runner acknowledgement. Fixed narrowly in `Services/SubmissionService.cs` by moving that initial `ToListAsync(ct)` inside the existing runner `try/catch/finally`. The same bounded30-second uncancelled finalizer reloads durable items and releases only Planned. No admission replay/Unknown/provider/credit/lifecycle contract changed.

Added six real SQL regression cases in `GenerationHistorySubmissionSqlTests.cs`: selected/direct × query-fault/query-cancel/after-admission-ack-cancel. `task4-r1-red-initial-load-six.log` proves6/6 failed before the fix with durable Running instead of Failed; `task4-r1-green-initial-load.log` proves6/6 passed after. Each independently verifies receiver0, debit0,2 NotDispatched/Released, outstanding0, released2, balance2, acknowledgement/finish set, active=false, no submission log and read-only replay. Exact ISO timestamps and active predicate are printed. Lost-admission-ack and the five original fault phases remain green without runner takeover.

Final verification after the fix, same worktree/Release/cached dependencies and exact guarded Safety DB:

| Status | Current result / artifact |
|---|---|
| Verified | Build0 errors/3 baseline NU1603: `task4-r1-final-build.log`. |
| Verified | Full suite **387 passed/0 failed/47 opt-in skipped**,434 total: `task4-r1-final-test.log`. xUnit represents the six-case opted-out SQL theory as one skipped theory in this full run; it was executed as six cases below. |
| Verified | Combined Safety filter `GenerationHistorySubmissionSqlTests|GenerationHistorySqlTests|GenerationCreditReservationSqlTests|GenerationCreditReservationConsumerSqlTests`: **36 passed/0 failed/skipped**, consisting Task4 thirteen + foundation/history23: `task4-r1-final-sql-safety.log`. |
| Verified | EF no pending model changes: `task4-r1-final-pending.log`; diff-check no whitespace errors: `task4-r1-final-diff.log` (existing LF normalization warning only). |
| Verified (retained, unaffected) | Baseline migration1/1: `task4-final-sql-baseline.log`; no schema/model/migration changed in I1. |
| Verified |28 current source/test SHA256 entries in refreshed `task4-final-manifest.json`; SHA256 **221679bbdc5b17cd994030e38032832ca3d2731d6657f298af3fde60364f2446**. Only the service and SQL test file differ from R1 product/test snapshot. |

The47 skipped full-run entries include the authorized SQL cases run separately (36 Safety+1 Baseline actual cases, six theory cases grouped into one skip entry) and15 older SQL fixture cases still Not run. None is claimed green from a skip. All earlier RED/checkpoint/build/full/SQL logs are retained.

Minor M2 error-code precedence remains root-ledgered for final review; Task3 M1 remains Deferred. No scope expansion or fix of those Minor findings. No API/browser/runtime/live provider, new process/listener/DB, operator tool, deployment or Git mutation. Real Google metadata/receipt and reconciliation adequacy remain Blocked; production paid sends stay fail-closed. Next: root's fresh scoped R2 review of I1 and refreshed snapshot; no Done/integration/release claim.
