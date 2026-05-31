# NCKH_PHASE_ROADMAP

## Mục đích

Định nghĩa các phase triển khai cho NCKH Survey Platform, một module trong hệ sinh thái FormAuto Hub nhưng được theo dõi độc lập với các phase global của FormAuto Hub.

## Phase hiện tại

Trạng thái phase NCKH hiện tại: **Phase 1 đã có implementation evidence trong repo; Phase 2 là candidate tiếp theo và chưa được duyệt để triển khai**.

Mặc định không có phase triển khai NCKH nào đang active. Mọi phase NCKH mới hoặc follow-up fix đều cần approval rõ trước khi implementation.

Nguồn tiến trình cần đọc:

- Đọc `NCKH_PROGRESS_LEDGER.md` trước để biết evidence đã implement và trạng thái validation.
- Đọc `NCKH_PHASE_TRANSITION_GUIDE.md` trước khi mở phase NCKH tiếp theo.

## Sơ đồ phụ thuộc phase

```text
Phase 0 (Tài liệu)
  |
  v
Phase 1 (OAuth + Forms API import - đã có evidence implementation)
  |
  v
Phase 2 (Model + Biến + Mapping - candidate tiếp theo, cần approval)
  |
  +--> Phase 3 (Canvas + Quan hệ - đề xuất)
  +--> Phase 4 (Tạo/Cập nhật Form - đề xuất)
  |       |
  |       v
  |    [có form được tạo/sở hữu để test response]
  |       |
  |       v
  +--> Phase 5 (Thu thập + Chuẩn hóa dữ liệu - đề xuất)
          |
          v
       Phase 6 (Export - đề xuất)
          |
          v
       Phase 7 (Mở rộng frontend - đề xuất)
          |
          v
       Phase 8 (Smoke validation toàn diện - đề xuất)
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

Trạng thái: Đã có implementation evidence trong repo. Cần chạy lại runtime/live validation trước khi xem là production-ready.

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

- Có evidence test/smoke trong repo file, nhưng task sync tài liệu này chưa chạy lại runtime validation hiện tại.

## Phase 2 - Quản lý Model & Biến

Trạng thái: Candidate tiếp theo. Cần approval rõ trước khi triển khai.

Scope đề xuất:

- Entity: `ResearchModel`, `ResearchVariable`, `ObservedQuestionMapping`
- Service cho workflow model, biến, và mapping
- Controller CRUD cho model, biến, và mapping
- Ràng buộc: MVP một active model cho mỗi imported form nếu chưa có approval thay đổi
- Cascade/delete behavior phải được review trước migration
- Hành vi cảnh báo khi sửa biến sau khi có data vẫn là đề xuất cho đến khi Phase 5 data behavior được duyệt

Ranh giới scope:

- Không trừ credit.
- Không implement canvas relation.
- Không tạo form.
- Không thu thập hoặc chuẩn hóa response.
- Không export.

## Phase 3 - Canvas Quan hệ & Giả thuyết

Trạng thái: Đề xuất. Cần approval rõ.

Scope đề xuất:

- Entity: `ModelRelation`, `NodePosition`
- CRUD quan hệ
- lưu/tải tọa độ node
- tự sinh mã và nội dung giả thuyết từ biến

Ranh giới scope:

- Không dùng AI để sinh giả thuyết.
- Không phân tích thống kê.

## Phase 4 - Tạo & Cập nhật Form

Trạng thái: Đề xuất. Cần approval rõ.

Scope đề xuất:

- Google Forms API create/update
- tạo câu hỏi Google Form từ model/variable mappings đã duyệt
- import lại cấu trúc form sau khi tạo/cập nhật

Ranh giới scope:

- Phải xác minh researcher sở hữu hoặc được phép cập nhật form đích.
- Không xóa Google Form không được tạo hoặc sở hữu qua flow đã duyệt.

## Phase 5 - Thu thập & Chuẩn hóa Dữ liệu

Trạng thái: Đề xuất. Cần approval rõ.

Scope đề xuất:

- kéo response thủ công qua Google Sheets API
- chống trùng và ghi log thu thập
- chuẩn hóa raw response thành observed codes
- tính mean Likert đơn giản
- dữ liệu thiếu lưu là null

Ranh giới scope:

- Không auto-submit Google Forms.
- Không real-time sync.
- Không kéo dữ liệu theo lịch.

## Phase 6 - Export

Trạng thái: Đề xuất. Cần approval rõ.

Scope đề xuất:

- export dataset CSV
- export Excel codebook
- export SPSS syntax

Ranh giới scope:

- Không vẽ biểu đồ.
- Không sinh báo cáo phân tích thống kê.
- Không tự chạy SPSS.

## Phase 7 - Mở rộng Frontend

Trạng thái: Đề xuất. Cần approval rõ.

Scope đề xuất:

- mở rộng `/dashboard/nckh` ngoài import/list form Phase 1
- trang detail model và tab form, biến, canvas, data, export
- React Flow canvas nếu Phase 3 được duyệt

Ranh giới scope:

- Tái sử dụng Next.js, shadcn/ui, Tailwind baseline của FormAuto Hub.
- Không tạo admin UI riêng cho NCKH nếu chưa được duyệt.

## Phase 8 - Full-stack Smoke Validation

Trạng thái: Đề xuất. Cần approval rõ sau các phase implementation.

Scope đề xuất:

- browser smoke với Playwright
- authenticated HTTP smoke
- kiểm tra database-backed
- kiểm tra Google OAuth / Forms / Sheets tùy phase đã duyệt
- xác minh file export nếu Phase 6 được implement

Nhãn report:

- Verified
- Not run
- Blocked

## Go/No-Go Gates

| Gate | Điều kiện | Thời điểm |
|---|---|---|
| Phase approval | User approve rõ phase NCKH hoặc follow-up fix mục tiêu | Trước implementation |
| Contract guard | API DTO, status, lifecycle, route được kiểm tra | Trước implementation nhạy contract |
| DB risk review | Quan hệ entity, delete behavior, index, migration được review | Trước migration |
| Runtime validation | Build/test và HTTP/browser/database smoke phù hợp | Trước closeout |
| Docs sync | `docs/ai/nckh` và `docs/vi/nckh` được cập nhật cùng nhau | Mọi task sửa docs |

## Deferred

- Implementation NCKH Phase 2+ cho đến khi được duyệt
- Google Sheets API response pull cho đến Phase 5 approval
- Google Forms create/update cho đến Phase 4 approval
- Google Forms watches / Cloud Pub/Sub
- scheduled data collection
- phân tích thống kê trong app
- multi-researcher collaboration
- credit/pricing model cho NCKH
- admin UI riêng cho NCKH
