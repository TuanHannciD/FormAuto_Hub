# FAH-ERR-001 — Ledger khắc phục

## Acceptance local cuối — 2026-10-30 13:50 UTC

**24 đã sửa /24 Verified /0 finding mở trong phạm vi remediation local đã duyệt.** [Review độc lập tổng fresh](../../../../artifacts/reports/error-remediation-2026-10-30/final-overall-review/report.md) chấp nhận source, check bắt buộc phù hợp và paired docs; SHA256 report `15b99709168ff1b61951642a5be1128fc20dee5a0a5f807067e3d5130db6181c`. Không claim toàn hệ thống hết bug, integration hay release. [Bảng acceptance/bằng chứng24 ID hiện hành](REMEDIATION_VALIDATION.md) sở hữu trạng thái hiện tại, thay phát biểu tiến độ cũ bên dưới; vẫn giữ các phát biểu cũ làm lịch sử theo ngày.

Review cuối thấy residual P2 ERR-001/003/018 ở core `/auth/callback?id_token=...`. Fix tối thiểu nay chỉ map typed ApiError Google POST409/401 sang hướng dẫn hiện có, còn lại fallback chung an toàn. RED3 hợp lệ trước fix. Verified: Node27=callback3+shared15+auth9, build mới exit0, lint exit0 với đúng hai warning đã review; review source đúng scope chấp nhận. Browser10 đầu=7pass/3strict-locator fail, sau sửa targeted callback3 pass đủ assertion. Test giới hạn alert trong region AuthShell có nhãn; route announcer rỗng của Next nằm ngoài. Sửa fixture không đổi production; giữ evidence Failed.

Evidence Verified khác: backend Release build;291pass/6SQLmigrationSkipped/0fail; SQL durability9; AI services/controller thật+fake adapter SQL6 lượt/5scenario; Program25HTTP thật+SQL độc lập; browser/CLI/Node tập trung. D vẫn split10pass+targeted4, không full13rerun; broad83 vẫn69pass/14fail rồi rerun target. Hfinal3ESMpass không xóa cold health fail cũ chưa rõ cause. Không claim provider/payment/submission thật.

Process riêng cuối đã release/listener không còn tại `runtime/auth-callback-final/release.json`; API có proof riêng. `generated-config-restoration.json` restore tsconfig SHA5BB0AC… và next-env SHA F4E897… **đúng byte baseline371 ban đầu**. Proof tsconfig C706… trước chỉ thuộc snapshot LF trước wave sau, không byte ban đầu; proof cuối thay claim độ chính xác đó. Giữ cache/fixture rows.

[Inventory ownership cuối](../../../../artifacts/reports/error-remediation-2026-10-30/dossier-checkpoint/owned-delta-from-baseline371-final.json):80file riêng=52product+22test+2contractdoc+4tooling;57hash đổi so baseline371/23ngoài scope (không tự chứng minh file mới).75overlap runner343 hiện hành khớp, năm path ngoài scope runner; actual hash không drift. Không làm lại DB-sync/đếm dirty tùy tiện. Manifest runner SHA7183A217… chứa byte callback/fixture cuối.

Root `gpt-6.1-sol/medium`; mọi dispatch tiếp tục kiểm catalog/đặt rõ `gpt-6.1-sol/high`, không con/Astra. Sole runner `/root/runtime_resume` giữ runtime; writer chỉ sửa source/test đã giao hoặc paired docs/artifact static đúng ownership được duyệt. Verdict review tổng fresh đã accepted; cập nhật sau review này chỉ đổi status/link theo verdict và chỉ đạo root. Không commit/push/merge/deploy/cleanup/provider action.

## Checkpoint lịch sử — giữ tiến độ trước bên dưới

## Root cập nhật mới nhất — thay trạng thái chờ ở checkpoint cũ

