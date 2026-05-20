# FormAuto Hub - Repository Instructions

This repository uses explicit role separation, strict scope control, and paired English/Vietnamese documentation.

## Required Startup Order

1. Read `README.md` first.
2. Read `docs/ai/AI_DOC_ROUTING_MATRIX.md` next.
3. Read all task-relevant docs before modifying code or documentation.
4. When creating or editing documentation, read existing `.md` files first.
5. If existing source code or docs conflict with the task prompt, report the conflict before changing files.

## Core Rules

- Do not redesign the system unless the task explicitly asks for redesign.
- Do not invent business rules, API contracts, database fields, statuses, events, lifecycle states, roadmap commitments, or architecture decisions.
- If a required detail is missing, write `Assumption:` explicitly.
- If a future item is not approved, write `Deferred:` explicitly.
- Implement the smallest correct change.
- Touch only files required for the task.
- Do not weaken abuse-prevention rules.
- Do not implement Deferred items as if approved.
- Keep `docs/ai` and `docs/vi` semantically synced.
- Preserve UTF-8 and Vietnamese diacritics.
- Report conflicts, skipped validation, and unverified claims honestly.

## Skill Routing Rules

- Use `formauto-requirement-analyst` for ambiguous or business-rule-heavy requests.
- Use `formauto-delivery-planner` when work must be decomposed, sequenced, or delegated.
- Use `formauto-ba-pm-planner-lite` for small, clear, low-dependency tasks.
- Use `formauto-system-requirement-interviewer` when workflow, actors, lifecycle, or data behavior must be discovered before architecture decisions.
- Use `formauto-db-architecture-planner` for SQL Server, EF Core entity, migration, transaction, indexing, and persistence strategy.
- Use `formauto-db-risk-reviewer` before treating high-impact database recommendations as safe.
- Use `formauto-module-router` when module or layer ownership is unclear.
- Use `formauto-phase-gate` when a request may exceed the current roadmap phase.
- Use `formauto-contract-guard` for API, DTO, entity, status, event, webhook, and contract-sensitive work.
- Use `formauto-bug-triage` for runtime bugs, startup failures, symptoms, logs, and unclear regressions before implementation.
- Use `formauto-http-behavior-tester` when a route or endpoint should be checked by safe HTTP requests.
- Use `formauto-controlled-doc-editor` for documentation writing or documentation edits.
- Use `formauto-stitch-ui-iterative-designer` when a task asks to generate UI with Stitch, self-review the result, iterate fixes, and save design artifacts under `docs/design`.
- Use `formauto-implementation-worker` only after scope, ownership, and contract safety are clear.
- Use `formauto-reviewer` after implementation.

## Role Discipline

- Analyst and planner skills do not write production code.
- Database planning skills do not finalize architecture decisions without explicit approval.
- Worker skills do not redefine scope.
- Reviewer skills do not replace missing analysis or planning.
- Documentation editing remains proposal-first unless edits are explicitly approved.
- Bug triage separates reproduced evidence from hypotheses.
- HTTP behavior testing must not send risky mutation requests without clear justification.

## Current Project Baseline

- Project: FormAuto Hub.
- Current phase: Phase 8 - Admin, revenue, and PayOS automated credit top-up.
- Backend: ASP.NET Core Web API .NET 9.
- API style: controller-based REST API preferred for MVP.
- Database: SQL Server.
- ORM: Entity Framework Core.
- Persistence discipline: EF Core migrations.
- Frontend framework: Next.js web dashboard.
- Authentication: JWT access tokens with refresh token/session storage.
- Google account login/register: identity-only.
- Payment gateway integration: PayOS automated credit top-up is approved for Phase 8; other payment providers remain Deferred.
- Official Google Forms API integration: Deferred.
- AI answer generation and AI mapping: Deferred.
- Phase 1 backend foundation exists under `src/FormAutoHub.Api`.
- Initial test project exists under `tests/FormAutoHub.Tests`.

## Product Safety Rules

The system must not support:

- spam
- abuse automation
- captcha bypass
- proxy rotation
- fake accounts
- unauthorized form submission
- bypassing Google restrictions
- AI auto-submit without preview and user confirmation

The MVP must require preview before submission and limit generated responses to 100 per action, with controlled submission in sequential batches of 10.

## Architecture Boundaries

- Controllers own HTTP request/response handling only.
- Services own business workflows and validation orchestration.
- EF Core `DbContext` owns persistence access.
- Entities represent persisted domain state.
- DTOs represent API contracts.
- Integration services own external calls.
- Controllers must not contain heavy business logic.
- Services must not return framework-specific HTTP results.
- Entities must not call external APIs.
- Google Forms integration must not be mixed into credit/account services.
- Credit deduction must go through a dedicated credit service.
- Credit changes must write a transaction ledger entry.
- Tool usage must write `UsageLogs`.
- Submission actions must write `SubmissionLogs`.
- Deferred integrations must not be stubbed as production-complete features.

## Documentation Workflow

- Documentation changes must be proposal-first unless the user explicitly approves edits.
- High-risk doc changes include database strategy, contract semantics, auth rules, payment workflow, Google integration behavior, safety rules, lifecycle rules, and phase commitments.
- Every `docs/ai/*.md` change must have a matching `docs/vi/*.md` change.
- If only one language layer is updated, mark the docs as out of sync and do not claim completion.
- Existing code and docs override new proposals when conflicts are discovered.

## Validation Honesty

Never claim validation was completed unless it was actually run.

Use these labels:

- Verified
- Not run
- Blocked

Final implementation responses must include:

- Summary
- Files changed
- Scope alignment
- Validation performed
- Validation not performed
- Risks/Deferred items
- Next recommended step
