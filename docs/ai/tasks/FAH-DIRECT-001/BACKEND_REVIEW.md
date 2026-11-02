# FAH-DIRECT-001 — Independent backend review

Date: 2026-11-01. Reviewer: `/root/direct_rules_backend_review`, `gpt-6.1-sol`, reasoning `high`; independent of backend author, no child agents. Method: `requesting-code-review`, with verification before reporting. Base: `297ee2143f7a37ca02739157d75e3db06ab4be17`; branch `feat/direct-rule-submission`, frozen dirty/untracked backend snapshot, no commits.

## Summary

**Current spec/review verdict: B1 addressed; no remaining backend review finding.** Scoped independent rereview of the frozen B1 correction found no new defect. The original finding below is retained as history. **Quality verdict: backend code-review gate passed; local Done remains pending** the owned API restart/rejection HTTP smoke and root's final runtime/frontend gates. This review does not claim integration or release.

## Findings

### B1 — Important, resolved: direct admission rejection loses failure usage evidence

- Location: `src/FormAutoHub.Api/Services/DirectRuleSubmissionService.cs:21`, `SendAsync`; related `SubmissionAdmission.RunAsync` at `SubmissionAdmission.cs:28` and generation failure branches at `ResponseGenerationService.cs:63` / `:89`.
- Reproduce on SQL Server: authenticate the project owner, configure a valid rule and zero account balance, record the project's `UsageLogs`, then POST the direct route with a fresh nonempty command and count 1. It returns 400, creates no job/debit/provider attempt, but leaves no Failed usage row. A project with missing rules has the same loss. Invalid count, empty command, invalid rule and active-job rejection also have no direct failure logging.
- Cause: generation writes and saves the Failed usage row inside the admission transaction, then throws. Disposing the uncommitted transaction rolls that row back. `DirectRuleSubmissionService.SendAsync` has no failure handler outside admission. In contrast, common `SubmissionService.SendAsync` clears the failed tracked state and records its admission rejection after rollback. The existing direct tests assert no orphan job/generated response/credit transaction, but do not assert durable failure usage evidence.
- Impact: authorized failed tool actions disappear from usage history, violating the approved UsageLogs invariant and existing generation behavior. Root confirmed there is no approved exception for rejection audit.
- Required correction: persist applicable Failed usage evidence outside the rejected admission transaction, after owner authorization; clear rolled-back tracked state and retain zero credit/job/provider effects. Preserve read-only replay and avoid logging successful replay as a fresh tool action. Add a meaningful SQL assertion for zero-credit/missing-rule rejection and owner privacy. Do not log successful generation from a transaction that rolled back.
- Initial verification status: **Failed by source inspection** of the transaction/exception path. The reproduction above was **Not run by reviewer** at first review; the SQL regression was subsequently supplied for rereview below. Do not count InMemory behavior as transaction evidence.

## Scoped B1 rereview — 2026-11-01

**Verified by independent source/test review:** `DirectRuleSubmissionService.SendAsync` now authorizes owner before request validation and audits only rejected local admission. The `InvalidOperationException` handler runs after `SubmissionAdmission.RunAsync` has disposed the failed transaction, clears rolled-back tracked changes, rechecks owner, and saves one Failed `SubmitResponses` usage row with zero credits. The runner and replay/read paths are outside this handler, preserving existing outcome handling and read-only replay. No other production file changed from the first reviewed snapshot.

Inspected the new SQL theory `RejectedAdmission_PersistsOnlyFailureUsageAfterRollback` (eight cases), wrong-owner theory (three cases), read-only replay case, and the single-shot reservation rejection interceptor. The injected post-generation/debit rejection meaningfully checks rollback plus tracking cleanup: exactly one Failed usage row, original balance, no credit transaction/new job/generated response or successful usage leakage, and zero provider calls. Owner privacy and replay no-new-log assertions cover the handler's boundaries. No additional Critical/Important/Minor defect found within this correction.

