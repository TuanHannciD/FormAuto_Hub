# PROJECT_EXECUTION_RULES

## Purpose

Define non-negotiable execution discipline for FormAuto Hub.

## Current State

- Current phase: Phase 6 - Production integrations.
- Phase 1 backend foundation exists under `src/FormAutoHub.Api`.
- Initial test project exists under `tests/FormAutoHub.Tests`.
- Backend stack is confirmed: ASP.NET Core Web API .NET 9, SQL Server, EF Core.
- Frontend framework is Next.js web dashboard.

## Non-Negotiable Rules

- Do not invent business rules, API contracts, fields, statuses, events, lifecycle states, or architecture decisions.
- Mark missing details as `Assumption:`.
- Mark unapproved future work as `Deferred:`.
- Keep changes inside the active phase.
- Use the smallest correct change.
- Preserve abuse-prevention language.
- Preserve validation honesty.
- Keep `docs/ai` and `docs/vi` semantically synced.
- Do not implement code while doing documentation-only work.
- Do not add business workflows during Phase 1 foundation work unless explicitly approved.

## Safety Rules

FormAuto Hub must not support spam, captcha bypass, proxy rotation, fake accounts, unauthorized form submission, or bypassing Google restrictions.

Every submission flow must require:

- authorized user context
- preview before submission
- user confirmation before sending
- MVP preview generation limit of 1 to 100 generated responses per action
- controlled submission batch size of 10 responses, processed sequentially
- usage logging
- credit transaction discipline when credits are deducted

## Contract Rules

- Proposed APIs are not final contracts.
- Proposed entity fields are not immutable database contracts.
- Status lifecycle names are proposed only until reviewed.
- API changes require contract review before implementation.
- Database changes require entity and migration review before implementation.

## Documentation Rules

- Read existing `.md` files before documentation changes.
- Update paired `docs/ai` and `docs/vi` files together.
- Do not allow one language layer to contain stronger commitments than the other.
- If one side is not updated, report out-of-sync status.
