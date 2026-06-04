# NCKH_PHASE_2_CLOSEOUT

## Mục đích

Ghi lại closeout evidence cho NCKH Phase 2 để các lần làm sau bắt đầu từ repo truth đã validation, không dựa vào wording kickoff plan đã cũ.

## Quyết định

NCKH Phase 2 đã **Completed** cho đúng scope backend-only được duyệt.

Quyết định review cuối: **APPROVE**.

## Scope đã duyệt và đã giao

Đã implement:

- persistence và API cho `ResearchModel`
- persistence và API cho `ResearchVariable`
- persistence và API cho `ObservedQuestionMapping`
- cho phép nhiều model trên một imported form
- tối đa một model `Active` trên mỗi imported form
- activation rõ ràng `Draft -> Active`
- CRUD mapping qua endpoint riêng, không nested trong variable payload
- xóa model trong owned cascade path
- unique ở database cho active model, variable code, và mapping
- validation backend authenticated qua HTTP smoke

## File backend quan trọng

- `src/FormAutoHub.Api/Entities/Nckh/ResearchModel.cs`
- `src/FormAutoHub.Api/Entities/Nckh/ResearchVariable.cs`
- `src/FormAutoHub.Api/Entities/Nckh/ObservedQuestionMapping.cs`
- `src/FormAutoHub.Api/Data/FormAutoHubDbContext.cs`
- `src/FormAutoHub.Api/Data/Migrations/20260602193837_NckhPhase2_PersistenceFoundation.cs`
- `src/FormAutoHub.Api/Contracts/NckhDtos.cs`
- `src/FormAutoHub.Api/Controllers/Nckh/ResearchModelsController.cs`
- `src/FormAutoHub.Api/Controllers/Nckh/ResearchVariablesController.cs`
- `src/FormAutoHub.Api/Services/Nckh/ResearchModelService.cs`
- `src/FormAutoHub.Api/Services/Nckh/ResearchFormService.cs`
- `tests/FormAutoHub.Tests/NckhPhase2PersistenceTests.cs`
- `tests/FormAutoHub.Tests/NckhPhase2ModelApiTests.cs`
- `tests/FormAutoHub.Tests/NckhPhase2VariableMappingApiTests.cs`

## API surface đã implement

Endpoint model:

- `POST /api/v1/nckh/models`
- `GET /api/v1/nckh/models`
- `GET /api/v1/nckh/models/{modelId}`
- `PUT /api/v1/nckh/models/{modelId}`
- `POST /api/v1/nckh/models/{modelId}/activate`
- `DELETE /api/v1/nckh/models/{modelId}`

Endpoint variable:

- `POST /api/v1/nckh/models/{modelId}/variables`
- `GET /api/v1/nckh/models/{modelId}/variables`
- `PUT /api/v1/nckh/variables/{variableId}`
- `DELETE /api/v1/nckh/variables/{variableId}`

Endpoint mapping:

- `POST /api/v1/nckh/variables/{variableId}/mappings`
- `GET /api/v1/nckh/variables/{variableId}/mappings`
- `GET /api/v1/nckh/models/{modelId}/mappings`
- `PUT /api/v1/nckh/mappings/{mappingId}`
- `DELETE /api/v1/nckh/mappings/{mappingId}`

## Database contract đã implement

- `ResearchModels`
  - FK tới `Users`
  - FK tới `ResearchForms` với restrict/no-action delete về imported form
  - filtered unique index trên `FormId` khi `Status = 'Active'`
- `ResearchVariables`
  - FK tới `ResearchModels` với cascade delete
  - unique index trên `(ModelId, Code)`
- `ObservedQuestionMappings`
  - FK tới `ResearchVariables` với cascade delete
  - FK tới `ResearchFormQuestions` với restrict/no-action delete
  - unique index trên `(VariableId, FormQuestionId)`
  - unique index trên `(VariableId, ObservedCode)`

Migration reversible và chỉ tạo/xóa ba bảng Phase 2.

## Validation đã chạy

Verified:

- `dotnet test tests\FormAutoHub.Tests\FormAutoHub.Tests.csproj -c Release` đã pass: 122 passed, 0 failed.
- `dotnet build FormAutoHub.sln -c Release` đã pass.
- `dotnet ef database update` với `ASPNETCORE_ENVIRONMENT=Development` đã apply `20260602193837_NckhPhase2_PersistenceFoundation` thành công.
- Runtime API smoke đã pass trên `http://127.0.0.1:5097` với JWT thật từ `/api/auth/register`.
- Runtime smoke seed SQL một `ResearchForm` và một `ResearchFormQuestion` cho smoke user.
- Runtime smoke đã cover model create, list, detail, update, activate, và delete.
- Runtime smoke đã cover variable create, list, update, và delete.
- Runtime smoke đã cover mapping create, list theo variable, list theo model, update, và delete.
- Dữ liệu smoke đã được dọn sau validation.
- API process đã được dừng sau validation.

## Validation chưa chạy

Not run:

- frontend build cho pass closeout này, vì Phase 2 là backend-only và không có frontend file thuộc scope implementation Phase 2 hiện tại
- Playwright/browser smoke cho Phase 2, vì Phase 2 không implement frontend UI
- live Google OAuth hoặc live Google Forms import, vì Phase 2 không thay đổi behavior Google của Phase 1
- high-concurrency race testing cho các request activation đồng thời

## Boundary scope được giữ nguyên

Deferred / chưa implement trong Phase 2:

- lifecycle `Archived`
- `ModelRelation`
- `NodePosition`
- React Flow canvas
- Google Forms create/update
- Google Sheets response pull
- response collection
- normalization hoặc dataset generation
- CSV/Excel/SPSS export
- credit deduction hoặc pricing
- NCKH admin UI
- background jobs, watches, hoặc Pub/Sub
- dialog frontend xác nhận xóa

## Rủi ro còn lại

- Các dependent Phase 3+ sau này phải review lại delete behavior của model và variable trước khi thêm relations, node positions, datasets, exports, hoặc collected responses.
- Activation đồng thời dựa trên cả service pre-check và SQL Server filtered unique index; runtime smoke thông thường đã pass, nhưng chưa chạy riêng high-concurrency race testing.
- Frontend delete UX tương lai vẫn phải implement exact-name confirmation và impact-summary behavior đã duyệt trước khi expose thao tác xóa trong UI.

## Bước tiếp theo khuyến nghị

Candidate implementation tiếp theo là **NCKH Phase 3 - Canvas Relations & Hypothesis**.

Phase 3 vẫn **Deferred / Proposed** cho đến khi user approve rõ và hoàn tất contract/DB review.
