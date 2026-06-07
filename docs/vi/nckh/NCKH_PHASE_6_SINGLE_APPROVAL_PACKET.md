# NCKH_PHASE_6_SINGLE_APPROVAL_PACKET

## Mục đích

Gom các approval còn lại của NCKH Phase 6 vào một quyết định để implementation sub-agents có thể làm việc mà không dừng lại cho các lựa chọn route, file-format, stale-data, và no-DB-change đã review.

File này là approval packet. Nó không đánh dấu Phase 6 đã implement hoặc completed.

## Tuyên bố approval một lần

Nếu user approve packet này, các điểm sau được approve làm baseline implementation Phase 6:

- Mở NCKH Phase 6 implementation cho backend-only Export.
- Dùng `NCKH_PHASE_6_CONTRACT_DB_FREEZE.md` làm baseline authoritative cho contract, file-format, và DB freeze của Phase 6.
- Chỉ implement CSV dataset export, Excel codebook export, và SPSS syntax export.
- Giữ implementation backend-only trừ khi có approval rõ sau này mở frontend work.
- Không thêm DB tables, DB columns, export jobs, hoặc export history trong Phase 6.

## Các quyết định được approve bởi packet này

### API Contract

Endpoint backend-only đã approve:

- `GET /api/v1/nckh/models/{modelId}/export?format=csv|codebook|spss`

Format values đã approve:

- `csv`
- `codebook`
- `spss`

### Ownership And Readiness Contract

- Model phải thuộc current authenticated user.
- Export chỉ đọc normalized data hiện có.
- Export cần ít nhất một normalized dataset row.
- Export trả `409 Conflict` khi normalized data stale.
- Export không được trigger Google calls, collection, normalization, hoặc submission.

### CSV Contract

- UTF-8 có BOM.
- Header order theo dataset columns.
- Null values thành ô trống.
- Numeric values dùng invariant-culture formatting.
- Array values thành semicolon-separated cell values.
- Không export full raw response JSON.

### Excel Codebook Contract

- Generate `.xlsx` codebook.
- Include sheets `Variables`, `Mappings`, và `Notes`.
- Chỉ include model/variable/mapping metadata.
- Không include raw responses, Google tokens, hoặc statistical outputs.

### SPSS Syntax Contract

- Generate `.sps` syntax tham chiếu CSV filename.
- Include import syntax, variable names, và labels khi suy ra an toàn.
- Không invent value labels khi option metadata unavailable.
- Không include statistical commands.
- Không execute SPSS.

### Persistence Contract

- Không thêm database entities.
- Không thêm EF Core migration.
- Không có export job/history table.
- Không có credit/pricing hoặc usage ledger behavior cho NCKH export trong Phase 6.

## Luồng sub-agent đã approve

Đi theo thứ tự:

1. Export controller/service route
2. CSV dataset generation
3. Excel codebook generation
4. SPSS syntax generation
5. Tests và authenticated HTTP smoke
6. Closeout docs và final review

Implementation workers chỉ dừng khi có conflict thật với source hiện tại, thiếu package capability cho `.xlsx` generation không thể xử lý trong backend stack đã approve, file-format ambiguity không thể đi theo packet này, hoặc validation blocker.

## Vẫn Deferred

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

## Validation bắt buộc trước closeout

Validation tối thiểu trước khi Phase 6 được đánh dấu completed:

- `dotnet build FormAutoHub.sln -c Release`
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release`
- authenticated HTTP smoke cho `csv`, `codebook`, và `spss` exports
- verify response content type, filename, và non-empty body cho mỗi format
- verify stale dataset conflict behavior
- inspect server logs sau smoke checks
- smoke data cleanup

Không required trừ khi frontend files thay đổi:

- `npm run build`
- Playwright/browser smoke
