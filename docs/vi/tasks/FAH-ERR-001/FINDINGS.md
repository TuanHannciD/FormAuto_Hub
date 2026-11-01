> Mốc ban đầu là lịch sử. Danh sách **24 nhóm** và evidence hiện tại: [báo cáo sâu](DEEP_AUDIT_REPORT.md), [ERR-021–024](DEEP_AUDIT_FINDINGS.md), [coverage](COVERAGE.md), [validation](VALIDATION.md). Các câu đang chờ/bước tiếp theo bên dưới chỉ thuộc mốc ban đầu.

# FAH-ERR-001 — Phát hiện ban đầu: xử lý lỗi dùng chung

Ngày: 2026-10-29. HEAD đã rà soát: `a19f7a2f3dc1bc54ff645d662d94fc614439256a`.
Trạng thái: **Rà soát một phần; chưa triển khai sửa**. Cả năm phát hiện ở mức P2: ảnh hưởng cách người dùng hiểu lỗi hoặc làm mất dữ kiện chẩn đoán trong xử lý thất bại thông thường; chưa xác nhận sự cố production hoặc lộ bí mật. Các nhóm theo [INDEX](INDEX.md). [Coverage](COVERAGE.md) ghi phần còn lại.

## Bằng chứng và cách tái hiện

Bằng chứng local: [probe](../../../../artifacts/reports/error-audit-2026-10-29/shared-error-probe.cjs), [kết quả và hash mã nguồn](../../../../artifacts/reports/error-audit-2026-10-29/shared-error-probe-results.json), [manifest kiểm kê](../../../../artifacts/reports/error-audit-2026-10-29/source-manifest.json).

Lệnh từ gốc repo: `node artifacts/reports/error-audit-2026-10-29/shared-error-probe.cjs` — exit 0, tái hiện 5/5 quan sát. Probe biên dịch mã helper TS thực tế; hàm ánh xạ đăng nhập được lấy từ AST của hàm thật. Fetch/auth/toast được giả lập, không gọi trình duyệt, API, DB hay provider. Assertion đạt xác nhận hành vi có vấn đề hiện tại, không phải sửa lỗi thành công. Không assertion nào chứng minh UI đã render trong trình duyệt.

Từ `apps/web`: `npm run test:auth` — exit 0, 9/9 test hiện có đạt. Các test này kiểm tra phiên đăng nhập, không bao phủ khả năng đọc hiểu lỗi nói chung. `public-ui-refinement.spec.ts` hiện còn mong đợi `Unauthorized` trong cảnh báo đăng nhập; đã đọc nhưng chưa chạy lại test trình duyệt đó.

## ERR-001 — Mất thông tin HTTP trước khi dịch lỗi đăng nhập

- Nhóm: gộp/phân loại sai nguyên nhân + khó hiểu trên UI + chẩn đoán. P2 vì người dùng có thể thấy tiêu đề trạng thái tiếng Anh và nơi sử dụng không phân biệt status đáng tin cậy.
- Nguồn: [api.ts](../../../../apps/web/lib/api.ts), `apiFetchInternal`; [đăng nhập](../../../../apps/web/app/login/page.tsx), `authErrorMessage`; [AuthController](../../../../src/FormAutoHub.Api/Controllers/AuthController.cs), `ToActionResult`. Service xác thực cố ý gộp các trường hợp sai thông tin đăng nhập; cần giữ biện pháp này.
- Kích hoạt: phản hồi đăng nhập HTTP 401 cùng `{title: "Unauthorized", status: 401}`. `apiFetchInternal` chỉ giữ title/detail trong Error thường; trang đăng nhập tìm `401`/`423` bên trong câu lỗi. **Verified bằng mock, PROBE-01:** câu sau ánh xạ là `Unauthorized`; Error không có thuộc tính status.
- Mong đợi: chọn câu UI xác thực sẵn có theo thông tin phản hồi đáng tin cậy, vẫn dùng thông báo chung cho sai thông tin đăng nhập. Câu đề xuất cho trường hợp này: `Email hoặc mật khẩu không đúng.`
- Tác động chẩn đoán: helper không gắn rõ status/path/method. Công cụ network trình duyệt có thể vẫn giữ chúng; không kết luận mọi khả năng truy vết đều mất.
- Hướng sửa đề xuất: giữ thông tin HTTP hiện có ở nội bộ và ánh xạ tại nơi sử dụng; kiểm tra ánh xạ đăng ký/Google/tài khoản trước khi chọn thiết kế chung. Không mặc định đổi hợp đồng phản hồi máy chủ.
- Kiểm chứng: fixture 401 chỉ có title, 423, xung đột và lỗi chưa biết; hồi quy auth/session cùng cảnh báo UI và network trong trình duyệt. Chỉ đổi test đang mong tiếng Anh sau khi câu chữ mới được duyệt.

## ERR-002 — Mất chi tiết validation và thông tin truy vết

