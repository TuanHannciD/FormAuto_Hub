# NCKH_API_CONTRACT_GUIDE

## Mục lục

- [Mục đích](#mục-đích) — line 53
- [Base Path](#base-path) — line 68
- [Xác thực](#xác-thực) — line 72
- [Endpoint Phase 1 đã implement](#endpoint-phase-1-đã-implement) — line 76
  - [1. Google OAuth & Import Form](#1-google-oauth--import-form) — line 78
- [Endpoint Phase 2 đã implement](#endpoint-phase-2-đã-implement) — line 89
  - [2. Research Models](#2-research-models) — line 91
  - [3. Variables](#3-variables) — line 113
  - [4. Observed Question Mappings](#4-observed-question-mappings) — line 124
- [Endpoint đã implement trong NCKH Phase 3](#endpoint-đã-implement-trong-nckh-phase-3) — line 144
  - [5. Relations](#5-relations) — line 148
  - [6. Canvas Positions](#6-canvas-positions) — line 158
- [Endpoint đã implement trong NCKH Phase 4](#endpoint-đã-implement-trong-nckh-phase-4) — line 165
  - [7. Form Generation](#7-form-generation) — line 171
- [Endpoint Phase 5 đã implement](#endpoint-phase-5-đã-implement) — line 209
  - [8. Data Collection](#8-data-collection) — line 219
  - [9. Data Normalization](#9-data-normalization) — line 238
- [Endpoint Phase 6 đã implement](#endpoint-phase-6-đã-implement) — line 260
  - [10. Export](#10-export) — line 266
- [Endpoint future proposed](#endpoint-future-proposed) — line 281
- [Chuẩn phân trang](#chuẩn-phân-trang) — line 285
- [Định dạng lỗi](#định-dạng-lỗi) — line 299
- [Ghi chú triển khai](#ghi-chú-triển-khai) — line 311
- [Phân biệt xác thực trên trình duyệt hiện tại](#phân-biệt-xác-thực-trên-trình-duyệt-hiện-tại) — line 321
- [Ví dụ payload đồng bộ với bản AI](#ví-dụ-payload-đồng-bộ-với-bản-ai) — line 329
  - [POST /api/v1/nckh/auth/google-link — Request](#post-apiv1nckhauthgoogle-link--request) — line 333
  - [POST /api/v1/nckh/auth/google-link — Response / định dạng minh họa](#post-apiv1nckhauthgoogle-link--response--định-dạng-minh-họa) — line 341
  - [POST /api/v1/nckh/forms/import — Request](#post-apiv1nckhformsimport--request) — line 350
  - [POST /api/v1/nckh/forms/import — Response / định dạng minh họa](#post-apiv1nckhformsimport--response--định-dạng-minh-họa) — line 358
  - [GET /api/v1/nckh/forms — Response / định dạng minh họa](#get-apiv1nckhforms--response--định-dạng-minh-họa) — line 372
  - [GET /api/v1/nckh/forms/{formId} — Response / định dạng minh họa](#get-apiv1nckhformsformid--response--định-dạng-minh-họa) — line 384
  - [POST /api/v1/nckh/models — Request](#post-apiv1nckhmodels--request) — line 404
  - [POST /api/v1/nckh/models — Response / định dạng minh họa](#post-apiv1nckhmodels--response--định-dạng-minh-họa) — line 414
  - [GET /api/v1/nckh/models/{modelId} — Response / định dạng minh họa](#get-apiv1nckhmodelsmodelid--response--định-dạng-minh-họa) — line 429
  - [POST /api/v1/nckh/models/{modelId}/variables — Request](#post-apiv1nckhmodelsmodelidvariables--request) — line 444
  - [POST /api/v1/nckh/models/{modelId}/variables — Response / định dạng minh họa](#post-apiv1nckhmodelsmodelidvariables--response--định-dạng-minh-họa) — line 458
  - [PUT /api/v1/nckh/variables/{variableId} — Request](#put-apiv1nckhvariablesvariableid--request) — line 471
  - [PUT /api/v1/nckh/variables/{variableId} — Response / định dạng minh họa](#put-apiv1nckhvariablesvariableid--response--định-dạng-minh-họa) — line 486
  - [POST /api/v1/nckh/models/{modelId}/relations — Request](#post-apiv1nckhmodelsmodelidrelations--request) — line 496
  - [POST /api/v1/nckh/models/{modelId}/relations — Response / định dạng minh họa](#post-apiv1nckhmodelsmodelidrelations--response--định-dạng-minh-họa) — line 507
  - [PUT /api/v1/nckh/models/{modelId}/positions — Request](#put-apiv1nckhmodelsmodelidpositions--request) — line 528
  - [POST /api/v1/nckh/models/{modelId}/collect — Request](#post-apiv1nckhmodelsmodelidcollect--request) — line 539
  - [POST /api/v1/nckh/models/{modelId}/collect — Response / định dạng minh họa](#post-apiv1nckhmodelsmodelidcollect--response--định-dạng-minh-họa) — line 545
  - [POST /api/v1/nckh/models/{modelId}/normalize — Response / định dạng minh họa](#post-apiv1nckhmodelsmodelidnormalize--response--định-dạng-minh-họa) — line 557
  - [GET /api/v1/nckh/models/{modelId}/dataset — Response / định dạng minh họa](#get-apiv1nckhmodelsmodeliddataset--response--định-dạng-minh-họa) — line 568
  - [Error Response Format — Response / định dạng minh họa](#error-response-format--response--định-dạng-minh-họa) — line 593
- [Follow-up xác nhận xóa model](#follow-up-xác-nhận-xóa-model) — line 605

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

Tất cả endpoint yêu cầu JWT Bearer và kiểm tra sở hữu của user. Role core hiện có là `User` và `Admin`; implementation hiện không định nghĩa role `Researcher`.

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
| DELETE | /api/v1/nckh/variables/{variableId} | Xóa biến; cascade mapping, quan hệ liên quan và vị trí canvas liên quan |

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
- Không giả định mã lỗi `google_reauth_required`: controller hiện trả ProblemDetails 401 với thông báo Google cụ thể; xem phần phân biệt xác thực bên dưới.
- Import form phải bắt buộc liên kết Google trước
- 1 form chỉ import được 1 lần cho mỗi user
- 1 imported form có thể có nhiều model, nhưng tối đa chỉ một model `Active`
- Hướng tối thiểu của Phase 2: Variable → Mappings dùng cascade delete.
- Phase 3+ đã có `NodePositions` và `ModelRelations`; xóa biến dọn mapping, quan hệ tham chiếu và vị trí canvas liên quan như contract hiện tại.

## Phân biệt xác thực trên trình duyệt hiện tại

Với `/api/v1/nckh/`, chỉ ProblemDetails 401 có `title = "Unauthorized"` và một thông báo chính xác bên dưới trở thành `NckhGoogleAuthorizationError`, giữ session core và yêu cầu liên kết lại Google. Các lỗi 401 khác vẫn qua refresh/hết hạn JWT; lỗi 5xx/mạng cho thử lại, không kết luận Google chưa liên kết. Không thêm endpoint/status/mã lỗi backend.

- `Google account not linked.`
- `Google account not linked. Please link your Google account.`
- `Google account not linked or token expired. Please re-link your Google account.`

## Ví dụ payload đồng bộ với bản AI

Các ví dụ dưới đây giữ nguyên tên field và giá trị mẫu của bản AI; không thêm contract, endpoint hay nghiệp vụ. `[...]` biểu thị phần được rút gọn. DTO/controller hiện tại là nguồn chính xác cho field và validation runtime.

### POST /api/v1/nckh/auth/google-link — Request

```json
{
  "authorizationCode": "4/0AY0e-g7..."
}
```

### POST /api/v1/nckh/auth/google-link — Response / định dạng minh họa

```json
{
  "linked": true,
  "email": "researcher@gmail.com"
}
```

### POST /api/v1/nckh/forms/import — Request

```json
{
  "formUrl": "https://docs.google.com/forms/d/abc123/edit"
}
```

### POST /api/v1/nckh/forms/import — Response / định dạng minh họa

```json
{
  "id": "guid",
  "googleFormId": "abc123",
  "formUrl": "https://docs.google.com/forms/d/abc123/edit",
  "title": "Khảo sát sinh viên",
  "status": "Draft",
  "questionCount": 15,
  "importedAt": "2026-05-30T10:00:00Z"
}
```

### GET /api/v1/nckh/forms — Response / định dạng minh họa

```json
{
  "items": [...],
  "page": 1,
  "pageSize": 20,
  "totalItems": 5,
  "totalPages": 1
}
```

### GET /api/v1/nckh/forms/{formId} — Response / định dạng minh họa

```json
{
  "id": "guid",
  "googleFormId": "abc123",
  "title": "Khảo sát sinh viên",
  "questions": [
    {
      "id": "guid",
      "googleQuestionId": "q1",
      "questionText": "Bạn bao nhiêu tuổi?",
      "questionType": "text",
      "isRequired": false,
      "orderIndex": 0
    }
  ]
}
```

### POST /api/v1/nckh/models — Request

```json
{
  "formId": "guid",
  "name": "Các yếu tố ảnh hưởng đến kết quả học tập",
  "description": "Khảo sát sinh viên năm 2026"
}
```

### POST /api/v1/nckh/models — Response / định dạng minh họa

```json
{
  "id": "guid",
  "name": "Các yếu tố ảnh hưởng đến kết quả học tập",
  "description": "...",
  "status": "Draft",
  "formTitle": "Khảo sát sinh viên",
  "variableCount": 0,
  "hasGeneratedForm": false,
  "createdAt": "2026-05-30T10:00:00Z"
}
```

### GET /api/v1/nckh/models/{modelId} — Response / định dạng minh họa

```json
{
  "id": "guid",
  "name": "...",
  "description": "...",
  "status": "Draft",
  "formTitle": "Khảo sát sinh viên",
  "variableCount": 3,
  "hasGeneratedForm": true,
  "variables": [...]
}
```

### POST /api/v1/nckh/models/{modelId}/variables — Request

```json
{
  "name": "Kỹ năng tự học",
  "code": "TH",
  "variableType": "Independent",
  "scaleType": "Likert",
  "scalePoint": 5,
  "minValue": 1,
  "maxValue": 5
}
```

### POST /api/v1/nckh/models/{modelId}/variables — Response / định dạng minh họa

```json
{
  "id": "guid",
  "name": "Kỹ năng tự học",
  "code": "TH",
  "variableType": "Independent",
  "scaleType": "Likert",
  "scalePoint": 5
}
```

### PUT /api/v1/nckh/variables/{variableId} — Request

```json
{
  "name": "Kỹ năng tự học (updated)",
  "code": "TH",
  "variableType": "Independent",
  "scaleType": "Likert",
  "scalePoint": 7,
  "minValue": null,
  "maxValue": null,
  "sortOrder": 1
}
```

### PUT /api/v1/nckh/variables/{variableId} — Response / định dạng minh họa

```json
{
  "id": "guid",
  "name": "Kỹ năng tự học (updated)",
  "code": "TH"
}
```

### POST /api/v1/nckh/models/{modelId}/relations — Request

```json
{
  "fromVariableId": "guid-th",
  "toVariableId": "guid-kq",
  "direction": "Positive",
  "sortOrder": 1
}
```

### POST /api/v1/nckh/models/{modelId}/relations — Response / định dạng minh họa

```json
{
  "id": "guid",
  "modelId": "guid-model",
  "fromVariableId": "guid-th",
  "fromVariableName": "Self-study skill",
  "fromVariableCode": "TH",
  "toVariableId": "guid-kq",
  "toVariableName": "Academic result",
  "toVariableCode": "KQ",
  "direction": "Positive",
  "hypothesisCode": "H1",
  "hypothesisText": "Self-study skill has a positive influence on Academic result",
  "sortOrder": 1,
  "createdAt": "2026-06-04T00:00:00Z",
  "updatedAt": "2026-06-04T00:00:00Z"
}
```

### PUT /api/v1/nckh/models/{modelId}/positions — Request

```json
{
  "positions": [
    { "nodeType": "Variable", "variableId": "guid-th", "positionX": 150.0, "positionY": 200.0 },
    { "nodeType": "Relation", "relationId": "guid-rel", "positionX": 275.0, "positionY": 200.0 }
  ]
}
```

### POST /api/v1/nckh/models/{modelId}/collect — Request

```json
{}
```

### POST /api/v1/nckh/models/{modelId}/collect — Response / định dạng minh họa

```json
{
  "logId": "guid",
  "responsesCollected": 8,
  "responsesSkipped": 2,
  "status": "Success",
  "errorMessage": null
}
```

### POST /api/v1/nckh/models/{modelId}/normalize — Response / định dạng minh họa

```json
{
  "respondentsProcessed": 45,
  "variablesComputed": 3,
  "missingDataCount": 2,
  "staleDatasetsMarked": 0
}
```

### GET /api/v1/nckh/models/{modelId}/dataset — Response / định dạng minh họa

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

### Error Response Format — Response / định dạng minh họa

```json
{
  "type": "https://errors.formauto.dev/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Variable code 'TH' already exists in this model.",
  "instance": "/api/v1/nckh/models/guid/variables"
}
```

## Follow-up xác nhận xóa model

Follow-up user duyệt ngày 2026-10-08 đã hoàn thiện khoảng thiếu UI được ghi trước đó. Pop-up riêng cho model dùng GET thuộc sở hữu hiện có: `totalItems` của variables/mappings/relations/responses/dataset và `items.length` của positions. Số lượng tại thời điểm kiểm tra, không phải snapshot nguyên tử của lệnh xóa. Yêu cầu nhập tên chính xác, chặn khi thiếu/lỗi thông tin, kiểm tra lại tên/trạng thái form sinh, chặn gửi lặp/đóng trong khi xóa. Nhập tên là bảo vệ trên frontend; request DELETE hiện có không thêm payload.

DELETE giữ route và hành vi 204/401/404. Model đang được `ResearchForm` sinh tham chiếu trả định dạng 409 Conflict hiện có, detail `Model has a generated form. Deletion is not allowed.`, thay vì rơi vào lỗi FK database. Giữ ràng buộc FK; không gỡ liên kết/xóa form sinh. Dọn vị trí canvas và quan hệ cùng model trong một transaction SaveChanges; cascade hiện có xóa biến, ánh xạ, responses, datasets chuẩn hóa và nhật ký thu thập. Form nhập gốc/câu hỏi được giữ. Xem [NCKH_MODEL_DELETE_FOLLOWUP.md](NCKH_MODEL_DELETE_FOLLOWUP.md) về file, case và giới hạn validation.
