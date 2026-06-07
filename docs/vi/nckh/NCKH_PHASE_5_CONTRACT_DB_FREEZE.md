# NCKH_PHASE_5_CONTRACT_DB_FREEZE

## Mục đích

Ghi lại review Pass 0 về contract, Google response-read scope, và database freeze cho NCKH Phase 5 trước khi bắt đầu production implementation.

File này là artifact review và approval. Nó không đánh dấu Phase 5 là đã implement hoặc completed.

## Kết quả review

Trạng thái: **Ready for explicit Phase 5 implementation approval after user accepts the freeze decisions below**.

Phase 5 chỉ được chuyển sang implementation sau khi freeze này được chấp nhận. Cho đến lúc đó, response collection routes, DTOs, Google response-read scope, collection statuses, normalization behavior, và persistence changes vẫn là proposed.

## Source evidence đã đọc

- `NCKH_PROGRESS_LEDGER.md`
- `NCKH_PHASE_TRANSITION_GUIDE.md`
- `NCKH_PHASE_ROADMAP.md`
- `NCKH_PHASE_4_CLOSEOUT.md`
- `NCKH_PHASE_5_KICKOFF_PLAN.md`
- `NCKH_REQUIREMENT_PACKAGE.md`
- `NCKH_DOMAIN_ENTITIES_OVERVIEW.md`
- `NCKH_API_CONTRACT_GUIDE.md`
- `NCKH_MODULE_MAP.md`
- `NCKH_ARCHITECTURE_BOUNDARIES.md`
- Official Google Forms API response docs cho response-read scope review
- Official Google Sheets API scope docs cho Sheets-read alternative review

## Baseline confirmed hiện tại

- NCKH Phase 1, Phase 2, Phase 3, và Phase 4 đã completed cho đúng phạm vi được duyệt.
- Route prefix hiện có là `/api/v1/nckh`.
- Phase 1 có Google Forms read/import behavior.
- Phase 2 có model, variable, và observed mapping behavior.
- Phase 3 có relation, node-position, và deterministic hypothesis behavior.
- Phase 4 có backend Google Form generation/update behavior.
- `ResearchModel.Status` hiện implement chỉ có `Draft` và `Active`.
- `Archived` vẫn Deferred.
- Phase 5 không được thêm export, frontend expansion, scheduled jobs, watches, Pub/Sub, credit, admin UI, hoặc statistical analysis.

## Google scope review

Approval status: **Proposed for Phase 5 implementation approval**.

Preferred response-read scope:

- `https://www.googleapis.com/auth/forms.responses.readonly`

Lý do:

- Google Forms API `forms.responses.list` và `forms.responses.get` lấy form responses và tránh yêu cầu discovery spreadsheet file cho Phase 5 MVP.

Alternative Sheets-read scope nếu implementation chọn linked response spreadsheets:

- `https://www.googleapis.com/auth/spreadsheets.readonly`

Rules:

- Scope chỉ được request qua Google consent rõ từ user.
- Implementation không được âm thầm giả định consent Forms body read của Phase 1 hoặc Forms body write của Phase 4 bao gồm response-read permission.
- Nếu Google token đã lưu thiếu scope Phase 5 đã duyệt, API phải trả lỗi cần re-consent rõ thay vì cố collect responses.
- MVP Phase 5 nên dùng Forms responses API trừ khi approval sau này chọn rõ path Sheets.
- Google Sheets write scope vẫn Deferred.
- Drive-wide scopes vẫn Deferred trừ khi approval sau này chứng minh là cần.

Scope risk notes:

- Google Sheets scopes áp dụng cho spreadsheet files và không giới hạn tự nhiên vào một sheet; vì vậy freeze ưu tiên path Forms responses API hẹp hơn cho Phase 5 MVP.
- Live validation vẫn cần Google OAuth account thật có response-read scope đã duyệt và Google Form có submitted responses.

## Freeze decision: Route surface Phase 5

Approval status: **Proposed for Phase 5 implementation approval**.

### Collect Responses

Endpoint:

- `POST /api/v1/nckh/models/{modelId}/collect`

Request:

```json
{}
```

Response 200:

```json
{
  "logId": "guid",
  "responsesCollected": 8,
  "responsesSkipped": 2,
  "status": "Success",
  "errorMessage": null
}
```

Allowed status values:

- `Success`
- `Partial`
- `Failed`

Expected status mapping:

