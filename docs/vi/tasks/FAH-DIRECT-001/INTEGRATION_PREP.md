# FAH-DIRECT-001 — Chuẩn bị tích hợp chọn lọc

Ngày: 2026-11-02. Trạng thái: **đã chuẩn bị selective staging để review**; chưa commit, push, merge, deploy hoặc phát hành.

## Snapshot và quyền

- Nhánh: `feat/direct-rule-submission`.
- Base và `HEAD` hiện tại: `297ee2143f7a37ca02739157d75e3db06ab4be17`.
- Snapshot review là commit base cộng các file working tree được stage tường minh dưới đây. Không có entry stage từ trước khi bắt đầu chuẩn bị.
- Hành động được cấp quyền: review/staging local có thể đảo ngược. Commit, push, merge, deployment, release, cài đặt, cleanup evidence và cleanup database vẫn chưa được cấp quyền và không được thực hiện.
- Agent chuẩn bị tích hợp: `gpt-5.6-sol`, reasoning `medium`; không agent con và không Astra.

## Manifest stage chính xác

Production backend và đăng ký dịch vụ:

- `src/FormAutoHub.Api/Contracts/Phase3Dtos.cs`
- `src/FormAutoHub.Api/Controllers/SubmissionsController.cs`
- `src/FormAutoHub.Api/Program.cs`
- `src/FormAutoHub.Api/Services/AnswerRuleService.cs`
- `src/FormAutoHub.Api/Services/DirectRuleSubmissionService.cs`
- `src/FormAutoHub.Api/Services/ResponseGenerationService.cs`
- `src/FormAutoHub.Api/Services/SubmissionAdmission.cs`
- `src/FormAutoHub.Api/Services/SubmissionService.cs`

Test backend:

- `tests/FormAutoHub.Tests/DirectRuleSubmissionServiceTests.cs`
- `tests/FormAutoHub.Tests/DirectRuleSubmissionSqlServerTests.cs`

Production và test frontend:

- `apps/web/app/dashboard/forms/page.tsx`
- `apps/web/app/dashboard/forms/_types.ts`
- `apps/web/app/dashboard/forms/_constants.ts`
- `apps/web/app/dashboard/forms/_helpers.ts`
- `apps/web/app/dashboard/forms/_components/WorkflowSummary.tsx`
- `apps/web/app/dashboard/forms/_components/RuleEditor.tsx`
- `apps/web/tests/direct-rule-submission.spec.ts`
- `apps/web/tests/form-automation.spec.ts`
- `apps/web/tests/fah-err-forms-errors.spec.ts`

Tài liệu repository và baseline song ngữ:

- `README.md`
- `AGENTS.md`
- `docs/ai/API_CONTRACT_GUIDE.md`
- `docs/vi/API_CONTRACT_GUIDE.md`
- `docs/ai/ARCHITECTURE_BOUNDARIES.md`
- `docs/vi/ARCHITECTURE_BOUNDARIES.md`

Hồ sơ task song ngữ, chỉ Markdown:

- `docs/ai/tasks/FAH-DIRECT-001/BACKEND.md`
- `docs/ai/tasks/FAH-DIRECT-001/BACKEND_REVIEW.md`
- `docs/ai/tasks/FAH-DIRECT-001/CLOSEOUT.md`
- `docs/ai/tasks/FAH-DIRECT-001/COPY_FIX.md`
- `docs/ai/tasks/FAH-DIRECT-001/COPY_FIX_REVIEW.md`
- `docs/ai/tasks/FAH-DIRECT-001/DOCS_SYNC.md`
- `docs/ai/tasks/FAH-DIRECT-001/FINAL_REVIEW.md`
- `docs/ai/tasks/FAH-DIRECT-001/FRONTEND.md`
- `docs/ai/tasks/FAH-DIRECT-001/FRONTEND_REVIEW.md`
- `docs/ai/tasks/FAH-DIRECT-001/INDEX.md`
- `docs/ai/tasks/FAH-DIRECT-001/INTEGRATION_PREP.md`
- `docs/ai/tasks/FAH-DIRECT-001/RUNTIME.md`
- `docs/ai/tasks/FAH-DIRECT-001/VISUAL_REPORT.md`
- `docs/ai/tasks/FAH-DIRECT-001/VISUAL_RUNTIME.md`
- `docs/ai/tasks/FAH-DIRECT-001/VISUAL_SUITES.md`
- `docs/vi/tasks/FAH-DIRECT-001/BACKEND.md`
- `docs/vi/tasks/FAH-DIRECT-001/BACKEND_REVIEW.md`
- `docs/vi/tasks/FAH-DIRECT-001/CLOSEOUT.md`
- `docs/vi/tasks/FAH-DIRECT-001/COPY_FIX.md`
- `docs/vi/tasks/FAH-DIRECT-001/COPY_FIX_REVIEW.md`
- `docs/vi/tasks/FAH-DIRECT-001/DOCS_SYNC.md`
- `docs/vi/tasks/FAH-DIRECT-001/FINAL_REVIEW.md`
- `docs/vi/tasks/FAH-DIRECT-001/FRONTEND.md`
- `docs/vi/tasks/FAH-DIRECT-001/FRONTEND_REVIEW.md`
- `docs/vi/tasks/FAH-DIRECT-001/INDEX.md`
- `docs/vi/tasks/FAH-DIRECT-001/INTEGRATION_PREP.md`
- `docs/vi/tasks/FAH-DIRECT-001/RUNTIME.md`
- `docs/vi/tasks/FAH-DIRECT-001/VISUAL_REPORT.md`
- `docs/vi/tasks/FAH-DIRECT-001/VISUAL_RUNTIME.md`
- `docs/vi/tasks/FAH-DIRECT-001/VISUAL_SUITES.md`

