# FAH-ERR-001 — Báo cáo rà sâu

2026-10-30 · HEAD `a19f7a2f3dc1bc54ff645d662d94fc614439256a` · **Review độc lập nhận bằng chứng có giới hạn; check dossier hiện tại ghi riêng. Kiểm chứng toàn hệ thống chưa đủ.**

## Tóm tắt và quyền thực hiện

Follow-up được duyệt mở rộng rà sâu thông báo lỗi qua backend, UI/helper dùng chung và các đường runtime đại diện. Root điều phối, tổng hợp bằng chứng được giao; các agent Sol riêng đọc mã, tái hiện, phản biện độc lập và viết hồ sơ. Chưa duyệt triển khai sửa lỗi. Đồng bộ DB local được duyệt riêng, theo [FAH-DB-SYNC-001](../FAH-DB-SYNC-001/INDEX.md).

Danh sách sau khử trùng lặp được review độc lập nhận có **24 nhóm: 2 P1, 20 P2, 2 P3**. Giữ ID ERR-001–020, kèm đính chính bên dưới; [ERR-021–024](DEEP_AUDIT_FINDINGS.md) bổ sung trạng thái dữ liệu chưa biết,phản hồi sao chép lỗi,nguyên nhân lượt gửi bị bỏ khỏi chi tiết và lệch hiển thị/config ngày giờ. Đây là lỗi/rủi ro hiện hữu, chưa sửa và không khẳng định sự cố production. Đính chính bắt buộc ERR-012/015 bên dưới hợp nhất [báo cáo review](../../../../artifacts/reports/error-audit-2026-10-29/deep/review/report.md) độc lập.

## UI còn lại được chấp nhận và ERR-024

[Review UI độc lập](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui-remainder-review/report.md) nhận một nhóm P2 mới ERR-024: xóa trường ngày/giờ lưu config rỗng nhưng input hiện fallback. Probe component/helper/save-handler gốc tái hiện mặc định nhìn thấy với POST rỗng; backend validation chỉ trace source, chưa chạy HTTP. UIR-002 gộp ERR-019 (Option2/3/thuật ngữ triển khai public); UIR-003 gộp ERR-021/017 (dataset chưa biết hiện rỗng, vẫn có warning parent); UIR-004 gộp ERR-021 (admin tìm user lỗi hiện không có/stale options; giữ version guard hiện hữu). Không thêm nhóm trùng, chưa xác nhận cộng nhầm credit/persistence/side effect provider. Sửa lỗi còn Deferred.

## Normalization main và audit thật tiếp tục — hiện tại

**Verified main apply thật UTC2026-10-29T19:42:12 (ICT2026-10-30):** attempt03 dùng wrapper/helper NoPooling đã review chính xác,cùng incremental R1 không đổi. Main current13/applied14,pending0/modelPendingfalse,POST compatible,canonical400/100bytes;chỉthêm planned migration,count/PK/full-row hash33bảng business không đổi,giữ hai index legacy exact INFO. [Kết quả execute](../../../../artifacts/reports/db-sync-2026-10-29/runtime/main-cutover-result-03.json),[POST thật](../../../../artifacts/reports/db-sync-2026-10-29/runtime/main-cutover-post-03.log). History14/source13 là legacy đã biết đúng kỳ vọng,không blocker. Program/Migrate startup/read smoke main thật nay Verified:health200,profile anonymous401,route thiếu404;PID24496/5247 riêng đã dừng theo yêu cầu,fingerprint34bảng sau migration không đổi qua startup. [HTTP proof](../../../../artifacts/reports/error-audit-2026-10-29/deep/api-sql/main-http-results.json). [Review cuối độc lập](../../../../artifacts/reports/db-sync-2026-10-29/final-review/report.md) nhận DB sync giới hạn và audit đại diện;không release/full-system.

Attempts01/02 dừng trước normalization bởi guard không đổi;attempt02 chứng minh session fingerprint pooled riêng. Helper NoPooling riêng/attempt03 đã có [GO độc lập mới](../../../../artifacts/reports/db-sync-2026-10-29/main-apply-review-attempt03/report.md);giữ helper gốc/evidence lỗi,không nới guard. [Lịch sử attempt](../../../../artifacts/reports/db-sync-2026-10-29/runtime/main-attempts01-02-report.md). Candidate SQL Msg102 ban đầu giữ Failed/đã rút;R1source17integration/B2SQL16pass0skip là evidence thành công riêng.

