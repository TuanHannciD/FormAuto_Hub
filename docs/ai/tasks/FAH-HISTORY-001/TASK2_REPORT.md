# Task 2 — Author implementation report

## Summary

Implemented the approved local Task 2 foundation on branch `fah-history-001`, base `df5cce54f4a8516ab9dd0bf2b5dff561c1cb8d5c`. Dedicated reservations preserve posted Balance; Available subtracts outstanding holds; confirmed success consumes its own held credit once, confirmed rejection releases without refund/debit, and Unknown retains funds/claim. Evidence replay is read-only; changed evidence/contradictory terminal outcomes fail closed. This is an author handoff for fresh independent review, not integrated/released/Done.

Authorization: latest approval in [PROGRESS](PROGRESS.md), reviewed [CONTRACTS](CONTRACTS.md)/[DB_REVIEW](DB_REVIEW.md), Task 2 brief and root's account-first safety ruling. No nested agents; implementer `gpt-6.1-sol/high`. Root owns both retained SQL databases and runtime lifecycle.

## Files changed

- Added entities: `GenerationBatch`, `SubmissionJobItem`, `CreditReservation`, `CreditReservationEvent`, `LegacyAttemptEvidence`; added approved nullable legacy/batch/job/log/usage fields to existing entities. The legacy evidence table is persistence only; no reconciliation operator tool or entitlement backfill.
- EF: `FormAutoHubDbContext.cs`, new `Data/GenerationHistoryModel.cs`, EF-generated designer/snapshot and migrations `20261105043707_GenerationHistoryAndReservations` and `20261105044810_HardenHistoryNullableContractChecks`. The first migration includes fail-closed duplicate/orphan preflight, without historical repair/deletion. The second fixes SQL CHECK three-valued NULL behavior, preserving already-applied migration history.
- Added `Contracts/CreditReservationDtos.cs`, `Services/CreditAccountLock.cs`, `CreditReservationService.cs`, `SubmissionItemMutation.cs`, `SubmissionSettlementService.cs`; changed `CreditService.cs`, `CreditWriteTransaction.cs`; registered internal services in `Program.cs` (no route).
- Minimal existing-writer safety changes: `ResponseGenerationService.cs`, `AiGenerationService.cs`, `SubmissionAdmission.cs`, `AdminCreditOperationsService.cs`, `AdminTopupOrderService.cs`, `PaymentService.cs`. Account lock precedes project/account spending; only prepared local SQL persistence is retried, never providers. Existing rules=1/default AI=2/custom AI=3 prices remain unchanged until Task 3. Payment signature/status/provider behavior is unchanged; only local account write serialization is added.
- Added focused `GenerationCreditReservationTests.cs`, `GenerationHistorySqlFixture.cs`, `GenerationCreditReservationSqlTests.cs`, `GenerationCreditReservationMigrationTests.cs`. Updated `FoundationTests.cs` approved entity inventory. Adapted the existing `DirectRuleSubmissionSqlServerTests.cs` post-debit barrier to account-first serialization; assertions remain one debit/runner and one insufficient-credit result. Existing test database names/opt-in guards are preserved.
- Paired `TASK2_REPORT.md`; evidence under `artifacts/reports/fah-history-001/`. Root owns PROGRESS and review packaging.

## Scope alignment

No Task 3 pricing/history writer/quota/API/UI, Task 4 send-flow wiring/classifier, legacy backfill/cutover/reconciliation tool, external integration, worker, auth/NCKH behavior, install, commit, push or deployment. GenerationBatch metadata and legacy evidence are approved schema foundations only. No API/web process started, no real Google/AI/payment calls, no other database accessed or deleted/reset.

Task 2 service invariants include account-first `Users -> account -> project -> batch/response/item` locking, unique account owner and per-item ledger/usage/terminal evidence, rowversions, noncascading links, immutable item snapshots and append-only event/evidence guards, bounded cancellation-independent settlement persistence, fresh-context observation after lost commit acknowledgement, and runner-acknowledged release of only Planned items. Unknown prepaid claims remain open even when monetary outstanding is zero.

## Validation performed

All commands ran in this isolated worktree, Release, local cached dependencies with `--no-restore` where supported; no installation. Logs below are under `artifacts/reports/fah-history-001/`.

