# NCKH_ARCHITECTURE_BOUNDARIES

## Purpose

Định nghĩa layer responsibilities và forbidden ownership cho NCKH Survey Module.

## Confirmed Architecture Direction

- Backend: ASP.NET Core Web API .NET 9 (dùng chung FormAuto Hub solution)
- API style: controller-based REST API
- Database: SQL Server (dùng chung FormAuto Hub database)
- ORM: Entity Framework Core with migrations
- Frontend: Next.js web dashboard (dùng chung apps/web)
- UI framework: shadcn/ui + Tailwind CSS
- Auth: JWT access tokens (tái sử dụng FormAuto Hub Auth)

## Layer Responsibilities

### Controllers (NCKH)

Own:
- route binding cho tất cả NCKH endpoints
- request DTO input validation
- response DTO output
- HTTP status mapping
- [Authorize] attribute + role checks

Must not own:
- Google API call logic
- data normalization logic
- export file generation
- EF Core query composition

### Services (NCKH)

Own:
- NCKH business workflows
- Google API orchestration
- data normalization engine
- export file generation
- hypothesis auto-generation
- transaction boundaries

Must not return framework-specific HTTP results.

### EF Core DbContext

Own:
- NCKH entity sets (10 entities)
- migration-backed schema changes
- transaction integration

Must not contain business decisions.

### Entities (NCKH)

Own persisted domain state.

Must not:
- call Google APIs
- know about HTTP
- perform file I/O for export

### DTOs (NCKH)

Own API request/response contracts.

### Integration Services (NCKH)

Own external calls to Google Forms API, Google Sheets API, Google OAuth.

Deferred: Google Forms watches, Google Cloud Pub/Sub, background jobs.



## DbContext Configuration Rules (Mandatory)

When adding NCKH entities to `FormAutoHubDbContext.OnModelCreating`, the following DeleteBehavior rules MUST be applied:

| Entity | FK | DeleteBehavior | Reason |
|---|---|---|---|
| ObservedQuestionMappings | FormQuestionId → ResearchFormQuestions | **Restrict** | Prevent mapping loss on form re-import |
| ModelRelations | FromVariableId → ResearchVariables | **Restrict** | Prevent relation loss on variable delete |
| ModelRelations | ToVariableId → ResearchVariables | **Restrict** | Same — dual FK to same table |
| ModelRelations | ModelId → ResearchModels | **Cascade** | Delete model → delete all relations |
| ResearchVariables | ModelId → ResearchModels | **Cascade** | Delete model → delete all variables |
| ObservedQuestionMappings | VariableId → ResearchVariables | **Cascade** | Delete variable → delete its mappings |
| NodePositions | VariableId → ResearchVariables | **Restrict / NoAction** | SQL Server multiple-cascade-path avoidance; service deletes variable positions before allowed variable delete |
| NodePositions | RelationId → ModelRelations | **Cascade** | Delete relation → delete its position |

**Dual-FK to same table:** `ModelRelations` has two FKs to `ResearchVariables`. Both navigation properties MUST be explicitly configured with `HasForeignKey()` in `OnModelCreating`. Missing this configuration will cause `dotnet ef migrations add` to fail.

**CHECK constraint:** `NodePositions` requires a CHECK constraint validating that only one of `VariableId`/`RelationId` is set. EF Core table check-constraint configuration is acceptable when it produces the SQL Server constraint in migration output.

**SQL Server cascade-path rule:** Phase 3 uses restrict/no-action on `NodePositions.ModelId` and `NodePositions.VariableId` to avoid SQL Server multiple cascade paths. Cleanup that cannot be represented safely as DB cascade is owned by the NCKH service layer.

## Namespace Convention

- NCKH entities: `FormAutoHub.Api.Entities.Nckh`
- NCKH services: `FormAutoHub.Api.Services.Nckh`
- NCKH controllers: `FormAutoHub.Api.Controllers.Nckh` (or route prefix `/api/v1/nckh`)
- NCKH DTOs: `FormAutoHub.Api.DTOs.Nckh`
- Google integrations: `FormAutoHub.Api.Integrations.Google`

This keeps NCKH code visually separated from FormAuto Hub code and prevents accidental coupling.



NCKH module dùng chung `FormAutoHubDbContext` với FormAuto Hub (single database, single DbContext).

- NCKH entity sets được thêm trực tiếp vào `FormAutoHubDbContext`
- NCKH migrations sống trong cùng `Data/Migrations/` folder
- Migration naming convention: `NckhPhase{number}_{Description}`

Risk: NCKH migration phụ thuộc vào tất cả FAH migration trước. Luôn pull FAH migration mới nhất trước khi tạo NCKH migration.

Deferred: Separate `NckhDbContext` — cân nhắc nếu sau này NCKH cần database riêng.

## Data Integrity Rules

- Hard delete Model: cascade xóa Variables → Mappings → Relations → NodePositions. SurveyResponses và NormalizedDatasets được giữ lại.
- Sửa Variable khi đã có data: `NormalizedDatasets.IsStale = true` — yêu cầu re-normalize.
- Archived Model: read-only, không cho phép sửa biến/quan hệ, không cho phép collect data.



- Google Forms integration must not be mixed into model/variable services.
- Data normalization must go through DataNormalization, not DataCollection.
- Export file generation must not depend on Google API state.
- Google OAuth tokens must be encrypted at rest, never exposed in DTOs.
- Google API keys/secrets must not be stored in source-controlled configuration.
- NCKH entities must not leak into FormAuto Hub controllers or services.
- FormAuto Hub entities (CreditTransactions, UsageLogs, SubmissionJobs) must not leak into NCKH.

## NCKH-FormAuto Hub Boundary

```
FormAuto Hub                    NCKH Module
─────────────────────────────────────────────
Auth (shared)          ───►    NCKH Controllers
Users (shared)         ───►    NCKH Services
UserExternalLogins     ───►    NCKH Entities
                                NCKH Migrations
                                Google Integrations
                                Export Engine
```

Shared: Auth, Users, UserExternalLogins, JWT pipeline, DbContext (extended).
Separate: All NCKH entities, services, controllers, DTOs, migrations.
Forbidden: NCKH code in FormAuto Hub services; FormAuto Hub entities in NCKH services.

## Deferred Integrations

The following must remain Deferred until approved:
- Google Forms watches / Cloud Pub/Sub
- Background job framework for scheduled data collection
- AI-powered hypothesis generation
- Real-time data sync
- Payment/credit integration for NCKH
