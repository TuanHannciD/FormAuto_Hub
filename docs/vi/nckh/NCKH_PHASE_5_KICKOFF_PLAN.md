# NCKH_PHASE_5_KICKOFF_PLAN

## Mục đích

Định nghĩa kickoff plan có gate approval cho NCKH Phase 5 để phần Thu thập & Chuẩn hóa dữ liệu có thể triển khai mà không mở rộng sang export, frontend, scheduled sync, Google Forms watches, thống kê, credit, hoặc admin UI.

Tài liệu này là artifact planning và handoff. Nó không đánh dấu Phase 5 là đã implement hoặc completed.

## Mục tiêu phase

Mở slice implementation tiếp theo sau Phase 4 cho module NCKH:

- thu thập thủ công responses đã submit từ Google Form cho một research model thuộc user
- lưu raw responses theo cách idempotent
- ghi log mỗi lần collect
- chuẩn hóa raw answer values thành các cột observed-code dựa trên mappings đã duyệt
- tính mean Likert đơn giản ở cấp variable
- cung cấp API backend-only cho collect, list raw responses, normalize, và list dataset

Phase 5 là data phase backend-only. Phase này không duyệt export file, frontend tabs, scheduled pull, real-time sync, Google Forms watches, Cloud Pub/Sub, phân tích thống kê, NCKH credit/pricing, admin UI, hoặc tự động submit response.

## Repo truth hiện tại

- NCKH Phase 1 đã completed cho OAuth link và Google Forms read/import.
- NCKH Phase 2 đã completed cho model, variables, và observed question mappings.
- NCKH Phase 3 đã completed cho backend-only relations, node positions, và deterministic hypothesis output.
- NCKH Phase 4 đã completed cho backend-only Google Form generation/update, với live Google write smoke bị blocked đến khi có credentials/write consent.
- Phase 5 là phase NCKH đề xuất tiếp theo.
- Implementation Phase 5 vẫn phải qua approval gate cho đến khi contract review, DB review, và Google response-read scope review được chấp nhận.
- Closeout evidence Phase 4 là dependency baseline cho planning Phase 5.

## Scope Phase 5 đề xuất

Trong scope của kickoff plan này:

- manual response collection do researcher đã authenticated khởi chạy
- Google response read integration phía sau NCKH auth boundary hiện có
- DTO request/response cho collection, raw response listing, normalization, và dataset listing
- persistence changes chỉ khi được duyệt trong `NCKH_PHASE_5_CONTRACT_DB_FREEZE.md`
- upsert raw response idempotent theo Google response ID
- collection logging với kết quả success, partial, và failed
- normalization từ `SurveyResponses.RawDataJson` sang `NormalizedDatasets.NormalizedDataJson`
- tính mean Likert đơn giản từ các mapped observed items cho từng variable
- missing data biểu diễn bằng JSON null
- backend tests và authenticated HTTP smoke cho route surface được duyệt

## Ngoài scope

Không được làm trong Phase 5:

- export CSV, Excel, hoặc SPSS
- frontend expansion hoặc React Flow
- scheduled pull, background jobs, watches, Pub/Sub, hoặc real-time sync
- tự động submit response
- thay đổi create/update Google Form ngoài việc dùng output Phase 4 làm input data
- phân tích thống kê ngoài arithmetic mean đơn giản cho Likert variables
- charting, report, Cronbach Alpha, EFA, regression, T-test, ANOVA
- NCKH credit/pricing
- NCKH admin UI
- multi-researcher collaboration

## Entry gates

Trước khi implementation worker bắt đầu, xác nhận toàn bộ các điểm sau:

1. User approve rõ việc mở NCKH Phase 5 implementation.
2. Contract review đã hoàn tất cho routes, DTOs, response shapes, collection statuses, và error behavior.
3. DB review đã hoàn tất cho entities mới, relationships, delete behavior, indexes, migrations, JSON storage, và rollback behavior.
4. Google response-read scope được approve rõ cho runtime configuration của Phase 5.
5. Flow không âm thầm kéo các concern Phase 6-8 vào.
6. `docs/ai/nckh` và `docs/vi/nckh` được giữ sync cho mọi thay đổi contract hoặc phase-state.

## Quyết định cần freeze trước khi code

1. Google response authorization
   - Candidate scope: `https://www.googleapis.com/auth/forms.responses.readonly` để đọc Google Form responses qua Forms API.
   - Scope thay thế cho spreadsheet-backed collection: `https://www.googleapis.com/auth/spreadsheets.readonly` nếu implementation chọn linked Google Sheets response spreadsheets.
   - Khuyến nghị freeze: ưu tiên Forms responses API trước cho Phase 5 MVP để tránh phụ thuộc spreadsheet discovery và giả định Sheets file.
   - Deferred: Google Sheets implementation trừ khi được chọn rõ trong freeze.

2. Collection target
   - Proposed: collect responses cho `ResearchForm.GoogleFormId` hiện tại của model.
   - Proposed: model và form phải thuộc current user.
   - Proposed: cho phép `Draft` và `Active` models vì response collection không mutate cấu trúc model.

