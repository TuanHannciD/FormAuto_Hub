# PROJECT_PHASE_ROADMAP

## Purpose

Define FormAuto Hub delivery phases and scope gates.

## Current Phase

Current phase: **Phase 6 - Production integrations**.

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

Status: Current.

Deferred unless explicitly approved:

- Google OAuth
- official Google Forms API
- payment gateway
- background job framework
- AI mapping/generation
- webhook integrations
- production deployment platform

## Phase Rule

Tasks outside the active phase require explicit approval or must be narrowed to the safe in-phase subset.
