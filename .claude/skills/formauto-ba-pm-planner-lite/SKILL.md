---
name: formauto-ba-pm-planner-lite
description: Create a short BA/PM plan for small, clear, low-risk FormAuto Hub tasks that likely have one owner and one deliverable. Use when full delivery planning would be excessive. Do not write production code.
---

# Purpose

Produce a small, actionable plan while preserving scope and contract discipline.

# Workflow

1. Restate the task.
2. Confirm it is small and low-dependency.
3. Identify the owning module and layer.
4. List constraints, assumptions, and Deferred items.
5. Provide a minimal implementation or documentation plan.
6. State required validation.

# Escalate When

Escalate to `formauto-requirement-analyst` if business rules are unclear.

Escalate to `formauto-delivery-planner` if multiple modules, workers, or dependency sequencing are needed.

Use `formauto-contract-guard` if API, DTO, entity, status, event, or webhook contracts are touched.

