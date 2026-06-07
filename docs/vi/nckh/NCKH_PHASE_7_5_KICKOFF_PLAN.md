# NCKH_PHASE_7_5_KICKOFF_PLAN

## Mục đích

Định nghĩa follow-up sửa lỗi và live validation NCKH Phase 7.5 sau khi Phase 7 frontend expansion phát hiện các blocker về Google consent và live dataset.

## Trạng thái duyệt

Trạng thái: **Đã approve và đang mở như một fix/validation follow-up**.

User đã approve Phase 7.5 để xử lý các blocker phát hiện trong live browser smoke với tài khoản `doba2311@gmail.com`.

Đây không phải phase thêm feature mới. Đây là follow-up hẹp để các surface đã hoàn tất ở Phase 4, Phase 5, Phase 6, và Phase 7 chạy được qua luồng browser/full-stack thật khi cần Google consent và dữ liệu live.

## Evidence baseline

Live browser smoke với form NCKH đã import xác minh:

- đăng nhập bằng `doba2311@gmail.com`
- mở được NCKH dashboard
- form đã import `Untitled Form` load được với 11 câu hỏi
- tạo model mới qua UI
- tạo biến qua UI
- tạo observed question mapping qua UI
- tạo canvas relation qua UI
- lưu default node positions qua UI
- activate model từ `Draft` sang `Active`

Blocker đã quan sát:

- `POST /api/v1/nckh/models/{modelId}/generate-form` trả `403` từ browser flow, cho thấy thiếu Google Forms body write consent hoặc quyền write tương đương.
- `POST /api/v1/nckh/models/{modelId}/collect` trả `403` với detail: `Google Forms response read scope is required. Please re-consent with Forms responses permission.`
- `GET /api/v1/nckh/models/{modelId}/export?format=csv|codebook|spss` trả `409` với detail: `At least one normalized dataset row is required before export.`

## Scope được duyệt

Phase 7.5 bao gồm:

- kiểm tra Google OAuth scope request của NCKH ở frontend
- đảm bảo luồng Google link/re-consent yêu cầu đúng các scope đã duyệt cho behavior Phase 4 và Phase 5 hiện có
- re-consent tài khoản live qua browser flow
- test lại `generate-form` bằng Google credential thật có write consent
- test lại `collect` bằng Google credential thật có `https://www.googleapis.com/auth/forms.responses.readonly`
- yêu cầu có ít nhất một submitted Google Form response trước khi claim export readiness
- chạy `collect -> normalize -> export csv/codebook/spss` qua browser/full-stack flow
- ghi nhận kết quả bằng `Verified`, `Not run`, và `Blocked`

## Ranh giới scope

Không thêm:

- endpoint NCKH mới
- DTO fields, database fields, statuses, lifecycle states, hoặc migrations mới trừ khi có defect riêng chứng minh cần thiết và được approve rõ
- Google Sheets response collection
- Google Forms watches hoặc Cloud Pub/Sub
- scheduled collection jobs
- statistical analysis, charting, hoặc generated research reports
- admin UI riêng cho NCKH
- credit/pricing cho NCKH
- fake responses hoặc seeded data để làm evidence cho live Google closeout

Fix Phase 7.5 không được bypass Google scope guards. Nếu thiếu Google consent, hành vi đúng vẫn là `Blocked` cho đến khi account được re-consent.

## Các pass bắt buộc

### Pass 0 - Kiểm tra scope

Kiểm tra code và config hiện tại cho NCKH OAuth scopes.

File có khả năng liên quan:

- `apps/web/app/dashboard/nckh/page.tsx`
- `apps/web/app/dashboard/nckh/callback/page.tsx`
- `src/FormAutoHub.Api/Services/Nckh/ResearchFormService.cs`
- `src/FormAutoHub.Api/Services/Nckh/ResearchDataService.cs`

Acceptance:

- liệt kê scope đang request
- liệt kê scope backend yêu cầu
- xác định blocker nằm ở frontend OAuth scope, stored token scope, Google account consent, submitted response availability, hay code behavior

### Pass 1 - Sửa scope tối thiểu nếu cần

Nếu OAuth URL chưa request các scope đã duyệt, chỉ cập nhật NCKH Google link scope string và giữ nguyên callback flow hiện có.

Scope target đã duyệt:

- Forms read/import scope đã dùng bởi Phase 1
- Forms body write scope cần cho behavior generate/update Phase 4
- `https://www.googleapis.com/auth/forms.responses.readonly` cần cho response collection Phase 5

Acceptance:

- OAuth URL request các scope đã duyệt
- không thêm Google Sheets, watch, background job, hoặc admin scope không liên quan
- frontend build pass nếu có đổi code

### Pass 2 - Live re-consent

Dùng browser để re-link Google cho tài khoản mục tiêu.

Acceptance:

- Google callback quay về `/dashboard/nckh`
- NCKH dashboard vẫn authenticated
- các lần gọi generate/collect sau đó không còn fail vì thiếu stored Google scope

### Pass 3 - Live generate và collection

Chạy qua browser:

- mở workspace form đã import
- dùng active model có variables và mappings
- chạy `Tạo form từ model`
- đảm bảo có ít nhất một response thật trên Google Form mục tiêu dùng cho collection
- chạy `Thu thập responses`

Acceptance:

- generate-form trả `200`, hoặc Google error còn lại được ghi `Blocked` với status và detail chính xác
- collect trả `200`, hoặc Google error còn lại được ghi `Blocked` với status và detail chính xác

### Pass 4 - Normalize và export

Chạy qua browser:

- `Chuẩn hóa dataset`
- export CSV dataset
- export Excel codebook
- export SPSS syntax

Acceptance:

- normalize trả `200`
- dataset có ít nhất một normalized row trước khi claim export complete
- CSV, codebook, và SPSS export trả `200` và tải file

### Pass 5 - Chuẩn bị closeout

Nếu toàn bộ live checks bắt buộc pass, chuẩn bị closeout docs Phase 7.5 ở cả hai language layers.

Acceptance:

- validation report dùng `Verified`, `Not run`, và `Blocked`
- external blockers còn lại không bị mô tả là completed
- Phase 8 vẫn là candidate full-stack smoke sau này trừ khi được mở rõ

## Validation bắt buộc

Validation tối thiểu sau khi đổi code:

- `npm run build` trong `apps/web` nếu đổi frontend
- targeted browser smoke bằng tài khoản thật
- inspect HTTP statuses thật cho các endpoint NCKH dùng trong browser flow
- chạy regression Playwright NCKH hiện có khi phù hợp: `npx playwright test tests/nckh.spec.ts --workers=1 --reporter=line`

Chỉ cần backend validation nếu có đổi backend code.

## Điều kiện dừng

Dừng và report thay vì mở rộng scope khi:

- không hoàn tất được Google consent
- Google trả provider-side errors ngoài quyền kiểm soát app
- form mục tiêu không có submitted responses và user không thể cung cấp
- export vẫn blocked vì không có normalized dataset row
- fix đòi hỏi API contracts mới, database changes, Google Sheets, scheduled jobs, hoặc statistical-analysis features

