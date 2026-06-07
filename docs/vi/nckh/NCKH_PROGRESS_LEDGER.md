# NCKH_PROGRESS_LEDGER

## Mục đích

Ghi lại trạng thái tiến trình có evidence trong repo cho NCKH Survey Platform để các lần làm sau bắt đầu từ repo truth thay vì wording roadmap đã cũ.

Đây là tài liệu trạng thái NCKH đầu tiên cần đọc sau `README.md`, `AGENTS.md`, và `docs/ai/AI_DOC_ROUTING_MATRIX.md`.

## Trạng thái hiện tại

Trạng thái global FormAuto Hub: Phase 9 closeout đã hoàn tất; chưa chọn global phase tiếp theo.

Trạng thái NCKH: Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6, Phase 7, Phase 7.5, Phase 8, và Phase 9 đã hoàn tất cho đúng phạm vi được duyệt. Phase 8 chỉ là validation-only và không thêm behavior sản phẩm mới. Phase 9 là frontend-only Option A và không thêm backend contracts hoặc canvas dependencies.

Follow-up NCKH đang active: **không có**.

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
| Entity Phase 3 | `src/FormAutoHub.Api/Entities/Nckh/ModelRelation.cs`, `NodePosition.cs` | Đã implement |
| Migration Phase 3 | `src/FormAutoHub.Api/Data/Migrations/20260604131107_NckhPhase3_CanvasRelations.cs` | Đã implement và đã apply trong validation |
| API Phase 3 | `src/FormAutoHub.Api/Controllers/Nckh/ResearchCanvasController.cs` | Đã implement |
| Service Phase 3 | `src/FormAutoHub.Api/Services/Nckh/ResearchCanvasService.cs`, `ResearchFormService.cs` | Đã implement |
| Test Phase 3 | `tests/FormAutoHub.Tests/NckhPhase3PersistenceTests.cs`, `NckhPhase3CanvasServiceTests.cs` | Test pass trong validation mới nhất |
| Closeout Phase 3 | `docs/ai/nckh/NCKH_PHASE_3_CLOSEOUT.md`, `docs/vi/nckh/NCKH_PHASE_3_CLOSEOUT.md` | Completed với runtime validation |
| API Phase 4 | `src/FormAutoHub.Api/Controllers/Nckh/ResearchFormsController.cs` | Đã implement |
| Service/integration Phase 4 | `src/FormAutoHub.Api/Services/Nckh/ResearchFormService.cs`, `src/FormAutoHub.Api/Integrations/Google/GoogleFormsApiService.cs` | Đã implement |
| Migration Phase 4 | `src/FormAutoHub.Api/Data/Migrations/20260604165518_NckhPhase4_FormGenerationTracking.cs` | Đã implement và đã apply trong validation |
| Test Phase 4 | `tests/FormAutoHub.Tests/NckhPhase4FormGenerationServiceTests.cs` | Test pass trong validation mới nhất |
| Closeout Phase 4 | `docs/ai/nckh/NCKH_PHASE_4_CLOSEOUT.md`, `docs/vi/nckh/NCKH_PHASE_4_CLOSEOUT.md` | Completed với local runtime validation; live Google smoke bị blocked |
| API Phase 5 | `src/FormAutoHub.Api/Controllers/Nckh/ResearchDataController.cs` | Đã implement |
| Service/integration Phase 5 | `src/FormAutoHub.Api/Services/Nckh/ResearchDataService.cs`, `src/FormAutoHub.Api/Integrations/Google/GoogleFormsApiService.cs` | Đã implement |
| Entity Phase 5 | `src/FormAutoHub.Api/Entities/Nckh/SurveyResponse.cs`, `NormalizedDataset.cs`, `DataCollectionLog.cs` | Đã implement |
| Migration Phase 5 | `src/FormAutoHub.Api/Data/Migrations/20260604211823_NckhPhase5_DataCollectionNormalization.cs` | Đã implement và đã apply trong validation |
| Test Phase 5 | `tests/FormAutoHub.Tests/NckhPhase5DataServiceTests.cs` | Test pass trong validation mới nhất |
| Closeout Phase 5 | `docs/ai/nckh/NCKH_PHASE_5_CLOSEOUT.md`, `docs/vi/nckh/NCKH_PHASE_5_CLOSEOUT.md` | Completed với local runtime validation; live Google response-read smoke bị blocked |
| Planning Phase 6 | `docs/ai/nckh/NCKH_PHASE_6_KICKOFF_PLAN.md`, `docs/ai/nckh/NCKH_PHASE_6_CONTRACT_DB_FREEZE.md`, `docs/ai/nckh/NCKH_PHASE_6_SINGLE_APPROVAL_PACKET.md` | Baseline đã approve và đã dùng để implement |
| API/service Phase 6 | `src/FormAutoHub.Api/Controllers/Nckh/ResearchDataController.cs`, `src/FormAutoHub.Api/Services/Nckh/ResearchExportService.cs`, `src/FormAutoHub.Api/Contracts/NckhDtos.cs` | Đã implement |
| Test Phase 6 | `tests/FormAutoHub.Tests/NckhPhase6ExportServiceTests.cs` | Test pass trong validation mới nhất |
| Closeout Phase 6 | `docs/ai/nckh/NCKH_PHASE_6_CLOSEOUT.md`, `docs/vi/nckh/NCKH_PHASE_6_CLOSEOUT.md` | Completed với local runtime validation |
| Planning Phase 7 | `docs/ai/nckh/NCKH_PHASE_7_KICKOFF_PLAN.md`, `NCKH_PHASE_7_CONTRACT_UI_FREEZE.md`, `NCKH_PHASE_7_SINGLE_APPROVAL_PACKET.md` | Đã chuẩn bị; implementation cần approval rõ |
| Frontend Phase 7 | `apps/web/app/dashboard/nckh/forms/[formId]/page.tsx`, `apps/web/lib/api.ts`, `apps/web/tests/nckh.spec.ts` | Đã implement và browser-smoke validated |
| Closeout Phase 7 | `docs/ai/nckh/NCKH_PHASE_7_CLOSEOUT.md`, `docs/vi/nckh/NCKH_PHASE_7_CLOSEOUT.md` | Completed với frontend build và Playwright validation |
| Kickoff Phase 7.5 | `docs/ai/nckh/NCKH_PHASE_7_5_KICKOFF_PLAN.md`, `docs/vi/nckh/NCKH_PHASE_7_5_KICKOFF_PLAN.md` | Baseline đã approve và đã dùng cho follow-up Phase 7.5 đã completed |
| Closeout Phase 7.5 | `docs/ai/nckh/NCKH_PHASE_7_5_CLOSEOUT.md`, `docs/vi/nckh/NCKH_PHASE_7_5_CLOSEOUT.md` | Completed với source/build/targeted Playwright validation và user-confirmed live Google validation |
| Closeout Phase 8 | `docs/ai/nckh/NCKH_PHASE_8_CLOSEOUT.md`, `docs/vi/nckh/NCKH_PHASE_8_CLOSEOUT.md` | Completed với Release build, backend NCKH tests, full Playwright NCKH regression, authenticated live API smoke, và Chrome UI smoke dùng linked Google account |
| Closeout Phase 9 | `docs/ai/nckh/NCKH_PHASE_9_CLOSEOUT.md`, `docs/vi/nckh/NCKH_PHASE_9_CLOSEOUT.md` | Completed với visual canvas frontend-only Option A, targeted Playwright validation, và desktop/mobile browser smoke |

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

