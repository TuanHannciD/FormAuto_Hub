# FAH-DIRECT-001 — Final independent review

Date: 2026-11-02. Reviewer: `/root/direct_rules_final_review`, `gpt-6.1-sol`, reasoning `high`; independent of source/test authors, no child agent. Base and HEAD: `297ee2143f7a37ca02739157d75e3db06ab4be17`; branch `feat/direct-rule-submission`, dirty/untracked frozen working snapshot, no commit.

## Summary

**Spec/code-review verdict: Passed. No unresolved Critical/Important finding identified.** Backend B1 and frontend F1–F4 are resolved in the reviewed snapshot. **Runtime acceptance is a separate gate:** the final owned browser/API/SQL evidence was still being produced when this report was written. This review does not declare local Done, integration or release.

## Findings and correction verification

- **B1 resolved:** rejected local direct admission disposes/rolls back its transaction before clearing tracked state and writing one owner-authorized Failed, zero-credit usage row. Runner exceptions and read-only replay are outside that handler. The SQL assertions check rollback of generation/debit/reservation plus durable rejection evidence, owner privacy and no new replay usage.
- **F2 resolved:** POST 400/409 now invokes the existing owner-scoped GET job route using the command ID. Session user is checked before and after the probe; only a valid matching command/project job is applied. A same-user GET 404 clears only that stored command. Failed, malformed, mismatched or session-changed reads retain the command; other unresolved HTTP responses also retain it. No new API discriminator or contract was introduced.
- **F2 tests are meaningful:** five added cases distinguish 400→GET 200 from 400→GET 404 and check failed 409→GET 503, wrong job identity and session change. They assert job/request identity or counts and retained/cleared storage/action state. The 200 fixture represents a known Completed job, so clearing its resolved command is correct. Existing uncertain-terminal, account/cross-tab/Web Locks, compare-before-clear, partial-credit/mixed-outcome and AI confirmation cases remain.
- **F1/F3/F4 preserved:** uncertain-result logs prevent terminal command clearing, storage is scoped per user with serialized creation and compare-before-clear, and generated totals are separated from successful/failed submissions.
- Corrected two stale sentences in the paired FRONTEND report: HTTP status alone no longer releases a command, and the existing GET job route can reconcile an accepted command because command ID equals job ID. These are report corrections, without changing approved behavior.

## Scope alignment

Reviewed the complete task diff and new direct service/admission/test units with their affected generation, credit, runner, controller/DI, API client/session, forms state/rendering and test consumers. Compared the paired current API/architecture baseline and task reports against the approved INDEX.

- Exact direct route/request uses `{commandId,count}` and the existing `SubmissionJobResponse`; count 1..100, authorized ownership, x1 affordable subset and dedicated credit ledger remain in place.
- Shared common/direct SQL project admission encloses generation/debit/reservation. Replay is owner/project checked and read-only; provider calls stay outside the transaction and EF retry delegate.
- Sequential runner batches at most 10, persists the attempt fence before a provider call and known outcomes before the next call; common send rejects every already-logged response. Cancellation acknowledgement and conditional updates retain the approved fail-closed boundary.
- Option 1 has one **Tạo và gửi ngay** action without preview/checkbox/second confirmation; AI Options 2/3 retain preview and explicit common-route confirmation.
- No entity/migration, new lifecycle, automatic unknown resend, provider/refund expansion or phase commitment found. AI/VI baseline changes have equivalent commitments.

## Files changed

This reviewer changed only paired `FINAL_REVIEW.md`, the F2 status/evidence in paired `FRONTEND_REVIEW.md`, and the two report sentences in paired `FRONTEND.md`. No production/test, dependency, config, process, SQL, provider, Git history or deployment mutation.

## Validation performed

- **Verified by final reviewer:** source/test/contract inspection described above; matched all 24 frozen hashes before/after the review; `git diff --check` in `D:/TinHoc/FormAuto_Hub` exited 0. Existing README and error-spec LF→CRLF warnings remain.
- **Writer evidence, not rerun by final reviewer:** [BACKEND](BACKEND.md) records focused 58/58, zero skipped, including 20 actual SQL cases on the guarded isolated DB; earlier full backend 315 passed/12 SQL method skips and Release build pass have their stated snapshot limits. [BACKEND_REVIEW](BACKEND_REVIEW.md) independently passed the B1 correction.
- **Writer evidence, not rerun:** [FRONTEND](FRONTEND.md) records affected combined Playwright 30/30 before F2 round 2, then direct-spec 17/17 after round 2; final lint/build passed with existing outside-scope warnings and detector `[]`. The final reviewer inspected the covering cases and exact final hashes rather than repeating these suites.
- **Runtime-owner evidence, not rerun:** [RUNTIME](RUNTIME.md) records initial SQL concurrency 8/8 and safe authenticated API/SQL/loopback HTTP checks; the B1 rerun confirms applicable 400 rejections each create one durable zero-credit failure usage row with no job/debit/generated/send effect, wrong owner 404 has no effect, and same-command replay does not call the receiver again.
- Report links, UTF-8 and paired semantic consistency were inspected. Source/test/baseline hashes below match the supplied freezes; evolving runtime/task ledgers are not represented as immutable source.