[Follow-up API/JWT/SQL thật](RUNTIME_API_SQL.md) nay ghi **15scenario+health+2authsetup=18quan sát HTTP** trên restored clone riêng,session User/Admin/refresh thật,13/18log correlation bằng trace hiện hữu. Tăng ERR-002MVC errors/traceId thật,ERR-005UsageLog AnalyzeForm thất bại persisted và ERR-013HTTP500 thật/noPackagePersist;không ID mới/sửa lỗi. Fixture sau B2 khiến clone hiện không còn byte-equal main. Browser/provider/full E2E còn thiếu;không nâng mock cũ hoặc18quan sát thành đã test cả24nhóm.

## Mức bằng chứng và tái hiện

| Bằng chứng | Kết quả đã chạy | Chứng minh được / giới hạn |
| --- | --- | --- |
| Sàng lọc tự động trước đó | 321 file first-party được chọn; 105 file có 701 dòng tín hiệu, 216 không khớp | Mẫu số tìm kiếm, không phải đọc tay đủ 321 file hoặc kiểm mọi nhánh. [Inventory](SOURCE_INVENTORY.md) vẫn là bản ghi sàng lọc. |
| Harness implementation backend | API assembly build mới bằng danh sách source tường minh; 16 quan sát trong 10 nhóm probe; exit 0 | Service/controller/adapter thật với HTTP/logger giả và đọc context EF InMemory mới. Chứng minh hành vi trong process; không có MVC server, transaction/migration SQL hoặc provider ngoài. [Báo cáo backend](../../../../artifacts/reports/error-audit-2026-10-29/deep/backend/report.md), [kết quả](../../../../artifacts/reports/error-audit-2026-10-29/deep/backend/results.json). |
| Harness UI/helper | 8 quan sát; exit 0 | Hàm AST/component gốc với boundary giả, hook state tối giản và cây JSX object. Không có React DOM/browser/lưu dữ liệu API. [Báo cáo UI](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui/report.md), [kết quả](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui/probe-results.json). |
| Browser + HTTP fixture | 5 quan sát đã render, ảnh, HTTP/console đã thu; evidence-check exit 0 | Next dev thật, tab incognito riêng, guest rồi User giả; mọi API do fixture riêng cung cấp. Tái hiện Verified; kỳ vọng UX/xử lý lỗi Failed. Không có tích hợp tài khoản/API/DB/provider thật. [Báo cáo runtime](../../../../artifacts/reports/error-audit-2026-10-29/deep/runtime/report.md), [manifest](../../../../artifacts/reports/error-audit-2026-10-29/deep/runtime/evidence-manifest.json). |
| Metadata SQL chỉ đọc | sqlcmd exit 0; DB cục bộ, lịch sử migration và tên cột được chọn | Chỉ metadata. History 13 migration so với 12 trong source; chỉ history có `20260601083335_Phase10ManualCreditOperations`. Không chứng minh DB hỏng hoặc schema/entity khớp toàn bộ. |
| Review độc lập | Report cuối; chạy lại backend 16/UI 8 độc lập exit0,7 check review | Reviewer riêng nhận 23 nhóm sau correction ERR-012/015, assert độc lập 5 browser capture đã lưu và source/SQL/release. Không rerun browser; không suy ra hành vi provider/SQL. |

Các số trên có mẫu số khác nhau, không cộng thành một tổng “test toàn hệ thống pass”. Backend 158/158 và auth 9/9 trước đó vẫn là bằng chứng regression có ngày tại [Validation](VALIDATION.md); không phải kiểm tra end-to-end mới hay bằng chứng đã sửa.

## Disposition ERR-001–020

“Confirm” giữ kết luận có giới hạn, “Revise” sửa khẳng định trọng yếu, “Clarify/expand” làm rõ phạm vi hoặc thêm trigger. Không bác bỏ toàn bộ nhóm cũ; các khẳng định thiếu căn cứ bị bác bỏ rõ. Probe ID chỉ entry chính xác trong kết quả backend/UI đã liên kết; runtime ID chỉ dòng trong báo cáo runtime.

