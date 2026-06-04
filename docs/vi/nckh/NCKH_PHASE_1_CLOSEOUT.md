# NCKH_PHASE_1_CLOSEOUT

## Mục đích

Ghi lại snapshot closeout evidence hiện tại cho NCKH Phase 1 mà không nói quá mức về runtime readiness.

## Trạng thái closeout

Trạng thái: Completed.

File này ghi lại scope đã implement, evidence có trong repo, và trạng thái closeout đã được xác nhận cho NCKH Phase 1.

Cập nhật ngày 2026-06-01:

- User đã xác nhận đã test tay cho luồng NCKH Phase 1.
- Phạm vi manual test được chốt rõ trong task này gồm đủ 6 mục: POST /api/v1/nckh/auth/google-link, POST /api/v1/nckh/forms/import, GET /api/v1/nckh/forms, GET /api/v1/nckh/forms/{formId}, /dashboard/nckh, và /dashboard/nckh/callback.

## Tóm tắt

NCKH Phase 1 đã thiết lập baseline backend/frontend ban đầu cho NCKH gồm:

- liên kết Google OAuth để đọc Forms cho NCKH
- import cấu trúc Google Form
- lưu form và câu hỏi đã import
- API list/detail theo user
- dashboard và callback shell tối thiểu ở web app

## Snapshot evidence

- Entity: src/FormAutoHub.Api/Entities/Nckh/ResearchForm.cs, ResearchFormQuestion.cs
- Migration: src/FormAutoHub.Api/Data/Migrations/20260530051057_NckhPhase1_FormsAndOAuth.cs
- Contract: src/FormAutoHub.Api/Contracts/NckhDtos.cs
- Controller: src/FormAutoHub.Api/Controllers/Nckh/ResearchFormsController.cs
- Service: src/FormAutoHub.Api/Services/Nckh/ResearchFormService.cs
- Google integrations: src/FormAutoHub.Api/Integrations/Google/GoogleOAuthService.cs, GoogleFormsApiService.cs
- Frontend routes: apps/web/app/dashboard/nckh/page.tsx, apps/web/app/dashboard/nckh/callback/page.tsx
- Test hiện có: tests/FormAutoHub.Tests/NckhPhase1OAuthAndFormsTests.cs, apps/web/tests/nckh.spec.ts

## Khớp phạm vi

Đã implement trong Phase 1:

- POST /api/v1/nckh/auth/google-link có auth
- POST /api/v1/nckh/forms/import có auth
- GET /api/v1/nckh/forms có auth
- GET /api/v1/nckh/forms/{formId} có auth
- luồng đọc/import Google Forms chỉ dành cho NCKH
- lưu form/câu hỏi đã import
- chặn import trùng theo user/form
- dashboard shell cho luồng liên kết và import/list

Không thuộc Phase 1:

- CRUD research model
- CRUD biến hoặc mapping
- relations/canvas
- Google Forms create/update
- thu thập response từ Google Sheets
- chuẩn hóa/export
- credit/pricing cho NCKH
- admin UI riêng cho NCKH

## Validation đã thực hiện

Verified:

- Đã đọc lại repo evidence cho docs, entity, migration, contract, controller, service, frontend routes, và sự tồn tại của test files.
- Scope Phase 1 trong closeout này khớp với roadmap, ledger, và transition rules hiện tại của NCKH.
- dotnet build FormAutoHub.sln -c Release đã pass.
- dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build đã pass: 104 passed, 0 failed.
- npm run build đã pass trong apps/web, có route dashboard NCKH và callback trong output production build.
- User đã xác nhận manual test vào ngày 2026-06-01 cho đủ 6 mục Phase 1: POST /api/v1/nckh/auth/google-link, POST /api/v1/nckh/forms/import, GET /api/v1/nckh/forms, GET /api/v1/nckh/forms/{formId}, /dashboard/nckh, và /dashboard/nckh/callback.

## Validation chưa thực hiện

Not run:

- apply migration trên database hiện tại

## Rủi ro / khoảng trống còn lại

- Hành vi phụ thuộc Google live có thể đã drift so với snapshot implementation trước đó.

## Deferred vẫn được giữ nguyên

- NCKH Phase 3+ vẫn mặc định chưa được duyệt để triển khai.
- Mọi Google scope mới ngoài read/import path đã duyệt ở Phase 1 vẫn là Deferred cho đến khi được approve rõ.
- Các claim production-hardening ngoài phạm vi Phase 1 đã được xác nhận vẫn là Deferred cho đến khi được approve riêng.

## Quyết định closeout

NCKH Phase 1 giờ đã có closeout evidence rõ trong bộ docs.

NCKH Phase 1 đã hoàn tất cho đúng phạm vi được duyệt.

Closeout evidence hiện tại đã bao gồm repo evidence, kết quả build/test/web build hiện tại, và manual validation do user xác nhận cho đủ 6 mục API/browser trong scope.

## Candidate tiếp theo

Candidate implementation tiếp theo: NCKH Phase 3 - Canvas Relations & Hypothesis.
