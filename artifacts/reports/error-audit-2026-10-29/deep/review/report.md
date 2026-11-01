# FAH-ERR-001 — Review độc lập bằng chứng audit

Ngày 2026-10-29. Reviewer `gpt-6.1-sol`, reasoning `high`; không agent con. HEAD đã kiểm lại `a19f7a2f3dc1bc54ff645d662d94fc614439256a`. Reviewer không là tác giả các report/probe UI/backend/runtime, không sửa các bằng chứng nhánh hoặc product source.

## Findings của review, theo ưu tiên

1. **Phải sửa ERR-012 trước chốt dossier.** `AnswerRuleService.ValidateRequest` parse JSON trước helper và giữ `JsonException` làm inner của thông báo `ConfigJson must be valid JSON.`. Kết luận cũ rằng malformed JSON bị gộp vào generic constraint và mất cause tại service là sai. Giữ P2 cho JSON hợp lệ sai type/shape/constraint bị gộp; inner tồn tại trong service cũng không chứng minh đã được logger ghi, vì controller catch chỉ trả Message. Reviewer rerun actual service xác nhận cả ba case BE-P08.
2. **Phải sửa consumer map ERR-015.** NCKH `loadWorkspace` catch/setError rồi resolve; `loadModelData` allSettled/setPanelError rồi resolve; `loadForms` và security `loadProfile` cũng tự xử lý lỗi. Không thể dùng GET reject để kết luận catch bên ngoài báo mutation thất bại ở các consumer đó. UI-P06 rerun xác nhận createModel chỉ có success toast và workspace error. Giữ cốt lõi top-up/admin có loader rethrow; bổ sung AI POST thành công → GET preview lỗi (UI-P05), vì UI bỏ thông tin run/IDs/balance đã nhận và báo tạo AI thất bại. Source `AiGenerationService` lưu preview/credit transaction/run/UsageLog trước return; fixture không chứng minh debit lần này hoặc double debit thật.
3. **Không đóng “all errors/full-system audit Done”.** 321 files là denominator screening/hashes, không phải 321 full manual reads; UI ghi rõ 43/99 file đọc full, 56 chưa đọc bởi nhánh đó. Năm browser observations dùng web thật + HTTP fixture; không có ASP.NET API/auth/SQL persistence/provider integration. Hash và snapshot không bổ sung những nhánh chưa thực thi.
4. **Giữ chính xác boundary runtime.** 27 captured JS requests chỉ có 26 HTTP200; 1 dev HMR request `ERR_ABORTED` khi navigation. Không ghi “all chunks pass”. SQL history13/source12 là mismatch đã thấy, không chứng minh DB hỏng hoặc startup chắc chắn lỗi. `Program` auto-migrate khiến startup vượt giới hạn chỉ đọc. Source tracked sạch và 321 hashes không đổi; ignored `apps/web/.next` đã nhận ghi cache, nên filesystem isolation **Failed**, không được ghi “không side effect”. Không cleanup.
5. **Không nâng mock/static thành incident.** ERR-008 tái hiện mất evidence trong fresh InMemory context với fake external success; SQL/live outcome chưa kiểm. ERR-009 tái hiện logger nhận raw synthetic prompt/response ở Information; không có API key trong capture, chưa biết log sink/retention/quyền đọc thực. Hai P1 là ưu tiên rủi ro có căn cứ, không phải sự cố production được xác nhận.

## Summary và kết luận review

**Verified:** chất lượng bằng chứng của ba nhánh đủ để giữ các finding trong phạm vi đã công bố, sau hai correction ERR-012/015 ở trên. Reviewer chạy lại backend16/UI8 trên source hiện tại và kiểm độc lập năm browser captures; không chỉ tin summary.

**Failed:** chấp nhận nguyên văn báo cáo cũ khi còn hai cáo buộc sai; claim “mọi nhánh đã review/runtime đã pass/filesystem không đổi” cũng không được chấp nhận. **Blocked/Not run:** full-system runtime acceptance còn các prerequisite/coverage bên dưới. Review này không phê duyệt remediation, integration hay release. Synthesis phải đưa các correction vào paired dossier; reviewer không sửa dossier trong vai trò này.

Sau gộp đề xuất có **23 nhóm: 2 P1 / 19 P2 / 2 P3**. Đây là số nhóm finding, không phải số lỗi runtime hay số nhánh đã kiểm. Stable ID cuối do root giữ: đề nghị UI-001→ERR-021, UI-005→ERR-022, UI-006→ERR-023; không tái dùng ID cũ.

## Disposition từng ID cũ