| File | SHA256 before = after final review |
| --- | --- |
| `src/FormAutoHub.Api/Contracts/Phase3Dtos.cs` | `485D077EA317F5ECC778DEE2B24D04252859493D2B1A7BE9070B03DB78D5AD3E` |
| `src/FormAutoHub.Api/Controllers/SubmissionsController.cs` | `B6A50703D49DEC5802CBFDA7A96516A730FD02F36C6AB8F502AB9F03D4794D26` |
| `src/FormAutoHub.Api/Program.cs` | `18DB551D19CD5935EF0D0419F37F8A8E9852EF84D3E8F1F524E84F1EB47864CD` |
| `src/FormAutoHub.Api/Services/AnswerRuleService.cs` | `6C695C91B153316674F1E943962285049756BD732E005C04B8FA4DC5634B2AF8` |
| `src/FormAutoHub.Api/Services/DirectRuleSubmissionService.cs` | `CEB334225F2F7213B5BF64CAC7B5289A39189028924462A202C8DE1A4A58EF3D` |
| `src/FormAutoHub.Api/Services/ResponseGenerationService.cs` | `F72B87FFC378809EACE2BF58BAFAED966C372CBEE5BB63F75232159ABA8A56AD` |
| `src/FormAutoHub.Api/Services/SubmissionAdmission.cs` | `520E8DEDD00B103FB02D6427CA1FF59856D27E2E10360ED5125617B11D0E4E80` |
| `src/FormAutoHub.Api/Services/SubmissionService.cs` | `61AA49943794F08E43D2ECB83B20D0F749F0848548CA7E361F89A79A27F52DDA` |
| `tests/FormAutoHub.Tests/DirectRuleSubmissionServiceTests.cs` | `946E2B9B51003C2E255E92FC7FC35B8B35301C6E0D4CABBDD122A9EBCF71044E` |
| `tests/FormAutoHub.Tests/DirectRuleSubmissionSqlServerTests.cs` | `757BC5B9E1751D5C8B223700C007A70360FA1C98142B50D7A615E4B58EDEA895` |
| `apps/web/app/dashboard/forms/_components/WorkflowSummary.tsx` | `DC06270A30984ACE01D7E5C904FA152BEC12136835A3A4009844D47AE6A45CCA` |
| `apps/web/app/dashboard/forms/_constants.ts` | `0511F34B5F93F5E66F7DC85FC9D77FC82F1DC63DD22AA1091D93E532E6ED7C3C` |
| `apps/web/app/dashboard/forms/_helpers.ts` | `C0CF496065859B5283E89C349062BDBB4B7AFFF98419BA2E1D5FF72F8BB10B64` |
| `apps/web/app/dashboard/forms/_types.ts` | `D9FA10765B8DC0D0C5973814EB7B63747914A6510C3E3F3D80632659184FE0E7` |
| `apps/web/app/dashboard/forms/page.tsx` | `51AF7F64AE72AA5000CB51461D7D8308A682C577A983666A1282A7834B0127E0` |
| `apps/web/tests/direct-rule-submission.spec.ts` | `D41A2D599B391F7895743C13D269967FDEE6DD70B38361A583C803BC519E2A9A` |
| `apps/web/tests/form-automation.spec.ts` | `7F172164E02FDB9E6EBE9265EBE08F21E2E94584D445B91CA9DD069901807F5A` |
| `apps/web/tests/fah-err-forms-errors.spec.ts` | `7F47BFB681666F697B14E71EBDB7B8A1C6CE03621D9516F71508921C7268C446` |
| `AGENTS.md` | `F14B5AA14509FEBE92EB39A6B2BE49083E0D320FB54C21C7DDA30B6ACE73EC8E` |
| `README.md` | `984ECCD8501F50D4FD38B97ADA40DDD7B655A549AF99E72DAC56C43D0E2B66DA` |
| `docs/ai/API_CONTRACT_GUIDE.md` | `BA1D54FC02B05FD2F78E68B2E0942137A0FEF9BAC7F08F0BC307FCE013206373` |
| `docs/vi/API_CONTRACT_GUIDE.md` | `F6664AD8B0A71BC23F95A97A47FBA7B885894C2A1D70EBC1DC0457F8D63CD635` |
| `docs/ai/ARCHITECTURE_BOUNDARIES.md` | `967343AB23AF83CA1880407F355C02081F1FA51E9C424F1FF1DB5EE99E04E9D0` |
| `docs/vi/ARCHITECTURE_BOUNDARIES.md` | `E4D9E4FDC5695EE1BA25BB0D498F2C1C7A3DC1584FA1F83E1B7B32C937346A84` |

## Validation not performed

**Not run by final reviewer:** build, lint, unit/SQL/Playwright execution, browser interactions, new API requests, process restarts or real provider calls. Runtime resources belong to the runtime owner, and no new failure justified repeating heavy checks. Malformed GET reconciliation and Web Locks request rejection were source-inspected; they have no dedicated added executed case supplied here.

**Pending root gate:** final browser smoke against the restarted owned web/API snapshot, actual auth/session, chunk/hydration and bounded logs, independent SQL outcome evidence, and owned-resource release verification. Root must assess the final runtime report before local Done. This pending gate is not converted to pass by the code-review verdict.

## Risks/Deferred items

Approved no-schema limits remain: hard crash or uncertain commit can leave an active reservation requiring manual reconciliation; cancelling an already-exited paused runner can leave Cancelled with null FinishedAt and block admission. No automatic takeover, resend or refund behavior is approved. These limits are documented decisions, not reopened findings.

## Next recommended step

Root combines this passed independent code/spec review with final runtime acceptance and paired task-ledger updates. No further production/test correction is requested by this review; integration/release still requires its own authorization.
