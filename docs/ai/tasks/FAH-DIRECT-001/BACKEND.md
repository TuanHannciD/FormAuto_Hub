# FAH-DIRECT-001 — Backend implementation handoff

Date: 2026-11-01. Writer: `/root/direct_rules_backend`, `gpt-6.1-sol`, reasoning `high`; no nested agents. Scope and root decisions are in [INDEX](INDEX.md).

## Summary

Implemented direct rules submission with a persisted command/job reservation, read-only replay, shared SQL admission lock and existing sequential submission runner. No schema/migration, new lifecycle status, auto recovery, refund rule, or AI-provider change.

## Files changed

- `src/FormAutoHub.Api/Contracts/Phase3Dtos.cs`: `DirectRuleSubmissionRequest(Guid CommandId, int Count)`.
- `src/FormAutoHub.Api/Controllers/SubmissionsController.cs`: authenticated direct route; existing job response, null→404, invalid admission→400.
- `src/FormAutoHub.Api/Services/DirectRuleSubmissionService.cs`: `IDirectRuleSubmissionService.SendAsync`, owner-authorized reservation/replay, rule generation inside admission and runner invocation outside the retry delegate.
- `src/FormAutoHub.Api/Services/SubmissionAdmission.cs`: shared common/direct project row lock, active predicate, reserved job, bounded RowVersion conflict retries, new-context committed-job verification after failed acknowledgement.
- `src/FormAutoHub.Api/Services/SubmissionService.cs`: shared internal runner, any-log response rejection, fail-closed cancellation, conditional SQL pause/cancel/finalization updates, preserved diagnostic aggregate causes.
- `src/FormAutoHub.Api/Services/ResponseGenerationService.cs`: shared generation core with internal direct path, credit reference to job, partial-generation usage evidence.
- `src/FormAutoHub.Api/Services/AnswerRuleService.cs`: existing validation made internal for reuse.
- `src/FormAutoHub.Api/Program.cs`: concrete submission runner registered once per scope, common service interface maps to it, direct service registration.
- `tests/FormAutoHub.Tests/DirectRuleSubmissionServiceTests.cs`: 24 behavioral InMemory cases.
- `tests/FormAutoHub.Tests/DirectRuleSubmissionSqlServerTests.cs`: six opt-in SQL methods, eight cases after theory expansion; real SQL and fake Google boundary only.
- Paired task `INDEX.md` and this `BACKEND.md`.

Frontend, entities, EF mapping/migrations, dependency versions and application configuration were not changed by this writer.

## Scope alignment

Rules count 1..100 can create/send the affordable x1 subset. Common confirmation remains enforced. Direct command replay only reads persisted job/logs, including Failed/Running/Cancelled. Wrong owner/project returns null before disclosure. The runner keeps sequential batches of 10, a pre-call attempt fence and confirmed-result persistence before the next send. Any attempted response is permanently excluded from the common send path by its existing log; unsent no-log responses retain manual preview/confirmed-send availability.

The root's no-schema ruling is feasible with fail-closed hard-crash/manual-reconciliation limits. `SubmissionJob.Total` reports the accepted affordable count; the response is deliberately the existing contract, not the discarded wrapper.

## Validation performed

All commands ran in `D:/TinHoc/FormAuto_Hub`, Release configuration, no real provider/runtime calls by this writer.

| Check | Result |
| --- | --- |
| Initial existing safety regressions | RED: 3 failed because logged previews were resent and cancel set FinishedAt immediately |
| Initial new direct cases before service existed | RED: 20 failed, absent direct workflow; typed calls replaced temporary discovery after implementation |
| Cancellation then provider fault | RED: persisted Failed overwrote Cancelled; GREEN after scoped correction |
| Focused direct cases | Verified: 24 passed |
| Direct + existing persistence regressions, after final diagnostics adjustment | Verified: 38 passed, 0 failed; `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --filter 'DirectRuleSubmissionServiceTests\|FahErrSubmissionPersistenceTests' --no-restore -v minimal` |
| Direct + persistence + Phase3 regressions before final diagnostic adjustment | Verified: 65 passed |
| Solution Release build | Verified: exit 0; `dotnet build FormAutoHub.sln -c Release --no-restore -v minimal` |
| Full backend suite before final diagnostics-only adjustment | Verified for executed cases: 315 passed, 12 SQL method skips, 0 failed; `dotnet test FormAutoHub.sln -c Release --no-restore -v minimal` |
| Whitespace | Verified: `git diff --check`, exit 0 |

Existing NU1603 warning resolves `Google.Apis.Forms.v1` 1.69.0 to 1.69.0.3673. No dependency edits. An initial `--no-restore` invocation returned no test output before test assets were ready; it was not counted as evidence. Subsequent normal test execution used available dependencies and produced the RED/GREEN results above.

## Validation not performed by writer

