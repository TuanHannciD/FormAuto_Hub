# PHASE_EXECUTION_RULES

## Mục đích

Ngăn phase creep và việc vô tình approve future work.

## Active Phase Rule

Default active phase là current phase trong `PROJECT_PHASE_ROADMAP.md`.

Current active phase: Phase 8 - Admin, revenue, and PayOS automated credit top-up.

## Việc trong phase

Phase 8 chỉ cho phép scope admin, doanh thu và nạp credit tự động qua PayOS đã được duyệt:

- khu vực admin riêng
- báo cáo doanh thu và credit cho admin
- tạo payment link PayOS cho top-up orders
- xử lý PayOS callback/webhook
- xác minh tính hợp lệ của PayOS trước khi cộng credit
- tự động cộng credit sau khi PayOS xác nhận thanh toán hợp lệ
- cộng credit idempotent để tránh cộng trùng
- lịch sử thanh toán và credit transaction cho admin review
- documentation sync tập trung cho Phase 8 changes

Phase 8 không tự động approve toàn bộ payment hoặc production integrations. PayOS là payment provider duy nhất được duyệt trong phase này. Mỗi API contract, database field, status, lifecycle rule, webhook verification rule và validation plan vẫn cần review trước khi implement. Captcha bypass, proxy rotation, fake-account behavior, unauthorized submission, spam tooling, và AI auto-submit khi thiếu preview/confirmation vẫn bị cấm.

## Deferred items

Các mục sau phải giữ `Deferred:` cho đến khi được duyệt:

- authentication implementation details
- JWT claim structure
- Google OAuth
- official Google Forms API
- payment provider khác PayOS
- background job framework
- AI answer generation
- AI mapping
- refund behavior sau failed submission
- exact credit pricing
- exact credit cost per action
- admin user management UI
- package management UI
- email notifications
- webhooks
- deployment platform
- automated refund behavior
- subscription billing

Hướng dẫn candidate tương lai:

- Google OAuth, official Google Forms API, Google Forms watches/Cloud Pub/Sub notification handling, background jobs, payment provider khác PayOS, refund và subscription billing vẫn giữ `Deferred:` cho đến khi một task duyệt rõ production scope.
- Approval phải bao gồm integration target, API contracts, database fields, statuses, lifecycle states, token storage model, notification ingestion model, lựa chọn background job framework và validation plan khi áp dụng.
- Nếu scope tương lai đã duyệt cần UI nhưng UI docs hiện có bị thiếu hoặc chưa đủ, phải hỏi lại hướng UI hoặc sync UI docs trước khi implement UI.

## Quy tắc credit Phase 3

- Credit chỉ bị trừ khi preview generation thành công.
- Cost là 1 credit cho mỗi preview response generate thành công.
- Form analysis không trừ credit.
- Submission không trừ thêm credit.
- Preview generation failed không trừ credit.
- Mọi credit deduction phải đi qua `CreditManagement` và ghi `CreditTransactions`.

## Phase fit response

Khi task có thể vượt phase, trả lời với:

- In phase
- Out of phase
- Safe subset
- Approval needed
