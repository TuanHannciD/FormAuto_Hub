# Kiểm chứng Task6 — runtime và diễn tập cutover

Ngày 2026-11-05. Workspace `D:/TinHoc/FormAuto_Hub/.worktrees/fah-history-001`, nhánh `fah-history-001`, base `df5cce54f4a8516ab9dd0bf2b5dff561c1cb8d5c`. Tất cả tài khoản, project và receiver dưới đây là synthetic.

## Đã kiểm chứng

- Preflight SQL localhost integrated auth xác nhận `DESKTOP-TS5JR7L` cho `FormAutoHub_History_Safety_20261104` và `FormAutoHub_History_Baseline_20261105`; mỗi DB có hai migration history và 39 user tables. API tự migrate báo schema đã mới nhất. Snapshot leaf-file là `task6-start-snapshot-20261105.sha256`.
- API owner: `FormAutoHub.Api.exe` Release PID 14444, loopback `127.0.0.1:5305`, cwd API cô lập, record `task6-api-owner.json`; `/health` 200. API dùng DataProtection key local, signing material sinh cục bộ, Safety DB chính xác, CORS web owner và AI adapter `Deterministic`.
- HTTP có xác thực: `task6-api-http.json` có 61 assertion cho no-session, User, other owner, Admin, ownership/version fence, rules, AI default/custom/partial/zero, phân trang/eviction 20 run, dashboard, history recovery và chặn gửi production-config. Google send trả `FormEvidenceUnavailable`; không gọi provider và không ghi job/hold.
- SQL Safety độc lập: `task6-safety-complete.log` 56/56 (direct-rule SQL chạy qua History fixture strict); phạm vi trước đó `task6-safety-full.log` 36/36. Baseline `task6-baseline.log` 1/1. `task6-final-independent-sql.log` kiểm tra ledger synthetic, 20 run tái sử dụng, không job/hold do fail-closed và đúng identity SQL.
- Cutover synthetic: `task6-cutover-final.log` 2/2. `task6-cutover-transitions.jsonl` ghi `RunnerAcknowledgedAt`, `FinishedAt`, active predicate và receiver-call cho success, rejection và Unknown. v2 `SettleAttemptAsync` giữ payload/evidence bất biến, audit actor/reason và replay idempotent. Legacy no-hold giữ `OutcomeUnresolved`, không tạo hold/ghi đè ledger và `ReceiverCalls=0`.
- Web: Next production PID 9668, `next start -p 3305` đúng cwd cô lập, API origin `http://127.0.0.1:5305`, record `task6-web-owner.json`; build exit 0, lint 0, auth 10/10, node 112/112. `task6-browser-runtime.log` 5/5 browser thật: owner reload/detail/mobile, other owner/Admin/no-session, đổi account/logout, chunks 200 và không console error. `task6-browser-actions-r2.log` 1/1 AI preview/confirmation và rules một action; cả hai send fail-closed 409, không gọi Google. Tab incognito mới `tab_2_6f94ae41-270e-4168-b9a1-6e0f9bbc9735`; tab Task5 giữ nguyên `tab_1_6f94ae41-270e-4168-b9a1-6e0f9bbc9735`.
- Full .NET: `task6-final-full.log` 393 passed, 0 failed, 49 skipped khi không bật opt-in mặc định. Safety (56), cutover (2) và Baseline (1) bắt buộc đã chạy riêng; skip không được tính thành pass.

## Chưa chạy / Bị chặn

- Gửi Google thật, receipt provenance, operator reconciliation và production activation: Blocked theo giới hạn P1/O1; synthetic receiver chỉ chứng minh phần mềm.
- Service/operator mutation cho legacy no-hold: Blocked/Deferred; không có implementation hay public endpoint và Task6 không tự tạo. Evidence legacy chỉ đọc và vẫn fence.
- SQL còn chưa chạy: đúng6 method entry `TopupEvidenceSqlServerTests` cần DB lịch sử riêng, là normalization không liên quan và vẫn Not run. 43 skipped method entry khác đã chạy owned: direct9 mở thành20 case; submission8 mở thành13; history12, reservation7, consumer4, cutover2, Baseline1. Tổng owned56+2+1=59 case; direct20 đã nằm trong56. Xem `task6-skip-map.json`.

## Command và failure được giữ

Tại repo dùng `dotnet build FormAutoHub.sln -c Release --no-restore`, `dotnet test FormAutoHub.sln -c Release --no-restore`, và exact-class filter ghi trong TRX/log. SQL opt-in `FAH_HISTORY_SQL_SERVER=localhost` cùng Safety/Baseline chính xác. Tại `apps/web`: `npm run build`, `npm run lint`, `npm run test:auth`, `node --test tests/*.test.cjs`, `node node_modules/typescript/bin/tsc --noEmit --incremental false`, và Playwright `-c playwright.history-runtime.config.ts`. Final lint/types exit0.

Cutover harness ban đầu fail do JSON decimal in-memory khác scale SQL (`-1` so với `-1.00`); assertion nay so snapshot đã persist độc lập trước/sau. Không sửa production code. Browser action đầu dừng ở nút AI bị khóa đúng chủ đích; error context cho thấy bước “Tải lại cấu hình AI” sẵn có, rerun đã thực hiện và pass. Giữ mọi failure artifact. NU1603 và hai account-hook lint warning cũ không đổi.

## Ghi chú xử lý

Một diagnostic đăng ký ban đầu tạm chọn trường refresh token để xử lý cục bộ; cả ba session đã revoke ngay qua API. Không có marker token trong `artifacts/reports/fah-history-001`; session/config hiện chỉ ở file task-local bị ignore và không chép vào report.

## Kiểm lại cô lập harness R1

Discovery Playwright mặc định loại runtime/SEO; matcher runtime riêng liệt kê6 test mà không đọc fixture. Khi thực thi runtime phải có `FAH_HISTORY_RUNTIME_OPT_IN=1`, config riêng và baseURL owned3305. Tạm giữ fixture ngoài path thường: default `--list` pass242 tests/29 files, runtime riêng pass6/1; TypeScript pass. Chỉ discovery, không chạy lại runtime mutation. Log và RED được giữ trong checkpoint R1 của TASK6_REPORT. Chờ fresh scoped R2 review.
