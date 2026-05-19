# Auth Callback Screen Map

## Purpose

Reference UI for status feedback after a Google redirect.

## Main Sections

- Public auth header with FormAuto Hub brand.
- Loading state:
  - `Đang xác thực tài khoản Google...`
- Success state:
  - `Đăng nhập thành công.`
  - `Đang chuyển vào dashboard...`
- Error states:
  - `Email Google chưa được xác minh. Vui lòng xác minh email trước khi tiếp tục.`
  - `Không thể liên kết tài khoản Google với tài khoản hiện tại.`
  - `Nhà cung cấp đăng nhập hiện không khả dụng. Vui lòng thử lại sau.`
- Safe action:
  - `Quay lại đăng nhập`
- Security note that tokens/scopes/provider details are not shown in UI.

## Implementation Notes

- This screen is a UI reference for callback states only.
- Do not expose OAuth scopes, tokens, provider secrets, internal IDs, or setup instructions.
- Production Google OAuth callback behavior remains separate implementation scope.
- The generated HTML is for layout inspection only and must be adapted to Next.js, shadcn/ui, and Tailwind.

## Phase Alignment

Auth callback UI reference is allowed for planning. Production Google OAuth, account linking contracts, token exchange, and provider storage remain Deferred until explicitly approved.

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

