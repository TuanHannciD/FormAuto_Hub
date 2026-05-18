# PHASE_EXECUTION_RULES

## Mục đích

Ngăn phase creep và việc vô tình approve future work.

## Active Phase Rule

Default active phase là current phase trong `PROJECT_PHASE_ROADMAP.md`.

Current active phase: Phase 6 - Production integrations.

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
