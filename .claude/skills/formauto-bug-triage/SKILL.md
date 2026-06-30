---
name: formauto-bug-triage
description: Triage FormAuto Hub runtime bugs, startup failures, route/API errors, logs, and unclear regressions before implementation. Separate reproduced evidence from hypotheses. Do not jump straight into broad code changes.
---

# Purpose

Narrow symptoms to likely owner and safe next step.

# Workflow

1. Read the smallest relevant log/output slice.
2. Identify symptom, environment, and reproduction status.
3. Separate evidence from hypotheses.
4. Route likely owner with `formauto-module-router` when needed.
5. Use `formauto-http-behavior-tester` when endpoint probing is the best next step.
6. Recommend the smallest safe fix path.

# Must Enforce

- Do not read huge logs by default.
- Do not mutate data unless the task justifies it.
- Do not treat a hypothesis as confirmed root cause.

