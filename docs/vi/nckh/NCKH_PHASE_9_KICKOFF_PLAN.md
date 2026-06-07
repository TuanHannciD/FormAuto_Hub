# NCKH_PHASE_9_KICKOFF_PLAN

## Mục đích

Định nghĩa baseline scope lịch sử cho NCKH Phase 9 nhằm hoàn thiện UX canvas và polish workflow sau baseline canvas dạng bảng/danh sách của Phase 7.

## Trạng thái duyệt

Trạng thái: **Sau đó đã completed cho frontend-only Option A**. Xem `NCKH_PHASE_9_CLOSEOUT.md`.

Tài liệu này ghi lại kickoff baseline. Completion evidence hiện tại được theo dõi trong `NCKH_PHASE_9_CLOSEOUT.md`.

Phase này thuộc track module NCKH độc lập. Nó không mở lại FormAuto Hub global Phase 9, vì global Phase 9 đã closeout.

## Mục tiêu phase

Hoàn thiện trải nghiệm canvas model NCKH để researcher có thể xem trực quan biến, quan hệ, vị trí node đã lưu, và luồng giả thuyết được sinh trong UI dashboard đồng bộ với hệ thống.

Phase 7 cố ý dùng UI canvas dạng bảng/danh sách gọn và không thêm React Flow hoặc dependency canvas khác. Phase 9 sau đó dùng Option A để hoàn thiện trải nghiệm canvas mà không thêm canvas dependency.

## Quyết định dependency

Phase 9 phải chọn một hướng implementation trước khi sửa code:

- Option A: giữ UI canvas dạng bảng/danh sách và chỉ polish bằng shared components.
- Option B: approve một frontend-only canvas dependency, ví dụ React Flow, để chỉnh sửa node/edge trực quan.

Assumption: thêm frontend canvas dependency cần approval implementation rõ cho Phase 9. Approval tài liệu planning này chưa thêm hoặc approve thay đổi package.

## Scope đề xuất

Phase 9 có thể bao gồm, sau khi có approval implementation riêng:

- canvas trực quan cho research variables và model relations
- hiển thị và lưu/tải vị trí node qua API Phase 3 hiện có
- tạo/xóa/list relation qua API Phase 3 hiện có
- hiển thị hypothesis dựa trên behavior backend hiện có
- ba vùng đặt nút action đã lưu từ note UI Phase 7:
  - action toolbar chính của canvas
  - action theo node/relation đang chọn
  - action lưu/trạng thái cho vị trí đã persist
- copy tiếng Việt trước cho UI hiển thị, validation, blocked state, success state, và lỗi
- dùng shared/base components cho alert, button, dropdown, badge, table, empty state, và page header
- responsive desktop/mobile
- fallback dạng bảng/danh sách khi canvas trực quan chưa khả dụng, rỗng, hoặc bị blocked

## Ranh giới scope

Không thêm trong Phase 9 trừ khi có contract task riêng được approve:

- backend endpoints
- DTO fields
- database fields
- entities hoặc EF Core migrations
- statuses hoặc lifecycle states
- Google OAuth scopes
- Google Sheets collection
- Google Forms watches, Pub/Sub, scheduled jobs, hoặc background workers
- statistical analysis, charting, generated research reports, hoặc SPSS execution
- NCKH admin UI
- NCKH credit/pricing
- multi-researcher collaboration

Phase 9 không được thay đổi path Google consent của Phase 7.5. Thiếu Google consent vẫn là blocked state của external/integration, không phải vấn đề UX canvas.

## Các pass bắt buộc

### Pass 0 - Inventory contract và UI

Kiểm tra API canvas và frontend workspace hiện có trước khi implementation.

Các file có khả năng liên quan:

- `src/FormAutoHub.Api/Controllers/Nckh/ResearchCanvasController.cs`
- `src/FormAutoHub.Api/Services/Nckh/ResearchCanvasService.cs`
- `apps/web/lib/api.ts`
- `apps/web/app/dashboard/nckh/forms/[formId]/page.tsx`
- `apps/web/components/**`

