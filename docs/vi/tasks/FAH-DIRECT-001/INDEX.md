# FAH-DIRECT-001 — Tạo và gửi trực tiếp bằng quy tắc

Trạng thái: **Done local** trong scope được duyệt sau review độc lập cho lần sửa copy cuối. Chưa commit, tích hợp, deploy hoặc phát hành; không gọi Google live hoặc provider AI trả phí.

## Phê duyệt và baseline bất biến

- Người dùng đã duyệt triển khai và tài liệu song ngữ. Option 1 (`rules`, x1) dùng một nút **Tạo và gửi ngay**, không preview UI, checkbox hoặc xác nhận lần hai.
- Option 2/3 giữ preview AI và xác nhận rõ ràng; `/submissions/send` chung giữ `Confirmed`.
- Base: `297ee2143f7a37ca02739157d75e3db06ab4be17`. Backend tạo `feat/direct-rule-submission` từ `main`; dossier không cấp quyền commit, push, cài đặt, deploy, dọn phá hủy, gửi Google thật hoặc gọi provider trả phí.
- Giữ nguyên evidence ignored/untracked có trước. Dossier song ngữ là work untracked thuộc task lúc bắt đầu triển khai.

## Contract cuối và quyết định DB của root

- `POST /api/projects/{projectId}/submissions/send-rules-direct`.
- Request: `DirectRuleSubmissionRequest(Guid CommandId, int Count)`; từ chối GUID rỗng và số lượng ngoài 1..100.
- Response: `SubmissionJobResponse` hiện có, `Total` là số phản hồi tạo được theo credit. Không dùng wrapper từng đề xuất. Số yêu cầu và thiếu credit nằm trong evidence usage generation; client giữ số đã yêu cầu.
- `CommandId == SubmissionJob.Id` là reservation bền vững. Lệnh được nhận đầu tiên quyết định kết quả. Replay kiểm owner/project rồi chỉ trả job/log hiện có, kể cả count khác; không tạo, trừ credit, gửi, resume hoặc takeover.
- Dùng lại cho project/user khác trả 404 qua service null. Không ID response tất định, trường membership, lease, trạng thái, schema hoặc migration mới.
- Admission chung/direct cùng giữ khóa row project SQL `UPDLOCK,HOLDLOCK` trước kiểm active job, generation, debit và persistence. Credit qua `ICreditService`, `UserCreditAccount.RowVersion` hiện có và `CreditTransactions` tham chiếu job.
- Chỉ transaction admission cục bộ nằm trong EF execution strategy. HTTP provider nằm ngoài transaction và delegate retry. Reservation đã commit được đọc lại sau commit mơ hồ chỉ trả kết quả; không khởi động runner từ lần đọc đó.
- Tái sử dụng validation/generation quy tắc và partial-credit x1. Không tạo được phản hồi nào do hết credit thì từ chối, không reservation job hoặc gọi provider.
- Hai route dùng chung runner tuần tự, batch tối đa 10, attempt log trước provider, lưu outcome nhận được cùng usage/audit. Admission direct bị từ chối của chủ project ghi usage Failed với 0 credit ngoài transaction đã rollback; project sai owner không bị lộ hoặc ghi log, replay vẫn chỉ đọc.
- Send chung từ chối mọi response đã có `SubmissionLog`, kể cả `Failed` chưa rõ kết quả với `SubmittedAt` null, dù vẫn `Previewed`.
- Response chưa gửi và chưa có attempt log có thể được xem rồi xác nhận gửi thủ công sau, không generation/debit lần nữa.

## Ranh giới hủy và recovery

