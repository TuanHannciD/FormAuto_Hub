# NCKH_DOMAIN_ENTITIES_OVERVIEW

## Purpose

Mô tả entity model cho NCKH Survey Module. Tất cả entity là mới, không kế thừa từ FormAuto Hub entities.

## Contract Status

Proposed conceptual entities. Fields là proposed, cần database review trước implementation.

## Entity Relationship Diagram

```
Users (existing)
  │
  ├── 1:N ── ResearchForms
  │            │
  │            └── 1:N ── ResearchFormQuestions
  │
  └── 1:N ── ResearchModels
               │
               ├── N:1 ── ResearchForms
               │
               ├── 1:N ── ResearchVariables
               │            │
               │            └── 1:N ── ObservedQuestionMappings
               │                         │
               │                         └── 1:1 ── ResearchFormQuestions
               │
               ├── 1:N ── ModelRelations
               │            │
               │            ├── FK ──> ResearchVariables (From)
               │            └── FK ──> ResearchVariables (To)
               │
               ├── 1:N ── NodePositions
               │
               ├── 1:N ── SurveyResponses
               │
               ├── 1:N ── NormalizedDatasets
               │
               └── 1:N ── DataCollectionLogs
```


## Code Organization

NCKH entities use sub-namespace `FormAutoHub.Api.Entities.Nckh` to stay separated from FormAuto Hub entities.
All NCKH entity files live under `src/FormAutoHub.Api/Entities/Nckh/`.



1. ResearchForms
2. ResearchFormQuestions
3. ResearchModels
4. ResearchVariables
5. ObservedQuestionMappings
6. ModelRelations
7. NodePositions
8. SurveyResponses
9. NormalizedDatasets
10. DataCollectionLogs

## Proposed MVP Fields

### ResearchForms

Google Form đã import vào hệ thống.

- Id (GUID, PK)
- UserId (FK → Users.Id)
- GoogleFormId (string)
- FormUrl (string)
- Title (string)
- Status (Draft | Active)
- ImportedAt (DateTime)
- CreatedAt (DateTime)
- UpdatedAt (DateTime)

Index: UNIQUE(UserId, GoogleFormId)

### ResearchFormQuestions

Câu hỏi từ Google Form.

- Id (GUID, PK)
- FormId (FK → ResearchForms.Id)
- GoogleQuestionId (string)
- QuestionText (string)
- QuestionType (string: multipleChoice, text, linearScale, ...)
- IsRequired (bool)
- OrderIndex (int)
- CreatedAt (DateTime)

Index: (FormId, GoogleQuestionId); (FormId, OrderIndex)

### ResearchModels

Mô hình nghiên cứu — đơn vị trung tâm của module.

- Id (GUID, PK)
- UserId (FK → Users.Id)
- FormId (FK → ResearchForms.Id)
- Name (string)
- Description (string, nullable)
- Status (Draft | Active)
- CreatedAt (DateTime)
- UpdatedAt (DateTime)

Index: (UserId, Status); (FormId, Status)

Approved Phase 2 direction:

- multiple models per imported form are allowed
- at most one `Active` model per form is allowed
- `Draft` is the required minimum status for Phase 2
- `Archived` remains outside current Phase 2 scope

### ResearchVariables

Biến nghiên cứu trong mô hình.

- Id (GUID, PK)
- ModelId (FK → ResearchModels.Id)
- Name (string, VD: "Kỹ năng tự học")
- Code (string, VD: "TH")
- VariableType (enum: Independent | Dependent | Mediator | Moderator | Control)
- ScaleType (enum: Likert | Nominal | Ordinal | Scale)
- ScalePoint (int, nullable)
- MinValue (decimal, nullable)
- MaxValue (decimal, nullable)
- SortOrder (int)
- CreatedAt (DateTime)
- UpdatedAt (DateTime)

Index: UNIQUE(ModelId, Code)


### ObservedQuestionMappings

Map câu hỏi Google Form vào biến.

