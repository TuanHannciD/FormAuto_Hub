# FAH-ERR-001 — Forms/AI UI packet D

2026-10-30 · Implementer `/root/forms_ui`, `gpt-6.1-sol/high`, không agent con. Shared checkout `D:/TinHoc/FormAuto_Hub`; root điều phối, runtime owner duy nhất chạy test/build/browser/process/SQL. Không commit/push/merge/deploy/install/cleanup/provider phí/thanh toán/gửi form thật.

## Summary / Scope alignment

Đã triển khai giới hạn ERR-014/015/011 consumer/019/023/024 trong 6 file giao ownership. Không thêm DTO, endpoint, status, business rule, schema hoặc tự động retry mutation. ERR-011 chỉ đọc optional nullable safe Vietnamese `errorMessage` đã được người dùng duyệt; client đối chiếu tập thông báo đã xác nhận và dùng fallback với chuỗi không biết, không render raw diagnostic.

- ERR-014: HTTP 404 hiện hữu cho phép cấu hình mới; lỗi đọc khác giữ draft, hiển thị cảnh báo liên tục/nút GET lại, không cho save/generate/auto-fill khi snapshot cấu hình chưa xác minh. Request version/key giữ ownership; toàn fieldset đang khóa lúc loading được giữ nguyên.
- ERR-015: kết quả POST AI (count/credit/balance/run ID) được giữ trước GET preview trong cả tạo mới và tạo tiếp. GET lỗi giữ IDs, khóa tạo/gửi/chuyển chế độ/chọn form/nạp tiếp, nút GET-only tải lại nội dung đã lưu; không POST lại. Khi đã tải đủ, vẫn phải preview và xác nhận. Phần preview cũ của continuation được giữ.
- ERR-011: kết quả Failed và lịch sử AI hiển thị mã lượt hiện hữu + lý do an toàn; chuỗi lạ/nhạy cảm dùng câu dự phòng, không tự khẳng định số credit hoàn lại.
- ERR-023: hiển thị job/attempt/response IDs hiện hữu và nguyên nhân đã nhận diện; lỗi HTTP cũ được dịch bằng mẫu toàn chuỗi, dữ liệu lạ không hiển thị. Chỉ thông báo exact của ERR-008 được nhận diện là kết quả remote chưa xác định; không suy từ mọi Failed/count, không hứa chưa gửi. Ẩn lời mời thực hiện lại khi gặp kết quả chưa xác định.
- ERR-024: mặc định chỉ được ghi vào state khi chọn mode; read không tạo giá trị thay thế. Xóa giữ rỗng; validate ngày hợp lệ/thứ tự, giờ HH:mm/thứ tự và số nguyên 5–120 phút đúng backend hiện hữu; inline aria error và guard handler chặn POST. Không thêm ràng buộc bước chia hết 5.
- ERR-019: đúng 2 leaf đã trace: lời dẫn AI tùy mở/đóng, public FAQ đổi `product safety rules` sang tiếng Việt. Chuỗi `product baseline` không còn trong source hiện tại, không mở rộng chỉnh copy.

## Files changed / snapshot

Before bytes/hashes: `before/`, `before-hashes.json`. After frozen bytes/hashes: `after/`, `after-hashes.json`. Full owned source diff: `changes.patch`. Giữ nguyên tất cả dirty/untracked/ignored/DB-sync và evidence của owner khác.

1. `apps/web/app/dashboard/forms/page.tsx`
2. `apps/web/app/dashboard/forms/_helpers.ts`
3. `apps/web/app/dashboard/forms/_components/RuleEditor.tsx`
4. `apps/web/app/dashboard/ai-usage/page.tsx`
5. `apps/web/app/dashboard/forms/_components/AiQuestionBlock.tsx`
6. `apps/web/lib/seo-pages.ts`
7. Test riêng `apps/web/tests/fah-err-forms-errors.test.cjs` và `fah-err-forms-errors.spec.ts`.

## Validation performed

- **Verified, runtime-owner evidence đã đọc:** `runtime/forms-ui-red8/test.log` — node regression RED8/8, 8 ERR_ASSERTION đúng clear đầu/cuối và invalid-save no-write; baseline source chưa sửa tại thời điểm chạy.
- **Failed, harness, giữ evidence:** browser RED đầu có 3 ca fixture sai (accessible label gồm char count; fieldset chủ ý khóa chế độ khi GET pending), 1 ca ERR-015 đúng lỗi. Spec cũ lưu `browser-tests-before-red2.spec.ts`, runtime giữ `forms-ui-browser-red/` và traces.
- **Verified, runtime-owner evidence đã đọc:** `runtime/forms-ui-browser-red2/test.log` — 8 ca, 6 product RED (014,015,011 x3,023) + 2 supplemental pass (404 và pending locks), không fixture stalls. Không gán supplemental thành regression từng đỏ.
- **Verified / exit 0:** static parse 6 source bằng `node artifacts/reports/error-remediation-2026-10-30/forms-ui/static-syntax.cjs`; không syntax diagnostics. Script ban đầu sai root depth, lần đầu MODULE_NOT_FOUND; sửa đường dẫn rồi chạy lại. Không phải TypeScript typecheck/build.
- **Verified / exit 0:** `git diff --check -- apps/web/app/dashboard/forms apps/web/app/dashboard/ai-usage/page.tsx apps/web/lib/seo-pages.ts`.
- **Verified / exit 0:** Impeccable detector 4 TSX targets trả `[]`; đây là static detector, không phải kiểm tra browser/a11y.

