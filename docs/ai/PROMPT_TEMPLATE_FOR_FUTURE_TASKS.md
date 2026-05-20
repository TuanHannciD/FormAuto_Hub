# PROMPT_TEMPLATE_FOR_FUTURE_TASKS

## Purpose

Provide a reusable requirement intake template for future FormAuto Hub work.

## Required Template

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
[API/browser/auth/database/payment/tunnel smoke expectations, or Not applicable with reason]
```

## Agent Instructions

Before implementation:

- restate the requirement
- identify affected modules
- label assumptions
- label Deferred items
- check active phase
- check safety boundaries
- check API/database contract impact
- propose the smallest safe implementation path
- define applicable runtime smoke before closeout

Do not implement until scope, ownership, and contract safety are clear.

## Closeout Validation Gate

Use this before reporting done:

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
