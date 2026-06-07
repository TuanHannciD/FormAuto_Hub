# NCKH_PHASE_6_KICKOFF_PLAN

## Mục đích

Định nghĩa kickoff plan có approval gate cho NCKH Phase 6 để work Export có thể đi tiếp mà không mở rộng sang frontend, charting, phân tích thống kê, scheduled jobs, Google Sheets collection, credit, hoặc admin UI.

Tài liệu này là planning và handoff artifact. Nó không đánh dấu Phase 6 đã implement hoặc completed.

## Mục tiêu phase

Mở slice implementation tiếp theo sau Phase 5 cho module NCKH:

- export normalized dataset mới nhất thành CSV
- export Excel codebook mô tả variables và observed mappings
- export SPSS syntax để import CSV dataset
- giữ export backend-only và read-only trên dữ liệu Phase 5 hiện có

Phase 6 là phase export. Phase này không approve frontend tabs, chart, tính toán thống kê, report generation, tự chạy SPSS, scheduled export, Google Sheets collection, credit/pricing, admin UI, hoặc automatic response submission.

## Repo truth hiện tại

- NCKH Phase 1 đã completed cho OAuth link và Google Forms read/import.
- NCKH Phase 2 đã completed cho model, variables, và observed question mappings.
- NCKH Phase 3 đã completed cho backend-only relations, node positions, và deterministic hypothesis output.
- NCKH Phase 4 đã completed cho backend-only Google Form generation/update.
- NCKH Phase 5 đã completed cho backend-only Data Collection & Normalization, với live Google response-read smoke blocked đến khi có credentials/consent/submitted responses.
- Phase 6 là phase NCKH đề xuất tiếp theo.
- Phase 6 implementation vẫn approval-gated cho đến khi contract review và file-format review được chấp nhận.
- Phase 5 closeout evidence là dependency baseline cho planning Phase 6.

## Scope Phase 6 đề xuất

Trong scope của kickoff plan này:

- authenticated researcher export cho research model thuộc sở hữu user
- CSV dataset export từ `NormalizedDatasets.NormalizedDataJson`
- Excel codebook export từ `ResearchVariables`, `ObservedQuestionMappings`, và `ResearchFormQuestions`
- SPSS syntax export tham chiếu CSV dataset filename và normalized columns
- chỉ trả file response, không persist export jobs hoặc export history
- backend tests và authenticated HTTP smoke cho route surface đã approve

## Ngoài scope

Không được làm trong Phase 6:

- frontend export UI hoặc dashboard tabs mới
- phân tích thống kê hoặc statistical result reports
- Cronbach Alpha, EFA, regression, T-test, ANOVA, hoặc charting
- tự chạy SPSS
- scheduled/background export jobs
- Google Sheets collection hoặc Drive export
- Google Forms watches / Cloud Pub/Sub
- NCKH credit/pricing
- NCKH admin UI
- multi-researcher collaboration
- automatic response submission

## Entry Gates

Trước khi implementation worker bắt đầu, xác nhận tất cả mục sau:

1. User approve rõ việc mở NCKH Phase 6 implementation.
2. Contract review hoàn tất cho route surface, query values, content types, filenames, và error behavior.
3. File-format review hoàn tất cho CSV, Excel codebook, và SPSS syntax.
4. DB review xác nhận Phase 6 không cần bảng hoặc cột mới.
5. Flow không âm thầm kéo Phase 7-8 concerns vào scope.
6. `docs/ai/nckh` và `docs/vi/nckh` được sync cho mọi thay đổi contract hoặc phase-state.

## Quyết định cần freeze trước code

1. Route surface
   - Đề xuất: một backend endpoint `GET /api/v1/nckh/models/{modelId}/export?format=csv|codebook|spss`.
   - Đề xuất: không có POST export jobs và không lưu export records trong Phase 6.

2. Ownership và readiness
   - Đề xuất: model phải thuộc current authenticated user.
   - Đề xuất: export cần ít nhất một normalized dataset row.
   - Đề xuất: export trả conflict nếu normalized data stale; user phải chạy normalize lại trước.

3. CSV dataset
   - Đề xuất: UTF-8 CSV với BOM để tương thích Excel.
   - Đề xuất: thứ tự header theo dataset columns: `RespondentId`, observed codes, rồi variable mean columns.
   - Đề xuất: missing values export thành ô trống.
   - Đề xuất: array values export thành giá trị ngăn cách bằng dấu chấm phẩy trong một ô.

