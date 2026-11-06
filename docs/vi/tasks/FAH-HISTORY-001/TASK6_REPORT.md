# Báo cáo Task6 — runtime, diễn tập cutover và bàn giao

Trạng thái: **Đã thu thập runtime evidence local; chờ independent whole-branch review.** Writer `/root/history_task6`, `gpt-6.1-sol/high`, không nested agent. Base `df5cce54f4a8516ab9dd0bf2b5dff561c1cb8d5c`; không commit, deploy hay release.

## Tóm tắt và file

Task6 bắt đầu từ manifest Task5 R2 PASS (`5a8d7f4e...46134fcd2`) và snapshot 2204 leaf-file. Chỉ dùng API5305, web3305 owner và hai DB history localhost chính xác. File Task6 mới gồm SQL cutover rehearsal, direct SQL opt-in chỉ cho test, browser config/spec runtime thật, report validation/handoff và supplement contract lịch sử đã triển khai. Source/evidence/config local trước đó được giữ nguyên.

## Đúng phạm vi

Runtime kiểm owner history, retention20, pricing tách, AI deterministic, boundary xác thực, dashboard credit, AI confirmation, rules một action, production Google fail-closed và v2 settlement synthetic. Không thêm public endpoint, bypass, provider switch hay operator mutation legacy. Interface reconciliation legacy còn thiếu được giữ Deferred/Blocked theo ruling của root.

## Đã kiểm chứng

Xem [VALIDATION](VALIDATION.md) để có ma trận command/artifact. Các điểm chính: HTTP API61 assertion; SQL Safety56/56, cutover2/2, Baseline1/1; .NET build exit0 và full393/0/49; web build/lint exit0, auth10/10, node112/112; browser thật runtime5/5 và actions AI/rules1/1. SQL độc lập xác nhận ledger synthetic, 20 run tái sử dụng và không hold/job do fail-closed. Receiver synthetic được gắn nhãn, tách khỏi Google evidence.

## Chưa kiểm chứng

Google receipt/delivery thật, paid AI, payment, production activation, operator reconciliation và nhóm SQL fixture legacy không sở hữu: Not run/Blocked. 49 skip opt-in mặc định được liệt kê trong `task6-skip-map.json`; ca owned chạy riêng không tính là pass của skip.

## Rủi ro và Deferred

Success synthetic không chứng minh Google delivery. Unknown vẫn hold/fence. Chưa có quyền reconcile legacy no-hold; ledger/grouping lịch sử giữ nguyên. API/web process và tab browser còn giữ để review; chỉ dừng sau khi xác minh đúng owner.

## Bước tiếp theo

Root thực hiện fresh independent whole-branch review từ manifest đóng băng và report cặp này. Nếu không còn Critical/Important, root quyết định tích hợp theo finishing-branch workflow; report local không tuyên bố release.

## Sửa I1 independent R1 — cô lập runtime harness

R1 phát hiện Important: Playwright config mặc định có thể thu spec runtime thật, đọc fixture ignored ngay khi import và kế thừa retry/trace. RED `task6-r1-discovery-red.log` tái hiện default `--list` fail ENOENT khi fixture vắng, không chạy test body hay khởi web server.

Config mặc định nay ignore cả SEO và `history-runtime.spec.ts`; config runtime riêng giữ retries0/traceoff. Fixture runtime chỉ đọc lười trong test body; beforeEach guard yêu cầu config riêng, baseURL owned và `FAH_HISTORY_RUNTIME_OPT_IN=1` trước mọi body/fixture/session read. Discovery không cần secret/fixture.

GREEN khi tạm giữ fixture ở path riêng và khôi phục bằng finally: default `--list` exit0,242 tests/29 files, không runtime/SEO; dedicated runtime `--list` exit0,6 tests/1 file; TypeScript exit0. Evidence: `task6-r1-default-discovery-green.log`, `task6-r1-runtime-discovery-green.log`, `task6-r1-types.log`, `task6-r1-discovery-exits.json`. Không API mutation, browser action, provider call, restart hay chạy lại toàn runtime cho fix cô lập. Evidence runtime cũ giữ nguyên; cần fresh scoped R2 review.
