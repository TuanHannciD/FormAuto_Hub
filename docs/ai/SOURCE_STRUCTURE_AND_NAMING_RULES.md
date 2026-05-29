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
- AI provider adapters should be provider-scoped under `Integrations/AI` or an equivalent reviewed AI integration folder when Phase 6 implementation is approved.

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
- Future Next.js frontend files must follow standard Next.js conventions such as `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, and colocated feature components with PascalCase component filenames. Do not create frontend files before an approved frontend implementation task.

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

## File Map Rule for Large Code Files

- No hard line limit is enforced for code files. Split only when architecturally justified.
- When a C# file exceeds **500 lines** and is not split, a **file map** comment block is required at the top of the file, right after namespace/using declarations.
- The map lists every public/internal method, property group, and region with its starting line number and a one-line purpose description.

### Map Format

```csharp
// === FILE MAP (CreditService.cs - 620 dong) ===
// Dong    Method/Region                  Muc dich
// 25-48   DeductCreditsAsync()           Tru credit + ghi ledger, rollback neu that bai
// 50-72   AddCreditsAsync()              Nap credit thu cong (admin), ghi ledger
// 74-110  ProcessTopupCallbackAsync()    Xu ly callback PayOS, doi soat chu ky
// 112-145 ValidateTopupRequest()         Validate don nap truoc khi gui PayOS
// 147-200 GetBalanceAndLedgerAsync()     Truy van so du + lich su giao dich
// 202-280 CalculateUsageCost()           Tinh phi credit theo batch size + loai form
// 282-350 ReserveCreditsAsync()          Giu credit truoc khi generate, hoan neu huy
// 352-420 RefundCreditsAsync()           Hoan credit khi generate that bai
// 422-490 GetUsageReportAsync()          Bao cao su dung credit theo khoang thoi gian
// 492-560 ReconcileLedgerAsync()         Doi soat ledger dinh ky voi PayOS
// 562-620 Private helpers + constants    Cac helper noi bo, hang so credit
```

### Rules

- The map must be kept up to date when methods are added, removed, or moved.
- For files with regions, group the map entries by region.
- Private helpers shared across many methods can be grouped as one entry.
- The map is for human and AI readability; do not generate it at build time.
## File Map and Extraction Rules for Frontend Files (apps/web/)

- No hard line limit. Split only when architecturally justified (a component becomes independently reusable, conceptually separate, or the file becomes hard to navigate).
- When a `.tsx`/`.ts` file exceeds **500 lines** and is not split, a **file map** comment block is required at the top of the file, right after imports.
- The map lists every exported function, component, hook, and major constant/type block with its starting line number and a one-line purpose description.

### TSX File Map Format

```tsx
// === FILE MAP (FormsPage.tsx - 620 dong) ===
// Dong    Component/Function                  Muc dich
// 30-85   FormsPage()                        Trang chinh: phan tich form, cau hinh rule, preview, submit
// 87-120  PreviewAccordion()                 Accordion hien thi tung ban preview
// 122-155 GenerationModeSelector()           Chon che do tao: rules / AI default / AI custom
// 157-210 AiModePreparationPanel()           Panel chuan bi AI direction + prompt
// 212-250 RuleEditor()                       Editor rule cho tung cau hoi trong form
// 252-280 Helper functions                   toBackendAiMode, buildAiAudienceJson, readAiDirection, ...
```

### Extractable Patterns (only when justified)

| Extract to | When |
|---|---|
| `_components/<Name>.tsx` | A child component is >=30 lines and conceptually self-contained |
| `_constants.ts` | 10+ related constants that form a configuration block |
| `_types.ts` | 5+ interfaces/types used across multiple components in the feature |
| `_helpers.ts` | 5+ pure utility functions with no React dependencies |
| `_hooks.ts` | 3+ custom hooks or a hook >=30 lines |

### Colocation Rules

- Extracted files live in the same folder as the page (colocation).
- Use `_` prefix convention for page-local modules: `_components/`, `_constants.ts`, `_types.ts`, `_helpers.ts`, `_hooks.ts`.
- Do not create empty extraction files "just in case".
- Extraction is optional: if the file is readable and the components are tightly coupled, a file map alone is sufficient.
- Keep the main `page.tsx` as the routing entry; do not move the default export.

### Rules

- The map must be kept up to date when components/functions are added, removed, or moved.
- Constants and types blocks can be grouped as single entries.
- Private helper functions shared across components can be grouped as one entry.
- The map is for human and AI readability; do not generate it at build time.
