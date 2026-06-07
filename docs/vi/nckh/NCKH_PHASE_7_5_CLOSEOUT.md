# NCKH_PHASE_7_5_CLOSEOUT

## Mục đích

Ghi lại closeout evidence cho follow-up NCKH Phase 7.5 đã approve về Google consent và live dataset fix/validation.

## Trạng thái closeout

Trạng thái: **Completed với user-confirmed live Google validation**.

Phase 7.5 đã đóng cho đúng scope fix/validation được duyệt.

Live Google flow đã được user xác nhận vào ngày 2026-06-05 sau khi tự manual test. Closeout này tách rõ evidence live do user xác nhận với validation do agent trực tiếp chạy bằng tool.

Tài liệu này không mở implementation Phase 8 hoặc Phase 9.

## Phần đã hoàn tất

Verified từ kiểm tra code hiện tại:

- URL Google OAuth của frontend NCKH đang request các scope đã approve cần cho behavior Phase 1, Phase 4, và Phase 5 hiện có:
  - `https://www.googleapis.com/auth/forms.body.readonly`
  - `https://www.googleapis.com/auth/forms.body`
  - `https://www.googleapis.com/auth/forms.responses.readonly`
  - `https://www.googleapis.com/auth/userinfo.email`
- OAuth request dùng `prompt=consent`, nên flow re-consent có thể request bộ scope đã cập nhật.
- Backend Phase 4 form generation vẫn guard stored Google token scopes bằng Forms body write scope.
- Backend Phase 5 collection vẫn guard stored Google token scopes bằng `https://www.googleapis.com/auth/forms.responses.readonly`.
- Không thêm backend API, DTO, database, status, lifecycle, Google Sheets, watch, scheduled job, admin, credit, hoặc pricing scope trong closeout attempt này.

User-confirmed live validation ngày 2026-06-05:

- Live Google re-consent hoạt động với các scope NCKH bắt buộc.
- Live Google-backed NCKH flow hoạt động sau khi re-consent.
- Live generation, collection, normalization, và export flow hoạt động qua app.

## Validation đã chạy

Verified:

- `npm run build` trong `apps/web` đã pass.
- `npx playwright test tests/nckh.spec.ts -g "Phase 7 Workspace" --workers=1 --reporter=line` đã pass: 3 passed.
- Kiểm tra code hiện tại xác nhận scope frontend request khớp với backend-required scopes.
- User-confirmed manual live Google validation đã pass vào ngày 2026-06-05.

## Validation chưa hoàn tất

Blocked:

- Không còn blocker cho scope closeout Phase 7.5 đã duyệt sau user-confirmed live validation.

Not run:

- Full `npx playwright test tests/nckh.spec.ts --workers=1 --reporter=line` không hoàn tất trong command timeout 120 giây hiện tại, nên không được tính là passed.
- Chưa chạy backend build/test trong closeout attempt này vì change set Phase 7.5 được kiểm tra là frontend scope/config/copy oriented và pass này không sửa backend code.
- Agent không trực tiếp thao tác live Google browser session; live Google evidence là manual validation do user xác nhận.

## Blocker còn lại

- Không còn blocker được user báo lại cho scope live Google validation Phase 7.5 đã duyệt.

## Scope alignment

Giữ trong scope:

- kiểm tra OAuth scope
- xác minh frontend requested scopes
- xác minh backend guard bằng source inspection
- frontend build và targeted Playwright regression

Giữ ngoài scope:

- backend endpoints mới
- DTO fields
- database fields hoặc EF Core migrations
- Google Sheets collection
- Google Forms watches, Pub/Sub, scheduled jobs, hoặc background workers
- statistical analysis, charting, generated reports, hoặc SPSS execution
- NCKH admin UI
- NCKH credit/pricing
- fake hoặc seeded responses dùng làm live closeout evidence

## Quyết định closeout

Phase 7.5 là **Completed**.

Không còn P0/P1 blocker trong scope Google consent và live dataset fix/validation Phase 7.5 đã duyệt dựa trên manual live testing do user xác nhận.

## Candidate tiếp theo

Candidate tiếp theo: **NCKH Phase 8 - Full-stack Smoke Validation**.

Phase 8 vẫn là candidate riêng và cần approval rõ của user trước khi thực thi.
