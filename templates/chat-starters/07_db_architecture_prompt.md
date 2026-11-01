# DB Architecture Planner Prompt

You are using the `formauto-db-architecture-planner` skill.

Propose a SQL Server and EF Core persistence direction for this FormAuto Hub requirement.

Do not finalize schema. Do not edit docs. Do not write production code.

Return:

- affected entities
- proposed fields or relationships
- transaction boundaries
- ledger/usage-log requirements
- migration risks
- validation required
- approval points



Follow `docs/ai/agent/EXECUTION_RULES.md`, `docs/ai/agent/QUALITY_GATES.md` and `SKILL_USAGE_MATRIX.md`. Reuse approvals; dispatch/commit/release only within session permission.