- Nhóm: gộp nguyên nhân + chẩn đoán + khó hiểu trên UI. P2 vì người dùng mất hướng dẫn sửa theo trường, người debug mất dữ kiện liên kết đã có trong phản hồi.
- Nguồn: [api.ts](../../../../apps/web/lib/api.ts), phân tích phản hồi không thành công.
- Kích hoạt: HTTP 400 có title chung, `errors` theo trường và `traceId`. **Verified bằng mock, PROBE-02:** Error chỉ còn `One or more validation errors occurred.`; không giữ `errors` hoặc `traceId`.
- Mong đợi: giữ chẩn đoán an toàn có sẵn và phân biệt validation theo trường với lỗi chung. Câu gợi ý: `Một số thông tin chưa hợp lệ. Hãy kiểm tra các mục được báo lỗi.` Chỉ dùng khi UI thực sự chỉ rõ trường lỗi; tránh hứa có đánh dấu khi chưa có.
- Hướng sửa đề xuất: kiểm tra payload validation thực tế theo endpoint, giữ chi tiết có cấu trúc hiện có ở nội bộ và ánh xạ trường/thông báo đã biết sang tiếng Việt. Trường phản hồi mới hoặc hợp đồng `ProblemDetails` toàn cục vẫn chưa được duyệt.
- Kiểm chứng: nhiều trường, trường chưa biết, thiếu title, JSON sai và phản hồi model-binding thực tế. **Not run:** tái hiện payload validation ASP.NET thực; probe dùng fixture đại diện, không phải phản hồi endpoint đã kiểm chứng.

## ERR-003 — Bộ lọc vẫn cho qua lỗi mạng tiếng Anh và văn bản thô

- Nhóm: khó hiểu trên UI + chẩn đoán. P2 vì lỗi mạng/proxy thông thường bỏ qua câu dự phòng tiếng Việt có ngữ cảnh.
- Nguồn: [api.ts](../../../../apps/web/lib/api.ts), dự phòng bằng body thô và lỗi fetch không được chuyển đổi; [toast.ts](../../../../apps/web/lib/toast.ts), `readableError` và `showError`.
- Kích hoạt A: body HTML ngắn trong phản hồi 502 giả lập. **Verified bằng mock, PROBE-03:** `readableError` trả nguyên `<html><body>Upstream unavailable</body></html>`. Đây là lộ văn bản thô; chưa kiểm tra render React/sonner và chưa chứng minh XSS.
- Kích hoạt B: fetch ném `TypeError('Failed to fetch')`. **Verified bằng mock, PROBE-05:** `showError(error, 'Không tải được dữ liệu.')` phát `Failed to fetch`; không gọi `console.error` vì câu gốc trùng câu hiển thị. Devtools có thể tự ghi request thất bại.
- Mong đợi: câu có ngữ cảnh và dễ hiểu; giữ thông tin chẩn đoán an toàn mà không mặc định lỗi fetch xác định được mất mạng/CORS/TLS/proxy. Câu đề xuất: `Không kết nối được với hệ thống. Hãy kiểm tra kết nối và thử lại.`
- Hướng sửa đề xuất: phân loại lỗi truyền tải/body bất thường trước khi hiển thị; không dùng riêng độ dài dòng và tìm chuỗi như chính sách nhận diện câu an toàn. Kiểm tra nhánh hiện ghi nguyên lỗi khi lọc câu, gồm tác động bảo mật dữ liệu; chưa tái hiện lộ bí mật thực tế.
- Kiểm chứng: failed fetch, hủy request, timeout, HTML/plain text ngắn, JSON lỗi, câu nhiều dòng/dài, log an toàn và render tại nơi sử dụng. Không biến thao tác hủy chủ động thành cảnh báo lỗi.

## ERR-004 — Tải tệp bỏ mất giải thích từ máy chủ

- Nhóm: gộp nguyên nhân + khó hiểu trên UI + chẩn đoán. P2 vì tải tệp có ít thông tin hành động hơn request JSON cho cùng lỗi máy chủ.
- Nguồn: [api.ts](../../../../apps/web/lib/api.ts), `apiFetchBlob`; nơi sử dụng mới tìm qua tìm kiếm: ảnh minh chứng tại trang nạp tiền/cộng credit và xuất dữ liệu NCKH. Chưa rà đầy đủ các luồng này.
- Kích hoạt: phản hồi tải tệp khác 401 có `{title, detail}`. **Verified bằng mock, PROBE-04:** cùng phản hồi 409 giả lập trả được detail qua `apiFetch`, nhưng `apiFetchBlob` chỉ trả `Không tải được tệp. Mã lỗi HTTP 409.`
- Mong đợi: câu dễ hiểu theo thao tác và giữ nguyên nhân/status an toàn ở nội bộ. Câu dự phòng gợi ý: `Không tải được tệp. Vui lòng thử lại.` Hướng dẫn cho xung đột cần nguyên nhân endpoint thực; không suy độ an toàn của tải lại/thử lại chỉ từ status HTTP.
- Hướng sửa đề xuất: dùng chung phân tích lỗi khi loại phản hồi cho phép, giữ xử lý đặc biệt hiện tại cho quyền Google và khôi phục phiên FormAuto.
- Kiểm chứng: lỗi ảnh/xuất dữ liệu, body lỗi JSON/plain/rỗng, 401 Google so với JWT, thiếu quyền/không tìm thấy/xung đột; test phiên hiện có và kiểm tra nơi sử dụng trên trình duyệt thực.

