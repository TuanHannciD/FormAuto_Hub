# NCKH_PHASE_4_CONTRACT_DB_FREEZE

## Mục đích

Ghi lại review Pass 0 về contract, Google scope, và database freeze cho NCKH Phase 4 trước khi bắt đầu production implementation.

File này là artifact review và approval. Nó không đánh dấu Phase 4 đã implement hoặc completed.

## Kết quả review

Trạng thái: **Ready for explicit Phase 4 implementation approval after user accepts the freeze decisions below**.

Phase 4 chỉ được triển khai sau khi freeze này được chấp nhận. Trước thời điểm đó, routes, DTOs, Google write scope, và persistence changes cho Google Forms create/update vẫn là proposed.

## Source Evidence Đã Đọc

- `NCKH_PROGRESS_LEDGER.md`
- `NCKH_PHASE_TRANSITION_GUIDE.md`
- `NCKH_PHASE_ROADMAP.md`
- `NCKH_PHASE_3_CLOSEOUT.md`
- `NCKH_PHASE_4_KICKOFF_PLAN.md`
- `NCKH_REQUIREMENT_PACKAGE.md`
- `NCKH_DOMAIN_ENTITIES_OVERVIEW.md`
- `NCKH_API_CONTRACT_GUIDE.md`
- `NCKH_MODULE_MAP.md`
- `NCKH_ARCHITECTURE_BOUNDARIES.md`
- Official Google Forms API docs cho review create/update scope

## Baseline Đã Xác Nhận

- NCKH Phase 1, Phase 2, và Phase 3 đã completed cho đúng scope được duyệt.
- Route prefix hiện tại là `/api/v1/nckh`.
- Phase 1 đã có Google Forms read/import behavior.
- Phase 2 đã có model, variable, và observed mapping behavior.
- Phase 3 đã có relation, node-position, và deterministic hypothesis behavior.
- Giá trị `ResearchModel.Status` hiện implement chỉ gồm `Draft` và `Active`.
- `Archived` vẫn Deferred.
- Phase 4 không được thêm Google Sheets response pull, normalization, export, credit, admin UI, scheduled jobs, hoặc auto-submit.

## Google Scope Review

Approval status: **Proposed for Phase 4 implementation approval**.

Candidate write scope:

- `https://www.googleapis.com/auth/forms.body`

Lý do:

- Theo official Google Forms API docs đã review trong planning pass này, create và batch-update operations cần quyền ghi Forms body.

Rules:

- Scope này chỉ được request qua Google consent rõ từ user.
- Implementation không được mặc định rằng consent đọc Phase 1 đã bao gồm quyền ghi.
- Nếu Google token đã lưu thiếu write scope, API phải trả lỗi cần re-consent rõ ràng thay vì cố ghi.
- Google Sheets scope vẫn Deferred đến Phase 5.

Google API behavior risk:

- Official Google Forms API docs nói rằng form được tạo bằng API sau 2026-06-30 sẽ mặc định là unpublished. Implementation Phase 4 phải verify hành vi publish/response availability khi runtime validation, không được mặc định form vừa tạo sẽ nhận response ngay.

## Freeze Decision: Phase 4 Route Surface

Approval status: **Proposed for Phase 4 implementation approval**.

Endpoint:

- `POST /api/v1/nckh/models/{modelId}/generate-form`

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

Allowed action values:

- `create`
- `update`

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

Expected status mapping:

- `400` validation failure, unsupported action, model chưa sẵn sàng để generate
- `401` unauthenticated request hoặc Google account chưa linked
- `403` thiếu Google Forms write scope hoặc không được phép update target form
- `404` model/form target không nằm trong scope current user
- `409` unsafe update conflict, stale mappings, hoặc duplicate generated-form conflict
- `502` Google Forms API write/import failure

## Freeze Decision: Ownership And Model Readiness

Approval status: **Proposed for Phase 4 implementation approval**.

Rules:

- Model phải thuộc current authenticated user.
- Imported form của model phải thuộc cùng user.
- Generation được phép cho model `Draft` và `Active` vì Phase 2/3 đã dùng `Active` như current selectable model state và output Phase 4 không mutate cấu trúc model.
- Model phải có ít nhất một observed mapping trước khi generate.
- Mỗi generated question phải trace về `ObservedQuestionMapping` và `ResearchFormQuestion` hiện có, trừ khi sau này approve template create-from-variable.
- Implementation không được submit response vào generated form.

## Freeze Decision: Create Behavior

Approval status: **Proposed for Phase 4 implementation approval**.

Rules:

- `create` tạo Google Form mới qua Google Forms API dưới Google account đã consent của current user.
- Title form generated nên lấy từ tên research model.
- Questions được generate từ observed mappings, order theo variable sort order, mapping sort order, rồi source question order.
- Sau Google create/write thành công, app re-import cấu trúc Google Form generated vào `ResearchForms` và `ResearchFormQuestions`.
- Form generated/imported vẫn thuộc user trong data model NCKH.

## Freeze Decision: Update Behavior

