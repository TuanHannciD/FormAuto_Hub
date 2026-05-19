# AUTH_UI_DESIGN_GUIDE

## Mục đích

Định nghĩa hướng UI trước implementation cho các màn xác thực của FormAuto Hub.

File này chỉ kiểm soát UI copy, state, và phạm vi màn hình. File này không phê duyệt kiến trúc authentication production, Google OAuth implementation, JWT claim structure, password recovery email flow, hoặc backend contract mới.

## Các màn được bao phủ

- `login`
- `register`
- `auth-callback`
- `profile-security`
- lockout và auth-error states

Các màn này phải đi theo frontend baseline đã duyệt:

- Next.js web dashboard
- shadcn/ui với Tailwind CSS
- lucide-react icons
- phong cách SaaS B2B vận hành, gọn và đáng tin cậy

## Quy tắc UI auth chung

- Màn auth phải sạch, tập trung, và tạo cảm giác tin cậy.
- Mỗi form chỉ nên có một primary action.
- Validation inline phải nằm gần field liên quan.
- Lỗi cấp tài khoản nên dùng alert component.
- Submit button và callback page phải có loading state.
- Không hiển thị chi tiết implementation như provider exception name, stack trace, scopes, tokens, hoặc internal IDs.
- Không được gợi ý rằng Google OAuth, password reset email, hoặc production session management đã hoàn tất nếu task implementation sau này chưa duyệt rõ.

## Login

UI bắt buộc:

- Email input.
- Password input.
- Primary button: `Đăng nhập`.
- Secondary provider button: `Đăng nhập với Google`.
- Link sang trang đăng ký: `Tạo tài khoản`.
- Link quên mật khẩu hiển thị unavailable: `Quên mật khẩu - Đang cập nhật`.

State bắt buộc:

- Loading: disable actions và hiển thị trạng thái đang gửi sau khi submit form.
- Sai thông tin đăng nhập: `Email hoặc mật khẩu không đúng.`
- Tài khoản bị khóa tạm thời: `Tài khoản bị khóa tạm thời. Vui lòng thử lại sau [thời lượng khóa].`
- Provider unavailable: `Đăng nhập với Google hiện chưa khả dụng. Vui lòng thử lại sau.`

Copy lockout phải hiển thị thời lượng khóa khi backend trả về. Nếu backend không trả thời lượng, dùng thông báo retry chung và không tự bịa số phút.

## Register

UI bắt buộc:

- Full name input.
- Email input.
- Password input.
- Primary button: `Tạo tài khoản`.
- Secondary provider button: `Tiếp tục với Google`.
- Link sang trang đăng nhập: `Đã có tài khoản? Đăng nhập`.
- Password helper: `Mật khẩu tối thiểu 8 ký tự.`
- Starter credit copy: `Tài khoản mới nhận 5 credit khởi đầu.`

Assumption: Copy 5 credit khởi đầu là message UI/product được yêu cầu. Khi implement frontend, phải xác minh backend signup credit behavior đã được duyệt trước khi bind copy này vào trạng thái tài khoản thật.

State bắt buộc:

- Loading sau khi submit.
- Email đã tồn tại.
- Email không hợp lệ.
- Password ngắn hơn 8 ký tự.
- Provider unavailable cho Google register/login.

## Auth Callback

UI bắt buộc:

- Loading state sau Google redirect.
- Success state trước khi redirect vào dashboard.
- Error state có action an toàn để quay lại login.

Copy bắt buộc:

- Loading: `Đang xác thực tài khoản Google...`
- Success: `Đăng nhập thành công. Đang chuyển vào dashboard...`
- Google email chưa verified: `Email Google chưa được xác minh. Vui lòng xác minh email trước khi tiếp tục.`
- Account link failed: `Không thể liên kết tài khoản Google với tài khoản hiện tại.`
- Provider unavailable: `Nhà cung cấp đăng nhập hiện không khả dụng. Vui lòng thử lại sau.`

Deferred: UI guide này không phê duyệt production Google OAuth callback behavior, token exchange, scopes, provider storage, hoặc account-linking backend contracts.

## Profile Security

Màn này có thể mở rộng từ profile/account settings reference hiện có.

UI bắt buộc:

- Form đổi mật khẩu.
- Panel phiên hiện tại.
- Action logout current session.
- Chỉ báo tài khoản Google đã liên kết.
- Dòng password recovery hiển thị `Đang cập nhật`.

Field đổi mật khẩu:

- Mật khẩu hiện tại.
- Mật khẩu mới.
- Xác nhận mật khẩu mới.
- Password helper: `Mật khẩu tối thiểu 8 ký tự.`

State bắt buộc:

- Đổi mật khẩu thành công.
- Mật khẩu hiện tại không đúng.
- Mật khẩu mới quá ngắn.
- Xác nhận mật khẩu không khớp.
- Xác nhận logout phiên hiện tại.
- Indicator tài khoản Google đã liên kết.
- Indicator tài khoản Google chưa liên kết.

Deferred: Không tạo production password recovery email flow từ màn này.

## Lockout và Auth-Error States

Các state này có thể nằm trong notes của màn login, không nhất thiết cần một màn riêng.

Hành vi bắt buộc:

- Hiển thị thời lượng khóa khi backend trả về.
- Có retry path rõ ràng.
- Không cho biết email có tồn tại hay không nếu điều đó làm lộ account enumeration.
- Không hiển thị remediation chỉ dành cho admin hoặc action quản lý user.

Copy khuyến nghị:

- `Tài khoản bị khóa tạm thời. Vui lòng thử lại sau [thời lượng khóa].`
- `Nếu bạn vừa nhập sai mật khẩu nhiều lần, hãy chờ hết thời gian khóa rồi thử lại.`

## Ngoài phạm vi

Không đưa vào:

- Official Google Forms API.
- Google Forms OAuth scopes.
- Google Forms watches hoặc Pub/Sub.
- Background jobs.
- Payment.
- AI.
- Password recovery production email flow.
- Admin user management.

## Trạng thái Stitch artifact

Các màn auth này hiện đã có Stitch UI reference được chấp nhận:

- `login`: `docs/design/stitch/login/`
- `register`: `docs/design/stitch/register/`
- `auth-callback`: `docs/design/stitch/auth-callback/`
- `profile-security`: `docs/design/stitch/profile-security/`

Lockout và auth-error states nằm trong notes của login artifact, trừ khi task sau này duyệt một màn riêng.

Không xem các artifact này là production source code hoặc backend contract cuối.

## Gate trước khi implement

Trước khi implement các màn này:

1. Đọc `docs/vi/FRONTEND_STYLE_GUIDE.md`.
2. Đọc file này.
3. Đọc `docs/vi/API_CONTRACT_GUIDE.md` và docs backend contract liên quan theo task.
4. Xác nhận auth behavior nào đã được duyệt để implement.
5. Giữ Google OAuth, password recovery email, và session architecture là Deferred trừ khi task duyệt rõ.
