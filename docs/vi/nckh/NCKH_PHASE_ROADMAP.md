# NCKH_PHASE_ROADMAP

## Mục đích

Định nghĩa các phase triển khai cho NCKH Survey Platform, một module trong hệ sinh thái FormAuto Hub nhưng được theo dõi độc lập với các phase global của FormAuto Hub.

## Phase hiện tại

Trạng thái phase NCKH hiện tại: **Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6, Phase 7, Phase 7.5, Phase 8, và Phase 9 đã completed cho đúng phạm vi được duyệt; Phase 8 chỉ là validation-only; Phase 9 là frontend-only Option A và không thêm backend contracts hoặc canvas dependencies**.

Follow-up NCKH đang active: **không có**. Mọi phase NCKH mới hoặc follow-up fix bổ sung vẫn cần approval rõ trước khi implementation.

Nguồn tiến trình cần đọc:

- Đọc `NCKH_PROGRESS_LEDGER.md` trước để biết evidence đã implement và trạng thái validation.
- Đọc `NCKH_PHASE_1_CLOSEOUT.md` để xem snapshot closeout evidence rõ cho Phase 1.
- Đọc `NCKH_PHASE_2_CLOSEOUT.md` để xem snapshot closeout evidence rõ cho Phase 2.
- Đọc `NCKH_PHASE_3_KICKOFF_PLAN.md` chỉ như context planning lịch sử của Phase 3.
- Đọc `NCKH_PHASE_3_CONTRACT_DB_FREEZE.md` để xem kết quả review contract và DB Pass 0 của Phase 3.
- Đọc `NCKH_PHASE_3_CLOSEOUT.md` để xem snapshot closeout evidence rõ cho Phase 3.
- Đọc `NCKH_PHASE_4_CLOSEOUT.md` để xem snapshot closeout evidence rõ cho Phase 4.
- Đọc `NCKH_PHASE_5_CLOSEOUT.md` để xem snapshot closeout evidence rõ cho Phase 5.
- Đọc `NCKH_PHASE_6_CLOSEOUT.md` để xem snapshot closeout evidence rõ cho Phase 6.
- Đọc `NCKH_PHASE_6_KICKOFF_PLAN.md`, `NCKH_PHASE_6_CONTRACT_DB_FREEZE.md`, và `NCKH_PHASE_6_SINGLE_APPROVAL_PACKET.md` chỉ như context baseline approval lịch sử của Phase 6.
- Đọc `NCKH_PHASE_7_KICKOFF_PLAN.md`, `NCKH_PHASE_7_CONTRACT_UI_FREEZE.md`, và `NCKH_PHASE_7_SINGLE_APPROVAL_PACKET.md` trước khi implement frontend Phase 7.
- Đọc `NCKH_PHASE_7_CLOSEOUT.md` để xem snapshot closeout evidence rõ cho Phase 7.
- Đọc `NCKH_PHASE_7_5_KICKOFF_PLAN.md` trước khi xử lý follow-up Phase 7.5 đã approve cho Google consent và live dataset.
- Đọc `NCKH_PHASE_7_5_CLOSEOUT.md` để xem closeout evidence đã completed và validation record live Google do user xác nhận.
- Đọc `NCKH_PHASE_8_CLOSEOUT.md` để xem snapshot evidence full-stack smoke validation đã completed.
- Đọc `NCKH_PHASE_9_KICKOFF_PLAN.md` như planning baseline lịch sử cho canvas UX work frontend-only Option A đã completed.
- Đọc `NCKH_PHASE_9_CLOSEOUT.md` để xem snapshot closeout evidence Phase 9 đã completed.
- Đọc `NCKH_PHASE_TRANSITION_GUIDE.md` trước khi mở phase NCKH tiếp theo.

## Sơ đồ phụ thuộc phase

