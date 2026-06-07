# NCKH_PHASE_5_CLOSEOUT

## Mục đích

Ghi lại closeout evidence cho slice backend-only Data Collection & Normalization của NCKH Phase 5 đã được duyệt.

## Trạng thái closeout

Trạng thái: **Completed cho đúng scope backend-only Phase 5 đã duyệt, với live Google Forms response-read smoke bị blocked vì môi trường này không có Google credentials thật, response-read consent, và Google Form thật đã có submitted responses**.

Closeout này không claim production readiness cho live Google response collection cho đến khi validate bằng Google OAuth account thật có scope `https://www.googleapis.com/auth/forms.responses.readonly` và form có thể truy cập với responses thật.

## Tóm tắt implementation

Đã implement:

- `POST /api/v1/nckh/models/{modelId}/collect`
- `GET /api/v1/nckh/models/{modelId}/responses`
- `POST /api/v1/nckh/models/{modelId}/normalize`
- `GET /api/v1/nckh/models/{modelId}/dataset`
- stored-scope guard cho `https://www.googleapis.com/auth/forms.responses.readonly`
- `403 Forbidden` khi Google consent đã lưu thiếu Forms response-read permission
- integration method list responses của Google Forms
- lưu raw response và upsert idempotent theo `(ModelId, GoogleResponseId)`
- log mỗi lần thu thập qua `DataCollectionLogs`
- list raw response không expose full `RawDataJson`
- normalize từ Google question IDs đã mapping sang observed-code columns
- cột mean numeric Likert/Scale theo `{VariableCode}_mean`
- missing, blank, hoặc unparseable values lưu JSON null và cộng missing count
- đánh dấu normalized dataset stale khi biến hoặc mapping thay đổi

## Files Changed

Main implementation files:

- `src/FormAutoHub.Api/Contracts/NckhDtos.cs`
- `src/FormAutoHub.Api/Controllers/Nckh/ResearchDataController.cs`
- `src/FormAutoHub.Api/Services/Nckh/ResearchDataService.cs`
- `src/FormAutoHub.Api/Services/Nckh/ResearchFormService.cs`
- `src/FormAutoHub.Api/Integrations/Google/GoogleFormsApiService.cs`
- `src/FormAutoHub.Api/Program.cs`
- `src/FormAutoHub.Api/Entities/Nckh/SurveyResponse.cs`
- `src/FormAutoHub.Api/Entities/Nckh/NormalizedDataset.cs`
- `src/FormAutoHub.Api/Entities/Nckh/DataCollectionLog.cs`
- `src/FormAutoHub.Api/Entities/Nckh/ResearchModel.cs`
- `src/FormAutoHub.Api/Data/FormAutoHubDbContext.cs`
- `src/FormAutoHub.Api/Data/Migrations/20260604211823_NckhPhase5_DataCollectionNormalization.cs`
- `src/FormAutoHub.Api/Data/Migrations/20260604211823_NckhPhase5_DataCollectionNormalization.Designer.cs`
- `src/FormAutoHub.Api/Data/Migrations/FormAutoHubDbContextModelSnapshot.cs`
- `tests/FormAutoHub.Tests/FoundationTests.cs`
- `tests/FormAutoHub.Tests/NckhPhase5DataServiceTests.cs`

Documentation updates:

- `docs/ai/nckh/NCKH_PHASE_5_CLOSEOUT.md`
- `docs/vi/nckh/NCKH_PHASE_5_CLOSEOUT.md`
- `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/vi/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/vi/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/ai/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/vi/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/ai/nckh/NCKH_API_CONTRACT_GUIDE.md`
- `docs/vi/nckh/NCKH_API_CONTRACT_GUIDE.md`
- `docs/ai/nckh/NCKH_DOMAIN_ENTITIES_OVERVIEW.md`
- `docs/vi/nckh/NCKH_DOMAIN_ENTITIES_OVERVIEW.md`
- `docs/ai/AI_DOC_ROUTING_MATRIX.md`
- `docs/vi/AI_DOC_ROUTING_MATRIX.md`

## API Contract đã finalize

Endpoint đã implement:

- `POST /api/v1/nckh/models/{modelId}/collect`
- `GET /api/v1/nckh/models/{modelId}/responses?page=1&pageSize=20`
- `POST /api/v1/nckh/models/{modelId}/normalize`
- `GET /api/v1/nckh/models/{modelId}/dataset?page=1&pageSize=20`

Collection response:

```json
{
  "logId": "guid",
  "responsesCollected": 8,
  "responsesSkipped": 2,
  "status": "Success",
  "errorMessage": null
}
```

Normalization response:

```json
{
  "respondentsProcessed": 45,
  "variablesComputed": 3,
  "missingDataCount": 2,
  "staleDatasetsMarked": 0
}
```

Dataset response gồm:

- `columns`
- `hasStaleData`
- `items[].respondentId`
- `items[].values`
- `items[].isStale`
- `items[].normalizedAt`
- các field phân trang chuẩn

Status behavior:

- `400`: invalid request hoặc normalize khi chưa có observed mapping
- `401`: app authentication failure, Google account chưa linked, hoặc Google token unavailable
- `403`: thiếu `https://www.googleapis.com/auth/forms.responses.readonly`
- `404`: model/form không nằm trong current user scope
- `502`: Google Forms response API failure

## Database Contract đã finalize