Backend full run:291 Passed,6 SQL Skipped,0 Failed; gate SQL chưa được kiểm chứng. Browser32 C/E/F:30 Passed,2 Failed ở fixture đếm GET; browser13 D:10 Passed,3 Failed locator ERR-024 trước khi kiểm hành vi. Giữ evidence fixture Failed; không suy product pass khi assertion chưa tới. **Review source F độc lập thấy P2 ERR-015 approve receipt mất field đã xác nhận hiện có; fix-r1 đang làm, acceptance source phần còn sót là Failed.** Câu đủ24 implementation chỉ nghĩa có patch, không đủ acceptance. H source chấp nhận, VM24 pass; ESM smoke thật chờ chạy. Gate API/SQL/fault/browser cuối vẫn mở; chưa full Done. Inventory72 mô tả packet freeze trước, không chứng nhận byte F fix-r1 đang sửa.

2026-10-30 · HEAD baseline `a19f7a2f3dc1bc54ff645d662d94fc614439256a` · **Đã lập kế hoạch; chưa có finding nào được ledger này chứng nhận đã sửa.**

## Quyền, snapshot và chủ sở hữu

- Quyền phiên mới: sửa cả 24 finding/source/test/docs; root chỉ điều phối. Cấm commit/push/merge/deploy/cleanup/provider phí/thanh toán/form thật. Không chọn phase mới.
- Checkout chung `D:/TinHoc/FormAuto_Hub`, nhánh `ui/compact-refinement-20261028`; root chọn file ownership vì cần DB-sync uncommitted, không tạo worktree từ HEAD làm mất baseline. Worker ghi snapshot/hash riêng; không tự commit/copy thiếu baseline.
- Root actual `gpt-6.1-sol/medium`; catalog root đã kiểm `codex_cx_via_9router`, model `gpt-6.1-sol`, `reasoningEffort=high`. Native intake và workers explicit `gpt-6.1-sol/high`, không Astra/con. Catalog kiểm trước từng dispatch; cấu hình không xác minh được thì không dispatch.
- Intake `/root/intake_matrix` chỉ sở hữu bốn file `REMEDIATION_PLAN.md`/`REMEDIATION_LEDGER.md` trong AI/VI; không source/runtime/build/test/SQL. Root cập nhật điều phối qua followup; worker report ở artifact riêng.
- `/root/p1_submission`: đã được root giao ERR-008/007, ba service `SubmissionService.cs`, `Services/Nckh/ResearchDataService.cs`, `ResearchFormService.cs` và test mới `FahErrSubmission*`; không csproj/schema/DB-sync.
- `/root/runtime_owner`: owner duy nhất SQL/process/ports/fixtures/browser/runner chung; model `gpt-6.1-sol/high` được root kiểm catalog. Ledger này không acquire các tài nguyên đó.
- B dự kiến ERR-009/011: adapter/AiGenerationService/AiAnalyticsService/tests; C trước D/E/F; G đợi A nhả ResearchFormService cho ERR-010. [Plan](REMEDIATION_PLAN.md) chứa vùng file/acceptance chi tiết.

## Baseline dirty/untracked cần bảo toàn

`git status --short` lúc intake: tracked dirty duy nhất `tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj`. Các đường untracked sau là baseline đã có, không thuộc remediation mới:

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

Không lập danh mục nội dung ignored/backup để sửa/xóa. Giữ toàn bộ ignored, `.next` cũ, DP keys, backup/DB/worktree/evidence; không reset/clean/overwrite. DB-sync đã hoàn tất scope local giới hạn theo [INDEX DB](../FAH-DB-SYNC-001/INDEX.md)/[VALIDATION DB](../FAH-DB-SYNC-001/VALIDATION.md): main current13/history14 với legacy đã biết, pending0/modelPendingfalse; không làm lại migration, backup hay normalization. Evidence clone đã có fixture nên không còn byte-equal main; không diễn giải proof preservation lịch sử thành trạng thái hiện tại.

## Register 24 ID

“Đối chiếu source” chỉ xác nhận đường lỗi/symbol/consumer/test đã định vị theo [plan](REMEDIATION_PLAN.md); không là verification fix. Tất cả test/runtime/review remediation dưới đây **Not run** tại checkpoint intake. Tác giả/runner append outcome chính xác sau, không xóa RED hoặc bằng chứng lỗi trước đó.

