# NCKH_API_CONTRACT_GUIDE

## Mục đích

Tài liệu hợp đồng API cho NCKH Survey Module.

Ghi chú Phase 1/2:

- Các endpoint Phase 1 ở mục 1 đã có repo evidence và được xem là baseline contract hiện tại của NCKH Phase 1.
- Các endpoint Phase 2 ở mục 2-4 đã có repo evidence và closeout validation hiện tại. Xem `NCKH_PHASE_2_CLOSEOUT.md`.
- Các endpoint Phase 3 ở mục 5-6 đã có repo evidence và closeout validation hiện tại. Xem `NCKH_PHASE_3_CLOSEOUT.md`.
- Endpoint Phase 4 ở mục 7 đã có repo evidence và local runtime validation. Xem `NCKH_PHASE_4_CLOSEOUT.md`; live Google write smoke vẫn blocked cho đến khi có credentials/write consent.
- Các endpoint Phase 5 ở mục 8-9 đã có repo evidence và local runtime validation. Xem `NCKH_PHASE_5_CLOSEOUT.md`; live Google response-read smoke vẫn blocked cho đến khi có credentials/response-read consent/submitted responses.
- Endpoint Phase 6 ở mục 10 đã có repo evidence và local runtime validation. Xem `NCKH_PHASE_6_CLOSEOUT.md`; Phase 6 không thêm database migration.
- File này không tự claim runtime readiness cho thay đổi tương lai; phải chạy lại validation trước khi claim closeout hoặc runtime readiness mới.
- Các endpoint ngoài mục 1-10 vẫn là proposed cho đến khi phase NCKH tương ứng được approve rõ và implement.

## Base Path

Tất cả endpoint NCKH bắt đầu với `/api/v1/nckh`.

## Xác thực

Tất cả endpoint yêu cầu JWT Bearer token. Vai trò: Researcher (vai trò người dùng mặc định) hoặc Admin.

## Endpoint Phase 1 đã implement

### 1. Google OAuth & Import Form

| Method | Path | Mô tả |
|---|---|---|
| POST | /api/v1/nckh/auth/google-link | Liên kết Google Account |
| POST | /api/v1/nckh/forms/import | Import Google Form |
| GET | /api/v1/nckh/forms | Danh sách form đã import |
| GET | /api/v1/nckh/forms/{formId} | Chi tiết form + câu hỏi |

Ghi chú scope Phase 1: endpoint `POST /api/v1/nckh/auth/google-link` hiện dùng Forms read scope đã được duyệt cho NCKH; không tự mở rộng sang Google Sheets scope trong Phase 1.

## Endpoint Phase 2 đã implement

### 2. Research Models

| Method | Path | Mô tả |
|---|---|---|
| POST | /api/v1/nckh/models | Tạo mô hình nghiên cứu |
| GET | /api/v1/nckh/models | Danh sách model (lọc: status) |
| GET | /api/v1/nckh/models/{modelId} | Chi tiết model + biến |
| PUT | /api/v1/nckh/models/{modelId} | Sửa tên/mô tả model |
| POST | /api/v1/nckh/models/{modelId}/activate | Kích hoạt model Draft |
| DELETE | /api/v1/nckh/models/{modelId} | Xóa model |

Ghi chú Phase 2 đã duyệt:

- Cho phép nhiều model trên một imported form.
- Tối đa một model `Active` trên mỗi imported form.
- Phase 2 hỗ trợ transition rõ ràng `Draft -> Active`.
- Tạo model luôn tạo trạng thái `Draft`; activation trả conflict nếu imported form đã có model `Active` khác.
- Xóa model chỉ ảnh hưởng nhánh cascade thuộc sở hữu Phase 2: `ResearchModel -> ResearchVariable -> ObservedQuestionMapping`.
- Nếu sau này có frontend xóa model, dialog xác nhận phải tóm tắt dữ liệu bị ảnh hưởng, hiển thị số lượng bản ghi gần đúng, và yêu cầu nhập đúng tên model trước khi xác nhận.

