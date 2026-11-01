# FAH-ERR-001 — Remediation ledger

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

2026-10-30 · Baseline HEAD `a19f7a2f3dc1bc54ff645d662d94fc614439256a` · **Plan prepared; this ledger has not certified any finding fixed.**

## Authorization, snapshot and ownership

- New session authorization covers all24finding/source/test/doc fixes; root coordinates only. No commit/push/merge/deploy/cleanup/paid providers/real payment/real submission. No new global phase.
- Shared checkout `D:/TinHoc/FormAuto_Hub`, branch `ui/compact-refinement-20261028`; root selected file ownership to retain uncommitted DB-sync rather than a HEAD-only worktree omitting baseline. Workers capture their own hashes; no automatic commits or incomplete baseline copying.
- Actual root `gpt-6.1-sol/medium`; root verified catalog `codex_cx_via_9router`, model `gpt-6.1-sol`, `reasoningEffort=high`. Native intake/workers explicitly `gpt-6.1-sol/high`, no Astra/children. Verify catalog before every dispatch; do not dispatch unverifiable configurations.
- Intake `/root/intake_matrix` owns only paired `REMEDIATION_PLAN.md`/`REMEDIATION_LEDGER.md`; no source/runtime/build/test/SQL. Root sends coordination updates through followup; workers write separate artifact reports.
- `/root/p1_submission` assigned008/007: SubmissionService,Services/Nckh/ResearchDataService,ResearchFormService and new FahErrSubmission tests; no csproj/schema/DB-sync.
- `/root/runtime_owner` alone owns SQL/processes/ports/fixtures/browser/shared runners,root-verified `gpt-6.1-sol/high`. This ledger does not acquire those resources.
- B planned009/011: adapter/AiGenerationService/AiAnalyticsService/tests. C precedes D/E/F; G waits for A's ResearchFormService release for010. Detailed zones/acceptance are in the [plan](REMEDIATION_PLAN.md).

## Preserved dirty/untracked baseline

At intake `git status --short` showed one tracked dirty file: `tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj`. These untracked paths predate remediation and remain preserved:

```text
artifacts/reports/db-migration-analysis-2026-10-29/
artifacts/reports/db-sync-2026-10-29/
artifacts/reports/error-audit-2026-10-29/
docs/ai/tasks/FAH-DB-SYNC-001/
docs/ai/tasks/FAH-ERR-001/
docs/vi/tasks/FAH-DB-SYNC-001/
docs/vi/tasks/FAH-ERR-001/
scripts/db-compatibility/
src/FormAutoHub.Api/Data/Migrations/20261029142938_NormalizeTopupEvidenceColumnLengths.Designer.cs
src/FormAutoHub.Api/Data/Migrations/20261029142938_NormalizeTopupEvidenceColumnLengths.cs
tests/FormAutoHub.Tests/BaselineModelGuardTests.cs
tests/FormAutoHub.Tests/DbCompatibilityPolicyTests.cs
tests/FormAutoHub.Tests/SqlServerMigrationFixture.cs
tests/FormAutoHub.Tests/TopupEvidenceSchemaMigrationTests.cs
tests/FormAutoHub.Tests/TopupEvidenceSqlServerTests.cs
```

No ignored/backup content inventory was acquired for modification/deletion. Preserve all ignored outputs,old.next,DP keys,backup/DB/worktree/evidence; no reset/clean/overwrite. Limited local DB-sync completed per [DB INDEX](../FAH-DB-SYNC-001/INDEX.md)/[DB VALIDATION](../FAH-DB-SYNC-001/VALIDATION.md): main current13/history14 includes known legacy,pending0/modelPendingfalse. Do not rerun migrations/backup/normalization. Prior clone now contains fixtures and is no longer byte-equal main; historic preservation proof is not a current-state assertion.

## 24-ID register

Source reconciliation only confirms located source/symbol/consumer/tests per [plan](REMEDIATION_PLAN.md),not fix verification. At intake all remediation tests/runtime/reviews below are **Not run**. Append actual author/runner outcomes later; do not remove RED or earlier failure evidence.

