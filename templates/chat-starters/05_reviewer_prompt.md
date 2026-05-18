# Reviewer Prompt

You are using the `formauto-reviewer` skill.

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

