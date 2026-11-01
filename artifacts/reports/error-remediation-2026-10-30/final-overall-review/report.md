# FAH-ERR-001 — Review độc lập tổng remediation ERR-001–024

Reviewer `/root/review_ab_resume`, root dispatch rõ `gpt-6.1-sol/high`, không agent con. Ngày 2026-10-30, shared checkout `D:/TinHoc/FormAuto_Hub`, HEAD gốc `a19f7a2f3dc1bc54ff645d662d94fc614439256a`. Chỉ đọc source/diff/evidence và ghi artifact review; không sửa production/tests/docs, chạy runner/browser/build/SQL/process/provider, commit hoặc cleanup. Sole runtime owner là `/root/runtime_resume`.

## Summary

**Review tổng độc lập: accepted cho cả 24 ID ở phạm vi remediation local đã duyệt; source, required checks phù hợp và paired docs candidate đều được chấp nhận. Không còn P1/P2 source mở.** Vòng review tổng fresh đã phát hiện thêm một consumer core Google callback bị sót khi shared error chuyển sang `ApiError`; root giao sửa, giữ valid RED, và reviewer đã review lại source/test/actual GREEN mới. Finding này thuộc ERR-001/003/018, không tạo ID25. Kết luận từng ID bên dưới chỉ có nghĩa acceptance local ở boundary đã kiểm, không phải live provider, integration hay release.

Review tổng đối chiếu source hiện tại và consumer xuyên A–H, không chỉ cộng các review packet trước. Build NCKH dead-branch cuối cũng đã được xem trong rendering unit đầy đủ, cùng build-r2 và smoke sau restart. Không có thay đổi schema/migration trong remediation; baseline DB-sync uncommitted được giữ riêng.

## Files changed và snapshot review

Reviewer chỉ thêm báo cáo này. Source/test/helper được chốt bằng `runtime/final-verification-source-manifest.json`: **343 file, SHA256 `7183a21734fe3094a8aa040a56ca10274d285f2e1a6b8a16fc816e4f952d9fa0`**. Reviewer tự tính lại toàn bộ 343 hash sau callback fix: **0 mismatch**. Manifest trước callback 341/hash `6e7c55...` là lịch sử, không dùng làm identity cuối.

Phạm vi sửa được khai báo bởi các packet A/B/C/D/E/F/G/H, fix follow-up và `dossier-checkpoint/owned-delta-from-baseline371-final.json`: **80 file =52product+22tests+2contractdocs+4tooling**, SHA256 `4295ce62513fd9f6a8a01f6ff6bfb3c609867989dc50d7d877dfe6a3d0aefe2c`. Reviewer tự rehash80file:0mismatch;75overlap runner343 khớp/năm ngoài scope runner.57hash đổi so baseline371,23path ngoài scope baseline không tự chứng minh file mới. Universe80 khác universe343 của runner hay baseline371. Không lấy `git status` làm danh sách thay đổi mới. Baseline371 đã có csproj/DB-sync migrations/tests/tools; các file đó không thành implementation mới của ERR. Đối chiếu baseline trước callback cho thấy chỉ hai generated config ngoài ownership; sau runtime restore, cả hai khớp byte gốc baseline371:

- `apps/web/tsconfig.json`: `5bb0ac200c1934a273d74e52785f4c36fa62c082d766cab15cdc8484ff39bf15`.
- `apps/web/next-env.d.ts`: `f4e8976c19fc926644d72610bf1058bd6bf52add97e46a02bc0b912a751625c0`.

Proof `runtime/auth-callback-final/generated-config-restoration.json` phân biệt đúng restore CRLF/owned dist reference với checkpoint LF `c70679...` trước đó. Không claim checkpoint LF là byte baseline371.

## Findings và fix trong review này

**P2, addressed — core `/auth/callback?id_token=...`.** Trước fix, catch ở `apps/web/app/auth/callback/page.tsx` tìm `409`, `401`, `password` trong `.message`; `ApiError` mới tạo thông báo tiếng Việt cố định nên POST Google LinkRequired409/InvalidCredentials401 vào sai fallback, mất hướng dẫn hiện hữu. Đây là regression consumer trực tiếp của shared C, được phát hiện khi rà soát toàn bộ status/message consumers. Controller hiện hữu thực sự trả 409/401; không cần live Google để chứng minh mismatch.

