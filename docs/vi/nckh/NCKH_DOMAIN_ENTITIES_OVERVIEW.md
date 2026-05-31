# NCKH_DOMAIN_ENTITIES_OVERVIEW

## Mục đích

Mô tả mô hình entity cho NCKH Survey Module. Tất cả entity là mới, không kế thừa từ entity FormAuto Hub.

## Trạng thái hợp đồng

Entity khái niệm đề xuất. Các trường là proposed, cần đánh giá cơ sở dữ liệu trước khi triển khai.

## Sơ đồ quan hệ entity

```
Users (hiện có)
  │
  ├── 1:N ── ResearchForms (Form khảo sát đã import)
  │            │
  │            └── 1:N ── ResearchFormQuestions (Câu hỏi trong form)
  │
  └── 1:N ── ResearchModels (Mô hình nghiên cứu)
               │
               ├── 1:1 ── ResearchForms
               │
               ├── 1:N ── ResearchVariables (Biến nghiên cứu)
               │            │
               │            └── 1:N ── ObservedQuestionMappings (Map câu hỏi → biến)
               │                         │
               │                         └── 1:1 ── ResearchFormQuestions
               │
               ├── 1:N ── ModelRelations (Quan hệ giữa các biến)
               │            │
               │            ├── FK ──> ResearchVariables (Từ)
               │            └── FK ──> ResearchVariables (Đến)
               │
               ├── 1:N ── NodePositions (Tọa độ node trên canvas)
               │
               ├── 1:N ── SurveyResponses (Dữ liệu khảo sát thô)
               │
               ├── 1:N ── NormalizedDatasets (Dữ liệu đã chuẩn hóa)
               │
               └── 1:N ── DataCollectionLogs (Nhật ký thu thập)
```


## Tổ chức code

Entity NCKH dùng sub-namespace `FormAutoHub.Api.Entities.Nckh` để tách biệt với entity FormAuto Hub.
Tất cả file entity NCKH nằm trong `src/FormAutoHub.Api/Entities/Nckh/`.



1. ResearchForms — Form khảo sát đã import
2. ResearchFormQuestions — Câu hỏi từ Google Form
3. ResearchModels — Mô hình nghiên cứu
4. ResearchVariables — Biến nghiên cứu
5. ObservedQuestionMappings — Ánh xạ câu hỏi → biến
6. ModelRelations — Quan hệ giữa các biến
7. NodePositions — Tọa độ node canvas
8. SurveyResponses — Dữ liệu khảo sát thô
9. NormalizedDatasets — Dữ liệu đã chuẩn hóa
10. DataCollectionLogs — Nhật ký thu thập

## Trường MVP đề xuất

### ResearchForms

- Id (GUID, PK)
- UserId (FK → Users.Id)
- GoogleFormId (string)
- FormUrl (string)
- Title (string)
- Status (Draft | Active)
- ImportedAt (DateTime)
- CreatedAt, UpdatedAt (DateTime)

Index: UNIQUE(UserId, GoogleFormId)

### ResearchFormQuestions

- Id (GUID, PK)
- FormId (FK → ResearchForms.Id)
- GoogleQuestionId (string)
- QuestionText (string)
- QuestionType (string)
- IsRequired (bool)
- OrderIndex (int)
- CreatedAt (DateTime)

Index: (FormId, GoogleQuestionId); (FormId, OrderIndex)

### ResearchModels

- Id (GUID, PK)
- UserId (FK → Users.Id)
- FormId (FK → ResearchForms.Id)
- Name (string)
- Description (string, nullable)
- Status (Draft | Active | Archived)
- CreatedAt, UpdatedAt (DateTime)

Index: (UserId, Status); UNIQUE(FormId)

### ResearchVariables

- Id (GUID, PK)
- ModelId (FK → ResearchModels.Id)
- Name (string)
- Code (string)
- VariableType (Independent | Dependent | Mediator | Moderator | Control)
- ScaleType (Likert | Nominal | Ordinal | Scale)
- ScalePoint (int, nullable)
- MinValue, MaxValue (decimal, nullable)
- SortOrder (int)
- CreatedAt, UpdatedAt (DateTime)

