# NCKH_PHASE_4_KICKOFF_PLAN

## Mục đích

Định nghĩa kickoff plan có approval-gate cho NCKH Phase 4 để phần Tạo & Cập nhật Google Form có thể triển khai mà không kéo lẫn sang thu thập dữ liệu, chuẩn hóa, export, mở rộng frontend, hoặc credit/pricing cho NCKH.

Tài liệu này là artifact planning và handoff. Nó không đánh dấu Phase 4 đã implement hoặc completed.

## Mục tiêu Phase

Mở slice implementation sau Phase 3 cho module NCKH:

- tạo Google Form từ research model thuộc sở hữu user và các biến/câu hỏi đã mapping
- cập nhật Google Form chỉ qua flow an toàn về ownership đã được duyệt
- import lại cấu trúc Google Form vào `ResearchForm` / `ResearchFormQuestion` sau khi create/update thành công

Phase 4 là phase ghi Google Forms. Phase này không duyệt Google Sheets response collection, normalization, export, credit, pricing, admin UI NCKH, statistical analysis, scheduled jobs, watches, Pub/Sub, hoặc auto-submit behavior.

## Repo Truth Hiện Tại

- NCKH Phase 1 đã completed cho OAuth link và Google Forms read/import.
- NCKH Phase 2 đã completed cho model, variables, và observed question mappings.
- NCKH Phase 3 đã completed cho backend-only relations, node positions, và deterministic hypothesis output.
- Phase 4 là phase NCKH proposed tiếp theo.
- Phase 4 vẫn cần approval-gate cho đến khi contract review, DB review, và Google Forms write-scope review được chấp nhận.
- Phase 3 closeout evidence là baseline dependency cho planning Phase 4.

## Scope Phase 4 Đề Xuất

Trong scope kickoff plan này:

- orchestration Google Forms API create/update sau auth boundary NCKH hiện có
- request/response DTO cho model-driven form generation
- service workflow cho ownership check, model readiness check, và Google authorization check
- persistence changes chỉ khi được duyệt trong `NCKH_PHASE_4_CONTRACT_DB_FREEZE.md`
- re-import/update metadata Google Form và question metadata sau khi Google API write thành công
- backend tests và authenticated HTTP smoke cho route surface đã duyệt

## Out Of Scope

Không được làm trong Phase 4:

- Google Sheets API response pull
- response collection
- normalization hoặc dataset generation
- CSV/Excel/SPSS export
- React Flow hoặc mở rộng frontend NCKH rộng hơn
- credit deduction hoặc pricing
- admin UI NCKH
- background jobs, watches, Pub/Sub, hoặc scheduled sync
- tự động submit response
- xóa Google Forms không được tạo hoặc sở hữu qua flow đã duyệt
- AI-generated questionnaire text nếu chưa có approval riêng

## Entry Gates

Trước khi implementation worker bắt đầu, cần xác nhận:

1. User approve rõ việc mở implementation NCKH Phase 4.
2. Contract review đã hoàn tất cho routes, DTOs, action values, response shape, và error behavior.
3. DB review đã hoàn tất cho field mới, relationship, index, migration, và rollback behavior nếu có.
4. Google Forms write scope được approve rõ cho runtime configuration Phase 4.
5. Flow không âm thầm kéo Phase 5-8 vào Phase 4.
6. `docs/ai/nckh` và `docs/vi/nckh` được sync nếu contract hoặc phase-state thay đổi.

## Quyết Định Cần Freeze Trước Code

1. Google write authorization
   - Candidate scope: `https://www.googleapis.com/auth/forms.body` cho tạo và cập nhật nội dung Google Form.
   - Cần quyết định: mở rộng flow Google-link hiện có để xin write scope hay cần bước re-consent riêng.
   - Deferred: Google Sheets scope đến Phase 5.

2. Create vs update behavior
   - Đề xuất: support `create` trước.
   - Đề xuất: support `update` chỉ cho form imported/linked với current user và được Google authorization cho phép.
   - Cần quyết định: update chỉ giới hạn form do app tạo hay có thể update form đã import và thuộc sở hữu researcher.

3. Model readiness
   - Đề xuất: model phải thuộc current user.
   - Đề xuất: model phải có ít nhất một variable có observed mapping trước khi generate.
   - Cần quyết định: generation chỉ cho model `Active`, chỉ `Draft`, hay cả hai.

