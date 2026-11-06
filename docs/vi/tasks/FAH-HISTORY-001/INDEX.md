# FAH-HISTORY-001 — Đặc tả lịch sử tạo và tách phí

> Trạng thái hiện tại: **Done theo xác nhận người dùng**. Được phép dọn tài nguyên/commit local; xem [CLOSEOUT](CLOSEOUT.md). Các ghi chú review/tài nguyên cũ bên dưới là lịch sử.

> Thẩm quyền hiện tại (2026-11-05): Review độc lập Task 1 qua R1–R3 và việc người dùng duyệt L1/L2/P1/O1 cùng contract/schema đã review được ghi tại [PROGRESS](PROGRESS.md). Tasks 2–6 được phép triển khai và kiểm thử cục bộ trong worktree riêng. Các nhãn đề xuất/chờ duyệt bên dưới lưu lịch sử thiết kế, không mở lại quyết định đã duyệt. Không suy ra quyền kích hoạt production, gọi provider thật, commit hay deploy.

## Trạng thái, thẩm quyền và workspace

- Ngày: 2026-11-04. Người dùng đã duyệt đặc tả văn bản trong hội thoại; chưa cho phép triển khai.
- Người dùng đã duyệt thiết kế trong hội thoại: tái sử dụng dữ liệu, giá tạo/gửi tách riêng, tối đa 20 lượt/user, tự loại lượt cũ nhất và giữ credit trước khi gửi.
- Snapshot khi viết: nhánh main, HEAD df5cce54f4a8516ab9dd0bf2b5dff561c1cb8d5c; git status sạch trước khi thêm hồ sơ này.
- Root là tác giả; chưa có independent review, không dispatch agent. Không có quyền commit/remote/deploy được cấp trong task này.
- Vùng ghi được duyệt: cặp đặc tả và kế hoạch triển khai của task trong docs/ai và docs/vi. Không đổi tài liệu contract chuẩn hay source.
- Không khởi động process, truy cập DB, gọi provider hoặc thay đổi dữ liệu. Giữ nguyên mọi dữ liệu/bằng chứng hiện có.
- Bản đối chiếu: [AI](../../../ai/tasks/FAH-HISTORY-001/INDEX.md), [VI](../../../vi/tasks/FAH-HISTORY-001/INDEX.md).

## Mục tiêu và quyết định đã duyệt

Cho phép user xem lại và gửi lại toàn bộ dữ liệu trong tối đa 20 lượt tạo gần nhất của chính họ, tính trên toàn tài khoản, không phải 20 lượt cho từng project.

- Một lượt có 1–100 bản trả lời; giới hạn hiện hành vẫn giữ.
- Tạo rules: 0 credit/bản.
- Tạo AI mặc định: 1 credit/bản.
- Tạo AI tùy chỉnh: 2 credit/bản.
- Mỗi lần gửi Google Forms thành công: 1 credit/bản, kể cả gửi lại bản từng thành công.
- Phí tạo AI chỉ phát sinh khi tạo dữ liệu mới, không thu lại khi dùng dữ liệu đã lưu.
- Trước khi gửi, giữ đủ credit cho số bản chọn. Chỉ quyết toán bản thành công; giải phóng phần thất bại.
- Kết quả chưa xác định giữ chờ đối soát, không tự gửi lại.
- Tạo lượt thứ 21 tự loại lượt cũ nhất khỏi lịch sử tái sử dụng; giữ sổ credit và nhật ký gửi.
- Gửi lại là thao tác mới do user chủ động xác nhận; thông báo rõ khả năng tạo dữ liệu trùng.

Ví dụ: tạo 10 bản AI mặc định thu 10 credit. Gửi thành công 7 thu thêm 7; 3 bản thất bại không thu phí gửi. Sau đó gửi thành công 3 bản này thu 3. Gửi lại cả 10 bản đã thành công thu thêm 10, không gọi AI và không thu phí tạo lại.

## Hiện trạng được kiểm tra qua source

