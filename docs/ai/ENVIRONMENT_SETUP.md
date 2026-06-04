# ENVIRONMENT_SETUP

## Purpose

Define environment expectations without inventing unapproved deployment details.

## Current Status

Initial Phase 1 backend scaffold exists. Environment details remain foundation guidance until business implementation and deployment decisions are approved.

## Expected Local Groups

Backend:

- .NET 9 SDK
- ASP.NET Core Web API
- SQL Server local/dev instance
- EF Core CLI/tools

Configuration:

- database connection string
- auth settings once approved
- Google integration settings once approved
- payment settings only after payment gateway approval
- AI settings only after AI feature approval

Phase 6 AI provider setup direction:

- AI provider API keys should be entered through admin AI provider settings, not committed to source-controlled configuration.
- AI API keys must be stored encrypted when persisted.
- environment/appsettings may provide encryption key material or local fallback only after review.
- provider and model values must be present before enabling AI generation.
- optional AI provider Base URL must be an absolute `http` or `https` URL when configured.
- normal-user generation requests must not carry provider API keys.
- `AI__ProviderAdapter=Deterministic` is a local/test-only switch for deterministic AI generation smoke validation.
- `AI__ProviderAdapter=OpenAICompatible` enables the scoped live OpenAI-compatible chat completions adapter.
- If no approved runtime AI provider adapter is configured, backend AI generation must fail safely and must not create fake provider-backed previews.
- Do not set the deterministic adapter switch in production configuration.

## Expected Environments

- Local development
- Test/integration validation
- Production

Exact hosting and deployment platform: Deferred.

## SQL Server Discipline

- Use SQL Server for persistence.
- Use EF Core migrations for schema changes.
- Do not use ad hoc schema drift as the normal workflow.
- Migration validation is required for database changes.

## Secrets

- Do not commit secrets.
- Do not document real credentials.
- Use environment variables or secret storage once hosting is approved.

## Deferred Configuration

Deferred:

- Google OAuth client settings
- official Google Forms API credentials
- payment gateway credentials
- AI provider keys
- AI provider encryption key material before AI provider settings approval
- production AI provider adapter selection
- live provider/model catalog validation beyond the approved OpenAI-compatible adapter path
- queue/background job settings
- webhook URLs
- email provider settings
