# Rà soát delta trước review tổng cuối

Ngày 2026-10-30. Reviewer `/root/review_ab_resume`, model `gpt-6.1-sol`, reasoning `high`, root dispatch; không agent con. Phạm vi chỉ E fixture-r1/callback, F fix-motion, H fix-r1 và hai cảnh báo cleanup do remediation tạo. Chỉ đọc source/evidence và ghi báo cáo này; không chạy test/build/browser/SQL/process/provider hoặc sửa production/tests/docs.

## Summary

**Verified — accepted trong phạm vi source:** không phát hiện P1/P2 mới ở ba delta E/F/H. E dùng ngữ cảnh `ApiError` cho lỗi callback; F tắt transition của hai control khi reduced motion; H loại riêng font bị hủy navigation khỏi probe thất bại và giữ các negative control tài nguyên. Không cần sửa source thêm từ review này trước build.

Đây là review chuẩn bị, không phải kết luận Done, integration hay release. Các finding P2 trước đây ở AI nested-null, Google Forms nested-null và receipt approve đã được xử lý trong chuỗi báo cáo riêng; báo cáo này không thay thế hoặc xóa các finding/evidence đó.

## Files changed

Reviewer chỉ thêm `final-review-prep/report.md`. Source được rà soát:

- E: `apps/web/app/dashboard/nckh/callback/page.tsx`, `apps/web/tests/nckh.spec.ts`, `apps/web/tests/nckh-delete-model.spec.ts`.
- F: `apps/web/components/account-profile-panel.tsx` — delta hai class trong `account-payments-ui/fix-motion`.
- H: `apps/web/scripts/legacy-smoke.mjs`, `apps/web/tests/fah-err-legacy-smoke.test.cjs` — delta `legacy-smoke/fix-r1`.
- Cảnh báo: cleanup trong profile/security và implementation của `react-hooks/exhaustive-deps` đang cài.

## Scope alignment

**E — accepted.** Callback chỉ phân loại `ApiError` đúng POST `/api/v1/nckh/auth/google-link`, dùng status 400/409 với thông báo tiếng Việt có giới hạn. Không suy diễn tài khoản của người khác từ body, không đưa raw backend detail ra UI, không thay contract/endpoint/payload hay cơ chế chống POST trùng bằng `exchangedCodeRef`. Fixture thay đổi thông báo theo approved behavior; vẫn phân biệt unknown/empty, không bỏ chặn DELETE hoặc xác nhận lại khi model đổi. Hai tình huống đổi tên/sinh form chỉ được arm sau khi impact ban đầu sẵn sàng, kiểm thêm đúng một final-check GET và zero DELETE. Canvas chờ control refresh sẵn sàng, bảo đảm handle trong viewport rồi thực hiện drag thật và kiểm POST payload; không thay bằng gọi API trực tiếp.

**F — accepted.** Chỉ thêm `motion-reduce:transition-none` vào input họ tên và nút lưu. Diagnostic ghi nhận reduced motion vẫn có hai opacity CSS transition 150ms khi profile GET đổi disabled sang enabled; hai class xử lý đúng hai đối tượng đó, giữ guards/retry/contract. Không thay global CSS hay nới test animation.

**H — accepted.** Request-failed handler dùng pathname và chỉ bỏ qua font `woff/woff2/ttf/otf` có đúng `net::ERR_ABORTED`. JS/CSS abort vẫn fatal; response HTTP >=400 không đổi nên font404 vẫn fatal; font connection reset vẫn fatal. Fixture 42 giữ 24 case gốc và thêm 3 font-abort cùng 15 negative controls qua ba wrapper. Target/env validation, route/login/UI checks, safe output, nonzero exit và browser cleanup giữ nguyên. Đây vẫn là bounded smoke; không xác minh provider/submission/persistence.

**Hai cảnh báo cleanup — không có source bug được chứng minh.** `requestVersion` là numeric ref ổn định do ứng dụng quản lý. Cleanup tăng giá trị hiện tại để vô hiệu mọi GET đang chờ; capture giá trị cũ theo gợi ý DOM-ref sẽ không đúng mục đích này. Rule đang cài tại `eslint-plugin-react-hooks.development.js` thu `.current` trong effect cleanup, rồi chỉ công nhận ref ứng dụng quản lý khi có `AssignmentExpression`; toán tử `++` là `UpdateExpression` nên không được nhận diện. Cả hai component kiểm generation trước cập nhật state của GET/retry. Nhận định này chỉ áp dụng hai cảnh báo nêu dưới đây, không phải miễn trừ lint tổng quát.

