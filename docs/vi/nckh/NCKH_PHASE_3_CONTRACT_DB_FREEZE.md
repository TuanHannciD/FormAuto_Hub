# NCKH_PHASE_3_CONTRACT_DB_FREEZE

## Mục đích

Ghi lại review Pass 0 về contract và database freeze cho NCKH Phase 3 trước khi bắt đầu bất kỳ production implementation nào.

File này là artifact review và approval. Nó không đánh dấu Phase 3 là đã implement hoặc completed.

## Kết quả review

Trạng thái: **Sẵn sàng xin approval implementation Phase 3 sau khi user chấp nhận các freeze decisions bên dưới**.

Phase 3 chỉ được chuyển sang implementation sau khi freeze này được chấp nhận. Cho đến lúc đó, `ModelRelation`, `NodePosition`, và các route Phase 3 vẫn là proposed.

## Evidence đã đọc

- `NCKH_PROGRESS_LEDGER.md`
- `NCKH_PHASE_TRANSITION_GUIDE.md`
- `NCKH_PHASE_ROADMAP.md`
- `NCKH_PHASE_2_CLOSEOUT.md`
- `NCKH_PHASE_3_KICKOFF_PLAN.md`
- `NCKH_DOMAIN_ENTITIES_OVERVIEW.md`
- `NCKH_API_CONTRACT_GUIDE.md`
- `NCKH_MODULE_MAP.md`
- `NCKH_ARCHITECTURE_BOUNDARIES.md`
- Source Phase 2 hiện tại cho `ResearchModel`, `ResearchVariable`, `ObservedQuestionMapping`, controllers, services, contracts, và DbContext configuration

## Baseline hiện tại đã confirmed

Confirmed từ source repo hiện tại và closeout evidence:

- NCKH Phase 1 và Phase 2 đã completed cho đúng scope được duyệt.
- Giá trị `ResearchModel.Status` đã implement hiện tại chỉ có `Draft` và `Active`.
- `Archived` chưa được implement và nằm ngoài Phase 3.
- Phase 2 dùng SQL Server + EF Core migrations trong `FormAutoHubDbContext` dùng chung.
- Route prefix hiện tại là `/api/v1/nckh`.
- Model routes hiện tại dùng `/api/v1/nckh/models`.
- Variable routes hiện tại dùng `/api/v1/nckh/models/{modelId}/variables` và `/api/v1/nckh/variables/{variableId}`.
- Mapping routes hiện tại dùng `/api/v1/nckh/variables/{variableId}/mappings`, `/api/v1/nckh/models/{modelId}/mappings`, và `/api/v1/nckh/mappings/{mappingId}`.
- `ResearchModel -> ResearchVariable` dùng cascade delete.
- `ResearchVariable -> ObservedQuestionMapping` dùng cascade delete.
- `ObservedQuestionMapping -> ResearchFormQuestion` dùng restrict delete behavior.
- `ResearchModel -> ResearchForm` dùng restrict delete behavior.
- Xóa model trong Phase 2 hiện chỉ xóa owned cascade path của Phase 2.

## Conflict và clarification

Các docs conceptual NCKH có nhắc đến entity và behavior tương lai chưa implement. Với Phase 3, xử lý như sau:

- `Archived` xuất hiện trong một số wording lifecycle conceptual, nhưng Phase 3 không được implement nó.
- Survey responses, normalized datasets, data collection logs, export, và statistical analysis vẫn là phase tương lai.
- Data-impact behavior như mark normalized datasets stale không thuộc Phase 3 vì Phase 5 data behavior chưa được duyệt.
- React Flow và frontend canvas rendering nằm ngoài Phase 3 trừ khi được duyệt riêng sau backend contract freeze.

## Freeze Decision: ModelRelation

Approval status: **Proposed for Phase 3 implementation approval**.

Entity fields:

- `Id` GUID primary key
- `ModelId` GUID FK đến `ResearchModels.Id`
- `FromVariableId` GUID FK đến `ResearchVariables.Id`
- `ToVariableId` GUID FK đến `ResearchVariables.Id`
- `Direction` string, allowed values: `Positive`, `Negative`
- `HypothesisCode` string, service tự sinh
- `HypothesisText` string, service tự sinh
- `SortOrder` int
- `CreatedAt` DateTimeOffset
- `UpdatedAt` DateTimeOffset

Database rules:

