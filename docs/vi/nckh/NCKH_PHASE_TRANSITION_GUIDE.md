# NCKH_PHASE_TRANSITION_GUIDE

## Mục đích

Định nghĩa cách chuyển từ trạng thái global phase FormAuto Hub đã đóng sang một phase NCKH cụ thể mà không nhầm NCKH work với global phase mới của FormAuto Hub.

## Baseline hiện tại

- Global phase FormAuto Hub: Phase 9 closeout đã hoàn tất; chưa chọn global phase tiếp theo.
- NCKH là track module riêng trong cùng repository.
- NCKH Phase 1 đã completed cho đúng phạm vi được duyệt.
- NCKH Phase 2 đã completed cho đúng scope backend-only được duyệt.
- NCKH Phase 3 là phase đề xuất tiếp theo và chưa active cho đến khi được approve rõ.

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
   - requirements: `NCKH_REQUIREMENT_PACKAGE.md`
   - module ownership: `NCKH_MODULE_MAP.md`
   - architecture boundaries: `NCKH_ARCHITECTURE_BOUNDARIES.md`
   - domain model: `NCKH_DOMAIN_ENTITIES_OVERVIEW.md`
   - proposed APIs: `NCKH_API_CONTRACT_GUIDE.md`

## Quy tắc chuyển phase

Không gọi việc NCKH là "FormAuto Hub Phase 10" trừ khi user chọn rõ global Phase 10 cho FormAuto Hub.

Dùng wording này:

- "Mở NCKH Phase 3"
- "NCKH Phase 2 closeout/fix follow-up"
- "NCKH Phase 1 validation/fix follow-up"

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
- implement service/controller/frontend flow Phase 3+
- bật Google scopes mới
- xem behavior Phase 3+ đang đề xuất là đã completed

## Candidate tiếp theo được khuyến nghị

Candidate implementation tiếp theo là **NCKH Phase 3 - Canvas Relations & Hypothesis**.

Trước khi implement Phase 3, cần chuẩn bị kickoff plan hẹp gồm:

- entity và field chính xác cho relation và node position cần thêm
- constraint ownership và trạng thái model
- validation quan hệ, duplicate relation, và self-relation behavior
- việc sinh hypothesis text/code là deterministic hay cần approval riêng
- delete behavior khi variable hoặc mapping bị xóa
- migration và rollback risk
- API contract surface
- dependency frontend nếu có, bao gồm React Flow chỉ sau khi backend contract được duyệt
- validation plan

Dùng `NCKH_PHASE_2_CLOSEOUT.md` làm baseline dependency trước mọi planning Phase 3.

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

- Bất kỳ implementation NCKH Phase 3+ nào chưa được approve rõ.
- Bất kỳ quyết định global FormAuto Hub Phase 10 nào do suy diễn.
- Bất kỳ claim production readiness nào chưa có runtime validation hiện tại.