Acceptance:

- liệt kê endpoints canvas và frontend wrappers hiện tại
- xác nhận contracts hiện có có đủ cho canvas trực quan không
- chốt dependency option trước khi sửa code
- báo cáo contract gap thay vì tự tạo backend contract mới

### Pass 1 - Thiết kế canvas và quyết định dependency

Định nghĩa behavior UI chính xác cho hướng đã chọn.

Acceptance:

- chọn rõ Option A hoặc Option B
- định nghĩa ba vùng đặt action button trong workspace
- định nghĩa empty/loading/error/blocked/saved states bằng tiếng Việt
- xác nhận shared components sẽ reuse

### Pass 2 - Implement canvas

Implement UI canvas frontend-only đã được approve.

Acceptance:

- biến hiển thị thành nodes hoặc list items tùy option đã approve
- quan hệ hiển thị thành edges hoặc relation rows tùy option đã approve
- vị trí node có thể lưu và tải lại qua API hiện có
- action relation tiếp tục dùng backend contracts hiện có
- fallback bảng/danh sách vẫn dùng được

### Pass 3 - Dọn state, copy, và shared component

Harden UX và loại bỏ pattern page-local trùng shared components.

Acceptance:

- copy UI hiển thị là tiếng Việt, trừ thuật ngữ kỹ thuật
- alert, dropdown, button, badge, table, và empty state dùng shared/base components khi có
- không tạo primitive table/dropdown/status custom nếu shared component đã tồn tại
- mobile layout vẫn coherent

### Pass 4 - Validation

Chạy validation frontend phù hợp với implementation.

Validation tối thiểu nếu sửa frontend code:

- `npm run build` trong `apps/web`
- targeted Playwright smoke cho path canvas workspace NCKH
- browser hoặc screenshot verification rằng canvas không blank trên desktop và mobile
- kiểm tra console/network để phát hiện fatal frontend errors

Validation bổ sung nếu thêm canvas dependency:

- xác minh package install/build state
- xác minh canvas container sizing và hydration
- xác minh drag/save/reload không làm layout shift bất thường

### Pass 5 - Closeout

Chuẩn bị closeout docs chỉ sau implementation và validation.

Acceptance:

- cập nhật cả `docs/ai/nckh` và `docs/vi/nckh`
- report `Verified`, `Not run`, và `Blocked`
- giữ nguyên mọi Deferred items
- không claim backend, database, Google, statistics, admin, hoặc credit readiness từ canvas UX work

## Acceptance Criteria

- Vùng canvas thể hiện rõ biến và quan hệ theo UI path đã approve.
- Vị trí node có thể lưu và tải lại qua API Phase 3 hiện có.
- Action relation dùng API Phase 3 hiện có.
- Ba vùng đặt action button đã lưu được phản ánh trong thiết kế UI.
- Fallback bảng/danh sách vẫn tồn tại và dễ hiểu.
- Toàn bộ UI copy hiển thị trong NCKH Phase 9 là tiếng Việt, trừ thuật ngữ kỹ thuật được chấp nhận.
- Shared/base components được reuse trước khi tạo UI primitive page-local.
- Build và targeted browser validation pass trước closeout.

## Điều kiện dừng

Dừng và báo cáo trước khi mở rộng scope khi:

- behavior canvas trực quan mong muốn cần backend fields hoặc endpoints mới
- canvas dependency gây blocker build/hydration/runtime
- contract node-position hoặc relation hiện có không đủ cho UX được yêu cầu
- mobile layout không thể coherent nếu không redesign lớn hơn
- implementation sẽ chạm Google consent, data collection, export, statistics, admin, hoặc credit behavior

## Deferred

- Backend API changes.
- Database changes.
- Google scopes mới.
- Google Sheets hoặc background sync.
- Statistical reports hoặc charting.
- SPSS execution.
- Collaboration features.
- NCKH admin UI.
- NCKH credit/pricing.
