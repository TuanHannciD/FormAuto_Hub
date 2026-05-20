# PROMPT_TEMPLATE_FOR_FUTURE_TASKS

## Mục đích

Cung cấp template tiếp nhận requirement cho các task FormAuto Hub sau này.

## Template bắt buộc

```md
Requirement:
[What needs to change]

Business context:
[Why this is needed]

Affected users/actors:
[Who uses it]

Affected modules:
[Known modules or unknown]

Expected behavior:
[Desired behavior]

Out of scope:
[What must not change]

Confirmed rules:
[Approved rules]

Unknowns:
[Open questions]

Validation expected:
[Build/test/runtime/docs review expectations]

Runtime smoke expected:
[Kỳ vọng API/browser/auth/database/payment/tunnel smoke, hoặc Not applicable kèm lý do]
```

## Hướng dẫn cho agent

Trước khi implement:

- nhắc lại requirement
- xác định affected modules
- label assumptions
- label Deferred items
- kiểm tra active phase
- kiểm tra safety boundaries
- kiểm tra API/database contract impact
- đề xuất đường implement nhỏ nhất an toàn
- xác định runtime smoke áp dụng trước closeout

Không implement khi scope, ownership và contract safety chưa rõ.

## Closeout validation gate

Dùng trước khi báo done:

```md
Validation gate before closeout:
- Build:
- Unit/integration tests:
- Migration validation:
- API smoke:
- Browser smoke:
- Auth/role smoke:
- Public/tunnel smoke:
- Logs checked:
- Remaining Not run:
- Blocked:
```