**Writer-executed evidence, not rerun by reviewer:** paired BACKEND records SQL RED 10 failed / 2 passed before production correction, then focused GREEN 58 passed / 0 failed / 0 skipped (24 InMemory, 20 real SQL, 14 persistence). Exact command/environment and isolated output path are in [BACKEND](BACKEND.md#b1-correction--2026-11-01). Reviewer did not mutate runtime/SQL resources. Fresh API restart and HTTP rejection smoke remain **Not run by reviewer**, owned by runtime/root.

**Verified by reviewer:** the three correction hashes below matched before/after rereview; all other seven files in the initial hash table still match. `git diff --check -- src/FormAutoHub.Api tests/FormAutoHub.Tests` exited 0. Review remains `gpt-6.1-sol` / `high`, no child agent or source/test edit.

| B1 correction file | SHA256 before = after rereview |
| --- | --- |
| `src/FormAutoHub.Api/Services/DirectRuleSubmissionService.cs` | `CEB334225F2F7213B5BF64CAC7B5289A39189028924462A202C8DE1A4A58EF3D` |
| `tests/FormAutoHub.Tests/DirectRuleSubmissionServiceTests.cs` | `946E2B9B51003C2E255E92FC7FC35B8B35301C6E0D4CABBDD122A9EBCF71044E` |
| `tests/FormAutoHub.Tests/DirectRuleSubmissionSqlServerTests.cs` | `757BC5B9E1751D5C8B223700C007A70360FA1C98142B50D7A615E4B58EDEA895` |

## Scope alignment

Reviewed the full changed backend units and the two new test files, plus affected validation/generation, credit service and RowVersion mapping, common submission consumers/tests, response mappings, controller/DI, and provider boundary. No entity, migration, lifecycle or AI-provider expansion found.

The following approved properties are supported by source/test inspection, with runtime limits below:

- Direct DTO/route uses existing job response; x1 partial generation, count 1..100, empty-command rejection, and shared rule validation.
- Ownership precedes reservation replay; job ID is the command reservation, first accepted payload wins, replay cannot start a runner. A different project/user cannot retrieve the reserved job.
- Direct and common admission share the project SQL `UPDLOCK,HOLDLOCK`; generation/debit/reservation commit together. Credit conflicts clear tracked state and retry bounded admission; no provider HTTP occurs inside the transaction or EF retry delegate.
- Ambiguous commit is read through a new context and never resumes HTTP. The supplied SQL fault test covers a nontransient lost-acknowledgement exception; transient execution-strategy retry was reviewed statically rather than separately injected here.
- Runner writes a pre-call attempt fence, saves known outcomes before the next call, batches sequentially by 10, and common send rejects every logged response, including an unknown result still marked Previewed.
- Conditional pause/cancel/finalization updates preserve cancellation. Cancelled with null FinishedAt blocks admission until runner acknowledgement. Counts/status tracking does not write a stale Running value over cancellation.

## Files changed

Reviewer changed only this report and `docs/vi/tasks/FAH-DIRECT-001/BACKEND_REVIEW.md`. No production/test edits, process/DB mutation, install, real Google request, commit, push or deployment.

## Validation performed

- **Verified by reviewer:** read the paired final INDEX/BACKEND contract, relevant source rules and quality gates; inspected base-to-working diff and complete affected source/test units. Read runtime report and confirmed SQL result with runtime owner. Existing Phase3 and persistence test cases were inspected; tests were not rerun concurrently with runtime work.
- **Verified by reviewer:** `git diff --check -- src/FormAutoHub.Api tests/FormAutoHub.Tests`, exit 0, cwd `D:/TinHoc/FormAuto_Hub`.
- **Verified by reviewer:** SHA256 before and after review matched for all 10 frozen files below. Frontend remained outside this snapshot.
- **Reported evidence, not rerun by reviewer:** backend focused 38/38 after final diagnostic change; earlier Release solution build and full suite 315 passed / 12 SQL methods skipped. Runtime report records opt-in SQL suite 8/8 passed, 0 skipped, dedicated local DB `FormAutoHub_DirectRule_Safety_20261101`, fake provider boundary. Those results do not cover B1.

| Initial frozen file (history; three B1 replacements above) | SHA256 before = after initial review |
| --- | --- |
| `src/FormAutoHub.Api/Contracts/Phase3Dtos.cs` | `485D077EA317F5ECC778DEE2B24D04252859493D2B1A7BE9070B03DB78D5AD3E` |
| `src/FormAutoHub.Api/Controllers/SubmissionsController.cs` | `B6A50703D49DEC5802CBFDA7A96516A730FD02F36C6AB8F502AB9F03D4794D26` |
| `src/FormAutoHub.Api/Program.cs` | `18DB551D19CD5935EF0D0419F37F8A8E9852EF84D3E8F1F524E84F1EB47864CD` |
| `src/FormAutoHub.Api/Services/AnswerRuleService.cs` | `6C695C91B153316674F1E943962285049756BD732E005C04B8FA4DC5634B2AF8` |
| `src/FormAutoHub.Api/Services/DirectRuleSubmissionService.cs` | `407890A687981D1E41FC3A8141BCA87193F02626AAE784FE1D0ACD202445DF80` |
| `src/FormAutoHub.Api/Services/ResponseGenerationService.cs` | `F72B87FFC378809EACE2BF58BAFAED966C372CBEE5BB63F75232159ABA8A56AD` |
| `src/FormAutoHub.Api/Services/SubmissionAdmission.cs` | `520E8DEDD00B103FB02D6427CA1FF59856D27E2E10360ED5125617B11D0E4E80` |
| `src/FormAutoHub.Api/Services/SubmissionService.cs` | `61AA49943794F08E43D2ECB83B20D0F749F0848548CA7E361F89A79A27F52DDA` |
| `tests/FormAutoHub.Tests/DirectRuleSubmissionServiceTests.cs` | `E2CE2941FC91D0672C13AFE94D153E2BC0884A4B95866D27F828B76E4D674342` |
| `tests/FormAutoHub.Tests/DirectRuleSubmissionSqlServerTests.cs` | `40E483051D5FACBD965A91ED753A972118463E83EDAEB27CF261A5AB59EADEA2` |

## Validation not performed

Reviewer did not rerun build/unit/SQL suites or HTTP/browser smoke; runtime owner/root own those resources and final evidence. No real Google/provider call. Cross-project simultaneous reuse of one command, transient commit-ack retry and relational cancellation-plus-provider-fault were inspected statically but have no dedicated executed assertion supplied in this review. These are coverage limits, not additional asserted defects.

## Risks/Deferred items

Approved fail-closed limits remain: hard crash/uncertain committed reservation has no automatic runner takeover; cancelled paused runner can retain null FinishedAt and require manual reconciliation. These are explicit v1 boundaries, not findings to implement around. No recovery/schema/refund extension is recommended within this task.

## Next recommended step

Runtime owner restarts the owned API with the corrected snapshot and verifies rejected direct HTTP requests plus durable failure usage evidence. Root combines this passed backend review with final frontend/runtime gates before any local Done claim.
