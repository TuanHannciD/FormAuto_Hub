# NCKH_PHASE_9_CLOSEOUT

## Mục đích

Ghi lại closeout evidence cho implementation NCKH Phase 9 về hoàn thiện UX canvas và polish workflow.

## Trạng thái closeout

Trạng thái: **Completed cho scope frontend-only Option A đã duyệt**.

Phase 9 dùng Option A từ `NCKH_PHASE_9_KICKOFF_PLAN.md`: giữ baseline canvas dạng bảng/danh sách trong dashboard và thêm lớp visual canvas mà không thêm frontend canvas dependency.

Closeout này không thêm backend endpoints, DTO fields, database fields, migrations, Google scopes, Google Sheets collection, watches, scheduled jobs, statistics, admin UI, credit/pricing, hoặc production automation.

## Phần đã hoàn tất

Đã implement trong workspace form NCKH:

- Visual canvas section trong tab `Sơ đồ quan hệ`.
- Variable nodes render từ dữ liệu API biến hiện có.
- Relation edges render từ dữ liệu API quan hệ hiện có.
- Relation marker nodes render từ dữ liệu API quan hệ hiện có.
- Vị trí node đã lưu được load từ positions API Phase 3 hiện có.
- Action `Lưu bố cục` tiếp tục gọi contract hiện có `PUT /api/v1/nckh/models/{modelId}/positions`.
- Vùng action toolbar chính của canvas vẫn là form tạo relation hiện có.
- Vùng contextual action liệt kê relations gần nhất kèm action xóa qua API delete relation hiện có.
- Vùng save/status hiển thị số vị trí đã lưu và lưu layout mặc định hiện tại.
- Bảng quan hệ fallback vẫn nằm dưới visual canvas.
- Copy UI hiển thị giữ hướng tiếng Việt trước.

## Files changed

- `apps/web/app/dashboard/nckh/forms/[formId]/page.tsx`
- `apps/web/tests/nckh.spec.ts`
- `docs/ai/nckh/NCKH_PHASE_9_CLOSEOUT.md`
- `docs/vi/nckh/NCKH_PHASE_9_CLOSEOUT.md`
- Các docs progress, roadmap, transition, và routing NCKH ở cả hai language layers.

## Quyết định contract và dependency

Quyết định: **Option A**.

Các contract hiện có là đủ:

- `GET /api/v1/nckh/models/{modelId}/relations`
- `POST /api/v1/nckh/models/{modelId}/relations`
- `DELETE /api/v1/nckh/relations/{relationId}`
- `GET /api/v1/nckh/models/{modelId}/positions`
- `PUT /api/v1/nckh/models/{modelId}/positions`

Không thêm React Flow hoặc canvas dependency khác.

## Validation đã chạy

Verified:

- `npm run build` trong `apps/web` đã pass.
- `npx playwright test tests/nckh.spec.ts -g "visual canvas" --workers=1 --reporter=json` đã pass: 1 passed.
- `npx playwright test tests/nckh.spec.ts -g "Phase 7 Workspace" --workers=1 --reporter=json` đã pass: 6 passed.
- Desktop browser smoke xác minh canvas render marker relation `SER -> SAT` và `pageErrors=0`.
- Mobile browser smoke xác minh canvas render marker relation `SER -> SAT` và `pageErrors=0`.
- Screenshot đã lưu tại `apps/web/test-results/phase9-canvas-smoke/desktop.png` và `apps/web/test-results/phase9-canvas-smoke/mobile.png`.

Sửa môi trường trong lúc validation:

- Attempt Playwright đầu bị chặn bởi stale `.next` artifacts và Next dev server cũ.
- Đã clear `.next` và dừng process cũ trên port 3000 trước khi chạy lại validation.

## Validation chưa hoàn tất

Not run:

- Backend build/test, vì Phase 9 không đổi backend code.
- Live Google API smoke, vì Phase 9 không đổi Google consent, collection, generation, hoặc export behavior.
- Full NCKH Playwright regression ngoài targeted workspace group.
- Drag-and-drop node editing, vì Option A không thêm visual canvas editing dependency.

Blocked:

- Không có blocker cho scope frontend-only Option A đã duyệt.

## Scope alignment

Giữ trong scope:

- frontend-only canvas UX completion
- contract relation và position Phase 3 hiện có
- copy tiếng Việt trước
- shared/base buttons, badges, tables, empty state, và page layout primitives
- desktop/mobile browser verification

Giữ ngoài scope:

- backend endpoints
- DTO fields
- database fields hoặc migrations
- Google OAuth scopes mới
- Google Sheets collection
- watches, Pub/Sub, scheduled jobs, hoặc background workers
- statistical analysis, charting, generated reports, hoặc SPSS execution
- NCKH admin UI
- NCKH credit/pricing
- React Flow hoặc canvas dependency khác

## Rủi ro còn lại

- Visual canvas là lớp inspect và lưu layout mặc định, chưa phải drag-and-drop editor.
- Behavior relation và position vẫn phụ thuộc các backend contracts Phase 3 hiện có.
- Chưa benchmark canvas với mật độ node/relation ở quy mô production.

## Quyết định closeout

NCKH Phase 9 là **Completed** cho scope frontend-only Option A đã duyệt.

Không còn P0/P1 blocker trong scope hoàn thiện UX canvas Phase 9 đã duyệt dựa trên evidence build, targeted Playwright, và browser desktop/mobile.

## Candidate tiếp theo

Không có follow-up NCKH active sau closeout Phase 9.

Mọi việc NCKH tiếp theo cần approval rõ và phải giữ nguyên các Deferred items đã liệt kê ở trên.
