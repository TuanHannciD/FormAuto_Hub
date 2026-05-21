# PHASE_9_CLOSEOUT

## Mục đích

Đóng Phase 9 sau lượt debug full-stack và smoke validation bằng người dùng thật đã được duyệt.

## Trạng thái closeout

Status: Completed.

Phase 9 đã đóng. Chưa chọn phase tiếp theo.

Closeout này không duyệt tính năng mới, bug fix, API contract mới, database field mới, payment provider mới, official Google Forms API, AI work hoặc production background jobs.

## Scope Phase 9 đã hoàn tất

Các khu vực đã validate:

- backend build và tests
- frontend lint và build
- trạng thái EF Core migration
- restart process API và OpenAPI smoke
- đăng ký và đăng nhập bằng user thật
- API dashboard, profile, packages, usage logs, credit transactions và top-up orders bằng JWT
- chặn normal user ở admin API
- Playwright browser smoke cho user dashboard routes trên desktop và mobile
- Playwright browser smoke cho normal-user admin guard trên desktop và mobile
- live Google Form analysis bằng Google Form URL đã duyệt
- tạo answer rule cho toàn bộ câu hỏi detect được
- preview generation và credit deduction
- validation preview count cho count không hợp lệ
- chặn preview khi thiếu credit
- chặn submission khi chưa confirm
- controlled submission đã confirm với 1 preview response
- ghi submission job và submission log
- tạo checkout link PayOS 2.000 VND
- xác nhận thanh toán PayOS thật
- xử lý PayOS webhook
- tự động cộng credit
- ghi ledger `CreditTransactions` cho PayOS credit grant
- replay PayOS webhook để kiểm tra idempotency
- admin API smoke bằng real admin session
- Playwright browser smoke cho admin pages trên desktop và mobile
- kiểm tra PayOS settings masking

## Tóm tắt validation

Verified:

- `dotnet build FormAutoHub.sln -c Release` passed.
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build` passed: 40 tests passed, 0 failed.
- `npm run lint` passed.
- `npm run build` passed.
- EF Core migration list succeeded.
- EF Core pending model changes check passed, không có pending changes.
- API đã restart và listen tại `http://localhost:5235`.
- Web app đã restart và listen tại `http://localhost:3000`.
- `GET /openapi/v1.json` trả HTTP 200.
- User thật `phase9.user.20260521032537@example.com` đã register và login.
- Starting credit grant ghi ledger `InitialGrant`.
- Dashboard/profile/packages/usage-log/credit-transaction/top-up APIs trả đúng dữ liệu user.
- Normal user nhận HTTP 403 khi gọi admin revenue API.
- Google Form đã duyệt analyze trả status `Analyzed` với 15 câu hỏi detect được.
- 15 answer rules được tạo cho các câu hỏi detect được.
- Preview generation tạo 3 responses và trừ 3 credits.
- Credit balance chuyển từ 5 xuống 2 sau preview generation.
- Preview count không hợp lệ 0 và 101 trả HTTP 400.
- Preview khi thiếu credit trả HTTP 400.
- Submission không confirm trả HTTP 400 và ghi failed usage log.
- Confirmed submission của 1 preview response completed với 1 success và 0 failures.
- PayOS checkout được tạo cho top-up order `ea7773b5-0157-4e7b-936d-9986400c2bc0`.
- Sau khi user thanh toán, `PaymentRecord.ProviderStatus` thành `Paid`.
- Top-up order status thành `Approved`.
- User credit balance thành 102.
- Chỉ có đúng một ledger row `TopupApproved` cho paid top-up order.
- Replay stored PayOS webhook trả `applied=false` và không tạo thêm ledger row.
- Admin login bằng `admin@formauto.local` trả role `Admin`.
- Admin revenue, payment list, PayOS settings và package APIs trả dữ liệu đúng.
- PayOS settings chỉ trả masked secret previews.
- Playwright user và admin route smoke passed trên desktop và mobile.
- Final Playwright runs không có console errors.

Not run:

- Full 100-response browser submission, để tránh submit thật không cần thiết vào Google Form đã duyệt trong closeout validation.
- Admin PayOS settings save/check mutation, vì thay đổi live payment settings nằm ngoài nhu cầu closeout sau khi settings đã được verify là enabled và complete.

Blocked:

- Không có blocker trong scope closeout Phase 9 đã duyệt.

## Findings

### P2 Medium - Next dev static chunks bị stale trước khi restart web

Trước khi restart web server, Playwright ghi nhận 404 với Next dev static chunks như `/_next/static/chunks/main-app.js` và `/_next/static/chunks/app-pages-internals.js`. Login không hydrate/navigate được trong trạng thái server stale đó.

Sau khi restart web dev server, Playwright smoke desktop và mobile passed, không còn console errors.

Follow-up đề xuất:

- Xem web restart là bước bắt buộc trước browser smoke.
- Nếu chunk 404 xuất hiện lại, clean stale `.next` output trước khi rerun Playwright.

### P3 Low - Playwright locator ambiguity trong test script

Script Playwright đầu tiên dùng locator không exact cho `Đăng nhập`, nên match cả `Đăng nhập với Google`.

Test script đã được sửa để dùng exact accessible-name locator. Đây là lỗi test script, không phải app defect.

## Evidence

Evidence Phase 9 nằm trong `docs/testing/phase9/`:

- `PHASE_9_REPORT.md`
- `playwright-smoke-report.json`
- `playwright-admin-smoke-report.json`
- Playwright screenshots cho user dashboard routes trên desktop và mobile
- Playwright screenshots cho admin routes trên desktop và mobile

## Scope alignment

Phase 9 giữ đúng scope validation/debug.

Không thêm production feature, API contract, database schema change, payment provider mới, official Google Forms API integration, AI mapping/generation, subscription billing, refund automation hoặc production background job framework.

Anti-abuse boundaries giữ nguyên:

- không captcha bypass
- không proxy rotation
- không fake-account automation
- không unauthorized submission behavior
- không AI auto-submit
- preview-before-submit và explicit confirmation vẫn được enforce

## Rủi ro còn lại

- Full 100-response browser submission vẫn chưa test theo chủ đích để tránh submit thật không cần thiết.
- Admin PayOS settings save/check mutation vẫn chưa test theo chủ đích để tránh đổi live payment configuration trong closeout.
- P2 stale Next dev chunk warning là rủi ro vận hành và nên xử lý bằng mandatory web restart trước browser smoke sau này.

## Quyết định closeout

Phase 9 đã hoàn tất.

Không còn P0 hoặc P1 blocker trong scope user, admin, Google Form, PayOS payment, webhook, credit ledger hoặc Playwright UI smoke đã validate.

Phase tiếp theo chưa được chọn. Bất kỳ Phase 10 hoặc implementation/fix follow-up nào cũng cần approval riêng.