Index: UNIQUE(ModelId, Code)


### ObservedQuestionMappings

Ánh xạ câu hỏi Google Form vào biến.

- Id (GUID, PK)
- VariableId (FK → ResearchVariables.Id, CASCADE DELETE)
- FormQuestionId (FK → ResearchFormQuestions.Id, **Restrict** — không cascade ngược lên Question)
- ObservedCode (string, VD: "TH1", "TH2")
- SortOrder (int)
- CreatedAt (DateTime)

Index: UNIQUE(VariableId, FormQuestionId); UNIQUE(VariableId, ObservedCode)

**Quy tắc DeleteBehavior:** `FormQuestionId` dùng `DeleteBehavior.Restrict` để tránh mất mapping khi import lại form. FormQuestion đang được mapping không thể bị xóa — phải gỡ mapping trước hoặc cập nhật tại chỗ khi re-import.

- Id (GUID, PK)
- VariableId (FK → ResearchVariables.Id, CASCADE DELETE)
- FormQuestionId (FK → ResearchFormQuestions.Id)
- ObservedCode (string)
- SortOrder (int)
- CreatedAt (DateTime)

Index: UNIQUE(VariableId, FormQuestionId); UNIQUE(VariableId, ObservedCode)


### ModelRelations

Quan hệ giữa các biến trong mô hình, kèm giả thuyết.

- Id (GUID, PK)
- ModelId (FK → ResearchModels.Id, **CASCADE DELETE**)
- FromVariableId (FK → ResearchVariables.Id, **Restrict** — không cascade xóa Biến → Quan hệ)
- ToVariableId (FK → ResearchVariables.Id, **Restrict** — tương tự)
- HypothesisCode (string, tự sinh: "H1", "H2", ...)
- HypothesisText (string, tự sinh: "{biến gốc} có ảnh hưởng {hướng} đến {biến đích}")
- Direction (enum: Positive | Negative)
- CreatedAt, UpdatedAt (DateTime)

Index: UNIQUE(ModelId, FromVariableId, ToVariableId); UNIQUE(ModelId, HypothesisCode)
Ràng buộc: CHECK(FromVariableId != ToVariableId)

**Quy tắc DeleteBehavior:**
- `ModelId → Cascade`: Xóa Model → xóa mọi Relation.
- `FromVariableId → Restrict`: Không cho xóa Biến nếu đang là nguồn của Relation. Phải xóa Relation trước.
- `ToVariableId → Restrict`: Không cho xóa Biến nếu đang là đích của Relation. Phải xóa Relation trước.

**Yêu cầu EF Core dual-FK:** Do có 2 FK cùng trỏ vào bảng `ResearchVariables`, cả 2 navigation property (`FromVariable`, `ToVariable`) PHẢI được cấu hình rõ ràng trong `OnModelCreating` với `HasForeignKey` + `DeleteBehavior.Restrict`, nếu không migration sẽ báo lỗi.

- Id (GUID, PK)
- ModelId (FK → ResearchModels.Id)
- FromVariableId (FK → ResearchVariables.Id)
- ToVariableId (FK → ResearchVariables.Id)
- HypothesisCode (string, tự sinh)
- HypothesisText (string, tự sinh)
- Direction (Positive | Negative)
- CreatedAt, UpdatedAt (DateTime)

Index: UNIQUE(ModelId, FromVariableId, ToVariableId); UNIQUE(ModelId, HypothesisCode)
Ràng buộc: CHECK(FromVariableId != ToVariableId)


### NodePositions

Tọa độ node trên canvas — dùng 1 bảng với CHECK constraint.

- Id (GUID, PK)
- ModelId (FK → ResearchModels.Id, CASCADE DELETE)
- VariableId (FK → ResearchVariables.Id, nullable, CASCADE DELETE)
- RelationId (FK → ModelRelations.Id, nullable, CASCADE DELETE)
- NodeType (Variable | Relation)
- PositionX, PositionY (float)
- CreatedAt, UpdatedAt (DateTime)

