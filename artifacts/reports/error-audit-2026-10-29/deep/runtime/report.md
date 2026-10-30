# FAH-ERR-001 — Kiểm chứng runtime đại diện

Ngày 2026-10-29. HEAD `a19f7a2f3dc1bc54ff645d662d94fc614439256a`. Agent `gpt-6.1-sol`, reasoning `high`, không dispatch agent con. Phạm vi do root giao: kiểm tra prerequisite chỉ đọc và kiểm chứng browser an toàn; không sửa sản phẩm.

## Summary

**Verified: tái hiện 5 quan sát UI bằng browser thực + HTTP fixture.** Các kỳ vọng xử lý lỗi ở dưới là **Failed** vì lỗi hiện hữu được tái hiện; không có bản sửa. **Verified:** đọc metadata SQL Server và history migration cục bộ. **Blocked:** khởi động API sản phẩm vào DB người dùng trong giới hạn chỉ đọc. API/auth/SQL persistence/provider tích hợp vẫn **Not run**.

T3 hoạt động sau khi mở URL HTTP. `preview_status` ban đầu trả `available:false` vì chưa có tab; thử `about:blank` bị bộ kiểm tra URL từ chối, không phải browser bị thiếu. Tab riêng `tab_c_35b294ea-298a-4db5-a451-c7ba012d4846`, profile `incognito`, viewport 1280×800; không có tab người dùng nào bị tương tác hoặc đóng.

## Files changed và scope alignment

Chỉ tạo script/report/evidence trong thư mục này. `git diff --name-only` cuối lượt trống; 13 source hashes trong `evidence-manifest.json`. Không thay product source, tài liệu task chung, dependency, DB/DDL/migration; không install/commit/push/deploy/provider/submission.

**Giới hạn thực thi cần ghi rõ:** custom Next server đã truyền `conf.distDir` dự định đặt output dưới artifacts, nhưng dev pipeline vẫn ghi output ignored vào `apps/web/.next`; thư mục `next-output` mong đợi không xuất hiện. `ignored-next-output-observed.json` ghi timestamp thực tế. Vì vậy không thể tuyên bố filesystem isolation thành công. Không xóa/khôi phục cache vì không có baseline để bảo toàn chính xác. Tracked source không đổi. Đây là sai lệch so với writable zone dự định; root đã nhận thông báo, không được coi là không có runtime side effect.

## Validation performed

### Prerequisite và SQL chỉ đọc

- Node `v22.12.0`, .NET SDK `9.0.320`, sqlcmd, Next/Playwright dependencies hiện hữu. Không cài thêm.
- Lúc bắt đầu không thấy listener tại 3020/7039/3000/5000/3137/3138. Service `MSSQLSERVER` Running; `SQLBrowser` Stopped.
- Kiểm tra cấu hình bằng parser chỉ xuất `connectionConfigured`, local-server boolean, tên DB và integrated-security boolean; không xuất connection string/credentials. Development chỉ tới local `FormAutoHub` bằng integrated authentication; không thấy environment connection override hay UserSecretsId. Chi tiết an toàn trong `prerequisites.json`.
- Chạy `sqlcmd -S localhost -E -C -d FormAutoHub -l 5 -W -s '|' -i <thư mục này>/sql-readonly.sql -o <thư mục này>/sql-readonly.log`, exit 0. Chỉ SELECT DB identity/engine version, migration IDs và tên cột ba bảng `ResearchForms`, `ResearchModels`, `TopupOrders`; không đọc business rows/PII/secrets.
- History có **13 migrations**, source hiện tại có **12**. History chứa `20260601083335_Phase10ManualCreditOperations` ngoài tập source. Đây là mismatch prerequisite mới xác minh, không đủ kết luận DB hỏng hoặc phải downgrade. Không migrate/repair/reset.
- `src/FormAutoHub.Api/Program.cs:142` gọi đồng bộ `db.Database.Migrate()` trước middleware/routes. Startup sản phẩm vì vậy không phải thao tác chỉ đọc. Không khởi động API vào DB đó. Cần runtime test DB được phép ghi với schema phù hợp hoặc host harness không chạy entrypoint; agent backend phụ trách harness độc lập.

### Browser với HTTP fixture

Web source thực chạy tại `http://localhost:3137`, fixture HTTP do agent sở hữu tại `http://localhost:3138`. `server.cjs` chỉ phục vụ fixture; không có ASP.NET API hay EF/DB bên trong. Guest ban đầu; sau đó đặt synthetic session localStorage với role `User`, email `.invalid`, chuỗi token giả không hợp lệ với API thật. Không dùng tài khoản/refresh token thật. Login POST chỉ tới fixture. Các nút lưu hồ sơ/đổi mật khẩu/liên kết Google không bị bấm.

