# SELF_REVIEW_CHECKLIST

## Mục đích

Bắt buộc agent tự review scope, contract safety, architecture, validation và docs sync.

## Checklist

### Scope

- Task có nằm trong approved phase không?
- Deferred items có vẫn là Deferred không?
- Assumptions có được label không?

### Safety

- Change có tránh spam, bypass, proxy, fake-account và unauthorized submission behavior không?
- Submission có vẫn cần preview và confirmation không?
- Giới hạn MVP 1 đến 100 preview và batch submission tuần tự 10 có được giữ không?

### Architecture

- Controllers có mỏng không?
- Services có giữ business logic không?
- EF Core persistence có được tách đúng không?
- Integration calls có nằm trong integration services không?

### Contracts

- API contracts đã review chưa?
- DTOs có rõ không?
- Entity fields có được xem là proposed nếu chưa duyệt không?
- Status names và transitions có bị tự bịa không?

### Credit discipline

- Credit changes có ghi `CreditTransactions` không?
- Tool actions có ghi `UsageLogs` không?
- Submissions có ghi `SubmissionLogs` không?

### Validation

- Build/test/runtime validation có thật sự chạy không?
- Validation bỏ qua có được ghi `Not run` hoặc `Blocked` không?
- Nếu code đổi API/browser/auth/database/payment path chạy thật, runtime smoke có được chạy sau khi restart process bị ảnh hưởng không?
- Browser validation có xác nhận hydration/chunk loading thay vì chỉ HTML `200` không?
- API validation có dùng đúng auth role/session không?
- Server logs hoặc terminal output có được kiểm tra sau smoke path không?
- Nếu runtime smoke áp dụng nhưng chưa chạy, final answer có tránh claim task đã done không?

### Docs

- `docs/ai` và `docs/vi` có được cập nhật cùng nhau không?
- Cam kết về nghĩa có đồng bộ không?
