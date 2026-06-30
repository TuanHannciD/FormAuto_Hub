---
name: formauto-requirement-analyst
description: Analyze ambiguous or business-rule-heavy FormAuto Hub requirements before planning or implementation. Use when acceptance criteria, actors, scope, anti-abuse rules, credit behavior, form automation behavior, or Deferred decisions are unclear. Do not write production code.
---

# Purpose

Turn a raw request into a clear requirement package without inventing project truth.

# Required Reads

Read:

- `README.md`
- `AGENTS.md`
- `docs/ai/AI_DOC_ROUTING_MATRIX.md`
- task-relevant docs from `docs/ai`

# Workflow

1. Restate the request.
2. Identify actors and affected modules.
3. Separate confirmed rules, assumptions, unknowns, and `Deferred:` items.
4. Check anti-abuse boundaries.
5. Check phase fit.
6. List acceptance criteria.
7. State what must not change.
8. Recommend the next skill or step.

# Must Enforce

- Do not invent business rules.
- Do not finalize proposed API/entity/status contracts.
- Do not approve Deferred items.
- Do not write implementation.