| ID | Short name / owner | Intake source disposition | Implementation | Test/runtime/review | Next action |
| --- | --- | --- | --- | --- | --- |
| ERR-001 | HTTP login / C | api/login/auth tests reconciled | Not run | Not run | Typed HTTP,generic credentials |
| ERR-002 | validation/trace / C | Parser reconciled; existing real MVC evidence | Not run | Not run | Existing metadata,safe fields |
| ERR-003 | raw/network text / C | api/toast/direct consumers reconciled | Not run | Not run | Safe fallback,abort,console |
| ERR-004 | blob errors / C | Blob/evidence/export/auth reconciled | Not run | Not run | Shared parser,preserve Google/JWT |
| ERR-005 | analyze/history / G | Client/service/usage; prior SQL evidence | Not run | Not run | Boundary message,no backfill |
| ERR-006 | PayOS raw body / G | PayosClient→PaymentService→controller | Not run | Not run | Remove raw public body,stub tests |
| ERR-007 | wrong usage outcome / A | SubmissionService/usage consumer | Assigned | Not run | Status/count wording,with008 |
| ERR-008 | external interruption / A | Send/collect/create; prior InMemory evidence | Assigned | Not run | Fault tests,fresh persistence |
| ERR-009 | AI raw logging / B | Adapter logger/run/batch reconciled | Not run | Not run | Bounded metadata,security review |
| ERR-010 | Google null collapse / G | OAuth/Forms boundary/callback | Not run | Not run | Wait for A's ResearchFormService |
| ERR-011 | omitted AI reason / B,D | ToResponse/analytics/forms reconciled | Not run | Not run | Safe cause/runId,review DTO delta |
| ERR-012 | rule constraint collapse / G | Preserve syntax-inner correction | Not run | Not run | Constraint-specific errors/tests |
| ERR-013 | admin validation500 / G | Package/controller; prior real HTTP500 | Not run | Not run | Known400/no-write,Admin/User |
| ERR-014 | profile read reset / D | loadAiPromptProfile/save reconciled | Not run | Not run | Unknown state,retry/guard |
| ERR-015 | mixed write/read / D,F | Preserve NCKH-resolve correction; AI/topup/admin | Not run | Not run | Retain result/IDs,GET-only retry |
| ERR-016 | false missing detail / F | top-up/[id] catch/render | Not run | Not run | Separate404 from503/network,after C |
| ERR-017 | stale model slices / E | loadModelData/effects reconciled | Not run | Not run | Ownership/validity/race regression |
| ERR-018 | substring mapping / C,E | Register/NCKH mapper/provider discriminator | Not run | Not run | Exact known cause,unknown fallback |
| ERR-019 | implementation wording / D,E,F,G | Audited leaf/service-consumer mapping | Not run | Not run | Audience-aware Vietnamese/local check |
| ERR-020 | weak exploratory scripts / H | Three scripts read,not executed | Not run | Not run | Fixture/assertion/honest label |
| ERR-021 | unknown rendered empty / E,F | Account/list/dataset/admin search | Not run | Not run | Loading/known-empty,disable writes |
| ERR-022 | clipboard rejection / F | Four handlers reconciled | Not run | Not run | Catch/manual guidance/keyboard |
| ERR-023 | omitted attempt details / D | DTO/mapping/helpers/render reconciled | Not run | Not run | Safe cause/existing IDs/008uncertainty |
| ERR-024 | date/time view-state / D | Readers/editor/save/backend validation | Not run | Not run | Clear both ends,payload=display |

## Subsequent coordination checkpoint — root reported

- B dispatched as `/root/p1_ai`,root verified catalog before dispatch,native explicit `gpt-6.1-sol/high`; owns adapter/AiGenerationService/AiAnalyticsService and new FahErrAi tests for009/011. No children/Astra. Initial register Not run rows describe pre-dispatch intake,not lack of B assignment.
- Runtime owner reported **P1A RED12/12 Failed,zero compile errors** on baseline: expected pre-fix regression failures,not GREEN/build failure. Root reported371baseline source hashes+patch saved under runtime evidence; intake did not rerun and exact report path will be appended from the owner packet.
- Initial register test/runtime/review Not run is the historic intake snapshot; A/007–008 tests now have owner-reported RED. Fixed-code persistence/runtime/review remain Not run until the next packet.
- Added008→023 dependency: unknown Failed attempt/errorMessage must show uncertain remote outcome and no resend before checking; batch count `length-successCount` does not prove externally unsent. Never claim rollback.

## Resume checkpoint — 2026-10-30, root-reported dispatch

