# API_CONTRACT_GUIDE

## TOC

- [Mục đích](#mục-đích) (34)
- [Trạng thái hiện tại](#trạng-thái-hiện-tại) (38)
- [Quy tắc REST naming](#quy-tắc-rest-naming) (42)
- [API area đề xuất](#api-area-đề-xuất) (50)
  - [Dashboard](#dashboard) (52)
  - [Packages](#packages) (56)
  - [Top-up orders](#top-up-orders) (101)
  - [Admin top-up orders](#admin-top-up-orders) (146)
  - [Admin AI provider settings](#admin-ai-provider-settings) (191)
  - [PayOS webhooks](#payos-webhooks) (266)
  - [Usage logs](#usage-logs) (304)
  - [Credit transactions](#credit-transactions) (334)
  - [Profile](#profile) (356)
  - [Authentication and account access](#authentication-and-account-access) (362)
  - [Forms](#forms) (409)
  - [Answer rules](#answer-rules) (414)
  - [Generated responses](#generated-responses) (432)
  - [AI prompt profiles](#ai-prompt-profiles) (454)
  - [AI generated responses](#ai-generated-responses) (478)
  - [Submissions](#submissions) (545)
- [Quy tắc DTO](#quy-tắc-dto) (560)
- [Error response](#error-response) (568)
- [Pagination và filtering](#pagination-và-filtering) (574)
- [Kỷ luật status](#kỷ-luật-status) (581)
- [Status và type values đã duyệt](#status-và-type-values-đã-duyệt) (587)
- [User context tạm thời](#user-context-tạm-thời) (637)
- [Versioning và OpenAPI](#versioning-và-openapi) (646)
- [Quy tắc thay đổi](#quy-tắc-thay-đổi) (651)

## Mục đích

Kiểm soát thiết kế API contract cho FormAuto Hub.

## Trạng thái hiện tại

Một số API area dưới đây vẫn là đề xuất, và một số phase slice đã có contract được duyệt và implement. Mỗi section ghi rõ behavior là đã duyệt, đã implement, đề xuất, hoặc Deferred.

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

Behavior public đã duyệt:

- chỉ trả về credit packages đang bật
- normal users dùng danh sách này khi tạo top-up thủ công hoặc top-up PayOS

Follow-up admin package management đã duyệt:

- `GET /api/admin/packages`
- `POST /api/admin/packages`
- `PUT /api/admin/packages/{id}`

Behavior admin đã duyệt:

- chỉ admin được truy cập
- liệt kê tất cả credit packages, gồm cả package đang tắt
- tạo credit package với `name`, `credits`, `price`, và `isActive`
- cập nhật `name`, `credits`, `price`, và `isActive` của package hiện có
- dùng `isActive` để ẩn package khỏi lựa chọn top-up của normal user
- không hard-delete package trong follow-up này
- top-up orders đã tạo giữ snapshot `credits` và `amount`
- giá package dùng cho PayOS phải là số VND nguyên dương

Request DTO fields đã duyệt:

- `name`
- `credits`
- `price`
- `isActive`

Response behavior đã duyệt:

- dùng lại `CreditPackageResponse`
- list response bọc dạng `{ items: CreditPackageResponse[] }`

Deferred:

- hard delete
- package popularity analytics
- màu hiển thị hoặc merchandising metadata riêng cho package
- discount riêng theo package hoặc subscription pricing

### Top-up orders

- `POST /api/topup-orders`
- `GET /api/topup-orders`
- `GET /api/topup-orders/recent`
- `GET /api/topup-orders/{id}`
- `POST /api/topup-orders/{id}/cancel`

Phần mở rộng PayOS top-up cho Phase 8:

- `POST /api/topup-orders/payos`

Behavior đã duyệt:

- tạo top-up order cho authenticated user từ credit package đang active
- dùng PayOS làm payment provider
- tạo PayOS payment link từ amount và credit phía server theo package
- trả top-up order id và PayOS checkout URL cho frontend
- không cho frontend truyền amount, credits hoặc payment method tự do trong PayOS flow
- không cộng credit khi mới tạo payment link
- chỉ cộng credit sau khi hệ thống xử lý PayOS payment đã xác minh và ghi ledger `CreditTransactions`

Request DTO đề xuất:

- `packageId`

Response DTO đề xuất:

- `topupOrderId`
- `packageId`
- `credits`
- `amount`
- `paymentProvider`
- `checkoutUrl`
- `paymentLinkId`
- `status`
- `createdAt`

Cần contract review trước implementation:

- tên DTO chính xác
- error response chính xác
- dùng lại `TopupOrderResponse` hay tạo PayOS response DTO riêng
- `paymentLinkId` có luôn trong mọi create-link response thành công từ PayOS hay không

### Admin top-up orders

- `GET /api/admin/topup-orders`
- `POST /api/admin/topup-orders/{id}/approve`
- `POST /api/admin/topup-orders/{id}/reject`

Phần mở rộng admin reporting cho Phase 8:

- `GET /api/admin/revenue/summary`
- `GET /api/admin/payments`
- `GET /api/admin/payments/{id}`
- `GET /api/admin/payment-providers/payos`
- `PUT /api/admin/payment-providers/payos`
- `POST /api/admin/payment-providers/payos/check`

Behavior đã duyệt:

- chỉ admin được truy cập
- cung cấp read model cho doanh thu, thanh toán, top-up order, credit đã cấp và credit đã dùng
- payment read model cho admin trả `userEmail` để hiển thị và có thể giữ `userId` để truy vết
- đọc và cập nhật cấu hình PayOS qua admin-only APIs
- lưu cấu hình PayOS trong database qua `PaymentProviderSettings`
- không expose PayOS secrets
- chỉ trả secret preview dạng masked cho `ApiKey` và `ChecksumKey` đã cấu hình
- không expose raw sensitive webhook payloads trừ khi task sau này duyệt redacted audit view

Behavior PayOS settings đã duyệt:

- `ClientId`, `ReturnUrl`, `CancelUrl`, và enabled state có thể trả về cho admin users
- `ApiKey` và `ChecksumKey` là write-only từ góc nhìn UI
- `ApiKey` và `ChecksumKey` phải được mã hóa trước khi lưu
- secret input để trống trong update request nên giữ nguyên encrypted secret hiện có
- PayOS config check không được cộng credit hoặc tạo payment records
- PayOS config check chỉ nên kiểm tra cấu hình bắt buộc đã có đủ, trừ khi task sau này duyệt live provider check

Cần contract review trước implementation:

- pagination shape
- filtering fields
- sorting fields
- kỳ tổng hợp doanh thu chính xác
- payment detail DTO chính xác
- tên PayOS settings DTO chính xác
- masked secret response shape chính xác

### Admin AI provider settings

Backend subset provider settings Phase 6 đã duyệt:

- `GET /api/admin/ai-provider-settings`
- `PUT /api/admin/ai-provider-settings`
- `POST /api/admin/ai-provider-settings/check`

Behavior đã duyệt:

- chỉ admin được truy cập
- lưu cấu hình AI provider trong database qua `AiProviderSettings`
- mã hóa API keys trước khi lưu
- không bao giờ trả raw API key về frontend clients
- chỉ trả key preview dạng masked
- validate provider và default model có giá trị trước khi enable setting
- hỗ trợ default model cho generation
- configuration check không được generate preview, trừ credit, hoặc tạo `GeneratedResponses`

Request DTO đã duyệt:

`UpdateAiProviderSettingsRequest`

- `provider`
- `apiKey`
- `defaultModel`
- `isEnabled`
- `baseUrl`

Response DTOs đã duyệt:

`AiProviderSettingsResponse`

- `provider`
- `displayName`
- `hasApiKey`
- `apiKeyPreview`
- `baseUrl`
- `defaultModel`
- `allowedModels`
- `isEnabled`
- `lastCheckedAt`
- `lastCheckStatus`
- `lastCheckMessage`
- `updatedAt`

`CheckAiProviderSettingsResponse`

- `status`
- `message`
- `checkedAt`

Chính sách provider/model đã duyệt:

- Provider và model là chuỗi do admin kiểm soát và được lưu server-side.
- Admin update request được đặt custom provider identifier, default model identifier, và Base URL optional.
- Backend validation yêu cầu provider và default model không được rỗng trước khi lưu.
- Enable setting yêu cầu API key đã lưu dạng encrypted, provider không rỗng, và default model không rỗng.
- Nếu có nhập, `baseUrl` phải là absolute URL dùng `http` hoặc `https`.
- Normal-user generation request vẫn không được nhận quyền quyết định provider, model, API key, hoặc base URL.
- `allowedModels` được giữ trong response để tương thích UI và có thể chứa default model đã lưu; đây không còn là hardcoded provider allow-list.
- OpenAI-compatible runtime calls dùng Base URL đã lưu và gọi `{baseUrl}/chat/completions`, trừ khi Base URL đã kết thúc bằng `/chat/completions`.

Check statuses đã duyệt:

- `NotChecked`
- `Ready`
- `MissingConfiguration`
- `InvalidConfiguration`

Deferred:

- chính sách redact raw error
- live provider model catalog validation calls

### PayOS webhooks

- `POST /api/payments/payos/webhook`
- Frontend proxy cho local smoke dùng một public domain: `POST /api/payments/payos/webhook` trên Next.js app chuyển tiếp nguyên payload PayOS sang backend endpoint ở trên.

Behavior đã duyệt:

- nhận PayOS payment webhook payload
- cho phép PayOS gọi public domain của frontend khi test local/tunnel nhưng vẫn giữ backend làm authority
- frontend proxy không được cộng credit, tự xác minh payment như authority, hoặc mutate payment state
- backend payment service vẫn là nơi duy nhất xác minh chữ ký PayOS, match payment identity, và cộng credit
- xác minh PayOS signature trước khi thay đổi state
- match webhook data với PayOS top-up order hiện có
- xác minh amount và payment identity trước khi cộng credit
- chỉ cộng credit tối đa một lần cho top-up order tương ứng
- ghi `CreditTransactions` cho mọi lần cộng credit tự động
- trả 2xx sau khi nhận diện an toàn webhook trùng đã xử lý
- không cộng credit từ PayOS return URL

PayOS contract facts từ tài liệu chính thức:

- tạo payment link dùng `POST https://api-merchant.payos.vn/v2/payment-requests`
- signature tạo link dùng checksum key và HMAC-SHA256 trên sorted data string gồm `amount`, `cancelUrl`, `description`, `orderCode`, và `returnUrl`
- webhook body gồm `code`, `desc`, `success`, `data`, và `signature`
- webhook `data` gồm các giá trị như `orderCode`, `amount`, `description`, `reference`, `transactionDateTime`, `currency`, và `paymentLinkId`
- return URL query params có thể gồm `code`, `id`, `cancel`, `status`, và `orderCode`; phần này dùng để hiển thị kết quả cho user và không được dùng làm authority để cộng credit
- khi dùng một frontend tunnel, cấu hình PayOS webhook bằng frontend origin cộng thêm `/api/payments/payos/webhook`; Return URL và Cancel URL vẫn dùng `/payment/payos/return` và `/payment/payos/cancel`

Cần contract review trước implementation:

- tên PayOS request/response DTO chính xác
- chiến lược lưu raw request
- boundary cho signature verification helper
- idempotency key cho payment
- mapping lỗi provider
- chính sách logging và redaction
- boundary cho encryption service của PayOS secrets lưu trong DB

### Usage logs

- `GET /api/usage-logs`
- `GET /api/usage-logs/recent`

Hành vi query đã duyệt cho `GET /api/usage-logs`:

- hỗ trợ `action` để lọc chính xác theo action
- hỗ trợ `search` trên action, tool name, status và description
- hỗ trợ `page` và `pageSize`
- UI usage mặc định nên request `action=Xem lại câu trả lời được tạo`
- `page` được clamp tối thiểu là 1
- `pageSize` được clamp từ 1 đến 100
- kết quả được sort theo `createdAt` giảm dần
- server chỉ trả các dòng thuộc trang hiện tại theo filter đang áp dụng

Các field response đã duyệt cho `GET /api/usage-logs`:

- `items`
- `page`
- `pageSize`
- `totalItems`
- `totalPages`

Giá trị action filter đã duyệt cho việc xem giao dịch credit từ câu trả lời được tạo:

- `Xem lại câu trả lời được tạo`

Frontend có thể cho phép xem tất cả thao tác, nhưng trang usage-log mặc định phải tập trung vào action xem câu trả lời được tạo vì đó là nhóm usage entry thể hiện giao dịch tiêu credit.

### Credit transactions

- `GET /api/credit-transactions`

Hành vi query đã duyệt cho `GET /api/credit-transactions`:

- hỗ trợ `type` để lọc chính xác theo các giá trị `CreditTransaction.Type` đã duyệt
- hỗ trợ `search` trên type, description, và reference type
- hỗ trợ `page` và `pageSize`
- `page` được clamp tối thiểu là 1
- `pageSize` được clamp từ 1 đến 100
- kết quả được sort theo `createdAt` giảm dần
- server chỉ trả các dòng thuộc trang hiện tại theo filter đang áp dụng

Các field response đã duyệt cho `GET /api/credit-transactions`:

- `items`
- `page`
- `pageSize`
- `totalItems`
- `totalPages`

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

Hành vi tạo preview đã duyệt:

- request `count` vẫn phải từ 1 đến 100
- mỗi generated preview response tốn 1 credit
- nếu credit hiện có thấp hơn `count` yêu cầu nhưng lớn hơn 0, chỉ tạo theo số credit hiện có thay vì fail toàn bộ request
- khi tạo partial, chỉ trừ số credit tương ứng với số preview đã tạo và trả về số credit còn thiếu để UI gợi ý nạp thêm
- nếu credit hiện có là 0, từ chối tạo preview và không lưu generated response hoặc ghi credit transaction

Các field `GenerateResponsesResponse` đã duyệt:

- `items`: các preview response đã tạo
- `creditsUsed`: số credit đã trừ cho lần tạo này
- `balanceAfter`: số dư credit sau khi trừ
- `requestedCount`: số preview user yêu cầu
- `generatedCount`: số preview thực tế đã tạo
- `missingCredits`: số credit còn thiếu để tạo đủ số lượng user yêu cầu

### AI prompt profiles

Backend area lưu AI prompt Phase 6 đã duyệt:

- `GET /api/projects/{projectId}/ai-prompt-profile`
- `PUT /api/projects/{projectId}/ai-prompt-profile`
- `PUT /api/projects/{projectId}/ai-prompt-profile/questions/{questionId}`
- `POST /api/projects/{projectId}/ai-prompt-profile/auto-fill`

Behavior đã duyệt/implement:

- authenticated project owner được truy cập
- Option 2 lưu default profile cho project
- Option 3 lưu global và per-question prompt configuration
- auto-fill prompt miễn phí và không được trừ credit
- backend validation phải enforce prompt length limits
- prompt guard phải reject unsafe prompts trước provider calls

Deferred hoặc vẫn cần review:

- frontend/API binding bổ sung ngoài scoped slice đã duyệt
- live provider-backed auto-fill behavior
- quản lý prompt-template rộng hơn

### AI generated responses

Backend area AI preview generation Phase 6 đã duyệt:

- `POST /api/projects/{projectId}/ai-responses/generate`
- `GET /api/projects/{projectId}/ai-generation-runs`
- `GET /api/projects/{projectId}/ai-generation-runs/{runId}`

Route đã implement:

- `POST /api/projects/{projectId}/ai-responses/generate`

Request DTO đã implement:

`AiGenerateResponsesRequest`

- `mode`
- `count`

Response DTO đã implement:

`AiGenerateResponsesResponse`

- `runId`
- `status`
- `requestedCount`
- `generatedCount`
- `multiplier`
- `creditsUsed`
- `missingCredits`
- `balanceAfter`
- `generatedPreviewIds`

Behavior đã duyệt/implement:

- authenticated project owner được generate
- AI generation tạo trực tiếp `GeneratedResponses`
- generated previews là read-only sau khi tạo
- Option 2 dùng credit multiplier `2`
- Option 3 dùng credit multiplier `3`
- credit chỉ bị trừ cho generated previews được lưu thành công
- generation failed trừ 0 credit
- partial generation chỉ lưu và tính credit cho preview hợp lệ
- AI output phải được validate trước khi lưu
- choice-style answers phải khớp stored form options
- raw provider request/response phải được ghi vào AI audit storage
- raw provider request/response không được trả trong generation response
- runtime generation dùng provider settings đã enabled ở server; normal-user request không nhận provider/model/API key

Boundary cho runtime provider adapter:

- deterministic adapter chỉ được dùng khi bật rõ bằng cấu hình local/test
- runtime adapter mặc định fail-safe disabled cho đến khi live provider adapter được approve và cấu hình
- OpenAI-compatible adapter chỉ được dùng khi bật rõ bằng runtime configuration và phải dùng admin provider settings phía server

Deferred hoặc vẫn cần review:

- endpoint đọc danh sách/chi tiết run cấp project
- run list/detail response shape chính xác
- normal users có được xem non-raw audit summaries hay không
- raw payload access và retention policy
- raw admin/debug payload endpoint
- provider-specific SDK adapter ngoài OpenAI-compatible HTTP contract
- live provider model catalog validation
- frontend/API binding bổ sung ngoài scoped slice đã duyệt
- production browser closeout với credential provider thật

### AI usage analytics

- `GET /api/dashboard/ai-usage` — Thống kê AI generation theo người dùng
- `GET /api/admin/ai-usage` — Thống kê AI generation toàn hệ thống

Hành vi đã duyệt (người dùng):

- Trả về tổng số lượt AI generation, số lần thành công/thất bại, credit đã dùng, số previews đã tạo
- Trả về phân tích theo chế độ (FullAi / CustomAi) với số lần dùng và credit
- Trả về 10 lượt AI gần nhất kèm tên project, provider, model, trạng thái, thời gian
- Trả về thống kê theo ngày trong 30 ngày qua (ngày, số lần, credit)
- Dữ liệu chỉ đọc từ bảng `AiGenerationRuns` hiện có; không cần entity mới

Hành vi đã duyệt (admin):

- Trả về tất cả trường của người dùng nhưng tổng hợp trên toàn hệ thống
- Thêm: tổng số người dùng, hiệu suất provider, người dùng top đầu
- Hiệu suất provider bao gồm số lần thành công/thất bại và thời gian trung bình

### GET /api/admin/ai-usage/runs — Admin danh sách lượt AI (phân trang)

**Xác thực:** Admin JWT bắt buộc.

**Tham số query:**
- `page` (int, mặc định 1) — số trang
- `pageSize` (int, mặc định 20, tối đa 100) — số bản ghi mỗi trang
- `status` (string, tùy chọn) — lọc theo trạng thái (VD: Succeeded, Failed, Partial)
- `mode` (string, tùy chọn) — lọc theo mode (VD: Option2, Option3)
- `provider` (string, tùy chọn) — lọc theo tên provider
- `model` (string, tùy chọn) — lọc theo tên model
- `fromDate` (ISO datetime, tùy chọn) — lọc từ ngày
- `toDate` (ISO datetime, tùy chọn) — lọc đến ngày

**Response (200):**
```json
{
  "items": [...],
  "page": 1,
  "pageSize": 20,
  "totalItems": 122,
  "totalPages": 7
}
```

**Behavior:**
- Trả về danh sách lượt AI có phân trang, sắp xếp theo `CreatedAt` giảm dần
- Hỗ trợ tối đa 6 bộ lọc kết hợp với logic AND
- Dữ liệu read-only từ bảng `AiGenerationRuns`
- `durationMs` được tính client-side từ `StartedAt`/`CompletedAt`



Deferred:

- Thống kê AI theo project
- Thống kê cấp câu hỏi (AiGenerationRunItem)
- Xuất dữ liệu AI (CSV, JSON)
- Giám sát AI real-time
- Cảnh báo AI hoặc ngưỡng thông báo

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

Quy tắc Phase 8:

- Giữ `TopupOrder.Status` theo hướng `Pending -> Approved` cho implementation PayOS đầu tiên, trừ khi lifecycle review sau này duyệt payment-specific top-up statuses.
- Lưu status chi tiết của PayOS trong payment metadata thay vì thêm lifecycle name cho top-up tùy tiện.

CreditTransaction.Type:

- TopupApproved
- CreditUsed
- InitialGrant

Quy tắc Phase 8:

- PayOS automatic credit grant nên dùng lại `TopupApproved` trừ khi ledger review sau này duyệt credit transaction type mới.

UsageLog.Status:

- Success
- Failed

AiGenerationRun.Status:

- Pending
- Running
- Succeeded
- Partial
- Failed

Quy tắc Phase 6:

- AI run statuses được duyệt cho Phase 6 requirement package, nhưng allowed transitions và persistence fields chính xác vẫn cần contract và database review trước implementation.

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