4. Question generation mapping
   - Đề xuất: câu hỏi generated lấy từ `ObservedQuestionMapping`, order theo variable sort order và mapping sort order.
   - Cần quyết định: mapping Google question type chính xác cho Likert, Nominal, Ordinal, Scale, và text-like fields.
   - Assumption: Phase 4 không tự nghĩ wording thống kê; mặc định dùng question text đã import từ form gốc nếu chưa duyệt template tạo từ variable.

5. Persistence
   - Cần quyết định: field `ResearchForm` hiện có đã đủ hay cần field mới để theo dõi generated form.
   - Candidate fields nếu được duyệt: generated source marker, last generated timestamp, last synced timestamp.
   - Không thêm DB fields cho đến khi DB review approve tên và semantics chính xác.

6. Re-import behavior
   - Đề xuất: sau khi create/update thành công, gọi lại path import cấu trúc form để persist metadata/questions hiện tại.
   - Cần quyết định: stale questions được update in place, đánh dấu inactive, hay reject nếu mappings vẫn reference chúng.

## Contract Guardrails

- Không coi endpoint Phase 4 proposed trong `NCKH_API_CONTRACT_GUIDE.md` là final cho đến khi freeze được chấp nhận.
- Không bật Google Forms write scope nếu thiếu approval rõ và runtime configuration.
- Không thêm Google Sheets scope trong Phase 4.
- Không thêm data collection, normalization, export, credit, pricing, admin, hoặc frontend behavior trong Phase 4.
- Không xóa Google Forms của bên thứ ba.

## Suggested Delivery Passes

### Pass 0 - Contract And DB Freeze

Goal:

- khóa route surface, request/response shape, action values, Google scope, persistence changes, ownership rules, và re-import behavior

Expected outputs:

- `NCKH_PHASE_4_CONTRACT_DB_FREEZE.md` đã được chấp nhận
- `NCKH_PHASE_4_SINGLE_APPROVAL_PACKET.md` đã được chấp nhận

### Pass 1 - Google Forms Generation Service

Goal:

- chỉ thêm service/integration behavior cần cho workflow create/update đã duyệt

Stop conditions:

- Google scope hoặc ownership rules chưa rõ
- implementation cần Google Sheets, response collection, hoặc frontend behavior

### Pass 2 - API Surface

Goal:

- implement route surface `/api/v1/nckh` đã duyệt cho form generation/update

Stop conditions:

- route shape lệch khỏi freeze đã chấp nhận
- action semantics chưa rõ

### Pass 3 - Persistence And Re-Import

Goal:

- chỉ apply database changes và re-import behavior đã duyệt sau khi Google Forms write thành công

Stop conditions:

- re-import có thể phá existing mappings nếu chưa có stale-question policy đã duyệt

### Pass 4 - Validation And Closeout Prep

Validation tối thiểu:

- `dotnet build FormAutoHub.sln -c Release`
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release`
- `dotnet ef database update` nếu có migration
- authenticated HTTP smoke cho route surface đã duyệt
- live Google Forms smoke chỉ khi có credentials/scopes hợp lệ
- inspect logs sau smoke checks

## Worker-Ready Handoff Prompts

### Worker A - Contract/DB Freeze

"Review NCKH Phase 4 only. Do not write production code. Confirm Google Forms write scope, create/update action semantics, ownership rules, route surface, DTOs, persistence needs, re-import behavior, validation plan, and remaining approval gaps. Separate Confirmed, Proposed, Assumption, Deferred, and Approval Needed."

### Worker B - Implementation

"Implement only the approved NCKH Phase 4 Google Form generation/update slice from `NCKH_PHASE_4_SINGLE_APPROVAL_PACKET.md`. Do not add Google Sheets, response collection, normalization, export, credit, pricing, admin UI, scheduled jobs, Pub/Sub, or frontend expansion. Add focused tests and runtime smoke coverage."

### Worker C - Review

"Review the NCKH Phase 4 slice for scope discipline, Google scope safety, ownership enforcement, contract safety, migration risk, re-import correctness, validation honesty, and docs sync. Lead with findings."

## Documentation Sync Khi Mở Phase 4

Nếu implementation được approve, giữ sync các file:

- `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/vi/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/vi/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/ai/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/vi/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- docs contract/entity/API Phase 4 nếu surface đã duyệt thay đổi

Không đánh dấu Phase 4 completed chỉ từ wording kickoff.

## Deferred

- Google Sheets API response pull
- response collection
- normalization/export
- statistical analysis
- credit/pricing
- admin UI NCKH
- React Flow/frontend expansion
- Google Forms watches / Cloud Pub/Sub
- scheduled data collection
- production-readiness claims nếu chưa có runtime validation hiện tại