Đã implement trong evidence Phase 3:

- quan hệ model
- node/canvas positions
- deterministic hypothesis output

Đã implement trong evidence Phase 4:

- backend endpoint `POST /api/v1/nckh/models/{modelId}/generate-form`
- Google Forms write-scope guard dùng OAuth scopes đã lưu
- Google Forms API create và batch-update create-item integration methods
- generated-form tracking fields trên `ResearchForms`
- re-import/upsert cấu trúc form generated hoặc updated sau khi Google write thành công
- sinh câu hỏi bảo thủ từ observed mappings và form questions hiện có

Đã implement trong evidence Phase 5:

- backend endpoint `POST /api/v1/nckh/models/{modelId}/collect`
- backend endpoint `GET /api/v1/nckh/models/{modelId}/responses`
- backend endpoint `POST /api/v1/nckh/models/{modelId}/normalize`
- backend endpoint `GET /api/v1/nckh/models/{modelId}/dataset`
- Google Forms response-read scope guard dùng OAuth scopes đã lưu
- lưu raw survey response và collection logs
- normalized datasets có expose stale state
- đánh dấu dataset stale khi biến hoặc mapping thay đổi

Đã implement trong evidence Phase 6:

- backend endpoint `GET /api/v1/nckh/models/{modelId}/export?format=csv|codebook|spss`
- export CSV từ normalized dataset rows
- export Excel `.xlsx` codebook với sheets `Variables`, `Mappings`, và `Notes`
- export SPSS `.sps` import syntax
- conflict behavior khi export normalized dataset stale
- không thêm database tables, columns, migrations, export jobs, hoặc export history

