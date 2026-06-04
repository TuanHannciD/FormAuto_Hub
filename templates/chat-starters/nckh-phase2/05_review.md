# NCKH Phase 2 Review

Use the `formauto-reviewer` skill. Add `formauto-contract-guard` if contract drift is suspected.

Task:

Review the NCKH Phase 2 result or diff.

Prioritize findings on:

- single-active-model enforcement correctness
- scope drift beyond backend-only Phase 2
- mapping endpoint separation
- illegal `Archived` or Phase 3+ behavior
- delete behavior and FK risk to non-owned tables
- migration reversibility
- docs sync gaps
- validation honesty

Lead with findings ordered by severity. If no findings, say so and list residual risks.
