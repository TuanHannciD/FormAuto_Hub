# SOURCE_STRUCTURE_AND_NAMING_RULES

## Purpose

Define source placement and naming rules for the implemented repository.

## Repository State

The API is implemented under `src/FormAutoHub.Api`, backend tests under `tests/FormAutoHub.Tests`, and Next.js dashboard under `apps/web`. These rules apply to existing source and future approved changes.

## Expected Backend Placement

Current backend placement:

```text
src/
  FormAutoHub.Api/
    Controllers/
    Contracts/
    Services/
    Entities/
    Data/
    Integrations/
    Configuration/
tests/
  FormAutoHub.Tests/
```

Extend the current structure within approved scope; do not redesign it implicitly.

## Naming Rules

- Controllers: `<Module>Controller`.
- Services: `<Module>Service` or task-specific service names such as `CreditService`.
- DTOs: `<Action>Request`, `<Action>Response`, or `<Entity>Dto`.
- Entities: singular domain names such as `User`, `TopupOrder`, `UsageLog`.
- Integration services: provider-scoped names such as `GoogleFormsAnalyzer`.
- AI provider adapters should be provider-scoped under `Integrations/AI` or an equivalent reviewed AI integration folder for the completed approved Phase 6 scope.

## File Naming Rules

- Keep one primary public C# type per file, and name the file after that type.
- Controllers use `<Module>Controller.cs`, for example `TopupOrdersController.cs`.
- Services use `<Module>Service.cs` or a specific workflow name such as `CreditService.cs`.
- Entity files use singular domain names, for example `User.cs`, `TopupOrder.cs`, and `UsageLog.cs`.
- API contract and DTO files belong under `Contracts/`. Use feature-scoped DTO grouping only when the grouped DTOs are small and tightly related, for example `Phase2Dtos.cs`; otherwise split by workflow using `<Workflow>Dtos.cs`.
- Domain constant files use plural value-set names, for example `TopupOrderStatuses.cs`, `CreditTransactionTypes.cs`, `UsageLogStatuses.cs`, and `UserRoles.cs`.
- AI domain constant files should use plural value-set names, for example `AiGenerationRunStatuses.cs`, after contract review approves the values.
- EF Core context files use the context type name, for example `FormAutoHubDbContext.cs`.
- EF Core migration files must keep the EF-generated timestamp and migration name format: `<yyyyMMddHHmmss>_<MigrationName>.cs`, `<yyyyMMddHHmmss>_<MigrationName>.Designer.cs`, and `FormAutoHubDbContextModelSnapshot.cs`.
- Mapping helpers must be feature-scoped and named after the feature, for example `Phase2Mappings.cs`; do not create generic `Mapper.cs`, `Helpers.cs`, or `Utils.cs` files without real reuse.
- Test files use `<Subject>Tests.cs`, for example `FoundationTests.cs` or `Phase2TopupApprovalTests.cs`.
- Project and solution files keep the product/project name: `FormAutoHub.Api.csproj`, `FormAutoHub.Tests.csproj`, and `FormAutoHub.sln`.
- Next.js frontend files must follow standard Next.js conventions such as `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, and colocated feature components with PascalCase component filenames. Do not create frontend files before an approved frontend implementation task.

## Placement Rules

- API contracts and DTOs belong in `Contracts/`.
- Business logic belongs in services.
- EF Core persistence belongs in `Data` and entity configuration.
- External provider calls belong in `Integrations`.
- AI provider calls belong in `Integrations/AI` or the reviewed AI integration boundary; they must not be placed in controllers, credit services, or frontend code.
- AI provider settings, prompt profiles, and AI generation audit entities belong in `Entities/` and EF Core `Data/` only after DB review.
- Shared code is allowed only after real reuse exists.
- Frontend folders may be created only when a task explicitly approves frontend implementation, and they must follow the approved Next.js web dashboard direction.
- Shared frontend UI components belong under `apps/web/components/`. Before adding page-local UI, inspect that folder and reuse available components. If a pattern needs project-wide consistency, update or create a shared component instead of duplicating it per page.

## Forbidden Moves

- Do not create or change frontend architecture commitments through folder names.
- Do not hide business logic in controllers.
- Do not hide credit ledger behavior in generic helpers.
- Do not put Google Forms provider behavior into account or credit modules.
- Do not put AI provider API keys, provider calls, raw provider payload handling, or prompt/output validation into frontend-only code.
- Do not put AI credit multiplier logic outside the credit/generation service boundary approved by contract review.
- Do not create microservice boundaries in MVP.

## File maps and reading source

- No hard line cap. Split only for an independent responsibility/reuse or a clear navigation problem; never split a transaction/lifecycle merely to reduce lines. Keep shared UI under `apps/web/components/` and feature-local code colocated with the page (`_components/`, `_hooks.ts`, `_helpers.ts`, `_types.ts`, `_constants.ts`) only when justified, not as empty scaffolding.
- Retain the existing map trigger: handwritten C# and TS/TSX files over 500 physical lines that remain together need a short file map after required directives/imports. List major symbols/responsibilities and invariants; locate symbols in current source. Handwritten line numbers are optional hints, never authoritative addresses. Do not modify generated migrations/snapshots, lockfiles or vendored packages to satisfy map rules.
- A useful module README maps entrypoints, ownership, dependency/data flow and relevant tests when the folder tree alone is insufficient. Do not create a README for every small folder or duplicate business contracts in it.
- Start from approved behavior and module/contract, search paths/symbols with `rg`, then read the map/outline if available. Read complete affected functions/components including types/state, error and cleanup branches. Follow DI registrations, imports/callers/consumers and tests; widen context for shared, state, contract or boundary changes. No fixed chunk size may hide an invariant.
- A missing or stale map does not block exploration: locate current symbols, report navigation debt and update in-scope maps with structural changes. Do not refactor unrelated source during documentation work. Review the whole relevant diff/impact, not just the map or selected lines.
- There is no installed AST/LSP/map checker certified by this rule. The package checker verifies packaging/mirror only; it does not prove source maps or Agent reading behavior.