| ID | Review | Severity / bằng chứng và giới hạn |
| --- | --- | --- |
| ERR-001 | Accept | P2. `apiFetchInternal` chỉ giữ title/detail thành Error; login kiểm status qua message. Browser fixture401 render Unauthorized đã capture; actual auth HTTP chưa chạy. Giữ credential generic, không tách wrong-email/wrong-password. |
| ERR-002 | Accept có giới hạn | P2. Parser bỏ errors/traceId trong fixture. Chưa có actual ASP.NET model-binding body theo endpoint; không khẳng định mọi400 dùng payload đó hoặc trace đã mất ở mọi tầng. |
| ERR-003 | Accept | P2. Filter short English/HTML/network messages không đủ cho UI; browser toast Service Unavailable bổ sung consumer thật. Console browser vẫn có failed resource; không nói mọi trace biến mất hay XSS/secret leak. |
| ERR-004 | Accept static/mock | P2. Blob bỏ body, giữ status và Google401 discriminator. Export/image browser và actual endpoint error chưa chạy. |
| ERR-005 | Accept static | P2. English analyze exception đi UsageLog/UI; FormProjectService giữ inner. History phải chọn đúng filter để thấy AnalyzeForm. Không tuyên bố fresh DB/UI reproduction. |
| ERR-006 | Accept tăng bằng chứng | P2. Actual PayosClient fake503 đưa body vào ErrorMessage; PaymentService/controller forwarding source đã đối chiếu. HTTP/browser/sandbox chưa chạy, không có secret thật. |
| ERR-007 | Accept tăng bằng chứng | P2. BE-P03 fresh context: Failed nhưng description Gửi form thành công. Pause/cancel/mixed/history browser chỉ static, không nhân thành nhiều reproductions. |
| ERR-008 | Accept tăng bằng chứng | P1. BE-P01 call1 fake success/call2 throw→Running/count0/log0 fresh context; BE-P02 mất JSON inner và Running; BE-P04 collect throw→collectionlog0. Remote form success→question/import fail vẫn static. SQL/cancellation/save-fail/batch boundary chưa chạy. |
| ERR-009 | Accept tăng bằng chứng | P1. BE-P05 actual adapter/logger thấy hai Information entries chứa marker; API key excluded. Request template không có RunId/batch; project/run identity có nơi khác, không nói app hoàn toàn không có correlation. |
| ERR-010 | Accept, thu hẹp | P2. Non2xx Google403/404/429/503 đều null được rerun; config/token branches static. Transport/malformed JSON có thể throw, không nói tất cả bị nuốt về null. Core credential protection giữ nguyên. |
| ERR-011 | Accept, làm rõ | P2. Run.ErrorMessage không projected vào result/analytics; RunId vẫn có. Malformed outer envelope throw, malformed assistant content có thể outputs0 (BE-P06). Task.WhenAll mất per-batch detail cần probe bổ sung; ledger/provider runtime chưa chạy. |
| ERR-012 | **Revise bắt buộc** | P2. Bỏ syntax cause-loss claim; chỉ constraint/type/shape collapse. Service parse giữ inner; controller/log persistence chưa chứng minh. |
| ERR-013 | Accept boundary | P2. Actual admin action/service với price0 thoát ArgumentException, không trả ActionResult. Exact HTTP500/body/stack phụ thuộc MVC/environment, vẫn Not run; không lấy việc thiếu mapper explicit để suy ra không có framework diagnostics. |
| ERR-014 | Accept mock/static | P2. Failed read reset AI profile defaults. Không chứng minh saved settings đã bị overwrite, hoặc mọi404 là absence hợp lệ. |
| ERR-015 | **Revise + expand** | P2. Loại cáo buộc NCKH loader rethrow; thêm AI result→preview GET và admin check→reload. Các mutation/refresh ảnh hưởng tiền/credit thực chưa chạy. Không khuyến nghị retry POST tự động. |
| ERR-016 | Accept tăng browser evidence | P2. Fixture503 render not-found/ownership guidance. Không kết luận absent/not-owned thật; 404 privacy behavior vẫn phải giữ. |
| ERR-017 | Accept + expand | P2. AllSettled stale partial state có nguồn; UI-P07 rerun B hoàn tất trước A nhưng state cuối A dù mọi request success. Không chứng minh ghi nhầm dữ liệu; race browser/edit chưa chạy. |
| ERR-018 | Accept, sửa độ chắc | P2. Broad invalid/conflict/password matching sai; password fixture cũ không phải actual API string. UI-P01 dùng actual Invalid Google Form URL và source-controller chain, nên strengthen bằng lỗi URL→expired auth. Duplicate relation có client guard. |
| ERR-019 | Accept subset | P2. Consumer-visible implementation jargon/English giữ finding. Không gọi mọi model/provider name hoặc internal validator English là UX defect nếu chưa trace consumer; không ép xóa diagnostic detail. |
| ERR-020 | Accept static | P3. Legacy exploratory scripts không đủ assertion; không claim CI false-green. Không chạy chúng với unknown accounts/mutations. |