- Initial handoff SQL execution: Not run by writer at that stage; runtime owner subsequently reported 8/8. B1 correction now includes writer-executed actual SQL tests below. InMemory alone provides no SQL locking/transaction guarantee.
- HTTP/auth/browser smoke, API/web restart and log inspection: owned by runtime agent/root; Not run by writer.
- Independent code review: required and pending root assignment.
- Frontend lint/build/browser: separate writer/runtime evidence.
- Real Google or paid provider calls: Not run, outside scope.

SQL opt-in requires exact `FORMAUTO_DIRECT_SQL_SERVER=.` or `localhost` and `FORMAUTO_DIRECT_SQL_DATABASE=FormAutoHub_DirectRule_Safety_20261101`. Fixture checks actual local machine/database identity, never creates, drops, resets or cleans a DB, and seeds only random GUID synthetic rows. Test evidence is retained. SQL tests cover simultaneous same/different command and common-route admission in both directions, cross-project same-account RowVersion contention, cancellation at final update, ambiguous commit acknowledgement and transaction rollback after generation/debit.

## Risks and Deferred items

- Hard crash or lost commit acknowledgement can leave `Running` with no runner; replay does not take over. Manual reconciliation required.
- `Cancelled` with null `FinishedAt` blocks new admissions until acknowledgement. Existing Paused has no durable acknowledgement discriminator; cancel after paused runner already exited can require manual reconciliation, as explicitly chosen by root.
- SQL checks and runtime must pass before local Done. No integration/release claim.
- No automatic retry of unknown provider outcome; no lease, membership schema, new statuses or refund semantics added.

## Next recommended step

Runtime owner runs the frozen SQL suite and safe authenticated HTTP/browser smoke against owned affected processes. Root obtains independent review of base `297ee2143f7a37ca02739157d75e3db06ab4be17` plus the full dirty/untracked source snapshot, fixes any findings and records resulting checks. Backend writer has not committed, pushed, deployed, started/stopped API/web processes, or changed DB/config.

## B1 correction — 2026-11-01

Independent review [B1](BACKEND_REVIEW.md) identified that direct admission rejection had no durable failure usage evidence: inner generation logs rolled back with admission, while request/active-job rejections had no log. Reproduced on actual SQL before editing production: new rejection/privacy/replay filter produced 10 failed, 2 passed; eight rejection cases had zero usage rows and two invalid unowned requests threw validation before ownership.

Smallest correction: only `DirectRuleSubmissionService` production code changed in this round. It checks owner before request validation, catches only local admission `InvalidOperationException` after transaction disposal, clears rolled-back tracked state, rechecks owner, then persists one Failed `SubmitResponses` usage row with zero credits and rethrows. Provider runner and successful/replay return paths remain outside that handler. `SubmissionAdmission`, credit/generation, runner, DTO/controller/DI and frontend were unchanged in this round.

Tests changed in the two existing direct test files. Actual SQL assertions cover missing/invalid rules, zero credit, count 0/101, empty command, active conflict, and an injected rejection after generation/debit but before reservation persistence. Each asserts exactly one durable Failed usage row, unchanged balance, no debit, no new job, only seeded preview, zero provider calls and no leaked successful usage. Additional actual SQL cases prove wrong-owner valid/invalid requests return null with no project usage/credit/job effects, and existing command replay creates no fresh usage.

Verified: `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --filter 'DirectRuleSubmission|FahErrSubmissionPersistenceTests' --no-restore -p:BaseOutputPath=D:\TinHoc\FormAuto_Hub\.codex-tmp\direct-b1-bin\ -v minimal`, with `FORMAUTO_DIRECT_SQL_SERVER=.` and exact `FORMAUTO_DIRECT_SQL_DATABASE=FormAutoHub_DirectRule_Safety_20261101`: 58 passed, 0 failed, 0 skipped (24 direct InMemory, 20 real SQL, 14 persistence regressions). Build occurred only in the separate output directory; runtime API/web/receiver processes and default runtime binaries were preserved. Existing dependency warning remained. `git diff --check -- src/FormAutoHub.Api tests/FormAutoHub.Tests` exited 0.

Not run for B1: broad suite repeat (scoped change already has focused regressions), fresh HTTP rejection smoke after owned API restart, and independent rereview. Root/runtime own the latter two gates. Source is frozen for review; no commit/push/deploy/config/schema change.

Changed source/test SHA256:

| File | SHA256 |
| --- | --- |
| `src/FormAutoHub.Api/Services/DirectRuleSubmissionService.cs` | `CEB334225F2F7213B5BF64CAC7B5289A39189028924462A202C8DE1A4A58EF3D` |
| `tests/FormAutoHub.Tests/DirectRuleSubmissionServiceTests.cs` | `946E2B9B51003C2E255E92FC7FC35B8B35301C6E0D4CABBDD122A9EBCF71044E` |
| `tests/FormAutoHub.Tests/DirectRuleSubmissionSqlServerTests.cs` | `757BC5B9E1751D5C8B223700C007A70360FA1C98142B50D7A615E4B58EDEA895` |
