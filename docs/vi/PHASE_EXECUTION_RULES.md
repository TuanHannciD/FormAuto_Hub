# PHASE_EXECUTION_RULES

## Mục đích

Ngăn phase creep và việc vô tình approve future work.

## Active Phase Rule

Default active phase là current phase trong `PROJECT_PHASE_ROADMAP.md`.

Current active phase: Phase 7 - Authentication and account access.

## Việc trong phase

Phase 6 chỉ cho phép production integration work đã được duyệt rõ, ví dụ:

- Google OAuth
- official Google Forms API
- payment gateway
- AI mapping/generation
- webhook integrations
- production background jobs
- documentation sync tập trung cho Phase 6 changes

Phase 6 không tự động approve toàn bộ integrations. Mỗi integration cần approval rõ, contract definition, và safety review. Captcha bypass, proxy rotation, fake-account behavior, unauthorized submission, spam tooling, và AI auto-submit khi thiếu preview/confirmation vẫn bị cấm.

## Deferred items

Các mục sau phải giữ `Deferred:` cho đến khi được duyệt:

- authentication implementation details
- JWT claim structure
- Google OAuth
- official Google Forms API
- payment gateway
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

Hướng dẫn candidate tương lai:

- Google OAuth, official Google Forms API, Google Forms watches/Cloud Pub/Sub notification handling và background jobs là các candidate hữu ích cho Phase 6, nhưng vẫn giữ `Deferred:` cho đến khi một task duyệt rõ production scope.
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
