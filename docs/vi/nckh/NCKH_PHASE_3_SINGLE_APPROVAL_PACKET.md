# NCKH_PHASE_3_SINGLE_APPROVAL_PACKET

## Mục đích

Gom toàn bộ approval còn lại của NCKH Phase 3 vào một quyết định để các implementation sub-agent có thể làm việc mà không dừng lại hỏi lại các lựa chọn contract hoặc database đã được review.

File này là approval packet. Nó không đánh dấu Phase 3 là đã implement hoặc completed.

## Câu approval một lần

Nếu user approve packet này, các điểm sau được duyệt làm baseline implementation Phase 3:

- Mở implementation NCKH Phase 3 cho backend-only Canvas Relations & Hypothesis.
- Dùng `NCKH_PHASE_3_CONTRACT_DB_FREEZE.md` làm baseline chính thức cho contract và DB freeze Phase 3.
- Chỉ implement `ModelRelation` và `NodePosition`.
- Chỉ implement relation CRUD, node-position save/load, và deterministic hypothesis output.
- Giữ implementation backend-only trừ khi có approval rõ sau này để mở frontend work.

## Quyết định được approve bởi packet này

### Relation contract

- `ModelRelation` thuộc về một `ResearchModel`.
- `ModelRelation` nối `FromVariableId` đến `ToVariableId` trong cùng model.
- `Direction` allowed values: `Positive`, `Negative`.
- Reject self-relation khi `FromVariableId == ToVariableId`.
- Reject duplicate directed relation theo `(ModelId, FromVariableId, ToVariableId)`.
- Cho phép inverse relation vì đó là chiều ảnh hưởng khác.
- Relations chỉ được edit khi model là `Draft`.
- Model `Active` là read-only cho relation edits trong Phase 3.
- `Archived` vẫn Deferred.

### Node position contract

- `NodePosition` thuộc về một `ResearchModel`.
- `NodeType` allowed values: `Variable`, `Relation`.
- Lưu vị trí cho variable nodes và relation nodes.
- Chính xác một trong hai field `VariableId` hoặc `RelationId` phải có giá trị.
- Node positions chỉ được edit khi model là `Draft`.
- Model `Active` là read-only cho position edits trong Phase 3.
- Persist coordinates dạng decimal với hai chữ số thập phân.
- Backend không enforce frontend viewport bounds.

### Hypothesis contract

- Hypothesis output chỉ được sinh deterministic.
- Không gọi AI provider.
- `HypothesisCode` dùng dạng `H{n}` trong phạm vi model.
- `HypothesisText` dùng deterministic English templates:
  - Positive: `{fromVariableName} has a positive influence on {toVariableName}`
  - Negative: `{fromVariableName} has a negative influence on {toVariableName}`
- Vietnamese display wording là việc frontend/localization tương lai.
- Statistical interpretation vẫn Deferred.

### Database contract

- `ModelRelation.ModelId -> ResearchModels`: cascade delete.
- `ModelRelation.FromVariableId -> ResearchVariables`: restrict delete.
- `ModelRelation.ToVariableId -> ResearchVariables`: restrict delete.
- `NodePosition.ModelId -> ResearchModels`: cascade delete.
- `NodePosition.VariableId -> ResearchVariables`: cascade delete.
- `NodePosition.RelationId -> ModelRelations`: cascade delete.
- Thêm unique index trên `(ModelId, FromVariableId, ToVariableId)`.
- Thêm unique index trên `(ModelId, HypothesisCode)`.
- Thêm filtered unique indexes tương thích SQL Server cho node positions.
- Thêm check constraints để reject self-relation và enforce exactly-one node target.
- Migration phải reversible.
- Migration không được alter bảng Phase 1 hoặc Phase 2 trừ việc thêm FK đã review từ bảng Phase 3.

### API contract

Relation endpoints:

- `POST /api/v1/nckh/models/{modelId}/relations`
- `GET /api/v1/nckh/models/{modelId}/relations`
- `GET /api/v1/nckh/relations/{relationId}`
- `PUT /api/v1/nckh/relations/{relationId}`
- `DELETE /api/v1/nckh/relations/{relationId}`

Node position endpoints:

- `GET /api/v1/nckh/models/{modelId}/positions`
- `PUT /api/v1/nckh/models/{modelId}/positions`

Error behavior dùng pattern service-result hiện có của Phase 2:

- `400` validation failure
- `401` unauthenticated request
- `404` target không tồn tại trong scope current user
- `409` duplicate relation hoặc duplicate node-position conflict

## Luồng sub-agent được approve

Dùng `templates/chat-starters/nckh-phase3/` theo thứ tự:

1. `01_persistence_foundation.md`
2. `02_relation_api.md`
3. `03_node_positions_hypothesis.md`
4. `04_validation_closeout_docs.md`
5. `05_review.md`

Implementation workers chỉ dừng khi có conflict thật với source hiện tại, migration design không thể theo packet này, hoặc validation blocker. Worker không cần dừng để hỏi lại các quyết định đã approve ở trên.

## Vẫn Deferred

- lifecycle `Archived`
- AI-generated hypothesis text
- statistical analysis
- Google Forms create/update
- Google Sheets response pull
- thu thập response
- normalization/export
- credit/pricing
- NCKH admin UI
- React Flow/frontend canvas implementation
- production-readiness claims khi chưa có runtime validation hiện tại

## Validation bắt buộc trước closeout

Validation tối thiểu trước khi được đánh dấu Phase 3 completed:

- `dotnet build FormAutoHub.sln -c Release`
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release`
- `dotnet ef database update` trên Development SQL Server database mục tiêu
- authenticated HTTP smoke cho relation CRUD
- authenticated HTTP smoke cho position save/load
- inspect logs sau smoke checks
- cleanup smoke data

Không bắt buộc trừ khi frontend files thay đổi:

- `npm run build`
- Playwright/browser smoke