Model response hiện có thêm `hasGeneratedForm`. Trường này là `true` khi đã có `ResearchForm` thuộc user với `GenerationSource = "Generated"` và `GeneratedFromModelId = modelId`. UI tạo/cập nhật Google Form phải gửi `action: "update"` khi trường này là `true`, và chỉ gửi `action: "create"` khi trường này là `false`.

### 3. Variables

| Method | Path | Mô tả |
|---|---|---|
| POST | /api/v1/nckh/models/{modelId}/variables | Thêm biến |
| GET | /api/v1/nckh/models/{modelId}/variables | Danh sách biến |
| PUT | /api/v1/nckh/variables/{variableId} | Sửa biến |
| DELETE | /api/v1/nckh/variables/{variableId} | Xóa biến (cascade mapping) |

Ghi chú: warning tác động data khi sửa biến vẫn deferred cho đến khi các phase data sau này được approve.

### 4. Observed Question Mappings

Mapping đi qua endpoint riêng, không đi theo nested payload của variable.

Route surface Phase 2 đã implement:

| Method | Path | Mô tả |
|---|---|---|
| POST | /api/v1/nckh/variables/{variableId}/mappings | Tạo mapping |
| GET | /api/v1/nckh/variables/{variableId}/mappings | List mapping theo variable |
| GET | /api/v1/nckh/models/{modelId}/mappings | List mapping theo model |
| PUT | /api/v1/nckh/mappings/{mappingId} | Sửa mapping |
| DELETE | /api/v1/nckh/mappings/{mappingId} | Xóa mapping |

Validation:

- câu hỏi được map phải thuộc cùng imported form với model của variable
- reject duplicate `(VariableId, FormQuestionId)`
- reject duplicate `(VariableId, ObservedCode)`

## Endpoint đã implement trong NCKH Phase 3

Các endpoint relation và canvas-position của Phase 3 đã được implement và validate. Xem `NCKH_PHASE_3_CLOSEOUT.md`.

### 5. Relations

| Method | Path | Mô tả |
|---|---|---|
| POST | /api/v1/nckh/models/{modelId}/relations | Thêm quan hệ khi model còn `Draft` |
| GET | /api/v1/nckh/models/{modelId}/relations | Danh sách quan hệ |
| GET | /api/v1/nckh/relations/{relationId} | Lấy chi tiết quan hệ |
| PUT | /api/v1/nckh/relations/{relationId} | Cập nhật quan hệ khi model còn `Draft` |
| DELETE | /api/v1/nckh/relations/{relationId} | Xóa quan hệ khi model còn `Draft` |

### 6. Canvas Positions

| Method | Path | Mô tả |
|---|---|---|
| PUT | /api/v1/nckh/models/{modelId}/positions | Lưu tọa độ node khi model còn `Draft` |
| GET | /api/v1/nckh/models/{modelId}/positions | Tải tọa độ node |

## Endpoint đã implement trong NCKH Phase 4

Endpoint form-generation của Phase 4 đã được implement và local runtime validation. Xem `NCKH_PHASE_4_CLOSEOUT.md`.

Live Google Forms create/update smoke vẫn blocked cho đến khi có Google OAuth account thật với `https://www.googleapis.com/auth/forms.body`.

### 7. Form Generation

| Method | Path | Mô tả |
|---|---|---|
| POST | /api/v1/nckh/models/{modelId}/generate-form | Tạo/cập nhật Google Form từ model |

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

Response 200:

```json
{
  "formId": "guid",
  "googleFormId": "xyz789",
  "formUrl": "https://docs.google.com/forms/d/xyz789/edit",
  "questionsCreated": 12,
  "questionsUpdated": 0,
  "questionsDeleted": 0,
  "reimported": true
}
```

Errors: 400 (invalid action, chưa có mappings, unsupported question type), 401 (Google chưa linked hoặc token unavailable), 403 (thiếu Forms write scope hoặc target form không writable), 404 (không tìm thấy model/form), 409 (duplicate generated form hoặc unsafe conflict), 502 (Google Forms API failure)

## Endpoint Phase 5 đã implement

Các endpoint data collection và normalization của Phase 5 đã được implement với repo evidence và local runtime validation. Xem `NCKH_PHASE_5_CLOSEOUT.md`.

