# NCKH_API_CONTRACT_GUIDE

## Mục đích

Đề xuất hợp đồng API cho NCKH Survey Module. Tất cả endpoint là proposed, cần review trước khi triển khai.

## Base Path

Tất cả endpoint NCKH bắt đầu với `/api/v1/nckh`.

## Xác thực

Tất cả endpoint yêu cầu JWT Bearer token. Vai trò: Researcher (vai trò người dùng mặc định) hoặc Admin.

## Endpoint đề xuất

### 1. Google OAuth & Import Form

| Method | Path | Mô tả |
|---|---|---|
| POST | /api/v1/nckh/auth/google-link | Liên kết Google Account |
| POST | /api/v1/nckh/forms/import | Import Google Form |
| GET | /api/v1/nckh/forms | Danh sách form đã import |
| GET | /api/v1/nckh/forms/{formId} | Chi tiết form + câu hỏi |

### 2. Research Models

| Method | Path | Mô tả |
|---|---|---|
| POST | /api/v1/nckh/models | Tạo mô hình nghiên cứu |
| GET | /api/v1/nckh/models | Danh sách model (lọc: status) |
| GET | /api/v1/nckh/models/{modelId} | Chi tiết model + biến + quan hệ |
| PUT | /api/v1/nckh/models/{modelId} | Sửa tên/mô tả model |
| DELETE | /api/v1/nckh/models/{modelId} | Xóa model |

### 3. Variables

| Method | Path | Mô tả |
|---|---|---|
| POST | /api/v1/nckh/models/{modelId}/variables | Thêm biến + mapping |
| GET | /api/v1/nckh/models/{modelId}/variables | Danh sách biến + mapping |
| PUT | /api/v1/nckh/variables/{variableId} | Sửa biến (cảnh báo nếu có data) |
| DELETE | /api/v1/nckh/variables/{variableId} | Xóa biến (cascade mapping) |

### 4. Relations

| Method | Path | Mô tả |
|---|---|---|
| POST | /api/v1/nckh/models/{modelId}/relations | Thêm quan hệ |
| GET | /api/v1/nckh/models/{modelId}/relations | Danh sách quan hệ |
| DELETE | /api/v1/nckh/relations/{relationId} | Xóa quan hệ |

### 5. Canvas Positions

| Method | Path | Mô tả |
|---|---|---|
| PUT | /api/v1/nckh/models/{modelId}/positions | Lưu tọa độ node |
| GET | /api/v1/nckh/models/{modelId}/positions | Tải tọa độ node |

### 6. Form Generation

| Method | Path | Mô tả |
|---|---|---|
| POST | /api/v1/nckh/models/{modelId}/generate-form | Tạo/cập nhật Google Form từ model |

### 7. Data Collection

| Method | Path | Mô tả |
|---|---|---|
| POST | /api/v1/nckh/models/{modelId}/collect | Kéo responses thủ công |
| GET | /api/v1/nckh/models/{modelId}/responses | Danh sách responses thô |

### 8. Data Normalization

| Method | Path | Mô tả |
|---|---|---|
| POST | /api/v1/nckh/models/{modelId}/normalize | Chuẩn hóa dữ liệu |
| GET | /api/v1/nckh/models/{modelId}/dataset | Dataset đã chuẩn hóa |

### 9. Export

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
- 1 form chỉ gắn được với 1 model (MVP)
- CASCADE DELETE áp dụng cho: Variable → Mappings + NodePositions; Model → Variables + Relations + Positions