`auth-callback-fix-r1` sửa đúng một catch: nhận unknown, kiểm `ApiError`/kind http/POST/exact `/api/auth/google`, rồi 409/401; unknown/wrong path/method/message-only dùng câu dự phòng an toàn. Query states, auth/session success path, HTTP/DTO không đổi. Callback hash cuối `4f4058cc9876d6313e1960a8e6122f9e7fc5c1156db2f61a91f8e4f4d5053e07`. Node mới hash `60a3935e5e0abbc19de70ea2ff580554b8ba03471fbe5f7ce04960a08b20d862`; browser fixture cuối `dc210339282b489f82fcdd30d759db054eaa7b537610d3d4491b38b92065528c`. Full copies/diff được đọc và live hash khớp.

Valid RED3 là ba assertion fail trước production; lần RED đầu thiếu VM exports là harness failure riêng, không dùng làm valid RED. Fresh Node27 gồm3 callback+15shared+9auth đều pass. Browser đầu10 có7pass/3strict locator fail vì Next announcer; corrected locator chỉ scope AuthShell region, giữ exact copy/session/privacy/chunk assertions. Targeted callback3 pass, không gọi full10 rerun green. Fresh lint/build exit0; browser chạy sau restart owned web.

**P3 mở:** không phát hiện source finding P3 mới đủ bằng chứng. Hai lint warning và cold H health failure được giữ là giới hạn dưới đây, không tự biến thành một defect đã chẩn đoán hoặc pass sạch.

## Scope alignment / review tích hợp

- **C → auth/NCKH/blob/history:** JSON và blob giữ HTTP method/path/status, giới hạn metadata và không chuyển title/detail/plain/HTML/raw validation ra UI hoặc console. Abort giữ semantics; shared toast không lặp SessionExpired. Google401 discriminator chạy trước JWT refresh, giữ exact existing authorization details và một lần refresh/rotated-session guard. Core callback sót đã sửa. Không còn status/password substring consumer cùng loại trong các app/component/lib đã trace. Login401 vẫn generic; privacy404 không yếu đi.
- **A/G → submission/NCKH persistence → D:** attempt được ghi trước external call, known returned result lưu trước call tiếp theo; bounded separate token lưu outcome sau cancellation. Không outer transaction giữ qua network, không tự retry mutation, inner cause và support IDs giữ. Failed local attempt không đồng nghĩa remote rejection; UI chỉ nhận exact uncertainty message, đưa job/attempt/response IDs, lọc raw text và ẩn lời mời resend. Remote-create audit giữ remote/model identity trước questions/import. SQL fresh-context chứng minh durability, không suy từ EF InMemory.
- **B → DTO/analytics → D/history → credit:** logger chỉ metadata operation/project/run/batch/status/count/cause type; không log raw request/response/exception object. Raw persistence giữ contract cũ, không redesign retention. Public reason được dựng lại từ recognized cause, unknown/historical text fallback. Hai optional nullable trailing `errorMessage` DTO là delta đã duyệt, TS/forms/history và AI/VI contract guide tương thích. Failed zero-debit, partial/success dùng CreditService/CreditTransactions; SQL6 đối chiếu run/usage/balance/ledger/IDs/serialization qua context độc lập.
- **G typed Google → services/controllers → E:** config/auth/forbidden/notfound/rate/transport/invalid data giữ safe kind/operation/status. Nested null guards ở form items/responses/answers nằm trong typed boundary. Collect vẫn lưu Failed log rồi rethrow original; controller chỉ map typed cause; user cancellation không bị đổi thành provider failure. NCKH Google auth vẫn tách JWT.
- **D/E/F state/receipt:** mutation confirmed fields được giữ trước refresh GET; read retry không replay POST/PUT. AI continuation giữ preview trước, cumulative cost/count/balance và IDs; pending content read khóa action cần snapshot. F approve giữ existing four-field receipt. Failed profile/search/list/dataset không thành empty/unlinked/valid snapshot; E model/request/unmount ownership cùng six-slice validity chặn mutation từ stale data. Required controls/preview/confirmation/count1–100/sequential10 giữ nguyên.
- **G validation / D ranges:** service giữ nguyên cause syntax/type/constraint và scope validation; controller package chỉ map known input validation400, không catch mọi exception. UI range defaults ghi vào state lúc mode chọn; clear giữ rỗng, order/endpoints/step đúng current backend5–120, không thêm rule chia hết5; legacy valid step7 được giữ. Minimal E build fix chỉ bỏ conditional không thể tới trong branch known-linked.
- **H:** bounded env-owned smoke yêu cầu route/heading/button và fatal pageerror/JS/CSS failures. Chỉ font navigation `net::ERR_ABORTED` được bỏ qua;42 controls giữ JS/CSS abort, CSS404, font404/reset fatal. Không analyze/generate/submit hoặc hứa full-system pass.

