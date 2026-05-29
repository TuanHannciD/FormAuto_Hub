# PROJECT_EXECUTION_RULES

## Mục đích

Định nghĩa kỷ luật thực thi bắt buộc cho FormAuto Hub.

## Trạng thái hiện tại

- Trạng thái global phase hiện tại: Closeout Phase 9 đã hoàn tất; chưa chọn phase tiếp theo.
- Active approved follow-up slice: Phase 6 AI mapping/generation scoped implementation.
- Phase 1 backend foundation tồn tại trong `src/FormAutoHub.Api`.
- Initial test project tồn tại trong `tests/FormAutoHub.Tests`.
- Backend đã chốt: ASP.NET Core Web API .NET 9, SQL Server, EF Core.
- Frontend framework: Next.js web dashboard.

## Quy tắc bắt buộc

- Không tự bịa business rule, API contract, field, status, event, lifecycle state hoặc quyết định kiến trúc.
- Chi tiết thiếu phải ghi `Assumption:`.
- Phần chưa duyệt phải ghi `Deferred:`.
- Giữ task trong active global phase hoặc follow-up slice đã được approve rõ.
- Chỉ thay đổi nhỏ nhất đủ đúng.
- Không làm yếu quy tắc chống abuse.
- Không làm mất validation honesty.
- Giữ `docs/ai` và `docs/vi` đồng bộ về nghĩa.
- Không viết code khi task chỉ là tài liệu.
- Không thêm business workflows trong Phase 1 foundation work trừ khi được duyệt rõ.

## Quy tắc an toàn

FormAuto Hub không được hỗ trợ spam, captcha bypass, proxy rotation, fake accounts, unauthorized form submission hoặc bypass Google restrictions.

Mọi luồng submit phải có:

- ngữ cảnh user được phép
- preview trước khi submit
- user confirmation trước khi gửi
- giới hạn MVP từ 1 đến 100 generated responses cho mỗi action
- batch submission có kiểm soát gồm 10 responses và xử lý tuần tự
- usage logging
- credit transaction khi có trừ credit

## Quy tắc contract

- API đề xuất chưa phải contract cuối.
- Field entity đề xuất chưa phải contract DB bất biến.
- Tên status/lifecycle chỉ là đề xuất cho đến khi review.
- API change phải được review contract trước khi implement.
- Database change phải được review entity và migration trước khi implement.

## Quy tắc tài liệu

- Đọc các file `.md` hiện có trước khi sửa tài liệu.
- Cập nhật cặp `docs/ai` và `docs/vi` cùng lúc.
- Không để một language layer có cam kết mạnh hơn layer còn lại.
- Nếu chỉ cập nhật một bên, phải báo out-of-sync.
## Tổ chức file & chiến lược đọc

### Giới hạn độ dài file docs

- Giữ file `.md` trong `docs/ai/` và `docs/vi/` dưới **400 dòng**.
- Khi file chạm ngưỡng, chọn một trong hai:
  - **Tách file**: nếu file chứa >= 2 chủ đề độc lập rõ ràng. Tạo file con theo tên `<TÊN_GỐC>__<CHỦ_ĐỀ_CON>.md` và biến file gốc thành index điều hướng (chỉ chứa TOC + link, không chứa nội dung chi tiết).
  - **Chế độ TOC**: nếu nội dung liên kết chặt và tách ra sẽ gây rải rác. Giữ nguyên một file nhưng thêm TOC chi tiết ở đầu, liệt kê từng section kèm số dòng bắt đầu và mô tả mục đích một dòng.
- File cũ vượt ngưỡng không bắt buộc sửa ngay; áp forward-only cho file mới và file đang active edit.

### File map cho code

- Không áp giới hạn dòng cứng cho code. Chỉ tách file khi có lý do kiến trúc rõ ràng (trích xuất concern, tạo helper/service riêng có reuse thật).
- Khi file C# vượt **500 dòng** và không tách, bắt buộc có **file map** dạng comment block ở đầu file, liệt kê từng method/nhóm property kèm dòng bắt đầu và mô tả một dòng.
- Xem `SOURCE_STRUCTURE_AND_NAMING_RULES.md` để biết định dạng và ví dụ file map.

### Chiến lược đọc

Để giảm token không cần thiết khi đọc tài liệu:

1. Đọc `AI_DOC_ROUTING_MATRIX.md` trước để xác định đúng bộ file tối thiểu cần cho task.
2. Với file > 200 dòng: quét headers hoặc TOC trước; chỉ đọc full các section liên quan đến task.
3. Không đọc lại file đã đọc trong cùng phiên.
4. Thứ tự ưu tiên: rules/contracts -> overview kiến trúc -> chi tiết implementation.
5. Khi file có TOC kèm dòng, dùng TOC để nhảy đến section cần thay vì đọc toàn bộ file.
