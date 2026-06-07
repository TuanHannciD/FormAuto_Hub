# NCKH_PHASE_7_CLOSEOUT

## Mục đích

Ghi lại closeout evidence cho slice NCKH Phase 7 frontend expansion đã được duyệt.

## Trạng thái closeout

Trạng thái: **Completed cho đúng scope frontend-only Phase 7 đã duyệt**.

Closeout này không claim readiness cho backend API mới, database mới, live Google write/read production readiness, statistical analysis, admin NCKH, hoặc credit/pricing.

## Tóm tắt implementation

Đã implement:

- route workspace form NCKH: `/dashboard/nckh/forms/{formId}`
- tải form detail qua API form detail Phase 1 hiện có
- UI list/create/activate/delete model qua API model Phase 2 hiện có
- UI create/delete/list variable qua API variable Phase 2 hiện có
- UI create/delete/list observed mapping qua API mapping Phase 2 hiện có
- UI create/delete/list relation qua API canvas relation Phase 3 hiện có
- UI save/list node-position qua API position Phase 3 hiện có
- action tạo Google Form qua API generate-form Phase 4 hiện có
- UI collect response, list raw response, normalize, và preview dataset qua API Phase 5 hiện có
- action export CSV/codebook/SPSS qua API export Phase 6 hiện có
- frontend API types cho response shapes NCKH Phase 2-6 hiện có
- Playwright coverage cho route workspace Phase 7 và các tabs/actions

Ghi chú implementation: Phase 7 dùng UI quản lý canvas dạng table/list gọn và không thêm React Flow hoặc dependency frontend mới.

## Files changed

Main implementation files:

- `apps/web/lib/api.ts`
- `apps/web/app/dashboard/nckh/forms/[formId]/page.tsx`
- `apps/web/tests/nckh.spec.ts`

Documentation updates:

- `docs/ai/nckh/NCKH_PHASE_7_CLOSEOUT.md`
- `docs/vi/nckh/NCKH_PHASE_7_CLOSEOUT.md`
- `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/vi/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/vi/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/ai/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/vi/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/ai/AI_DOC_ROUTING_MATRIX.md`
- `docs/vi/AI_DOC_ROUTING_MATRIX.md`

## Tác động API contract

Không thay đổi backend API contract.

Đã xác nhận:

- không đổi backend controllers
- không đổi backend services
- không thêm DTO fields vào backend contracts
- không thêm route surface mới
- không thêm status hoặc lifecycle value mới
- frontend types chỉ được thêm để consume NCKH API shapes hiện có

## Tác động database contract

Không thay đổi database.

Đã xác nhận:

- không thêm entity
- không thêm table
- không thêm column
- không thêm EF Core migration
- không thêm export job/history table

## Validation đã thực hiện

Verified:

- `npm run build` trong `apps/web` đã pass.
- `npx playwright test tests/nckh.spec.ts -g "Phase 7 Workspace" --workers=1 --reporter=line` đã pass: 3 passed.
- `npx playwright test tests/nckh.spec.ts --workers=1 --reporter=json` đã pass: 26 passed, 0 failed.
- Browser smoke cover `/dashboard/nckh/forms/{formId}` với mocked authenticated NCKH APIs.
- Browser smoke xác minh route workspace Phase 7 render model tabs.
- Browser smoke xác minh tab variables consume đúng backend contract shape hiện có.
- Browser smoke xác minh action export CSV, codebook, SPSS hiển thị mà không thêm backend contract mới.
- Đã kiểm tra dev server logs sau smoke; route requests trả `200` và không thấy fatal frontend server error trong phần tail đã inspect.

## Validation chưa thực hiện

Not run:

- `dotnet build` / backend tests, vì Phase 7 không đổi backend code.
- Live Google Forms create/update smoke, vì môi trường này không có Google OAuth credentials thật và Forms body write consent.
- Live Google Forms response-read smoke, vì môi trường này không có Google OAuth credentials thật, response-read consent, và submitted responses.
- Real file download với live database-backed normalized dataset, vì Playwright Phase 7 dùng mocked API responses.

## Scope alignment

Giữ trong scope:

- workspace NCKH frontend-only
- consume API Phase 1-6 hiện có
- dashboard copy tiếng Việt trước
- loading, empty, error, blocked, và success states
- quản lý canvas dạng table/list, không thêm dependency mới

Giữ ngoài scope:

- backend endpoints
- thay đổi DTO/database contract
- Google Sheets collection
- scheduled jobs, watches, Pub/Sub, hoặc background workers
- chart, statistical analysis, generated reports, hoặc SPSS execution
- admin UI riêng cho NCKH
- credit/pricing cho NCKH
- multi-researcher collaboration

## Residual risks

- Full live Google write/read workflow vẫn cần credentials và consent thật để validate các blocked paths ngoài mocks.
- File export button đã nối tới endpoint hiện có, nhưng end-to-end binary download validation với seeded live dataset nên chạy lại trong phase validation full-stack.
- UI canvas dạng table/list đang cố ý basic; slice UI polish được duyệt sau này có thể thêm React Flow hoặc diagram behavior giàu hơn mà không đổi backend contracts.

## Candidate tiếp theo

Follow-up tiếp theo hiện tại: **NCKH Phase 7.5 - Sửa/Validate Google Consent Và Live Dataset**.

Quyết định này supersede wording Phase 8 trước đó sau khi live browser testing phát hiện blocker cụ thể về Google consent và live dataset. Xem `NCKH_PHASE_7_5_KICKOFF_PLAN.md`.
