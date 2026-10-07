# ENVIRONMENT_SETUP

## Purpose

Define environment expectations without inventing unapproved deployment details.

## Current Status

The repository contains the implemented backend and Next.js dashboard. The global Phase 9 closeout is complete; no next global phase is selected. Use `DEPLOYMENT_GUIDE.md` for the approved production CI/CD foundation and the NCKH documents for that separate module track. Restoring an existing local environment does not approve new features or Deferred integrations.

## Expected Local Groups

Backend:

- .NET 9 SDK
- ASP.NET Core Web API
- SQL Server local/dev instance
- EF Core CLI/tools

Configuration:

- database connection string
- JWT settings for existing authentication
- Google client settings for existing identity login and the separate approved NCKH OAuth/import scope
- PayOS settings for approved Phase 8 functionality
- AI settings for the completed Phase 6 scoped functionality

## Local Full-App Launcher

The repository provides `run-local.bat` for the standard Windows local-development workflow.

- Run `run-local.bat` from the repository root to start the web app and API together.
- The web app listens on `http://localhost:3020`.
- The API uses the existing HTTPS launch profile at `https://localhost:7039`.
- `npm run dev` in `apps/web` starts the same full-app workflow.
- `npm run dev:web` starts only the Next.js app on port `3020`.
- `npm run dev:api` starts only the ASP.NET Core API.
- The local API CORS allowlist includes `localhost` and `127.0.0.1` on port `3020`.
- The launcher installs missing frontend dependencies and reports missing Node.js, npm, .NET SDK, or HTTPS development certificate prerequisites.

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

Production uses the approved single-host Docker Compose/GHCR/GitHub Actions foundation described in `DEPLOYMENT_GUIDE.md`. Additional deployment capabilities remain Deferred.

## SQL Server Discipline

- Use SQL Server for persistence.
- Use EF Core migrations for schema changes.
- Do not use ad hoc schema drift as the normal workflow.
- Migration validation is required for database changes.

## Secrets

- Do not commit secrets.
- Do not document real credentials.
- Use environment variables, ignored local configuration, or protected secret storage appropriate to the environment.

## Restore local configuration

- Backend local overrides belong in `src/FormAutoHub.Api/appsettings.Development.json`; frontend local overrides belong in `apps/web/.env.local`. Both paths are ignored by Git. Never put secrets in `NEXT_PUBLIC_*` variables; these are browser-visible.
- Use the local SQL instance. A recovered production connection string must not point the local app at production. Generate a separate local JWT signing key.
- `run-local.bat` / `npm run dev:web` supplies the localhost API, site, and NCKH callback URLs. `.env.example` contains historical fallback URLs and is not a complete local configuration; do not copy its API/site URLs blindly.
- Recover Google client configuration only when explicitly requested. The OAuth callback for this launcher is `http://localhost:3020/dashboard/nckh/callback`; Google must allow that redirect URI and the relevant local origin. Copying a client secret does not verify the Google allowlist.
- AI/PayOS credentials are encrypted database settings. Restoring env values alone does not recover them. A key ring is tied to its application discriminator and protector purpose; use the scoped recovery reference linked from `DEPLOYMENT_GUIDE.md`, preserve existing local keys/ciphertext, and verify decryption before claiming recovery.
- Persist the local runtime key ring outside temporary folders, for example `%LOCALAPPDATA%/FormAutoHub/DataProtection-Keys`, with restricted Windows permissions. Set `DataProtection:KeysPath` in the ignored backend configuration. Preserve this directory together with local database backups.
- Compare existing SQL migration history with source before startup: the API calls `Database.Migrate()` at startup. Preserve a database with migrations missing from source and report the mismatch; do not erase migration history.
- Install frontend dependencies with `npm ci` in `apps/web`, then start the launcher and verify API health, local routes, authentication, and relevant logs. Report external integrations separately from local startup.

## Configuration Boundaries and Deferred Items

Google identity configuration, separate approved NCKH OAuth/import configuration, Phase 8 PayOS credentials/webhook URLs, and Phase 6 scoped AI provider configuration support existing approved behavior. Their values are environment secrets, not new feature approvals. Broader core Google Forms integration and AI rollout remain Deferred.

Deferred:

- Google Forms integrations outside the approved separate NCKH scope
- payment providers other than PayOS
- AI adapters outside the approved scoped OpenAI-compatible path
- live provider/model catalog validation beyond the approved OpenAI-compatible adapter path
- queue/background job settings
- webhook platforms outside the approved PayOS flow
- email provider settings