- Id (GUID, PK)
- VariableId (FK → ResearchVariables.Id, CASCADE DELETE)
- FormQuestionId (FK → ResearchFormQuestions.Id, **Restrict** — không cascade ngược lên Question)
- ObservedCode (string, VD: "TH1", "TH2")
- SortOrder (int)
- CreatedAt (DateTime)

Index: UNIQUE(VariableId, FormQuestionId); UNIQUE(VariableId, ObservedCode)

**DeleteBehavior rule:** `FormQuestionId` uses `DeleteBehavior.Restrict` to prevent accidental mapping loss when re-importing a form. FormQuestions referenced by mappings cannot be deleted — they must be unmapped first or updated in-place during re-import.

Map câu hỏi Google Form vào biến.

- Id (GUID, PK)
- VariableId (FK → ResearchVariables.Id, CASCADE DELETE)
- FormQuestionId (FK → ResearchFormQuestions.Id)
- ObservedCode (string, VD: "TH1", "TH2")
- SortOrder (int)
- CreatedAt (DateTime)

Index: UNIQUE(VariableId, FormQuestionId); UNIQUE(VariableId, ObservedCode)


### ModelRelations

Quan hệ giữa các biến trong mô hình, kèm giả thuyết.

- Id (GUID, PK)
- ModelId (FK → ResearchModels.Id, **CASCADE DELETE**)
- FromVariableId (FK → ResearchVariables.Id, **Restrict** — không cascade xóa Variable → Relation)
- ToVariableId (FK → ResearchVariables.Id, **Restrict** — same)
- HypothesisCode (string, tự sinh: "H1", "H2", ...)
- HypothesisText (string, tự sinh: "{fromVar} ảnh hưởng {directionText} đến {toVar}")
- Direction (enum: Positive | Negative)
- CreatedAt (DateTime)
- UpdatedAt (DateTime)

Index: UNIQUE(ModelId, FromVariableId, ToVariableId); UNIQUE(ModelId, HypothesisCode)
Constraint: CHECK(FromVariableId != ToVariableId)

**DeleteBehavior rules:**
- `ModelId → Cascade`: Xóa Model → xóa mọi Relation trong model đó.
- `FromVariableId → Restrict`: Không cho phép xóa Variable nếu đang là nguồn của Relation. Phải xóa Relation trước.
- `ToVariableId → Restrict`: Không cho phép xóa Variable nếu đang là đích của Relation. Phải xóa Relation trước.

**EF Core dual-FK requirement:** Due to two FKs targeting the same table (`ResearchVariables`), both navigation properties (`FromVariable`, `ToVariable`) MUST be explicitly configured in `OnModelCreating` with `HasForeignKey` + `DeleteBehavior.Restrict`, otherwise migration generation will fail.

Quan hệ giữa các biến trong mô hình, kèm giả thuyết.

- Id (GUID, PK)
- ModelId (FK → ResearchModels.Id)
- FromVariableId (FK → ResearchVariables.Id)
- ToVariableId (FK → ResearchVariables.Id)
- HypothesisCode (string, tự sinh: "H1", "H2", ...)
- HypothesisText (string, tự sinh: "{fromVar} ảnh hưởng {directionText} đến {toVar}")
- Direction (enum: Positive | Negative)
- CreatedAt (DateTime)
- UpdatedAt (DateTime)

Index: UNIQUE(ModelId, FromVariableId, ToVariableId); UNIQUE(ModelId, HypothesisCode)
Constraint: CHECK(FromVariableId != ToVariableId)


### NodePositions

Tọa độ node trên canvas — dùng để restore layout. Uses a single table with a CHECK constraint.

- Id (GUID, PK)
- ModelId (FK → ResearchModels.Id, CASCADE DELETE)
- VariableId (FK → ResearchVariables.Id, nullable, CASCADE DELETE)
- RelationId (FK → ModelRelations.Id, nullable, CASCADE DELETE)
- NodeType (enum: Variable | Relation)
- PositionX (float)
- PositionY (float)
- CreatedAt (DateTime)
- UpdatedAt (DateTime)