Root ruling: giữ `current++`, không suppress rule hoặc sửa cú pháp chỉ để giảm warning. Chi phí còn lại là đúng hai lint warning tại profile line39 và security line80; **không gọi lint sạch**.

## Validation performed

Reviewer đọc trực tiếp artifact, không tự chạy runner. Các path dưới đây tương đối với `artifacts/reports/error-remediation-2026-10-30/`.

| Evidence | Kết quả đã đọc |
| --- | --- |
| E `fixture-r1/after-hashes.json` + immutable after copies + live files | 3/3 hash khớp cả copy và live |
| F `fix-motion/after-hashes.json` + after copy + live | 1/1 khớp |
| H `fix-r1/after-hashes.json` + hai after copies + live | 2/2 khớp |
| `runtime/final-browser-nckh-fixture-r1/playwright.json` | 55 expected, 0 unexpected/flaky/skipped, errors rỗng |
| `runtime/final-browser-f-motion/playwright.json` | 2 expected, 0 unexpected/flaky/skipped; reduced-motion popup và ERR021 failed profile GET/retry |
| `runtime/account-motion-diagnostic.json` | Trước sửa: reduced=true, hai opacity transition trên đúng hai control |
| `runtime/legacy-fix-r1-red42/test.log` | 42 case, 39 pass/3 fail; font-abort là ba case RED theo packet |
| `runtime/legacy-fix-r1-green42/test.log` | 42 pass, 0 fail/cancelled/skipped |
| `runtime/legacy-esm-final/results.json` và ba log cùng thư mục | Ba entrypoint đều exit0, log bounded smoke; provider/AI/gửi form Not run |
| `runtime/final-web/lint-result.json`, `lint.log` | exit0, đúng hai `react-hooks/exhaustive-deps` warning; không error |

Hash source tại ranh giới review:

| File | SHA256 |
| --- | --- |
| E `nckh.spec.ts` | `1b0b8ac4b7dc23b55762a9a2115b0eb302e60221896d0ba76eb33313c92d3126` |
| E `nckh-delete-model.spec.ts` | `80c1af8559da9abc27c4757a6d5dd73aa1bb8d7fb753257b6407e06e3e01111f` |
| E callback | `157e8a6ce52c4b2b20f292eeeab1fe92f38583458b8176113b3882d6ff4221ff` |
| F profile | `bac6f7c566cbfaa932a82d764f052b32b7e8f918b5f0bde14b67a587e2a44681` |
| H helper | `ed787277c99eb8f0b5c99a30e1b7ee0406c70cb8777cc8066255d1f22aa0c105` |
| H fixture | `999940fae9d2e8554787f64178de27eac33784e66ca59885edc8a8e6c8dedee0` |

**Failed evidence preserved:** `runtime/legacy-esm-green/results.json` có root entrypoint exit1 và hai entrypoint exit0. Không dùng bộ đó làm pass; bộ `legacy-esm-final` mới có 3/3 exit0. Tiêu đề packet H “GREEN42 / ESM ready” tự nó không phải chứng cứ runtime; kết luận ở đây dựa trên log/result thực tế phía trên.

## Validation not performed

**Not run bởi reviewer:** toàn bộ runner/build/browser/DB/provider. Chưa review tổng tất cả source frozen và consumer/test paths của toàn remediation trong vòng fresh cuối, chưa đối chiếu manifest tổng với mọi runtime check/restart/build cuối. Các báo cáo trước vẫn là evidence riêng có phạm vi của chúng; không suy ra full-system pass từ E55/F2/H42/ESM3 hoặc lint exit0.

## Risks / Deferred items

Không có blocker source mới trong phạm vi delta này. Hai lint warning được root chấp nhận như noise đã giải thích, vẫn phải hiện trong báo cáo cuối. Bounded smoke không bao phủ tích hợp provider/AI/gửi form/SQL. Không mở rộng audit sang behavior tồn tại trước delta, không thêm phase/provider/business rule mới.

## Next recommended step

Root hoàn tất manifest/checks/restart/build cuối theo runner owner, sau đó dispatch review tổng fresh trên exact snapshot và evidence cuối. Chỉ kết luận Done khi các gate bắt buộc thực sự thỏa.