4. Excel codebook
   - Đề xuất: file `.xlsx` có sheets variables, observed mappings, và export notes.
   - Đề xuất: không đưa raw response payload vào codebook.
   - Đề xuất: không đưa statistical results vào codebook.

5. SPSS syntax
   - Đề xuất: file text `.sps` import CSV filename theo contract API.
   - Đề xuất: gồm variable names, basic variable labels, và value/missing handling khi suy ra an toàn.
   - Đề xuất: không invent value labels cho nominal/ordinal questions nếu không có option metadata.
   - Đề xuất: không execute SPSS hoặc sinh statistical commands.

6. Persistence
   - Đề xuất: không thêm database entities, migrations, hoặc export ledger trong Phase 6.
   - Đề xuất: export là read-only derived từ các bảng Phase 2 và Phase 5.

## Contract Guardrails

- Không xem endpoint Phase 6 đề xuất là implemented cho đến khi freeze được chấp nhận và code tồn tại.
- Không thêm frontend export buttons hoặc tabs trong Phase 6.
- Không thêm background jobs, Pub/Sub, watches, credit, pricing, admin UI, hoặc statistical analysis.
- Không expose `SurveyResponses.RawDataJson` trong export files.
- Không thêm lifecycle statuses mới.

## Delivery passes đề xuất

### Pass 0 - Contract And File-Format Freeze

Mục tiêu:

- chốt route surface, file formats, ownership/readiness rules, stale-data behavior, quyết định không đổi DB, và validation plan

Expected outputs:

- `NCKH_PHASE_6_CONTRACT_DB_FREEZE.md` được chấp nhận
- `NCKH_PHASE_6_SINGLE_APPROVAL_PACKET.md` được chấp nhận

### Pass 1 - Export Service And DTO/Result Plumbing

Mục tiêu:

- chỉ thêm service/controller behavior cần cho export read-only đã approve

Stop conditions:

- implementation cần DB table mới, export queue, frontend behavior, hoặc statistical analysis

### Pass 2 - File Format Implementations

Mục tiêu:

- implement CSV, Excel codebook, và SPSS syntax generation từ data sources đã approve

Stop conditions:

- codebook hoặc SPSS content yêu cầu option metadata chưa được model hoặc statistical output

### Pass 3 - Validation And Closeout Prep

Validation tối thiểu:

- `dotnet build FormAutoHub.sln -c Release`
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release`
- authenticated HTTP smoke cho cả ba export formats
- xác minh response content type, filename, và non-empty file body
- inspect server logs sau smoke checks

## Worker-ready handoff prompts

### Worker A - Contract/File Freeze

"Review NCKH Phase 6 only. Do not write production code. Confirm export route surface, file formats, stale dataset behavior, no-DB-change decision, validation plan, and approval gaps. Separate Confirmed, Proposed, Assumption, Deferred, and Approval Needed."

### Worker B - Implementation

"Implement only the approved NCKH Phase 6 Export slice from `NCKH_PHASE_6_SINGLE_APPROVAL_PACKET.md`. Do not add frontend expansion, scheduled jobs, Google Sheets collection, credit, pricing, admin UI, charting, statistical analysis, or automatic SPSS execution. Add focused tests and runtime HTTP smoke coverage."

### Worker C - Review

"Review the NCKH Phase 6 slice for scope discipline, file-format correctness, stale-data safety, contract safety, no raw response exposure, validation honesty, and docs sync. Lead with findings."

## Docs sync cần có khi Phase 6 mở

Nếu implementation được approve, giữ các file này synced:

- `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/vi/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/vi/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/ai/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/vi/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/ai/nckh/NCKH_API_CONTRACT_GUIDE.md`
- `docs/vi/nckh/NCKH_API_CONTRACT_GUIDE.md`

Không đánh dấu Phase 6 completed chỉ từ kickoff wording.

## Deferred

- frontend expansion
- scheduled export
- export history hoặc export jobs
- Google Sheets collection
- Google Forms watches / Cloud Pub/Sub
- statistical analysis
- charting và reports
- automatic SPSS execution
- credit/pricing
- NCKH admin UI
- production-readiness claims khi chưa có runtime validation hiện tại
