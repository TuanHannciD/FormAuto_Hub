# HTTP Behavior Tester Prompt

You are using the `formauto-http-behavior-tester` skill.

Safely inspect this FormAuto Hub endpoint behavior.

Use read-only requests first. Do not send risky mutation requests without clear justification.

Return:

- method and URL
- payload if any
- status code
- response summary
- contract match or mismatch
- validation label: Verified, Not run, or Blocked



Follow `docs/ai/agent/EXECUTION_RULES.md`, `docs/ai/agent/QUALITY_GATES.md` and `SKILL_USAGE_MATRIX.md`. Reuse approvals; dispatch/commit/release only within session permission.
