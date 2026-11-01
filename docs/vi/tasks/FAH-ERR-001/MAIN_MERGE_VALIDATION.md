# FAH-ERR-001 — Kiểm chứng mới trước merge main

Kiểm chứng ngày2026-11-01,00:47–00:58 UTC. Runtime owner `/root/main_merge_runtime`, model thực tế `gpt-6.1-sol/high`, không agent con. Root giữ review độc lập, CI và quyết định tích hợp. Báo cáo này không cấp quyền hoặc kết luận đã deploy.

## Target và phạm vi

- HEAD ban đầu: `3893d0c660890c94f32ebb432c79373f6fe091f7`; tracked tree và index ban đầu sạch. Git audit riêng của root sở hữu xác nhận ancestry remote-main và toàn bộ diff prerequisite/remediation.
- Manifest cuối đã được chấp nhận có343 file source/test/helper; cả343 hash hiện tại khớp khi nhận ownership và sau runtime. Vì vậy kiểm tra mới bao phủ cùng nội dung ứng dụng với cây nội dung main dự kiến sau tích hợp. Head cuối của root `7cb943a05162577df456479fcdb5485cab9dbeaa` chỉ thêm sửa mirror đã review và plan song ngữ;343 hash ứng dụng vẫn khớp. Sửa LF chỉ ở mirror được review riêng không ảnh hưởng ứng dụng.
- Không sửa source hoặc tests. Chỉnh sửa bền vững của runtime giới hạn ở báo cáo song ngữ này và evidence/helpers trong [main-merge/runtime](../../../../artifacts/reports/error-remediation-2026-10-30/main-merge/runtime/). Giữ evidence untracked, cache ignored, SQL clone và worktree hiện hữu.
- Skills áp dụng: `verification-before-completion`; `systematic-debugging` cho lỗi helper build cách ly. Không cài dependency, gọi provider ngoài, thanh toán, gửi Google Forms, thay đổi remote hoặc vận hành production.

## Kiểm tra mới

| Kiểm tra | Trạng thái và kết quả | Evidence trong runtime/ |
| --- | --- | --- |
| `dotnet build FormAutoHub.sln -c Release`, cwd repository | Verified exit0;6 lần cảnh báo NU1603,0 errors | `backend-build.log`, `backend-result.json` |
| `dotnet test FormAutoHub.sln -c Release --no-build`, cwd repository | Verified runner exit0:291 passed,0 failed,6 SQL migration tests skipped,297 total; skip không phải pass | `backend-test.log`, `backend-test/all-tests.trx` |
| `npm run lint`, cwd `apps/web` | Verified exit0; cùng2 ref-cleanup warnings tại profile39/security80 | `web-lint.log`, `web-result.json` |
| `npm run build`, cwd `apps/web`, r4 | Verified exit0; colors, compile, typecheck, prerender33 và routes. Preload config chỉ dùng cho runtime giữ nguyên hàm Next và chọn dist sở hữu cho CLI/workers | `web-build-r4.log`, `web-build-r4-result.json`, `build-r4-config-proof.jsonl` |
| Node auth + các suite lỗi/helper liên quan, cwd `apps/web` | Verified108/108,0 skipped,0 failed | `web-node.log`, `web-result.json` |
| Playwright regression trên production web vừa khởi động | Verified105/105,0 skipped,0 retry,0 flaky,0 runner errors;9 specs,84.7s. API là browser fixture giả lập | `browser/playwright.json`, `browser-summary.json`, `browser-result.json` |
| T3 browser, tab incognito sở hữu | Verified render và hydration trang login: thao tác hiện mật khẩu đổi kiểu input; JS/CSS đã tải đều200, console rỗng, không tràn ngang ở1280×800 | `t3-browser-evidence.json` |
| Actual API Program, cold start, chỉ GET an toàn | Verified15 HTTP checks với JWT validation thật và các dòng User/Admin synthetic đã giữ:200/401/403/404, role hồ sơ, ownership/privacy và quyền evidence | `api-smoke/verification.json`, `identity.json`, `bounded.log` trong thư mục đó |
| Guard SQL schema/data thực tế | Verified đúng local clone đã được chấp nhận id8, pending migrations0/modelPending false ngay trước startup Migrate no-op; count Users/RefreshTokens/UsageLogs/CreditTransactions/SubmissionLogs đọc độc lập không đổi | `api-smoke/guard.json`, `api-smoke/verification.json` |
| Export tracked skill sạch trước sửa | Failed đúng tái hiện: nội dung Git3893 gốc có1 mirror drift | `skills-clean-before-result.json` |
| Cùng export với đúng2 đầu vào canonical-LF được duyệt | Verified exit0:24 skills,280 pinned hashes,293 mirrored files,0 sync writes; source blob vốn đã khớp, chỉ mirror blob đổi | `skills-clean-after-result.json`, `skills-clean-finalhead-result.json` |

