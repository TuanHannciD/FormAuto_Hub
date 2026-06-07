# NCKH_PHASE_3_CLOSEOUT

## Mục đích

Ghi lại evidence closeout cho NCKH Phase 3 để các lần làm sau bắt đầu từ repo truth đã validate thay vì chỉ dựa vào kickoff hoặc freeze wording.

## Quyết định

NCKH Phase 3 đã **Completed** cho đúng scope backend-only Canvas Relations & Hypothesis đã được duyệt.

Quyết định implementation cuối: **APPROVE WITH DOCUMENTED SQL Server DELETE-BEHAVIOR ADJUSTMENT**.

## Scope đã duyệt và đã giao

Đã implement:

- Persistence và API cho `ModelRelation`.
- Persistence và API cho `NodePosition`.
- Relation CRUD dưới `/api/v1/nckh`.
- Save/load node positions dưới `/api/v1/nckh`.
- Sinh hypothesis code/text deterministic.
- `Direction` chỉ nhận: `Positive`, `Negative`.
- Validate biến cùng model.
- Reject self-relation.
- Reject duplicate directed relation theo `(ModelId, FromVariableId, ToVariableId)`.
- Cho phép inverse directed relation.
- Guard chỉ cho sửa relations và positions khi model còn `Draft`.
- Chặn xóa variable khi relation còn tham chiếu variable đó.
- Dọn variable node-position trước khi xóa variable hợp lệ.

## Backend files đáng chú ý

- `src/FormAutoHub.Api/Entities/Nckh/ModelRelation.cs`
- `src/FormAutoHub.Api/Entities/Nckh/NodePosition.cs`
- `src/FormAutoHub.Api/Entities/Nckh/ResearchModel.cs`
- `src/FormAutoHub.Api/Entities/Nckh/ResearchVariable.cs`
- `src/FormAutoHub.Api/Data/FormAutoHubDbContext.cs`
- `src/FormAutoHub.Api/Data/Migrations/20260604131107_NckhPhase3_CanvasRelations.cs`
- `src/FormAutoHub.Api/Contracts/NckhDtos.cs`
- `src/FormAutoHub.Api/Controllers/Nckh/ResearchCanvasController.cs`
- `src/FormAutoHub.Api/Services/Nckh/ResearchCanvasService.cs`
- `src/FormAutoHub.Api/Services/Nckh/ResearchFormService.cs`
- `src/FormAutoHub.Api/Program.cs`
- `tests/FormAutoHub.Tests/NckhPhase3PersistenceTests.cs`
- `tests/FormAutoHub.Tests/NckhPhase3CanvasServiceTests.cs`
- `tests/FormAutoHub.Tests/FoundationTests.cs`

## API surface đã implement

Relation endpoints:

- `POST /api/v1/nckh/models/{modelId}/relations`
- `GET /api/v1/nckh/models/{modelId}/relations`
- `GET /api/v1/nckh/relations/{relationId}`
- `PUT /api/v1/nckh/relations/{relationId}`
- `DELETE /api/v1/nckh/relations/{relationId}`

Node position endpoints:

- `GET /api/v1/nckh/models/{modelId}/positions`
- `PUT /api/v1/nckh/models/{modelId}/positions`

## Database contract đã implement

- `ModelRelations`
  - FK tới `ResearchModels` với cascade delete.
  - FK `FromVariableId -> ResearchVariables` với restrict/no-action delete.
  - FK `ToVariableId -> ResearchVariables` với restrict/no-action delete.
  - Unique index trên `(ModelId, FromVariableId, ToVariableId)`.
  - Unique index trên `(ModelId, HypothesisCode)`.
  - Check constraint reject self-relation.
- `NodePositions`
  - FK tới `ResearchModels` với restrict/no-action delete.
  - FK tới `ResearchVariables` với restrict/no-action delete.
  - FK tới `ModelRelations` với cascade delete.
  - Filtered unique indexes tương thích SQL Server cho variable và relation node positions.
  - Check constraint bắt buộc đúng một trong hai field `VariableId` hoặc `RelationId`.
  - `PositionX` và `PositionY` lưu dạng decimal `(18, 2)`.

## Điều chỉnh delete behavior đã được approve cho SQL Server

Freeze Phase 3 ban đầu đề xuất cascade delete cho cả ba parent của `NodePosition`. SQL Server reject schema đó vì lỗi multiple cascade paths khi chạy `dotnet ef database update`.

Điều chỉnh implementation đã được approve:

- Giữ `ModelRelation.ModelId -> ResearchModels` là cascade.
- Giữ `NodePosition.RelationId -> ModelRelations` là cascade.
- Dùng restrict/no-action cho `NodePosition.ModelId -> ResearchModels`.
- Dùng restrict/no-action cho `NodePosition.VariableId -> ResearchVariables`.
- Giữ behavior xóa variable trong service bằng cách xóa variable node positions trước khi remove variable, sau khi xác nhận không còn relation tham chiếu variable đó.

Điều chỉnh này tránh multiple cascade paths của SQL Server nhưng vẫn giữ ownership và cleanup behavior của Phase 3.

## Validation đã thực hiện

Verified:

- `dotnet build FormAutoHub.sln -c Release` passed.
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build` passed: 129 passed, 0 failed.
- `dotnet ef database update --configuration Release --project src/FormAutoHub.Api/FormAutoHub.Api.csproj --startup-project src/FormAutoHub.Api/FormAutoHub.Api.csproj` đã apply migration `20260604131107_NckhPhase3_CanvasRelations` vào temporary LocalDB database `FormAutoHubNckhPhase3Smoke3`.
- Authenticated HTTP smoke passed trên `http://127.0.0.1:5101` với JWT thật từ `/api/auth/register`.
- Runtime smoke đã SQL-seed một `ResearchForm`, một `ResearchModel`, và hai `ResearchVariables` cho smoke user.
- Runtime smoke cover create, list, detail, update, delete relation.
- Runtime smoke cover save và load node positions cho variable node và relation node.
- Runtime smoke verify deterministic hypothesis output.
- API process đã được dừng sau validation.
- Temporary LocalDB smoke databases đã được drop sau validation.
- Đã inspect server log tail sau smoke checks và không thấy `fail:` hoặc unhandled exception.

## Validation chưa thực hiện

Not run:

- frontend build, vì Phase 3 là backend-only và không đổi frontend files.
- Playwright/browser smoke, vì Phase 3 không implement frontend UI.
- live Google OAuth hoặc live Google Forms import, vì Phase 3 không thay đổi behavior Google của Phase 1.
- high-concurrency relation creation race testing.

## Scope boundaries đã giữ

Deferred / không implement trong Phase 3:

- lifecycle `Archived`
- hypothesis text do AI generate
- statistical analysis
- Google Forms create/update
- Google Sheets response pull
- response collection
- normalization/export
- credit/pricing
- NCKH admin UI
- React Flow/frontend canvas implementation
- production background jobs, watches, hoặc Pub/Sub

## Rủi ro còn lại

- Concurrent relation creation vẫn có thể race ở `HypothesisCode`; unique index ở database bảo vệ integrity, nhưng retry behavior cho high-concurrency chưa được harden riêng trong phase này.
- Frontend canvas behavior chưa implement cho đến khi có frontend phase được approve sau này.
- Phase 4+ không được diễn giải relation/hypothesis data như output statistical analysis.

## Bước tiếp theo đề xuất

Candidate implementation tiếp theo là **NCKH Phase 4 - Form Generation & Update**, nhưng vẫn ở trạng thái Proposed và cần approval rõ cùng review Google Forms write-scope trước khi implementation.
