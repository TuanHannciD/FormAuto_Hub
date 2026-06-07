# NCKH_PHASE_6_CONTRACT_DB_FREEZE

## Mục đích

Ghi lại Pass 0 contract, file-format, và database freeze review cho NCKH Phase 6 trước khi production implementation bắt đầu.

File này là review và approval artifact. Nó không đánh dấu Phase 6 đã implement hoặc completed.

## Kết quả review

Trạng thái: **Sẵn sàng cho approval implementation Phase 6 rõ ràng sau khi user chấp nhận các freeze decisions bên dưới**.

Phase 6 chỉ được đi vào implementation sau khi freeze này được chấp nhận. Cho đến lúc đó, export route behavior, file formats, content types, stale-data policy, và quyết định không đổi DB vẫn là proposed.

## Source Evidence đã đọc

- `NCKH_PROGRESS_LEDGER.md`
- `NCKH_PHASE_TRANSITION_GUIDE.md`
- `NCKH_PHASE_ROADMAP.md`
- `NCKH_PHASE_5_CLOSEOUT.md`
- `NCKH_PHASE_6_KICKOFF_PLAN.md`
- `NCKH_DOMAIN_ENTITIES_OVERVIEW.md`
- `NCKH_API_CONTRACT_GUIDE.md`
- `NCKH_MODULE_MAP.md`
- `NCKH_ARCHITECTURE_BOUNDARIES.md`

## Baseline đã xác nhận

- NCKH Phase 1 đến Phase 5 đã completed cho đúng scope được duyệt.
- Route prefix hiện có là `/api/v1/nckh`.
- Phase 5 có `NormalizedDatasets`, `SurveyResponses`, và dataset listing.
- Phase 6 không được thêm frontend expansion, scheduled jobs, export queues, Google Sheets collection, credit, admin UI, charting, hoặc statistical analysis.
- `ResearchModel.Status` hiện chỉ có `Draft` và `Active`.
- `Archived` vẫn Deferred.

## Freeze Decision: Route Surface Phase 6

Trạng thái approval: **Proposed for Phase 6 implementation approval**.

Endpoint:

- `GET /api/v1/nckh/models/{modelId}/export?format=csv|codebook|spss`

Formats:

- `csv`: normalized dataset CSV
- `codebook`: Excel `.xlsx` codebook
- `spss`: SPSS `.sps` syntax

Không có request body.

Expected status mapping:

- `200`: export file generated
- `400`: thiếu hoặc unsupported `format`
- `401`: request chưa authenticated
- `404`: model không nằm trong current user scope
- `409`: chưa có normalized dataset rows, hoặc normalized data stale và cần regenerate

## Freeze Decision: File Responses

Trạng thái approval: **Proposed for Phase 6 implementation approval**.

Response content types:

- CSV: `text/csv; charset=utf-8`
- Codebook: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- SPSS syntax: `text/plain; charset=utf-8`

Recommended filenames:

- `nckh-model-{modelId}-dataset.csv`
- `nckh-model-{modelId}-codebook.xlsx`
- `nckh-model-{modelId}-spss.sps`

Service có thể sanitize model names sau này, nhưng Phase 6 không yêu cầu filename theo model name.

## Freeze Decision: Ownership And Readiness

Trạng thái approval: **Proposed for Phase 6 implementation approval**.

Rules:

- Model phải thuộc current authenticated user.
- Export chỉ đọc dữ liệu Phase 2 và Phase 5 hiện có.
- Export cần ít nhất một `NormalizedDataset` row.
- Export phải trả `409 Conflict` nếu bất kỳ normalized dataset row nào của model đang stale.
- Export không được trigger collection, normalization, Google API calls, hoặc submission.

## Freeze Decision: CSV Dataset

Trạng thái approval: **Proposed for Phase 6 implementation approval**.

Rules:

- Encode UTF-8 có BOM để tương thích Excel.
- Thứ tự header theo dataset listing columns: `RespondentId`, observed codes, rồi variable mean columns.
- Mỗi `NormalizedDataset` row thành một CSV row.
- Missing/null values export thành ô trống.
- Numeric JSON values export bằng invariant-culture decimal formatting.
- Array values export thành semicolon-separated values trong một quoted cell.
- Không include full `SurveyResponses.RawDataJson`.

## Freeze Decision: Excel Codebook

Trạng thái approval: **Proposed for Phase 6 implementation approval**.

Rules:

- Generate `.xlsx` và không thêm DB persistence.
- Include sheet `Variables` với variable code, name, type, scale type, scale point, min/max, và sort order.
- Include sheet `Mappings` với variable code, observed code, Google question ID, question text, question type, required flag, và sort order.
- Include sheet `Notes` với model ID, export timestamp, dataset stale status, và Deferred-statistics note.
- Không include raw response JSON hoặc Google tokens.
- Không include statistical analysis outputs.

## Freeze Decision: SPSS Syntax

Trạng thái approval: **Proposed for Phase 6 implementation approval**.

Rules:

- Generate text `.sps` import CSV filename theo CSV export contract.
- Include variable names dùng normalized column names.
- Include variable labels từ variable names và observed question text khi suy ra an toàn.
- Treat mean columns as numeric.
- Treat text/nominal/ordinal observed columns bảo thủ là string trừ khi numeric parsing an toàn theo scale type.
- Không invent value labels khi option metadata unavailable.
- Không include statistical commands như RELIABILITY, FACTOR, REGRESSION, T-TEST, ONEWAY, hoặc GLM.
- Không execute SPSS.

## Freeze Decision: Persistence

Trạng thái approval: **Proposed for Phase 6 implementation approval**.

Rules:

- Không thêm table mới.
- Không thêm column mới.
- Không có EF Core migration.
- Không có export job table.
- Không có export history table.
- Không có credit hoặc usage ledger entry cho NCKH export trong Phase 6.

DB risk notes:

- Export đọc JSON từ `NormalizedDatasets.NormalizedDataJson`; dataset lớn có thể cần streaming sau này, nhưng MVP Phase 6 có thể generate file in memory cho scope backend-only hiện tại.
- Nếu production datasets lớn, thêm paging/streaming trong một slice performance hardening được approve rõ sau.

## Implementation Safeguards bắt buộc

- Controllers chỉ xử lý HTTP/file response.
- Services sở hữu export workflow và file generation.
- Services không return framework-specific HTTP results.
- Không expose raw response JSON mặc định.
- Không thêm Google scopes hoặc Google API calls.
- Không thêm frontend routes.

## Deferred

- frontend export UI
- export jobs/history
- scheduled export
- Google Sheets collection
- Google Drive export
- statistical analysis
- charting và reports
- automatic SPSS execution
- credit/pricing
- NCKH admin UI
- multi-researcher collaboration
- production-readiness claims khi chưa có runtime validation hiện tại

## Cần approve trước implementation

Approve hoặc revise các freeze decisions sau trước khi giao implementation worker:

- route surface: `GET /api/v1/nckh/models/{modelId}/export?format=csv|codebook|spss`
- content types và filenames
- stale dataset conflict behavior
- CSV header/value formatting
- Excel codebook sheet contents
- SPSS syntax boundaries
- quyết định không đổi DB

## Pass tiếp theo nếu được approve

Chỉ proceed tới **Phase 6 Pass 1 - Export Service And File Generation** sau khi freeze này được chấp nhận rõ.