Không reject toàn bộ ID cũ nào: hai nhóm cần sửa phạm vi, các nhóm khác giữ căn cứ ở mức ghi rõ. Không dùng số probe passing như bằng chứng sản phẩm đã sửa.

## IDs mới và chống đếm trùng

| ID nhánh | Review | Phạm vi / severity |
| --- | --- | --- |
| UI-001 | **Accept mới**, đề nghị ERR-021 | P2. Profile503→blank editable+saveenabled; security503→Chưa liên kết; NCKH503→alert cùng false-empty. UI-P02/03/04 rerun; browser RUNTIME03/04/05 captures khớp. UI mock đã gọi save, browser **không click Lưu**, fixture không có profile PUT. Profile service gán FullName nhưng actual MVC/DB overwrite chưa kiểm; chỉ ghi nguy cơ. |
| UI-002 | Accept, merge ERR-015 | P2. Cùng mutation-success/read-failure boundary; không thêm nhóm. |
| UI-003 | Accept, merge ERR-018 | P2. Actual service literal sai URL bị mapper gán expired-auth; không thêm nhóm. |
| UI-004 | Accept, merge ERR-017 | P2. Identity race là trigger bổ sung của stale model datasets; không thêm nhóm. |
| UI-005 | **Accept mới**, đề nghị ERR-022 | P3. Clipboard reject thoát async handler, không feedback; reviewer đối chiếu bốn consumers và rerun UI-P08. Browser unhandledrejection/console actual chưa quan sát. Không nói console mất stack hoặc clipboard thật đã đọc. |
| UI-006 | **Accept mới static**, đề nghị ERR-023 | P2. `SubmissionService`→`Phase3Mappings`→DTO/API có logs.responseId/errorMessage, nhưng forms expanded details chỉ đếm batch status; không render lý do/identity. Reviewer đọc complete render branch và origin/projection. Khác ERR-007 description sai và ERR-008 không persist: đây là dữ liệu đã có trong response bị bỏ ở consumer. Không hiển thị raw payload/unknown cause hay khuyên resend; browser failed-submission chưa chạy. |
| BE-001–009 | Merge existing | Không thêm ID: evidence/refinement ERR005–013/019; AI extension thuộc ERR015. |

## Validation performed

Reviewer đọc README/AGENTS/authority/execution/quality/routing, dossier năm file đã giao, cả ba deep reports, harness/runner/source project, UI probes, runtime fixture/manifest/checker/canonical captures. Đối chiếu trực tiếp complete trọng tâm: SubmissionService/Controller, AnswerRuleService/Controller, api/toast, profile/security components+ProfileService/Controller, AI adapter, related AI save/debit/response sections, ResearchData collect/controller, Google null boundary, PayOS client/service/controller, NCKH loader/effect/mutation units, forms AI generation/detail-render units và clipboard consumers. Đây không phải full manual review mọi source backend/frontend.

Lệnh reproducible từ root:

```powershell
powershell -NoProfile -File artifacts/reports/error-audit-2026-10-29/deep/review/rerun.ps1
```

Kết quả mới nhất **exit0**: `Verified 7 review checks; backend16/UI8 rerun; browser5 captured assertions; 321 source hashes unchanged.` Chi tiết trong [verification.json](verification.json), [verification.log](verification.log), [backend-results.json](backend-results.json), [probe-results.json](probe-results.json).

