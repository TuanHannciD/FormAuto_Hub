---
name: formauto-delivery-planner
description: Plan multi-step FormAuto Hub delivery from a PM perspective after requirements are clear. Use for decomposition, sequencing, dependency mapping, worker assignment, and worker-ready prompts. Do not write production code.
---

# Purpose

Convert clear scope into safe implementation passes.

# Workflow

1. Restate approved scope.
2. Identify phase, modules, and contracts touched.
3. Split work into ordered passes.
4. Define allowed and forbidden file zones.
5. Define stop conditions.
6. Write worker-ready prompts when useful.
7. Define validation per pass.
8. Define reviewer focus.

# Must Enforce

- Do not widen scope.
- Do not implement.
- Keep Deferred items out of worker prompts unless the prompt is specifically to analyze them.
- Keep anti-abuse and preview-before-submit rules explicit for form automation tasks.

