# PHASE_7_CLOSEOUT

## Mục đích

Đóng Phase 7 authentication và account access.

## Scope đã hoàn tất

- Đăng ký bằng email/password.
- Đăng ký trả JWT ngay.
- User mới nhận 5 starting credits.
- Starting credits được ghi vào `CreditTransactions` với type `InitialGrant`.
- Đăng nhập bằng email/password.
- JWT access tokens.
- Refresh token/session storage trong `RefreshTokens`.
- Access token hết hạn sau 1 giờ.
- Refresh token hết hạn sau 7 ngày.
- Logout chỉ revoke refresh token/session hiện tại.
- Lockout sau 5 lần đăng nhập sai trong 15 phút.
- Google identity login/register không dùng Google Forms API scopes.
- Link Google account yêu cầu verified email và flow login password trước đối với password account hiện có.
- Đổi mật khẩu trong profile hiện verify current password thay vì so sánh hash tạm thời.
- Các app API hiện có được bảo vệ bằng JWT authorization.
- Next.js frontend đã có route auth cho login, register, auth callback và profile security.
- Frontend API calls hiện dùng `Authorization: Bearer <accessToken>` thay cho MVP demo user header.
- Dashboard routes hiện guard user chưa đăng nhập và redirect về login.
- Frontend refresh token handling rotate access-token session đã hết hạn trước khi retry API call.
- Frontend logout revoke refresh token/session hiện tại và clear local session state.

## API surface đã implement

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/link-google`
- `PUT /api/profile/change-password`

## Persistence đã implement

- Thêm `RefreshTokens`.
- Thêm `UserExternalLogins`.
- Thêm `Users.FailedLoginCount`.
- Thêm `Users.LockoutUntil`.
- Cho phép `Users.PasswordHash` nullable cho Google-only users.
- Thêm unique index cho `Users.Email`.
- Thêm unique index cho `RefreshTokens.TokenHash`.
- Thêm unique index cho `UserExternalLogins.Provider` + `UserExternalLogins.ProviderUserId`.
- EF Core migration: `Phase7Authentication`.

## Validation

Verified:

- `dotnet build src/FormAutoHub.Api/FormAutoHub.Api.csproj`
- `dotnet build FormAutoHub.sln`
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj`
- `npm run lint` trong `apps/web`
- `npm run build` trong `apps/web`
- `dotnet-ef migrations script --idempotent`
- `dotnet-ef database update` với temporary LocalDB database
- API smoke với temporary LocalDB: register -> starting credit 5 -> bearer dashboard summary -> đổi mật khẩu -> logout current session
- temporary LocalDB database đã được drop sau validation

## Not Run

- Live Google identity login với Google client thật.
- Browser UI smoke test bằng Playwright hoặc browser thật.
- Apply migration lên production database.

## Deferred

- Password recovery email flow.
- Official Google Forms API scopes.
- Google Forms watches.
- Webhooks.
- Background jobs.
- Payment gateway.
- AI mapping/generation.

## Ghi chú

- Google identity verification cần cấu hình `Auth:GoogleClientId`.
- `Auth:SigningKey` trong appsettings là development placeholder và phải được thay bằng secret theo môi trường trước production.
- Temporary header user context hiện chỉ còn là fallback trong context class; HTTP controllers hiện yêu cầu JWT authorization.
- Các nút Google hiện route tới unavailable/callback state đã duyệt trừ khi real Google Identity client flow cung cấp `id_token`.
