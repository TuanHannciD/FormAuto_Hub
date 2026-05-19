# API_CONTRACT_GUIDE

## Mục đích

Kiểm soát thiết kế API contract cho FormAuto Hub.

## Trạng thái hiện tại

Các API area dưới đây là đề xuất, chưa phải contract cuối. Mỗi endpoint cần contract review trước khi implement.

## Quy tắc REST naming

- Dùng route REST theo resource.
- Dùng danh từ cho resource.
- Chỉ dùng action subroute cho workflow rõ ràng như `approve`, `reject`, `generate`, `send`, `pause`, `cancel`.
- API contract phải frontend-agnostic.
- Không tạo undocumented endpoint.

## API area đề xuất

### Dashboard

- `GET /api/dashboard/summary`

### Packages

- `GET /api/packages`

### Top-up orders

- `POST /api/topup-orders`
- `GET /api/topup-orders`
- `GET /api/topup-orders/recent`
- `GET /api/topup-orders/{id}`
- `POST /api/topup-orders/{id}/cancel`

### Admin top-up orders

- `GET /api/admin/topup-orders`
- `POST /api/admin/topup-orders/{id}/approve`
- `POST /api/admin/topup-orders/{id}/reject`

### Usage logs

- `GET /api/usage-logs`
- `GET /api/usage-logs/recent`

### Credit transactions

- `GET /api/credit-transactions`

### Profile

- `GET /api/profile`
- `PUT /api/profile`
- `PUT /api/profile/change-password`

### Authentication and account access

Behavior baseline đã duyệt cho Phase 7:

- `POST /api/auth/register` đăng ký bằng email/password và trả JWT sau khi đăng ký thành công
- `POST /api/auth/login` đăng nhập bằng email/password
- `POST /api/auth/google` đăng nhập hoặc auto-register bằng Google identity only
- `POST /api/auth/refresh` rotate refresh token/session hiện tại và trả token mới
- `POST /api/auth/logout` revoke refresh token/session hiện tại
- `POST /api/auth/link-google` link Google identity đã verified sau khi user login password
- `PUT /api/profile/change-password` đổi mật khẩu từ profile
- password recovery chưa implement và UI có thể hiển thị là đang được cập nhật

Quy tắc token/session đã duyệt:

- access token hết hạn sau 1 giờ
- refresh token hết hạn sau 7 ngày
- refresh token/session storage dùng table riêng `RefreshTokens`
- lockout threshold: 5 failed login attempts
- lockout duration: 15 minutes

Quy tắc starting credit khi đăng ký đã duyệt:

- user mới nhận 5 starting credits
- starting credit grant phải ghi một dòng `CreditTransactions`
- `InitialGrant` là giá trị `CreditTransaction.Type` đã duyệt cho starting credits

Quy tắc Google identity đã duyệt:

- nếu `provider_user_id` hoặc Google `sub` đã tồn tại trong storage, login luôn cho user đã link
- nếu chưa có provider user id nhưng Google email trùng account password hiện có, chỉ xét link khi `email_verified = true`
- email trùng đã verified không được silent auto-link; flow ưu tiên là login password trước rồi link Google
- nếu `email_verified = false`, không auto-link
- Google auto-register được phép khi không có conflict với account hiện có
- điều này không duyệt official Google Forms API scopes hoặc Google Forms integration behavior

Cần contract review trước implementation:

- error response details

JWT claims đã duyệt:

- `sub`: user id
- `email`: user email
- `role`: user role
- `jti`: token id

### Forms

- `POST /api/forms/analyze`
- `GET /api/forms/{projectId}/questions`

### Answer rules

- `POST /api/projects/{projectId}/answer-rules`
- `PUT /api/projects/{projectId}/answer-rules/{ruleId}`

Phần mở rộng config answer-rule cho Checkbox đã duyệt:

- chỉ áp dụng cho `FormQuestionTypes.Checkbox`
- các choice mode hiện có giữ nguyên: `RandomEqually`, `RandomByPercentage`, `RandomByQuantity`
- `RandomByPercentage` dùng integer percentage weights từ 0 đến 100
- frontend nên hiển thị input dạng phần trăm và giữ tổng hiển thị không vượt quá 100%
- `ConfigJson.minSelections`: số option tối thiểu trong mỗi generated answer
- `ConfigJson.maxSelections`: số option tối đa trong mỗi generated answer
- nếu thiếu, cả hai mặc định là `1` để tương thích ngược
- `maxSelections` không được vượt quá số option đã cấu hình hoặc giới hạn generated answer value
- `MultipleChoice`, `Dropdown`, `LinearScale`, và `Rating` vẫn là câu hỏi single-value
- `CheckboxGrid` vẫn Deferred để thiết kế rule riêng

### Generated responses

- `POST /api/projects/{projectId}/responses/generate`
- `GET /api/projects/{projectId}/responses`

### Submissions

- `POST /api/projects/{projectId}/submissions/send`
- `GET /api/projects/{projectId}/submissions/jobs/{jobId}`
- `POST /api/projects/{projectId}/submissions/jobs/{jobId}/pause`
- `POST /api/projects/{projectId}/submissions/jobs/{jobId}/cancel`

Quy tắc an toàn cho submission:

- Preview generation nhận 1 đến 100 responses mỗi action.
- Submission nhận tối đa 100 confirmed preview response IDs cho mỗi job.
- Submission phải xử lý tuần tự theo batch 10, không delay nhân tạo và không gửi song song kiểu burst.
- Mỗi project chỉ có một submission job đang active tại một thời điểm.
- Pause/cancel chỉ dừng ở batch boundary; response send đang chạy không bị force-kill.

## Quy tắc DTO

- Mọi request body phải có request DTO rõ ràng.
- Mọi response phải có response DTO rõ ràng hoặc primitive response đã document.
- Không expose EF Core entity trực tiếp qua API response.
- Không thêm field chỉ vì đoán frontend sau này cần.
- Validation rule phải đi cùng DTO contract.

## Error response

Cần một error shape nhất quán khi bắt đầu implementation.

Assumption: ASP.NET Core `ProblemDetails` là candidate hợp lý, nhưng chưa được duyệt là error contract cuối.

## Pagination và filtering

- List endpoint nên có pagination trước production.
- Exact pagination shape: Deferred.
- Filtering fields phải document trước khi implement.
- Sorting fields phải document trước khi implement.

## Kỷ luật status

- Status fields chỉ là đề xuất cho đến khi review.
- Không thêm lifecycle name tùy tiện.
- Mỗi status cần allowed transitions, owner và terminal-state behavior.

## Status và type values đã duyệt

Các giá trị đã duyệt:

TopupOrder.Status:

- Pending
- Cancelled
- Approved
- Rejected

CreditTransaction.Type:

- TopupApproved
- CreditUsed
- InitialGrant

UsageLog.Status:

- Success
- Failed

User.Role:

- User
- Admin

Không có status, type hoặc role value nào khác được duyệt nếu chưa được document rõ.

## User context tạm thời

Assumption: JWT authentication của Phase 7 hiện là đường authentication bình thường của app. Temporary request headers chỉ có thể còn lại như fallback cho development/test trong current user context implementation và không được Next.js dashboard API client sử dụng:

- `X-FormAuto-UserId`
- `X-FormAuto-IsAdmin`

Các headers này không phải authentication contract cuối.

## Versioning và OpenAPI

- API versioning policy: Deferred.
- OpenAPI generation được kỳ vọng, nhưng implementation detail là Deferred.

## Quy tắc thay đổi

Mọi API contract change phải cập nhật cả `docs/ai` và `docs/vi`.
