# PROJECT_PHASE_ROADMAP

## Purpose

Define FormAuto Hub delivery phases and scope gates.

## Current Phase

Current phase: **Phase 8 closeout completed; next phase not selected**.

## Phase 0 - Documentation and scope baseline

Status: Completed baseline, pending future doc sync as needed.

Includes:

- documentation architecture
- AI execution docs
- Vietnamese human docs
- module map
- phase roadmap
- safety and non-goal baseline
- proposed API/entity documentation

Exit criteria:

- required docs exist in `docs/ai` and `docs/vi`
- docs are semantically synced
- Deferred items are labeled
- stale conflicting docs are removed

## Phase 1 - Backend foundation

Status: Completed.

Includes:

- ASP.NET Core Web API .NET 9 project
- controller-based API baseline
- SQL Server connection
- EF Core setup
- initial entities
- EF Core migrations

Current completed subset:

- solution scaffold
- ASP.NET Core Web API .NET 9 project
- controller-based API pipeline
- SQL Server EF Core package setup
- minimal `FormAutoHubDbContext`
- safe connection string placeholder without secrets
- xUnit test project
- initial conceptual entities from `DOMAIN_ENTITIES_OVERVIEW.md`
- initial EF Core migration
- local `dotnet-ef` 9.0.16 tool manifest
- migration validation against temporary LocalDB database

Excludes:

- payment gateway
- Google OAuth
- AI answer generation
- production background job framework

## Phase 2 - Account and credit management

Status: Completed.

Includes:

- users
- credit accounts
- credit packages
- top-up orders
- admin approval/rejection
- credit transactions
- usage logs
- dashboard summary API
- dashboard account areas: overview, top-up credits, top-up orders, tool usage history, credit transactions, profile
- dashboard summary cards: current credit balance, total credits deposited, total credits used, pending top-up orders
- dashboard recent panels: recent top-up orders, recent tool usage

Excludes:

- payment gateway integration
- package management UI unless approved
- admin user management UI unless approved
- manual credit adjustment unless approved

## Phase 3 - Form automation MVP

Status: Completed.

Includes:

- Google Form URL analysis
- question detection
- entry ID detection when available
- supported MVP question types: short text, paragraph text, multiple choice, checkbox, dropdown, linear scale, rating, multiple choice grid, checkbox grid, date, time
- deferred question type: file upload, because Google requires sign-in for file upload forms
- supported MVP answer-generation modes: random equally, random by percentage, random by quantity, sample text lines for text answers, sequential date ranges, sequential time ranges
- answer rules
- response preview
- controlled submission
- usage logging
- submission logs
- MVP generated response count of 1 to 100 per action, with submission processed sequentially in batches of 10

Excludes:

- captcha bypass
- proxy rotation
- fake accounts
- unauthorized submission
- AI answer generation unless approved
- official Google Forms API/OAuth unless approved

## Phase 4 - Safety and validation hardening

Status: Completed.

Includes:

- rate limiting
- stronger validation
- error handling
- audit logs
- anti-abuse constraints
- improved submission safety

Excludes:

- production integrations unless explicitly approved

## Phase 5 - Frontend dashboard and tool UI

Status: Completed.

Includes:

- dashboard/account management UI
- form automation UI
- preview-before-submit UI
- top-up order UI
- profile UI

Frontend framework: Next.js web dashboard.

## Phase 6 - Production integrations

Status: Deferred candidate group.

Deferred unless explicitly approved:

- Google OAuth
- official Google Forms API
- payment gateway
- background job framework
- AI mapping/generation
- webhook integrations
- production deployment platform

Future candidate notes:

- Google OAuth may be useful later for verified user-owned form access.
- Official Google Forms API may be useful later for form metadata, question, and response sync.
- Google Forms watches with Cloud Pub/Sub-style notification handling may be useful later for schema or response change detection.
- Background jobs may be useful later for watch renewal, sync retries, and integration health checks.

Deferred:

- These future candidates are not approved implementation scope yet.
- They do not approve API contracts, database fields, statuses, lifecycle states, OAuth token storage, webhook/Pub/Sub ingestion models, or background job framework choices.
- If a future task requires UI for these integrations, use existing UI docs only when they are sufficient; otherwise ask for UI direction or sync UI docs before implementation.

