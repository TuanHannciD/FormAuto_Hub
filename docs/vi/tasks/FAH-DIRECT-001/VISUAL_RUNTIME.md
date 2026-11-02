# FAH-DIRECT-001 — Xác minh runtime/giao diện mới

Ngày: 2026-11-02. Trạng thái: `Verified` cho phạm vi API-SQL-loopback và trình duyệt local mới bên dưới. Lần chạy này không gọi Google thật hoặc nhà cung cấp AI trả phí, không tuyên bố tích hợp, triển khai hay phát hành.

## Phạm vi và tài nguyên

- Publish API mới: `dotnet publish src/FormAutoHub.Api/FormAutoHub.Api.csproj -c Release --no-restore -o artifacts/reports/direct-rules-visual-20261102/runtime-final/api-build ...`; exit 0, chỉ có cảnh báo phân giải gói Google Forms `NU1603` đã biết.
- Kết nối API theo tiến trình: đúng database SQL local `FormAutoHub_DirectRule_Safety_20261101`; không dùng database mặc định `FormAutoHub`.
- Runtime sở hữu: API `http://127.0.0.1:7042`, Next.js `http://127.0.0.1:3020`, receiver loopback an toàn `http://127.0.0.1:18081`. Health API và trang login web đều trả HTTP 200 trước khi kiểm tra hành vi.
- T3 `preview_status` không có trong catalog tool hiện tại, vì vậy dùng Playwright theo fallback đã quy định. Không tương tác tab trình duyệt do người dùng sở hữu.
- Artifact Playwright mock kết hợp 35/35 được giữ nguyên và không chạy lại theo yêu cầu.

## Ma trận API-SQL-loopback mới

Các request có xác thực dùng user local dùng một lần cùng project/câu hỏi/quy tắc tổng hợp trong database chuyên dụng.

| Trường hợp | Kết quả |
| --- | --- |
| count `0` | `Verified`: HTTP 400 |
| count `101` | `Verified`: HTTP 400 |
| command ID rỗng | `Verified`: HTTP 400 |
| quy tắc trực tiếp x1 | `Verified`: HTTP 200, `Completed`, total 1 |
| replay cùng command với count khác | `Verified`: HTTP 200, giữ total gốc 1; không gửi lại |
| thiếu credit một phần | `Verified`: yêu cầu 5 khi còn bốn credit trả HTTP 200, `Completed`, total 4 |
| hết credit | `Verified`: HTTP 400 |
| sai chủ sở hữu kèm request không hợp lệ | `Verified`: HTTP 404 |

Receiver ghi nhận năm POST: một lượt x1 và bốn lượt đủ credit của trường hợp partial. Bằng chứng SQL của project này ghi hai job, năm generated response, năm submission log, tám usage row tổng năm credit và hai debit tham chiếu job tổng `-5.00`.

## Bằng chứng trình duyệt mới

Trình duyệt dùng đăng ký/JWT thật, dashboard read, lưu answer rule, direct API, SQL persistence và receiver loopback. Chỉ phân tích form và phản hồi AI preview/provider được intercept xác định, nên không gọi Google hoặc AI trả phí. Chế độ quy tắc hiển thị **Tạo và gửi ngay** và không có checkbox preview. AI mặc định/tùy chỉnh giữ luồng preview và xác nhận. Tổng hợp SQL cho lần browser mới ghi một job, một generated response, một submission log, hai usage row tổng một credit và một debit `-1.00`.

Ảnh và SHA-256:

- `artifacts/reports/direct-rules-visual-20261102/runtime-final/screenshots/rules-config-mobile.png` — `E31151F44EC1D00E34F0DB7C4156F4A09608B3B13659AF24A1652AEAD1923EBD`
- `artifacts/reports/direct-rules-visual-20261102/runtime-final/screenshots/rules-result-mobile.png` — `BA166953578D537330AB05A50DA51A4988758C2A9423321F748CC8305AF8F1A4`
- `artifacts/reports/direct-rules-visual-20261102/runtime-final/screenshots/ai-default-mobile.png` — `12CC3A0B6B72646353F9C2BBE850078846D6A16E783127B060D2D5495328C1D9`
- `artifacts/reports/direct-rules-visual-20261102/runtime-final/screenshots/ai-preview-mobile.png` — `7DB0A5882869954FBBACDF6DF502DDAB3F6088F88DC4CC7FDBDE66D5BEC1D8BA`
- `artifacts/reports/direct-rules-visual-20261102/runtime-final/screenshots/ai-custom-mobile.png` — `E62ADBFBB922FBF5FBFCF7004520E06D887D191FE1BCC503C282160D3E5FF24F`
- `artifacts/reports/direct-rules-visual-20261102/runtime-final/screenshots/ai-custom-desktop.png` — `5F3BEF1CF5F831C5E21D9D2A3A1E59249539B894053025242C10C2FD4AEC9A2E`

Console trình duyệt chỉ có hai thông báo HTTP 404 dự kiến do local chưa có AI prompt profile; không ghi nhận page exception. Bằng chứng chi tiết nằm tại `artifacts/reports/direct-rules-visual-20261102/runtime-final/`.

## Giải phóng tài nguyên và giới hạn

- `Verified`: đã đối chiếu tiến trình API/web/receiver sở hữu theo command/parentage chính xác, dừng chúng và xác nhận cổng 7042/3020/18081 không còn listener.
- `Not run`: gửi Google thật, AI live/trả phí, database production/hiện hành, deploy, commit, push, tích hợp hoặc phát hành.
- Giữ lại database chuyên dụng và bằng chứng tổng hợp. Không thay đổi hoặc xóa dirty/untracked work hiện có.
