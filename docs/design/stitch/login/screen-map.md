# Login Screen Map

## Purpose

Reference UI for email/password login, Google sign-in entry, login errors, temporary lockout copy, register link, and unavailable password recovery link.

## Main Sections

- Public auth header with FormAuto Hub brand.
- Left trust panel with controlled workflow positioning.
- Login form with email and password inputs.
- Primary action: `Đăng nhập`.
- Secondary provider action: `Đăng nhập với Google`.
- Links: `Tạo tài khoản`, `Quên mật khẩu - Đang cập nhật`.
- Error examples:
  - `Email hoặc mật khẩu không đúng.`
  - temporary lockout message with retry timing.

## Implementation Notes

- Treat Google sign-in as UI reference only until production auth scope is approved.
- Bind lockout duration to backend response when available; do not invent the duration in production.
- Password recovery must remain visibly unavailable as `Đang cập nhật`.
- The generated HTML is for layout inspection only and must be adapted to Next.js, shadcn/ui, and Tailwind.

## Phase Alignment

Auth UI reference is allowed for planning. Production Google OAuth, session architecture, and final auth contracts remain separate implementation scope.

## Deferred Items To Avoid

- production Google OAuth implementation
- Google Forms OAuth scopes
- official Google Forms API
- Google Forms watches/PubSub
- background jobs
- payment
- AI
- password recovery production email flow
- admin user management

