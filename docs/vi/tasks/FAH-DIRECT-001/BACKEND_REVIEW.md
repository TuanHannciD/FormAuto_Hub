# FAH-DIRECT-001 — Review backend độc lập

Ngày: 2026-11-01. Reviewer: `/root/direct_rules_backend_review`, `gpt-6.1-sol`, reasoning `high`; độc lập với tác giả backend, không agent con. Phương pháp: `requesting-code-review`, xác minh trước khi báo kết quả. Base: `297ee2143f7a37ca02739157d75e3db06ab4be17`; branch `feat/direct-rule-submission`, snapshot backend dirty/untracked đóng băng, không commit.

## Summary

**Kết luận spec/review hiện tại: B1 đã xử lý; không còn finding review backend.** Review độc lập lại đúng phạm vi bản sửa B1 đóng băng không thấy lỗi mới. Giữ finding ban đầu bên dưới làm lịch sử. **Kết luận chất lượng: gate review code backend đã pass; local Done còn chờ** restart API sở hữu/HTTP smoke rejection và gate runtime/frontend cuối của root. Review này không tuyên bố tích hợp hoặc phát hành.

## Findings

### B1 — Important, đã xử lý: rejection admission direct làm mất evidence usage thất bại

- Vị trí: `src/FormAutoHub.Api/Services/DirectRuleSubmissionService.cs:21`, `SendAsync`; liên quan `SubmissionAdmission.RunAsync` tại `SubmissionAdmission.cs:28` và nhánh generation thất bại tại `ResponseGenerationService.cs:63` / `:89`.
- Tái hiện trên SQL Server: đăng nhập owner project, cấu hình rule hợp lệ và balance bằng 0, ghi nhận `UsageLogs` của project rồi POST route direct với command mới khác rỗng và count 1. API trả 400, không job/debit/provider attempt nhưng không có row usage Failed. Project thiếu rule cũng mất log tương tự. Count sai, command rỗng, rule sai và xung đột job active cũng không có log lỗi direct.
- Nguyên nhân: generation thêm và save usage Failed bên trong transaction admission rồi throw. Dispose transaction chưa commit rollback cả row này. `DirectRuleSubmissionService.SendAsync` không có xử lý lỗi ngoài admission. Ngược lại, send chung trong `SubmissionService.SendAsync` clear trạng thái tracking lỗi rồi ghi admission rejection sau rollback. Test direct hiện chỉ kiểm không có job/generated response/credit transaction mồ côi, chưa kiểm evidence usage lỗi bền vững.
- Ảnh hưởng: thao tác công cụ thất bại của người có quyền biến mất khỏi usage history, trái invariant UsageLogs đã duyệt và hành vi generation hiện có. Root xác nhận không có ngoại lệ được duyệt cho audit rejection.
- Sửa bắt buộc: lưu usage Failed phù hợp bên ngoài transaction admission bị từ chối, sau xác minh owner; clear trạng thái tracked đã rollback và giữ không credit/job/provider effect. Giữ replay chỉ đọc và không log replay thành công như thao tác công cụ mới. Thêm assertion SQL có ý nghĩa cho rejection hết credit/thiếu rule và riêng tư owner. Không ghi generation thành công từ transaction đã rollback.
- Trạng thái xác minh ban đầu: **Failed qua đọc source** nhánh transaction/exception. Reviewer **Not run** ca tái hiện trên ở review đầu; regression SQL sau đó được cung cấp để review lại bên dưới. Không coi InMemory là evidence transaction.

## Review lại B1 đúng phạm vi — 2026-11-01

**Verified qua review source/test độc lập:** `DirectRuleSubmissionService.SendAsync` nay kiểm owner trước validation request và chỉ audit admission cục bộ bị từ chối. Handler `InvalidOperationException` chạy sau khi `SubmissionAdmission.RunAsync` dispose transaction lỗi, clear thay đổi tracked đã rollback, kiểm lại owner rồi save một usage row `SubmitResponses` Failed với 0 credit. Runner và nhánh replay/read nằm ngoài handler, giữ xử lý outcome hiện có và replay chỉ đọc. Không file production khác đổi so với snapshot review đầu.

Đã đọc theory SQL mới `RejectedAdmission_PersistsOnlyFailureUsageAfterRollback` (tám ca), theory sai owner (ba ca), ca replay chỉ đọc và interceptor từ chối reservation một lần. Lỗi chèn sau generation/debit kiểm rollback và cleanup tracking có ý nghĩa: đúng một usage row Failed, balance ban đầu, không credit transaction/job mới/generated response hoặc usage thành công lọt lại, 0 provider call. Assertion riêng tư owner và replay không log mới bao phủ ranh giới handler. Không thấy lỗi Critical/Important/Minor bổ sung trong bản sửa này.

