# Bug Triage Prompt

You are using the `systematic-debugging` skill.

Triage this FormAuto Hub runtime symptom.

Read the smallest relevant log/output slice first.

Return:

- symptom
- reproduced evidence
- hypotheses
- likely module/layer owner
- contract or data risk
- next safe step
- validation status



Follow `docs/ai/agent/EXECUTION_RULES.md`, `docs/ai/agent/QUALITY_GATES.md` and `SKILL_USAGE_MATRIX.md`. Reuse approvals; dispatch/commit/release only within session permission.