| ID | Tên ngắn / owner | Source disposition intake | Implementation | Test/runtime/review | Next action |
| --- | --- | --- | --- | --- | --- |
| ERR-001 | HTTP login / C | Đối chiếu api/login/auth tests | Not run | Not run | Giữ typed HTTP và credential chung |
| ERR-002 | validation/trace / C | Đối chiếu parser; MVC evidence thật hiện hữu | Not run | Not run | Metadata existing + field safe |
| ERR-003 | raw/network text / C | Đối chiếu api/toast/direct consumer | Not run | Not run | Fallback safe, abort, console |
| ERR-004 | blob errors / C | Đối chiếu blob/evidence/export/auth | Not run | Not run | Parser chung, giữ Google/JWT |
| ERR-005 | analyze/history / G | Đối chiếu client/service/usage; SQL evidence cũ | Not run | Not run | Message boundary, không backfill |
| ERR-006 | PayOS raw body / G | Đối chiếu PayosClient→PaymentService→controller | Not run | Not run | Loại raw public body; stub tests |
| ERR-007 | usage sai kết quả / A | Đối chiếu SubmissionService/usage consumer | Đã giao | Not run | Wording theo status/count, cùng008 |
| ERR-008 | external interruption / A | Đối chiếu send/collect/create; InMemory evidence cũ | Đã giao | Not run | Fault tests + fresh persistence |
| ERR-009 | AI raw logging / B | Đối chiếu adapter logger/run/batch | Not run | Not run | Bounded metadata/security review |
| ERR-010 | Google null collapse / G | Đối chiếu OAuth/Forms boundary/callback | Not run | Not run | A nhả ResearchFormService trước |
| ERR-011 | AI reason omitted / B,D | Đối chiếu ToResponse/analytics/forms | Not run | Not run | Safe cause/runId; review DTO delta |
| ERR-012 | rule constraint collapse / G | Giữ correction syntax đã có inner | Not run | Not run | Constraint-specific errors/tests |
| ERR-013 | admin validation500 / G | Đối chiếu package/controller; HTTP500 thật cũ | Not run | Not run | 400 biết trước/no-write; Admin/User |
| ERR-014 | profile read reset / D | Đối chiếu loadAiPromptProfile/save flow | Not run | Not run | Unknown load state + retry/guard |
| ERR-015 | write/read mixed / D,F | Giữ correction NCKH resolve; AI/topup/admin | Not run | Not run | Giữ result/ID, GET-only retry |
| ERR-016 | detail false missing / F | Đối chiếu top-up/[id] catch/render | Not run | Not run | 404 riêng503/network, sau C |
| ERR-017 | stale model slices / E | Đối chiếu loadModelData/effects | Not run | Not run | Ownership/validity/race regression |
| ERR-018 | substring mapping / C,E | Đối chiếu register/NCKH helper/provider discriminator | Not run | Not run | Exact known cause; unknown fallback |
| ERR-019 | implementation wording / D,E,F,G | Đối chiếu leaf/service-to-consumer trong audit | Not run | Not run | Tiếng Việt theo đối tượng/local check |
| ERR-020 | weak exploratory scripts / H | Đọc ba script; chưa chạy credential/mutation | Not run | Not run | Fixture/assertion/label rõ |
| ERR-021 | unknown shown empty / E,F | Đối chiếu account/list/dataset/admin search | Not run | Not run | Load/known-empty riêng; disable writes |
| ERR-022 | clipboard rejection / F | Đối chiếu bốn handlers | Not run | Not run | Catch/manual feedback/keyboard |
| ERR-023 | attempt details omitted / D | Đối chiếu DTO/mapping/helpers/render | Not run | Not run | Safe cause + existing IDs |
| ERR-024 | date/time view-state / D | Đối chiếu readers/editor/save/backend validation | Not run | Not run | Clear from/to, payload=display |

## Checkpoint điều phối tiếp theo — root báo cáo

