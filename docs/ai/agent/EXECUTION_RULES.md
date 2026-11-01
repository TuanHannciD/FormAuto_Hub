# Task execution, permissions and handoff

Superpowers supplies methods; this document owns project permissions, task context and continuity. Select only applicable skills from the [matrix](../../../SKILL_USAGE_MATRIX.md). [Quality gates](QUALITY_GATES.md) owns validation and Done.

## One working loop

1. Start/resume: read README → AGENTS → [authority](AUTHORITY_MAP.md) → existing task/handoff → [routing](../AI_DOC_ROUTING_MATRIX.md). Check workspace, prior approvals, dirty/untracked/ignored work and next action.
2. Prepare: establish outcome, scope, acceptance, phase/follow-up, affected modules/layers, contract/DB impact, safety, validation and allowed file zones. Reuse decisions; clarify only missing information that affects correctness or permission.
3. Plan and execute: use brainstorming/writing-plans when discovery/planning is needed, then executing-plans or authorized child work. Small, clear tasks can use a short plan. Planning/review roles do not silently become writers. Do the smallest correct change, without unrelated redesign/refactor.
4. Verify and review: run applicable checks, inspect evidence/logs, address findings and rerun affected checks. Separate reproduced evidence from hypotheses when debugging.
5. Handoff: report results, limits, remaining findings/resources and the exact next action. Integration/release is a separate event under actual permission.

## Authorization

Continue authorized implementation, test, repair and documentation work without asking again at every step. Prepare a concrete reviewable result before requesting a release decision. Ask only when a missing decision/right actually blocks correctness; keep working on independent authorized parts.

- Documentation remains proposal-first unless edits are already approved. This migration was explicitly approved; it does not approve new product behavior.
- Do not invent business rules, fields, endpoints, statuses, events, lifecycle, auth/Google/payment/AI/refund behavior or architecture. Do not activate Deferred work, exceed approved phase/follow-up, weaken safety, or silently finalize proposed contracts/schema. Obtain the missing decision first.
- Local edits/checks follow task scope. Installing dependencies/skills/MCP, modifying global settings, provider cost, remote systems, recurring schedules, committing, pushing, merging, deploying and destructive cleanup require coverage by actual user/session authorization; tool access alone is not permission.
- Push to main may trigger the checked-in CI/release/deploy workflow. Check this consequence and environment gates before any authorized remote action. Documentation-only changes do not themselves authorize deployment.
- Agent dispatch is subject to current session permissions. Catalog presence does not authorize it. Discover current provider/model/schema; do not hardcode old catalogs. For T3 delegation retain each task ID, use status/cancel on that task, and create a new delegated task for each review round. A backing child thread is not a new review round.
- Isolate concurrent writers by checkout and resources. A new worktree does not contain the parent's uncommitted work. Verify the intended snapshot before assigning it. Do not force a dirty workspace into a worktree or automatically commit user changes.
- Preserve dirty/untracked/ignored files, evidence, user tabs and unrelated processes. No reset/clean/overwrite or recursive cleanup without proven ownership and checked absolute targets.
- No secrets, raw tokens/cookies, passwords, payment keys, provider keys or personal payloads in Git, reports or terminal output. Production diagnostics remain read-only under the server specialist; configuration recovery uses its explicitly authorized narrow reference.

## Durable task context

For substantial work, keep a short dossier at `docs/ai/tasks/<task-id>/` with the paired `docs/vi/tasks/<task-id>/`. Use an INDEX containing scope/approval, plan, decisions, checks and next action; split files only when useful. A small task may use the [task brief](../../../templates/TASK_BRIEF.md) and [handoff](../../../templates/HANDOFF.md) without a new dossier.

Before writing, record base SHA or honest snapshot limit, owner/writer/reviewer route, allowed zones, preserved work and acceptance. Record process/port/DB/browser/report ownership before acquisition; confirm actual identity separately. Do not stop a process based on port/PID alone or reset an existing DB to make tests pass.

Evidence belongs to the task/run, not disposable skill scratch. Keep necessary reports outside cleanup targets. Release only owned resources and verify release; do not delete evidence merely because ignored. Checkpoint resume does not prove automatic restart/crash recovery or scheduling.

## Documentation and source

Read existing relevant Markdown before editing. Update AI/VI together, preserving scope/Deferred labels and UTF-8. Keep new/actively edited docs below 400 lines; split independent subjects or use a detailed TOC for tightly coupled content. Existing oversized files do not trigger repo-wide retrofit. Prefer stable headings/symbols over handwritten line addresses; [source rules](../SOURCE_STRUCTURE_AND_NAMING_RULES.md) owns code navigation.

## Closeout and resume

Final implementation reports include Summary, Files changed, Scope alignment, Validation performed, Validation not performed, Risks/Deferred items and Next recommended step. Use clear Vietnamese for the user, concise by default; include conflict evidence and approval need when relevant. Findings come first in review output.

Use [HANDOFF](../../../templates/HANDOFF.md) for a new context: approvals, workspace/base/tip or snapshot, completed/remaining work, exact commands/results/artifacts, review scope, resources and next action. Resume from that action; do not restart completed analysis or infer permission from a historical plan.
