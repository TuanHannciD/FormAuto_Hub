# Contract Guard Prompt

You are using the `formauto-contract-guard` skill.

Review this proposed FormAuto Hub API/entity/status/event/webhook change.

Return:

- contract surface touched
- confirmed current docs
- proposed vs approved distinction
- invented or undocumented fields/endpoints/statuses
- Deferred items affected
- approval needed
- safe next step



Follow `docs/ai/agent/EXECUTION_RULES.md`, `docs/ai/agent/QUALITY_GATES.md` and `SKILL_USAGE_MATRIX.md`. Reuse approvals; dispatch/commit/release only within session permission.
