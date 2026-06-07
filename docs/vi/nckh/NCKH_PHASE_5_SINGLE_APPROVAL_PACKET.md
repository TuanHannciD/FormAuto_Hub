# NCKH_PHASE_5_SINGLE_APPROVAL_PACKET

## Mục đích

Gom các approval còn lại của NCKH Phase 5 vào một quyết định để implementation sub-agents có thể làm mà không dừng lại hỏi lại các lựa chọn contract, Google scope, database, collection, hoặc normalization đã review.

File này là approval packet. Nó không đánh dấu Phase 5 là đã implement hoặc completed.

## One-time approval statement

Nếu user approve packet này, các mục sau được duyệt làm baseline implementation Phase 5:

- Mở NCKH Phase 5 implementation cho Data Collection & Normalization backend-only.
- Dùng `NCKH_PHASE_5_CONTRACT_DB_FREEZE.md` làm baseline authoritative cho contract, Google scope, và DB freeze Phase 5.
- Chỉ implement manual response collection, raw response listing, normalization, và normalized dataset listing.
- Ưu tiên Google Forms responses API với `https://www.googleapis.com/auth/forms.responses.readonly` cho Phase 5 MVP.
- Giữ implementation backend-only trừ khi approval rõ sau này mở frontend work.

## Decisions approved by this packet

### Google Scope Contract

- Preferred response-read scope: `https://www.googleapis.com/auth/forms.responses.readonly`.
- Consent Forms body read của Phase 1 và Forms body write của Phase 4 không được xem là response-read consent.
- Nếu Google token đã lưu thiếu scope Phase 5 đã duyệt, trả lỗi cần re-consent.
- `https://www.googleapis.com/auth/spreadsheets.readonly` vẫn là path thay thế chỉ khi approval sau này chọn rõ linked Google Sheets collection.
- Google Sheets write scope và Drive-wide scopes vẫn Deferred.

### API Contract

Approved backend-only endpoints:

- `POST /api/v1/nckh/models/{modelId}/collect`
- `GET /api/v1/nckh/models/{modelId}/responses`
- `POST /api/v1/nckh/models/{modelId}/normalize`
- `GET /api/v1/nckh/models/{modelId}/dataset`

Collection response includes:

- `logId`
- `responsesCollected`
- `responsesSkipped`
- `status`
- `errorMessage`

Normalization response includes:

- `respondentsProcessed`
- `variablesComputed`
- `missingDataCount`
- `staleDatasetsMarked`

### Ownership And Readiness Contract

- Model phải thuộc current authenticated user.
- Form phải thuộc cùng user.
- Collection được phép cho `Draft` và `Active` models.
- Collection có thể lưu raw responses trước khi mappings hoàn chỉnh.
- Normalization yêu cầu ít nhất một observed mapping.
- Normalization chỉ xử lý mapped questions.

### Collection Contract

- Collection chỉ là manual.
- Mỗi attempt ghi một `DataCollectionLog`.
- Raw responses upsert idempotently theo `(ModelId, GoogleResponseId)`.
- Unchanged duplicates được skip.
- Partial Google failures có thể giữ successful rows và mark log `Partial`.
- Failed collection không được tạo fake response rows.
- Không tự động submit response.

### Normalization Contract

- Raw responses là source of truth.
- Normalized rows được upsert theo `(ModelId, SurveyResponseId)`.
- Observed columns dùng `ObservedQuestionMapping.ObservedCode`.
- Variable mean columns dùng `{VariableCode}_mean`.
- Likert means dùng arithmetic mean đơn giản trên non-null numeric observed values.
- Missing, blank, hoặc unparseable values lưu JSON null và được đếm.
- Nominal và ordinal values được giữ lại mà không invent statistical encoding.
- Statistical analysis vẫn Deferred.

### Persistence Contract

Approved new entities nếu implementation xác nhận chưa tồn tại và cần thiết:

- `SurveyResponse`
- `NormalizedDataset`
- `DataCollectionLog`

Approved key constraints:

- unique `(ModelId, GoogleResponseId)` trên `SurveyResponses`
- unique `(ModelId, SurveyResponseId)` trên `NormalizedDatasets`
- collection log status values: `Success`, `Partial`, `Failed`
- model-owned cascade cho Phase 5 data tables
- restrict/no-action từ `SurveyResponse` đến `NormalizedDataset` nếu cần tránh multiple cascade paths

### Stale Dataset Contract

- Thay đổi variable hoặc mapping sau khi đã có normalized data phải mark affected normalized rows stale.
- `normalize` có thể regenerate rows từ raw responses và clear stale state cho recomputed rows.
- Dataset listing phải expose stale data có tồn tại hay không.

## Approved sub-agent flow

Đi theo thứ tự:

1. Google response collection integration workflow
2. API route và DTO implementation
3. Approved persistence changes và collection logging
4. Normalization service và dataset listing
5. Validation và closeout docs
6. Final review

Implementation workers chỉ dừng khi có conflict thật với source hiện tại, Google scope/runtime configuration không thể đi theo packet này, migration design không thể đi theo packet này, hoặc validation blocker. Không dừng để hỏi lại các quyết định đã approve ở trên.

## Still Deferred

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

## Validation required before closeout

Validation tối thiểu trước khi Phase 5 được đánh dấu completed:

- `dotnet build FormAutoHub.sln -c Release`
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release`
- `dotnet ef database update` nếu có migrations
- authenticated HTTP smoke cho collect, responses, normalize, và dataset endpoints
- live Google Forms responses smoke khi có credentials và scopes đã duyệt
- ghi nhãn `Blocked` rõ nếu live Google validation không chạy được vì thiếu credentials/scopes/responses
- inspect logs sau smoke checks
- cleanup smoke data

Không bắt buộc nếu không đổi frontend files:

- `npm run build`
- Playwright/browser smoke
