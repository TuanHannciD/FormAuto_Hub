# FAH-ERR-001 — Current coverage and gaps

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

2026-10-30 · Audited HEAD `a19f7a2f3dc1bc54ff645d662d94fc614439256a`. **24 groups: 2 P1 / 20 P2 / 2 P3; source coverage is not full runtime coverage.**

## Main normalization and resumed real audit — current

**Verified actual main apply at UTC2026-10-29T19:42:12 (2026-10-30 ICT):** attempt03 used exact reviewed wrapper/NoPooling helper and unchanged R1 incremental. Main current13/applied14,pending0/modelPendingfalse,POST compatible,canonical400/100bytes;only planned migration added,33business-table count/PK/full-row hashes unchanged,two exact legacy indexes INFO preserved. [Execution result](../../../../artifacts/reports/db-sync-2026-10-29/runtime/main-cutover-result-03.json),[actual POST](../../../../artifacts/reports/db-sync-2026-10-29/runtime/main-cutover-post-03.log). History14/source13 is expected known legacy,not a blocker. Main actual Program/Migrate startup/read smoke now Verified:health200,anonymous profile401,missingroute404;owned PID24496/5247 stopped on request,all34post-migration fingerprints unchanged after startup. [HTTP proof](../../../../artifacts/reports/error-audit-2026-10-29/deep/api-sql/main-http-results.json). [Final independent review](../../../../artifacts/reports/db-sync-2026-10-29/final-review/report.md) accepts scoped DB sync and bounded audit;no release/full-system claim.

Attempts01/02 stopped at unchanged guard before normalization;attempt02 proved own pooled fingerprint session. Separate NoPooling helper and attempt03 received [fresh independent GO](../../../../artifacts/reports/db-sync-2026-10-29/main-apply-review-attempt03/report.md);old helper/failed evidence retained,guard never weakened. [Attempt history](../../../../artifacts/reports/db-sync-2026-10-29/runtime/main-attempts01-02-report.md). Original SQL candidate Msg102 remains Failed/withdrawn;R1source17integration/B2SQL16pass0skip remain separate successful evidence.

[Real API/JWT/SQL follow-up](RUNTIME_API_SQL.md) now records **15scenarios+health+2authsetup=18HTTPobservations** on owned restored clone,actual User/Admin/refresh sessions,13/18existing-trace log correlations. Strengthens ERR-002actualMVC errors/traceId,ERR-005persisted failed AnalyzeForm UsageLog and ERR-013actualHTTP500/noPackagePersist;no new IDs or error fixes. Clone fixtures after B2 mean current clone is no longer byte-equal main. Browser/provider/full E2E coverage remains incomplete;do not promote old mocks or18observations to all24groups tested.

