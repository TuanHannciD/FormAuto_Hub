# NCKH_API_CONTRACT_GUIDE

## Mục đích

Tài liệu hợp đồng API cho NCKH Survey Module.

Ghi chú Phase 1/2:

- Các endpoint Phase 1 ở mục 1 đã có repo evidence và được xem là baseline contract hiện tại của NCKH Phase 1.
- Các endpoint Phase 2 ở mục 2-4 đã có repo evidence và closeout validation hiện tại. Xem `NCKH_PHASE_2_CLOSEOUT.md`.
- File này không tự claim runtime readiness cho thay đổi tương lai; phải chạy lại validation trước khi claim closeout hoặc runtime readiness mới.
- Các endpoint ngoài mục 1-4 vẫn là proposed cho đến khi phase NCKH tương ứng được approve rõ và implement.

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

## Endpoint proposed cho các phase NCKH tiếp theo

### 5. Relations

| Method | Path | Mô tả |
|---|---|---|
| POST | /api/v1/nckh/models/{modelId}/relations | Thêm quan hệ |
| GET | /api/v1/nckh/models/{modelId}/relations | Danh sách quan hệ |
| DELETE | /api/v1/nckh/relations/{relationId} | Xóa quan hệ |

### 6. Canvas Positions

| Method | Path | Mô tả |
|---|---|---|
| PUT | /api/v1/nckh/models/{modelId}/positions | Lưu tọa độ node |
| GET | /api/v1/nckh/models/{modelId}/positions | Tải tọa độ node |

### 7. Form Generation

| Method | Path | Mô tả |
|---|---|---|
| POST | /api/v1/nckh/models/{modelId}/generate-form | Tạo/cập nhật Google Form từ model |

### 8. Data Collection

| Method | Path | Mô tả |
|---|---|---|
| POST | /api/v1/nckh/models/{modelId}/collect | Kéo responses thủ công |
| GET | /api/v1/nckh/models/{modelId}/responses | Danh sách responses thô |

### 9. Data Normalization

| Method | Path | Mô tả |
|---|---|---|
| POST | /api/v1/nckh/models/{modelId}/normalize | Chuẩn hóa dữ liệu |
| GET | /api/v1/nckh/models/{modelId}/dataset | Dataset đã chuẩn hóa |

### 10. Export

| Method | Path | Mô tả |
|---|---|---|
| GET | /api/v1/nckh/models/{modelId}/export?format=csv | Tải dataset.csv |
| GET | /api/v1/nckh/models/{modelId}/export?format=codebook | Tải codebook.xlsx |
| GET | /api/v1/nckh/models/{modelId}/export?format=spss | Tải syntax.sps |

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
