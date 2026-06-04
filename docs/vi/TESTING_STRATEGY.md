# TESTING_STRATEGY

## Mục đích

Định nghĩa kỳ vọng validation theo loại thay đổi.

## Nhóm validation

### Build validation

Chạy build validation cho implementation changes khi đã có code.

Baseline tương lai:

- backend build
- test project build
- migration compile/design-time validation

### Unit tests

Dùng unit tests cho:

- business rules trong services
- answer generation modes
- credit deduction calculations
- top-up approval/rejection logic
- validation helpers
- AI prompt guard rules
- AI output validator rules
- AI credit multiplier calculations
- validation field bắt buộc của AI provider settings
- validation Base URL của AI provider

### Integration tests

Dùng integration tests cho:

- controller endpoints
- EF Core persistence
- transaction behavior
- credit ledger writes
- usage log writes
- admin top-up approval workflow
- AI provider settings persistence và masked response behavior
- AI prompt profile persistence
- AI generation audit persistence

### Runtime smoke tests

Code chạy thật phải có runtime smoke khi hành vi được expose qua process đang chạy.

Dùng runtime smoke cho:

- API route changes
- browser route hoặc dashboard changes
- auth/session/role guard changes
- hành vi phụ thuộc database sau migrations
- payment link, callback hoặc webhook behavior
- AI provider settings check và AI generation routes
- public/tunnel URL behavior

Runtime smoke phải verify:

- server process bị ảnh hưởng đã restart sau khi đổi code
- target route trả HTTP status và response marker đúng kỳ vọng
- authenticated routes được kiểm tra bằng đúng user role/session
- browser routes hydrate và load đủ JavaScript/CSS chunks cần thiết
- server logs không có exception mới cho smoke path

Build/test mà thiếu runtime smoke là chưa đủ để closeout khi runtime smoke áp dụng.

### Migration validation

Database changes phải validate:

- migration generation
- apply migration trên clean database
- apply migration trên existing test database khi phù hợp
- runtime database có table/column cần thiết trước các smoke test phụ thuộc chúng
- rollback hoặc recovery notes khi rollback khó

### Credit ledger tests

Verify:

- approved top-up tăng balance
- credit transaction được ghi
- tool usage trừ credits
- balance after transaction đúng
- failed submission refund behavior vẫn Deferred nếu chưa duyệt

### Usage log tests

Verify:

- form analysis log usage khi cần
- response generation log usage
- submission action log usage
- failed actions log status trung thực

### AI generation tests

Verify:

- admin AI provider settings không bao giờ trả raw API keys
- provider rỗng hoặc default model rỗng bị reject trước khi enable generation
- Base URL của AI provider sai format bị reject trước khi lưu
- OpenAI-compatible adapter không expose raw API key trong raw request audit đã lưu
- prompt auto-fill không trừ credit
- unsafe prompts bị reject trước provider calls
- invalid AI output schema bị reject
- choice-style answers ngoài stored options bị reject
- AI generation failed ghi audit state và trừ 0 credit
- partial AI generation chỉ lưu và tính credit cho preview hợp lệ
- Option 2 dùng multiplier 2
- Option 3 dùng multiplier 3
- AI generation ghi `GeneratedResponses`, `CreditTransactions`, `UsageLogs`, `AiGenerationRuns`, và `AiGenerationRunItems` khi áp dụng
- AI-generated `GeneratedResponses` vẫn read-only
- runtime AI adapter mặc định fail an toàn khi chưa có live adapter được duyệt
- deterministic AI adapter smoke chỉ chạy khi bật rõ bằng cấu hình local/test
- OpenAI-compatible adapter smoke chỉ chạy khi bật rõ bằng runtime configuration và có credential provider thật

### Submission validation tests

Verify:

- preview là bắt buộc trước submission
- confirmation là bắt buộc trước khi gửi
- số preview response giới hạn 1 đến 100 mỗi action
- submission job giới hạn 100 confirmed previews và batch tuần tự 10
- pause/cancel dừng tại batch boundary
- supported answer modes sinh preview payload hợp lệ
- unsupported question types fail an toàn
- submission logs được ghi

### Anti-abuse tests

Verify hệ thống reject hoặc không implement:

- captcha bypass
- proxy rotation
- fake accounts
- unauthorized form submission
- spam-scale batch sizes
- AI auto-submit
- prompt instruction cố ép câu trả lời nằm ngoài stored options

### Documentation sync review

Mọi docs change phải verify:

- matching `docs/ai` và `docs/vi` file tồn tại
- hard rules có ở cả hai bên
- Deferred items không bị promote ở bất kỳ layer nào
- không còn project name hoặc tech stack conflict cũ

## Format báo validation

Dùng:

- Verified
- Not run
- Blocked
