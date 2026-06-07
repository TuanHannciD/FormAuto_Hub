# NCKH_PHASE_TRANSITION_GUIDE

## Mục đích

Định nghĩa cách chuyển từ trạng thái global phase FormAuto Hub đã đóng sang một phase NCKH cụ thể mà không nhầm NCKH work với global phase mới của FormAuto Hub.

## Baseline hiện tại

- Global phase FormAuto Hub: Phase 9 closeout đã hoàn tất; chưa chọn global phase tiếp theo.
- NCKH là track module riêng trong cùng repository.
- NCKH Phase 1 đã completed cho đúng phạm vi được duyệt.
- NCKH Phase 2 đã completed cho đúng scope backend-only được duyệt.
- NCKH Phase 3 đã completed cho đúng scope backend-only được duyệt.
- NCKH Phase 4 đã completed cho đúng scope backend-only được duyệt; live Google Forms write smoke vẫn blocked cho đến khi có credentials/write consent.
- NCKH Phase 5 đã completed cho đúng scope backend-only được duyệt; live Google Forms response-read smoke vẫn blocked cho đến khi có credentials/response-read consent/submitted responses.
- NCKH Phase 6 đã completed cho đúng scope export backend-only được duyệt; không thêm database migration.
- NCKH Phase 7 đã completed cho đúng scope frontend-only được duyệt.
- NCKH Phase 7.5 đã completed cho follow-up fix/live-validation được duyệt; live Google validation đã được user xác nhận ngày 2026-06-05.
- NCKH Phase 8 đã completed cho scope full-stack smoke validation-only được duyệt; phase này không thêm behavior sản phẩm mới.
- NCKH Phase 9 đã completed cho scope canvas UX frontend-only Option A đã duyệt.

## Thứ tự đọc bắt buộc cho việc NCKH

1. Đọc `README.md`.
2. Đọc `AGENTS.md`.
3. Đọc `docs/ai/AI_DOC_ROUTING_MATRIX.md`.
4. Đọc `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`.
5. Đọc file này.
6. Đọc `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`.
7. Đọc các docs NCKH theo phase:
   - closeout evidence: `NCKH_PHASE_1_CLOSEOUT.md`
   - closeout evidence Phase 2: `NCKH_PHASE_2_CLOSEOUT.md`
   - kickoff plan cho Phase 2: `NCKH_PHASE_2_KICKOFF_PLAN.md`
   - kickoff plan cho Phase 3: `NCKH_PHASE_3_KICKOFF_PLAN.md`
   - contract/DB freeze Phase 3: `NCKH_PHASE_3_CONTRACT_DB_FREEZE.md`
   - single approval packet Phase 3: `NCKH_PHASE_3_SINGLE_APPROVAL_PACKET.md`
   - kickoff plan cho Phase 4: `NCKH_PHASE_4_KICKOFF_PLAN.md`
   - contract/DB freeze Phase 4: `NCKH_PHASE_4_CONTRACT_DB_FREEZE.md`
   - approval packet Phase 4: `NCKH_PHASE_4_SINGLE_APPROVAL_PACKET.md`
   - closeout evidence Phase 4: `NCKH_PHASE_4_CLOSEOUT.md`
   - kickoff plan Phase 5: `NCKH_PHASE_5_KICKOFF_PLAN.md`
   - contract/DB freeze Phase 5: `NCKH_PHASE_5_CONTRACT_DB_FREEZE.md`
   - approval packet Phase 5: `NCKH_PHASE_5_SINGLE_APPROVAL_PACKET.md`
   - closeout evidence Phase 5: `NCKH_PHASE_5_CLOSEOUT.md`
   - kickoff plan Phase 6: `NCKH_PHASE_6_KICKOFF_PLAN.md`
   - contract/DB freeze Phase 6: `NCKH_PHASE_6_CONTRACT_DB_FREEZE.md`
   - approval packet Phase 6: `NCKH_PHASE_6_SINGLE_APPROVAL_PACKET.md`
   - closeout evidence Phase 6: `NCKH_PHASE_6_CLOSEOUT.md`
   - kickoff plan Phase 7: `NCKH_PHASE_7_KICKOFF_PLAN.md`
   - contract/UI freeze Phase 7: `NCKH_PHASE_7_CONTRACT_UI_FREEZE.md`
   - approval packet Phase 7: `NCKH_PHASE_7_SINGLE_APPROVAL_PACKET.md`
   - closeout evidence Phase 7: `NCKH_PHASE_7_CLOSEOUT.md`
   - kickoff/fix plan Phase 7.5: `NCKH_PHASE_7_5_KICKOFF_PLAN.md`
   - closeout evidence Phase 7.5: `NCKH_PHASE_7_5_CLOSEOUT.md`
   - closeout evidence Phase 8: `NCKH_PHASE_8_CLOSEOUT.md`
   - kickoff baseline Phase 9: `NCKH_PHASE_9_KICKOFF_PLAN.md`
   - closeout evidence Phase 9: `NCKH_PHASE_9_CLOSEOUT.md`
   - requirements: `NCKH_REQUIREMENT_PACKAGE.md`
   - module ownership: `NCKH_MODULE_MAP.md`
   - architecture boundaries: `NCKH_ARCHITECTURE_BOUNDARIES.md`
   - domain model: `NCKH_DOMAIN_ENTITIES_OVERVIEW.md`
   - proposed APIs: `NCKH_API_CONTRACT_GUIDE.md`