| ID / mức ưu tiên | Disposition | Kết luận hiện tại và bằng chứng mới chính xác |
| --- | --- | --- |
| ERR-001 / P2 | Confirm, bằng chứng mạnh hơn | Mất định danh HTTP trước mapper consumer. RUNTIME-01 render `Unauthorized` với login fixture 401. Network browser vẫn giữ status; lời báo sai thông tin đăng nhập phải chung. |
| ERR-002 / P2 | Confirm actual MVC payload | Helper JSON bỏ field errors/traceId đã có. Review source UI xác nhận boundary; PROBE-02 cũ là giả lập. HTTP-01/02 nay chứng minh MVC400errors/traceId thật trên clone;helper bỏ field vẫn source/mock-traced. |
| ERR-003 / P2 | Confirm, mở rộng consumer | Text thô/tiếng Anh ngắn qua bộ lọc; một số trang usage/credit render `.message` trực tiếp. RUNTIME-02/03/04 hiện `Service Unavailable`; chưa chứng minh lộ bí mật hay XSS. |
| ERR-004 / P2 | Confirm static | Luồng blob bỏ giải thích body; review source xác nhận phải giữ discriminator 401 Google/JWT hiện có. PROBE-04 cũ là mock, chưa chạy export lỗi. |
| ERR-005 / P2 | Confirm actual SQL persistence | Message phân tích vào UsageLogs và UI. `FormProjectService` giữ inner exception. Filter usage phải gồm AnalyzeForm mới thấy bản ghi đó; chưa tái hiện lịch sử browser/SQL. |
| ERR-006 / P2 | Confirm boundary | BE-P09: body PayOS 503 giả được ghép vào ErrorMessage. Chuỗi service/controller/UI vẫn là source trace; không có leak thật hoặc HTTP PayOS end-to-end. |
| ERR-007 / P2 | Confirm, bằng chứng mạnh hơn | BE-P03 context InMemory mới: job/usage Failed nhưng description `Gửi form thành công`. Pause/cancel/kết quả hỗn hợp còn static. |
| ERR-008 / P1 | Confirm, bằng chứng mạnh hơn | BE-P01: fake send thành công rồi transport throw để lại Running, 0 attempt/usage log và 0 success đã lưu ở context mới. BE-P02 mất inner JsonException payload; BE-P04 collect throw để lại 0 collection log. Lỗi sau remote-create còn static. Đọc InMemory sau dispose không chứng minh độ bền SQL. |
| ERR-009 / P1 | Confirm, bằng chứng mạnh hơn | BE-P05 bắt hai entry Information có marker prompt/response giả; không có API key giả. Rủi ro nội dung người dùng tới logger boundary, chưa có incident credential thật hoặc kết luận retention/access. |
| ERR-010 / P2 | Confirm, thu hẹp | BE-P10: Forms 403/404/429/503 đều trả null. Transport/JSON sai có thể throw; không nói mọi exception thành null. Nhánh OAuth/config qua source trace. |
| ERR-011 / P2 | Clarify | Response/analytics bỏ ErrorMessage của run; đã có RunId. BE-P06: JSON envelope ngoài sai thì throw, assistant content sai trong envelope hợp lệ thì 0 output. Không gộp mọi parse failure hoặc nói thiếu mọi định danh đối chiếu. |
| ERR-012 / P2 | **Revise** | BE-P08 bác bỏ mất nguyên nhân cú pháp: JSON sai có message riêng và inner JsonReaderException tại service. JSON hợp lệ nhưng sai constraint vẫn bị gộp thành mismatch chung. Controller chỉ trả message; giữ object inner không chứng minh đã ghi log. |
| ERR-013 / P2 | Confirm action boundary | BE-P07 controller/service thật throw ArgumentException cho price 0, không ActionResult/bản ghi gói. HTTP-13 nay tái hiện500 text/plain thật trong Development;count package không đổi. |
| ERR-014 / P2 | Confirm mock/static | FULL-04 cũ và review source UI: lỗi đọc profile reset cấu hình AI. Chưa có ghi đè được xác nhận; tách không có đã kiểm chứng khỏi đọc lỗi, kể cả semantics 404 theo endpoint. |
| ERR-015 / P2 | **Revise và expand** | UI-P06 bác ví dụ NCKH báo mutation thất bại: loader ghi lỗi đọc rồi resolve. Reload throw còn ở top-up/admin. UI-P05 thêm AI POST thành công → GET lỗi, UI mất run/preview ID và kết quả credit đã trả. Chuỗi backend save/debit trước return là static; chưa trừ lặp thật. |
| ERR-016 / P2 | Confirm, bằng chứng mạnh hơn | RUNTIME-02: detail fixture 503 render không tìm thấy/hướng dẫn quyền sở hữu. Giữ bảo vệ riêng tư khi tài nguyên thực sự ẩn/không tồn tại; không suy vắng từ lỗi đọc. |
| ERR-017 / P2 | Expand | Giữ slice cũ khi lỗi, thêm UI-P07: gọi A trước B, B xong trước A; mọi request thành công, variables cuối thuộc A. Thiếu ownership model/request; chưa lưu nhầm. |
| ERR-018 / P2 | Expand bằng chứng source thực | UI-P01: detail thật `Invalid Google Form URL.` bị đổi thành xác thực sai/hết hạn. Fixture password đăng ký vẫn giả; không khẳng định API hiện tại phát nguyên câu đó. Client guard trùng relation giới hạn trigger. |
| ERR-019 / P2 | Confirm phần wording có giới hạn | Review backend/UI xác nhận text kỹ thuật/tiếng Anh ở consumer đã trace. Provider check chỉ kiểm config cục bộ, không phải kết nối. Validator nội bộ chi tiết không là lỗi UI khi chưa trace consumer; một số thuật ngữ admin phù hợp. |
| ERR-020 / P3 | Confirm static | Script smoke thăm dò cũ thiếu assertion. Chưa chạy; không nói CI hiện tại báo pass sai hoặc browser đã lỗi tương thích. |

