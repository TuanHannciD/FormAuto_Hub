# Register Screen Map

## Purpose

Reference UI for account registration with full name, email, password, Google register/login entry, starter credit copy, and validation examples.

## Main Sections

- Public auth header with FormAuto Hub brand.
- Left trust panel with controlled workflow positioning.
- Register form with:
  - `Họ và tên`
  - `Email`
  - `Mật khẩu`
  - `Mật khẩu tối thiểu 8 ký tự.`
- Primary action: `Tạo tài khoản`.
- Secondary provider action: `Tiếp tục với Google`.
- Starter credit callout: `Tài khoản mới nhận 5 credit khởi đầu.`
- Validation examples:
  - `Email đã được sử dụng.`
  - `Mật khẩu cần tối thiểu 8 ký tự.`

## Implementation Notes

- Confirm backend signup credit behavior before treating the 5-credit copy as real account state.
- Treat Google register/login as UI reference only until production auth scope is approved.
- The generated HTML is for layout inspection only and must be adapted to Next.js, shadcn/ui, and Tailwind.

## Phase Alignment

Auth UI reference is allowed for planning. Production Google OAuth and final signup contracts remain separate implementation scope.

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

