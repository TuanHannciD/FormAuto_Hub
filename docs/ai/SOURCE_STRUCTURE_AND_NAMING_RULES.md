# SOURCE_STRUCTURE_AND_NAMING_RULES

## Purpose

Define source placement and naming rules before implementation exists.

## Repository State

Production source structure is not approved yet. These rules guide future scaffolding only.

## Expected Backend Placement

When backend code is approved, use a clear ASP.NET Core Web API structure such as:

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

This is a proposed structure, not an immutable contract.

## Naming Rules

- Controllers: `<Module>Controller`.
- Services: `<Module>Service` or task-specific service names such as `CreditService`.
- DTOs: `<Action>Request`, `<Action>Response`, or `<Entity>Dto`.
- Entities: singular domain names such as `User`, `TopupOrder`, `UsageLog`.
- Integration services: provider-scoped names such as `GoogleFormsAnalyzer`.

## File Naming Rules

- Keep one primary public C# type per file, and name the file after that type.
- Controllers use `<Module>Controller.cs`, for example `TopupOrdersController.cs`.
- Services use `<Module>Service.cs` or a specific workflow name such as `CreditService.cs`.
- Entity files use singular domain names, for example `User.cs`, `TopupOrder.cs`, and `UsageLog.cs`.
- API contract and DTO files belong under `Contracts/`. Use feature-scoped DTO grouping only when the grouped DTOs are small and tightly related, for example `Phase2Dtos.cs`; otherwise split by workflow using `<Workflow>Dtos.cs`.
- Domain constant files use plural value-set names, for example `TopupOrderStatuses.cs`, `CreditTransactionTypes.cs`, `UsageLogStatuses.cs`, and `UserRoles.cs`.
- EF Core context files use the context type name, for example `FormAutoHubDbContext.cs`.
- EF Core migration files must keep the EF-generated timestamp and migration name format: `<yyyyMMddHHmmss>_<MigrationName>.cs`, `<yyyyMMddHHmmss>_<MigrationName>.Designer.cs`, and `FormAutoHubDbContextModelSnapshot.cs`.
- Mapping helpers must be feature-scoped and named after the feature, for example `Phase2Mappings.cs`; do not create generic `Mapper.cs`, `Helpers.cs`, or `Utils.cs` files without real reuse.
- Test files use `<Subject>Tests.cs`, for example `FoundationTests.cs` or `Phase2TopupApprovalTests.cs`.
- Project and solution files keep the product/project name: `FormAutoHub.Api.csproj`, `FormAutoHub.Tests.csproj`, and `FormAutoHub.sln`.
- Future Next.js frontend files must follow standard Next.js conventions such as `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, and colocated feature components with PascalCase component filenames. Do not create frontend files before an approved frontend implementation task.

## Placement Rules

- API contracts and DTOs belong in `Contracts/`.
- Business logic belongs in services.
- EF Core persistence belongs in `Data` and entity configuration.
- External provider calls belong in `Integrations`.
- Shared code is allowed only after real reuse exists.
- Frontend folders may be created only when a task explicitly approves frontend implementation, and they must follow the approved Next.js web dashboard direction.

## Forbidden Moves

- Do not create or change frontend architecture commitments through folder names.
- Do not hide business logic in controllers.
- Do not hide credit ledger behavior in generic helpers.
- Do not put Google Forms provider behavior into account or credit modules.
- Do not create microservice boundaries in MVP.