| Quan sát / ID liên quan | Trigger, expected | Observed UI + network + console | Kết quả / bằng chứng |
| --- | --- | --- | --- |
| RUNTIME-01 / ERR-001 | Điền synthetic email/password, bấm Đăng nhập. HTTP 401 cần map lời credential generic tiếng Việt hiện có | `POST http://localhost:3138/api/auth/login` → **401**, `{title:Unauthorized,status:401}`. Alert và toast render **Unauthorized**. Console browser ghi failed-resource 401; instrumented application console/pageerror trong thao tác trống | Tái hiện **Verified**, kỳ vọng UX **Failed**. `browser-login.json`, `browser-login.png`; native 401 network/console còn trong `browser-topup.json` |
| RUNTIME-02 / ERR-016, liên quan ERR-003 | Mở `/dashboard/top-up/fixture-order`; 503 chỉ chứng minh đọc thất bại, không chứng minh không tồn tại/không sở hữu | `GET http://localhost:3138/api/topup-orders/fixture-order` → **503**. Dialog **Không tìm thấy yêu cầu nạp** + “Yêu cầu có thể không tồn tại hoặc không thuộc tài khoản hiện tại.” Toast **Service Unavailable**. Console browser failed-resource 503 | Tái hiện **Verified**, kỳ vọng phân loại **Failed**. `browser-topup.json`, `browser-topup.png` |
| RUNTIME-03 / account-profile load failure, root gộp ID mới | Chuyển fixture mode `profile503`, mở Menu tài khoản → Quản lý tài khoản → Hồ sơ. Dữ liệu chưa tải được cần thể hiện unknown, tránh coi form trắng là dữ liệu hợp lệ | `GET http://localhost:3138/api/profile` → **503**. Email trắng disabled; Họ tên trắng **editable**; **Lưu hồ sơ enabled**; tham gia `-`; toast **Service Unavailable**, console failed-resource 503. Không bấm Lưu | Tái hiện **Verified**, kỳ vọng trạng thái đọc **Failed**. `browser-profile-confirmed.json` chứa values/disabled, `browser-profile.json` có snapshot/network, `browser-profile.png` |
| RUNTIME-04 / account-security load failure, root gộp ID mới | Sau cùng GET profile 503, bấm Bảo mật. Link status phải unknown thay vì tự suy ra unlinked | `GET http://localhost:3138/api/profile` → **503**. Hiện **Chưa liên kết**, **Email hiện tại: -**, toast **Service Unavailable**. Console failed-resource 503. Google button disabled trong fixture không cấu hình client | Tái hiện **Verified**, kỳ vọng phân loại **Failed**. `browser-security-confirmed.json`, `browser-security.png` |
| RUNTIME-05 / NCKH list error/empty, root gộp ID mới | Mở `/dashboard/nckh`; 503 không xác nhận danh sách rỗng | `GET http://localhost:3138/api/v1/nckh/forms?page=1&pageSize=20` → **503**. Có alert **Không tải được danh sách form. Vui lòng thử lại.** và đồng thời **Chưa có form nào** + “Dán URL Google Form vào ô trên để nhập.”; ô nhập đó không render. Console failed-resource 503 | Tái hiện **Verified**, kỳ vọng empty-vs-error/copy **Failed**. `browser-nckh-list.json`, `browser-nckh-list.png` |

Fixture request log `fixture-http.jsonl` ghi method/path/status/mode, không body/Authorization. **27 HTTP fixture requests** gồm preflights, read lặp trong React StrictMode và một request đổi mode; không phải 27 scenario. Lặp GET/toast trên dev không chứng minh duplicate mutation production.

T3 snapshots có giới hạn lịch sử: manifest đếm **27 captured JavaScript resource requests, 26 HTTP 200 và 1 dev HMR hot-update bị `net::ERR_ABORTED` lúc đổi route**. Không được nói tất cả chunks pass. Các route/chunk cần cho 5 UI quan sát đã render và tương tác; không ghi nhận hydration exception trong captured console. HMR aborted giữ nguyên trong evidence, không quy thành lỗi sản phẩm mới. Snapshot toàn lượt có **14 unique console records** gồm browser 401/503, React DevTools và Fast Refresh. Không thấy external-origin request trong phần network capture; đây không phải chứng minh toàn bộ traffic hệ điều hành.

