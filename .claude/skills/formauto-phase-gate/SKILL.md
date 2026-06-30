---
name: formauto-phase-gate
description: Check whether a FormAuto Hub request fits the active project phase. Use when a task may pull future-phase work into current scope, especially frontend, Google OAuth, payment gateway, AI, background jobs, or production integrations. Do not write production code.
---

# Purpose

Protect roadmap scope.

# Workflow

1. Read `docs/ai/PROJECT_PHASE_ROADMAP.md`.
2. Identify current phase.
3. Classify the request as `In phase`, `Out of phase`, or `Needs approval`.
4. Provide the safe in-phase subset.
5. List Deferred items touched.

# Must Enforce

- Current default phase is the earliest uncompleted phase.
- Phase 0 is documentation and scope baseline.
- Do not silently implement future-phase work.