- `Cancelled` với `FinishedAt` null vẫn active để chặn admission. Yêu cầu hủy không đánh dấu worker hoàn tất; runner xác nhận tại ranh giới batch hoặc khi dừng do gián đoạn.
- SQL cập nhật trạng thái có điều kiện ngăn race pause/cancel/completion ghi đè trạng thái hủy hoặc mở admission khi worker chưa xác nhận dừng.
- Không recovery crash tự động hoặc takeover job. Crash cứng có thể để `Running` hoặc `Cancelled` với `FinishedAt` null; cần đối soát thủ công.
- Giới hạn: `Paused` hiện có không phân biệt pause đang yêu cầu với đã xác nhận dừng. Hủy sau khi runner paused đã thoát có thể giữ `Cancelled` và `FinishedAt` null, khóa project tới khi đối soát. Đây là lựa chọn fail-closed được root duyệt cho v1 không schema.
- Không tự gửi lại kết quả chưa xác định. Không thêm hành vi provider/refund hoặc quy tắc nghiệp vụ mới.

## Ownership và ledger triển khai

- Khảo sát contract: `gpt-5.6-sol`, reasoning `medium`; chỉ đọc, không agent con.
- Thiết kế/risk ruling DB: `gpt-6.1-sol`, reasoning `high`; không agent con.
- Backend writer `/root/direct_rules_backend`: `gpt-6.1-sol`, reasoning `high`; không agent lồng nhau. Sở hữu source/test backend và cặp INDEX/BACKEND này.
- Backend reviewer `/root/direct_rules_backend_review`: `gpt-6.1-sol`, reasoning `high`; độc lập, không agent con.
- Frontend writer `/root/direct_rules_frontend`: `gpt-5.6-sol`, reasoning `medium`; không agent con.
- Frontend reviewer `/root/direct_rules_frontend_review`: `gpt-5.6-sol`, reasoning `high`; độc lập, không agent con.
- Runtime owner `/root/direct_rules_runtime`: root dispatch `gpt-5.6-sol`, reasoning `medium`; sở hữu tài nguyên SQL/runtime riêng và evidence, không triển khai service production.
- Đồng bộ tài liệu `/root/direct_rules_docs_sync`: `gpt-5.6-sol`, reasoning `low`; không agent con.
- Final reviewer `/root/direct_rules_final_review`: `gpt-6.1-sol`, reasoning `high`; độc lập, không agent con.
- Writer sửa copy `/root/direct_copy_fix`: `gpt-5.6-sol`, reasoning `medium`; không agent con.
- Reviewer đóng task cho sửa copy `/root/direct_closure_review`: `gpt-5.6-sol`, reasoning `medium`; độc lập, không agent con.
- Mọi agent được dispatch đều dùng họ Sol trong trần đã duyệt; không dùng Astra hoặc agent con lồng nhau.
- Không đổi schema. Runtime owner chỉ áp migration hiện có vào `FormAutoHub_DirectRule_Safety_20261101` trên SQL instance mặc định cục bộ. Giữ nguyên DB/config ứng dụng hiện có.

## Kế hoạch và acceptance

1. Contract đã duyệt/quyết định không schema của root và DB review: ghi ở trên.
2. DTO/controller backend, admission/runner chung, generation tái sử dụng và test: đã triển khai; xem [BACKEND](BACKEND.md).
3. Frontend action direct chỉ cho rules, giữ AI: writer/report riêng.
4. Runtime owner: test concurrency/transaction SQL, restart API/web sở hữu, HTTP có auth an toàn và browser smoke, persistence/log.
5. Review độc lập base bất biến cộng snapshot working cuối; sửa và kiểm lại finding trước local Done.

Acceptance gồm count 1/100 và từ chối 0/101, command rỗng, sai owner/project, rules thiếu/sai/không hỗ trợ, partial/zero credit x1, replay ổn định, lệnh cạnh tranh/send chung, ranh giới batch tuần tự, fence kết quả chưa biết, xác nhận send chung, xác nhận hủy và giữ preview AI.

## Validation và bước tiếp theo

