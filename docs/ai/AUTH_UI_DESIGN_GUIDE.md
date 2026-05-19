# AUTH_UI_DESIGN_GUIDE

## Purpose

Define pre-implementation UI guidance for FormAuto Hub authentication screens.

This file controls UI copy, states, and screen coverage only. It does not approve production authentication architecture, Google OAuth implementation, JWT claim structure, password recovery email flow, or new backend contracts.

## Covered Screens

- `login`
- `register`
- `auth-callback`
- `profile-security`
- lockout and auth-error states

These screens should follow the approved frontend baseline:

- Next.js web dashboard
- shadcn/ui with Tailwind CSS
- lucide-react icons
- compact B2B SaaS operations style

## Global Auth UI Rules

- Auth screens must be clean, focused, and trust-oriented.
- Use a single primary action per form.
- Use clear inline validation near the affected field.
- Use alert components for account-level errors.
- Use loading states for submit buttons and callback pages.
- Do not show implementation details such as provider exception names, stack traces, scopes, tokens, or internal IDs.
- Do not imply that Google OAuth, password reset email, or production session management is complete unless a later implementation task explicitly approves it.

## Login

Required UI:

- Email input.
- Password input.
- Primary button: `Đăng nhập`.
- Secondary provider button: `Đăng nhập với Google`.
- Link to register page: `Tạo tài khoản`.
- Forgot-password link displayed as unavailable: `Quên mật khẩu - Đang cập nhật`.

Required states:

- Loading: disable actions and show submitting state after form submit.
- Wrong credentials: `Email hoặc mật khẩu không đúng.`
- Temporary lockout: `Tài khoản bị khóa tạm thời. Vui lòng thử lại sau [thời lượng khóa].`
- Provider unavailable: `Đăng nhập với Google hiện chưa khả dụng. Vui lòng thử lại sau.`

Lockout copy must show the lockout duration when backend provides it. If backend does not provide a duration, use a generic retry message and do not invent a number.

## Register

Required UI:

- Full name input.
- Email input.
- Password input.
- Primary button: `Tạo tài khoản`.
- Secondary provider button: `Tiếp tục với Google`.
- Link to login page: `Đã có tài khoản? Đăng nhập`.
- Password helper: `Mật khẩu tối thiểu 8 ký tự.`
- Starter credit copy: `Tài khoản mới nhận 5 credit khởi đầu.`

Assumption: The 5-credit starter copy is a requested UI/product message. Frontend implementation must verify the approved backend signup credit behavior before binding this copy to real account state.

Required states:

- Loading after submit.
- Email already exists.
- Invalid email.
- Password shorter than 8 characters.
- Provider unavailable for Google registration/login.

## Auth Callback

Required UI:

- Loading state after Google redirect.
- Success state before redirecting into dashboard.
- Error state with a safe action to return to login.

Required copy:

- Loading: `Đang xác thực tài khoản Google...`
- Success: `Đăng nhập thành công. Đang chuyển vào dashboard...`
- Google email not verified: `Email Google chưa được xác minh. Vui lòng xác minh email trước khi tiếp tục.`
- Account link failed: `Không thể liên kết tài khoản Google với tài khoản hiện tại.`
- Provider unavailable: `Nhà cung cấp đăng nhập hiện không khả dụng. Vui lòng thử lại sau.`

Deferred: This UI guide does not approve production Google OAuth callback behavior, token exchange, scopes, provider storage, or account-linking backend contracts.

## Profile Security

This screen may extend the existing profile/account settings reference.

Required UI:

- Change password form.
- Current session panel.
- Logout current session action.
- Google-linked account indicator.
- Password recovery row showing `Đang cập nhật`.

Change password fields:

- Current password.
- New password.
- Confirm new password.
- Password helper: `Mật khẩu tối thiểu 8 ký tự.`

Required states:

- Password changed successfully.
- Current password is incorrect.
- New password is too short.
- Confirm password does not match.
- Current session logout confirmation.
- Google account linked indicator.
- Google account not linked indicator.

Deferred: Do not create production password recovery email flow from this screen.

## Lockout And Auth-Error States

These states can live in the login screen notes instead of a separate screen.

Required behavior:

- Show the lockout duration when backend provides it.
- Provide a clear retry path.
- Do not tell the user whether an email exists when that would leak account enumeration details.
- Do not show admin-only remediation or user-management actions.

Recommended copy:

- `Tài khoản bị khóa tạm thời. Vui lòng thử lại sau [thời lượng khóa].`
- `Nếu bạn vừa nhập sai mật khẩu nhiều lần, hãy chờ hết thời gian khóa rồi thử lại.`

## Out Of Scope

Do not include:

- Official Google Forms API.
- Google Forms OAuth scopes.
- Google Forms watches or Pub/Sub.
- Background jobs.
- Payment.
- AI.
- Password recovery production email flow.
- Admin user management.

## Stitch Artifact Status

These auth screens now have accepted Stitch UI references:

- `login`: `docs/design/stitch/login/`
- `register`: `docs/design/stitch/register/`
- `auth-callback`: `docs/design/stitch/auth-callback/`
- `profile-security`: `docs/design/stitch/profile-security/`

Lockout and auth-error states are covered inside the login artifact notes unless a later task approves a separate screen.

Do not treat these artifacts as production source code or final backend contracts.

## Implementation Gate

Before implementing these screens:

1. Read `docs/ai/FRONTEND_STYLE_GUIDE.md`.
2. Read this file.
3. Read `docs/ai/API_CONTRACT_GUIDE.md` and task-specific backend contract docs.
4. Confirm which auth behavior is approved for implementation.
5. Keep Google OAuth, password recovery email, and session architecture Deferred unless explicitly approved by the task.
