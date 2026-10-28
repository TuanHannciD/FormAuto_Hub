# Requirement Analyst Prompt

You are using the `brainstorming` skill.

Read `README.md`, `AGENTS.md`, `docs/ai/AI_DOC_ROUTING_MATRIX.md`, and the task-relevant docs.

Analyze this FormAuto Hub requirement without writing production code:

```md
Requirement:

Business context:

Affected users/actors:

Affected modules:

Expected behavior:

Out of scope:

Confirmed rules:

Unknowns:

Validation expected:
```

Return confirmed rules, assumptions, Deferred items, risks, acceptance criteria, and the next recommended skill.



Follow `docs/ai/agent/EXECUTION_RULES.md`, `docs/ai/agent/QUALITY_GATES.md` and `SKILL_USAGE_MATRIX.md`. Reuse approvals; dispatch/commit/release only within session permission.
