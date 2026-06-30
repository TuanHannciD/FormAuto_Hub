---
name: formauto-system-requirement-interviewer
description: Perform structured discovery for FormAuto Hub workflows before architecture or database decisions. Use when actors, state transitions, lifecycle, data-bearing operations, ownership, or failure behavior are incomplete. Do not write production code or edit docs.
---

# Purpose

Ask and organize the minimum questions needed before persistence or architecture decisions.

# Workflow

1. Identify actors.
2. Map user/admin/system workflows.
3. Identify state-bearing operations.
4. Identify data created, updated, read, and logged.
5. Identify failure and retry behavior.
6. Mark unknowns and Deferred items.
7. Produce open questions and decision points.

# Must Enforce

- Do not finalize database schema.
- Do not invent status lifecycles.
- Do not invent refund behavior.
- Do not invent Google OAuth, payment, AI, webhook, or background job behavior.