- Backend **Verified:** copy artifact project/assets có sẵn vào own review zone; explicit include actual API source, exclude obj/bin; `dotnet build --no-restore` output own zone. Copy assembly mới vào own runtime, compile actual backend Harness.cs đã kiểm, rồi dotnet exec; không chạy Program/Main, listener/SQL/provider thật. 16 observations được reviewer kiểm kết quả, kể cả BE-P06 vốn chỉ collect output ở harness gốc. Fresh InMemory read là evidence process-local provider, **không phải SQL durable proof**.
- UI **Verified:** copy unchanged probe vào cùng depth review dir rồi node; transpile actual original functions/components, synthetic boundary/manual hooks/JSX tree. 8 observations; không React DOM/browser trong rerun này. UI-P06 inject list helper thay detail helper nhưng assertion control-flow loader-resolves không phụ thuộc wording; wording chỉ dùng làm fallback synthetic, không nâng thành full dependency fidelity.
- Source integrity **Verified:** 321 inventory SHA-256 hiện tại khớp; UI7 + runtime13 recorded source hashes khớp; `git diff HEAD --name-only` trống. Hash chỉ chứng minh bytes snapshot, không chứng minh manual coverage hay ignored cache không đổi.
- Browser captures **Verified:** tự assert canonical login/topup/profile/security/NCKH files, actual fixture statuses, profile saveenabled; kiểm mọi runtime manifest file hash; fixture log không có PUT profile. Đây là independent artifact assertion, **không rerun browser**. Captured release cả PID không còn/zero target listeners; reviewer không acquire/stop resource.
- SQL capture **Verified:** parse raw sql-readonly.log thấy13 IDs so với source12; extra `20260601083335_Phase10ManualCreditOperations`. Metadata ba bảng không xác nhận toàn schema parity. Reviewer không mở SQL connection mới.
- Harness limitations: NU1603 cached Forms package patch resolution, CS1701 runtime8→9 EF ref, CS2023 noconfig và unused parameter warnings giữ trong logs. No restore/install. Source build/harness compile pass không biến InMemory thành SQL.
- **Failed lần đầu của own wrapper:** Windows PowerShell `>` ghi UTF16 làm Node JSON parser fail sau backend/UI đã exit0. Giữ [backend-results-first-utf16.json](backend-results-first-utf16.json); chỉ sửa own output thành Set-Content UTF8, rerun cả chuỗi exit0. Đây là lỗi evidence wrapper, không product finding. Hai failed backend-build attempts và UI first path lỗi của nhánh gốc cũng được ghi trong reports, không bị tính product defects.

## Validation not performed và blockers còn lại

| Scope | Trạng thái thực / điều kiện mở |
| --- | --- |
| Actual API HTTP/MVC | **Not run.** Model binding/validation payloads, admin package unhandled body/status, controller/auth/session/roles chưa chạy qua host. Browser fixture không thay bước này. Có thể dùng host test không gọi Program auto-migrate sau thiết kế/scope riêng. |
| Startup local user DB | **Blocked trong quyền read-only hiện tại** bởi startup auto-migration; không phải lỗi startup đã tái hiện. Cần test DB có quyền ghi và schema phù hợp hoặc host cô lập. Không tự repair/drop/downgrade DB history. |
| SQL persistence/concurrency | **Not run.** Transaction, save-fail/cancellation, independent relational reload, batch boundary, credit/top-up concurrency và real schema coverage chưa có. InMemory/fake không thỏa gate SQL. |
| Provider/payment/submission | **Not run.** OAuth config/token/transport/timeout/malformed full matrix, Google post-create failure, external unknown outcome, PayOS sandbox/webhook/signature/retry/persistence và AI parallel sibling failure/log sink chưa thực thi. Không cần live cost chỉ để chạy smoke chung. |
| Rendered mutation outcomes | **Not run.** AI POSTsuccess/GETfail, NCKH switch/race/partial failures, profile save-after-readfail, actual submission details/history, blob export/image errors và clipboard rejection browser. Admin role browser chưa chạy. |
| Broad coverage | **Not run.** Every route/status/validation/timeout/offline/CORS/TLS/unexpected-body branch; 56 frontend files chưa manual reviewed ở UI nhánh; old regex exclusions/test-support không certify absence of defects. Build/lint/broad E2E mới không chạy; không có remediation. |
| Cache preservation | **Failed isolation**, đã ghi rõ. `.next` ignored có ghi runtime; không có baseline để restore chính xác. Giữ nguyên, không cleanup. Future runtime cần xác minh output location trước start. |

## Files changed, scope alignment, Risks/Deferred, Next recommended step

Reviewer chỉ ghi dưới `deep/review/`: report, own runner/verifier/probe copy, build/runtime copies và logs/results/hash verification. Giữ nguyên bằng chứng nhánh và task docs untracked, ignored cache. Không product/contract/schema/history edit; không install/commit/push/deploy/real payment/submission/provider cost. Không resource phải release bởi reviewer.

Phạm vi đúng audit FAH-ERR-001. **Deferred:** mọi fix, contract/status/code/trace-field design, schema/persistence/recovery/retention decisions. Các gợi ý chỉ là phương án cần scope review; không tự chọn ProblemDetails global hoặc business state mới.

Bước tiếp: root hợp nhất correction và stable IDs vào paired AI/VI dossier, công bố 23 nhóm cùng mức evidence/gaps; kiểm links/UTF8/parity/counts. Sau đó chọn remediation scope riêng, bắt đầu ERR008/009 và incorrect outcome/data-state groups. Muốn đóng full audit phải giải quyết acceptance coverage còn hở, không chuyển các Not run/Blocked thành pass chỉ vì đã nêu hạn chế.