```text
Phase 0 (Tài liệu)
  |
  v
Phase 1 (OAuth + Forms API import - đã completed)
  |
  v
Phase 2 (Model + Biến + Mapping - đã completed)
  |
  +--> Phase 3 (Canvas + Quan hệ - đã completed)
  +--> Phase 4 (Tạo/Cập nhật Form - đã completed)
  |       |
  |       v
  |    [có form được tạo/sở hữu để test response]
  |       |
  |       v
  +--> Phase 5 (Thu thập + Chuẩn hóa dữ liệu - đã completed)
          |
          v
       Phase 6 (Export - đã completed)
          |
          v
       Phase 7 (Mở rộng frontend - đã completed)
          |
          v
       Phase 7.5 (Sửa/validate Google consent + live dataset - completed)
          |
          v
       Phase 8 (Smoke validation toàn diện - completed)
          |
          v
       Phase 9 (Hoàn thiện UX canvas - completed)
```

## Phase 0 - Tài liệu & phạm vi cơ sở

Trạng thái: Baseline đã hoàn thành, tiếp tục sync khi scope thay đổi.

Bao gồm:

- requirement package
- entity model và domain overview
- module map và architecture boundaries
- phase roadmap
- API contract guide ở mức đề xuất
- progress ledger và transition guide

Tiêu chí hoàn thành:

- tài liệu bắt buộc tồn tại trong `docs/ai/nckh` và `docs/vi/nckh`
- hai lớp tài liệu đồng bộ ngữ nghĩa
- mục Deferred được gán nhãn
- trạng thái implementation được hỗ trợ bằng repo evidence, không chỉ bằng claim trong roadmap

## Phase 1 - Backend Foundation + Google OAuth Link + Forms API Import

Trạng thái: Completed cho đúng phạm vi Phase 1 đã duyệt. Xem `NCKH_PHASE_1_CLOSEOUT.md` để biết closeout evidence và validation record hiện tại.

Evidence đã implement:

- Entity: `ResearchForm`, `ResearchFormQuestion`
- Migration: `NckhPhase1_FormsAndOAuth`
- DbContext set: `ResearchForms`
- Controller: `ResearchFormsController`
- Service: `ResearchFormService`
- Contract: `NckhGoogleLink*`, `NckhImportForm*`, `NckhForm*`
- Frontend routes: `/dashboard/nckh`, `/dashboard/nckh/callback`
- Tests: `NckhPhase1OAuthAndFormsTests`, `apps/web/tests/nckh.spec.ts`

Scope đã implement:

- endpoint liên kết Google OAuth cho quyền đọc Forms của NCKH
- trao đổi/lưu token Google qua integration Google auth hiện có
- đọc/import cấu trúc form qua Google Forms API
- lưu form và câu hỏi đã import
- API list/detail form theo user
- dashboard/callback shell cho NCKH frontend

Ranh giới scope:

- Chưa tạo hoặc cập nhật Google Forms.
- Chưa đọc responses từ Google Sheets.
- Chưa tạo research model, biến, mapping, quan hệ, dataset, hoặc export.
- Chưa duyệt credit/pricing cho NCKH.

Trạng thái validation:

- Closeout evidence hiện tại đã bao gồm repo evidence, validation build/test/web build hiện tại, và manual test do user xác nhận cho đúng phạm vi API/browser của Phase 1.

## Phase 2 - Quản lý Model & Biến

Trạng thái: Completed cho đúng scope backend-only Phase 2 đã duyệt. Xem `NCKH_PHASE_2_CLOSEOUT.md` để biết closeout evidence và validation record.

Scope đã implement:

- Entity: `ResearchModel`, `ResearchVariable`, `ObservedQuestionMapping`
- Service cho workflow model, biến, và mapping
- Controller CRUD cho model, biến, và mapping
- Cho phép nhiều model trên một imported form
- Ràng buộc: tối đa một model `Active` trên mỗi imported form
- Activation rõ ràng `Draft -> Active`
- Delivery backend-only
- Mapping dùng endpoint riêng, không đi theo payload nested của variable
- Delete behavior nằm trong owned cascade path của Phase 2: `ResearchModel -> ResearchVariable -> ObservedQuestionMapping`
- `ObservedQuestionMapping -> ResearchFormQuestion` dùng restrict delete behavior

