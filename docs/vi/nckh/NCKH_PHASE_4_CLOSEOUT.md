# NCKH_PHASE_4_CLOSEOUT

## Mục đích

Ghi lại closeout evidence cho slice backend-only Google Form Generation & Update của NCKH Phase 4 đã được duyệt.

## Trạng thái closeout

Trạng thái: **Completed cho đúng scope backend-only Phase 4 đã duyệt, với live Google Forms smoke bị blocked vì môi trường này không có Google credentials/write consent thật**.

Closeout này không claim production readiness cho live Google Forms create/update cho đến khi validate bằng Google OAuth account thật có scope `https://www.googleapis.com/auth/forms.body`.

## Tóm tắt implementation

Đã implement:

- `POST /api/v1/nckh/models/{modelId}/generate-form`
- request action values: `create`, `update`
- response fields: `formId`, `googleFormId`, `formUrl`, `questionsCreated`, `questionsUpdated`, `questionsDeleted`, `reimported`
- guard write-scope dựa trên Google OAuth scopes đã lưu
- `403 Forbidden` khi user chỉ có Forms read scope và cần re-consent Forms body write permission
- integration methods Google Forms API create và batch-update create-item
- tracking generated-form trên `ResearchForms`
- re-import/upsert cấu trúc Google Form generated hoặc updated sau khi Google write thành công
- sinh câu hỏi bảo thủ từ `ObservedQuestionMapping` và `ResearchFormQuestion` hiện có
- reject validation cho choice-style questions khi không có option metadata

## Files Changed

Main implementation files:

- `src/FormAutoHub.Api/Contracts/NckhDtos.cs`
- `src/FormAutoHub.Api/Controllers/Nckh/ResearchFormsController.cs`
- `src/FormAutoHub.Api/Services/Nckh/ResearchFormService.cs`
- `src/FormAutoHub.Api/Integrations/Google/GoogleFormsApiService.cs`
- `src/FormAutoHub.Api/Integrations/Google/GoogleOAuthService.cs`
- `src/FormAutoHub.Api/Entities/Nckh/ResearchForm.cs`
- `src/FormAutoHub.Api/Data/FormAutoHubDbContext.cs`
- `src/FormAutoHub.Api/Data/Migrations/20260604165518_NckhPhase4_FormGenerationTracking.cs`
- `src/FormAutoHub.Api/Data/Migrations/20260604165518_NckhPhase4_FormGenerationTracking.Designer.cs`
- `src/FormAutoHub.Api/Data/Migrations/FormAutoHubDbContextModelSnapshot.cs`
- `tests/FormAutoHub.Tests/NckhPhase4FormGenerationServiceTests.cs`

Related test compatibility updates:

- `tests/FormAutoHub.Tests/NckhPhase1OAuthAndFormsTests.cs`
- `tests/FormAutoHub.Tests/NckhPhase2VariableMappingApiTests.cs`
- `tests/FormAutoHub.Tests/NckhPhase3CanvasServiceTests.cs`

Documentation updates:

- `docs/ai/nckh/NCKH_PHASE_4_CLOSEOUT.md`
- `docs/vi/nckh/NCKH_PHASE_4_CLOSEOUT.md`
- `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/vi/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/vi/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/ai/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/vi/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/ai/nckh/NCKH_API_CONTRACT_GUIDE.md`
- `docs/vi/nckh/NCKH_API_CONTRACT_GUIDE.md`

## API Contract đã finalize

Endpoint đã implement:

- `POST /api/v1/nckh/models/{modelId}/generate-form`

Request:

```json
{
  "action": "create"
}
```

hoặc:

```json
{
  "action": "update"
}
```

Response:

```json
{
  "formId": "guid",
  "googleFormId": "google-form-id",
  "formUrl": "https://docs.google.com/forms/d/google-form-id/edit",
  "questionsCreated": 1,
  "questionsUpdated": 0,
  "questionsDeleted": 0,
  "reimported": true
}
```

Status behavior:

- `400`: invalid action, unsupported question type, hoặc model chưa sẵn sàng
- `401`: app authentication hoặc Google token unavailable
- `403`: thiếu Google Forms write scope hoặc target form không accessible để ghi
- `404`: model/form không nằm trong current user scope
- `409`: duplicate generated form hoặc unsafe conflict
- `502`: Google Forms API create/update/re-import failure

## Database Contract đã finalize

Thêm vào `ResearchForms`:

- `GeneratedFromModelId` nullable GUID FK đến `ResearchModels.Id`
- `GenerationSource` string default `Imported`
- `LastGeneratedAt` nullable `DateTimeOffset`
- `LastSyncedAt` nullable `DateTimeOffset`

Delete behavior:

- `GeneratedFromModelId -> ResearchModels`: restrict/no-action

Indexes:

- `(UserId, GeneratedFromModelId)`
- FK index do EF tạo trên `GeneratedFromModelId`

## Validation Performed

Verified:

- `dotnet build FormAutoHub.sln -c Release` pass.
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build` pass: 133 passed, 0 failed.
- EF Core database update đã apply `20260604165518_NckhPhase4_FormGenerationTracking` vào temporary LocalDB database `FormAutoHubNckhPhase4Smoke2`.
- Authenticated HTTP smoke pass trên `http://127.0.0.1:5103` với JWT thật từ `/api/auth/register`.
- Runtime smoke seed model, variable, question, observed mapping, và Google login thuộc user với readonly Forms scope.
- Runtime smoke xác minh `POST /api/v1/nckh/models/{modelId}/generate-form` trả `403 Forbidden` với message cần re-consent khi thiếu write scope.
- Đã inspect server logs sau smoke; không thấy exception. Warning duy nhất được ghi nhận là local HTTPS redirect detection khi smoke qua HTTP.
- Smoke databases tạm đã được drop và API smoke process đã dừng.

## Validation Not Performed

Blocked:

- Live Google Forms create/update smoke với `https://www.googleapis.com/auth/forms.body`, vì môi trường này không có Google OAuth credential/write-consented account thật.
- Validate publish/response availability cho form tạo sau 2026-06-30, vì cần Google Forms API credentials thật và generated form thật.

Not run:

- Frontend build và Playwright smoke, vì Phase 4 backend-only và không đổi frontend file.

## Scope Alignment

Giữ trong scope:

- route backend-only Google Form create/update
- write-scope guard
- generated-form tracking fields tối thiểu
- sinh câu hỏi bảo thủ từ mapping data đã duyệt
- re-import/upsert sau khi Google write thành công

Giữ ngoài scope:

- Google Sheets response pull
- response collection
- normalization/export
- statistical analysis
- credit/pricing
- admin UI NCKH
- React Flow/frontend expansion
- scheduled jobs
- Google Forms watches / Cloud Pub/Sub
- AI-generated questionnaire text
- automatic response submission

## Residual Risks

- Payload shape live của Google Forms phải được verify bằng credentials thật trước production use.
- Update behavior hiện append mapped questions và re-import structure; không xóa unmatched existing Google questions.
- Choice-style question generation vẫn bị chặn cho đến khi option metadata được model/import.
- Google Forms tạo bằng API sau 2026-06-30 có thể mặc định unpublished; cần live validation trước khi claim form sẵn sàng nhận response ngay.

## Candidate tiếp theo

Phase đề xuất tiếp theo: **NCKH Phase 5 - Data Collection + Normalization**.

Phase 5 vẫn proposed và cần approval riêng cùng Google Sheets scope review.