## Quy tắc chuyển phase

Không gọi việc NCKH là "FormAuto Hub Phase 10" trừ khi user chọn rõ global Phase 10 cho FormAuto Hub.

Dùng wording này:

- "Mở NCKH Phase 5"
- "Mở NCKH Phase 7.5"
- "Mở NCKH Phase 9"
- "NCKH Phase 2 closeout/fix follow-up"
- "NCKH Phase 1 validation/fix follow-up"

Không gọi canvas work của NCKH là "FormAuto Hub Phase 9". FormAuto Hub global Phase 9 đã closeout. Khi nói đến phần canvas NCKH đã completed, dùng "NCKH Phase 9 - Hoàn thiện UX Canvas Và Workflow Polish".

## Checklist Go/No-Go

Trước khi implement phase NCKH mới, xác nhận:

- User approve rõ target phase hoặc fix follow-up.
- Target phase đang là current candidate hoặc proposed trong `NCKH_PHASE_ROADMAP.md`.
- Implementation evidence hiện tại trong `NCKH_PROGRESS_LEDGER.md` không xung đột với scope được yêu cầu.
- API routes, DTOs, statuses, lifecycle states đã được contract review nếu bị chạm.
- Entity fields, relationships, delete behavior, indexes, migrations đã được DB risk review nếu bị chạm.
- Google OAuth/Forms/Sheets scopes được approve rõ cho phase.
- Frontend work có backend contract đã duyệt hoặc chỉ giới hạn ở shell/UI state đã được document.
- `docs/ai/nckh` và `docs/vi/nckh` sẽ được cập nhật cùng nhau nếu docs thay đổi.

## Việc an toàn khi chưa mở phase

Được phép khi chưa mở implementation phase mới:

- đọc docs và source evidence
- trả lời câu hỏi phase/status
- đề xuất scope NCKH
- doc-only sync đã được user approve
- validation-only checks đã được user approve

Không được phép nếu chưa có approval rõ:

- thêm NCKH entities hoặc migrations
- thêm NCKH API contracts
- implement service/controller/frontend flow Phase 8+
- bật Google scopes mới ngoài path sửa Google consent đã approve trong Phase 7.5
- xem behavior Phase 8+ đang đề xuất là đã completed

## Candidate tiếp theo được khuyến nghị

Không còn follow-up NCKH active sau closeout Phase 9.

Closeout evidence Phase 7 nằm tại `NCKH_PHASE_7_CLOSEOUT.md`. Scope kickoff và closeout evidence Phase 7.5 nằm tại `NCKH_PHASE_7_5_KICKOFF_PLAN.md` và `NCKH_PHASE_7_5_CLOSEOUT.md`. Evidence full-stack smoke Phase 8 nằm tại `NCKH_PHASE_8_CLOSEOUT.md`. Evidence canvas UX Phase 9 nằm tại `NCKH_PHASE_9_CLOSEOUT.md`.

Trước mọi follow-up phụ thuộc vào Phase 7.5 đã completed, cần review baseline implementation đã completed gồm:

- API model, variable, và mapping của Phase 2
- API canvas relation của Phase 3
- API form generation của Phase 4
- API collection và normalization của Phase 5
- API export và file contracts của Phase 6
- frontend workspace behavior của Phase 7
- khả dụng Google credential/consent thật
- kết quả full-stack smoke Phase 8 và các giới hạn validation còn lại
- behavior canvas UX frontend-only Option A của Phase 9 và các giới hạn còn lại

Phase 5 đã implement guard cho `https://www.googleapis.com/auth/forms.responses.readonly`. Google Sheets collection vẫn là path thay thế chỉ khi được approve rõ sau này.

Dùng `NCKH_PHASE_7_CLOSEOUT.md`, `NCKH_PHASE_7_5_KICKOFF_PLAN.md`, `NCKH_PHASE_7_5_CLOSEOUT.md`, `NCKH_PHASE_8_CLOSEOUT.md`, và `NCKH_PHASE_9_CLOSEOUT.md` làm baseline dependency trước mọi follow-up phụ thuộc vào Phase 7.5/Phase 8/Phase 9 đã completed.

Không có candidate NCKH tiếp theo được chọn sau closeout Phase 9.

## Quy tắc closeout

Khi hoàn thành một phase NCKH, tạo hoặc cập nhật closeout evidence trước khi chuyển roadmap:

- implementation summary
- files changed
- API/database contracts đã finalize
- validation đã chạy và kết quả
- validation chưa chạy
- residual risks
- Deferred items được giữ nguyên
- candidate phase tiếp theo

Nếu thiếu closeout evidence, ghi phase là `Implemented with repo evidence` hoặc `Partially implemented`, không ghi `Completed`.

## Deferred

- React Flow hoặc canvas editing dependency khác trừ khi được approve rõ sau này.
- Bất kỳ quyết định global FormAuto Hub Phase 10 nào do suy diễn.
- Bất kỳ claim production readiness nào chưa có runtime validation hiện tại.
