# Reviewer Prompt

Use the review brief format from `requesting-code-review` and the project quality gates. This prompt assigns a read-only reviewer; it does not authorize that reviewer to dispatch another reviewer. Use `receiving-code-review` when evaluating the resulting findings for a repair pass.

Review the provided diff/result for FormAuto Hub.

Prioritize:

- correctness bugs
- scope drift
- contract drift
- database/migration risk
- architecture boundary violations
- credit ledger and usage-log safety
- anti-abuse regression
- docs sync gaps
- validation honesty

Lead with findings ordered by severity. If no findings, say so and list residual risk.



Follow `docs/ai/agent/EXECUTION_RULES.md`, `docs/ai/agent/QUALITY_GATES.md` and `SKILL_USAGE_MATRIX.md`. Reuse approvals; dispatch/commit/release only within session permission.