| Surface | Current coverage/evidence | Remaining boundary |
| --- | --- | --- |
| Historical first-party screen | 321 files:255 product,8 runtime-config,12 scripts,46 test-support;105 with701 signal lines,216 without matches. [Inventory](SOURCE_INVENTORY.md). | Automated source screen, not321 full manual reads. Keep manifest immutable; append approved new DB source inventory separately. |
| UI/shared source | **99/99 complete TS/TSX reads attributed to two authors:43+56 disjoint** under app/components/lib. [Remainder dispositions](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui-remainder/coverage.json). | Excludes tests/config/CSS and other repo source; not every runtime branch. Reviewer checked list/hashes and selected full units, did not reread all99. |
| UI mocked behavior | Prior8 observations plus2 new date/time observations; new two independently rerun,8 probe-source hashes matched. [Review](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui-remainder-review/report.md). | AST/helper/component/handler + API mocks; no React DOM/HTTP/SQL. End fields source-traced but not separately probed. ERR-024 accepted; three extensions merged019/021/017. |
| Backend | Key full units/focused ResearchFormService sections in [backend report](../../../../artifacts/reports/error-audit-2026-10-29/deep/backend/report.md);16 observations in10 probe groups. | InMemory/fake HTTP/logger; no universal manual denominator or actual MVC/SQL/provider proof. |
| Prior browser | Five guest/synthetic User observations using real Next3137 + API fixture3138:login401,top-up detail503,profile503,security503,NCKH list503. | Actual ASP.NET/JWT/SQL is now covered separately by clone follow-up;no provider/Admin browser integration; save profile not clicked. |
| Browser chunks/console |27 JS captures:26 HTTP200,1 dev HMR abort; observed screens rendered, no captured hydration exception. | Bounded captures, not all chunks/traffic; ignored `.next` write isolation Failed and cache preserved. |
| SQL diagnosis | Historical diagnosis:all12 then-current migrations applied;history13 includes known Phase10;pending0/model-pendingfalse at that snapshot. Actual two max-column differences, two exact compatible legacy indexes. [Schema report](../../../../artifacts/reports/db-migration-analysis-2026-10-29/schema/report.md). | Count inequality is not failure. No prior observed startup crash. Startup previously not run under read-only authorization because Program migrates. |
| DB sync safety | [Stage A](../../../../artifacts/reports/db-sync-2026-10-29/runtime/stage-a-report.md):backup+VERIFYONLY/header,actual restore+CHECKDB,34-table count/PK/full-row hash equality; Stage A clean0tables is historical;B2 clean now current13history. | Main unchanged/history13;R1integrated/B2SQLverified;main apply/API await exact evidence in [DB validation](../FAH-DB-SYNC-001/VALIDATION.md). B2 clean/restored/safety are POST compatible;main state remains separate. |
| Independent reviews | Earlier reviewer reran backend16/UI8 and asserted five saved browser captures; new reviewer accepts ERR-024 and checks99-file provenance/two probes. | No new browser/API/SQL/provider rerun by reviewers; no full-system acceptance. |

[Deep report](DEEP_AUDIT_REPORT.md) owns24-group dispositions; [findings](DEEP_AUDIT_FINDINGS.md) defines ERR-021–024. ERR-012 malformed-syntax cause and ERR-015 NCKH-mutation claims remain corrected. UIR-002 merges019; UIR-003 merges021/017; UIR-004 merges021. No error fixes implemented. DB implementation is separately authorized, not a reason to claim all product bytes remain unchanged indefinitely.

Prior resources released; backup/owned clone/clean DBs/evidence retained. Full real API/SQL/provider/error-branch acceptance remains incomplete. New current document checks are in `db-sync-2026-10-29/dossier/current-validation.json`; earlier checks remain evidence for earlier bytes only.

## Historical selected-scope screening coverage

The following is preserved from the earlier checkpoint. Its no-dispatch/no-runtime statements and source-pass status are historical, superseded above.

2026-10-29. **One selected-scope static screening pass completed; full-system runtime verification remains incomplete.**

## Scope and interpretation

- User instruction “Rà xoát hết 1 lượt đi” authorizes all module groups, beyond shared handling. No product remediation approved.
- HEAD `a19f7a2f3dc1bc54ff645d662d94fc614439256a`, branch `ui/compact-refinement-20261028`; product unchanged. No dispatch, process/DB/tab acquisition, installation, commit/push/deploy/cleanup.
- 321 files: 255 product, 8 runtime-config, 12 script, 46 test-support. 29 page files, 25 controller files (26 controller classes), plus webhook proxy route.
- `full-pass.py` reads every selected file, hashes it and catalogs catch/throw/log/message/null/false signals: 105 files with 701 signal lines; 216 without matches. Candidate groups were reviewed and important flows traced below. This does not mean every full file was manually read or every implicit error found.
- Expanded 304-file discovery to 321 with tracked root launchers/config/workflows/scripts. Excludes generated migrations/designer/snapshots, vendor/build, private ignored configuration, skills, docs/templates/prototypes, media/CSS/lockfiles. SQL migration/provider SDK/production-log audits were not performed.
- Regex can miss returned string/Result validation, framework failures, dynamic messages and races; important flows were read beyond regex. `no-pattern` is not error-free. This is an assessable one-pass boundary, not a clean-bill certification.
- [321-file inventory](SOURCE_INVENTORY.md), [manifest/hashes](../../../../artifacts/reports/error-audit-2026-10-29/full-pass-manifest.json), [initial findings](FINDINGS.md), [15 additional groups](FULL_PASS_FINDINGS.md).