- B đã dispatch `/root/p1_ai`, catalog được root kiểm trước giao, native explicit `gpt-6.1-sol/high`; sở hữu adapter/AiGenerationService/AiAnalyticsService và tests mới `FahErrAi*`, ERR-009/011. Không con/Astra. Dòng “Not run” ở register là snapshot intake trước dispatch, không tuyên B chưa được giao.
- Runtime owner báo **RED P1A 12/12 Failed, compile0 lỗi** trên baseline; đây là regression expected trước fix, không phải GREEN hoặc lỗi build. Root báo đã lưu source baseline371hash+patch tại runtime evidence; intake không chạy lại, đường report chính xác sẽ do root/owner bổ sung khi nhận packet.
- Register test/runtime/review “Not run” ban đầu vẫn là lịch sử intake; riêng test A/007–008 nay có RED được owner báo. Persistence/runtime/review fix vẫn Not run tới packet tiếp theo.
- Phụ thuộc mới008→023: unknown Failed attempt/errorMessage phải hiện kết quả ngoài chưa xác định và không tự gửi lại trước kiểm tra; count `length-successCount` không chứng minh chưa gửi bên ngoài. Không claim rollback.

## Checkpoint tiếp tục — 2026-10-30, dispatch do root báo cáo

- Root kiểm lại catalog hiện hành rồi dispatch rõ `/root/backend_resume`, `/root/ai_contract_resume`, `/root/shared_web_resume` dùng `gpt-6.1-sol/high`; root thực tế vẫn `gpt-6.1-sol/medium`. Không dispatch lồng. Tên worker trước đây là ownership lịch sử.
- `/root/shared_web_resume` tiếp nhận paired plan/ledger và vùng C shared web/auth (security panel chỉ mapper; F giữ state). Source web chưa đổi khi tiếp nhận; thư mục artifact `shared-web/` cũ không tồn tại. Đã lưu hash trước sửa, giữ nguyên công việc cũ.
- C viết `apps/web/tests/fah-err-shared-errors.test.cjs` cho metadata HTTP/blob, validation/trace an toàn, chặn raw payload, network/abort/JSON lỗi và mapper auth từ source thật. **Not run:** RED/GREEN; runtime owner chạy trước triển khai. Packet: `artifacts/reports/error-remediation-2026-10-30/shared-web/`.
- Người dùng đã duyệt ERR-011 thêm `errorMessage` optional nullable, tiếng Việt an toàn, vào `AiGenerateResponsesResponse` và `AiRecentRunResponse`. Backend/contract do `/root/ai_contract_resume` sở hữu; C thêm TypeScript sau handoff type chính xác. Delta này không duyệt raw diagnostic lưu DB/provider hay DTO khác.
- Checkpoint runtime báo cáo: AI RED25 hợp lệ (gồm tám ca response-shape); G RED47 với 44 Failed/3 Passed; review độc lập A/B còn chờ. Đây là kết quả regression/trước sửa, không đóng remediation.
- C runtime RED2: 13 Failed/0 Passed/0 Skipped, bảy hash source và test ổn định; `runtime/shared-web-red2/{test.log,verification.json}`. Chín assertion fail và bốn TypeError do interface/signature sản phẩm chưa hỗ trợ. C thay bốn ca này bằng assertion interface/mapper rõ ràng; chờ RED3 trước sửa production. Script snapshot lần `shared-web-red` đầu lỗi absolute Join-Path, giữ lại evidence Failed.
- C RED3 sau đó xác nhận 13 Failed/13 top-level ERR_ASSERTION, không lỗi thiếu guard; bảy source baseline chưa đổi và tám hash run ổn định. Evidence runtime: `runtime/shared-web-red3/`. C sau đó triển khai `ApiError`, parser JSON/blob an toàn, cancellation/transport, toast an toàn và mapper login/register/security theo type; catch lịch sử dùng mapper an toàn. Generation result có `errorMessage` optional đã duyệt; recent-run type vẫn nằm trong `ai-usage/page.tsx` để D sửa.
- Packet C đã freeze, sẵn sàng GREEN: 15 ca unit/source-mapper (13 regression RED và hai ca bổ sung security/Google conflict), năm ca browser caller tập trung. Runtime owner `/root/runtime_resume` chạy test/build/browser; writer chỉ chạy static diff và scoped Impeccable detector (không finding). Review auth/security độc lập **Not run**; chưa đóng finding C. D/E/F có thể dùng interface đã sẵn sàng; F nhận ownership security state.
- Root báo review độc lập chấp nhận phạm vi A/B cũ ERR-007/008/009; phần bổ sung response-shape/ERR-011 đã GREEN48, còn chờ review độc lập. Các kết quả này không đóng các gate runtime/24 ID còn lại.