3. Deduplication
   - Proposed: upsert theo `(ModelId, GoogleResponseId)`.
   - Proposed: collection lặp lại skip unchanged responses và update raw payload đã thay đổi nếu Google timestamps cho thấy submission state mới hơn.

4. Logging
   - Proposed statuses: `Success`, `Partial`, `Failed`.
   - Proposed: mỗi collection attempt ghi một `DataCollectionLog`, kể cả khi Google không trả response mới.

5. Normalization
   - Proposed: chỉ normalize các câu hỏi đã mapped.
   - Proposed: output columns dùng `ObservedQuestionMapping.ObservedCode`; cột mean theo variable dùng `{VariableCode}_mean`.
   - Proposed: missing hoặc unparseable answer values lưu JSON null và được đếm là missing data.
   - Proposed: Likert means là arithmetic mean đơn giản trên các non-null mapped observed values.

6. Stale dataset behavior
   - Proposed: sửa variables hoặc mappings sau khi đã có normalized data sẽ mark affected model datasets là stale trong implementation Phase 5.
   - Proposed: `normalize` có thể regenerate latest dataset rows và clear stale state cho respondents đã xử lý.

7. Persistence
   - Cần quyết định exact entity fields cho `SurveyResponses`, `NormalizedDatasets`, và `DataCollectionLogs`.
   - Không thêm database fields cho đến khi DB review approve exact names và semantics.

## Contract guardrails

- Không xem các endpoint Phase 5 proposed trong `NCKH_API_CONTRACT_GUIDE.md` là final cho đến khi freeze được chấp nhận.
- Không bật Google response-read hoặc Sheets scope nếu chưa có approval rõ và runtime configuration.
- Không thêm export endpoints hoặc files trong Phase 5.
- Không thêm scheduled jobs, Pub/Sub, watches, frontend tabs, credit/pricing, admin UI, hoặc statistical analysis.
- Không đưa Google OAuth tokens hoặc raw respondent data vào DTOs ngoài payload đã duyệt.

## Delivery passes đề xuất

### Pass 0 - Contract And DB Freeze

Mục tiêu:

- khóa route surface, request/response shapes, Google scope, persistence fields, delete behavior, indexes, stale-data behavior, và validation plan

Expected outputs:

- `NCKH_PHASE_5_CONTRACT_DB_FREEZE.md` được chấp nhận
- `NCKH_PHASE_5_SINGLE_APPROVAL_PACKET.md` được chấp nhận

### Pass 1 - Google Response Collection Integration

Mục tiêu:

- thêm đúng integration behavior cần cho manual response collection đã duyệt

Stop conditions:

- Google response-read scope chưa rõ
- implementation cần Sheets, Drive, scheduled jobs, hoặc frontend behavior ngoài freeze

### Pass 2 - Raw Response Persistence And Logging

Mục tiêu:

- implement raw response upsert và collection log behavior đã duyệt

Stop conditions:

- deduplication không thể đáp ứng bằng identifiers đã duyệt
- transaction boundaries không giữ được log honesty

### Pass 3 - Normalization Service And Dataset API

Mục tiêu:

- normalize mapped answers thành observed-code columns và simple Likert means

Stop conditions:

- computation được yêu cầu trở thành statistical analysis thay vì normalization
- mappings stale hoặc ambiguous mà chưa có conflict policy được duyệt

### Pass 4 - Validation And Closeout Prep

Validation target tối thiểu:

- `dotnet build FormAutoHub.sln -c Release`
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release`
- `dotnet ef database update` nếu có migrations
- authenticated HTTP smoke cho collect, responses, normalize, và dataset routes
- live Google Forms responses smoke chỉ khi có credentials/scopes hợp lệ
- inspect logs sau smoke checks

## Worker-ready handoff prompts

### Worker A - Contract/DB Freeze

"Review NCKH Phase 5 only. Do not write production code. Confirm Google response-read scope, manual collection workflow, route surface, DTOs, persistence fields, deduplication, logging, normalization, stale dataset behavior, validation plan, and remaining approval gaps. Separate Confirmed, Proposed, Assumption, Deferred, and Approval Needed."

### Worker B - Implementation

"Implement only the approved NCKH Phase 5 Data Collection & Normalization slice from `NCKH_PHASE_5_SINGLE_APPROVAL_PACKET.md`. Do not add export, frontend expansion, scheduled jobs, Pub/Sub, watches, credit, pricing, admin UI, or statistical analysis. Add focused tests and runtime smoke coverage."

### Worker C - Review

"Review the NCKH Phase 5 slice for scope discipline, Google scope safety, idempotency, normalization correctness, contract safety, migration risk, validation honesty, and docs sync. Lead with findings."

## Documentation sync cần làm khi mở Phase 5

Nếu implementation được approve, giữ sync các file:

- `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/vi/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/vi/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/ai/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/vi/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- tài liệu contract/entity/API Phase 5 nếu approved surface thay đổi

Không đánh dấu Phase 5 completed chỉ từ wording kickoff.

## Deferred

- export CSV/Excel/SPSS
- frontend expansion
- scheduled data collection
- real-time sync
- Google Forms watches / Cloud Pub/Sub
- statistical analysis
- credit/pricing
- NCKH admin UI
- automatic response submission
- production-readiness claims khi chưa có runtime validation hiện tại