Ranh giới scope:

- Không trừ credit.
- Không implement canvas relation.
- Không tạo form.
- Không thu thập hoặc chuẩn hóa response.
- Không export.
- Không implement frontend trong Phase 2.
- Lifecycle `Archived` nằm ngoài scope của Phase 2.
- Hành vi cảnh báo khi sửa biến sau khi có data vẫn deferred cho đến khi Phase 5 data behavior được duyệt.

## Phase 3 - Canvas Quan hệ & Giả thuyết

Trạng thái: Completed cho đúng scope backend-only Phase 3 đã duyệt. Xem `NCKH_PHASE_3_CLOSEOUT.md` để biết closeout evidence và validation record.

Scope đề xuất:

- Entity: `ModelRelation`, `NodePosition`
- CRUD quan hệ
- lưu/tải tọa độ node
- tự sinh mã và nội dung giả thuyết từ biến

Tài liệu planning:

- `NCKH_PHASE_3_KICKOFF_PLAN.md`
- `NCKH_PHASE_3_CONTRACT_DB_FREEZE.md`
- `NCKH_PHASE_3_SINGLE_APPROVAL_PACKET.md`

Ranh giới scope:

- Không dùng AI để sinh giả thuyết.
- Không phân tích thống kê.

## Phase 4 - Tạo & Cập nhật Form

Trạng thái: Completed cho đúng scope backend-only Phase 4 đã duyệt. Xem `NCKH_PHASE_4_CLOSEOUT.md` để biết closeout evidence và validation record.

Tài liệu planning:

- `NCKH_PHASE_4_KICKOFF_PLAN.md`
- `NCKH_PHASE_4_CONTRACT_DB_FREEZE.md`
- `NCKH_PHASE_4_SINGLE_APPROVAL_PACKET.md`
- `NCKH_PHASE_4_CLOSEOUT.md`

Scope đề xuất:

- Google Forms API create/update
- tạo câu hỏi Google Form từ model/variable mappings đã duyệt
- import lại cấu trúc form sau khi tạo/cập nhật

Ranh giới scope:

- Phải xác minh researcher sở hữu hoặc được phép cập nhật form đích.
- Không xóa Google Form không được tạo hoặc sở hữu qua flow đã duyệt.
- Live Google Forms write smoke vẫn blocked cho đến khi có credentials thật và Forms body write consent.

## Phase 5 - Thu thập & Chuẩn hóa Dữ liệu

Trạng thái: Completed cho đúng scope backend-only Phase 5 đã duyệt. Xem `NCKH_PHASE_5_CLOSEOUT.md` để biết closeout evidence và validation record.

Tài liệu planning:

- `NCKH_PHASE_5_KICKOFF_PLAN.md`
- `NCKH_PHASE_5_CONTRACT_DB_FREEZE.md`
- `NCKH_PHASE_5_SINGLE_APPROVAL_PACKET.md`
- `NCKH_PHASE_5_CLOSEOUT.md`

Scope đã implement:

- kéo response thủ công qua Google Forms responses API
- chống trùng và ghi log thu thập
- chuẩn hóa raw response thành observed codes
- tính mean Likert đơn giản
- dữ liệu thiếu lưu là null
- đánh dấu normalized dataset stale khi biến hoặc mapping thay đổi

Ranh giới scope:

- Không auto-submit Google Forms.
- Không real-time sync.
- Không kéo dữ liệu theo lịch.
- Không export trong Phase 5.
- Google Sheets collection vẫn là path thay thế chỉ khi được approve rõ sau này.
- Live Google Forms response-read smoke vẫn blocked đến khi có credentials thật, response-read consent, và submitted responses.

