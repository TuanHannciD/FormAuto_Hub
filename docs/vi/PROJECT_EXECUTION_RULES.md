# PROJECT_EXECUTION_RULES

## Mục đích

Định nghĩa kỷ luật thực thi bắt buộc cho FormAuto Hub.

## Trạng thái hiện tại

- Trạng thái phase hiện tại: Closeout Phase 8 đã hoàn tất; chưa chọn phase tiếp theo.
- Phase 1 backend foundation tồn tại trong `src/FormAutoHub.Api`.
- Initial test project tồn tại trong `tests/FormAutoHub.Tests`.
- Backend đã chốt: ASP.NET Core Web API .NET 9, SQL Server, EF Core.
- Frontend framework: Next.js web dashboard.

## Quy tắc bắt buộc

- Không tự bịa business rule, API contract, field, status, event, lifecycle state hoặc quyết định kiến trúc.
- Chi tiết thiếu phải ghi `Assumption:`.
- Phần chưa duyệt phải ghi `Deferred:`.
- Giữ task trong active phase.
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