- GeneratedResponse giữ ProjectId, PayloadJson, PreviewText, Source, Status, IsReadOnly, CreatedAt; chưa có nhóm lượt tạo chung cho rules/AI.
- ResponseGenerationService hiện thu 1 credit khi tạo rules. AiGenerationService hiện thu x2/x3 khi tạo AI.
- GET /api/projects/{projectId}/responses có kiểm owner và đọc theo IDs hoặc toàn project; chưa phân trang.
- SubmissionService hiện không thu phí gửi; chặn bản không còn Previewed hoặc đã có SubmissionLog.
- DirectRuleSubmissionService giữ command replay chỉ đọc, tạo và gửi rules bằng một thao tác.
- SubmissionAdmission có transaction admission và project lock SQL Server; không gọi provider trong execution-strategy retry.
- UserCreditAccount có Balance, TotalUsed và RowVersion; chưa có khoản giữ credit.
- AI analytics đọc AiGenerationRuns; cần giữ đúng nghĩa creditsUsed là phí tạo thực tế sau chuyển đổi.

Nguồn đọc: [response generation](../../../../src/FormAutoHub.Api/Services/ResponseGenerationService.cs), [submission](../../../../src/FormAutoHub.Api/Services/SubmissionService.cs), [admission](../../../../src/FormAutoHub.Api/Services/SubmissionAdmission.cs), [direct rules](../../../../src/FormAutoHub.Api/Services/DirectRuleSubmissionService.cs), [AI generation](../../../../src/FormAutoHub.Api/Services/AiGenerationService.cs), [EF model](../../../../src/FormAutoHub.Api/Data/FormAutoHubDbContext.cs).

## Phương án và lựa chọn đề xuất

1. Khuyến nghị: thêm nhóm lượt tạo dùng chung và khoản giữ credit bền vững; tái sử dụng GeneratedResponses, jobs và logs. Thêm schema nhưng hỗ trợ đầy đủ rules/AI, concurrency và phục hồi sau crash.
2. Chỉ ghép lịch sử bằng timestamp và dữ liệu trình duyệt: ít schema hơn nhưng không xác định đáng tin cậy ranh giới lượt, retention hoặc nhiều thiết bị; không đáp ứng yêu cầu.
3. Trừ trước toàn bộ rồi hoàn lại phần lỗi: dễ tận dụng debit hiện tại nhưng thay đổi thành cơ chế hoàn tiền, lệch hướng đã duyệt; không chọn.

## Luồng và ranh giới module

- ResponseGeneration và EF Core tạo/lưu nhóm cùng dữ liệu; AI integration chỉ tạo dữ liệu, không gửi Google.
- CreditManagement sở hữu định giá, khoản giữ, số dư khả dụng và quyết toán qua dedicated credit service.
- Submissions sở hữu admission, attempts và kết quả; Integrations.GoogleForms sở hữu external call.
- Controllers xử lý HTTP; DTO sở hữu contract; Next.js hiển thị lịch sử, phí, preview/xác nhận và kết quả.
- Rules Option 1 giữ một nút Tạo và gửi ngay, không thêm preview UI hoặc xác nhận thứ hai. Dữ liệu được lưu để tái sử dụng.
- AI Options 2/3 giữ preview và xác nhận rõ trước gửi. Màn hình lịch sử gửi lại có xác nhận rõ cho lần gửi mới.
- Mỗi job tối đa 100 bản; gửi tuần tự theo batch 10; chỉ một active job/project.
- Mỗi lần user chủ động gửi lại tạo command/job mới. Retry cùng command chỉ trả kết quả cũ, không gửi/trừ phí lại.
- Sau pause/cancel, chỉ giải phóng khoản của bản chắc chắn chưa gửi khi runner đã dừng; không giải phóng request đang bay.

## Nhóm lượt tạo và retention — Proposed

Các lựa chọn dưới đây xin duyệt theo đặc tả; tên trường/bảng cuối cùng chưa trở thành contract.

- Nhóm có định danh, owner/project, thời điểm, mode, số yêu cầu/thực tạo, phí tạo, snapshot form/câu hỏi và liên kết các bản trả lời bất biến.
- Chỉ lượt tạo thành công có ít nhất một bản hợp lệ chiếm slot. Partial generation lưu các bản hợp lệ; failed zero-output chỉ giữ audit.
- Assumption đề xuất: một request tạo thành công là một lượt; request tạo bổ sung sau nạp credit là lượt mới, không ghép ngầm.
- 20 slot tính toàn user; sắp xếp theo thời điểm hoàn tất lưu và định danh phụ ổn định. Transaction khóa phạm vi user để các lượt đồng thời không vượt 20.
- Loại lượt cũ khỏi API/UI và chặn mọi admission tái sử dụng mới từ lượt đó; không thay thế bằng việc chỉ ẩn UI.
- Job đã admission lấy snapshot bất biến của dữ liệu được chọn. Eviction không xóa dữ liệu của job đang chạy, khoản giữ hoặc bằng chứng đối soát.
- Không xóa dây chuyền ledger, logs hay AI audit. Loại khỏi lịch sử là hết quyền tái sử dụng, không phải xóa vật lý toàn bộ dấu vết.
- Deferred: xóa payload vật lý sau eviction và raw AI audit retention; cần chính sách riêng, không tự nhận rằng quota 20 giới hạn toàn bộ storage.
- Kiểm tra form trước gửi; nếu cấu trúc/entry IDs không còn tương thích thì chặn và yêu cầu tạo lượt mới, không sửa ngầm dữ liệu cũ.