- Root rechecked current catalog and explicitly dispatched `/root/backend_resume`, `/root/ai_contract_resume`, `/root/shared_web_resume` as `gpt-6.1-sol/high`; actual root remains `gpt-6.1-sol/medium`. No nested dispatch. Earlier worker names are historical ownership records.
- `/root/shared_web_resume` now owns paired remediation plan/ledger plus zone C shared web/auth (security panel mapper only; F retains state ownership). Web source was unchanged at resume; prior `shared-web/` artifact directory was absent. Before hashes were captured without changing preserved work.
- C wrote `apps/web/tests/fah-err-shared-errors.test.cjs` for typed HTTP/blob metadata, safe validation/trace, raw payload rejection, network/abort/invalid JSON and actual source auth mappers. **Not run:** RED/GREEN; runtime owner executes before implementation. Packet: `artifacts/reports/error-remediation-2026-10-30/shared-web/`.
- User explicitly approved ERR-011 optional nullable safe Vietnamese `errorMessage` on `AiGenerateResponsesResponse` and `AiRecentRunResponse`. Backend/contract owner `/root/ai_contract_resume`; C adds TypeScript field after exact type handoff. No raw persisted/provider diagnostic or other DTO change is approved by this delta.
- Runtime-reported checkpoints: AI RED25 valid (includes eight response-shape cases); G RED47 with 44 Failed/3 Passed; A/B independent review remains pending. These are regression/pre-fix outcomes, not remediation closure.
- C runtime RED2: 13 Failed/0 Passed/0 Skipped, seven source hashes plus test stable; `runtime/shared-web-red2/{test.log,verification.json}`. Nine assertion failures plus four product-interface/signature TypeErrors. C replaced those four with explicit interface/mapper assertions; RED3 is pending before production changes. First `shared-web-red` snapshot script failed on absolute Join-Path and is retained as failed evidence.
- C RED3 subsequently confirmed 13 Failed/13 top-level ERR_ASSERTION, no unguarded errors; seven baseline sources unchanged and eight run hashes stable. Runtime evidence: `runtime/shared-web-red3/`. C then implemented shared `ApiError`, safe JSON/blob parsing, cancellation/transport handling, safe toast and typed login/register/security mappers; history catch consumers use the safe mapper. Generation result includes the approved optional `errorMessage`; recent-run type remains local to `ai-usage/page.tsx` for D.
- C frozen GREEN-ready packet includes 15 unit/source-mapper cases (13 RED regressions plus two supplemental security/Google conflict cases) and five focused browser caller cases. Runtime owner `/root/runtime_resume` executes tests/build/browser; writer only ran static diff checks and scoped Impeccable detector (empty findings). Auth/security independent review remains **Not run**; no C finding closed. D/E/F may consume the ready interface, F receives security state ownership.
- Root-reported independent review accepted original A/B scope ERR-007/008/009; AI response-shape/ERR-011 additions are GREEN48 and await independent review. These results do not close the remaining 24-ID/runtime gates.

## Current execution matrix — 2026-10-30 08:56 UTC / 15:56 ICT

[Full24-ID acceptance matrix](REMEDIATION_VALIDATION.md) supersedes the old intake implementation column. All24 source changes are implemented; **none Done**. Verified: A14+36, AI48, C15+auth9, Gfix6+63+87, D8, E9, F22, H24 (overlap; not a unique total). Independent source review accepts A/B/C/D/E/G frozen snapshots; F/H active. Browser32 C5/E4/F23 is running; D13 supplemental spec frozen/pending. Actual Program/JWT/SQL/fault/log/current-role/browser/lint/build gates remain Not run until owner reports exact outcomes.

Documentation synthesis dispatch `/root/shared_web_resume` is explicitly catalog-checked `gpt-6.1-sol/high`; actual root `gpt-6.1-sol/medium`. Root reports the same catalog check and explicit Sol/high ceiling for each resumed runtime `/root/runtime_resume` and review `/root/review_ab_resume` dispatch; no children/Astra. Source writers remain resource-free. Final72-owned-file declared delta is compared with preserved runtime371 baseline in the linked validation inventory, not arbitrary Git status or the different323 runtime subset.

C browser fixture error and D initial fixture failures remain Failed evidence; corrected test locators do not alter product source. G original P2 nested-null is fixed, GREEN6/63/87 and fresh review accepted; AI shape P2 similarly has fresh GREEN48/review. H actual GREEN24 is verified; F manual-grant RED1 preceded final fix and GREEN22. Required follow-up review/runtime may still uncover acceptance failures; no blanket completion.

## Intake validation and limits (historical)

- **Verified:** relevant rules/handoffs read; all24IDs reconciled with012/015corrections preserved; source/consumer/tests located,Git baseline and ownership/contract gates recorded; four new paired docs with equivalent commitments created.
- **Not run:** remediation build/test/lint/runner/browser/API/SQL. Intake has no operational ownership; old checks are baseline only. Large source units are located; implementers must read complete units/dependencies/tests before edits.
- **Not run:** new independent remediation review. Documentation self-review cannot replace auth/security/payment/submission review. Root schedules Sol/high reviewer against fixed snapshot/hash.
- **Risks:** shared checkout requires strict file ownership; mocked API fixtures do not establish SQL transactions; typed errors affect shared/auth consumers; safe AI reason may require reviewed DTO delta;008external outcomes must remain uncertain,never replayed.
- **Deferred:** live provider,payment charge,real submission,release,cleanup,historical backfill and new recovery/retention/schema/lifecycle/correlation policy.

## Exact next action

Runtime owner executes H GREEN24, C fixture browser5 rerun, D13/E4/F23 browser and applicable regressions; record F/H verdict and actual API/SQL fault wave against current fixed manifests. Preserve required owned restart/API/SQL/log/chunk/role/persistence gates as Not run until executed. Every report returns per-ID evidence and limits; do not close all24IDs from aggregate test totals.
