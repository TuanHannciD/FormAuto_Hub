# FormAuto Hub Documentation Pack

FormAuto Hub is a web-based form automation and usage-management platform.

The product helps authorized users analyze Google Forms, detect questions, configure answer-generation rules, preview generated responses, and submit a small controlled number of responses. It also includes account and credit management for balances, top-up orders, usage history, credit transactions, profile management, and admin approval of top-up orders.

This repository contains the documentation baseline and the initial Phase 1 backend foundation scaffold. Production business workflows should not be created or changed unless a later task explicitly asks for implementation.

## Current Phase

Current phase: **Phase 8 - Admin, revenue, and PayOS automated credit top-up**.

Phase 1 backend foundation exists under `src/FormAutoHub.Api`, with tests under `tests/FormAutoHub.Tests`. Agents must read existing source code and docs before changing docs or implementation.

## How To Use These Docs

- Human PM/dev readers should start with `docs/vi/`.
- AI coding agents should start with `docs/ai/AI_DOC_ROUTING_MATRIX.md`.
- The AI layer is intended for Codex, Cursor, Claude, ChatGPT, and similar coding agents.
- AI workflow operators should start with `.agents/START_HERE.md` and `.agents/SKILL_INDEX.md` when available.
- `AGENTS.md` is the highest-priority repository rule file for agents.
- `docs/ai/` is concise, execution-oriented, and optimized for Codex/Cursor/Claude/ChatGPT.
- `docs/vi/` is Vietnamese, human-readable, and semantically synced with `docs/ai/`.

## Confirmed Baseline

- Backend: ASP.NET Core Web API .NET 9.
- API style: controller-based REST API for MVP.
- Database: SQL Server.
- ORM: Entity Framework Core with EF Core migrations.
- Frontend framework: Next.js web dashboard.
- Frontend UI baseline: shadcn/ui with Tailwind CSS for dashboard/admin components.
- Authentication: JWT access tokens with refresh token/session storage.
- Google account login/register: identity-only; official Google Forms API scopes remain Deferred.
- MVP top-up flow: manual top-up order approval.
- Phase 8 payment provider: PayOS first, for automated credit top-up.
- MVP generated response limit: up to 100 preview responses per action, with controlled submission in sequential batches of 10.
- Preview before submission is required.
- Credit changes must be written to `CreditTransactions`.
- Tool actions must be written to `UsageLogs`.
- Supported MVP answer modes: random equally, random by percentage, random by quantity, sample text lines for text answers, sequential date ranges, and sequential time ranges.
- Dashboard/account tabs: overview, top-up credits, top-up orders, tool usage history, credit transactions, and profile.
- Abuse features are forbidden.

## Important Non-Goals

FormAuto Hub must not support:

- spam tooling
- captcha bypass
- proxy rotation
- fake accounts
- unauthorized form submission
- bypassing Google restrictions
- payment gateway integration in MVP
- microservices in MVP
- AI auto-submit without human preview and confirmation

## How To Update Docs Safely

1. Read `AGENTS.md`.
2. Read `docs/ai/AI_DOC_ROUTING_MATRIX.md`.
3. Read all existing `.md` files relevant to the change.
4. Identify whether the change affects scope, API contracts, database entities, phase commitments, or safety rules.
5. Update both `docs/ai/<file>.md` and `docs/vi/<file>.md` in the same task.
6. Keep confirmed decisions stronger than assumptions.
7. Keep Deferred items marked as `Deferred:` until explicitly approved.
8. Do not add business rules, API contracts, fields, statuses, events, or lifecycle states without approval.
9. Report validation honestly.

If only one language layer is updated, the documentation is out of sync and completion must not be claimed.

## Documentation Sync Checklist