## Khoản giữ và quyết toán — Proposed persistence

- Balance vẫn là số dư đã ghi sổ; available = Balance trừ tổng phần giữ chưa quyết toán.
- Khoản giữ là ràng buộc chi tiêu riêng, không phải debit/refund; tạo/giải phóng giữ không tăng TotalUsed. Giữ evidence bất biến cho các thay đổi khoản giữ.
- Mọi bên tiêu credit, gồm tạo AI và gửi ở project khác, phải kiểm available bằng cùng cơ chế khóa tài khoản/RowVersion; chỉ sửa route gửi là không đủ.
- Admission atomically ghi command/job, snapshot các bản chọn và khoản giữ. Từ chối nếu không đủ cho toàn bộ số chọn; UI cho chọn ít hơn, không tự thay tập dữ liệu.
- Rules direct giữ cách chọn subset theo credit khả dụng hiện hành, nhưng credit giữ cho phí gửi thay cho phí tạo.
- Ghi attempt bền vững trước external call. Không giữ transaction SQL hoặc execution-strategy retry quanh Google/AI call.
- Mỗi kết quả thành công được quyết toán trong một transaction: lưu kết quả attempt, tạo đúng một CreditUsed debit 1 qua credit service, giảm phần giữ tương ứng, cập nhật Balance/TotalUsed và UsageLogs.
- Unique constraint theo attempt cho settlement và command cho admission; replay không tăng debit hoặc provider calls.
- Thất bại xác định: lưu outcome và giải phóng phần giữ trong cùng transaction, không tạo debit.
- Timeout/mất kết nối/crash sau khi có thể đã gọi Google: giữ credit của attempt đó, ghi chưa xác định và cấm tự retry. Status/field cụ thể phải review; không dùng nhãn Failed như bằng chứng Google chưa nhận.
- Reconciliation dựa trên bằng chứng đáng tin cậy: thành công thì quyết toán một lần; chắc chắn chưa thành công thì giải phóng. Không tự giải phóng theo timeout.
- Deferred: công cụ/operator workflow và nguồn bằng chứng đối soát cụ thể. Bắt buộc giải quyết trước bật production để tránh khoản giữ treo không có đường xử lý.
- Google và SQL không có transaction chung: không hứa exactly-once delivery. Nếu provider thành công nhưng lưu outcome thất bại, khóa attempt chờ đối soát.
- Credit hold/job đang hoạt động không phụ thuộc slot lịch sử còn hiển thị.

## API, UI và tương thích — Proposed

- Bổ sung API owner-scoped list/detail các lượt còn tái sử dụng; list phân trang server với thứ tự ổn định. Detail tối đa 100 bản; không trả raw provider audit.
- Dùng existing generation routes cho rules/AI và mở rộng response một cách có chủ đích để trả định danh lượt, phí tạo thực tế.
- Gửi lại cần command idempotent, response IDs thuộc cùng lượt/project còn hợp lệ và xác nhận của user. Không chỉ bỏ guard chống gửi lại của SubmissionService.
- Mỗi attempt thuộc job mới, giữ immutable payload; trạng thái trên GeneratedResponse không thay thế lịch sử nhiều lần gửi.
- UI hiển thị available/đang giữ, phí tạo, phí gửi tối đa và số thực quyết toán; dashboard/credit history/AI analytics không đếm giữ như chi tiêu.
- Màn hình lịch sử hiển thị tên form, mode, thời gian, số bản và các kết quả gửi; xem payload, chọn bản, xác nhận gửi lại và cảnh báo quota tự loại lượt cũ.
- Exact route, DTO, HTTP error, schema/status transitions và presentation được hoàn thiện trong contract/DB review trước product code; không công bố tên suy đoán thành contract.
- Không đổi NCKH, auth identity, PayOS hoặc chính sách official Google Forms integration.

## Chuyển tiếp dữ liệu cũ — Proposed, cần duyệt