- `400` validation failure hoặc model chưa sẵn sàng để collect
- `401` unauthenticated hoặc Google account chưa linked/token unavailable
- `403` thiếu response-read scope đã duyệt hoặc target form không readable
- `404` không tìm thấy model/form trong scope current user
- `409` stale mapping conflict không an toàn cho collection đáng tin cậy
- `502` Google response API failure

### List Raw Responses

Endpoint:

- `GET /api/v1/nckh/models/{modelId}/responses?page=1&pageSize=20`

Response 200:

```json
{
  "items": [
    {
      "id": "guid",
      "googleResponseId": "response-id",
      "respondentId": "respondent-id-or-null",
      "responseTimestamp": "2026-06-05T10:00:00Z",
      "createdAt": "2026-06-05T10:05:00Z",
      "updatedAt": "2026-06-05T10:05:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalItems": 1,
  "totalPages": 1
}
```

Raw payload exposure rule:

- Không trả full `RawDataJson` trong list responses mặc định.

### Normalize Data

Endpoint:

- `POST /api/v1/nckh/models/{modelId}/normalize`

Request:

```json
{}
```

Response 200:

```json
{
  "respondentsProcessed": 45,
  "variablesComputed": 3,
  "missingDataCount": 2,
  "staleDatasetsMarked": 0
}
```

### List Normalized Dataset

Endpoint:

- `GET /api/v1/nckh/models/{modelId}/dataset?page=1&pageSize=20`

Response 200:

```json
{
  "columns": ["RespondentId", "TH1", "TH2", "TH_mean"],
  "hasStaleData": false,
  "items": [
    {
      "respondentId": "respondent-id-or-null",
      "values": {
        "TH1": 5,
        "TH2": 4,
        "TH_mean": 4.5
      },
      "isStale": false,
      "normalizedAt": "2026-06-05T10:10:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalItems": 1,
  "totalPages": 1
}
```

Pagination:

- Dùng chuẩn page/pageSize/totalItems/totalPages hiện có.
- Clamp `pageSize` trong khoảng `1..100`.

## Freeze decision: Ownership and model readiness

Approval status: **Proposed for Phase 5 implementation approval**.

Rules:

- Model phải thuộc current authenticated user.
- Form của model phải thuộc cùng user.
- Collection được phép cho `Draft` và `Active` models.
- Model phải có ít nhất một observed mapping trước khi normalize.
- Collection có thể thành công trước khi mappings hoàn chỉnh, vì raw response storage không yêu cầu tất cả câu hỏi đã mapped.
- Normalization chỉ xử lý mapped questions.

## Freeze decision: Collection behavior

Approval status: **Proposed for Phase 5 implementation approval**.

Rules:

- Collection chỉ là manual.
- Mỗi collection attempt ghi một `DataCollectionLog`.
- Responses được upsert idempotently theo `(ModelId, GoogleResponseId)`.
- Unchanged duplicate responses được skip và tính vào `responsesSkipped`.
- Partial Google failures có thể giữ responses đã collect thành công và mark log là `Partial`.
- Failed collection không được tạo fake response rows.
- Không cho phép tự động submit form.

## Freeze decision: Normalization behavior

Approval status: **Proposed for Phase 5 implementation approval**.

Rules:

- Raw responses là source of truth.
- Normalized rows được regenerate/upsert theo `(ModelId, RespondentId)`.
- Output columns dùng observed codes từ `ObservedQuestionMapping.ObservedCode`.
- Variable mean columns dùng `{VariableCode}_mean`.
- Likert means là arithmetic mean đơn giản trên non-null numeric observed values.
- Missing, blank, hoặc unparseable values lưu JSON null và được đếm là missing data.
- Nominal và ordinal values được giữ như normalized answer values; không tự invent statistical encoding trong Phase 5.
- Không chạy Cronbach Alpha, EFA, regression, T-test, ANOVA, hoặc phân tích thống kê khác.

## Freeze decision: Stale dataset behavior

Approval status: **Proposed for Phase 5 implementation approval**.

Rules:

- Nếu variable hoặc mapping definitions thay đổi sau khi đã có normalized rows, affected normalized rows phải được mark stale trước hoặc trong write thay đổi mappings/variables.
- Implementation Phase 5 có thể thêm minimal stale-marking calls vào existing variable/mapping update/delete flows.
- `normalize` có thể regenerate rows từ raw responses và set `IsStale = false` cho rows được recompute.
- Dataset list phải expose `hasStaleData`.