| AI document | Vietnamese document | Required |
|---|---|---|
| `docs/ai/AI_DOC_ROUTING_MATRIX.md` | `docs/vi/AI_DOC_ROUTING_MATRIX.md` | Yes |
| `docs/ai/PROJECT_EXECUTION_RULES.md` | `docs/vi/PROJECT_EXECUTION_RULES.md` | Yes |
| `docs/ai/TASK_EXECUTION_FLOW.md` | `docs/vi/TASK_EXECUTION_FLOW.md` | Yes |
| `docs/ai/AI_RESPONSE_RULES.md` | `docs/vi/AI_RESPONSE_RULES.md` | Yes |
| `docs/ai/MODULE_MAP.md` | `docs/vi/MODULE_MAP.md` | Yes |
| `docs/ai/ARCHITECTURE_BOUNDARIES.md` | `docs/vi/ARCHITECTURE_BOUNDARIES.md` | Yes |
| `docs/ai/SOURCE_STRUCTURE_AND_NAMING_RULES.md` | `docs/vi/SOURCE_STRUCTURE_AND_NAMING_RULES.md` | Yes |
| `docs/ai/FRONTEND_STYLE_GUIDE.md` | `docs/vi/FRONTEND_STYLE_GUIDE.md` | Yes |
| `docs/ai/UI_DESIGN_ARTIFACTS.md` | `docs/vi/UI_DESIGN_ARTIFACTS.md` | Yes |
| `docs/ai/AUTH_UI_DESIGN_GUIDE.md` | `docs/vi/AUTH_UI_DESIGN_GUIDE.md` | Yes |
| `docs/ai/API_CONTRACT_GUIDE.md` | `docs/vi/API_CONTRACT_GUIDE.md` | Yes |
| `docs/ai/EVENT_AND_WEBHOOK_CONTRACTS.md` | `docs/vi/EVENT_AND_WEBHOOK_CONTRACTS.md` | Yes |
| `docs/ai/DOMAIN_ENTITIES_OVERVIEW.md` | `docs/vi/DOMAIN_ENTITIES_OVERVIEW.md` | Yes |
| `docs/ai/PROJECT_PHASE_ROADMAP.md` | `docs/vi/PROJECT_PHASE_ROADMAP.md` | Yes |
| `docs/ai/PHASE_0_CLOSEOUT.md` | `docs/vi/PHASE_0_CLOSEOUT.md` | Yes |
| `docs/ai/PHASE_1_CLOSEOUT.md` | `docs/vi/PHASE_1_CLOSEOUT.md` | Yes |
| `docs/ai/PHASE_2_CLOSEOUT.md` | `docs/vi/PHASE_2_CLOSEOUT.md` | Yes |
| `docs/ai/PHASE_3_KICKOFF_PLAN.md` | `docs/vi/PHASE_3_KICKOFF_PLAN.md` | Yes |
| `docs/ai/PHASE_3_CLOSEOUT.md` | `docs/vi/PHASE_3_CLOSEOUT.md` | Yes |
| `docs/ai/PHASE_4_CLOSEOUT.md` | `docs/vi/PHASE_4_CLOSEOUT.md` | Yes |
| `docs/ai/PHASE_5_CLOSEOUT.md` | `docs/vi/PHASE_5_CLOSEOUT.md` | Yes |
| `docs/ai/PHASE_7_CLOSEOUT.md` | `docs/vi/PHASE_7_CLOSEOUT.md` | Yes |
| `docs/ai/PHASE_8_KICKOFF_PLAN.md` | `docs/vi/PHASE_8_KICKOFF_PLAN.md` | Yes |
| `docs/ai/PHASE_EXECUTION_RULES.md` | `docs/vi/PHASE_EXECUTION_RULES.md` | Yes |
| `docs/ai/TECH_STACK_DECISIONS.md` | `docs/vi/TECH_STACK_DECISIONS.md` | Yes |
| `docs/ai/ENVIRONMENT_SETUP.md` | `docs/vi/ENVIRONMENT_SETUP.md` | Yes |
| `docs/ai/TESTING_STRATEGY.md` | `docs/vi/TESTING_STRATEGY.md` | Yes |
| `docs/ai/DEFINITION_OF_DONE.md` | `docs/vi/DEFINITION_OF_DONE.md` | Yes |
| `docs/ai/REPO_CODING_CONVENTIONS.md` | `docs/vi/REPO_CODING_CONVENTIONS.md` | Yes |
| `docs/ai/SELF_REVIEW_CHECKLIST.md` | `docs/vi/SELF_REVIEW_CHECKLIST.md` | Yes |
| `docs/ai/PROMPT_TEMPLATE_FOR_FUTURE_TASKS.md` | `docs/vi/PROMPT_TEMPLATE_FOR_FUTURE_TASKS.md` | Yes |

## How To Submit New Requirements

Use this template for new work:

```md
Requirement:
[What needs to change]

Business context:
[Why this is needed]

Affected users/actors:
[Who uses it]

Affected modules:
[Known modules or unknown]

Expected behavior:
[Desired behavior]

Out of scope:
[What must not change]

Confirmed rules:
[Approved rules]

Unknowns:
[Open questions]

Validation expected:
[Build/test/runtime/docs review expectations]
```

## AI Workflow Overlay

This repo includes a lightweight `.agents/` skill layer for future AI sessions:

- `.agents/START_HERE.md`: short AI/operator entrypoint.
- `.agents/SKILL_INDEX.md`: routes task types to FormAuto skills.
- `.agents/skills/`: compact role-specific skills.
- `templates/chat-starters/`: ready prompts for common work modes.
- `SKILL_USAGE_MATRIX.md`: quick skill-combination matrix.
# FormAuto_Hub
