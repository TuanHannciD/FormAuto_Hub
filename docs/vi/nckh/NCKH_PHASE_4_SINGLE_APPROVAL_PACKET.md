# NCKH_PHASE_4_SINGLE_APPROVAL_PACKET

## Mục đích

Gom các approval còn lại của NCKH Phase 4 vào một quyết định để implementation sub-agents có thể làm mà không dừng lại hỏi lại các lựa chọn contract, Google scope, hoặc database đã review.

File này là approval packet. Nó không đánh dấu Phase 4 đã implement hoặc completed.

## One-Time Approval Statement

Nếu user approve packet này, các điểm sau được duyệt làm baseline implementation Phase 4:

- Mở implementation NCKH Phase 4 cho backend-only Google Form Generation & Update.
- Dùng `NCKH_PHASE_4_CONTRACT_DB_FREEZE.md` làm baseline authoritative cho contract, Google scope, và DB freeze Phase 4.
- Chỉ implement `POST /api/v1/nckh/models/{modelId}/generate-form` với `action` values `create` và `update`.
- Chỉ cho phép Google Forms write scope qua explicit user consent và runtime configuration.
- Giữ implementation backend-only trừ khi có approval rõ sau này mở frontend work.

## Decisions Approved By This Packet

### Google Scope Contract

- Candidate write scope: `https://www.googleapis.com/auth/forms.body`.
- Không được coi consent đọc Phase 1 là consent ghi.
- Nếu stored Google token thiếu write scope, trả lỗi cần re-consent.
- Google Sheets scope vẫn Deferred đến Phase 5.

### API Contract

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

Response gồm:

- `formId`
- `googleFormId`
- `formUrl`
- `questionsCreated`
- `questionsUpdated`
- `questionsDeleted`
- `reimported`

### Ownership And Readiness Contract

- Model phải thuộc current authenticated user.
- Imported/generated form phải thuộc cùng user.
- Generation được phép cho `Draft` và `Active` models.
- Model phải có ít nhất một observed mapping trước khi generation.
- Mỗi generated question phải trace về mapping/question data hiện có trừ khi sau này approve khác.
- Không automatic response submission.

### Create Contract

- `create` tạo Google Form mới dưới Google account đã consent của current user.
- Generated form title lấy từ tên research model.
- Question order theo variable `SortOrder`, mapping `SortOrder`, rồi source question `OrderIndex`.
- Sau Google write thành công, re-import cấu trúc generated form vào NCKH persistence.
- Form tạo bằng Google Forms API sau 2026-06-30 có thể mặc định unpublished; implementation phải live validate hành vi publish/response availability trước mọi closeout claim.

### Update Contract

- `update` chỉ được update Google Form đã imported dưới current user và được current user's Google write scope authorize.
- App phải verify Google API authorization trước khi ghi.
- Không xóa Google Form.
- MVP update không được xóa unmatched existing Google questions.
- Nếu reconciliation không an toàn, trả conflict và giữ nguyên database state hiện tại.

### Persistence Contract

Minimal fields được duyệt nếu implementation xác nhận đang thiếu và thật sự cần:

- `ResearchForms.GeneratedFromModelId` nullable GUID FK đến `ResearchModels.Id`
- `ResearchForms.GenerationSource` string, allowed values: `Imported`, `Generated`
- `ResearchForms.LastGeneratedAt` nullable `DateTimeOffset`
- `ResearchForms.LastSyncedAt` nullable `DateTimeOffset`

Database behavior:

- `GeneratedFromModelId -> ResearchModels`: restrict/no-action.
- `GenerationSource` default là `Imported` cho existing rows.
- Add index `(UserId, GeneratedFromModelId)` nếu thêm `GeneratedFromModelId`.
- Migration phải reversible.

## Approved Sub-Agent Flow

Dùng thứ tự này:

1. Google Forms generation service và integration workflow
2. API route và DTO implementation
3. Approved persistence changes và re-import behavior
4. Validation và closeout docs
5. Final review

Implementation workers chỉ dừng nếu có conflict thật với current source, Google scope/runtime configuration không thể theo packet này, migration design không thể theo packet này, hoặc validation blocker. Không dừng để hỏi lại các quyết định đã approve ở trên.

## Still Deferred

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
- production-readiness claims nếu chưa có runtime validation hiện tại

## Validation Required Before Closeout

Validation tối thiểu trước khi đánh dấu Phase 4 completed:

- `dotnet build FormAutoHub.sln -c Release`
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release`
- `dotnet ef database update` nếu có migration
- authenticated HTTP smoke cho `POST /api/v1/nckh/models/{modelId}/generate-form`
- live Google Forms create/update smoke khi có credentials và scopes đã duyệt
- gắn nhãn `Blocked` rõ nếu không chạy được live Google validation vì thiếu credentials/scopes
- inspect logs sau smoke checks
- cleanup smoke data

Không bắt buộc nếu frontend files không đổi:

- `npm run build`
- Playwright/browser smoke