Dữ liệu cũ đã trả phí gộp 1/2/3 khi tạo. Thu thêm 1 ở lần gửi đầu sẽ làm tổng thành 2/3/4, trái mục tiêu giữ tổng giá lần đầu.

Khuyến nghị:
- Không tính lại số dư, refund hay sửa ledger lịch sử.
- Các bản legacy chưa từng attempt được giữ quyền gửi lần đầu không thu thêm phí gửi, theo cơ chế cũ; sau lần gửi thành công đó, gửi lại áp dụng phí mới.
- Các bản legacy đã có attempt chưa xác định phải đối soát trước khi gửi tiếp; không miễn phí/retry tự động.
- Legacy đã từng gửi thành công: lần gửi lại thu 1 credit khi thành công.
- Không suy đoán nhóm rules cũ bằng timestamp. Chỉ nhập vào quota 20 nếu chứng minh được nhóm; phần còn lại không có khả năng tái sử dụng mới mặc định. Bảo toàn API/preview đang khôi phục cần thiết và dữ liệu audit.
- Cutover cần dừng nhận generation/send cũ, drain/reconcile jobs và previews cũ đang tạo, chụp pricing policy trên bản/job, kiểm schema rồi mới bật flow mới. Không chạy hai semantics tính phí cùng lúc.
- Deferred: exact migration/backfill và xử lý legacy đã thất bại xác định nhưng chưa từng thành công; phải chốt trước kế hoạch cutover.

## Acceptance và validation khi triển khai

Evidence Task6: [VALIDATION](VALIDATION.md), [HANDOFF](HANDOFF.md), [TASK6_REPORT](TASK6_REPORT.md). [Supplement contract local đã triển khai](../../GENERATION_HISTORY_CONTRACT.md) ghi owner/version/fee/hold boundary và phân biệt legacy tooling Deferred.

- Xác minh 1–100 bản, phí tạo 0/1/2; AI lỗi zero-output không debit, partial chỉ thu số hợp lệ lưu được.
- Tạo 21 lượt và nhiều lượt đồng thời: đúng 20 slot toàn user; lần lỗi không loại lượt cũ; chặn reuse lượt hết hạn nhưng giữ logs/active snapshots.
- Gửi mới/gửi lại: số thành công khớp debit; failure giải phóng; unknown giữ; double-click/replay không gửi/trừ hai lần.
- SQL Server thật: concurrency gửi hai project và tạo AI chung tài khoản, không overspend; transaction rollback, commit-ack loss, crash, reconciliation idempotent.
- Migration trên DB sạch và baseline có dữ liệu; không mất audit/ledger, kiểm legacy pricing không thu hai lần.
- API JWT đúng owner/sai owner/Admin, list/detail, validation, expired history, fee projections.
- Browser mock và API/DB thật tách biệt: reload/relogin, chọn bản, phí, history, AI confirm, rules direct, keyboard/mobile, chunks/hydration và lỗi.
- Runtime restart process sở hữu, schema thực, safe loopback provider, HTTP và logs. Không cần gọi Google live hoặc AI trả phí khi chưa được phép.
- Independent review bắt buộc cho credit/migration/submission safety trước triển khai hoàn tất; tác giả tự đọc không tính independent.

## Tự rà soát và bước tiếp theo

- Self-review: phân biệt quyết định đã duyệt và Proposed; giữ source pricing hiện tại khác yêu cầu mới; không suy ra schema/status/refund được duyệt.
- Rủi ro chính: legacy double-charge, overspend giữa các workflow, unknown outcome giữ lâu, eviction xóa dữ liệu active, sai phân loại HTTP thành công của Google. Các case trên là gate kiểm thử/review.
- Verified: đọc source/docs và kiểm workspace chỉ đọc; kiểm cấu trúc/UTF-8/link của hồ sơ được chạy riêng khi hoàn tất.
- Not run: build/test/browser/DB/provider vì chỉ viết đặc tả. Independent review Not run; cần ở bước thiết kế kỹ thuật/triển khai có quyền phù hợp.
- Chưa commit, chưa đổi source, chưa triển khai/release.
- Đã nhận duyệt đặc tả văn bản. Bước tiếp: review [kế hoạch triển khai](IMPLEMENTATION_PLAN.md) và chọn phương thức thực thi; chưa code/dispatch trước quyết định này. Các quyết định kỹ thuật/tài chính Deferred trong đặc tả vẫn là gate Task 1.
