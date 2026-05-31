# PHASE_EXECUTION_RULES

## Mục đích

Ngăn phase creep và việc vô tình approve future work.

## Active Phase Rule

Default active phase là current global phase trong `PROJECT_PHASE_ROADMAP.md`.

Current global active phase: chưa chọn phase mới sau closeout Phase 9.

Active approved follow-up slice: không có. Phase 6 AI mapping/generation scoped implementation đã hoàn thành.

Cho đến khi global phase hoặc follow-up tiếp theo được duyệt, chỉ được làm follow-up đã được approve rõ. Slice Phase 6 AI đã hoàn thành không được tự biến thành full Phase 6 production integration.

Trạng thái closeout Phase 9:

- Scope validation/debug của Phase 9 đã hoàn tất.
- Phase 9 không duyệt automatic fixes sau closeout.
- Bất kỳ Phase 10, production-hardening, implementation hoặc fix follow-up nào cũng cần approval rõ.

## Việc trong phase

Chưa chọn global active phase mới.

Hiện không có implementation lane nào đang được approve.

Việc an toàn sau closeout Phase 9 chỉ gồm:

- đọc docs và reports
- trả lời câu hỏi trạng thái
- đề xuất scope phase tiếp theo hoặc follow-up
- cập nhật tài liệu khi được user approve rõ
- implementation/fix work chỉ sau khi được approve rõ
- validation hoặc fix follow-up cho slice Phase 6 AI đã hoàn thành chỉ khi được approve rõ và giữ trong boundary API/database/provider/audit/safety đã review

PayOS vẫn là payment provider duy nhất được duyệt. Captcha bypass, proxy rotation, fake-account behavior, unauthorized submission, spam tooling, và AI auto-submit khi thiếu preview/confirmation vẫn bị cấm.

## Deferred items

Các mục sau phải giữ `Deferred:` cho đến khi được duyệt:

- authentication implementation details
- JWT claim structure
- Google OAuth
- official Google Forms API
- payment provider khác PayOS
- background job framework
- AI answer generation ngoài Phase 6 AI scoped follow-up slice đã duyệt
- AI mapping ngoài Phase 6 AI scoped follow-up slice đã duyệt
- refund behavior sau failed submission
- exact credit pricing
- exact credit cost per action
- admin user management UI
- package management behavior ngoài follow-up tạo/cập nhật/active-state gói credit đã duyệt
- email notifications
- webhooks
- deployment platform
- automated refund behavior
- subscription billing
- tự động fix bug sau closeout Phase 9 nếu chưa được duyệt riêng

Hướng dẫn candidate tương lai:

- Google OAuth, official Google Forms API, Google Forms watches/Cloud Pub/Sub notification handling, background jobs, payment provider khác PayOS, refund và subscription billing vẫn giữ `Deferred:` cho đến khi một task duyệt rõ production scope.
- AI mapping/generation có Phase 6 scoped follow-up slice đã duyệt. Implementation vẫn phải nằm trong boundary API, database, provider, audit, safety, và validation đã duyệt.
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
