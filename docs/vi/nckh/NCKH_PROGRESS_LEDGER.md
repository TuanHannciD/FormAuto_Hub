# NCKH_PROGRESS_LEDGER

## Mục đích

Ghi lại trạng thái tiến trình có evidence trong repo cho NCKH Survey Platform để các lần làm sau bắt đầu từ repo truth thay vì wording roadmap đã cũ.

Đây là tài liệu trạng thái NCKH đầu tiên cần đọc sau `README.md`, `AGENTS.md`, và `docs/ai/AI_DOC_ROUTING_MATRIX.md`.

## Trạng thái hiện tại

Trạng thái global FormAuto Hub: Phase 9 closeout đã hoàn tất; chưa chọn global phase tiếp theo.

Trạng thái NCKH: Phase 1 đã có implementation evidence trong repo. Phase 2 là candidate tiếp theo và mặc định chưa được duyệt.

Không có phase implementation NCKH nào đang active trừ khi user approve rõ.

## Tóm tắt evidence

| Khu vực | Evidence | Trạng thái |
|---|---|---|
| Phase 0 docs | `docs/ai/nckh/*.md`, `docs/vi/nckh/*.md` | Baseline tồn tại; phải tiếp tục sync |
| Entity Phase 1 | `src/FormAutoHub.Api/Entities/Nckh/ResearchForm.cs`, `ResearchFormQuestion.cs` | Đã implement |
| Migration Phase 1 | `src/FormAutoHub.Api/Data/Migrations/20260530051057_NckhPhase1_FormsAndOAuth.cs` | Đã implement |
| DbContext Phase 1 | `src/FormAutoHub.Api/Data/FormAutoHubDbContext.cs` | Đã implement `ResearchForms` |
| API Phase 1 | `src/FormAutoHub.Api/Controllers/Nckh/ResearchFormsController.cs` | Đã implement |
| Service Phase 1 | `src/FormAutoHub.Api/Services/Nckh/ResearchFormService.cs` | Đã implement |
| DTO Phase 1 | `src/FormAutoHub.Api/Contracts/NckhDtos.cs` | Đã implement |
| Frontend Phase 1 | `apps/web/app/dashboard/nckh/page.tsx`, `apps/web/app/dashboard/nckh/callback/page.tsx` | Đã implement |
| Test Phase 1 | `tests/FormAutoHub.Tests/NckhPhase1OAuthAndFormsTests.cs`, `apps/web/tests/nckh.spec.ts` | Có test file |
| Backend Phase 2+ | Research model, variables, mappings, relations, data, export code | Chưa thấy trong evidence pass hiện tại |

## Hành vi Phase 1 đã implement

Đã implement:

- route prefix NCKH `/api/v1/nckh`
- endpoint liên kết Google đã auth: `POST /api/v1/nckh/auth/google-link`
- endpoint import form đã auth: `POST /api/v1/nckh/forms/import`
- endpoint list form đã auth: `GET /api/v1/nckh/forms`
- endpoint detail form đã auth: `GET /api/v1/nckh/forms/{formId}`
- yêu cầu Google Forms read scope
- lưu form/câu hỏi đã import
- guard chống import trùng theo user/form
- frontend shell cho NCKH dashboard và OAuth callback

Chưa thấy implement trong evidence Phase 1:

- CRUD research model
- CRUD biến
- CRUD observed question mapping
- quan hệ model
- node/canvas positions
- tạo/cập nhật Google Form
- thu thập response từ Google Sheets
- normalized datasets
- export CSV/Excel/SPSS
- admin UI riêng cho NCKH
- credit/pricing cho NCKH

## Trạng thái validation

Verified trong task sync tài liệu này:

- Đã scan repo files cho NCKH docs, entities, controller/service/contracts, migration, frontend routes, và tests.

Not run trong task sync tài liệu này:

- `dotnet build`
- `dotnet test`
- `npm run build`
- Playwright smoke
- live Google OAuth flow
- live Google Forms API import
- apply migration trên database hiện tại

Không được claim runtime readiness hiện tại chỉ từ ledger này. Phải chạy lại validation phù hợp trước closeout của bất kỳ task implementation nào.

## Bảng trạng thái phase

| Phase NCKH | Trạng thái | Hành động tiếp theo |
|---|---|---|
| Phase 0 - Docs baseline | Baseline đã hoàn thành | Giữ AI/VI synced |
| Phase 1 - OAuth + Forms API import | Đã implement với repo evidence | Chạy lại validation trước khi claim production/runtime |
| Phase 2 - Model + Variables + Mapping | Candidate tiếp theo, chưa active | Cần approval, contract guard, DB risk review |
| Phase 3 - Canvas Relations | Đề xuất | Cần approval sau/kèm dependency Phase 2 rõ ràng |
| Phase 4 - Form Generation | Đề xuất | Cần approval và review Google Forms write scope |
| Phase 5 - Data Collection + Normalization | Đề xuất | Cần approval và review Google Sheets scope |
| Phase 6 - Export | Đề xuất | Cần approval sau khi data model đã implement |
| Phase 7 - Frontend expansion | Đề xuất | Cần backend contract đã duyệt trước |
| Phase 8 - Full-stack smoke validation | Đề xuất | Chạy sau các phase implementation đã duyệt |

## Quy tắc sync

- Khi sửa file này, sửa `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md` trong cùng task.
- Khi phase state thay đổi, cập nhật `NCKH_PHASE_ROADMAP.md` và `NCKH_PHASE_TRANSITION_GUIDE.md` ở cả hai language layers.
- Không đánh dấu phase completed nếu thiếu source/test/runtime evidence.
- Dùng `Implemented with repo evidence` khi code tồn tại nhưng chưa chạy lại runtime validation hiện tại.
- Chỉ dùng `Completed` khi phase có closeout evidence và validation bắt buộc đã được chạy.

## Deferred

- Implementation NCKH Phase 2+ cho đến khi được approve rõ.
- API contracts, database fields, lifecycle states, hoặc Google scopes mới ngoài Phase 1 cho đến khi được review và approve.
- Claim production-readiness cho đến khi chạy validation hiện tại.
