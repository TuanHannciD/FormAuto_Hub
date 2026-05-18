# EVENT_AND_WEBHOOK_CONTRACTS

## Mục đích

Kiểm soát thiết kế event và webhook.

## Trạng thái hiện tại

Eventing, webhooks, queues và background job framework là Deferred cho MVP trừ khi được duyệt rõ.

## Quy tắc đã chốt

- MVP top-up approval là manual.
- Payment gateway integration là Deferred.
- Webhook integration là Deferred.
- Background job processing là Deferred cho MVP.
- Future background processing có thể dùng ASP.NET Core `BackgroundService`, Hangfire, Quartz.NET hoặc queue worker, nhưng chưa option nào được duyệt.

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
- Không tự bịa Google OAuth callbacks.
- Không tạo assumption về AI provider webhook.
- Không gọi Deferred integrations là production-ready.

