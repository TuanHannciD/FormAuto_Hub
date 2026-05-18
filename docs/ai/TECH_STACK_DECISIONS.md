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

## Frontend Direction

Frontend framework is approved as Next.js web dashboard.

Frontend UI baseline is approved as shadcn/ui with Tailwind CSS for dashboard/admin components.

Icon baseline is approved as lucide-react.

Deferred frontend alternatives:

- Flutter Web / Flutter Android

API contracts must stay frontend-agnostic even though Next.js is approved.

## Upgrade Rule

Do not introduce new frameworks, providers, infrastructure, or libraries as project commitments without updating both `docs/ai` and `docs/vi`.