## Freeze decision: Persistence

Approval status: **Proposed for Phase 5 implementation approval**.

Approved new entities nếu implementation xác nhận chưa tồn tại và cần thiết:

### SurveyResponse

- `Id` GUID PK
- `ModelId` GUID FK đến `ResearchModels.Id`
- `GoogleResponseId` string
- `RespondentId` string nullable
- `RawDataJson` nvarchar(max)
- `ResponseTimestamp` nullable `DateTimeOffset`
- `CreatedAt` `DateTimeOffset`
- `UpdatedAt` `DateTimeOffset`

Indexes:

- unique `(ModelId, GoogleResponseId)`
- `(ModelId, RespondentId)`
- `(ModelId, ResponseTimestamp)`

### NormalizedDataset

- `Id` GUID PK
- `ModelId` GUID FK đến `ResearchModels.Id`
- `SurveyResponseId` GUID FK đến `SurveyResponses.Id`
- `RespondentId` string nullable
- `NormalizedDataJson` nvarchar(max)
- `IsStale` bool default false
- `NormalizedAt` `DateTimeOffset`
- `CreatedAt` `DateTimeOffset`
- `UpdatedAt` `DateTimeOffset`

Indexes:

- unique `(ModelId, SurveyResponseId)`
- `(ModelId, RespondentId)`
- `(ModelId, IsStale)`
- `(ModelId, NormalizedAt)`

### DataCollectionLog

- `Id` GUID PK
- `ModelId` GUID FK đến `ResearchModels.Id`
- `Status` string allowed values: `Success`, `Partial`, `Failed`
- `ResponsesCollected` int
- `ResponsesSkipped` int
- `ErrorMessage` string nullable
- `StartedAt` `DateTimeOffset`
- `CompletedAt` nullable `DateTimeOffset`
- `CreatedAt` `DateTimeOffset`

Indexes:

- `(ModelId, StartedAt)`
- `(ModelId, Status)`

Delete behavior:

- `ResearchModel -> SurveyResponses`: cho phép cascade delete vì data Phase 5 thuộc model do user sở hữu.
- `ResearchModel -> NormalizedDatasets`: cho phép cascade delete.
- `ResearchModel -> DataCollectionLogs`: cho phép cascade delete.
- `SurveyResponse -> NormalizedDatasets`: ưu tiên restrict/no-action để tránh multiple cascade paths; nếu cần xóa raw response thì xóa normalized rows rõ ràng trước.

DB risk notes:

- JSON storage chấp nhận được cho Phase 5 MVP vì normalized schema phụ thuộc từng model và export chưa implement trong phase này.
- Tránh query bên trong JSON trong Phase 5; list endpoints paginate rows và parse JSON trong service code khi cần.
- Migration phải reversible và không thay đổi semantics Phase 1/2/3/4.

## Implementation safeguards bắt buộc

- Giữ Google response integration ngoài model/variable services.
- Controllers chỉ xử lý HTTP; services xử lý workflow và validation orchestration.
- Không trả Google tokens hoặc secrets trong DTO responses.
- Không thêm model lifecycle status mới.
- Không thêm export files hoặc export endpoints.
- Không thêm scheduled/background behavior.
- Không tự động submit response.
- Raw response data có thể chứa personal data; tránh trả full raw JSON trong list responses mặc định.

## Deferred

- export CSV/Excel/SPSS
- frontend expansion
- scheduled data collection
- real-time sync
- Google Forms watches / Cloud Pub/Sub
- statistical analysis
- credit/pricing
- NCKH admin UI
- multi-researcher collaboration
- automatic response submission
- production-readiness claims khi chưa có runtime validation hiện tại

## Cần approval trước implementation

Approve hoặc revise các freeze decisions sau trước khi giao implementation worker:

- preferred Google response-read scope: `https://www.googleapis.com/auth/forms.responses.readonly`
- route surface: collect, responses, normalize, dataset
- collection statuses: `Success`, `Partial`, `Failed`
- manual-only collection
- idempotency theo `(ModelId, GoogleResponseId)`
- persistence fields cho raw response, normalized dataset, và collection log
- stale dataset behavior khi variables/mappings thay đổi
- normalization rules và missing-data behavior

## Pass tiếp theo nếu được approve

Chỉ chuyển sang **Phase 5 Pass 1 - Google Response Collection Integration** sau khi freeze này được chấp nhận rõ.
