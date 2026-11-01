# Review addendum — Stage B SQL failure, supersedes GO trong report.md

2026-10-29. Reviewer độc lập `gpt-6.1-sol/high`, không children. Evidence mới từ sole runtime owner đã đọc trực tiếp sau khi report.md được freeze; không ghi đè report/evidence cũ.

## Findings theo severity

**P1 — BLOCKING: candidate migration không parse được trên SQL Server.**

`src/FormAutoHub.Api/Data/Migrations/20261029142938_NormalizeTopupEvidenceColumnLengths.cs:53` và `:56`: hai câu `SET LOCK_TIMEOUT @PreviousLockTimeout` dùng biến trong grammar yêu cầu literal timeout. Lỗi nằm trong cả happy path lẫn CATCH. SQL Server parse entire batch nên branch CATCH chưa chạy vẫn không tránh lỗi. Generated `normalization-only.sql:39/:42` và `current-chain-idempotent.sql:1370/:1373` mang nguyên lỗi.

Evidence actual `runtime/clean-reviewed-chain-01.log`: sqlcmd exit1 theo runtime owner; trực tiếp đọc được hai `Msg 102, Level 15, State 3`, `Incorrect syntax near 'LOCK_TIMEOUT'` tại batch lines1361/1364. Root/runtime báo clean DB chỉ có history table rỗng; chưa độc lập query SQL trong reviewer. Main không được apply; trạng thái này do runtime owner báo, không giả là reviewer đã query.

Correction yêu cầu: fresh fix implementer sửa cơ chế bounded lock timeout và restore setting bằng T-SQL hợp lệ, không thay byte/transaction/shape/index/history/Down contract; freeze patch/source/SQL manifests mới rồi fresh independent review. Không sửa trực tiếp frozen SQL hoặc rehash evidence để né source defect. Có thể dùng bounded numeric construction đã validate để restore, hoặc một phương án tương đương đã SQL-test; reviewer không tự viết production fix.

**P2 — vẫn mở:** writer test hiện Widen + Up trước khi writer bắt đầu, nên retained Sch-M có thể khiến test pass mà chưa cô lập được lock giữa guard/ALTER. Xem finding đầy đủ trong report.md. Có thể bổ sung runtime artifact trên owned clone với exact copied lock/check segment và DMV proof, hoặc sửa test + freeze/fresh review.

## Summary / verdict hiện hành

- **FAILED: mã/SQL candidate hiện tại; NO GO integration17files.** Không sao chép candidate này vào parent product.
- **Rút GO chạy thêm current candidate SQL** sau reproduced syntax failure; clone state/evidence giữ nguyên để fix/retry có checkpoint rõ. GO ban đầu chỉ cho rehearsal đã giúp phát hiện lỗi, không cấp main apply.
- **Main apply NOT YET**; actual SQL13cases zero skip, clean/restored/repeat/history/preservation/independent rollback/unknown shape/concurrency và main wrapper/hash/cutover vẫn bắt buộc sau fix.
- Backup/restore StageA, source hashes và offline checks đã Verified không biến mất, nhưng không chứng minh candidate SQL chạy được. Không claim DB synced/Done/integrated/released.

Candidate FAILED vẫn giữ đúng immutable identity:

| Artifact | SHA-256 |
| --- | --- |
| Patch | `5b6c760e3ab8ceafa1da1b2e3a726501f90b8e967a78708c2deb432fa9765ee3` |
| Incremental SQL | `b6efcbbd73c5cc541877b53da3a3881b3a42903e94f704c86693b43a9eab43bd` |
| Full idempotent chain | `304eeb5f71ffa35451237f81100123bb9a0b42297b592dd2952ce09fa3432b90` |
| Original pre-runtime report.md | `a75ff8c021651c25459008539952989ea22ae7457b00dc2cc02ca7c7028a22d3` |

## Vì sao offline pass không phát hiện

Reviewer23focusedtests và build chạy thật đều pass, nhưng provider GenerateScript chỉ tạo text; không gửi SQL tới SQL Server parser.5SQLgroups bị author routine suite skip vì chưa bật owned SQL fixture. Hash equality chỉ chứng minh cùng bytes; không chứng minh syntax. Reviewer static inspection ban đầu đã bỏ sót grammar này; actual runtime gate phát hiện trước main. Fresh fix cần SQL execution regression có bật fixture, không chỉ assert substring hoặc regenerate thành công.

## Files changed / Scope alignment

Chỉ tạo `code-review/report-stage-b-failure.md` và `verification/stage-b-syntax-failure-observed.log`; report.md trước đó được bảo toàn nguyên hash. Không sửa product/tests/SQL/evidence implementation hoặc runtime, không SQL connection/process/cleanup/commit/install. Approved two-column scope không đổi; không activate23errorfixes/provider/index redesign.

## Validation performed / not performed

**Verified:** đọc actual failure log, đối chiếu exact bad SET source/generated lines và frozen hashes; previous23offlinepass/build/export checks có evidence riêng. **Failed theo runtime output:** clean current-chain SQL syntax. **Not run trong reviewer:** SQL parser/DB query/apply/rollback/concurrency/HTTP/browser. Tình trạng main/clone cần runtime giữ ledger và xác minh độc lập.

## Risks/Deferred và Next recommended step

Root cấp fresh fix implementer trong isolated snapshot, preserve all failed evidence; xuất candidate mới. Fresh reviewer kiểm SQL thật sau repair và giải quyết P2 bằng chứng. Safety DB CREATE wrapper là review riêng, không bị coi đã GO vì source migration review. Parent integration agent phải chờ review mới explicit GO17files. Main checkpoint còn nguyên; không yêu cầu user cấp lại quyền sửa lỗi/rehearsal local đã có.

