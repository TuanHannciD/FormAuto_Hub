# UI_DESIGN_ARTIFACTS

## Mục đích

Ghi lại các UI design reference đã được generate cho FormAuto Hub.

File này giúp các task frontend sau này tìm đúng artifact Stitch đã được chấp nhận trước khi implement hoặc review UI.

Design artifact không phải production source code, API contract, database contract, lifecycle rule hoặc phê duyệt roadmap.

## Stitch project hiện tại

- Stitch project: `14663165630678165146`
- Design system: `Precision Operational System`
- Design system asset: `assets/809a13b0223c4381a9ea7ede2848bb3e`
- Language baseline: tiếng Việt cho app UI.
- Visual baseline: dashboard vận hành SaaS theo hướng shadcn/ui, layout thân thiện với Tailwind, icon theo phong cách lucide, UI B2B gọn và tập trung workflow.

## Các màn reference đã chấp nhận

| Khu vực | Stitch screen | Thư mục artifact local | Trạng thái |
|---|---|---|---|
| Hệ thống logo | `0a7924f70c20477b947be9d2aec41132` | `docs/design/stitch/logo/` | Reference đã chấp nhận |
| Landing page | `d3e788788e384090945b7542ab7aecf8` | `docs/design/stitch/landing-page/` | Reference đã chấp nhận |
| Dashboard overview | `e3b29c6ac6ea41a5979c98d174ac5c21` | `docs/design/stitch/dashboard-overview/` | Reference đã chấp nhận |
| Top-up request | `a15b597f9b6745199ac4b09a60f4083d` | `docs/design/stitch/top-up-request/` | Reference đã chấp nhận |
| Usage logs | `d336e4a9bd354d70b6961881aa106051` | `docs/design/stitch/usage-logs/` | Reference đã chấp nhận sau khi tinh chỉnh |
| Form automation workflow | `888a52f035074b7992aa86b87a0f8084` | `docs/design/stitch/form-automation-workflow/` | Reference đã chấp nhận |
| Credit transactions ledger | `8f55ef6bf6ba4941b6cc616c04c5104c` | `docs/design/stitch/credit-transactions/` | Reference đã chấp nhận |
| Profile/account settings | `6ecbf4df5fd945d78d94df8f7d23a153` | `docs/design/stitch/profile-settings/` | Reference đã chấp nhận |
| Top-up order detail | `e0811bb411004578ac20dc13f990e7ac` | `docs/design/stitch/top-up-order-detail/` | Reference đã chấp nhận |
| Login | `5235dbc4313a48098e4743be671a26a3` | `docs/design/stitch/login/` | Reference đã chấp nhận sau khi tinh chỉnh |
| Register | `29b9ee6f2389428aa1490f91aa9de4bf` | `docs/design/stitch/register/` | Reference đã chấp nhận sau khi tinh chỉnh |
| Auth callback | `e014f45ea68145cb9cfb5ab1821bc175` | `docs/design/stitch/auth-callback/` | Reference đã chấp nhận sau khi tinh chỉnh |
| Profile security | `5e5335a5b7c94b4094d850ec0c03636e` | `docs/design/stitch/profile-security/` | Reference đã chấp nhận |
| Admin shell và guard | `89e61445e68a4641892aa0e69390b13a` | `docs/design/stitch/admin-shell/` | Reference Phase 8 đã chấp nhận sau khi đồng bộ style |
| Admin dashboard | `20fba37f2d074d719e9993dd877ef3db` | `docs/design/stitch/admin-dashboard/` | Reference Phase 8 đã chấp nhận sau khi đồng bộ style |
| Admin top-up/payment management | `fa8dd85bfff8427b87da20bbf81ffc5f` | `docs/design/stitch/admin-topup-payment-management/` | Reference Phase 8 đã chấp nhận sau khi đồng bộ style lần cuối |
| Revenue report | `c6a382d9b211470aa88af8eea3a5beca` | `docs/design/stitch/revenue-report/` | Reference Phase 8 đã chấp nhận sau khi đồng bộ style |
| PayOS settings | `db5f29fe3de7425db428edc29931e139` | `docs/design/stitch/payos-settings/` | Reference Phase 8 đã chấp nhận sau khi đồng bộ style |
| User PayOS top-up flow | `830150eb380a44ba8c49ddb3f8337f73` | `docs/design/stitch/user-topup-payos-flow/` | Reference Phase 8 đã chấp nhận sau khi đồng bộ style lần cuối |
| Payment result / return | `12cc4ac68fae458999031cd0c184563b` | `docs/design/stitch/payment-result-return/` | Reference Phase 8 đã chấp nhận sau khi đồng bộ style lần cuối |

## Chuẩn thư mục artifact

Mỗi thư mục màn hình nên có:

- `README.md`
- `screen-map.md`
- `notes.md` khi có ghi chú review hoặc iteration
- `screenshots/<page-slug>-vi.png`
- `exports/<page-slug>-vi.html`

Dùng screenshot làm visual reference chính.

Dùng HTML export chỉ để kiểm tra layout. Không copy HTML generate trực tiếp vào production nếu chưa chuyển hóa theo stack Next.js, shadcn/ui và Tailwind đã duyệt.

## Quy tắc implement

Trước khi implement frontend page từ Stitch design:

1. Đọc `docs/vi/FRONTEND_STYLE_GUIDE.md`.
2. Đọc file này.
3. Đọc `README.md`, `screen-map.md`, và `notes.md` nếu có trong thư mục screen mục tiêu.
4. Kiểm tra API/DTO/domain docs hiện tại trước khi bind field UI vào backend data.
5. Xem sample rows, sample IDs, sample dates, labels, statuses và numbers là placeholder UI data, trừ khi backend contract đã xác nhận.
6. Giữ đúng scope phase hiện tại và safety rules.

## Các mục Deferred cần giữ ngoài UI

Không implement từ UI artifact trừ khi được duyệt riêng:

- payment provider ngoài PayOS
- frontend tự cộng credit
- production Google OAuth implementation
- official Google Forms API production flow
- AI answer generation ở mức production-complete
- AI auto-submit
- package management UI
- admin user management UI
- manual credit adjustment UI

## Độ phủ UI hiện tại

Các màn đã generate hiện hỗ trợ:

- reference hệ thống logo thương hiệu
- public landing reference
- authenticated dashboard overview
- manual top-up request
- usage log history và safety/audit review
- form automation workflow
- credit transactions ledger
- profile/account settings
- top-up order detail
- login và lockout/auth-error states
- register
- auth callback
- profile security
- admin shell và guard state cho Phase 8
- admin dashboard Phase 8
- admin top-up/payment management Phase 8
- revenue report Phase 8
- PayOS settings Phase 8
- user PayOS top-up flow Phase 8
- payment result / return page Phase 8

Các reference còn nên thiết kế tiếp:

- admin top-up approval/rejection chỉ khi scope phê duyệt thủ công được duyệt riêng

Manual admin approval/rejection vẫn là quyết định scope riêng vì Phase 8 PayOS top-up chỉ được cộng credit sau khi hệ thống xác minh thanh toán hợp lệ và ghi ledger.