- Verified 2026-11-01: backend RED 3 ca regression an toàn hiện có và RED 20 ca direct trước triển khai; sau đó RED rồi GREEN ca cancel/provider-fault.
- Verified ban đầu: 24 ca direct tập trung; direct cộng regression persistence 38/38. Sửa B1: SQL thật RED 10 failures / 2 passes, sau đó direct/unit/SQL/persistence tập trung GREEN 58/58, không skipped, trên safety DB riêng. 20 ca SQL gồm log từ chối bền vững, riêng tư sai owner, replay, rollback, concurrency và cancellation.
- Verified: build solution Release exit 0. Full backend trước chỉnh nhỏ phần diagnostic cuối: 315 passed, 12 phương thức SQL skipped (6 normalization có trước, 6 direct SQL; theory concurrency mở rộng khi opt-in).
- Verified backend: focused 58/58, không skipped, gồm 20 ca SQL thật; suite concurrency SQL runtime ban đầu 8/8. Snapshot broad backend trước đó pass 315 với 12 phương thức SQL skipped và chỉ có giá trị trong ranh giới snapshot đã ghi. Build Release pass.
- Verified frontend: Playwright affected kết hợp 30/30 trước F2 round 2; direct spec tập trung 17/17 trên bản sửa cuối; lint và production build cuối pass, chỉ còn warning ngoài scope đã ghi.
- Verified review độc lập: rereview backend B1 pass; rereview frontend F1–F4 pass; final code/spec review khớp đủ 24 hash đóng băng và không còn finding Critical/Important chưa xử lý.
- Verified runtime: auth thật với API sở hữu/DB SQL cô lập, receiver loopback fake an toàn thay vì Google, HTTP 400 B1 cộng audit SQL Failed zero-credit bền vững, riêng tư wrong-owner 404, replay ổn định không gọi receiver lần hai, và browser cuối gồm analysis chỉ dùng fixture, lưu rule/direct commit thật, recovery cùng command sau transport reset được inject, 42 chunks HTTP 200, không page error, AI preview không gọi direct và viewport mobile 390px.
- Verified SQL/log/tài nguyên runtime cuối: job hoàn tất có total/success 1/1, một debit -1, một generated response đã submitted, hai usage row tổng một credit và không failure, một submission log thành công, balance 4. Bounded log đã chẩn đoán reset có chủ ý và 404 dự kiến do thiếu AI profile. Các port sở hữu 7042/3020/18081 đã giải phóng; DB evidence riêng, screenshot và fixture synthetic được giữ lại.
- Verified lần sửa copy cuối: metadata/toast/helper editor của Rules nay mô tả tạo-và-gửi trực tiếp, còn AI giữ preview/xác nhận. Focused RED 1 rồi GREEN 3/3, Playwright affected 35/35, lint/build exit 0, và runtime production trình duyệt dùng mock mới ghi nhận 32/32 chunk HTTP 200, không có console/page error. Xem [COPY_FIX](COPY_FIX.md) và review độc lập [COPY_FIX_REVIEW](COPY_FIX_REVIEW.md).
- Not run: gửi Google thật, provider AI trả phí, deploy, commit, push, migration/schema change hoặc release.
- Verified: `git diff --check` exit 0. Còn warning NU1603 resolve phiên bản package Google Forms có trước; không sửa file dependency.
- Lệnh SQL: đặt `FORMAUTO_DIRECT_SQL_SERVER=.` và `FORMAUTO_DIRECT_SQL_DATABASE=FormAutoHub_DirectRule_Safety_20261101`, rồi `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --filter DirectRuleSubmissionSqlServerTests --no-restore -v minimal`.
- Đóng cục bộ: review độc lập cho sửa copy không tìm thấy finding Critical/Important chưa xử lý và chấp nhận snapshot là Done local. Người dùng có thể quyết định commit/tích hợp. Commit, push, deployment, production verification, cleanup và release vẫn là quyền/sự kiện riêng; staging chọn lọc phải kiểm kê artifact untracked và secret-check `src/FormAutoHub.Api/artifacts/`, không tự động stage toàn bộ dirty tree.