| Status | Evidence |
|---|---|
| Verified | TDD logs: `task2-red-behavior.log` proves generation spent reserved credit; `task2-red-invariants.log` proves own-hold-at-zero/evidence/ack failures; `task2-red-snapshots.log` proves snapshot rewrite; `task2-red-null-check.log` proves SQL NULL bypass; `task2-red-fresh-ack.log` proves lost-ack recovery gap. Subsequent green runs cover those behaviors. The first skeleton red log had expected missing-type compile errors; behavioral RED evidence is recorded separately. |
| Verified | Focused unit suite: 12 passed, 0 failed (`task2-green-snapshots.log`); covers 10/7/3 -> 9/6/3 -> 9/5/4, unknown/replay, zero/fractional/missing account, own hold at Available0, evidence conflicts, runner acknowledgement, prepaid success/reject/unknown and immutability. InMemory is unit evidence only. |
| Verified | `dotnet build FormAutoHub.sln -c Release --no-restore`: exit0, 0 errors, 3 existing NU1603 warnings (`final-build.log`). |
| Verified | `dotnet test FormAutoHub.sln -c Release --no-restore`: final 327 passed, 0 failed, 23 opt-in skipped, total350 (`final-test.log`). Initial full attempt failed only the outdated exact entity inventory; after its update an intermediate run had327 passed/22 skipped/349 total, then an added missing-account SQL case produced the final counts. |
| Verified | Safety SQL command: `FAH_HISTORY_SQL_SERVER=localhost`, `FAH_HISTORY_SQL_DATABASE=FormAutoHub_History_Safety_20261104`; `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-restore --filter FullyQualifiedName~GenerationCreditReservationSqlTests`: 7 passed, 0 failed/skipped (`final-sql-safety.log`). |
| Verified | Baseline SQL command: same server, `FAH_HISTORY_SQL_DATABASE=FormAutoHub_History_Baseline_20261105`; filter `FullyQualifiedName~GenerationCreditReservationMigrationTests`: 1 passed, 0 failed/skipped (`final-sql-baseline.log`). First-run duplicate51000/orphan51001 preflight and baseline application evidence: `task2-sql-baseline.log`. Final replay preserves the historical fixture again. |
| Verified | Fixture opens each connection only after exact localhost/database whitelist and ServerName/MachineName=`DESKTOP-TS5JR7L` checks. Clean Safety migration and prior-migration populated Baseline path applied both new migrations; retained synthetic data are not cleaned. Fresh independent contexts assert durable balances, holds, ledger/log counts and keys. |
| Verified | SQL cases cover two-project competing reservations, two concurrent generation deductions unable to spend held funds, concurrent topups and missing-account creation without lost update, pre-save rollback, lost settlement commit acknowledgement with fresh read and replay exactly1 debit, reservation sums, FK orphan rejection, unique ledger rejection and nullable v2 guard. Synthetic credit-service calls prove local accounting, not end-to-end AI/provider behavior. |
| Verified | `dotnet ef migrations has-pending-model-changes --project src/FormAutoHub.Api --configuration Release`: no pending changes (`final-pending.log`). `git diff --check`: exit0. Strict UTF-8/paired report validation is run at report freeze. |

## Validation not performed

- Not run: API/runtime HTTP, authenticated roles/sessions, browser/hydration/chunks, actual AI/Google/payment provider behavior. Task 2 exposes no new route; broader runnable-consumer smoke is a Task 6 gate and is not waived.
- Not run: 15 older opt-in SQL tests using their separate task databases; no permission to take over those databases. The full suite skipped them plus 8 new SQL tests, while the 8 new ones ran separately on the authorized databases. The adapted old direct-rule SQL barrier was compiled but not executed against its old fixture.
- Not run: production/cutover, real supported Google receipt evidence, legacy evidence reconciliation/backfill, history quota/eviction, end-to-end AI/send retry/provider counts; these belong to later tasks and activation gates.
- Independent credit/migration review: pending root's fresh reviewer on the frozen snapshot. Author self-review is not that review.

## Risks / Deferred items

- Existing writer lock/transaction changes touch generation and payment-related local persistence; final runtime/consumer smoke and fresh financial review are required before activation. SQL tests exercise dedicated credit paths, not a real provider.
- `Program.cs` still auto-migrates on startup: never start against an unknown DB. Only the two root-owned test databases have been authorized and retained.
- Unknown retains holds indefinitely pending approved evidence; no TTL release or automatic resend. Legacy classification/tooling and actual receipt adequacy remain later gates.
- No physical purge/storage bound, history activation or production release is claimed. Existing NU1603 dependency resolution warning remains; no new analyzer warning remains in final logs.

