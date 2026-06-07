# NCKH_PHASE_7_CONTRACT_UI_FREEZE

## Mục đích

Freeze ranh giới frontend/API contract được phép cho NCKH Phase 7 trước khi implementation.

## Kết quả freeze

Phase 7 được phép implement frontend screens dựa trên các API NCKH Phase 1-6 hiện có.

Freeze này không approve backend contract, DTO field, database field, entity, status, lifecycle state, Google scope, hoặc migration mới.

## Backend contract surfaces đã xác nhận

Phase 7 được consume các endpoint NCKH đã document và implement cho:

- Google OAuth link và form import/list/detail
- CRUD và activation research model
- CRUD research variable
- CRUD observed question mapping
- canvas relations và node positions
- tạo/cập nhật Google Form qua backend endpoint hiện có
- thu thập response, list raw response, normalize, và list dataset
- export theo format `csv`, `codebook`, và `spss`

Nếu một action UI mong muốn chưa được API guide hoặc implementation hiện tại hỗ trợ, UI phải bỏ action đó hoặc hiển thị disabled/unavailable state thay vì phát minh contract.

## Vùng file frontend

Vùng được phép implement sau khi có approval implementation riêng:

- `apps/web/app/dashboard/nckh/**`
- `apps/web/lib/api.ts` cho typed wrappers trên NCKH endpoints hiện có
- `apps/web/tests/**` cho NCKH browser smoke/tests
- `apps/web/components/**` chỉ khi thật sự cần reusable shared primitive

Vùng tài liệu được phép:

- `docs/ai/nckh/**`
- `docs/vi/nckh/**`
- `docs/ai/AI_DOC_ROUTING_MATRIX.md`
- `docs/vi/AI_DOC_ROUTING_MATRIX.md`

Vùng cấm trừ khi được approve riêng:

- `src/FormAutoHub.Api/Entities/**`
- `src/FormAutoHub.Api/Data/Migrations/**`
- backend controllers/services/contracts trừ khi có task contract riêng được approve
- payment, credit, admin, và module dashboard không thuộc NCKH

## Quy tắc UI

- Dùng dashboard shell và shared component inventory hiện có.
- Ưu tiên `BaseTable`, `PaginationControls`, `StatusBadge`, shared `Button/Input/Card/Dialog/Alert/EmptyState`, và toast helpers hiện có khi phù hợp.
- Copy tiếng Việt trước.
- Dùng layout dashboard gọn, table cho data dạng list, tabs/sections cho model workspace, dialogs/sheets cho mutation tập trung, và badges cho status.
- Định nghĩa loading, empty, error, permission, blocked, và saved states.
- Không đặt card trong card.
- Không thêm hero content kiểu marketing.

## Quy tắc data-state

- Trạng thái thiếu Google scope phải hiển thị là blocked/unavailable, không coi như lỗi chung chung.
- Conflict export do normalized dataset stale phải hướng user re-normalize trước khi export.
- Action destructive phải có confirmation rõ khi backend hiện có cho phép delete.
- Frontend không được expose raw response JSON trừ khi endpoint backend hiện có trả dữ liệu đó rõ ràng.

## Assumptions

Assumption: Phase 7 có thể dùng route params dưới `/dashboard/nckh` cho form và model workspace pages nếu implementation giữ nguyên backend API contracts.

Assumption: Có thể dùng React Flow cho canvas chỉ khi package đã có sẵn hoặc việc thêm dependency frontend được chấp nhận trong task implementation mà không đổi backend contract. Nếu không phù hợp, dùng UI table/list để quản lý canvas trước.

## Deferred

- backend API additions
- database migrations
- Google scopes mới
- Google Sheets collection
- scheduled sync hoặc background workers
- chart, phân tích thống kê, generated analysis reports, SPSS execution
- admin UI riêng cho NCKH
- credit/pricing cho NCKH
- multi-researcher collaboration

## Review gate

Trước khi close implementation Phase 7, xác nhận:

- không phát minh backend contract
- không thêm DB migration
- UI hoàn thành main workflow bằng APIs hiện có
- browser smoke cover primary NCKH workspace path
- live Google checks bị blocked được gắn nhãn trung thực

