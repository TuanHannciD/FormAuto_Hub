# FormAuto Hub AI Start Here

Use this file as the short entrypoint for AI/operator sessions.

## Startup

1. Read `README.md`.
2. Read `AGENTS.md`.
3. Read `docs/ai/AI_DOC_ROUTING_MATRIX.md`.
4. Pick a skill from `.agents/SKILL_INDEX.md`.
5. Read only the task-relevant docs.

## Hard Rules

- Do not invent business rules, API contracts, entity fields, statuses, events, lifecycle states, or architecture decisions.
- Keep Deferred items Deferred until approved.
- Keep `docs/ai` and `docs/vi` semantically synced.
- Do not weaken anti-abuse rules.
- Do not implement production code during documentation-only work.
- Report validation as `Verified`, `Not run`, or `Blocked`.

## Current Baseline

- Current phase: Phase 9 closeout completed; next phase not selected.
- Backend: ASP.NET Core Web API .NET 9.
- Database: SQL Server.
- ORM: Entity Framework Core.
- Phase 1 backend foundation exists under `src/FormAutoHub.Api`.
- Initial test project exists under `tests/FormAutoHub.Tests`.
- Frontend framework: Next.js web dashboard.
- Authentication uses JWT access tokens with refresh token/session storage.
- Google account login/register is identity-only.
- PayOS automated credit top-up is approved and completed in Phase 8.
- Payment providers other than PayOS, official Google Forms API, AI generation, and background job framework: Deferred.