## ERR-005 — Lỗi phân tích tiếng Anh còn đi vào mô tả lịch sử người dùng

- Nhóm: khó hiểu trên UI. P2 vì cùng thông báo hướng tới lập trình viên xuất hiện cả khi thao tác và trong lịch sử người dùng.
- Chuỗi nguồn: [GoogleFormsClient](../../../../src/FormAutoHub.Api/Integrations/GoogleForms/GoogleFormsClient.cs), `AnalyzeAsync` → [FormProjectService](../../../../src/FormAutoHub.Api/Services/FormProjectService.cs), `AnalyzeAsync`/`WriteUsageLogAsync` → [FormsController](../../../../src/FormAutoHub.Api/Controllers/FormsController.cs), `Analyze` → `apiFetchInternal` → [trang biểu mẫu](../../../../apps/web/app/dashboard/forms/page.tsx), `analyze`/`showError`. Lịch sử: [UsageLogService](../../../../src/FormAutoHub.Api/Services/UsageLogService.cs) → [UsageLogsController](../../../../src/FormAutoHub.Api/Controllers/UsageLogsController.cs) → [trang lịch sử](../../../../apps/web/app/dashboard/usage-logs/page.tsx), cột mô tả.
- Bằng chứng đọc mã: có các câu `Invalid form URL.`, `Only public Google Forms URLs are supported.`, `Google Form action URL was not detected.` Service ghi cùng exception message vào `UsageLogs.Description`; controller gửi thành detail và bộ lọc câu ngắn của toast cho qua. Cột lịch sử render trực tiếp description. **Verified bằng lần theo mã; tái hiện đầy đủ DB/HTTP/trình duyệt Not run.**
- Mong đợi: giải thích cho người dùng bằng tiếng Việt, không chứa thuật ngữ triển khai như action URL/entries; chẩn đoán giữ chi tiết kỹ thuật riêng. Câu gợi ý cho nhánh liên kết không hỗ trợ: `Liên kết này không phải liên kết Google Biểu mẫu được hỗ trợ. Hãy kiểm tra lại liên kết.` Không đoán lý do không nhận diện câu hỏi từ nhánh parser chung.
- Hướng sửa đề xuất: tách câu hiển thị an toàn khỏi nguyên nhân kỹ thuật tại ranh giới hiện có. Mô tả tiếng Anh đã lưu cần quyết định riêng; không tự sửa lịch sử bất biến hoặc migration dữ liệu khi sửa câu chữ.
- Kiểm chứng: URL sai, host không hỗ trợ, lỗi phân tích và lỗi HTTP provider qua UI/lịch sử. Xác nhận bảo toàn nguyên nhân gốc: service hiện gắn ngoại lệ gốc làm inner exception, nên nhánh này **không** mất chuỗi ngoại lệ tại điểm đó.

## Nhóm sửa, câu hỏi còn lại và bước tiếp theo

Thứ tự đề xuất, chưa phải duyệt triển khai: (1) xem thiết kế biểu diễn/phân tích lỗi chung cho ERR-001/002/004; (2) ánh xạ UI an toàn và chẩn đoán cho ERR-003; (3) câu chữ theo endpoint và hành vi mô tả usage cho ERR-005. Giữ phân biệt xác thực hiện có và bất biến log/credit/submission.

Ghi chú khảo sát, chưa phải lỗi bổ sung đã chứng minh:

- `Program.cs` không đăng ký rõ `UseExceptionHandler`/`AddProblemDetails`; có tự migration DB khi khởi động. Cần xác định hành vi môi trường thực trước khi kết luận về lỗi chưa bắt; không tùy tiện khởi động API để xem phản hồi.
- `readableNckhError` lẫn tiếng Việt với `contract NCKH`, `min/max` và gộp theo chuỗi rộng. Đã đọc helper/controller biến; còn chờ kiểm tra service/hợp đồng nơi sử dụng và runtime trước khi lập phát hiện riêng.
- Mã trang lịch sử usage/credit hiện phân biệt tải thất bại với dữ liệu rỗng; không coi tên component `EmptyState` là bằng chứng nuốt lỗi.

Bước tiếp theo: tiếp tục lần theo endpoint/service/nơi sử dụng cho 282 file đang chờ, ưu tiên ranh giới chẩn đoán thanh toán/credit/submission và NCKH, đồng thời kiểm tra chỉ đọc quyền sở hữu runtime/điều kiện schema. Kiểm chứng runtime/provider đầy đủ và review độc lập vẫn **Not run**. Không phát hành, deploy hoặc sửa sản phẩm.
