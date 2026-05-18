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
- queue/background job settings
- webhook URLs
- email provider settings