## Acceptance từng ID

Mỗi dòng là **accepted tại boundary ghi rõ**; số suite có giao nhau, không cộng thành tổng test duy nhất. Paths evidence tương đối với `artifacts/reports/error-remediation-2026-10-30/runtime/`.

| ID | Disposition / bằng chứng chính | Giới hạn |
| --- | --- | --- |
|001|Accepted typed login/core callback; C15/auth9, callback27, C5+callback3 browser, Program auth401/refresh|Không Google login thật|
|002|Accepted safe existing field/trace metadata; C15, actual MVC400 trong Program25|Không envelope/field UI mới|
|003|Accepted raw/network/invalid-body filtering và callback consumer; C15/C5/callback3, logger tests|Không suy toàn app không có lỗi ngoài scope|
|004|Accepted shared JSON/blob identity, auth discriminator; C tests và actual owner/admin blob200, privacy404/User403|Google export thật Not run|
|005|Accepted safe analyze/Failed UsageLogs/Credits0; G63/87, Program400+independent SQL2usage|Không Forms thật|
|006|Accepted PayOS raw-body removal, malformed/missing-link; G63/87 và payment regressions trong full291|Fake HTTP, không charge|
|007|Accepted outcome wording/status/count; A14/36, SQL9 submission known/uncertain usage|Pause/cancel business states ở unit|
|008|Accepted durable attempts/results/collect/remote-ID audit; A14/36+SQL9 fresh contexts, D uncertainty UI|External boundary fake, không replay|
|009|Accepted bounded AI logger metadata; AI48 marker/parallel batch tests+full291|Raw DB persistence/retention không đổi|
|010|Accepted typed Google/config/nested-null; G6/63/87, SQL collect, E55/callback postrestart|Không live OAuth/provider|
|011|Accepted safe reason mapper→2DTO→D/history; AI48, D browser, SQL6 serialized DTO/history/zero-debit|Direct controllers, không HTTP fake-provider host|
|012|Accepted cause-specific current rule validation; G63/87, actual rule400/no SQL write|Không constraint mới|
|013|Accepted package known-validation400; actual Admin create/update400/no write/User403, admin5 browser|Không package create mutation smoke cần thiết ngoài invalid path|
|014|Accepted confirmed absence404 vs unknown read/draft/guard/retry; D8+10passed in D13|Mock browser đúng boundary|
|015|Accepted confirmed result before GET/retry-only; D continuation, F22/F23+admin5, SQL AI continuation/ledger|Không browser→real-payment-ledger E2E claim|
|016|Accepted privacy404 vs load503/network+route ownership; F23, actual owner200/other404|503 browser fixture|
|017|Accepted model/request/slice ownership and write guard; E9/new4/existing55, Ebuild4 postrestart|Không nghiên cứu user thật|
|018|Accepted contextual status/path/discriminator, core callback residual fixed; C/auth27, E55, callback3|Không raw cause/account-owner inference|
|019|Accepted scoped Vietnamese leaves/local-config wording; G tests, D split/browser/E55/admin5/F23|Check cấu hình không claim connectivity|
|020|Accepted env/assertion/nonzero/safe bounded helper; H42+actual3ESM|Cold health failure chưa rõ cause vẫn giữ|
|021|Accepted unknown/error/empty separation and write/search guards; E4/55, F23/profile postrestart|Không claim profile-save SQL E2E|
|022|Accepted clipboard success/reject/absent/manual fallback; F22/F23 keyboard/repeat/unhandled assertions|Synthetic clipboard only|
|023|Accepted safe known/missing/ordinary/uncertain reasons và existing IDs; D10passed +supplemental mixed4/1/3|Không gửi Google thật|
|024|Accepted clear/retype/default state/legacy valid step7/payload guards; D8+corrected target3/formURL1, actual rule400|D13 split10pass+target4, không full13 rerun|

## Validation performed / required gates

Reviewer đọc actual logs/TRX/JSON và relevant harness assertions; không tự chạy lại unchanged tests.

