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

Không implement khi scope, ownership và contract safety chưa rõ.