Entity đã thêm:

### SurveyResponses

- `Id` GUID PK
- `ModelId` GUID FK đến `ResearchModels.Id`
- `GoogleResponseId` string
- `RespondentId` nullable string
- `RawDataJson` string
- `ResponseTimestamp` nullable `DateTimeOffset`
- `CreatedAt` `DateTimeOffset`
- `UpdatedAt` `DateTimeOffset`

Indexes:

- unique `(ModelId, GoogleResponseId)`
- `(ModelId, RespondentId)`
- `(ModelId, ResponseTimestamp)`

### NormalizedDatasets

- `Id` GUID PK
- `ModelId` GUID FK đến `ResearchModels.Id`
- `SurveyResponseId` GUID FK đến `SurveyResponses.Id`
- `RespondentId` nullable string
- `NormalizedDataJson` string
- `IsStale` bool default false
- `NormalizedAt` `DateTimeOffset`
- `CreatedAt` `DateTimeOffset`
- `UpdatedAt` `DateTimeOffset`

Indexes:

- unique `(ModelId, SurveyResponseId)`
- `(ModelId, RespondentId)`
- `(ModelId, IsStale)`
- `(ModelId, NormalizedAt)`

### DataCollectionLogs

- `Id` GUID PK
- `ModelId` GUID FK đến `ResearchModels.Id`
- `Status` string: `Success`, `Partial`, `Failed`
- `ResponsesCollected` int
- `ResponsesSkipped` int
- `ErrorMessage` nullable string
- `StartedAt` `DateTimeOffset`
- `CompletedAt` nullable `DateTimeOffset`
- `CreatedAt` `DateTimeOffset`

Indexes:

- `(ModelId, StartedAt)`
- `(ModelId, Status)`

Delete behavior:

- `ResearchModel -> SurveyResponses`: cascade
- `ResearchModel -> NormalizedDatasets`: cascade
- `ResearchModel -> DataCollectionLogs`: cascade
- `SurveyResponse -> NormalizedDatasets`: no-action để tránh multiple cascade paths

## Validation Performed

Verified:

- `dotnet build FormAutoHub.sln -c Release` pass.
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build` pass: 137 passed, 0 failed.
- EF Core database update đã apply mọi migration đến `20260604211823_NckhPhase5_DataCollectionNormalization` vào temporary LocalDB database `FormAutoHubNckhPhase5Smoke1`.
- Authenticated HTTP smoke pass trên `http://localhost:5235` với JWT thật từ `/api/auth/register` hoặc `/api/auth/login`.
- Runtime smoke seed NCKH form, model, question, variable, observed mapping, raw survey response, và Google external login thuộc user.
- Runtime smoke xác minh `POST /api/v1/nckh/models/{modelId}/collect` trả `403 Forbidden` với message cần re-consent response-read khi Google scope đã lưu thiếu `forms.responses.readonly`.
- Runtime smoke xác minh `GET /api/v1/nckh/models/{modelId}/responses` trả `200 OK` và không expose full `RawDataJson`.
- Runtime smoke xác minh `POST /api/v1/nckh/models/{modelId}/normalize` trả `200 OK` với một respondent được xử lý.
- Runtime smoke xác minh `GET /api/v1/nckh/models/{modelId}/dataset` trả `200 OK` với columns `RespondentId`, `SAT_1`, và `SAT_mean`.
- Đã inspect server logs sau smoke. Không thấy fatal error; EF có một query warning về multiple collection includes ở dataset listing.
- Smoke database tạm đã được drop và API smoke process đã được dừng sau validation.

## Validation Not Performed

Blocked:

- Live Google Forms response collection với `https://www.googleapis.com/auth/forms.responses.readonly`, vì môi trường này không có Google OAuth credential thật, response-read consent, và submitted Google Form responses.

Not run:

- Frontend build và Playwright smoke, vì Phase 5 backend-only và không đổi frontend file.
- Export-file validation, vì CSV/Excel/SPSS export vẫn Deferred.

## Scope Alignment

Giữ trong scope:

- endpoint backend-only manual collection
- Forms response-read scope guard
- raw response persistence và list endpoint
- collection logging
- endpoint normalize và dataset list
- stale dataset marking khi biến/mapping thay đổi
- EF Core migration cho các bảng Phase 5 đã duyệt

Giữ ngoài scope:

- Google Sheets collection
- CSV/Excel/SPSS export
- frontend expansion
- scheduled collection
- real-time sync
- Google Forms watches / Cloud Pub/Sub
- statistical analysis
- credit/pricing
- NCKH admin UI
- automatic response submission

## Residual Risks

- Payload shape live của Google Forms response phải được validate bằng credentials thật trước production use.
- `Partial` collection status được reserved trong contract đã duyệt, nhưng MVP path hiện tại gọi Google list như một external call thành công hoặc thất bại nguyên khối.
- Dataset listing log một EF multiple-collection include performance warning trong seeded smoke path; đây không phải lỗi correctness, nhưng nên review nếu payload dataset lớn.
- Raw response JSON có thể chứa dữ liệu cá nhân; default list endpoint không trả full raw payload, và các endpoint tương lai phải giữ boundary này.

## Candidate tiếp theo

Phase đề xuất tiếp theo: **NCKH Phase 6 - Export**.

Phase 6 vẫn proposed và cần approval riêng trước implementation.