Index: (ModelId)
Ràng buộc: `CK_NodePositions_ValidNode` — CHECK((VariableId IS NOT NULL AND RelationId IS NULL) OR (VariableId IS NULL AND RelationId IS NOT NULL))

**Quyết định thiết kế:** Dùng 1 bảng với CHECK constraint thay vì tách 2 bảng (`VariablePositions` + `RelationPositions`) vì canvas cần load tất cả vị trí trong 1 query (`WHERE ModelId = x`). CHECK constraint cần 3 dòng raw SQL trong migration — chi phí chấp nhận được.

**Lưu ý migration:** CHECK constraint phải thêm qua `migrationBuilder.Sql()` vì EF Core không hỗ trợ CHECK constraint trong fluent API.

- Id (GUID, PK)
- ModelId (FK → ResearchModels.Id)
- VariableId (FK → ResearchVariables.Id, nullable)
- RelationId (FK → ModelRelations.Id, nullable)
- NodeType (Variable | Relation)
- PositionX, PositionY (float)
- CreatedAt, UpdatedAt (DateTime)

Index: (ModelId)

### SurveyResponses

- Id (GUID, PK)
- ModelId (FK → ResearchModels.Id)
- GoogleResponseId (string)
- RespondentId (string)
- RawDataJson (nvarchar(max))
- ResponseTimestamp (DateTime)
- CreatedAt, UpdatedAt (DateTime)

Index: UNIQUE(ModelId, GoogleResponseId); (ModelId, RespondentId)

### NormalizedDatasets

- Id (GUID, PK)
- ModelId (FK → ResearchModels.Id)
- RespondentId (string)
- NormalizedDataJson (nvarchar(max))
- ComputedScoresJson (nvarchar(max))
- NormalizedAt (DateTime)
- IsStale (bool, mặc định: false) — đánh dấu cần chuẩn hóa lại sau khi sửa biến
- CreatedAt (DateTime)

Index: UNIQUE(ModelId, RespondentId); (ModelId, NormalizedAt)

### DataCollectionLogs

- Id (GUID, PK)
- ModelId (FK → ResearchModels.Id)
- Status (Success | Partial | Failed)
- ResponsesCollected (int)
- ResponsesSkipped (int)
- ErrorMessage (string, nullable)
- StartedAt, CompletedAt (DateTime)
- CreatedAt (DateTime)

Index: (ModelId, CreatedAt)

## Kỷ luật sổ cái (Đơn giản hóa cho NCKH)

NCKH MVP không tính credit → không cần CreditTransactions hay UsageLogs.

- DataCollectionLogs ghi nhận mỗi lần kéo dữ liệu
- SurveyResponses.GoogleResponseId đảm bảo không trùng lặp


## Khả năng hoàn tác Migration

| Migration | Có thể hoàn tác? | Ghi chú |
|---|---|---|
| NckhPhase1_FormsAndOAuth | Có | DROP TABLE — không mất dữ liệu quan trọng |
| NckhPhase2_ModelsAndVariables | Có | DROP TABLE — mất dữ liệu model/biến/mapping |
| NckhPhase3_Relations | Có | DROP TABLE — mất quan hệ/vị trí canvas |
| NckhPhase5_Data | Có (cần cảnh báo) | DROP TABLE — mất dữ liệu khảo sát và chuẩn hóa |

Luôn chạy `dotnet ef migrations script` để xem SQL trước khi áp dụng.
Kiểm tra DOWN script trên bản sao database trước khi hoàn tác production.



- Trường credit/giá
- Trường cộng tác nhiều nhà nghiên cứu
- Trường thu thập theo lịch
- Trường thông báo real-time

## Trường bị cấm phát minh

- Xoay proxy
- Giải captcha
- Tạo tài khoản giả
- Chiến dịch spam
- Gửi form trái phép
- AI tự sinh nội dung giả thuyết (giả thuyết tự sinh theo mẫu có sẵn, không gọi AI)