### Công cụ, lệnh và evidence integrity

- Runtime target: `node artifacts/reports/error-audit-2026-10-29/deep/runtime/server.cjs`; Next programmatic, existing dependencies, web 3137/fixture 3138. Lần đầu root-relative path sai một cấp gây MODULE_NOT_FOUND, đã sửa trong harness trước server start; không phải lỗi sản phẩm.
- Browser tools: `preview_status` → `preview_open(reuseExistingTab=false, profileId=incognito, url=http://localhost:3137/login, open=false)`; `preview_snapshot` trước tương tác; `preview_evaluate` chỉ ở own tab cho synthetic session, điền React input và thu thập trạng thái; `preview_click`/`preview_wait_for`/`preview_navigate`; snapshots saved PNG rồi copy vào writable artifact dir.
- Trong thao tác account đã có locator diagnostic timeout/null và một locator syntax bị reject. `browser-profile-form.json` lưu failed diagnostic attempt, **không dùng làm proof UI**. `browser-profile-confirmed.json` là proof inputs/button đã sửa selector; `browser-security.json` là snapshot trước chuyển tab, **superseded** bởi `browser-security-confirmed.json`. Không xóa evidence cũ.
- `node artifacts/reports/error-audit-2026-10-29/deep/runtime/check-evidence.cjs` → **exit 0, 5/5 assertions**, kiểm các file captured/UI/network hiện hữu; không phải rerun browser và không phải regression test bản sửa. Output `evidence-check.log`, SHA-256 source/screenshots/files trong `evidence-manifest.json`; 5 ảnh 1280×800. Script chỉ đọc source/captured artifacts và ghi manifest.

### Resource ledger và release

- Start đầu: PID **27304**, ports **3137/3138**, origin/source như trên, guest rồi synthetic User, fixture toàn bộ API; `resource-before-restart.json`/`fixture-http.jsonl` giữ identity. Dừng chính PID 27304 để mở rộng fixture profile mode.
- Restart: PID **21404**, cùng ports; `resource-restart.json`, `resource-start.json`, `resource-before-release.json`. Start-Process dùng WindowStyle Hidden, stdout/stderr chỉ artifact. `server.stderr.log` trống, stdout ghi compile/route200.
- Close đúng own tab bằng `t3_preview_close`; dừng chính PID **21404**. `resource-release.json`: cả hai PID không còn, **0 target listeners tại 3137/3138**. Không dừng process theo wildcard/port, không chạm user processes/DB service/tab, không cleanup file.

## Validation not performed

- **Blocked:** startup API thật vào local user DB vì auto-migration + history/source mismatch; không bypass/repair schema. Metadata SELECT không chứng minh schema/entity parity đầy đủ.
- **Not run:** HTTP thật ASP.NET/controller/auth, JWT/refresh/session thật; SQL persistence/concurrency/transaction/fault rollback; paid AI, Google, PayOS live/sandbox/webhook/submission; role Admin; production logs/tunnels/deploy.
- **Not run:** NCKH đổi model stale data, mutation-success + reload-failure rendered, out-of-order races. Những nhánh helper/service do agent UI/backend phụ trách, không nâng thành runtime browser tại đây.
- **Not run:** toàn bộ routes/HTTP statuses/validation/timeout/network-offline/CORS/TLS/malformed-response branches, mobile/responsive, production build/lint/broad suites, runtime legacy script scenarios. Không cần cho 5 tái hiện này và không có product change để certify.
- **Not run:** independent review trong agent này. Root điều phối reviewer riêng. Đây là evidence đại diện, không phải full-system audit complete/fix/integration/release.

## Risks/Deferred items và Next recommended step

Không khẳng định hồ sơ đã bị ghi đè: chỉ xác nhận form trắng và Lưu enabled; **không thực hiện PUT**. Không khẳng định tài khoản thật chưa liên kết, thanh toán trùng, Google permission lỗi, DB hỏng hay raw credential leak.

Root nên hợp nhất profile/security/NCKH-list với findings UI để tránh nhân đôi ID; ưu tiên giữ `unknown/load failed` thay vì `not found/unlinked/empty`, và bảo toàn HTTP identity tại shared helper. Đây là đề xuất, chưa có remediation approval. Muốn mở rộng API/SQL cần test database có quyền ghi rõ ràng và schema phù hợp hoặc host harness tách startup auto-migrate; không cần bí mật provider cho browser fixture này. Future harness cần xác minh cache-output isolation trước chạy lại; không mặc định `conf.distDir` hoạt động ở custom Next dev server.
