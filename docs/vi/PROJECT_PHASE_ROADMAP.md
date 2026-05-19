# PROJECT_PHASE_ROADMAP

## Mục đích

Định nghĩa phase triển khai và scope gate cho FormAuto Hub.

## Current Phase

Current phase: **Phase 7 - Authentication and account access**.

## Phase 0 - Documentation and scope baseline

Status: Completed baseline, chờ doc sync sau này khi cần.

Bao gồm:

- documentation architecture
- AI execution docs
- Vietnamese human docs
- module map
- phase roadmap
- safety và non-goal baseline
- proposed API/entity documentation

Exit criteria:

- required docs tồn tại trong `docs/ai` và `docs/vi`
- docs đồng bộ về nghĩa
- Deferred items được label rõ
- stale conflicting docs đã được gỡ

## Phase 1 - Backend foundation

Status: Completed.

Bao gồm:

- ASP.NET Core Web API .NET 9 project
- controller-based API baseline
- SQL Server connection
- EF Core setup
- initial entities
- EF Core migrations

Current completed subset:

- solution scaffold
- ASP.NET Core Web API .NET 9 project
- controller-based API pipeline
- SQL Server EF Core package setup
- minimal `FormAutoHubDbContext`
- safe connection string placeholder không chứa secrets
- xUnit test project
- initial conceptual entities từ `DOMAIN_ENTITIES_OVERVIEW.md`
- initial EF Core migration
- local `dotnet-ef` 9.0.16 tool manifest
- migration validation trên temporary LocalDB database

Không bao gồm:

- payment gateway
- Google OAuth
- AI answer generation
- production background job framework

## Phase 2 - Account and credit management

Status: Completed.

Bao gồm:

- users
- credit accounts
- credit packages
- top-up orders
- admin approval/rejection
- credit transactions
- usage logs
- dashboard summary API
- dashboard account areas: overview, top-up credits, top-up orders, tool usage history, credit transactions, profile
- dashboard summary cards: current credit balance, total credits deposited, total credits used, pending top-up orders
- dashboard recent panels: recent top-up orders, recent tool usage

Không bao gồm:

- payment gateway integration
- package management UI khi chưa duyệt
- admin user management UI khi chưa duyệt
- manual credit adjustment khi chưa duyệt

## Phase 3 - Form automation MVP

Status: Completed.

Bao gồm:

- Google Form URL analysis
- question detection
- entry ID detection khi available
- MVP question types: short text, paragraph text, multiple choice, checkbox, dropdown, linear scale, rating, multiple choice grid, checkbox grid, date, time
- Deferred question type: file upload, vì Google yêu cầu đăng nhập với form upload file
- MVP answer-generation modes: random equally, random by percentage, random by quantity, sample text lines cho text answers, khoảng ngày tuần tự, khoảng giờ tuần tự
- answer rules
- response preview
- controlled submission
- usage logging
- submission logs
- giới hạn 1 đến 100 generated responses mỗi action, với submission xử lý tuần tự theo batch 10

Không bao gồm:

- captcha bypass
- proxy rotation
- fake accounts
- unauthorized submission
- AI answer generation khi chưa duyệt
- official Google Forms API/OAuth khi chưa duyệt

## Phase 4 - Safety and validation hardening

Status: Completed.

Bao gồm:

- rate limiting
- validation tốt hơn
- error handling
- audit logs
- anti-abuse constraints
- submission safety tốt hơn

Không bao gồm:

- production integrations khi chưa duyệt rõ

## Phase 5 - Frontend dashboard and tool UI

Status: Completed.

Bao gồm:

- dashboard/account management UI
- form automation UI
- preview-before-submit UI
- top-up order UI
- profile UI

Frontend framework: Next.js web dashboard.

## Phase 6 - Production integrations

Status: Current.

Deferred trừ khi được duyệt rõ:

- Google OAuth
- official Google Forms API
- payment gateway
- background job framework
- AI mapping/generation
- webhook integrations
- production deployment platform

Ghi chú candidate tương lai:

- Google OAuth có thể hữu ích sau này cho việc xác minh quyền truy cập form do user sở hữu hoặc được phép dùng.
- Official Google Forms API có thể hữu ích sau này để đồng bộ metadata, câu hỏi và response của form.
- Google Forms watches với luồng notification kiểu Cloud Pub/Sub có thể hữu ích sau này để phát hiện thay đổi schema hoặc response.
- Background jobs có thể hữu ích sau này để renew watch, retry sync và kiểm tra sức khỏe integration.

Deferred:

- Các candidate tương lai này chưa phải scope implementation đã duyệt.
- Các mục này không duyệt API contracts, database fields, statuses, lifecycle states, OAuth token storage, webhook/PubSub ingestion models hoặc lựa chọn background job framework.
- Nếu task tương lai cần UI cho các integration này, chỉ dùng UI docs hiện có khi đã đủ; nếu chưa đủ thì phải hỏi lại hướng UI hoặc sync UI docs trước khi implement.

## Phase 7 - Authentication and account access

Status: Completed.

Scope đã duyệt:

- đăng ký bằng email/password
- đăng nhập bằng email/password
- JWT access token với refresh token/session
- access token hết hạn sau 1 giờ
- refresh token hết hạn sau 7 ngày
- đăng ký trả JWT ngay, không bắt login lại lần hai
- user mới đăng ký nhận 5 starting credits
- starting credit grant phải được ghi vào `CreditTransactions`
- `InitialGrant` được duyệt là credit transaction type cho starting credits
- logout chỉ revoke refresh token/session hiện tại
- đổi mật khẩu trong profile
- password recovery chưa implement; UI có thể hiển thị là đang được cập nhật
- đăng nhập/đăng ký bằng tài khoản Google chỉ dùng cho identity
- Google login không duyệt official Google Forms API, form scopes, watches, webhooks hoặc background jobs

Quy tắc Google login đã duyệt:

- nếu `provider_user_id` hoặc Google `sub` đã tồn tại trong storage, login luôn cho user đã link
- nếu chưa có provider user id nhưng Google email trùng account password hiện có, chỉ xét link khi `email_verified = true`
- email trùng với `email_verified = true` không được silent auto-link; flow ưu tiên là bắt user login password trước rồi link Google
- nếu `email_verified = false`, không auto-link
- Google auto-register được phép khi không có conflict với account hiện có

Hướng persistence đã duyệt:

- dùng table riêng `RefreshTokens` cho refresh token/session storage
- refresh token fields đã implement: `Id`, `UserId`, `TokenHash`, `ExpiresAt`, `RevokedAt`, `CreatedAt`
- Google external login fields đã implement: `Id`, `UserId`, `Provider`, `ProviderUserId`, `Email`, `EmailVerified`, `CreatedAt`

Lockout baseline đã duyệt:

- lockout threshold: 5 failed login attempts
- lockout duration: 15 minutes

Implementation subset đã hoàn tất:

- auth endpoints cho register, login, Google identity login, refresh, logout và link Google account
- JWT claims: `sub`, `email`, `role`, `jti`
- table `RefreshTokens` cho refresh token/session storage
- table `UserExternalLogins` cho Google identity links
- app APIs được bảo vệ bằng JWT authorization
- frontend auth routes cho login, register, auth callback và profile security
- frontend bearer-token API client với refresh-token retry
- dashboard auth guard và logout current session
- đổi mật khẩu trong profile dùng password verification thay vì so sánh hash tạm thời
- EF Core migration `Phase7Authentication`

## Phase Rule

Task ngoài active phase cần approval rõ hoặc phải thu hẹp về safe in-phase subset.