Số ca browser theo file: account navigation10, admin UI5, auth session2, account/payment errors23, core callback3, auth errors5, forms errors13, NCKH errors4, NCKH hiện hữu40. Bao phủ profile/reduced-motion, receipt giữ kết quả mutation, retry chỉ đọc, hướng dẫn submission chưa xác định, callback core/NCKH, form flow và workspace NCKH. Đây là web dùng fixture; actual API–SQL reads là evidence riêng. Không cộng các runner thành số unique tests.

Web phục vụ dist sở hữu `.next-fah-mainmerge-20261101`, build ID `eXr7rRt-VZVh3ragQuMkk`, SHA256 file BUILD_ID `1AEC9A35C686DC437289D3DB41CA8D1BA56ADDA514A437A0FA865259C78DAB28`. Launcher28364 → actual Next23984 phục vụ port3137. API31436 phục vụ loopback5248. Access token User/Admin được actual TokenService tạo trong memory; không lặp DB writes của login/refresh. Không ghi token hoặc credentials vào evidence.

## Giữ nguyên failures và giới hạn

- `python scripts/agent-skills.py --check` trên working tree gốc là Failed:3 file Python bytecode ignored có sẵn dưới `ui-ux-pro-max/scripts/__pycache__` ngoài manifest. Giữ nguyên chúng. Export Git sạch tách extras local khỏi lỗi mirror tracked tìm được độc lập; xem `skills-local-classification.json`.
- Build lần1 fail trong helper runtime trước compilation: JSON serialization làm mất hàm Next `generateBuildId`. Lần2 compile thành công nhưng cache-key lệch dạng path chọn `.next` tiêu chuẩn thay vì dist cách ly yêu cầu. Cache build tiêu chuẩn đó đã được regenerate; chưa inventory toàn bộ bytes cũ nên không thể khẳng định giữ nguyên từng byte. Lần3 fail trước compilation vì preload làm mất CommonJS marker `__esModule`. Giữ mọi log. Lần4 chỉ sửa helper, là isolated build đã chứng minh độc lập và được dùng cho browser. Không cần sửa source production.
- T3 open đầu bị refused khi web chưa chạy; cùng tab sở hữu mở thành công sau readiness. Production start đầu khi chưa có isolated BUILD_ID cũng fail, được lưu dưới `first-*`. Các failure này vẫn thuộc lịch sử.
- Sáu SQL migration tests vẫn skipped. Guard schema/count chỉ đọc mới không chứng minh các assertion concurrency/migration của chúng. Evidence SQL durability9, actual Program25 và AI SQL6 đã chấp nhận trước chỉ được tái sử dụng vì hash ứng dụng đã chấp nhận không đổi; không chạy lại các kịch bản mutation đó.
- Broad browser83 lịch sử=69pass/14fail, các targeted rerun đã sửa và cold-health failure cũ chưa giải thích vẫn ở [runtime record trước](../../../../artifacts/reports/error-remediation-2026-10-30/runtime/FINAL_VERIFICATION.md). Fresh105 không ghi lại kết quả lịch sử thành pass. Cold start API thực tế hôm nay thành công; bounded log chỉ có cảnh báo HTTPS-port dự kiến cho loopback, web error log sở hữu rỗng.
- Google/OAuth thật, AI trả phí, PayOS/payment/webhook, gửi form ngoài, production/tunnel smoke và deployment: Not run, ngoài phạm vi runtime này. Đây là evidence local, không phải kiểm chứng release.

## Nhả tài nguyên và giữ cấu hình

Verified browser sở hữu đã đóng/list rỗng; cả hai PID web sở hữu không còn, HTTP3137 refused sau stop; API child exited và không còn listener5248. Kiểm identity/parent/commandline trước khi chỉ dừng process sở hữu. Xem `release.json` và `web-release-identities.json`.

Đã archive Next-generated config delta và kiểm ngữ nghĩa trước khi phục hồi đúng bytes lúc nhận ownership. Thay đổi ngữ nghĩa duy nhất là thứ tự include cộng một include dist sở hữu, và route-types reference tương ứng. Cả5 hash config ban đầu khớp lại: tsconfig `5BB0AC200C1934A273D74E52785F4C36FA62C082D766CAB15CDC8484FF39BF15`, next-env `F4E8976C19FC926644D72610BF1058BD6BF52ADD97E46A02BC0B912A751625C0`; appsettings và local env ignored không đổi. Xem `config-restoration.json`. Giữ evidence, thư mục cache và SQL fixtures synthetic; không cleanup hoặc replay DB sync.

**Bước tiếp theo:** root kết hợp evidence runtime này với review độc lập toàn diff, sửa mirror được duyệt, kiểm nội dung Git cuối chính xác và CI hiện tại trước khi quyết định tích hợp main. Người dùng vẫn tự thực hiện checkpoint self-deploy được kiểm chứng riêng; báo cáo không kết luận đã tích hợp hoặc release.
