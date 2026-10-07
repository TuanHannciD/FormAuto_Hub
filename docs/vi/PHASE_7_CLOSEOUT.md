# PHASE_7_CLOSEOUT

## Mục đích

Đóng Phase 7 authentication và account access.

Validation closeout gốc, các mục Not Run và danh sách Deferred bên dưới ghi lại baseline Phase 7 tại thời điểm đó. Phần follow-up có ngày ghi nhận bản sửa phiên đăng nhập sau này; không mở lại Phase 7, không chọn phase mới và không ghi đè các phê duyệt được ghi nhận ở phase sau.

## Follow-up sửa hết hạn phiên — 07/10/2026

Implementation: `54502eb` (`fix(auth): prevent expiry redirects and concurrent refresh session loss`). Bản sửa frontend này không đổi API backend, schema, thời hạn token hay quy tắc thay refresh token.

### Hành vi đã sửa

- Login chỉ chuyển về dashboard khi thời hạn refresh của phiên được lưu còn sử dụng được. Login xóa dữ liệu phiên hết hạn thay vì chuyển qua lại giữa login và dashboard.
- Login quản lý toast hết phiên, dùng một ID toast cố định và bỏ query `reason=session-expired` sau khi xử lý. Hàm `showError` dùng chung bỏ qua `SessionExpiredError` để các request song song không tạo thêm cùng thông báo hết phiên.
- Các request song song trong một trang dùng chung promise refresh đang chạy. Khi trình duyệt có Web Locks API (cơ chế khóa giữa các tab), các tab cùng origin cũng làm refresh tuần tự và đọc lại phiên hiện tại trước khi gửi. Nếu không có Web Locks, việc phối hợp chỉ nằm trong từng trang.
- HTTP 401 đến muộn cho access token cũ dùng lại phiên đã được thay token. Phản hồi refresh cũ không được ghi đè hoặc xóa một phiên đăng nhập khác được lưu trong lúc nó đang chờ.
- Refresh timestamp hết hạn hoặc HTTP 401 từ refresh kết thúc phiên. Lỗi mạng và lỗi refresh khác 401, gồm HTTP 503, được trả thành lỗi request nhưng không xóa phiên đang lưu.
- Request JSON và blob có xác thực chỉ retry sau refresh tối đa một lần. Guard dashboard và admin ngừng render nội dung được bảo vệ khi không còn phiên dùng được; cả hai theo dõi sự kiện thay đổi phiên.

### Validation cho follow-up

Verified trong kiểm tra local của bản sửa:

- `npm run test:auth` tại `apps/web`: 5/5 tests pass, bao phủ refresh song song, dùng lại phiên khi 401 đến muộn, giữ phiên khi lỗi mạng/503, refresh bị từ chối, phản hồi cũ so với phiên đăng nhập mới và dữ liệu phiên hết hạn.
- `tests/auth-session.spec.ts`: 2/2 Playwright tests pass với web local đã restart tại port 3020 bằng Edge. Dùng phiên giả lập và phản hồi API được chặn/thay thế để xác minh một toast hết phiên không kèm vòng lặp redirect, cùng một lần refresh cho các request dashboard song song.
- Browser smoke bổ sung với phản hồi API được chặn/thay thế: phiên hết hạn, refresh song song, refresh không hợp lệ, HTTP 503 và lỗi mạng đều pass; không ghi nhận lỗi runtime trình duyệt hoặc JS/CSS chunk tải thất bại.
- API smoke local thật dùng một refresh-session row tạm: refresh HTTP 200, dashboard có xác thực HTTP 200 và dùng lại refresh token cũ sau khi thay token HTTP 401. Các row smoke tạm đã được xóa. Không kiểm tra đăng nhập password/Google trong lượt này.
- Web lint và production build pass. Log web runtime được đọc sau smoke không có dấu hiệu lỗi.

Blocked: `tsc --noEmit` riêng báo lỗi nullability có sẵn ở `tests/nckh.spec.ts:742-743`, ngoài phạm vi sửa. Kết quả Next.js build pass được báo riêng, không thay thế kết quả này.

Not run: deploy/smoke production của bản sửa, tái hiện bằng phiên user thật trên production, đăng nhập password/Google cho follow-up này và browser regression test với nhiều tab. Code có xử lý Web Locks nhưng chưa tuyên bố hành vi nhiều tab đã được xác minh.

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