- `ModelId -> ResearchModels`: cascade delete
- `FromVariableId -> ResearchVariables`: restrict delete
- `ToVariableId -> ResearchVariables`: restrict delete
- unique index trên `(ModelId, FromVariableId, ToVariableId)`
- unique index trên `(ModelId, HypothesisCode)`
- check constraint reject `FromVariableId == ToVariableId`
- EF Core config rõ cho cả hai FK đến `ResearchVariables`

Validation rules:

- model phải thuộc current user
- cả hai variable phải thuộc cùng model
- self-relation bị reject
- duplicate `(ModelId, FromVariableId, ToVariableId)` bị reject
- inverse relation được phép vì thể hiện chiều ảnh hưởng khác
- relations chỉ được create, update, delete khi model là `Draft`
- model `Active` là read-only cho relation edits trong Phase 3

Rationale:

- Giữ Phase 3 khớp lifecycle `Draft -> Active` hiện có mà không thêm `Archived`.
- Restrict delete trên variables tránh mất hypothesis relations âm thầm khi xóa variable.
- Unique source-target pairs tránh duplicate positive/negative mâu thuẫn cho cùng directed relation.

## Freeze Decision: NodePosition

Approval status: **Proposed for Phase 3 implementation approval**.

Entity fields:

- `Id` GUID primary key
- `ModelId` GUID FK đến `ResearchModels.Id`
- `NodeType` string, allowed values: `Variable`, `Relation`
- `VariableId` GUID nullable FK đến `ResearchVariables.Id`
- `RelationId` GUID nullable FK đến `ModelRelations.Id`
- `PositionX` decimal với precision `(18, 2)`
- `PositionY` decimal với precision `(18, 2)`
- `CreatedAt` DateTimeOffset
- `UpdatedAt` DateTimeOffset

Database rules:

- `ModelId -> ResearchModels`: cascade delete
- `VariableId -> ResearchVariables`: cascade delete
- `RelationId -> ModelRelations`: cascade delete
- check constraint: chính xác một trong hai field `VariableId` hoặc `RelationId` phải có giá trị
- unique index trên `(ModelId, NodeType, VariableId)` filtered where `VariableId IS NOT NULL`
- unique index trên `(ModelId, NodeType, RelationId)` filtered where `RelationId IS NOT NULL`

Validation rules:

- model phải thuộc current user
- variable positions phải tham chiếu variables trong cùng model
- relation positions phải tham chiếu relations trong cùng model
- positions chỉ được save khi model là `Draft`
- model `Active` là read-only cho position edits trong Phase 3
- coordinate values được nhận là decimal và persisted với hai chữ số thập phân
- backend Phase 3 không enforce viewport bounds

Rationale:

- Lưu cả variable node và relation node vì proposed API hiện đã có cả hai node types.
- Không đưa payload React Flow frontend-specific thành backend ownership, nhưng vẫn lưu đủ coordinate data cho UI tương lai.
- Không hardcode frontend canvas dimensions ở backend.

## Freeze Decision: Hypothesis Generation

Approval status: **Proposed for Phase 3 implementation approval**.

Rules:

- hypothesis generation chỉ deterministic
- không gọi AI provider
- `HypothesisCode` sinh theo dạng `H{n}` trong phạm vi model, sắp theo relation `SortOrder` rồi creation time
- template `Positive`: `{fromVariableName} has a positive influence on {toVariableName}`
- template `Negative`: `{fromVariableName} has a negative influence on {toVariableName}`
- Vietnamese display wording có thể xử lý ở frontend/localization sau; backend text persisted giữ deterministic

Rationale:

- Giữ Phase 3 testable và repeatable.
- Không approve AI-generated hypothesis behavior.
- Không đưa statistical interpretation vào app.

## Freeze Decision: API Surface

Approval status: **Proposed for Phase 3 implementation approval**.

Relation endpoints:

- `POST /api/v1/nckh/models/{modelId}/relations`
- `GET /api/v1/nckh/models/{modelId}/relations`
- `GET /api/v1/nckh/relations/{relationId}`
- `PUT /api/v1/nckh/relations/{relationId}`
- `DELETE /api/v1/nckh/relations/{relationId}`

Node position endpoints:

- `GET /api/v1/nckh/models/{modelId}/positions`
- `PUT /api/v1/nckh/models/{modelId}/positions`

Route ownership:

- relation và position routes nằm ở NCKH controller layer
- services own ownership checks, same-model validation, duplicate detection, và deterministic hypothesis generation
- entities chỉ lưu persisted state

## Request và response shape