- Backend Release build exit0; `final-backend/all-tests.trx`/test.log:297 total=291pass/6skip/0fail. A14+36, AI48, G6+63+87, C15+auth9, D8, E9, F22, H42 có actual GREEN log; các bộ giao nhau.
- Fresh final callback `auth-callback-final/green/{node,lint,build}.log`:27pass, lint/build exit0. Lint đúng hai numeric-ref cleanup warning, không lint-clean. Baseline NU1603 vẫn ghi.
- Browser actual: CEF32=30pass/2fixturefail; D13=10pass/3locatorfail rồi corrected target4pass; F fix28pass=23+admin5; motion2; E55; postrestart5; E buildfix4; callback initial10=7pass/3locatorfail rồi target3pass. Broad83 giữ69pass/14fail, các14 failure đã đối chiếu với target fixes/reruns tương ứng; không claim full83 rerun.
- Actual Program25: real User/Admin auth/JWT refresh/MVC400/role403/privacy404/blob200/invalid package/rules/analyze400; SQL no-write/usage aggregates. `sql-durability-harness/verification.json`9 cases và Program.cs kiểm fresh context, exact one usage/no credit mutation, known/unknown call counts, remote audit before next outbound.
- `sql-durability-harness/ai-sql-verification.json`6 executions/5 scenarios và AiSqlSmoke.cs: actual service/CreditService/controller DTO, fake adapter, fresh SQL ledger/balance/history/IDs; không HTTP hosted fake provider. Cloneid8, pending migrations0/modelPendingfalse fresh guard; không sửa schema/main.
- H42 và `legacy-esm-final/results.json`3exit0; JS/CSS health controls giữ. Earlier unexplained cold root-admin health failure không bị gán thành font cause khi thiếu diagnostic tại attempt đó.
- Owned resource proofs: actual API release, `auth-callback-final/release.json` verified PID/commandline chains trước stop/listeners[]; runtime báo final T3 list[]; generated config exact original371 hashes reviewer tự đọc lại. Cache/log/DB/fixtures/worktrees được giữ, không cleanup.

## Validation not performed / Risks / Deferred items

Sáu SQL migration opt-in tests **Skipped**, không thành pass bởi SQL9/AI6. Remediation không đổi schema/migrations nên không biến chúng thành blocker do source change này. Live Google/OAuth/AI có phí/PayOS/charge/submission/production/tunnel/deployment **Not run**, ngoài approved safe local acceptance; không tự đặt live-cost gate mới. Browser API fixtures, direct SQL services và actual Program là ba mức khác nhau; không claim browser→real API→provider toàn trình.

Hai warning profile39/security80 do numeric ref cleanup `current++`: rule hiện nhận assignment để phân biệt app-managed ref nhưng bỏ qua UpdateExpression. Latest generation invalidation đúng mục đích, root ruling giữ source/no suppression; noise còn nguyên, không gọi sạch lint. H cold health failure unresolved cause còn là giới hạn reliability của smoke, dù final settled3 pass. Failed history/valid RED/harness failures được giữ. Không có P1/P2/P3 source mở mới được chứng minh sau fix callback.

## Tài liệu / Next recommended step

Đã đọc và đối chiếu 12 docs candidate `docs/{ai,vi}/tasks/FAH-ERR-001/{INDEX,VALIDATION,COVERAGE,REMEDIATION_PLAN,REMEDIATION_LEDGER,REMEDIATION_VALIDATION}.md`: approval/scope/ALL24, runtime boundaries, residual callback addressed, history supersession, config provenance và limits có cùng cam kết AI/VI. Không phát hiện discrepancy cần sửa. Hai API_CONTRACT_GUIDE cũng đồng nghĩa về exact optional safe DTO delta.

`dossier-checkpoint/static-validation-final.json` SHA256 `62e3118a9a007f9d6578d891599fbfc435c3befbdb7625ea2541b3200390e0f9` ghi12file hashes/UTF-8/link/anchor/24-ID parity/0failures. Reviewer tự rehash12doc:0mismatch. Đây là static documentation evidence, không thay runtime. Paired REMEDIATION_RUNTIME khớp SHA256 `e53abed1659eb3479072659c721b8579483bab5fd326768a044160682b191c87`; nội dung sửa đúng provenance C706 later-LF và exact original config bytes.

**Gate review tổng fresh đã thỏa ở snapshot này.** Docs candidate còn ghi “chờ review tổng” vì freeze trước verdict; root có thể cập nhật đúng hai ngôn ngữ bằng link báo cáo/verdict này rồi chạy lại static docs check, không cần source/runtime wave mới khi byte implementation không đổi. Các skip/warning/Failed history/Not run vẫn phải giữ. Không suy thành integration/release, toàn hệ thống không còn bug, hay chọn phase mới. Không yêu cầu commit/push/deploy/cleanup.
