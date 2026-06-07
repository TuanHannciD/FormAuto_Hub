# NCKH_PHASE_6_CLOSEOUT

## Mục đích

Ghi lại closeout evidence cho slice backend-only Export của NCKH Phase 6 đã được duyệt.

## Trạng thái closeout

Trạng thái: **Completed cho đúng scope backend-only Phase 6 đã duyệt**.

Closeout này không claim frontend export readiness, statistical analysis readiness, scheduled export readiness, hoặc production performance readiness cho dataset lớn.

## Tóm tắt implementation

Đã implement:

- `GET /api/v1/nckh/models/{modelId}/export?format=csv`
- `GET /api/v1/nckh/models/{modelId}/export?format=codebook`
- `GET /api/v1/nckh/models/{modelId}/export?format=spss`
- export service read-only trên dữ liệu Phase 2 và Phase 5 hiện có
- CSV dataset export từ `NormalizedDatasets.NormalizedDataJson`
- Excel `.xlsx` codebook với sheets `Variables`, `Mappings`, và `Notes`
- sinh SPSS `.sps` import syntax không có `EXECUTE` hoặc statistical commands
- guard conflict khi normalized dataset stale
- không thêm database tables, columns, migrations, export jobs, export history, credit behavior, hoặc Google calls

## Files Changed

Main implementation files:

- `src/FormAutoHub.Api/Contracts/NckhDtos.cs`
- `src/FormAutoHub.Api/Controllers/Nckh/ResearchDataController.cs`
- `src/FormAutoHub.Api/Services/Nckh/ResearchExportService.cs`
- `src/FormAutoHub.Api/Program.cs`
- `tests/FormAutoHub.Tests/NckhPhase6ExportServiceTests.cs`

Documentation updates:

- `docs/ai/nckh/NCKH_PHASE_6_CLOSEOUT.md`
- `docs/vi/nckh/NCKH_PHASE_6_CLOSEOUT.md`
- `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/vi/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/vi/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/ai/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/vi/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/ai/nckh/NCKH_API_CONTRACT_GUIDE.md`
- `docs/vi/nckh/NCKH_API_CONTRACT_GUIDE.md`
- `docs/ai/AI_DOC_ROUTING_MATRIX.md`
- `docs/vi/AI_DOC_ROUTING_MATRIX.md`

## API Contract đã finalize

Endpoint đã implement:

- `GET /api/v1/nckh/models/{modelId}/export?format=csv|codebook|spss`

Format values:

- `csv`
- `codebook`
- `spss`

Response content types:

- CSV: `text/csv; charset=utf-8`
- Codebook: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- SPSS syntax: `text/plain; charset=utf-8`

Status behavior:

- `400`: thiếu hoặc unsupported export format
- `401`: request chưa authenticated
- `404`: model không nằm trong current user scope
- `409`: chưa có normalized dataset rows, hoặc normalized data stale và cần regenerate

## Database Contract đã finalize

Phase 6 không thêm thay đổi database.

Đã xác nhận:

- không thêm table mới
- không thêm column mới
- không có EF Core migration
- không có export job/history table
- không có credit/pricing hoặc usage ledger behavior cho NCKH export

## Validation Performed

Verified:

- `dotnet build FormAutoHub.sln -c Release` pass.
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build` pass: 142 passed, 0 failed.
- EF Core database update đã apply migrations hiện có đến Phase 5 vào temporary LocalDB database `FormAutoHubNckhPhase6Smoke2`; không tạo migration Phase 6.
- Authenticated HTTP smoke pass trên `http://127.0.0.1:5237` với JWT thật từ `/api/auth/register` hoặc `/api/auth/login`.
- Runtime smoke seed NCKH form, model, questions, variable, mappings, survey response, và normalized dataset thuộc user.
- Runtime smoke xác minh CSV export trả `200 OK`, `text/csv; charset=utf-8`, attachment filename đúng, và body không rỗng.
- Runtime smoke xác minh codebook export trả `200 OK`, `.xlsx` content type, attachment filename đúng, và body không rỗng.
- Runtime smoke xác minh SPSS export trả `200 OK`, `text/plain; charset=utf-8`, attachment filename đúng, body không rỗng, có syntax `GET DATA`, và không có command `EXECUTE`.
- Runtime smoke xác minh export khi normalized dataset stale trả `409 Conflict`.
- Đã inspect server logs sau smoke. Không thấy fatal error.
- Smoke database tạm đã được drop, smoke files đã xóa, và API smoke process đã dừng sau validation.

## Validation Not Performed

Not run:

- Frontend build và Playwright smoke, vì Phase 6 backend-only và không đổi frontend file.
- Live Google Forms response collection, vì Phase 6 không gọi Google APIs.
- Production large-dataset performance/streaming validation, vì MVP Phase 6 generate file in memory.
- SPSS execution, vì automatic SPSS execution vẫn Deferred.

## Scope Alignment

Giữ trong scope:

- backend-only export route
- CSV dataset export
- Excel codebook export
- SPSS import syntax export
- stale dataset conflict behavior
- implementation không đổi DB

Giữ ngoài scope:

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

## Residual Risks

- Dataset lớn có thể cần streaming hoặc paging trong một slice performance hardening được approve sau.
- SPSS syntax chỉ tập trung import và cố ý không include statistical commands hoặc generated value labels khi thiếu option metadata.
- Codebook `.xlsx` được generate không thêm package; cải thiện formatting sau này có thể làm trong UI/export polish slice.

## Candidate tiếp theo

Candidate implementation tiếp theo: **NCKH Phase 7 - Frontend Expansion**.

Kickoff Phase 7, UI/contract freeze, và single approval packet đã được chuẩn bị sau closeout này. Implementation Phase 7 vẫn cần approval riêng trước khi sửa code.
