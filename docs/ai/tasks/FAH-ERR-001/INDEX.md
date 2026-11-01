# FAH-ERR-001 — Current audit dossier

## Git closeout đã thực hiện — 2026-10-31 00:00 ICT / 2026-10-30 17:00 UTC

**Verified:** đã commit/push scoped work và mở [draft PR #2](https://github.com/TuanHannciD/FormAuto_Hub/pull/2). Bốn commit đã xác minh exact paths: DB17 `56447d0e37ea3abbd22126750e7b75007733d1de`; ERR80 `ef44f871a4124befe8deb5c05b4c98b43f7036cb`; paired docs34 `fc6a9036f4f8691a27acf6e6f139f59591f9c3ca`; curated evidence190 `50b92f850dcdc26604a91bbfdd96e0acec64acbe`.

PR head `fix/fah-err-001-closeout-20261030` tại `50b92f8` → base review `review/fah-err-baseline-a19f7a2` tại `a19f7a2`. API read-only xác nhận4commits/321changedFiles, enumerate321paths khớp exact allowlists; clean-filter321 và raw runner343 không drift. Base là snapshot review; bốn prerequisite commit workflow/UI trước a19 nằm ngoài diff PR, chưa được đưa vào main bằng closeout này. Nhánh UI gốc vẫn trỏ a19; index/tracked tree sạch ở checkpoint; backup, DB/worktree/cache và unrelated untracked evidence giữ nguyên.

**CI tự động Not run:** PR base review không khớp YAML target main; tại lần đọc API này check runs0/workflow runs0. Remote main vẫn `8a4f18ee77453857c550ff7be0279c5cc9e415f1`. Không merge, main push, workflow dispatch, deploy hoặc watcher; không suy trạng thái production từ Git/YAML. [Hướng dẫn người dùng tự deploy](SELF_DEPLOY_HANDOFF.md) vẫn yêu cầu quyết định prerequisite/main integration, preflight/backup/migration review và runtime checks trước release.

Root đã cho phép scoped feature commits/push/draft PR theo yêu cầu mới; các câu “no commit/push” và plan/pending phía dưới là lịch sử trước checkpoint này. Local24/24 acceptance giữ giới hạn trong [validation](REMEDIATION_VALIDATION.md): sáu SQL skips, hai lint warnings, NU1603 và failed/cold-smoke history không thành green. Checkpoint này chỉ thêm Git facts và handoff; không sửa source/tests/evidence hoặc claim release. Bản ghi docs-only này tách khỏi bốn commit nêu trên; SHA và trạng thái commit/push của bản ghi được lưu ở artifact hậu kiểm, tránh tự tham chiếu.

## Final local acceptance — 2026-10-30 13:50 UTC

**24 fixed /24 Verified /0 open findings within approved local remediation scope.** [Fresh independent whole-remediation review](../../../../artifacts/reports/error-remediation-2026-10-30/final-overall-review/report.md) accepts source, applicable required checks and paired docs; report SHA256 `15b99709168ff1b61951642a5be1128fc20dee5a0a5f807067e3d5130db6181c`. This does not claim all system bugs resolved, integration or release. [Current24-ID acceptance/evidence map](REMEDIATION_VALIDATION.md) owns the current status and supersedes older progress statements below, which remain dated history.

Final review found a residual P2 for ERR-001/003/018 in core `/auth/callback?id_token=...`. The minimal fix now maps only typed Google POST ApiError409/401 to existing guidance and uses a safe generic fallback. Valid RED3 preceded the fix. Verified: Node27=callback3+shared15+auth9, fresh build exit0, lint exit0 with the same two reviewed warnings; scoped source review accepted. First browser10=7pass/3strict-locator failures, then corrected callback targeted3 passed every assertion. The test scopes alert to the labelled AuthShell region; Next's empty route announcer is outside it. No production change for that fixture correction; failed evidence retained.

Other Verified evidence: backend Release build;291pass/6SQLmigrationSkipped/0fail; SQL durability9; actual AI services/controllers+fake adapter SQL6 executions/5scenarios; actual Program25 HTTP+independentSQL; focused browser/CLI/Node checks. D remains split10pass+targeted4, not full13 rerun; broad83 remains69pass/14fail followed by targeted reruns. Hfinal3ESM pass does not erase the unexplained earlier cold health failure. No live provider/payment/submission claim.

Final owned processes released/listeners absent at `runtime/auth-callback-final/release.json`; API release is separate. `generated-config-restoration.json` restores tsconfig SHA5BB0AC… and next-env SHA F4E897… **exact original371 baseline bytes**. Earlier C706… tsconfig proof covered a later pre-wave LF snapshot, not original bytes; this final proof supersedes that precision claim. Caches/fixture rows remain preserved.

[Final ownership inventory](../../../../artifacts/reports/error-remediation-2026-10-30/dossier-checkpoint/owned-delta-from-baseline371-final.json):80 distinct=52product+22tests+2contractdocs+4tooling;57changed hashes vs371baseline/23outside its scope (not independently new-file proof).75 overlap current runner343 and match, five are outside runner scope; no actual hash drift. No DB-sync replay/arbitrary dirty count. Runner manifest SHA7183A217… includes callback/test fixture final bytes.

Root `gpt-6.1-sol/medium`; all resumed dispatches catalog-checked explicit `gpt-6.1-sol/high`, no children/Astra. Sole runner `/root/runtime_resume` owns runtime; this writer only changes authorized source/test or paired docs and static artifacts within assigned ownership. Fresh whole-remediation verdict is accepted; this post-review update changes status/links only under the verdict and root instruction. No commit/push/merge/deploy/cleanup/provider action.

## Historical checkpoints — earlier progress preserved below

## Latest root update — supersedes pending status above/below

Backend full run:291 Passed,6 SQL Skipped,0 Failed; SQL gates remain unverified. C/E/F browser32:30 Passed,2 Failed on GET-count fixture assertions; D browser13:10 Passed,3 Failed on ERR-024 locators before behavior. Failed fixture evidence is preserved; no product pass is inferred for unreached assertions. **F independent source review found P2 in ERR-015 approve receipt: existing confirmed fields are lost; fix-r1 active, source acceptance Failed for that residual.** Earlier all24 implementation means patches exist, not all acceptance satisfied. H source accepted and VM24 passed; actual ESM smoke queued. Required API/SQL/fault/final browser gates still open; no full Done. Inventory72 describes the earlier frozen packets, not active F fix-r1 bytes.

## Remediation checkpoint — 2026-10-30 08:56 UTC / 15:56 ICT

User authorization now covers all24 finding fixes, source/tests/docs and safe local validation. All eight zones A–H have scoped source implementations. **No finding is Done:** final browser/API/SQL/fault/log/build gates are pending. [Current per-ID acceptance and evidence](REMEDIATION_VALIDATION.md), [execution ledger](REMEDIATION_LEDGER.md) and [approved plan](REMEDIATION_PLAN.md) own current progress.

Verified packet outcomes: A14+36, AI48, C15+auth9, Gfix6+63+87, Dnode8, Enode9, Fnode22, H24; counts overlap and are not a unique test total. A/B/C/D/E/G source snapshots accepted by independent reviews; F/H review active. C5+E4+F23 browser32 wave is in progress, D browser13 queued; no browser result claimed here. Runtime owner alone acquires resources; this update is documentation only.

The371-path runtime baseline is preserved; latest worker ownership manifests declare72 distinct files (51 changed hashes,21 outside baseline scope), separate from the historical321 screening and99 UI-read denominators. [Coverage and inventory limits](REMEDIATION_VALIDATION.md). DB sync is already complete; known legacy history counts are not blockers and must not trigger replay. Live providers/payment/submission, release/cleanup and unapproved contracts remain Deferred.

## Historical audit checkpoints — preserved below

Everything below retains its original dated assertions, including “current”, “none fixed”, old Not run and Deferred wording. Those statements describe their recorded audit snapshot and are superseded for remediation progress by the checkpoint above; prior passing reproductions are not fix verification.

2026-10-30 · Audited product snapshot HEAD `a19f7a2f3dc1bc54ff645d662d94fc614439256a`. **24 deduplicated groups: 2 P1 / 20 P2 / 2 P3. Full-system verification remains incomplete.**

## Current result and authorization

The user authorized actual local DB synchronization with backup/restore safeguards, then resumption of unfinished error auditing. Root coordinates only; separate Sol/high agents own implementation, SQL/runtime, audit, independent review and synthesis. Error-remediation implementation and release remain Deferred. DB synchronization has its separate [FAH-DB-SYNC-001 dossier](../FAH-DB-SYNC-001/INDEX.md).

- [Deep report](DEEP_AUDIT_REPORT.md) retains ERR-001–023 and the ERR-012/015 corrections. [Findings ERR-021–024](DEEP_AUDIT_FINDINGS.md) adds independently accepted **ERR-024 / P2**: date/time inputs show defaults while the POST config retains an empty field.
- [UI remainder review](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui-remainder-review/report.md) accepts ERR-024 and merges UIR-002 into ERR-019, UIR-003 into ERR-021/017 and UIR-004 into ERR-021. No duplicate IDs added.
- UI authors now report **99/99 complete TS/TSX reads = 43 prior + 56 disjoint remainder**, under `apps/web/{app,components,lib}`. Reviewer verified inventory/dispositions/hashes and selected units; reviewer did not reread all 99. Two original-source mocked observations were independently rerun; 8 probe-source hashes matched. This is source/mock coverage, not browser/API/SQL verification.

## Main normalization and resumed real audit — current

**Verified actual main apply at UTC2026-10-29T19:42:12 (2026-10-30 ICT):** attempt03 used exact reviewed wrapper/NoPooling helper and unchanged R1 incremental. Main current13/applied14,pending0/modelPendingfalse,POST compatible,canonical400/100bytes;only planned migration added,33business-table count/PK/full-row hashes unchanged,two exact legacy indexes INFO preserved. [Execution result](../../../../artifacts/reports/db-sync-2026-10-29/runtime/main-cutover-result-03.json),[actual POST](../../../../artifacts/reports/db-sync-2026-10-29/runtime/main-cutover-post-03.log). History14/source13 is expected known legacy,not a blocker. Main actual Program/Migrate startup/read smoke now Verified:health200,anonymous profile401,missingroute404;owned PID24496/5247 stopped on request,all34post-migration fingerprints unchanged after startup. [HTTP proof](../../../../artifacts/reports/error-audit-2026-10-29/deep/api-sql/main-http-results.json). [Final independent review](../../../../artifacts/reports/db-sync-2026-10-29/final-review/report.md) accepts scoped DB sync and bounded audit;no release/full-system claim.

Attempts01/02 stopped at unchanged guard before normalization;attempt02 proved own pooled fingerprint session. Separate NoPooling helper and attempt03 received [fresh independent GO](../../../../artifacts/reports/db-sync-2026-10-29/main-apply-review-attempt03/report.md);old helper/failed evidence retained,guard never weakened. [Attempt history](../../../../artifacts/reports/db-sync-2026-10-29/runtime/main-attempts01-02-report.md). Original SQL candidate Msg102 remains Failed/withdrawn;R1source17integration/B2SQL16pass0skip remain separate successful evidence.

[Real API/JWT/SQL follow-up](RUNTIME_API_SQL.md) now records **15scenarios+health+2authsetup=18HTTPobservations** on owned restored clone,actual User/Admin/refresh sessions,13/18existing-trace log correlations. Strengthens ERR-002actualMVC errors/traceId,ERR-005persisted failed AnalyzeForm UsageLog and ERR-013actualHTTP500/noPackagePersist;no new IDs or error fixes. Clone fixtures after B2 mean current clone is no longer byte-equal main. Browser/provider/full E2E coverage remains incomplete;do not promote old mocks or18observations to all24groups tested.

## Evidence, limits and next action

Prior backend16/fake HTTP+InMemory, UI8/mocks and browser5/HTTP fixture retain their original evidence levels. The browser was a real Next app with synthetic API/session; actual ASP.NET/auth/SQL/provider integration was not exercised. Browser capture had26 HTTP200 JS requests +1 dev HMR abort, no captured hydration exception. Ignored `apps/web/.next` cache writes were an isolation **Failed** result and remain preserved. Prior owned PIDs27304/21404, ports3137/3138 and incognito tab were released.

[Coverage](COVERAGE.md), [Validation](VALIDATION.md) and historical [321-file screening inventory](SOURCE_INVENTORY.md) retain denominators. Old manifests/reviews certify their dated bytes; new migration/tool/test files need an appended snapshot inventory rather than rewriting321 history. [Preserved baseline](../../../../artifacts/reports/db-sync-2026-10-29/dossier/baseline-documents.json) retains the pre-update dossier. Current synthesis checks belong to `db-sync-2026-10-29/dossier/current-validation.json`; older synthesis checks remain historical.

Actual configured roster: root `gpt-6.1-sol / medium` coordinator; assigned workers `gpt-6.1-sol / high`, no children/Astra. Implementer isolated checkout and task identity are recorded in DB dossier. This writer changes paired task docs/dossier evidence only and acquires no SQL/process/browser resources. Backup/owned DBs/evidence retained; no automatic cleanup, install, commit/push/deploy or paid provider/submission calls.

Next: obtain independently reviewed migration + clone/clean/guard results, complete main synchronization and applicable real API/role/runtime audit evidence, then reconcile this checkpoint with exact reports. **Deferred:** all24 error-group fixes, new error/correlation contracts, recovery/retention policy, live providers and release. Do not close full audit from manual reads or disclosures of missing checks.

## Delivered bounded follow-up — original full audit remains incomplete

The [final independent review](../../../../artifacts/reports/db-sync-2026-10-29/final-review/report.md) accepts the real API/SQL follow-up and completed local DB normalization. Register remains24groups:2P1/20P2/2P3,none fixed;ERR-013actual500 remains an existing defect. Original full-system/browser/provider gates stay open. Paired document bytes/links/AI-VI checks belong to the current dossier verifier,not reviewer translation certification. Recommended next action:select an approved remediation group;no further case expansion or automatic provider work.

## Historical task-opening and earlier checkpoints

Everything below records the permissions, progress and limits at its date. Earlier “20 groups”, “no dispatch/resources” and runtime Not run statements are superseded by the current result above; they do not describe this deep-audit checkpoint.

Date: 2026-10-29. Status: **Selected-scope static pass complete — full-system runtime verification remains Not run**.

## Request and authority

The user requested opening a task to review all error messages for: combined causes that hinder diagnosis; UI messages that confuse nontechnical readers through English or specialist terms; and console/throw messages that lack the detail needed for testing, debugging and tracing.

This request authorizes creating the paired task dossier. This checkpoint defines the audit scope and acceptance; it does not claim the audit has run or authorize a particular remediation design. No new global phase is selected. The closed [FAH-UI-002](../FAH-UI-002/CLOSEOUT.md) is context, not an active implementation queue.

## Outcome and scope

Produce a traceable inventory and prioritized findings across maintained first-party code: web UI, shared API/error helpers, API controllers/services/integrations, exception handlers, validation, browser/server console and logging. Include user/admin, auth, credit/top-up/payment, form automation, AI and the separately governed NCKH track. Inspect maintained scripts and test helpers where they hide or distort application failures.

Follow errors from origin through catch/translation/HTTP/client handling to UI and diagnostic output. Include inline validation, toast/dialog/page errors, callback failures, empty/error states and asynchronous failures. Inventory reachable runtime branches and code-only branches separately. Exclude generated/vendor/build output from first-party code review; evaluate how external errors are handled at the integration boundary.

Three finding groups:

1. **Combined or misclassified causes:** unrelated failures collapsed into one message; failed requests shown as empty data/success; useful error codes or causes overwritten; fallback/retry hiding failure.
2. **User comprehension:** untranslated English, unexplained terminology, vague wording, wrong language, missing affected action or practical next step, contradictions between UI and actual outcome. Prefer plain Vietnamese; assess necessary product names and technical terms in context rather than banning every English word.
3. **Diagnostic completeness:** swallowed exceptions, lost original cause/stack, context-free throws/logs, wrong severity, duplicate noise, absent operation/layer context or inability to connect UI/API/log evidence. Review existing tracing support before proposing additions.

## Review criteria

- UI tells a nontechnical reader what failed and what they can reasonably do next; do not invent a cause, promise retry success or imply an operation was safely undone without evidence.
- Distinguishable actionable failures retain that distinction through the relevant layers. Deliberately generic auth/security messages may be necessary to prevent account enumeration; explain that rationale and assess internal diagnosis separately.
- Internal diagnostics preserve useful original exception information and relevant safe context. Never copy raw provider errors, stack traces, SQL, secrets, credentials, tokens or personal payloads into UI or committed evidence.
- Describe current error codes/statuses/payloads from source and contracts. Do not assume that `ProblemDetails` is approved: [API contract guide](../../API_CONTRACT_GUIDE.md#error-response-rules) labels it a candidate only.
- Any proposed changes to response shape, codes/statuses, tracing fields, DB/schema, retention or business behavior require explicit contract/scope review; they are not implicit audit acceptance.

## Deliverables and finding format

Keep the coverage inventory and findings in this paired dossier; split into `COVERAGE.md` and `FINDINGS.md` when the audit starts. Store necessary redacted runtime evidence under `artifacts/reports/error-audit-2026-10-29/`; creating this brief does not create or publish those artifacts.

Each coverage row records module/surface, role, error origin, handlers/consumers, UI/log destination, scenarios examined, evidence level (static/mock/local runtime/live), status and any exclusion/blocker. Record search boundaries and counts so “all” has an assessable denominator; pattern searches alone do not establish full coverage.

Each finding records:

- Stable ID, group, severity and reason; module/layer and exact source symbol/path at the audited snapshot.
- Trigger and distinct possible causes; current UI text and diagnostic output, redacted as needed.
- Expected versus observed behavior; impact on users or test/debug/trace work.
- Evidence/reproduction and whether reproduced or a static hypothesis; related duplicate findings.
- Proposed UI wording and/or diagnostic improvement, affected consumers, contract/security implications, validation approach and suggested repair order.

Keep a central-fix/consumer map to avoid treating one shared helper defect as dozens of independent fixes. Separate quick wording changes from fixes that alter error propagation or contracts; final remediation scope follows user review.

## Work sequence and acceptance

- [x] Open a paired task brief reflecting the three requested goals and explicit boundaries.
- [x] Establish the actual audit snapshot, module/route/handler inventory and first-party search boundary.
- [ ] Read complete relevant units and dependencies; trace error propagation rather than reviewing isolated strings.
- [ ] Classify all inventoried surfaces/scenarios; record unexamined or blocked cases explicitly.
- [ ] Reproduce representative high-impact failures safely and correlate UI, network and logs. Cover validation, auth/permission, unavailable network/server, provider failure, timeout and unexpected response where applicable; do not manufacture new business states.
- [x] Produce prioritized evidence-backed findings, suggested wording/diagnostics, shared fix groups and validation recommendations.
- [x] Self-review coverage, confidentiality, contract fidelity and AI/VI parity; record any independent review separately.
- [x] Present the audit and concrete remediation proposal for review. Opening this task is not completion of these audit gates.

Use `Verified`, `Failed`, `Not run` and `Blocked` for actual checks. A blocked runtime scenario remains a coverage gap; static inspection or mocks do not prove live behavior. Do not declare the full audit complete while required coverage remains unresolved.

## Snapshot, ownership and permitted zones

- Workspace: `D:/TinHoc/FormAuto_Hub`; branch: `ui/compact-refinement-20261028`.
- Task-opening HEAD: `606de1eccd9ac21fc91c5d8933d7b9bde8821623`; tracked/untracked Git status was clean before these new files. Ignored evidence was not enumerated or modified.
- Writer: root; actual runtime model/effort: `gpt-6.1-sol` / medium. No subagent dispatched; no independent review performed. This brief does not grant delegation permission. Any later authorized child work must obey the live catalog and Sol-only ceiling in [AGENTS](../../../../AGENTS.md).
- Writable scope at opening: `docs/ai/tasks/FAH-ERR-001/` and the same relative `docs/vi/` dossier. Product source is unchanged.
- Preserve prior ignored artifacts, databases, processes and user browser tabs. No process/port/DB/browser resources acquired; no dependency installation, commit, push, merge, deploy or cleanup performed.
- Read actual target identity/ownership before future runtime work. Prior UI closeout reports API restoration blocked by a DB/source migration mismatch; that is historical evidence, not a fresh runtime check or permission to repair the DB.

## Validation and next action

Task-opening verification checked Markdown links, UTF-8, paired scope/commitments and changed-file boundaries. At opening, application checks, findings and runtime verification were **Not run**; the checkpoint below supersedes that progress state.

## Checkpoint — initial inventory and shared handling (historical, superseded below)

The user requested “Next step”, authorizing the planned inventory and audit evidence. New audit HEAD: `a19f7a2f3dc1bc54ff645d662d94fc614439256a`; starting Git status had only this paired task dossier untracked. Preserve the newer external commit; do not reset to the task-opening HEAD.

- [Coverage](COVERAGE.md): 304 selected source/test/script files, 29 page templates, 25 controllers; 20 full files read, 2 focused reads, 282 queued. Scope filters and discovery gaps are explicit.
- [Source inventory](SOURCE_INVENTORY.md): per-file search signals and reading status; source hashes in local task evidence.
- [Findings](FINDINGS.md): five P2 findings; five isolated mocked observations reproduced, plus one source-traced analysis/history finding. Observations and findings are not a one-to-one count.
- Verified: actual helper probe 5/5 and existing `npm run test:auth` 9/9. These confirm the documented behavior/session regressions, not fixes or live integration. Product source unchanged.
- Not run: browser/API/DB/provider reproduction, build/lint, fresh runtime prerequisite inspection and independent review. Full audit gates remain unchecked. No process/DB/browser resources acquired; no dispatch/commit/push/deploy/cleanup.
- Self-review only: distinguish static/mock/runtime evidence, preserve generic credential protection, avoid assuming an approved error contract, and keep AI/VI commitments aligned. Apply documentation checks before handoff.

Next action: continue payment/credit/submission controller/service tracing, then NCKH and consumers; expand discovery to relevant root launchers/runtime configuration. Inspect actual runtime/schema prerequisites read-only before reproductions; startup auto-migration is not read-only. **Deferred:** product remediation, new error contracts/tracing architecture, DB mismatch repair, provider-cost actions and release.

## Checkpoint — full selected-scope pass 2026-10-29

User instruction “Rà xoát hết 1 lượt đi” authorizes all modules and dossier/evidence updates. HEAD remains `a19f7a2f3dc1bc54ff645d662d94fc614439256a`. Writable scope now includes `artifacts/reports/error-audit-2026-10-29/`; product unchanged.

- [ERR-006–020 report](FULL_PASS_FINDINGS.md), with [ERR-001–005](FINDINGS.md): **20 groups, 2 P1 / 17 P2 / 1 P3**. P1 covers interrupted external-operation evidence and raw AI payload logging, not confirmed production incidents.
- [Coverage](COVERAGE.md) and [inventory](SOURCE_INVENTORY.md) supersede the 304-file checkpoint: **321 files automatically screened in full**, 105 with 701 signal lines, 216 without matches; candidates reviewed and key cross-layer flows inspected. Do not interpret this as 321 full manual reads or every branch tested.
- [Validation](VALIDATION.md): backend 158/158, auth 9/9, UI/helper probes 11/11 and 4 backend structural assertions. Passing checks establish current behavior, not fixes.
- All module groups have a static-pass disposition, prioritized proposals and shared repair groups. Self-review performed; UTF-8/link/hash/parity checks recorded in artifact. Independent review Not run; no subagent dispatched.
- Runtime/browser/API/SQL/provider Not run; inspected local ports had no listeners. API startup auto-migrates: establish target/schema first. No implicit prior DB mismatch repair or paid provider/submission calls.

Original checkboxes remain open because complete runtime evidence is missing; do not close the full audit as system-verified. This static pass is handed over, with no next module left within the pass. Recommended next step: review prioritized remediation groups, then design/test/implement each approved group. **Deferred:** all product/contract/schema/retention/recovery changes and release. No commit/push/deploy/cleanup; root gpt-6.1-sol / medium, no runtime resources acquired.
