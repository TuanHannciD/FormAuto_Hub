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

Do not implement until scope, ownership, and contract safety are clear.