## Next recommended step

Freeze these product/test files and perform root's independent Task 2 credit/migration review. Resolve findings with focused rechecks and fresh review as required, then proceed to Task 3. Do not infer API/runtime/cutover or release completion from local build/unit/SQL results.

## Independent R1 fix round 1 — 2026-11-05

R1 found Important I1/I2; no Critical/Minor. The findings are recorded in `artifacts/reports/fah-history-001/task2-review-r1.md`. The initial author snapshot above remains historical evidence; the results below supersede its current counts. Independent re-review of these fixes is still pending.

- **I1 fixed:** standalone relational availability reads now create a separate context for their retryable read transaction. Clearing that read tracker cannot detach the caller's Added AI run or other pending writes. A caller-owned transaction continues using its original context/transaction. Changed `Services/CreditReservationService.cs`; no AI provider/pricing/status/schema change.
- **I2 fixed:** rules generation returns a local failure result after persisting its zero-credit Failed UsageLog, commits that transaction, then raises the existing InvalidOperationException for the controller. A stable failed-usage ID and committed-failure lookup prevent another audit row if commit acknowledgement is transiently lost. Changed `Services/ResponseGenerationService.cs`; existing direct admission still rolls back its outer transaction and writes its own failure audit through its established caller boundary.
- Added actual-consumer SQL regressions in `tests/FormAutoHub.Tests/GenerationCreditReservationConsumerSqlTests.cs`. Tests invoke the real `AiGenerationService`/`ResponseGenerationService` and SQL execution strategy, with a synthetic provider that never performs network I/O. No additional schema or migration.

**RED evidence:** `task2-r1-red-consumers.log` records all three original failures: successful AI availability retry lost the run and failed the run-items FK; provider-failed AI returned without a persisted run; competing spend left rules generation without Failed UsageLog. `task2-r1-red-audit-replay.log` records two failed usage rows after a synthetic transient failed-audit commit acknowledgement loss. These logs are retained. **GREEN:** `task2-r1-green-consumers.log` has4 passed/0 failed/0 skipped; retries assert at least2 read attempts, one provider call, exactly one durable successful/failed run, matching item/debit/usage totals; rules asserts zero generated responses/generation debits, one failed usage with0 credits and retained competing debit, including commit replay.

Final verification after the R1 changes, isolated worktree, local cached dependencies:

| Status | Command / result / artifact |
|---|---|
| Verified | `dotnet build FormAutoHub.sln -c Release --no-restore`: exit0,0 errors,3 baseline NU1603 warnings; `task2-r1-final-build.log`. |
| Verified | `dotnet test FormAutoHub.sln -c Release --no-restore`:327 passed/0 failed/27 opt-in skipped, total354; `task2-r1-final-test.log`. The27 skips are15 older SQL cases and12 new SQL cases; the12 new cases ran separately below. |
| Verified | Safety exact identity guard unchanged; `FAH_HISTORY_SQL_SERVER=localhost`, `FAH_HISTORY_SQL_DATABASE=FormAutoHub_History_Safety_20261104`; `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-restore --filter "FullyQualifiedName~GenerationCreditReservationSqlTests|FullyQualifiedName~GenerationCreditReservationConsumerSqlTests"`:11 passed/0 failed/0 skipped; `task2-r1-final-sql-safety.log`. |
| Verified | Exact Baseline DB `FormAutoHub_History_Baseline_20261105`, same guarded localhost; filter `FullyQualifiedName~GenerationCreditReservationMigrationTests`:1 passed/0 failed/0 skipped; `task2-r1-final-sql-baseline.log`. Historical fixture unchanged. |
| Verified | `dotnet ef migrations has-pending-model-changes --project src/FormAutoHub.Api --configuration Release`:none pending; `task2-r1-final-pending.log`. `git diff --check`:exit0; strict UTF-8/paired report sections checked. |

**Limits unchanged:** no API/web/runtime/browser, live provider, other task DB, installation/commit/deploy or cleanup. These actual-service SQL tests extend the earlier dedicated-credit evidence; synthetic provider behavior is not real AI/Google evidence. Files are frozen again for root's scoped R2 independent credit/migration review; no claim of integration/release/Done.