**Evidence writer đã chạy, reviewer không chạy lại:** BACKEND song ngữ ghi SQL RED 10 failed / 2 passed trước sửa production, sau đó focused GREEN 58 passed / 0 failed / 0 skipped (24 InMemory, 20 SQL thật, 14 persistence). Command/environment và output path riêng ghi tại [BACKEND](BACKEND.md#sửa-b1--2026-11-01). Reviewer không mutate tài nguyên runtime/SQL. Restart API mới và HTTP smoke rejection vẫn **Not run bởi reviewer**, thuộc runtime/root.

**Verified bởi reviewer:** ba hash bản sửa dưới đây khớp trước/sau review lại; cả bảy file còn lại trong bảng hash ban đầu vẫn khớp. `git diff --check -- src/FormAutoHub.Api tests/FormAutoHub.Tests` exit 0. Reviewer vẫn `gpt-6.1-sol` / `high`, không agent con hoặc sửa source/test.

| File sửa B1 | SHA256 trước = sau review lại |
| --- | --- |
| `src/FormAutoHub.Api/Services/DirectRuleSubmissionService.cs` | `CEB334225F2F7213B5BF64CAC7B5289A39189028924462A202C8DE1A4A58EF3D` |
| `tests/FormAutoHub.Tests/DirectRuleSubmissionServiceTests.cs` | `946E2B9B51003C2E255E92FC7FC35B8B35301C6E0D4CABBDD122A9EBCF71044E` |
| `tests/FormAutoHub.Tests/DirectRuleSubmissionSqlServerTests.cs` | `757BC5B9E1751D5C8B223700C007A70360FA1C98142B50D7A615E4B58EDEA895` |

## Scope alignment

Đã review toàn bộ unit backend đổi và hai file test mới, cùng validation/generation liên quan, credit service và mapping RowVersion, consumer/test send chung, response mapping, controller/DI và ranh giới provider. Không thấy mở rộng entity, migration, lifecycle hoặc AI provider.

Các thuộc tính được duyệt sau được hỗ trợ bởi đọc source/test, với giới hạn runtime bên dưới:

- DTO/route direct dùng job response hiện có; generation partial x1, count 1..100, từ chối command rỗng và dùng chung validation rule.
- Kiểm owner trước replay reservation; job ID là reservation command, payload được nhận đầu tiên quyết định, replay không thể khởi runner. Project/user khác không đọc được job đã giữ chỗ.
- Admission direct và common dùng chung SQL project `UPDLOCK,HOLDLOCK`; generation/debit/reservation commit cùng nhau. Conflict credit clear tracking rồi retry admission có giới hạn; không HTTP provider trong transaction hoặc delegate retry EF.
- Commit mơ hồ đọc bằng context mới và không resume HTTP. Test SQL fault được cung cấp bao phủ exception mất acknowledgement không transient; nhánh retry execution strategy transient được đọc tĩnh, không inject riêng tại đây.
- Runner ghi attempt fence trước gọi provider, lưu kết quả đã biết trước lần gọi tiếp, batch tuần tự 10; send chung từ chối mọi response đã log, kể cả kết quả chưa biết vẫn là Previewed.
- Update pause/cancel/finalization có điều kiện giữ cancellation. Cancelled với FinishedAt null chặn admission tới khi runner xác nhận. Tracking count/status không ghi Running cũ đè cancellation.

## Files changed

Reviewer chỉ sửa báo cáo này và `docs/ai/tasks/FAH-DIRECT-001/BACKEND_REVIEW.md`. Không sửa production/test, mutate process/DB, cài đặt, gọi Google thật, commit, push hoặc deploy.

## Validation performed

- **Verified bởi reviewer:** đọc contract cuối INDEX/BACKEND song ngữ, source rules và quality gates liên quan; đọc diff base-to-working và unit source/test ảnh hưởng đầy đủ. Đọc runtime report và xác nhận kết quả SQL với runtime owner. Đã đọc ca test Phase3/persistence hiện có; không chạy lại test đồng thời với runtime.
- **Verified bởi reviewer:** `git diff --check -- src/FormAutoHub.Api tests/FormAutoHub.Tests`, exit 0, cwd `D:/TinHoc/FormAuto_Hub`.
- **Verified bởi reviewer:** SHA256 trước/sau review khớp cả 10 file đóng băng bên dưới. Frontend ngoài snapshot này.
- **Evidence được báo lại, reviewer không chạy lại:** backend focused 38/38 sau chỉnh diagnostic cuối; trước đó build solution Release và full suite 315 passed / 12 phương thức SQL skipped. Runtime report ghi SQL suite opt-in 8/8 passed, 0 skipped, DB local riêng `FormAutoHub_DirectRule_Safety_20261101`, ranh giới provider giả. Các kết quả này không bao phủ B1.

| File đóng băng ban đầu (lịch sử; ba bản B1 thay thế ở trên) | SHA256 trước = sau review đầu |
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

Reviewer không chạy lại build/unit/SQL suite hoặc HTTP/browser smoke; runtime owner/root sở hữu tài nguyên và evidence cuối. Không gọi Google/provider thật. Reuse đồng thời một command giữa project, retry acknowledgement commit transient và cancellation cộng provider fault trên relational được đọc tĩnh nhưng chưa có assertion chạy riêng được cung cấp trong review này. Đây là giới hạn coverage, không phải lỗi bổ sung đã kết luận.

## Risks/Deferred items

Giữ giới hạn fail-closed đã duyệt: crash cứng/reservation đã commit chưa rõ acknowledgement không có takeover runner tự động; hủy runner đã paused có thể giữ FinishedAt null và cần đối soát thủ công. Đây là ranh giới v1 rõ ràng, không phải finding cần triển khai vượt qua. Không đề xuất mở rộng recovery/schema/refund trong task này.

## Next recommended step

Runtime owner restart API sở hữu bằng snapshot đã sửa rồi kiểm request HTTP direct bị từ chối cùng evidence usage lỗi bền vững. Root kết hợp review backend đã pass này với gate frontend/runtime cuối trước khi tuyên bố local Done.