Approval status: **Proposed for Phase 3 implementation approval**.

Create relation request:

```json
{
  "fromVariableId": "guid",
  "toVariableId": "guid",
  "direction": "Positive",
  "sortOrder": 1
}
```

Update relation request:

```json
{
  "fromVariableId": "guid",
  "toVariableId": "guid",
  "direction": "Negative",
  "sortOrder": 2
}
```

Relation response:

```json
{
  "id": "guid",
  "modelId": "guid",
  "fromVariableId": "guid",
  "fromVariableName": "Self-study skill",
  "fromVariableCode": "TH",
  "toVariableId": "guid",
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

Save positions request:

```json
{
  "positions": [
    { "nodeType": "Variable", "variableId": "guid", "positionX": 150.0, "positionY": 200.0 },
    { "nodeType": "Relation", "relationId": "guid", "positionX": 275.0, "positionY": 200.0 }
  ]
}
```

Position response item:

```json
{
  "id": "guid",
  "nodeType": "Variable",
  "variableId": "guid",
  "relationId": null,
  "positionX": 150.0,
  "positionY": 200.0,
  "updatedAt": "2026-06-04T00:00:00Z"
}
```

## Error behavior

Dùng pattern service-result hiện có của Phase 2 trừ khi một API-wide error format refactor được duyệt riêng.

Status mapping dự kiến:

- `400` validation failure, invalid direction, self-relation, invalid node reference, invalid node type
- `401` unauthenticated request
- `404` model, variable, relation, hoặc position target không tìm thấy trong scope current user
- `409` duplicate directed relation hoặc duplicate node position conflict

## DB risk review

Findings:

- High: dual FK từ `ModelRelations` đến `ResearchVariables` phải được config rõ với `DeleteBehavior.Restrict`; nếu không EF Core migration generation hoặc SQL Server cascade path behavior có thể fail.
- High: variable delete phải bị chặn khi còn relations, nếu không hypothesis relations có thể mất âm thầm.
- Medium: filtered unique indexes cho nullable `VariableId` và `RelationId` cần filter tương thích SQL Server.
- Medium: hypothesis code generation có race nếu hai relations được tạo đồng thời cho cùng model; implementation nên generate trong transaction hoặc dựa vào unique `(ModelId, HypothesisCode)` index và trả conflict khi collision.
- Medium: edit model `Active` có thể làm thay đổi research model sau khi đã activate; Phase 3 nên giữ edit Draft-only.
- Low: coordinate values là UI-oriented và không nên mang business meaning.

Implementation safeguards bắt buộc:

- migration phải reversible
- migration không được alter bảng Phase 1 hoặc Phase 2 trừ việc thêm FK đã review từ bảng Phase 3
- service tests phải cover ownership, cross-model variables, self-relation, duplicate relation, và Draft-only edit rules
- runtime HTTP smoke phải cover relation CRUD và position save/load trước closeout


## Điều chỉnh implementation đã approve

Trong validation implementation Phase 3, SQL Server reject FK shape cascade toàn bộ của `NodePositions` vì tạo multiple cascade paths. User đã approve điều chỉnh implementation: dùng restrict/no-action cho `NodePosition.ModelId -> ResearchModels` và `NodePosition.VariableId -> ResearchVariables`, đồng thời giữ cleanup behavior trong service và giữ `NodePosition.RelationId -> ModelRelations` cascade. Xem `NCKH_PHASE_3_CLOSEOUT.md`.

## Deferred

- lifecycle `Archived`
- AI-generated hypothesis text
- statistical analysis
- Google Forms create/update
- Google Sheets response pull
- thu thập response
- normalization/export
- credit/pricing
- NCKH admin UI
- React Flow frontend implementation trừ khi được duyệt riêng

## Cần approval trước implementation

Approve hoặc chỉnh các freeze decisions này trước khi giao implementation worker:

- field list và DB rules của `ModelRelation`
- field list và DB rules của `NodePosition`
- allowed values `Direction`: `Positive`, `Negative`
- reject self-relation
- reject duplicate directed relation theo `(ModelId, FromVariableId, ToVariableId)`
- cho phép inverse relation
- chỉ cho edit relations và positions khi model là `Draft`
- deterministic English hypothesis templates
- route surface và DTO shape đề xuất

## Pass tiếp theo nếu được approve

Chỉ chuyển sang **Phase 3 Pass 1 - Persistence Foundation** sau khi freeze này được chấp nhận rõ.



