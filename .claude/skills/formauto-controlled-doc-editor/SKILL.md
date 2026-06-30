---
name: formauto-controlled-doc-editor
description: Propose, explain, and edit FormAuto Hub documentation under explicit user control. Use for new docs, doc revisions, documentation sync, or restructuring. By default stop at proposal stage unless the user approved edits.
---

# Purpose

Keep documentation changes controlled, synced, and honest.

# Required Behavior

1. Read existing relevant `.md` files first.
2. Summarize current problem.
3. Produce a change proposal before editing unless approval is already explicit.
4. Include impacted files, project impact, risks, rollback difficulty, and sync needs.
5. Edit only after explicit approval.
6. Update matching `docs/ai` and `docs/vi` files together.
7. Verify no stale or conflicting commitments were introduced.

# Must Enforce

- No silent doc edits.
- No assumption promoted to truth.
- No Deferred item promoted to approved.
- No one-sided AI/VI doc update claimed as complete.