Đã implement trong evidence Phase 7:

- frontend workspace route `/dashboard/nckh/forms/{formId}`
- model workspace tabs cho overview, variables, mapping, canvas, generate form, data, và export
- frontend UI trên các API backend Phase 1-6 hiện có
- quản lý canvas dạng table/list, không thêm frontend dependency
- action export CSV, codebook, và SPSS nối tới endpoint export hiện có

Chưa implement trong evidence Phase 1/2/3/4/5/6/7:

- thu thập response từ Google Sheets
- admin UI riêng cho NCKH
- credit/pricing cho NCKH

## Trạng thái validation

Verified trong pass tài liệu và validation mới nhất:

- Đã scan repo files cho NCKH docs, entities, controller/service/contracts, migration, frontend routes, và tests.
- dotnet build FormAutoHub.sln -c Release đã pass cho slice backend NCKH Phase 4 hiện tại.
- dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build đã pass: 133 passed, 0 failed.
- EF Core database update đã apply `20260604165518_NckhPhase4_FormGenerationTracking` vào temporary LocalDB database `FormAutoHubNckhPhase4Smoke2`.
- Authenticated HTTP smoke đã pass trên `http://127.0.0.1:5103` với JWT thật cho behavior thiếu write-scope của `POST /api/v1/nckh/models/{modelId}/generate-form`.
- Các smoke database NCKH Phase 4 đã được drop và API process đã được dừng sau validation.
- dotnet build FormAutoHub.sln -c Release đã pass cho slice backend NCKH Phase 5 hiện tại.
- dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build đã pass: 137 passed, 0 failed.
- EF Core database update đã apply `20260604211823_NckhPhase5_DataCollectionNormalization` vào temporary LocalDB database `FormAutoHubNckhPhase5Smoke1`.
- Authenticated HTTP smoke đã pass trên `http://localhost:5235` với JWT thật cho các endpoint Phase 5 collect, responses, normalize, và dataset.
- Runtime smoke xác minh thiếu `forms.responses.readonly` trả `403 Forbidden`; responses, normalize, và dataset trả `200 OK` với seeded DB-backed data.
- API smoke process NCKH Phase 5 đã được dừng sau validation.
- dotnet build FormAutoHub.sln -c Release đã pass cho slice backend NCKH Phase 6 hiện tại.
- dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build đã pass: 142 passed, 0 failed.
- EF Core database update đã apply migrations hiện có đến Phase 5 vào temporary LocalDB database `FormAutoHubNckhPhase6Smoke2`; không tạo migration Phase 6.
- Authenticated HTTP smoke đã pass trên `http://127.0.0.1:5237` với JWT thật cho behavior export CSV, codebook, SPSS, và stale-conflict của Phase 6.
- Runtime smoke xác minh CSV export, codebook export, và SPSS export trả `200 OK` với content type, attachment filename đúng, và body không rỗng; SPSS syntax có `GET DATA` và không có `EXECUTE`.
- Runtime smoke xác minh export khi normalized dataset stale trả `409 Conflict`.
- Smoke database NCKH Phase 6 đã được drop, smoke files đã xóa, và API process đã dừng sau validation.
- `npm run build` trong `apps/web` đã pass cho frontend slice NCKH Phase 7.
- `npx playwright test tests/nckh.spec.ts -g "Phase 7 Workspace" --workers=1 --reporter=line` đã pass: 3 passed.
- `npx playwright test tests/nckh.spec.ts --workers=1 --reporter=json` đã pass: 26 passed, 0 failed.
- Browser smoke Phase 7 xác minh `/dashboard/nckh/forms/{formId}`, model tabs, variables tab, và export actions với mocked authenticated NCKH APIs.

- User đã xác nhận manual test cho luồng NCKH Phase 1 vào ngày 2026-06-01 cho đủ 6 mục: POST /api/v1/nckh/auth/google-link, POST /api/v1/nckh/forms/import, GET /api/v1/nckh/forms, GET /api/v1/nckh/forms/{formId}, /dashboard/nckh, và /dashboard/nckh/callback.

Not run trong pass tài liệu và validation mới nhất:

