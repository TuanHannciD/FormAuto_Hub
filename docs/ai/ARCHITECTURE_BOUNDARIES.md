# ARCHITECTURE_BOUNDARIES

## Purpose

Define layer responsibilities and forbidden ownership moves.

## Confirmed Architecture Direction

- Backend: ASP.NET Core Web API .NET 9.
- API style: controller-based REST API for MVP.
- Database: SQL Server.
- ORM: Entity Framework Core with migrations.
- Background processing: Deferred for MVP, expected after synchronous flow works.
- Frontend framework: Next.js web dashboard.

## Layer Responsibilities

### Controllers

Own:

- route binding
- request DTO input
- response DTO output
- HTTP status mapping
- authorization attributes or filters when approved

Must not own:

- heavy business logic
- credit deduction logic
- Google Forms parsing/submission internals
- EF Core query composition beyond simple delegated calls

### Services

Own:

- business workflows
- credit and usage orchestration
- validation orchestration
- transaction boundaries when needed
- integration coordination

Must not return framework-specific HTTP results.

### EF Core DbContext

Own:

- persistence access
- entity sets
- transaction integration
- migration-backed schema changes

Must not contain business decisions that belong in services.

### Entities

Own persisted domain state.

Must not:

- call external APIs
- know about HTTP
- perform Google Forms submission
- hide business workflows

### DTOs

Own API request/response contracts.

DTO changes require API contract review.

### Integration Services

Own external calls to Google Forms, payment providers, AI providers, or future queues.

Deferred integrations must not be represented as production-complete.

AI integration direction for the Phase 6 requirement package:

- `Integrations.AI` owns provider-specific calls and response parsing.
- Normal-user frontend requests must not choose provider, model, or API key directly.
- AI provider settings are admin-owned configuration and must be read server-side.
- AI output must be validated before any `GeneratedResponses` row is stored.
- Choice-style answers must not be accepted outside stored form options.

## Mandatory Boundaries

- Google Forms integration must not be mixed into credit/account services.
- Credit deduction must go through a dedicated credit service.
- Credit changes must write a transaction ledger entry.
- Tool usage must write `UsageLogs`.
- Submission actions must write `SubmissionLogs`.
- AI generation credit deduction must go through the same dedicated credit workflow and ledger discipline.
- Raw AI provider request/response audit must not replace `UsageLogs` or `CreditTransactions`.
- AI-generated previews must still require preview review and explicit user confirmation before submission.
- If a tool action fails after credit deduction, refund behavior is Deferred and must not be invented.