## Phase 7 - Authentication and account access

Status: Completed.

Approved scope:

- email/password registration
- email/password login
- JWT access token with refresh token/session
- access token expiry of 1 hour
- refresh token expiry of 7 days
- registration returns JWT immediately without requiring a second login
- new registered users receive 5 starting credits
- starting credit grant must be recorded in `CreditTransactions`
- `InitialGrant` is approved as the credit transaction type for starting credits
- logout revokes only the current refresh token/session
- password change in profile
- password recovery is not implemented yet; UI may show it as currently being updated
- Google account login/register for identity only
- Google login does not approve official Google Forms API, form scopes, watches, webhooks, or background jobs

Approved Google login rules:

- if `provider_user_id` or Google `sub` already exists in storage, login succeeds for that linked user
- if no provider user id exists but the Google email matches an existing password account, link is considered only when `email_verified = true`
- matching email with `email_verified = true` must not silently auto-link; the preferred flow is to require the user to log in with password first, then link Google
- if `email_verified = false`, do not auto-link
- Google auto-register is allowed when there is no existing matching account conflict

Approved persistence direction:

- use a dedicated `RefreshTokens` table for refresh token/session storage
- implemented refresh token fields: `Id`, `UserId`, `TokenHash`, `ExpiresAt`, `RevokedAt`, `CreatedAt`
- implemented Google external login fields: `Id`, `UserId`, `Provider`, `ProviderUserId`, `Email`, `EmailVerified`, `CreatedAt`

Approved lockout baseline:

- lockout threshold: 5 failed login attempts
- lockout duration: 15 minutes

Completed implementation subset:

- auth endpoints for register, login, Google identity login, refresh, logout, and Google account linking
- JWT claims: `sub`, `email`, `role`, `jti`
- `RefreshTokens` table for refresh token/session storage
- `UserExternalLogins` table for Google identity links
- app APIs protected with JWT authorization
- frontend auth routes for login, register, auth callback, and profile security
- frontend bearer-token API client with refresh-token retry
- dashboard auth guard and current-session logout
- profile password change uses password verification instead of temporary hash comparison
- EF Core migration `Phase7Authentication`

## Phase 8 - Admin, revenue, and PayOS automated credit top-up

Status: Completed.

Approved scope:

- dedicated admin area for operational and financial management
- admin reporting for revenue, top-up orders, credit sales, credit usage, and payment status
- PayOS as the first approved payment provider for automated credit top-up
- PayOS payment link creation for top-up orders
- PayOS callback/webhook handling for payment confirmation
- PayOS signature or authenticity verification before applying credit
- automatic credit grant only after a valid paid PayOS event is confirmed
- idempotent credit grant so repeated callbacks/webhooks do not add duplicate credit
- `CreditTransactions` ledger entry for every automatic credit grant
- top-up order status updates tied to verified payment outcome
- admin visibility into payment and credit transaction history

Approved post-closeout follow-up:

- admin credit package management for existing `CreditPackages` fields: `Name`, `Credits`, `Price`, and `IsActive`
- admin may create packages and update existing packages
- inactive packages are hidden from normal user top-up selection
- no package hard delete in this follow-up
- existing top-up orders keep their snapshot credit and amount values

Scope boundaries:

- PayOS is the only approved payment provider in this phase.
- Admin reporting must use existing persisted data unless a future approved task adds new fields or aggregates.
- Credit changes must continue to go through the dedicated credit workflow and transaction ledger discipline.
- Payment secrets must not be stored in source-controlled configuration.
- Payment callbacks/webhooks must not grant credit before verification.

Deferred:

- VNPay, MoMo, Stripe, or other payment providers
- subscription billing
- automated refund behavior
- manual credit adjustment unless separately approved
- package management behavior beyond the approved create/update/bulk visibility follow-up
- admin user management UI unless separately approved
- official Google Forms API
- Google Forms watches or background sync
- AI mapping/generation
- production background job framework unless a PayOS task explicitly proves it is needed

Kickoff plan:

- See `PHASE_8_KICKOFF_PLAN.md`.

Closeout:

- See `PHASE_8_CLOSEOUT.md`.

## Phase Rule

No next phase is selected after Phase 8 closeout. New phase work requires explicit approval or must be narrowed to a documented safe follow-up.
