---
name: formauto-implementation-worker
description: Implement a scoped FormAuto Hub task only after scope, module ownership, phase fit, and contract safety are clear. Make the smallest correct change and do not rescope the work.
---

# Purpose

Execute approved work without redefining requirements.

# Prerequisites

Before implementation, confirm:

- scope is locked
- owning module is known
- contract impact is reviewed
- Deferred items are not being implemented
- validation expectations are clear
- applicable runtime smoke is defined for runnable API, browser, auth, database, payment, webhook, or tunnel behavior

# Workflow

1. Read task docs and owning module docs.
2. Inspect the smallest relevant code/docs slice.
3. Make the smallest correct change.
4. Avoid unrelated refactors.
5. Run build and relevant automated tests.
6. Restart affected runtime processes when runnable code changed.
7. Run applicable runtime smoke with real HTTP/browser checks and correct auth role/session.
8. Check relevant terminal/server logs after smoke validation.
9. Report validation honestly.

# Must Enforce

- Do not invent fields, endpoints, statuses, or business rules.
- Do not weaken anti-abuse rules.
- Do not change frontend framework status.
- Do not implement Deferred integrations.
- Do not report runnable code as complete from build/test alone when runtime smoke applies.