## Bổ sung độc lập và nhóm sửa chung

[Phát hiện mới](DEEP_AUDIT_FINDINGS.md) ghi source, trigger, câu đang hiển thị, đề xuất và kiểm tra. UI-001 chỉ ánh xạ ERR-021; UI-005 sang ERR-022; UI-006 sang ERR-023. UI-002/003/004 mở rộng ERR-015/018/017 tương ứng. Quan sát backend tăng bằng chứng cho ID hiện có, không tạo defect trùng.

Thứ tự sửa đề xuất còn Deferred:

1. ERR-008/009: giữ outcome ngoài đã biết/chưa biết, ngữ cảnh exception và diagnostics AI an toàn; rà quyết định lưu/khôi phục/riêng tư trước.
2. ERR-015/021/017/014/007/016: tách kết quả ghi đã xác nhận và dữ liệu hợp lệ/hiện tại khỏi đọc lỗi. Giữ ID đã trả trước khi chỉ retry đọc; không tự gửi/tạo lại.
3. ERR-001–004/006/010–013/018/023: giữ cause/định danh HTTP an toàn ở boundary hiện có, sau đó hiển thị hướng dẫn đúng đối tượng và mã hỗ trợ hiện có. Thêm field/status/hợp đồng lỗi cần review.
4. ERR-005/019/020/022: câu chữ, chất lượng kiểm tra thăm dò và phản hồi clipboard. Đổi bản ghi lịch sử hoặc retention nội dung cần quyết định riêng.

Đây là bản đồ đề xuất, không cấp quyền sửa toàn bộ hoặc chọn phase mới. Giữ nguyên bảo vệ credential chung, credit service/transactions riêng, UsageLogs/SubmissionLogs, phân biệt Google/JWT NCKH, preview/xác nhận và điều khiển gửi tuần tự.

## Bao phủ và giới hạn

