# EVENT_AND_WEBHOOK_CONTRACTS

## Mục đích

Kiểm soát thiết kế event và webhook.

## Trạng thái hiện tại

Eventing, queues và background job framework vẫn Deferred trừ khi được duyệt rõ.

Phase 8 chỉ duyệt PayOS payment webhook cho nạp credit tự động.

## Quy tắc đã chốt

- MVP top-up approval trước Phase 8 là manual.
- Phase 8 duyệt PayOS là payment provider đầu tiên cho nạp credit tự động.
- Phase 8 duyệt PayOS payment webhook để xử lý thanh toán đã xác minh.
- Background job processing là Deferred cho MVP.
- Future background processing có thể dùng ASP.NET Core `BackgroundService`, Hangfire, Quartz.NET hoặc queue worker, nhưng chưa option nào được duyệt.

## PayOS payment webhook

Endpoint đã duyệt:

- `POST /api/payments/payos/webhook`
- Frontend proxy cho local/tunnel: cùng path này trên Next.js app có thể chuyển tiếp PayOS webhook sang backend API để admin dùng một public frontend domain khi smoke test.

Provider:

- PayOS

Producer:

- Hệ thống thanh toán PayOS

Consumer:

- FormAuto Hub payment integration service
- Transport tùy chọn khi local/tunnel: FormAuto Hub Next.js proxy route, chỉ chuyển tiếp

Mục đích:

- xác nhận kết quả thanh toán PayOS cho top-up order
- chỉ cộng credit sau khi xử lý payment đã xác minh
- hỗ trợ xử lý idempotent khi PayOS gửi lại webhook

Payload baseline từ tài liệu PayOS chính thức:

- root fields gồm `code`, `desc`, `success`, `data`, và `signature`
- `data` gồm các giá trị như `orderCode`, `amount`, `description`, `reference`, `transactionDateTime`, `currency`, và `paymentLinkId`

Signature verification:

- bắt buộc trước khi thay đổi state
- dùng PayOS checksum key và HMAC-SHA256 verification
- signature không hợp lệ thì không được cộng credit
- frontend proxy không được tự xác minh payment như authority hoặc cộng credit; nó chỉ chuyển tiếp request sang backend API

Idempotency:

- dùng PayOS order code và/hoặc payment link id cùng provider name làm idempotency key
- webhook hợp lệ bị gửi lại cho payment đã xử lý không được cộng trùng credit
- webhook hợp lệ bị gửi lại có thể trả 2xx sau khi xử lý no-op an toàn

State changes được phép sau valid paid webhook:

- cập nhật payment metadata
- cập nhật `TopupOrder` tương ứng từ `Pending` sang `Approved`
- set paid/approved timestamps khi phù hợp
- gọi dedicated credit workflow
- ghi `CreditTransactions` ledger entry

Cấm:

- không cộng credit từ PayOS return URL
- không cộng credit bên trong frontend webhook proxy
- không cộng credit trước khi verify signature
- không cộng credit nếu amount hoặc order identity không khớp top-up order/payment record đã lưu
- không expose PayOS secrets trong log hoặc admin UI
- không implement refund automation từ webhook contract này

Cần review trước implementation:

- tên DTO class chính xác
- quy tắc lưu/redact raw payload chính xác
- mapping provider status chính xác
- error và retry response behavior chính xác

## Ghi chú Google Forms integration

- MVP có thể dùng URL analysis và controlled HTTP form submission cho simple public forms.
- Production direction nên ưu tiên official Google Forms API và OAuth khi user sở hữu hoặc được phép truy cập form.
- Google Forms API có quota/usage limits.
- Thiết kế production sau này phải tính rate limits, retry, job queue và validation honesty.

## Quy tắc event contract

Trước khi thêm event, phải định nghĩa:

- event name
- producer
- consumer
- payload
- idempotency behavior
- retry behavior
- failure handling
- audit/logging behavior

## Quy tắc webhook contract

Trước khi thêm webhook, phải định nghĩa:

- provider
- endpoint
- authentication/signature verification
- payload schema
- retry behavior
- idempotency key
- replay handling
- logging và audit behavior

## Cấm

- Không tự bịa payment webhooks.
- Không thêm payment provider webhook khác PayOS webhook Phase 8 đã duyệt.
- Không tự bịa Google OAuth callbacks.
- Không tạo assumption về AI provider webhook.
- Không gọi Deferred integrations là production-ready.
