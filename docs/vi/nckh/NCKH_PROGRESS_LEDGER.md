# NCKH_PROGRESS_LEDGER

## Mục đích

Ghi lại trạng thái tiến trình có evidence trong repo cho NCKH Survey Platform để các lần làm sau bắt đầu từ repo truth thay vì wording roadmap đã cũ.

Đây là tài liệu trạng thái NCKH đầu tiên cần đọc sau `README.md`, `AGENTS.md`, và `docs/ai/AI_DOC_ROUTING_MATRIX.md`.

## Trạng thái hiện tại

Trạng thái global FormAuto Hub: Phase 9 closeout đã hoàn tất; chưa chọn global phase tiếp theo.

Trạng thái NCKH: Phase 1 và Phase 2 đã hoàn tất cho đúng phạm vi được duyệt. Phase 3 là phase đề xuất tiếp theo và mặc định chưa được duyệt.

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
| Entity Phase 2 | `src/FormAutoHub.Api/Entities/Nckh/ResearchModel.cs`, `ResearchVariable.cs`, `ObservedQuestionMapping.cs` | Đã implement |
| Migration Phase 2 | `src/FormAutoHub.Api/Data/Migrations/20260602193837_NckhPhase2_PersistenceFoundation.cs` | Đã implement và đã apply trong validation |
| API Phase 2 | `src/FormAutoHub.Api/Controllers/Nckh/ResearchModelsController.cs`, `ResearchVariablesController.cs` | Đã implement |
| Service Phase 2 | `src/FormAutoHub.Api/Services/Nckh/ResearchModelService.cs`, `ResearchFormService.cs` | Đã implement |
| Test Phase 2 | `tests/FormAutoHub.Tests/NckhPhase2PersistenceTests.cs`, `NckhPhase2ModelApiTests.cs`, `NckhPhase2VariableMappingApiTests.cs` | Test pass trong validation mới nhất |
| Backend Phase 3+ | Relations, canvas positions, data collection, normalization, export code | Deferred / chưa implement |

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

Đã implement trong evidence Phase 2:

- CRUD research model
- cho phép nhiều model trên một imported form
- enforce tối đa một model `Active` trên mỗi imported form
- endpoint activation rõ ràng `Draft -> Active`
- CRUD biến trong model
- CRUD observed question mapping qua endpoint riêng
- unique ở database cho variable code và observed mappings
- xóa model trong nhánh cascade thuộc sở hữu Phase 2

Chưa thấy implement trong evidence Phase 1/2:

- quan hệ model
- node/canvas positions
- tạo/cập nhật Google Form
- thu thập response từ Google Sheets
- normalized datasets
- export CSV/Excel/SPSS
- admin UI riêng cho NCKH
- credit/pricing cho NCKH

## Trạng thái validation

Verified trong pass tài liệu và validation mới nhất:

- Đã scan repo files cho NCKH docs, entities, controller/service/contracts, migration, frontend routes, và tests.
- dotnet build FormAutoHub.sln -c Release đã pass cho slice backend NCKH Phase 2 hiện tại.
- dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release đã pass: 122 passed, 0 failed.
- EF Core database update đã apply `20260602193837_NckhPhase2_PersistenceFoundation` lên database SQL Server Development.
- Authenticated HTTP smoke đã pass trên `http://127.0.0.1:5097` với JWT thật cho CRUD model, variable, mapping và activation `Draft -> Active`.
- Dữ liệu smoke NCKH Phase 2 đã được dọn và API process đã được dừng sau validation.
- User đã xác nhận manual test cho luồng NCKH Phase 1 vào ngày 2026-06-01 cho đủ 6 mục: POST /api/v1/nckh/auth/google-link, POST /api/v1/nckh/forms/import, GET /api/v1/nckh/forms, GET /api/v1/nckh/forms/{formId}, /dashboard/nckh, và /dashboard/nckh/callback.

Not run trong pass tài liệu và validation mới nhất:

- Playwright smoke cho frontend NCKH Phase 2, vì Phase 2 là backend-only và không implement frontend scope.
- live Google OAuth flow hoặc live Google Forms API import trong pass closeout Phase 2; đây là behavior Phase 1 và không bị thay đổi bởi Phase 2.
- frontend build trong pass closeout Phase 2, vì không có file frontend nào thay đổi trong scope Phase 2 hiện tại.

Phase 1 và Phase 2 hiện đã có closeout evidence cùng validation evidence cho đúng phạm vi được duyệt. Mọi claim tương lai ngoài các phạm vi đó hoặc vượt quá mức evidence đã ghi phải được nói rõ.

## Bảng trạng thái phase

| Phase NCKH | Trạng thái | Hành động tiếp theo |
|---|---|---|
| Phase 0 - Docs baseline | Baseline đã hoàn thành | Giữ AI/VI synced |
| Phase 1 - OAuth + Forms API import | Completed | Giữ nguyên boundary Phase 1 |
| Phase 2 - Model + Variables + Mapping | Completed | Xem `NCKH_PHASE_2_CLOSEOUT.md`; Phase 3 vẫn cần approval |
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

- Implementation NCKH Phase 3+ cho đến khi được approve rõ.
- API contracts, database fields, lifecycle states, hoặc Google scopes mới ngoài Phase 1/2 cho đến khi được review và approve.
- Claim production-readiness cho đến khi chạy validation hiện tại.