Preferred Google scope cho Phase 5 MVP: `https://www.googleapis.com/auth/forms.responses.readonly`.

Google Sheets collection vẫn là path thay thế chỉ khi được approve rõ sau này.

Live Google Forms response-read smoke vẫn blocked cho đến khi có Google OAuth account thật với response-read consent và submitted form responses.

### 8. Data Collection

| Method | Path | Mô tả |
|---|---|---|
| POST | /api/v1/nckh/models/{modelId}/collect | Kéo responses thủ công |
| GET | /api/v1/nckh/models/{modelId}/responses | Danh sách responses thô |

Collection response includes:

- `logId`
- `responsesCollected`
- `responsesSkipped`
- `status`
- `errorMessage`

Allowed status values: `Success`, `Partial`, `Failed`.

Default list responses không trả full `RawDataJson`.

### 9. Data Normalization

| Method | Path | Mô tả |
|---|---|---|
| POST | /api/v1/nckh/models/{modelId}/normalize | Chuẩn hóa dữ liệu |
| GET | /api/v1/nckh/models/{modelId}/dataset | Dataset đã chuẩn hóa |

Normalization response includes:

- `respondentsProcessed`
- `variablesComputed`
- `missingDataCount`
- `staleDatasetsMarked`

Rules:

- Chỉ normalize mapped questions.
- Observed columns dùng `ObservedQuestionMapping.ObservedCode`.
- Variable mean columns dùng `{VariableCode}_mean`.
- Likert means là arithmetic mean đơn giản trên non-null numeric observed values.
- Missing, blank, hoặc unparseable values lưu JSON null.

## Endpoint Phase 6 đã implement

Endpoint export của Phase 6 đã được implement với repo evidence và local runtime validation. Xem `NCKH_PHASE_6_CLOSEOUT.md`.

Phase 6 backend-only và không thêm export jobs, export history, frontend UI, statistical analysis, hoặc database tables mới. Không thêm EF Core migration.

### 10. Export

| Method | Path | Mô tả |
|---|---|---|
| GET | /api/v1/nckh/models/{modelId}/export?format=csv | Tải dataset.csv |
| GET | /api/v1/nckh/models/{modelId}/export?format=codebook | Tải codebook.xlsx |
| GET | /api/v1/nckh/models/{modelId}/export?format=spss | Tải syntax.sps |

Rules:

- CSV response: `text/csv; charset=utf-8`, export normalized dataset rows, không export full `RawDataJson`.
- Codebook response: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, gồm sheets variables, mappings, và notes; không có raw responses hoặc statistical outputs.
- SPSS response: `text/plain; charset=utf-8`, sinh import syntax cho CSV file; không invent value labels khi thiếu option metadata; không include statistical commands và không execute SPSS.
- Expected errors: 400 unsupported format, 401 unauthenticated, 404 model not found, 409 chưa có normalized data hoặc normalized data stale.

## Endpoint future proposed

Không có endpoint NCKH tương lai nào khác được approve bởi guide này.

## Chuẩn phân trang

Tất cả endpoint danh sách dùng:
```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "totalItems": 0,
  "totalPages": 0
}
```
pageSize trong khoảng: 1..100.

## Định dạng lỗi

```json
{
  "type": "https://errors.formauto.dev/validation-error",
  "title": "Lỗi xác thực",
  "status": 400,
  "detail": "Mã biến TH đã tồn tại trong model này.",
  "instance": "/api/v1/nckh/models/guid/variables"
}
```

## Ghi chú triển khai

- Tất cả endpoint yêu cầu Google OAuth phải kiểm tra token còn hạn trước khi gọi
- Token hết hạn → refresh tự động, nếu refresh fail → trả về 401 với mã lỗi "google_reauth_required"
- Import form phải bắt buộc liên kết Google trước
- 1 form chỉ import được 1 lần cho mỗi user
- 1 imported form có thể có nhiều model, nhưng tối đa chỉ một model `Active`
- Hướng tối thiểu của Phase 2: Variable → Mappings dùng cascade delete.
- Quan hệ tới `NodePositions` hoặc `ModelRelations` chỉ được tính vào delete behavior sau khi các entity phase sau được approve và tồn tại thực tế.
