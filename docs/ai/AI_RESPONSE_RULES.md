# AI_RESPONSE_RULES

## Purpose

Define how AI agents should respond in FormAuto Hub tasks.

## Default Style

- Be brief by default.
- Use detailed structure only when correctness requires it.
- State assumptions explicitly.
- State Deferred items explicitly.
- Do not hide skipped validation.
- Do not claim build, test, runtime, or docs sync validation unless performed.

## Required Final Format For Implementation Work

Final responses must include:

1. Summary
2. Files changed
3. Scope alignment
4. Validation performed
5. Validation not performed
6. Risks/Deferred items
7. Next recommended step

## Required Labels

Use these labels for validation:

- Verified
- Not run
- Blocked

## Conflict Reporting

If current code/docs conflict with the task prompt, report:

- conflicting file
- conflicting statement or behavior
- proposed safe path
- whether approval is needed

## Forbidden Response Behavior

- Do not present assumptions as confirmed decisions.
- Do not describe Deferred items as approved features.
- Do not omit abuse-prevention impact.
- Do not say docs are synced when only one language layer changed.
- Do not invent endpoints, fields, statuses, events, or lifecycle states.

