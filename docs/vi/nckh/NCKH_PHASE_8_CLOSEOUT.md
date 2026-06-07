# NCKH_PHASE_8_CLOSEOUT

## Mục đích

Ghi lại closeout evidence cho pass NCKH Phase 8 full-stack smoke validation đã được approve.

## Trạng thái closeout

Trạng thái: **Completed cho scope validation-only đã duyệt**.

Phase 8 đã đóng như một phase validation. Closeout này không thêm behavior sản phẩm, API contracts, DTO fields, database fields, migrations, Google scopes, Google Sheets collection, watches, scheduled jobs, thống kê, admin UI, credit/pricing, hoặc production automation.

Tài liệu này không mở implementation NCKH Phase 9.

## Scope validation

Khu vực đã validate:

- Release backend build.
- Release NCKH backend test subset.
- Next.js web build.
- Full NCKH Playwright regression.
- Restart runtime local cho API và web.
- Authenticated API smoke với Google account thật đã liên kết.
- Chrome UI smoke qua Chrome profile của user, gồm login thật và điều hướng workspace NCKH.
- Kiểm tra endpoint export cho CSV, codebook, và SPSS syntax output.

## Validation đã chạy

Verified:

- `dotnet build FormAutoHub.sln -c Release` đã pass.
- `npm run build` trong `apps/web` đã pass.
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build --filter Nckh` đã pass: 51 passed.
- `npx playwright test tests/nckh.spec.ts --workers=1 --reporter=line` đã pass: 29 passed.
- Local API đã restart tại `http://localhost:5235`.
- Local web đã restart tại `http://localhost:3000`.
- API và web stderr logs rỗng sau smoke.
- API login đã pass cho `doba2311@gmail.com`.
- Profile hiển thị `googleLinked: true` và `googleEmail: doba2311@gmail.com`.

Verified live API smoke trên model `6665dd7f-c1cc-42f8-ba84-13c85eb29974`:

- `POST /api/v1/nckh/models/{modelId}/generate-form` với `{ "action": "Update" }` trả `200 OK`, `questionsCreated: 1`, và `reimported: true`.
- `POST /api/v1/nckh/models/{modelId}/collect` trả `200 OK`, `responsesCollected: 0`, `responsesSkipped: 541`, và `status: Success`.
- `POST /api/v1/nckh/models/{modelId}/normalize` trả `200 OK`, `respondentsProcessed: 541`, `variablesComputed: 1`, `missingDataCount: 1`, và `staleDatasetsMarked: 0`.
- `GET /api/v1/nckh/models/{modelId}/responses?page=1&pageSize=5` trả `200 OK` với `totalItems: 541`.
- `GET /api/v1/nckh/models/{modelId}/dataset?page=1&pageSize=5` trả `200 OK`, `totalItems: 541`, `hasStaleData: false`, và columns gồm `RespondentId`, `OBS2248`, và `SAT2248_mean`.
- CSV export trả `200 OK`, `text/csv`, và body không rỗng.
- Codebook export trả `200 OK`, `.xlsx`, và body không rỗng.
- SPSS syntax export trả `200 OK`, `text/plain`, và có SPSS syntax header đúng kỳ vọng.

Verified Chrome UI smoke:

- Chrome automation hoạt động sau khi đóng trạng thái Chrome/extension xung đột và dọn các Playwright Chromium process còn sót.
- Browser mở `http://localhost:3000/login`.
- Login bằng `doba2311@gmail.com` vào được `/dashboard`.
- `/dashboard/nckh` render user `Tuấn`, trạng thái Google đã liên kết, và 6 imported forms.
- Mở `Untitled Form` vào được `/dashboard/nckh/forms/4974389e-47f0-4831-adc5-fa1c38b55039`.
- Workspace render model `NCKH smoke 20260605102248` và `28 câu hỏi` sau live generate/update.
- Đã click và verify các tab biến, ánh xạ, quan hệ/giả thuyết, tạo form, và export markers.

## Validation chưa hoàn tất

Not run:

- Chạy SPSS syntax đã generate bằng ứng dụng SPSS thật.
- Production large-dataset streaming/performance validation.
- Google Sheets response collection, vì Google Sheets vẫn nằm ngoài scope NCKH đã duyệt trừ khi được chọn riêng sau này.
- Watches, Pub/Sub, scheduled jobs, statistical reports, NCKH admin UI, và NCKH credit/pricing.

Blocked:

- Không có blocker cho scope closeout validation-only Phase 8 đã duyệt.

## Scope alignment

Giữ trong scope:

- Full-stack validation trên behavior NCKH Phase 1-7.5 đã được duyệt.
- Browser và API smoke với Google account thật đã liên kết.
- Xác minh endpoint export từ scope backend Phase 6 đã completed.
- Chẩn đoán Chrome automation chỉ để gỡ blocker UI smoke user-visible.

Giữ ngoài scope:

- backend endpoints mới
- DTO fields mới
- database fields hoặc migrations mới
- Google OAuth scopes mới
- Google Sheets collection
- watches, Pub/Sub, scheduled jobs, hoặc background workers
- statistical analysis, charting, generated reports, hoặc SPSS execution
- NCKH admin UI
- NCKH credit/pricing
- abuse automation, fake accounts, captcha bypass, proxy rotation, hoặc unauthorized form submission

## Rủi ro còn lại

- SPSS syntax đã export và kiểm tra dạng text, nhưng chưa chạy bằng SPSS thật.
- Live dataset smoke dùng linked account và dữ liệu form/model hiện có; đây không phải benchmark production scale/performance.
- Chrome automation ban đầu fail khi có extension UI/trạng thái Chrome xung đột; pass cuối thành công sau khi đóng hẳn Chrome và dọn Playwright Chromium processes còn sót.
- Một attempt capture đầu có thể đã gọi generate/update trước lần rerun cuối; trạng thái cuối đã verify vẫn pass với form/model đã ghi nhận.

## Quyết định closeout

NCKH Phase 8 là **Completed** cho scope validation-only đã duyệt.

Không còn P0/P1 blocker trong scope full-stack smoke validation Phase 8 đã duyệt dựa trên evidence build, test, API, Playwright, và Chrome UI đã ghi.

## Trạng thái sau đó

NCKH Phase 9 sau đó đã completed cho scope canvas UX frontend-only Option A đã duyệt. Xem `NCKH_PHASE_9_CLOSEOUT.md`.
