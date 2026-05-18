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

### Forms

- `POST /api/forms/analyze`
- `GET /api/forms/{projectId}/questions`

### Answer rules

- `POST /api/projects/{projectId}/answer-rules`
- `PUT /api/projects/{projectId}/answer-rules/{ruleId}`

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

## Status và type values đã duyệt cho Phase 2

Được duyệt cho implementation Phase 2:

TopupOrder.Status:

- Pending
- Cancelled
- Approved
- Rejected

CreditTransaction.Type:

- TopupApproved
- CreditUsed

UsageLog.Status:

- Success
- Failed

User.Role:

- User
- Admin

Không có status, type hoặc role value Phase 2 nào khác được duyệt.

## User context tạm thời

Assumption: Cho đến khi authentication và JWT claims được duyệt, Phase 2 controllers có thể dùng request headers tạm thời cho development và test routing:

- `X-FormAuto-UserId`
- `X-FormAuto-IsAdmin`

Các headers này không phải authentication contract cuối.

## Versioning và OpenAPI

- API versioning policy: Deferred.
- OpenAPI generation được kỳ vọng, nhưng implementation detail là Deferred.

## Quy tắc thay đổi

Mọi API contract change phải cập nhật cả `docs/ai` và `docs/vi`.
