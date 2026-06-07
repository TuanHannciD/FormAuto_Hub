# NCKH_PHASE_7_KICKOFF_PLAN

## Mục đích

Định nghĩa kickoff plan có gate approval cho NCKH Phase 7 để mở rộng frontend dựa trên backend contracts Phase 1-6 đã completed mà không kéo thêm API, database, Google integration, thống kê, credit, hoặc admin scope mới.

## Task đã được duyệt

Approval từ user: mở task NCKH tiếp theo sau closeout Phase 6.

Task được duyệt trong pass này: kickoff Phase 7, freeze UI/contract, và tạo packet implementation sẵn cho worker.

Implementation vẫn là bước riêng sau khi pass planning/freeze này được chấp nhận.

## Baseline hiện tại

- NCKH Phase 1 đến Phase 6 đã completed cho đúng phạm vi được duyệt.
- Phase 7 là candidate mở rộng frontend tiếp theo.
- Frontend shell hiện có: `/dashboard/nckh` và `/dashboard/nckh/callback`.
- Stack frontend hiện có: Next.js dashboard, component kiểu shadcn/ui, Tailwind CSS, lucide-react.
- Phải tái sử dụng shared components hiện có trước khi tạo UI primitive page-local.
- Backend contracts cho import form, model, biến, mapping, canvas, tạo form, thu thập dữ liệu, chuẩn hóa, dataset listing, và export đã được implement.

## Mục tiêu phase

Làm module NCKH dùng được từ dashboard cho workflow backend đã completed:

1. import/list form,
2. mở workspace form/model,
3. quản lý research model,
4. quản lý biến và observed mapping,
5. xem/sửa canvas relation,
6. tạo/cập nhật Google Form qua backend endpoint đã duyệt,
7. thu thập và chuẩn hóa responses,
8. xem normalized dataset rows,
9. export CSV, codebook, và SPSS syntax files.

## Trong scope

- Mở rộng `/dashboard/nckh` từ shell Phase 1 thành workspace frontend.
- Thêm navigation theo model trong dashboard NCKH chỉ dùng API backend đã document.
- Thêm UI cho API model, variable, observed mapping hiện có từ Phase 2.
- Thêm UI cho API canvas relation và node-position hiện có từ Phase 3.
- Thêm UI cho endpoint generate-form hiện có từ Phase 4.
- Thêm UI cho endpoint collect, responses, normalize, dataset hiện có từ Phase 5.
- Thêm UI cho endpoint export hiện có từ Phase 6.
- Dùng copy dashboard tiếng Việt trước.
- Định nghĩa loading, empty, error, permission, blocked, và success states cho từng panel chính.
- Thêm frontend tests hoặc Playwright smoke phù hợp cho dashboard flow chính khi implementation đổi frontend files.

## Ngoài scope

- Backend endpoints mới.
- DTO fields hoặc status values mới.
- Database tables, columns, migrations, hoặc lifecycle states mới.
- Google Sheets response collection.
- Google Forms watches, Pub/Sub, scheduled jobs, hoặc background workers.
- Phân tích thống kê, biểu đồ, generated reports, hoặc chạy SPSS tự động.
- Admin UI riêng cho NCKH.
- Credit/pricing cho NCKH.
- Multi-researcher collaboration.
- Claim live Google validation production nếu thiếu credentials và consent thật.

## Frontend surfaces đề xuất

### Trang NCKH Home

- Trạng thái liên kết Google.
- Import Google Form.
- Danh sách form đã import.
- Entry points vào form/model workspace.

### Form Workspace

- Tóm tắt form và danh sách câu hỏi.
- Danh sách research model của imported form.
- Action tạo model.
- Indicator model Active.

### Model Workspace

Tabs hoặc sections dashboard tương đương:

- Overview
- Variables
- Mapping
- Canvas
- Generate form
- Data
- Export

## Các pass delivery

### Pass 0 - Freeze UI/Contract

Output:

- `NCKH_PHASE_7_CONTRACT_UI_FREEZE.md`
- `NCKH_PHASE_7_SINGLE_APPROVAL_PACKET.md`

Rules:

- Xác nhận Phase 7 chỉ consume API hiện có.
- Xác nhận không cần DB migration.
- Xác nhận shared frontend components và shell rules.

### Pass 1 - Route và Data Client Foundation

Output:

- frontend routes cho form/model workspace
- typed API client additions chỉ cho NCKH contracts hiện có
- shared page state helpers nếu cần

Validation:

- frontend build
- type/lint checks phù hợp với repo

### Pass 2 - UI Models, Variables, Mapping

Output:

- flow list/create/activate/delete model nếu API hiện có hỗ trợ
- UI CRUD biến
- UI observed mapping
- stale-data messaging nếu API hiện có expose state này

Validation:

- browser smoke cho workflow model/variable/mapping

### Pass 3 - Canvas UI

Output:

- UI CRUD relation
- UI save/load node-position

- hiển thị deterministic hypothesis

Validation:

- browser smoke cho tạo relation và reload saved positions

### Pass 4 - UI Generate, Data, Export

Output:

- action generate form dùng endpoint Phase 4 hiện có
- UI collect/responses/normalize/dataset dùng endpoint Phase 5 hiện có
- action export CSV/codebook/SPSS dùng endpoint Phase 6 hiện có

Validation:

- browser smoke cho blocked Google scope states và seeded/local backend states
- kiểm tra file-download behavior khi thực tế làm được

### Pass 5 - Closeout

Output:

- closeout docs Phase 7 trong `docs/ai/nckh` và `docs/vi/nckh`
- sync progress ledger, roadmap, transition guide, và routing matrix

Validation:

- kết quả build/test
- kết quả browser smoke
- nhãn `Blocked` rõ cho live Google checks không chạy được

## Stop conditions

Dừng và hỏi approval nếu implementation cần:

- API endpoint, field, status, lifecycle state, table, hoặc migration mới
- Google scopes mới ngoài response-read handling Phase 5 đã completed
- Google Sheets, Drive-wide scopes, watches, Pub/Sub, hoặc scheduled sync
- thống kê, charting, generated reports, hoặc SPSS execution
- NCKH admin, credit, pricing, hoặc collaboration behavior
- thay thế dashboard shell hoặc shared UI component baseline hiện có

## Kỳ vọng validation

Validation tối thiểu cho implementation Phase 7:

- frontend build cho `apps/web`
- unit/component tests phù hợp nếu repo có cho surface bị chạm
- Playwright/browser smoke cho route dashboard NCKH và primary workspace flow
- API-backed smoke bằng authenticated local session khi frontend phụ thuộc backend data
- kiểm tra server/browser logs sau smoke

Dùng nhãn:

- Verified
- Not run
- Blocked

## Trọng tâm review

Review Phase 7 theo các điểm:

- giữ đúng scope frontend-only
- không phát minh API/DTO/database contracts
- tái sử dụng shared dashboard components
- copy tiếng Việt trước
- loading/empty/error/permission states đúng
- không làm yếu Google scope guards hoặc ownership checks
- validation labels trung thực