- Playwright smoke cho frontend NCKH Phase 4, vì Phase 4 là backend-only và không implement frontend scope.
- live Google Forms create/update smoke với Forms body write scope, vì môi trường này không có Google OAuth credential/write-consented account thật.
- frontend build trong pass closeout Phase 4, vì không có file frontend nào thay đổi trong scope Phase 4 hiện tại.
- live Google Forms response collection smoke với Forms response-read scope, vì môi trường này không có Google OAuth credential thật, response-read consent, và submitted responses.
- frontend build trong pass closeout Phase 5, vì không có file frontend nào thay đổi trong scope Phase 5 hiện tại.
- frontend build và Playwright smoke trong pass closeout Phase 6, vì Phase 6 backend-only và không đổi frontend file.
- SPSS execution trong pass closeout Phase 6, vì Phase 6 chỉ sinh import syntax và automatic SPSS execution vẫn Deferred.
- production large-dataset performance/streaming validation trong pass closeout Phase 6, vì MVP export implementation generate file in memory.
- live Google Forms write/read smoke trong pass closeout Phase 7, vì validation frontend Phase 7 dùng mocked APIs và môi trường này không có Google credentials thật, write/read consent, hoặc submitted responses.
- real binary export download với live normalized dataset trong pass closeout Phase 7, vì browser smoke dùng mocked API responses.

Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6, và Phase 7 hiện đã có closeout evidence cùng validation evidence cho đúng phạm vi được duyệt. Mọi claim tương lai ngoài các phạm vi đó hoặc vượt quá mức evidence đã ghi phải được nói rõ.

Evidence live browser mới nhất cho Phase 7.5:

- Verified với tài khoản `doba2311@gmail.com`: login, NCKH dashboard, form đã import `Untitled Form`, tạo model, tạo biến, tạo observed mapping, tạo canvas relation, lưu default node positions, và activate model từ `Draft` sang `Active`.
- Blocked: `generate-form` trả `403` trong browser flow vì chưa có Google Forms body write consent/scope.
- Blocked: `collect` trả `403` với detail `Google Forms response read scope is required. Please re-consent with Forms responses permission.`
- Blocked: export CSV/codebook/SPSS trả `409` với detail `At least one normalized dataset row is required before export.` vì collection bị blocked và chưa có live normalized dataset row.

Closeout evidence Phase 7.5 mới nhất:

- Verified: frontend OAuth request hiện tại có `forms.body.readonly`, `forms.body`, `forms.responses.readonly`, và `userinfo.email`.
- Verified: frontend OAuth request hiện tại dùng `prompt=consent`.
- Verified: backend guard vẫn yêu cầu Forms body write scope cho generation và Forms responses read scope cho collection.
- Verified: `npm run build` trong `apps/web` đã pass.
- Verified: `npx playwright test tests/nckh.spec.ts -g "Phase 7 Workspace" --workers=1 --reporter=line` đã pass: 3 passed.
- Verified: user xác nhận ngày 2026-06-05 rằng live Google re-consent và live `generate -> collect -> normalize -> export` hoạt động qua app.
- Not run: full `npx playwright test tests/nckh.spec.ts --workers=1 --reporter=line` không hoàn tất trong command timeout 120 giây.
- Blocked: không còn blocker được báo lại cho scope Phase 7.5 đã duyệt sau user-confirmed live validation.

Evidence validation mới nhất cho NCKH Phase 8:

- Đã sửa: workspace NCKH không còn luôn gửi `action: "Create"` cho `POST /api/v1/nckh/models/{modelId}/generate-form`.
- Đã implement: `NckhResearchModelResponse.hasGeneratedForm` cho biết model đã có generated form hay chưa.
- Hành vi UI: khi `hasGeneratedForm` là `false`, panel generate gửi `action: "Create"`; khi `hasGeneratedForm` là `true`, UI hiển thị `Cập nhật form từ mô hình` và gửi `action: "Update"`.
- Nội dung giao diện: cảnh báo quyền ghi Google đã được rút gọn bằng thông báo tiếng Việt hướng người dùng, không lộ thuật ngữ backend/scope/403.
- Verified: `dotnet build FormAutoHub.sln -c Release` đã pass.
- Verified: `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build --filter Nckh` đã pass: 51 passed.
- Verified: `npm run build` trong `apps/web` đã pass.
- Verified: `npx playwright test tests/nckh.spec.ts --workers=1 --reporter=line` đã pass: 29 passed.
- Verified: local API và web servers đã được restart cho runtime smoke tại `http://localhost:5235` và `http://localhost:3000`.
- Verified với linked account `doba2311@gmail.com`: profile có `googleLinked: true` và Google email `doba2311@gmail.com`.
- Verified live API smoke cho model `6665dd7f-c1cc-42f8-ba84-13c85eb29974`: generate/update trả `200 OK` với `questionsCreated: 1` và `reimported: true`; collect trả `200 OK` với `responsesSkipped: 541`; normalize trả `200 OK` với `respondentsProcessed: 541`, `variablesComputed: 1`, và `missingDataCount: 1`; endpoints list responses và dataset trả `totalItems: 541`; CSV, codebook, và SPSS exports trả `200 OK` với content không rỗng đúng kỳ vọng.
- Verified Chrome UI smoke qua Chrome profile của user sau khi dọn trạng thái extension/automation xung đột: login, dashboard NCKH, trạng thái Google đã liên kết, workspace form đã import, model generated, và các tab biến, ánh xạ, quan hệ, tạo form, export render/click được.
- Not run: chạy file syntax export bằng ứng dụng SPSS thật.
- Not run: production large-dataset streaming/performance validation.