## Ma trận thực thi hiện tại — 2026-10-30 08:56 UTC / 15:56 ICT

[Acceptance đủ24 ID](REMEDIATION_VALIDATION.md) thay cột implementation intake cũ. Đủ24 source đã triển khai; **chưa Done dòng nào**. Verified: A14+36, AI48, C15+auth9, Gfix6+63+87, D8, E9, F22, H24 (có giao, không tổng duy nhất). Review source độc lập nhận frozen snapshot A/B/C/D/E/G; F/H đang chạy. Browser32 C5/E4/F23 đang chạy; D13 supplemental spec freeze/chờ. Gate Program/JWT/SQL/fault/log/role/browser/lint/build hiện hành giữ Not run tới khi owner báo outcome chính xác.

Dispatch tổng hợp docs `/root/shared_web_resume` được kiểm catalog và đặt rõ `gpt-6.1-sol/high`; root thực tế `gpt-6.1-sol/medium`. Root báo cùng kiểm catalog/đặt trần Sol/high trước mỗi dispatch tiếp tục runtime `/root/runtime_resume`, review `/root/review_ab_resume`; không con/Astra. Writer source không acquire tài nguyên. Delta72-file ownership khai báo được so baseline runtime371 đã giữ ở inventory validation liên kết, không Git status tùy tiện hay tập runtime323 khác scope.

Lỗi fixture browser C/D đầu giữ evidence Failed; sửa locator test không đổi product. P2 nested-null G đã fix, GREEN6/63/87 và review mới nhận; P2 AI-shape cũng GREEN48/review mới. H GREEN24 thật đã Verified; F manual-grant RED1 trước tiny fix cuối và GREEN22. Review/runtime tiếp vẫn có thể tìm acceptance lỗi; không chứng nhận hoàn tất chung.

## Kiểm tra và giới hạn checkpoint intake (lịch sử)

- **Verified:** đọc quy tắc/handoff cần thiết; đối chiếu đủ ID và giữ correction ERR-012/015; định vị source/consumer/test, baseline Git, ownership/contract gates; tạo bốn docs mới đồng bộ cam kết AI/VI.
- **Not run:** build/test/lint/runner/browser/API/SQL remediation. Intake không có quyền vận hành; kết quả cũ chỉ là baseline và không chứng minh fix. Các file source lớn được định vị unit; implementer phải đọc toàn unit/dependency/test trước sửa.
- **Not run:** review độc lập remediation mới; self-review tài liệu không thay security/auth/payment/submission review. Root sắp xếp reviewer Sol/high trên snapshot/hash sau fix.
- **Risks:** shared checkout cần file ownership tuyệt đối; fixture/API mock không chứng minh transaction SQL; typed error có thể ảnh hưởng mọi consumer/auth; safe reason AI có thể cần delta DTO được review; ERR-008 outcome ngoài phải còn uncertainty, không replay.
- **Deferred:** provider live, payment charge, real submission, release, cleanup, backfill history và policy recovery/retention/schema/lifecycle/correlation mới.

## Bước tiếp theo chính xác

Runtime owner chạy H GREEN24, rerun C fixture browser5, browser D13/E4/F23 và regression phù hợp; ghi verdict F/H và wave API/SQL fault thật theo manifest hiện hành. Các gate restart/API/SQL/log/chunk/role/persistence bắt buộc giữ Not run tới khi thực thi. Report trả evidence/giới hạn từng ID; không đóng 24 ID bằng tổng test pass.