## Phase 6 - Export

Trạng thái: Completed cho đúng scope backend-only Phase 6 đã duyệt. Xem `NCKH_PHASE_6_CLOSEOUT.md` để biết closeout evidence và validation record.

Tài liệu planning:

- `NCKH_PHASE_6_KICKOFF_PLAN.md`
- `NCKH_PHASE_6_CONTRACT_DB_FREEZE.md`
- `NCKH_PHASE_6_SINGLE_APPROVAL_PACKET.md`
- `NCKH_PHASE_6_CLOSEOUT.md`

Scope đã implement:

- export dataset CSV
- export Excel codebook
- export SPSS syntax
- không thêm database migration, table, column, export job, hoặc export history

Ranh giới scope:

- Không vẽ biểu đồ.
- Không sinh báo cáo phân tích thống kê.
- Không tự chạy SPSS.
- Không frontend expansion trong Phase 6.
- Không thêm database tables hoặc columns trong Phase 6.

## Phase 7 - Mở rộng Frontend

Trạng thái: Completed cho đúng scope frontend-only Phase 7 đã duyệt. Xem `NCKH_PHASE_7_CLOSEOUT.md` để biết closeout evidence và validation record.

Tài liệu planning:

- `NCKH_PHASE_7_KICKOFF_PLAN.md`
- `NCKH_PHASE_7_CONTRACT_UI_FREEZE.md`
- `NCKH_PHASE_7_SINGLE_APPROVAL_PACKET.md`
- `NCKH_PHASE_7_CLOSEOUT.md`

Scope đã implement:

- mở rộng `/dashboard/nckh` ngoài import/list form Phase 1
- form/model workspace pages và tab overview, variables, mapping, canvas, generate form, data, export
- frontend UI trên các API backend Phase 1-6 hiện có
- UI quản lý canvas dạng table/list, không thêm React Flow hoặc frontend dependency mới

Ranh giới scope:

- Tái sử dụng Next.js, shadcn/ui, Tailwind baseline của FormAuto Hub.
- Không tạo admin UI riêng cho NCKH nếu chưa được duyệt.
- Không thêm API endpoints, DTO fields, database migrations, Google scopes, Google Sheets collection, scheduled jobs, statistical analysis, charts, credit/pricing, hoặc collaboration behavior.
- Live Google write/read và real dataset file-download checks để lại cho phase validation được duyệt sau.

## Phase 7.5 - Sửa/Validate Google Consent Và Live Dataset

Trạng thái: Completed cho follow-up fix/live-validation đã duyệt. Xem `NCKH_PHASE_7_5_KICKOFF_PLAN.md` và `NCKH_PHASE_7_5_CLOSEOUT.md`.

Evidence kích hoạt:

- live browser testing với `doba2311@gmail.com` đã verify các flow model, variable, mapping, relation, node-position, và activation
- live `generate-form` bị blocked vì thiếu Google Forms body write consent/scope
- live `collect` bị blocked vì thiếu `https://www.googleapis.com/auth/forms.responses.readonly`
- live export bị blocked vì thiếu normalized dataset rows sau khi collection bị blocked

Scope được duyệt:

- kiểm tra và sửa tối thiểu NCKH Google OAuth scope request nếu chưa có các scope đã approve cần cho Phase 4 và Phase 5
- re-consent Google account mục tiêu qua browser flow
- test lại live generate, collect, normalize, và export
- ghi nhận kết quả trung thực bằng `Verified`, `Not run`, và `Blocked`

Ranh giới scope:

- không thêm API endpoints, DTO fields, database fields, statuses, lifecycle states, hoặc migrations mới trừ khi có defect riêng được approve chứng minh cần thiết
- không thêm Google Sheets response collection
- không thêm watches, Pub/Sub, scheduled jobs, statistical analysis, NCKH admin UI, hoặc NCKH credit/pricing
- không dùng fake responses hoặc seeded rows làm evidence cho live Google/export closeout