Index: (ModelId)
Constraint: `CK_NodePositions_ValidNode` — CHECK((VariableId IS NOT NULL AND RelationId IS NULL) OR (VariableId IS NULL AND RelationId IS NOT NULL))

**Design decision:** Single table with CHECK constraint was chosen over two separate tables (`VariablePositions` + `RelationPositions`) because canvas restore loads all positions in one query (`WHERE ModelId = x`). The CHECK constraint requires 3 lines of raw SQL in the migration — an acceptable trade-off.

**Migration note:** The CHECK constraint must be added via `migrationBuilder.Sql()` since EF Core does not support CHECK constraints in fluent API.

Tọa độ node trên canvas — dùng để restore layout.

- Id (GUID, PK)
- ModelId (FK → ResearchModels.Id)
- VariableId (FK → ResearchVariables.Id, nullable)
- RelationId (FK → ModelRelations.Id, nullable)
- NodeType (enum: Variable | Relation)
- PositionX (float)
- PositionY (float)
- CreatedAt (DateTime)
- UpdatedAt (DateTime)

Index: (ModelId)
Constraint: CHECK((VariableId IS NOT NULL AND RelationId IS NULL) OR (VariableId IS NULL AND RelationId IS NOT NULL))

### SurveyResponses

Raw response data từ Google Forms/Sheets API.

- Id (GUID, PK)
- ModelId (FK → ResearchModels.Id)
- GoogleResponseId (string)
- RespondentId (string)
- RawDataJson (nvarchar(max))
- ResponseTimestamp (DateTime)
- CreatedAt (DateTime)
- UpdatedAt (DateTime)

Index: UNIQUE(ModelId, GoogleResponseId); (ModelId, RespondentId)

### NormalizedDatasets

Dữ liệu đã chuẩn hóa theo biến — kết quả của normalization engine.

- Id (GUID, PK)
- ModelId (FK → ResearchModels.Id)
- RespondentId (string)
- NormalizedDataJson (nvarchar(max), VD: {"TH1":5, "TH2":4, "TH3":5, "AGE":20})
- ComputedScoresJson (nvarchar(max), VD: {"TH_mean":4.67})
- NormalizedAt (DateTime)
- IsStale (bool, default: false) — đánh dấu cần re-normalize sau khi sửa biến
- CreatedAt (DateTime)

Index: UNIQUE(ModelId, RespondentId); (ModelId, NormalizedAt)

### DataCollectionLogs

Audit log cho mỗi lần pull data.

- Id (GUID, PK)
- ModelId (FK → ResearchModels.Id)
- Status (Success | Partial | Failed)
- ResponsesCollected (int)
- ResponsesSkipped (int)
- ErrorMessage (string, nullable)
- StartedAt (DateTime)
- CompletedAt (DateTime)
- CreatedAt (DateTime)

Index: (ModelId, CreatedAt)

## Ledger Discipline (NCKH Simplified)

NCKH MVP không tính credit → không cần CreditTransactions hay UsageLogs.

- DataCollectionLogs ghi nhận mỗi lần pull data
- SurveyResponses.GoogleResponseId đảm bảo idempotent


## Migration Reversibility

| Migration | Reversible | Notes |
|---|---|---|
| NckhPhase1_FormsAndOAuth | Yes | DROP TABLE — no critical data loss |
| NckhPhase2_ModelsAndVariables | Yes | DROP TABLE — loses model/variable/mapping data |
| NckhPhase3_Relations | Yes | DROP TABLE — loses relations/positions |
| NckhPhase5_Data | Yes (with warning) | DROP TABLE — loses survey responses and normalized data |

Always run `dotnet ef migrations script` to review SQL before applying.
Test DOWN scripts on a database copy before production rollback.



- Credit/pricing fields
- Multi-researcher collaboration fields
- Scheduled collection fields
- Real-time notification fields

## Forbidden Invented Fields

- Proxy rotation
- Captcha solving
- Fake account creation
- Spam campaign
- Unauthorized submission targets
- AI auto-generate hypothesis content (hypothesis text tự sinh theo template có sẵn, không gọi AI)
