# FAH-HISTORY-SEND-001 — Sửa lỗi gửi bằng quy tắc

**Mục tiêu:** sửa “Tạo và gửi ngay”, kiểm chứng local và Google thật trong giới hạn cho phép, review độc lập, commit/merge main local và đóng sạch tài nguyên sở hữu.
**Phạm vi được duyệt:** yêu cầu người dùng ngày 07/11/2026; tối đa hai phản hồi thử vào form đã cung cấp. Không push/deploy hoặc sửa production.
**Base:** `0b25aea08dc2c654614660e12bfa2f776df69e41`; nhánh `fah-history-001`.
**Hợp đồng:** [GENERATION_HISTORY_CONTRACT](../../GENERATION_HISTORY_CONTRACT.md), [task gốc](../FAH-HISTORY-001/INDEX.md). Không đổi schema, giá, trạng thái hay endpoint công khai.

## Thiết kế và giới hạn

Bộ đọc dùng cho gửi tách khỏi parser nhập form: phải hiểu đầy đủ danh sách câu hỏi, required, options, cấu hình và danh tính form/action. Chỉ hỗ trợ schema đã kiểm chứng cho text, trắc nghiệm, dropdown, checkbox và các trang nối tiếp thông thường. Other được nhận diện nhưng chỉ gửi lựa chọn liệt kê. Scale/date/time/grid/file, phân nhánh và cấu hình chưa hiểu tiếp tục bị chặn.

Bằng chứng semantic không chứa nhãn, timestamp hoặc token phiên. Kiểm tra metadata ở admission và mỗi batch10 ngoài SQL retry; thêm preflight từng item trước PossibleDispatch. Payload và target bất biến phải khớp dữ liệu refresh. Option snapshot đã biết không được thay đổi; null cũ vẫn là unknown.

Chỉ HTTP200 với DOM xác nhận đầy đủ, đúng form, data trống và link confirmation mới chứng minh thành công. Không dựa vào câu chữ, redirect hoặc status riêng lẻ. Dùng AngleSharp1.10.0 từ NuGet, không chạy script/tải tài nguyên; audit không có advisory đã biết. Artifact riêng tư chứa response và hash, ghi/flush trước settlement; ngoài web root, cấu hình GoogleForms:EvidencePath. Linux dùng quyền0700/0600; Windows kế thừa quyền tài khoản ứng dụng. Lưu artifact cùng DB evidence khi sao lưu; chưa chạy ACL Linux.

Giữ nguyên Unknown hold/fence, không tự retry POST hoặc tự đối soát. UI lịch sử chỉ gợi ý eligibility; gửi luôn kiểm tra lại. Quan sát Partial ban đầu không bị sửa thành Complete. Đối soát operator và activation production vẫn Deferred.

## Plan và kết quả

- [x] Tái hiện: UI409 FormEvidenceUnavailable, không tạo job/hold/debit; nguyên nhân compatibility luôn false và receipt luôn Unknown.
- [x] TDD parser, receipt, compatibility/payload/target; sửa backend và thông báo lỗi rõ ràng, giữ command recovery.
- [x] Unit, SQL, lint/build và browser mock; restart API/web thuộc worktree và kiểm chứng Google thật, ledger, replay, history.
- [x] Review độc lập R1/R2; sửa5 Important, R2 không còn Critical/Important. Root16 hardening có RED/GREEN bổ sung.
- [ ] Commit/merge main local, kiểm chứng hậu merge và dọn tài nguyên.

Root gpt-6.1-sol/medium; design reviewer và R1/R2 đều gpt-6.1-sol/high, không agent lồng. Snapshot R2 gồm18 file/hash; root16 bổ sung chỉ thu hẹp schema. Minor closure có thể gọi nhiều lần không xuất hiện qua runner hiện tại (runner chỉ gọi1); giữ Deferred.

## Kiểm chứng ngày 07/11/2026

- Verified: dotnet test FormAutoHub.sln -c Release:416 pass,49 opt-in skip. API Release build pass; NU1603 đã có từ trước.
- Verified: SQL submission13/13 trên localhost/DESKTOP-TS5JR7L, DB FormAutoHub_History_Safety_20261104, schema đã áp dụng và startup không còn migration. Không reset/drop DB.
- Verified: direct-rule-submission Playwright18/18 với API mock, bao gồm mất kết nối/recovery không tự POST; lint/build pass (hai warning hook cũ); detector Impeccable không finding.
- Verified: Google thử1 nhận HTTP200 confirmation thật, SHA256 b2b12834858fa8cf613c32d24df0131ed641651099f1a09497d38bef9f176843. Thử2 từ nút UI local count1 nhận Completed/Success1/Unknown0, balance5→4, held0, một transaction gửi và log, lịch sử1response/0phí tạo.
- Verified: replay cùng command424ffa8e-d9f4-4e87-acad-45cc68922753 không đổi SQL counters/ledger hoặc artifact; evidence GoogleConfirmationDocument có file lấy lại được, SHA khớp.
- Verified: lịch sử API sendBlocked=false, UI list hiển thị lượt mới và1thành công; JS/CSS chunks200, không lỗi console ở smoke sạch. Trước smoke đã thay phiên synthetic hết hạn (refresh cũ bị xoay do thao tác CLI); không dispatch và SQL không đổi.
- Tổng phản hồi Google thật:2/2, không gửi thêm. Không chạy AI trả phí hoặc gửi live lại từ history vì hết ngân sách. Luồng resend/phí/replay có unit và SQL synthetic.
- Không chạy: deploy/production, ACL Linux, loại form ngoài tập hỗ trợ; không nằm trong acceptance local.

Evidence riêng tư ở main `.codex-tmp/history-local-debug-20261107/`; giữ DB và bằng chứng. Báo cáo này không tuyên bố production đã cập nhật.