Approval status: **Constrained for Phase 4 implementation approval**.

Rules:

- `update` chỉ được update Google Form đã imported dưới current user và current user's Google write scope có quyền truy cập.
- App phải verify Google API authorization trước khi ghi.
- Implementation không được xóa Google Form.
- Việc xóa câu hỏi trong Google Form chưa được duyệt cho MVP Phase 4 trừ khi implementation chứng minh target question từng được app generate và không còn represented bởi mappings hiện tại.
- Default an toàn cho MVP: update/create mapped questions và giữ nguyên unmatched existing Google questions.

## Freeze Decision: Question Mapping

Approval status: **Proposed for Phase 4 implementation approval**.

Rules:

- Source order: variable `SortOrder`, mapping `SortOrder`, source question `OrderIndex`.
- Source question text là default generated question text.
- Variable code và observed code có thể dùng cho metadata mapping nội bộ nhưng không hiển thị cho survey respondents nếu chưa approve copy/UI requirement.
- Question type mapping phải bảo thủ:
  - Likert/Scale: dùng Google scale-style question chỉ khi metadata source question hỗ trợ; nếu không giữ mapping question type từ imported metadata.
  - Nominal/Ordinal: dùng choice-style question chỉ khi biết options từ imported metadata; nếu không thì stop với validation error.
  - Text-like unknowns: dùng short text chỉ khi current imported metadata cho phép.
- Không tự nghĩ survey answer choices nếu không có trong imported form metadata hoặc model data đã duyệt.

## Freeze Decision: Persistence

Approval status: **Proposed for Phase 4 implementation approval**.

Dùng `ResearchForms` và `ResearchFormQuestions` hiện có cho generated form import nếu có thể.

Minimal fields được duyệt nếu implementation xác nhận đang thiếu và thật sự cần:

- `ResearchForms.GeneratedFromModelId` nullable GUID FK đến `ResearchModels.Id`
- `ResearchForms.GenerationSource` string, allowed values: `Imported`, `Generated`
- `ResearchForms.LastGeneratedAt` nullable `DateTimeOffset`
- `ResearchForms.LastSyncedAt` nullable `DateTimeOffset`

Database rules:

- `GeneratedFromModelId -> ResearchModels`: restrict/no-action delete behavior để tránh xóa generated form history khi model bị xóa.
- `GenerationSource` default là `Imported` cho existing rows.
- Add index `(UserId, GeneratedFromModelId)` nếu thêm `GeneratedFromModelId`.
- Migration phải reversible và không đổi semantics Phase 1/2/3.

DB risk notes:

- Thêm generated-form tracking vào `ResearchForms` ít rủi ro hơn tạo bảng generated-form riêng cho MVP Phase 4.
- Delete behavior phải tránh cycle giữa `ResearchModels` và `ResearchForms`.
- Existing imported forms phải tiếp tục hoạt động sau khi apply default values.
- Google Forms API publish/default responder behavior có thể khác sau 2026-06-30 và phải được live validate khi implement Phase 4.

## Freeze Decision: Re-Import Behavior

Approval status: **Proposed for Phase 4 implementation approval**.

Rules:

- Sau Google write thành công, đọc lại cấu trúc Google Form qua import path hiện có hoặc shared import helper.
- Câu hỏi mới được insert.
- Câu hỏi hiện có với Google question ID trùng được update in place.
- Câu hỏi đang được existing mappings reference không được hard-delete trong re-import Phase 4.
- Nếu Google trả về cấu trúc không reconcile an toàn, trả conflict và giữ nguyên database state hiện tại.

## Required Implementation Safeguards

- Giữ Google Forms integration ngoài model/variable services.
- Controllers chỉ sở hữu HTTP; services sở hữu workflow và validation orchestration.
- Không trả Google tokens hoặc secrets trong DTO responses.
- Không thêm lifecycle statuses mới.
- Không thêm Google Sheets scope.
- Không response submit hoặc response collection.
- Không mở rộng frontend nếu chưa approve riêng.

## Deferred

- Google Sheets API response pull
- response collection
- normalization/export
- statistical analysis
- credit/pricing
- admin UI NCKH
- React Flow/frontend expansion
- scheduled jobs
- Google Forms watches / Cloud Pub/Sub
- AI-generated questionnaire text
- automatic response submission

## Approval Needed Before Implementation

Approve hoặc revise các freeze decisions này trước khi giao implementation worker:

- Google Forms write scope candidate: `https://www.googleapis.com/auth/forms.body`
- route: `POST /api/v1/nckh/models/{modelId}/generate-form`
- allowed `action` values: `create`, `update`
- generation allowed cho `Draft` và `Active` models
- update giới hạn cho current-user authorized imported forms
- safe MVP update rule: không xóa unmatched Google questions
- minimal `ResearchForms` generated-form tracking fields
- re-import reconciliation behavior

## Next Pass If Approved

Chỉ chuyển sang **Phase 4 Pass 1 - Google Forms Generation Service** sau khi freeze này được chấp nhận rõ.