Closeout evidence Phase 9 mới nhất:

- Đã implement: lớp visual canvas trong tab `Sơ đồ quan hệ` dùng dữ liệu API biến, quan hệ, và vị trí hiện có.
- Đã implement: relation edges, variable nodes, relation marker nodes, vùng status/save, contextual relation actions, và bảng quan hệ fallback.
- Quyết định: Option A; không thêm React Flow hoặc canvas dependency khác.
- Verified: `npm run build` trong `apps/web` đã pass.
- Verified: `npx playwright test tests/nckh.spec.ts -g "visual canvas" --workers=1 --reporter=json` đã pass: 1 passed.
- Verified: `npx playwright test tests/nckh.spec.ts -g "Phase 7 Workspace" --workers=1 --reporter=json` đã pass: 6 passed.
- Verified: desktop và mobile browser smoke render được `SER -> SAT` với `pageErrors=0`; screenshots đã lưu trong `apps/web/test-results/phase9-canvas-smoke/`.
- Not run: backend build/test vì Phase 9 không đổi backend code.
- Not run: drag-and-drop node editing vì Option A không thêm canvas editing dependency.

## Bảng trạng thái phase

| Phase NCKH | Trạng thái | Hành động tiếp theo |
|---|---|---|
| Phase 0 - Docs baseline | Baseline đã hoàn thành | Giữ AI/VI synced |
| Phase 1 - OAuth + Forms API import | Completed | Giữ nguyên boundary Phase 1 |
| Phase 2 - Model + Variables + Mapping | Completed | Xem `NCKH_PHASE_2_CLOSEOUT.md`; giữ boundary Phase 2 |
| Phase 3 - Canvas Relations | Completed | Xem `NCKH_PHASE_3_CLOSEOUT.md`; giữ boundary backend-only |
| Phase 4 - Form Generation | Completed | Xem `NCKH_PHASE_4_CLOSEOUT.md`; live Google write smoke vẫn blocked đến khi có credentials/scope |
| Phase 5 - Data Collection + Normalization | Completed | Xem `NCKH_PHASE_5_CLOSEOUT.md`; live Google response-read smoke vẫn blocked đến khi có credentials/scope/submitted responses |
| Phase 6 - Export | Completed | Xem `NCKH_PHASE_6_CLOSEOUT.md`; không thêm DB migration |
| Phase 7 - Frontend expansion | Completed | Xem `NCKH_PHASE_7_CLOSEOUT.md`; blocker live Google/full-stack chuyển sang Phase 7.5 |
| Phase 7.5 - Sửa/validate Google consent và live dataset | Completed | Xem `NCKH_PHASE_7_5_CLOSEOUT.md`; live Google validation đã được user xác nhận ngày 2026-06-05 |
| Phase 8 - Full-stack smoke validation | Completed | Xem `NCKH_PHASE_8_CLOSEOUT.md`; scope validation-only đã completed với live API và Chrome UI smoke |
| Phase 9 - Canvas UX completion và workflow polish | Completed | Xem `NCKH_PHASE_9_CLOSEOUT.md`; frontend-only Option A đã completed, không đổi backend hoặc dependency |

## Quy tắc sync

- Khi sửa file này, sửa `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md` trong cùng task.
- Khi phase state thay đổi, cập nhật `NCKH_PHASE_ROADMAP.md` và `NCKH_PHASE_TRANSITION_GUIDE.md` ở cả hai language layers.
- Không đánh dấu phase completed nếu thiếu source/test/runtime evidence.
- Dùng `Implemented with repo evidence` khi code tồn tại nhưng chưa chạy lại runtime validation hiện tại.
- Chỉ dùng `Completed` khi phase có closeout evidence và validation bắt buộc đã được chạy.

## Deferred

- API contracts, database fields, lifecycle states, hoặc Google scopes ngoài packet Phase 6 đã chấp nhận và implementation Phase 6 đã hoàn tất cho đến khi được review và approve.
- Claim production-readiness cho đến khi chạy validation hiện tại.
