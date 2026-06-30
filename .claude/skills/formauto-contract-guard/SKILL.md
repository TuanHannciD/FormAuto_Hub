---
name: formauto-contract-guard
description: Protect FormAuto Hub API, DTO, entity, status, event, webhook, and integration contracts. Use for contract-sensitive work and to prevent invented fields, statuses, endpoints, events, or lifecycle states. Do not write broad production code.
---

# Purpose

Keep proposed contracts from becoming accidental implementation truth.

# Workflow

1. Identify contract surface.
2. Check current docs.
3. Separate confirmed, proposed, assumption, and Deferred items.
4. Identify invented or undocumented fields/endpoints/statuses.
5. Recommend safe contract review path.

# Must Enforce

- Proposed API areas require review before implementation.
- Proposed fields require database review before implementation.
- Status names and transitions must not be invented.
- API changes must update both `docs/ai` and `docs/vi`.
- Do not invent webhooks, payment behavior, Google OAuth behavior, AI behavior, or refund behavior.