## Modules, paths and audiences

| Module / audience | Error path and scenarios inspected | Result / evidence | Unverified |
| --- | --- | --- | --- |
| Shared / all roles | apiFetch/blob → mapper → toast/console; validation HTTP, 401, HTML, fetch rejection | ERR-001–004; 5 probes Verified | Real HTTP/browser/log content |
| Auth / guest, user | Controller/service/verifier → login/register/Google callback, profile/security | ERR-001/018/019; 9 auth tests Verified; FULL-03 | Actual validation payload/browser login; preserve anti-enumeration |
| Dashboard/history / user, admin | Controller/service/query → load/error/empty; usage/credit/AI/admin statistics | Static; ERR-005/007/011; usage/credit distinguish load failure from empty | DB rows, browser role/session |
| Credit/top-up/packages / user, admin | Dedicated credit/transaction, top-up/evidence/admin services/controllers → form/list/detail | ERR-013/015/016/019; static | DB/concurrency failures, upload/download, credit writes |
| PayOS / user, admin, webhook | Client → service/controller → UI; config/link/return/webhook proxy | ERR-006/015/019; FULL-05 Verified; Applied=false with 200 is not inherently wrong | Sandbox signature/webhook/link, retry contract/persistence |
| Forms / user | GoogleFormsClient → project analysis → UI/usage; rules/config → previews | ERR-005/012/019; static/structural assertion | Actual Google/parser failures; UI validation |
| Submission / user | Payload validation → Running → external send → log/save → history | ERR-007/008; structural assertion; no submission | Mid-batch fault injection, SQL persistence, timeout state |
| AI / user, admin | Prompt guard/profile/output validator → provider/settings → run/analytics/UI | ERR-009/011/014/019; FULL-04 Verified | Actual provider/credit/timeout, log sink, DB raw retention |
| NCKH Google / user | OAuth/link/refresh → Forms import/create/update → callback | ERR-008/010/019; cross-layer source tracing | Provider 400/403/404/429/503; post-creation failure |
| NCKH model/canvas / user | Controller/service validation → mapper; model switch → allSettled datasets; mutation/reload | ERR-015/017/018/019; FULL-01/02/06 Verified | Browser stale data/reload/save, out-of-order responses |
| NCKH collect/export/delete / user | Collection log/null/exception; export validation → blob; delete impact guard | ERR-004/008; preserve good delete guard | SQL/HTTP collect/export; no deletion executed |
| Runtime/config/CI/scripts | Program/logging, launcher, compose, workflow/deploy, smoke | ERR-020; startup migration confirmed in source | No login/mutation/deploy scripts executed |
| Test-support/entity/DTO/interface/static UI | Signal screening and existing failure tests; validators/consumers opened where needed | 158 backend tests Verified; remaining catalogued/no-pattern | Supporting tests and no-pattern files do not certify runtime |

## False-positive safeguards

- Preserve generic credential errors against enumeration; diagnose missing configuration internally.
- Swallowed animation cancellation and discarding corrupt local resume JSON are intentional fallbacks, not automatic defects.
- NCKH model deletion checks exact name/fresh impact and reports uncertain delete outcome; preserve that safety.
- Launcher distinguishes missing tools; deploy preserves exit with bounded trap logs. Console use alone is not a defect.
- No error.tsx/global-error.tsx in the selected set is not itself a defect. No confirmed API key leak, XSS or duplicate payment.

## Remaining coverage

Every module group above has a static-pass disposition. API/browser/SQL/provider runtime remains **Not run**. Read-only inspection found no listeners at 3020/7039/3000/5000. Program auto-migrates DB; establish target/schema before startup, without implicitly repairing DB. Prior UI DB/source mismatch is historical and not freshly confirmed. Missing listeners do not mean browser tools are absent.

Self-review performed; independent review **Not run**, no dispatch authorization. No runnable change was made; this documentation does not certify a fix/integration/release. See [Validation](VALIDATION.md) and proposed remediation order.
