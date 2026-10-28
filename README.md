# FormAuto Hub Documentation Pack

FormAuto Hub is a web-based form automation and usage-management platform.

The product helps authorized users analyze Google Forms, detect questions, configure answer-generation rules, preview generated responses, and submit a small controlled number of responses. It also includes account and credit management for balances, top-up orders, usage history, credit transactions, profile management, and admin approval of top-up orders.

This repository contains the bilingual documentation, implemented ASP.NET Core API and Next.js dashboard, and approved phase/follow-up work. New production workflows require explicit approval; current local implementation and validation are summarized in `docs/ai/UI_CREDIT_FOLLOWUP_SYNC.md` and `docs/vi/UI_CREDIT_FOLLOWUP_SYNC.md`.

## Current Phase

Current global phase: **Phase 9 closeout completed; next phase not selected**.

Phase 6 AI scoped follow-up: **Completed (see docs/ai/PHASE_6_CLOSEOUT.md)**.

The user-approved SEO/GEO follow-up has verified local implementation and public release `8a4f18e` on 2026-10-09: 26/26 deployed HTTP/browser checks passed. Google live inspection can fetch the sample page and sitemap; submitted-sitemap processing remains Blocked pending the reported fetch error. Search/AI outcome measurement remains Not run. See [implementation record](docs/ai/SEO_GEO_IMPLEMENTATION_PLAN.md), [Vietnamese record](docs/vi/SEO_GEO_IMPLEMENTATION_PLAN.md) and [validation runbook](docs/ai/SEO_GEO_VALIDATION_RUNBOOK.md).

No new global phase is selected. New phase work, deferred-item activation, or additional implementation/fix follow-up requires explicit approval.

Implemented API source is under `src/FormAutoHub.Api`, tests under `tests/FormAutoHub.Tests`, and the Next.js app under `apps/web`. Agents must read existing source and task docs before changing files.

## Documentation and Agent workflow

- Human readers: `docs/vi/`; agents: README → [AGENTS](AGENTS.md) → [authority](docs/ai/agent/AUTHORITY_MAP.md) → current task → [routing](docs/ai/AI_DOC_ROUTING_MATRIX.md).
- Four paired operating documents own authority, execution/permissions/handoff, quality/browser/Done and tooling. See the authority map; old workflow paths remain short compatibility links.
- [SKILL_USAGE_MATRIX](SKILL_USAGE_MATRIX.md) selects the packaged Superpowers/UI skills and seven FormAuto domain specialists. Source is `.agents/skills`; `.claude/skills` is generated, never edited independently.
- Documentation changes need approval unless already authorized; update AI/VI together. Use [TASK_BRIEF](templates/TASK_BRIEF.md) and [HANDOFF](templates/HANDOFF.md), reusing existing approvals and next actions.
- Package/mirror validation: `python scripts/agent-skills.py --check`; after authorized source changes: `python scripts/agent-skills.py --sync`. [Migration evidence](docs/vi/tasks/FAH-AGENT-001/INDEX.md) separates installed packages from verified capabilities.

## Confirmed Baseline

- Backend: ASP.NET Core Web API .NET 9.
- API style: controller-based REST API for MVP.
- Database: SQL Server.
- ORM: Entity Framework Core with EF Core migrations.
- Frontend framework: Next.js web dashboard.
- Frontend UI baseline: shadcn/ui with Tailwind CSS for dashboard/admin components.
- Authentication: JWT access tokens with refresh token/session storage.
- Google account login/register: identity-only for the core FormAuto Hub product; NCKH Survey Module has a separate approved Phase 1 track with repo evidence for Google OAuth link and Google Forms read/import.
- MVP top-up flow: manual top-up order approval.
- Phase 8 payment provider: PayOS first, for automated credit top-up.
- MVP generated response limit: up to 100 preview responses per action, with controlled submission in sequential batches of 10.
- Preview before submission is required.
- Credit changes must be written to `CreditTransactions`.
- Tool actions must be written to `UsageLogs`.
- Supported MVP answer modes: random equally, random by percentage, random by quantity, sample text lines for text answers, sequential date ranges, and sequential time ranges.
- Dashboard navigation: overview, form automation, top-up credits, usage logs, credit transactions, NCKH, and AI usage. Profile/security share the topbar account popup; old standalone profile routes are retired.
- Abuse features are forbidden.

## Important Non-Goals

FormAuto Hub must not support:

- spam tooling
- captcha bypass
- proxy rotation
- fake accounts
- unauthorized form submission
- bypassing Google restrictions
- payment providers other than approved Phase 8 PayOS
- microservices in MVP
- AI auto-submit without human preview and confirmation

## Local development and checks

Run `run-local.bat` from the repository root, or `npm run dev` from `apps/web`, for API `https://localhost:7039` and web `http://localhost:3020`. The launcher can install missing web dependencies. See [environment setup](docs/ai/ENVIRONMENT_SETUP.md) for configuration and prerequisites; keep secrets out of Git.

Use the change-specific commands and runtime gates in [TOOLING](docs/ai/agent/TOOLING.md) and [QUALITY_GATES](docs/ai/agent/QUALITY_GATES.md). Existing test/CI/deployment configuration remains unchanged by the workflow migration. Historical NCKH Phase 2/3 packs are reference material, not active work queues.