Trạng thái closeout:

- Alignment scope string/code OAuth đã được verify bằng source inspection.
- Build `apps/web` và targeted Playwright regression Phase 7 Workspace đã pass.
- User xác nhận ngày 2026-06-05 rằng live Google re-consent và live validation `generate -> collect -> normalize -> export` hoạt động.

## Phase 8 - Full-stack Smoke Validation

Trạng thái: Completed cho scope validation-only đã duyệt. Xem `NCKH_PHASE_8_CLOSEOUT.md`.

Ghi chú readiness hiện tại:

- Blocker UI từng quan sát được, trong đó action generate luôn gửi `action: "Create"`, đã được sửa trong code.
- Model response hiện expose `hasGeneratedForm`; UI gửi `action: "Create"` cho lần tạo đầu tiên và `action: "Update"` khi generated form đã tồn tại.
- Live browser/full-stack retest của Phase 8 đã hoàn tất và được ghi lại trong closeout evidence.

Scope đã validate:

- browser smoke với Playwright và Chrome UI automation
- authenticated HTTP smoke
- kiểm tra database-backed
- kiểm tra Google OAuth / Forms tùy phase đã duyệt
- xác minh file export bằng endpoint backend Phase 6 đã completed

Nhãn report:

- Verified
- Not run
- Blocked

## Phase 9 - Hoàn thiện UX Canvas Và Workflow Polish

Trạng thái: Completed cho scope frontend-only Option A đã duyệt. Xem `NCKH_PHASE_9_CLOSEOUT.md`.

Phase này thuộc track module NCKH độc lập và không mở lại FormAuto Hub global Phase 9.

Scope đã implement:

- lớp visual canvas sau baseline bảng/danh sách của Phase 7
- Option A: giữ baseline bảng/danh sách trong dashboard và không thêm React Flow hoặc canvas dependency khác
- thể hiện trực quan biến, quan hệ, vị trí node đã lưu, và luồng giả thuyết bằng dữ liệu API hiện có
- giữ ba vùng đặt action button từ note UI Phase 7: toolbar, contextual actions, và save/status
- reuse shared/base UI components trước khi tạo primitive page-local
- giữ toàn bộ copy hiển thị theo hướng tiếng Việt trước, trừ thuật ngữ kỹ thuật được chấp nhận
- giữ fallback dạng bảng/danh sách

Ranh giới scope:

- không thêm backend endpoints, DTO fields, database fields, entities, migrations, statuses, hoặc lifecycle states
- không đổi Google OAuth scopes hoặc behavior Google consent
- không thêm Google Sheets collection, watches, scheduled jobs, statistical reports, NCKH admin UI, hoặc NCKH credit/pricing
- thêm frontend canvas dependency vẫn nằm ngoài scope Phase 9 Option A đã completed

## Go/No-Go Gates

| Gate | Điều kiện | Thời điểm |
|---|---|---|
| Phase approval | User approve rõ phase NCKH hoặc follow-up fix mục tiêu | Trước implementation |
| Contract guard | API DTO, status, lifecycle, route được kiểm tra | Trước implementation nhạy contract |
| DB risk review | Quan hệ entity, delete behavior, index, migration được review | Trước migration |
| Runtime validation | Build/test và HTTP/browser/database smoke phù hợp | Trước closeout |
| Docs sync | `docs/ai/nckh` và `docs/vi/nckh` được cập nhật cùng nhau | Mọi task sửa docs |

## Deferred

- React Flow hoặc canvas editing dependency khác trừ khi được approve rõ sau này
- Google Sheets API response pull trừ khi được chọn rõ cho implementation Phase 5
- Google Forms watches / Cloud Pub/Sub
- scheduled data collection
- phân tích thống kê trong app
- multi-researcher collaboration
- credit/pricing model cho NCKH
- admin UI riêng cho NCKH
