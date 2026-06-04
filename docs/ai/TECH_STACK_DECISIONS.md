# TECH_STACK_DECISIONS

## Purpose

Record approved and Deferred technology choices.

## Confirmed

- Backend: ASP.NET Core Web API .NET 9.
- API style: controller-based REST API preferred for MVP.
- Database: SQL Server.
- ORM: Entity Framework Core.
- Migrations: EF Core migrations.
- Architecture style: simple service layer or repository/service pattern.
- Frontend framework: Next.js web dashboard.
- Frontend UI baseline: shadcn/ui with Tailwind CSS.
- Frontend icon baseline: lucide-react.

## Deferred

- Flutter Web / Flutter Android.
- Authentication implementation details.
- JWT claim structure.
- Google OAuth.
- Official Google Forms API integration.
- Payment gateway integration.
- Background job framework.
- AI answer generation.
- AI mapping.
- Final AI provider and model choice.
- Email notification provider.
- Webhook platform.
- Production deployment platform.

## Backend Direction

- Prefer controllers for MVP.
- Keep controllers thin.
- Keep business logic in services.
- Keep persistence in EF Core `DbContext` and migrations.
- Use SQL Server as the persistence target.
- Do not introduce microservices in MVP.

## Background Job Direction

Background job processing is Deferred for MVP.

Future options may include:

- ASP.NET Core `BackgroundService`
- Hangfire
- Quartz.NET
- queue-based worker

No specific option is approved.

## AI Provider Direction

AI provider settings are approved for Phase 6 planning as an admin-managed database configuration area.

Approved direction for workers:

- store provider API keys through admin settings, encrypted before persistence
- validate non-empty provider and model values before enabling a provider setting
- validate optional Base URL as an absolute `http` or `https` URL
- keep normal-user generation requests independent from provider secrets
- use an `Integrations.AI` abstraction for provider-specific calls
- default runtime behavior must be fail-safe when no approved live provider adapter is configured
- the deterministic AI adapter is allowed only for explicit local/test validation through configuration
- the OpenAI-compatible adapter is allowed only for explicit runtime configuration through `AI:ProviderAdapter=OpenAICompatible`

Deferred:

- final provider
- final model
- provider SDK or HTTP client library choice
- live provider/model catalog validation source
- provider-specific SDK adapters outside the approved OpenAI-compatible HTTP adapter
- raw audit retention infrastructure
- any production background worker for AI generation

## Frontend Direction

Frontend framework is approved as Next.js web dashboard.

Frontend UI baseline is approved as shadcn/ui with Tailwind CSS for dashboard/admin components.

Icon baseline is approved as lucide-react.

Deferred frontend alternatives:

- Flutter Web / Flutter Android

API contracts must stay frontend-agnostic even though Next.js is approved.

## Upgrade Rule

Do not introduce new frameworks, providers, infrastructure, or libraries as project commitments without updating both `docs/ai` and `docs/vi`.