Hai tác giả UI ghi nhận99/99 lượt đọc trọn TS/TSX trong app/components/lib:43 trước +56 còn lại không giao. [Coverage còn lại](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui-remainder/coverage.json) ghi disposition/hash từng tệp. [Review độc lập](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui-remainder-review/report.md) kiểm mẫu số/provenance và unit hoàn chỉnh được chọn, không tự đọc lại cả99. Đã chạy lại độc lập hai quan sát mock source gốc mới, khớp8 hash nguồn probe. Backend vẫn giới hạn unit trong report. Xem [Coverage](COVERAGE.md).

5 case browser gồm login, chi tiết top-up, hồ sơ, bảo mật và danh sách NCKH. Bằng chứng tài khoản chính thức là `browser-profile-confirmed.json`, `browser-security-confirmed.json`; diagnostics selector/snapshot trước chuyển tab vẫn giữ và được thay thế. Request JavaScript đã thu: **27, gồm 26 HTTP 200 và 1 HMR dev abort**. Màn hình quan sát đã render; console đã thu không có hydration exception. Không có tuyên bố chung “mọi chunk 200” hoặc bao phủ toàn bộ traffic browser.

Trước đây chưa start API vì quyền chỉ đọc loại trừ tự migration lúc startup, không phải13/12 history chứng minh lỗi. Phân tích SQL sau xác định đủ12 migration hiện hành đã applied, pending0/model-pendingfalse, drift cột max thật và index legacy optional đúng shape. Riêng history legacy đã biết là INFO. Tích hợp source R1 local và rehearsal SQL B2 thật nay Verified ở [dossier DB](../FAH-DB-SYNC-001/VALIDATION.md);main apply và evidence API/SQL thật nay Verified;browser/provider/toàn ma trận mới còn thiếu. Fixture cũ chưa chứng minh ASP.NET/auth/SQL transaction/provider hay browser rộng. Kiểm chứng toàn hệ thống chưa đủ.

## Chủ sở hữu, file và ledger tài nguyên

Ledger sau mô tả lượt audit-only trước. Migration/tool/test DB mới được duyệt riêng và isolated; snapshot/tài nguyên hiện tại thuộc dossier DB. Hash321 nguồn trước vẫn là evidence sàng lọc lịch sử.

Roster thực tế: root `gpt-6.1-sol / medium` chỉ điều phối sau yêu cầu phân công của user; auditor backend, auditor UI, người kiểm runtime, reviewer độc lập và người tổng hợp tài liệu đều `gpt-6.1-sol / high`. Root kiểm catalog model hiện tại trước từng dispatch. Không Astra hoặc escalation con; agent tổng hợp này không dispatch con.

Phạm vi ghi được duyệt là task docs song ngữ và evidence audit; không sửa product/test/contract/schema tracked. Runtime vẫn ghi ignored `apps/web/.next` dù đã thử tách distDir. [Bản ghi](../../../../artifacts/reports/error-audit-2026-10-29/deep/runtime/ignored-next-output-observed.json) nêu sai lệch đó; không xóa/khôi phục cache khi thiếu baseline. Không nói chỉ artifacts được ghi.

Runtime owner đã dừng PID 27304 khi restart, sau đó PID 21404, nhả ports 3137/3138 và tab incognito riêng. [Bằng chứng release](../../../../artifacts/reports/error-audit-2026-10-29/deep/runtime/resource-release.json): cả hai PID không còn, không listener mục tiêu. Giữ process/tab khác và DB service. Không cài dependency, ghi business row vào DB thật, tốn phí provider, gửi form thật, commit/push/merge/deploy hoặc cleanup.

## Validation, rủi ro và bước tiếp theo

[Validation](VALIDATION.md) tách check lịch sử, hành vi mới, review độc lập và check dossier hiện tại. [Check tổng hợp hiện tại](../../../../artifacts/reports/db-sync-2026-10-29/dossier/current-validation.json) ghi integrity docs hiện tại;check synthesis/verification cũ là lịch sử,không chứng nhận hash đã đổi.

Deferred: mọi sửa sản phẩm, bổ sung hợp đồng/correlation, policy recovery/persistence/retention, SQL/provider/E2E đầy đủ và release. Bước nên làm: rà và duyệt nhóm sửa cụ thể cùng hợp đồng, môi trường test và acceptance trước triển khai. Báo cáo này không tuyên bố đã sửa, tích hợp, release hoặc kiểm chứng trọn hệ thống.
