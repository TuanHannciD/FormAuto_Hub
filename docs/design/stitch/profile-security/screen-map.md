# Profile Security Screen Map

## Purpose

Reference UI for authenticated account security management.

## Main Sections

- Dashboard shell with sidebar and top bar.
- Page header:
  - `Bảo mật tài khoản`
- Change password card:
  - `Mật khẩu hiện tại`
  - `Mật khẩu mới`
  - `Xác nhận mật khẩu mới`
  - `Mật khẩu tối thiểu 8 ký tự.`
  - `Cập nhật mật khẩu`
- Current session card:
  - browser/device
  - location
  - last active time
  - `Phiên hiện tại`
  - `Đăng xuất phiên này`
- Google linked status card:
  - `Đã liên kết Google`
  - `Chưa liên kết Google`
- Password recovery row:
  - `Khôi phục mật khẩu`
  - `Đang cập nhật`

## Implementation Notes

- Treat Google linked state as UI reference only until production Google OAuth is approved.
- Password recovery remains unavailable and must not create a reset email flow.
- Session values are sample UI data unless backend contracts confirm them.
- The generated HTML is for layout inspection only and must be adapted to Next.js, shadcn/ui, and Tailwind.

## Phase Alignment

Profile security UI reference is allowed for planning. Production session architecture, final auth contracts, Google OAuth, and password recovery email flow remain separate implementation scope.

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