## Loại trừ tường minh và bảo toàn

- Loại toàn bộ file dưới `artifacts/reports/`. Inventory untracked có 244 path tại đây, gồm evidence runtime/browser và build output được sao chép; chúng tiếp tục là evidence local.
- Loại toàn bộ file dưới `src/FormAutoHub.Api/artifacts/`. Inventory untracked có 148 path tại đây, chủ yếu là runtime build output do task sở hữu; chúng tiếp tục là evidence local.
- Build output ignored, key/config/session local, ảnh/screenshot/snapshot, workspace tạm và test result tiếp tục bị loại và được bảo toàn. Inventory ignored có 83.280 path khi bắt đầu chuẩn bị; số đếm này là bằng chứng inventory, không phải mục tiêu cleanup.
- Scan độ tin cậy cao phát hiện một match dạng token trong harness cũ, không liên quan task, dưới `artifacts/reports/error-remediation-2026-10-30/`. Giá trị không được in hoặc sao chép. File không được stage hay sửa và chỉ cần owner xem xét cấu hình local nếu công việc tách biệt đó được cấp quyền sau này.
- Không đổi `.gitignore`, không dùng `git add` diện rộng, reset, xóa, sửa artifact hoặc cleanup evidence.

## Bằng chứng an toàn và freeze

- Scan pattern bí mật độ tin cậy cao trên toàn bộ manifest source/test/tài liệu ứng viên: không có path khớp.
- Scan độ tin cậy cao trên evidence `direct-rules*` bị loại và `src/FormAutoHub.Api/artifacts/`: không có path khớp.
- Ba hash copy-fix khớp `COPY_FIX_REVIEW.md`: `page.tsx` `5B6ADDF2...B5CB3`, `RuleEditor.tsx` `0AE4E80A...5115` và `direct-rule-submission.spec.ts` `32FB4255...FD8E`.
- 22 entry còn lại từ freeze 24 file của final review trước khớp chính xác. Việc này giữ nguyên backend, test, quy tắc repository, file/spec hỗ trợ frontend và contract API/architecture song ngữ đã review độc lập.
- GUID tổng hợp và identifier fixture trong test/evidence không được xem là credential.

## Nguồn gốc validation được tái sử dụng

- Không file source/test nào đổi sau freeze copy-fix được chấp nhận độc lập, nên không lặp lại suite nặng chỉ để chuẩn bị staging.
- Bằng chứng backend: focused 58/58, không skipped, gồm 20 ca SQL; broad trước đó 315 pass với 12 SQL-method skip đã ghi; build Release pass.
- Bằng chứng frontend: Playwright affected 35/35 sau copy fix; lint và production build exit 0; browser mock runtime ghi 32/32 chunk HTTP 200 và không console/page error.
- Bằng chứng runtime: kiểm tra API có auth/SQL cô lập/loopback do task sở hữu pass với assertion persistence và log cuối; các port sở hữu đã giải phóng. Không gọi Google, AI trả phí, production, deployment hoặc release.
- Review độc lập backend, frontend, final và copy-fix không tìm thấy finding Critical/Important chưa xử lý trên snapshot bất biến tương ứng.

## Bản nháp commit và PR cục bộ

Commit message đề xuất:

`feat(forms): add direct rule generation and submission`

Mô tả PR đề xuất:

> Triển khai workflow Rules Option 1 đã duyệt bằng một thao tác tạo-và-gửi, đồng thời giữ AI preview và xác nhận rõ. Bổ sung admission direct command first-call-wins, an toàn gửi tuần tự dùng chung, credit/usage/submission logging, coverage concurrency SQL, recovery command frontend và contract/evidence task song ngữ. Validation gồm test backend/SQL tập trung, các suite Playwright bị ảnh hưởng, build, runtime API/SQL/loopback local an toàn, kiểm tra browser hydration/chunk và các review độc lập. Không chạy Google live, AI trả phí, production deployment hoặc release.

Bản nháp chỉ nằm trong tài liệu local; không tạo commit hoặc PR.
