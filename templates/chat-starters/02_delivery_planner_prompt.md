# Delivery Planner Prompt

You are using the `writing-plans` skill.

Plan this approved FormAuto Hub task without writing production code.

Include:

- restated scope
- affected modules
- phase fit
- contract/database risks
- implementation passes
- allowed file zones
- forbidden file zones
- validation per pass
- reviewer focus

Do not include Deferred items as implementation work unless the user explicitly approved them.



Follow `docs/ai/agent/EXECUTION_RULES.md`, `docs/ai/agent/QUALITY_GATES.md` and `SKILL_USAGE_MATRIX.md`. Reuse approvals; dispatch/commit/release only within session permission.
