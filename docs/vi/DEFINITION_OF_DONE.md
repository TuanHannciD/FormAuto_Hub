# DEFINITION_OF_DONE

## Mục đích

Định nghĩa tiêu chí hoàn tất cho task FormAuto Hub.

## Done criteria

Task chỉ được coi là done khi mọi check áp dụng đã đạt hoặc được báo trung thực.

## Checks bắt buộc

### Scope check

- Task nằm trong approved scope.
- Deferred items vẫn là Deferred.
- Abuse-prevention rules không bị làm yếu.

### Contract check

- API changes được document và review.
- DTO changes rõ ràng.
- Status/lifecycle changes được duyệt.
- Không tạo undocumented endpoint.

### Migration check

- EF Core entity changes có migration review.
- Migration validation chạy khi có database code.
- SQL Server vẫn là target database.

### Build check

- Build đã chạy khi implementation đổi code, hoặc đánh dấu `Not run`.

### Test check

- Unit/integration tests liên quan đã chạy, hoặc đánh dấu `Not run`.

### Runtime smoke check

- Code chạy thật có runtime smoke phù hợp.
- API changes đã được kiểm tra bằng HTTP request thật.
- Browser changes đã được kiểm tra qua route thật, bao gồm hydration/chunk loading khi liên quan.
- Auth/admin changes đã được kiểm tra bằng đúng user role/session.
- Database-backed changes đã được kiểm tra trên database có migration cần thiết.
- Server logs hoặc terminal output đã được kiểm tra sau smoke validation.

Build/test pass chưa đủ để đánh dấu task code chạy thật là done khi runtime smoke áp dụng.

### Security/abuse check

- Không thêm captcha bypass, proxy rotation, fake account, spam hoặc unauthorized submission behavior.
- Preview và confirmation vẫn bắt buộc.

### Docs sync check

- `docs/ai` và `docs/vi` được cập nhật cùng nhau.
- Cam kết về nghĩa trùng nhau.

## Completion template

```md
Summary:

Files changed:

Scope alignment:

Validation performed:

Validation not performed:

Runtime smoke:

Risks/Deferred items:

Next recommended step:
```