## Validation not performed

**Not run bởi implementer:** GREEN unit/browser, auth suite, lint/build/typecheck, HTTP/SQL, runtime restart/logs/hydration/chunks, independent review. Runtime owner nhận frozen snapshot để chạy. Không đóng bất kỳ finding hoặc tuyên bố Done/integration/release.

Spec hiện có 11 browser cases: 8 của RED2, 2 clear/retype/payload ranges và 1 supplemental step boundaries/mode defaults. Node giữ nguyên 8 ca RED. Ca cạnh tranh mode A/B trước đây không hợp lệ vì controls bị khóa; thay bằng kiểm tra khóa mode/project/write thực và chuyển chế độ sau khi read hoàn thành, không ép event vào disabled control. Case này là protective coverage, không bằng chứng race đã tái hiện.

## Commands handed to runtime / Next recommended step

Từ `apps/web`, config/port/server owned do runtime chọn và ghi lại:

```text
node --test tests/fah-err-forms-errors.test.cjs
npx playwright test tests/fah-err-forms-errors.spec.ts --workers=1 --reporter=line
npx playwright test tests/form-automation.spec.ts --workers=1 --reporter=line
npm run test:auth
npm run lint
npm run build
```

Sau GREEN cần browser/HTTP smoke phù hợp bằng fixtures không phí, kiểm tra role/session/console/chunks/logs và review độc lập submission safety/credit-facing UI trên snapshot hash. Kiểm tra thêm 019 leaf public `/anti-abuse`, mở/đóng AI question, mobile overflow/focus. Runtime live API–SQL không được suy từ mocked HTTP spec.

## Risks / Deferred items

- Pending preview read giữ trong state của trang; không thêm lifecycle hay giao thức phục hồi xuyên reload mới. Existing partial-generation resume giữ nguyên contract.
- Bộ thông báo AI an toàn phải theo delta backend đã duyệt; lý do tương lai chưa biết sẽ fallback.
- Read/profile 404 vẫn có semantics privacy của API hiện hữu; không sửa controller/backend trong packet này.
- **Deferred:** provider live, submission thật, payment thật, global error contract/recovery/retention, backfill lịch sử, schema, integration/release.

## Supplemental coverage checkpoint

Root/reviewer yêu cầu bổ sung **test-only**, không có production source delta: spec hiện **13 ca browser** (11 ca frozen trước đó + 2 bổ sung). Bản 11 ca giữ ở `browser-tests-before-supplement13.spec.ts`; hash cũ giữ `after-hashes-before-supplement13.json`. `after/` và `after-hashes.json` cập nhật test mới; 6 production hashes giữ nguyên.

- Continuation AI: POST lần đầu Partial + số dư giả lập đã được bổ sung độc lập, POST tiếp theo 200 rồi GET preview 503. Assert cumulative count/cost, balance, run ID mới, preview ID mới, khóa confirm/generate, GET-only retry; đúng 2 POST với count 2 rồi 1, đúng các GET ID trước/sau retry, không tăng PUT.
- Submission: 4 log hỗn hợp gồm Success, HTTP403 known, null reason, unknown long sensitive reason. Assert job/attempt/response IDs, counts 4/1/3, lý do 403 dịch an toàn, missing/unknown fallback và không raw. Không gán mọi Failed thành remote uncertainty; case ERR-008 riêng vẫn giữ cảnh báo và ẩn lời mời resend.
- **Verified, runtime owner báo:** node GREEN8/8/exit0/no skip tại `runtime/forms-ui-green8/`; chưa chạy lại dư thừa.
- **Not run:** 2 ca supplemental và toàn browser13, lint/build/runtime/independent review. Root/runtime nhận test file frozen; đây là coverage bổ sung sau source fix, không gọi là ca đã RED trước implementation.

## Test fixture correction r1 — actual browser checkpoint

- Runtime báo `final-browser-d13/`: **10 Passed / 3 Failed**. Hai supplemental continuation/ordinary cause đã pass; 3 Failed ERR-024 đều timeout tại locator trước assertion hành vi. Snapshot thực cho thấy nút dropdown có accessible name `Chế độ trả lời` từ label bao ngoài, dù text con là `Dòng mẫu` hay `Khoảng giờ tuần tự`. Đã sửa đúng 4 click locator sang role button + exact actual name; giữ nguyên option selectors, clear/retype/order/step/mode reset và payload assertions. Không sửa production.
- Existing `form-automation.spec.ts`: runtime 5 Passed / 1 Failed, assertion toast cũ `Không phân tích` không còn đúng shared ApiError 400 mapper đã duyệt. Đã đổi **duy nhất một dòng** expectation thành `Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.` theo source mapper. Assertions xóa analysis/checkbox cũ và không hiện nút generate vẫn giữ nguyên.
- Before13/regression bytes và hashes được giữ tại `test-fixture-r1/before/`; corrected bytes tại `test-fixture-r1/` và `after/`; `after-hashes.json` đã cập nhật. Test count vẫn13, production6/node8 hashes không đổi.
- **Verified / exit0:** scoped `git diff --check`. **Not run:** browser ERR0243 và stale-toast1 sau correction. Runtime nhận frozen hashes để chạy targeted `--grep ERR024` và `--grep "changing form URL"`; không gọi vòng trước green toàn bộ.
