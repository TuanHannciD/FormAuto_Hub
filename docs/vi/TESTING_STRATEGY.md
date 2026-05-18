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

### Integration tests

Dùng integration tests cho:

- controller endpoints
- EF Core persistence
- transaction behavior
- credit ledger writes
- usage log writes
- admin top-up approval workflow

### Migration validation

Database changes phải validate:

- migration generation
- apply migration trên clean database
- apply migration trên existing test database khi phù hợp
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
