# PHASE_8_CLOSEOUT

## Mục đích

Đóng Phase 8 sau khi scope đã duyệt cho khu vực admin, báo cáo doanh thu và nạp credit tự động qua PayOS đã được implement và validate.

## Mục tiêu phase

Xây khu vực admin riêng cho quản lý vận hành/tài chính và bật luồng nạp credit tự động ưu tiên PayOS, không cộng credit trước khi PayOS được xác minh hợp lệ.

## Scope đã hoàn tất

- Khu vực admin riêng với shell và guard chỉ cho admin.
- Tổng quan admin cho doanh thu, credit đã bán, credit đã dùng, top-up đang chờ, top-up thành công, thanh toán lỗi và thanh toán PayOS gần đây.
- Lịch sử thanh toán admin cho PayOS payment records và trạng thái top-up order liên quan.
- Báo cáo doanh thu admin dùng dữ liệu thanh toán và credit đã xác minh.
- Trang cấu hình PayOS cho `ClientId`, `ApiKey`, `ChecksumKey`, `ReturnUrl`, `CancelUrl` và trạng thái bật/tắt.
- Trang cấu hình PayOS đã hiển thị hướng dẫn setup cho Return URL, Cancel URL và webhook URL cần cấu hình trong PayOS dashboard.
- Frontend PayOS webhook proxy tại `/api/payments/payos/webhook` chuyển tiếp payload webhook PayOS từ public domain frontend sang backend webhook endpoint.
- Follow-up quản lý gói credit cho admin để tạo và cập nhật package bằng các field đã duyệt: `Name`, `Credits`, `Price`, và `IsActive`.
- Cấu hình PayOS provider được lưu trong database qua `PaymentProviderSettings`.
- PayOS `ApiKey` và `ChecksumKey` được bảo vệ trước khi lưu và chỉ trả về UI ở dạng masked preview.
- Tạo payment link PayOS cho gói nạp credit.
- Endpoint webhook PayOS có xác minh chữ ký trước khi cộng credit.
- Xác minh chữ ký webhook PayOS dùng quy tắc HMAC SHA-256 theo tài liệu PayOS trên toàn bộ object `data` của webhook, sắp xếp theo key.
- Xử lý idempotent để webhook hợp lệ bị gửi lặp không cộng credit trùng.
- Tự động cộng credit qua credit service hiện có và ledger `CreditTransactions`.
- EF Core migration cho `PaymentProviderSettings` và `PaymentRecords`.
- UI Phase 8 ưu tiên tiếng Việt, chỉ giữ PayOS/API naming khi khó tránh.

## Khu vực backend đã implement

- Entity và service cho cấu hình payment provider.
- Entity payment record và hằng số trạng thái payment.
- PayOS payment link client.
- PayOS signature service.
- Payment workflow service cho tạo payment link và xử lý webhook.
- Service báo cáo thanh toán và doanh thu admin.
- API user tạo PayOS top-up.
- API webhook PayOS.
- API admin cho báo cáo và cấu hình PayOS.
- API admin list/create/update gói credit.
- Test cho tạo PayOS top-up, chữ ký sai, webhook paid hợp lệ cộng credit và webhook lặp không cộng trùng.
- Test cho admin tạo/cập nhật gói credit, validation và non-admin rejection.

## Khu vực frontend đã implement

- Admin shell và điều hướng admin.
- Trang tổng quan admin.
- Trang danh sách thanh toán admin.
- Trang báo cáo doanh thu admin.
- Trang cấu hình PayOS admin.
- Hướng dẫn setup PayOS trong UI admin với webhook URL có thể sao chép cho frontend proxy.
- Trang quản lý gói credit admin.
- Trang nạp credit user có tạo checkout link PayOS.
- Trang kết quả return/cancel PayOS.
- Nhãn trạng thái tiếng Việt cho payment và trạng thái cấu hình provider mới.
- Landing page đã cập nhật để không còn nói payment gateway là Deferred sau khi PayOS đã được duyệt.

## Validation

Verified:

- `dotnet build FormAutoHub.sln -c Release`
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build`
- `npm run build` trong `apps/web`
- `dotnet tool run dotnet-ef migrations script --idempotent --project src/FormAutoHub.Api/FormAutoHub.Api.csproj --startup-project src/FormAutoHub.Api/FormAutoHub.Api.csproj --configuration Release`
- `GET http://127.0.0.1:3000/admin/payos-settings`
- `POST https://punch-pirates-stamps-habits.trycloudflare.com/api/payments/payos/webhook` với payload test sai chữ ký; request đi tới backend qua frontend proxy và trả `{"applied":false,"status":"Chữ ký PayOS không hợp lệ."}`.
- Local authenticated API smoke cho `GET /api/admin/packages`.
- User xác nhận PayOS runtime smoke đã hoạt động sau khi cấu hình webhook URL qua frontend proxy path.

Not run:

- Apply migration lên shared/staging SQL Server thật, vì chưa có approval hoặc connection tới target database.
- Full automated browser end-to-end payment test bằng PayOS payment thật, vì live payment confirmation được user thực hiện thủ công.
- POST/PUT HTTP smoke cho admin tạo/cập nhật package trên shared dev database; automated tests đã cover service behavior.

Blocked:

- Không có blocker cho scope implementation và validation local đã duyệt.

## Scope alignment

Closeout này giữ đúng Phase 8:

- PayOS là payment provider duy nhất được implement.
- Chỉ cộng credit sau khi webhook PayOS đã được xác minh.
- Cộng credit vẫn đi qua credit service hiện có và ledger.
- Frontend webhook proxy chỉ chuyển tiếp payload PayOS; không tự xác minh payment như authority và không cộng credit.
- Admin package management chỉ giới hạn trong các field package đã duyệt và không hard-delete package.
- Không implement official Google Forms API, Google watches, AI mapping/generation, payment provider khác PayOS, subscription billing, refund automation, hard delete package, package discount/subscription metadata hoặc admin user management UI.

## Rủi ro còn lại

- Quick Cloudflare tunnel URL là tạm thời; production cần hosting ổn định và PayOS webhook URL ổn định.
- Kiểm tra cấu hình PayOS hiện chỉ kiểm tra đủ cấu hình local; chưa gọi PayOS `confirm-webhook`.
- Refund, cancellation reconciliation, subscription billing, hard delete package, package discount/subscription metadata và provider khác PayOS vẫn là Deferred.

## Quyết định closeout

Phase 8 local implementation và các follow-up PayOS/package đã duyệt đã hoàn tất trong scope đã duyệt.

Tại thời điểm closeout Phase 8, phase tiếp theo chưa được chọn. Phase 9 sau đó đã được duyệt là phase validation/debug; xem `PHASE_9_KICKOFF_PLAN.md`.
