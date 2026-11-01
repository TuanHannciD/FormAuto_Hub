# FAH-ERR-001 — Review độc lập phần UI còn lại

2026-10-29 · Reviewer `gpt-6.1-sol / high`, không agent con. Workspace `D:/TinHoc/FormAuto_Hub`; HEAD kiểm lại `a19f7a2f3dc1bc54ff645d662d94fc614439256a`. Snapshot UI được định danh bằng SHA-256 trong [verification.json](verification.json); công việc DB/migration ở nhánh khác không thuộc snapshot review này.

## Findings và quyết định review

| ID nhánh | Quyết định | Kết luận và giới hạn |
| --- | --- | --- |
| UIR-001 | **Accept mới: đề nghị ERR-024 / P2** | Giá trị hiển thị khác dữ liệu gửi đi có nguyên nhân UI riêng. Hai probe gốc chạy lại độc lập đều tái hiện. Giữ ERR-012 cho việc backend gộp lỗi constraint; giữ ERR-003/019 cho thông báo thô/thuật ngữ. Không đếm lại thông báo chung thành finding mới. |
| UIR-002 | **Accept, duplicate/merge ERR-019** | `Option 2/3`, `product baseline`, `product safety rules` có đường render tới người dùng. Copy public có tác động thấp hơn; không tăng severity hay số nhóm. Đề xuất câu thay thế chỉ là Deferred, cần đúng trạng thái mở/đóng; không dùng luôn “Mở câu hỏi…” khi câu hỏi đã mở. |
| UIR-003 | **Accept, duplicate/merge ERR-021; liên quan ERR-017** | Dataset null/GET lỗi và danh sách rỗng dùng cùng empty state; parent vẫn render vùng dữ liệu cùng loading/warning. Đây là dữ liệu chưa xác định bị trình bày như chưa có. Parent có cảnh báo, nên bác diễn giải “toàn trang nuốt lỗi”. Stale model/request owner giữ ở ERR-017. Chỉ source trace, không mutation/browser mới. |
| UIR-004 | **Accept, duplicate/merge ERR-021** | Admin user-search reject hạ loading, chỉ toast; options ban đầu rỗng dẫn tới “Không tìm thấy email người dùng phù hợp”, hoặc options cũ còn lại. Version guard ngăn success cũ ghi đè đã có; không cáo buộc thiếu mọi race guard hoặc đã cộng nhầm credit. Static consumer trace. |

Không reject toàn bộ candidate nào; ba mở rộng không tạo ID mới. Với ERR-024, register đề nghị là **24 nhóm: 2 P1 / 20 P2 / 2 P3**. Đây là số nhóm đã loại trùng trong phạm vi audit, không phải số lỗi của toàn hệ thống hoặc số runtime tests.

## UIR-001 / ERR-024 — căn cứ độc lập

Reviewer đọc toàn `RuleEditor`, helpers và controller/service rule; đọc trọn handler `saveRulesAndGenerate`, gate `canGenerate` và các vùng render/caller liên quan. `Input` thực chỉ truyền props xuống `<input>`, không có lớp sửa dữ liệu giữa component và DOM.

1. `RuleEditor.updateDateRange/updateTimeRange` lưu `event.target.value`, gồm chuỗi rỗng hợp lệ khi xóa input, vào `configJson` qua callback parent.
2. `readDateRange/readTimeRange` dùng `||` mặc định khi đọc lại. Cấu hình vẫn rỗng trong state, nhưng prop `value` của input hiện ngày/giờ mặc định.
3. Gate chỉ kiểm `mode` và `configJson.trim()`, nên JSON có trường rỗng vẫn cho tạo. Nút là `type="button"`, gọi handler trực tiếp; không có native form submit validation sửa tình huống này.
4. Handler gửi nguyên config tới POST rule trước khi gọi generate. Probe ngày: `fromDate:""`, input hiện `2026-05-18`, ngày kết thúc `2026-10-31`. Probe giờ: `fromTime:""`, input hiện `09:00`, giờ kết thúc `12:00`, step 60. Cả hai khoảng nhìn thấy đều có thứ tự hợp lệ.
5. Cấu hình JSON này hợp lệ về syntax nhưng sai constraint hiện hữu: `ReadRequiredDate/Time` cần chuỗi theo `yyyy-MM-dd`/`HH:mm`, nên chuỗi rỗng không hợp lệ. `HasValidConfig` bắt `InvalidOperationException` và trả false; `AnswerRuleService` ném literal generic, controller có nhánh `BadRequest(ProblemDetails)` với Detail đó. Đây là **static trace C#**, chưa thực thi C#/MVC/HTTP trong review này.
6. Probe gọi handler gốc với API mock ném literal service, rồi `readableError` gốc; kết quả toast là `Answer rule config does not match the selected mode and question.`. Parser API gốc đọc `detail` trước `title` cũng đã được đối chiếu source, nhưng không được probe end-to-end.

**Severity P2 được chấp nhận:** người dùng nhìn thấy giá trị được điền nhưng thao tác tạo bị chặn bởi payload khác, không có field feedback giúp sửa. Case fixture dừng ở POST rule đầu tiên; không có bằng chứng mất credit, lưu dữ liệu sai hoặc tạo/submission thật. Hai ô kết thúc dùng cùng cấu trúc và đã đối chiếu source, nhưng chưa được probe riêng. Không mở rộng kết quả thành tất cả thao tác ngày/giờ đều thất bại.

**Vì sao tách ERR-012:** sửa thông báo constraint ở backend sẽ giúp giải thích lỗi nhưng chưa loại bỏ việc UI hiển thị giá trị không có trong request. Ngược lại, giữ đúng empty value/đồng bộ default ở UI không tự sửa việc backend gộp mọi constraint. Hai lớp có nguyên nhân và nghiệm thu độc lập, dù chung một chuỗi lỗi.

**Đề xuất Deferred được chấp nhận về hướng:** đồng nhất giá trị hiển thị và config; nếu người dùng xóa thì giữ empty state và hướng dẫn cạnh ô, hoặc chỉ khởi tạo default khi chọn mode rồi lưu default vào cùng state. Xác thực trường bắt đầu/kết thúc, thứ tự và bước giờ theo constraint hiện hữu trước khi gửi. Không thêm DTO/status/response field hay tự sửa hợp đồng. Remediation cần test browser cho clear/retype/mode switch và network payload, cùng API validation phù hợp; đây chưa là phê duyệt implementation.

## Coverage và phạm vi được chấp nhận

**Verified:** denominator hiện tại đúng **99 TS/TSX** dưới `apps/web/{app,components,lib}`. Tập 56 trong report mới khớp chính xác 56 `unreviewed-by-this-agent` cũ, không giao 43 `full-file` cũ; 56 đều có disposition riêng. Không thiếu/thừa tệp khi đối chiếu `rg --files`, không thay hash nào trong 99 tệp. `apps/web/tests/api-auth.test.cjs` là một mục focused support riêng, hash vẫn khớp và không vào denominator 99.

**Chấp nhận provenance:** hai tác giả UI ghi nhận tổng cộng 99/99 lượt đọc toàn tệp theo hai tập không giao nhau. Reviewer đối chiếu toàn danh sách/disposition/hash, spot-check complete units ở finding và dependency/caller; **không tuyên bố tự đọc lại toàn bộ 99 tệp**. Hash chứng minh bytes khớp snapshot, không tự chứng minh hành vi đọc thủ công hoặc không còn bug.

Các disposition không phát sinh finding riêng được giữ trong giới hạn report: animation cancellation, wrapper/static metadata, invariant nội bộ và safe deletion fallback không tự thành error-message defect. Review này không cấp chứng nhận toàn bộ accessibility/browser compatibility hoặc mọi fallback trong 56 tệp.

Root điều phối tổng hợp; backend/UI/runtime/reviewer có phạm vi và mẫu bằng chứng riêng. Phần đang chấp nhận ở đây chỉ bổ sung source/manual coverage UI và hai mocked observations, không nâng coverage backend/SQL/provider hoặc runtime của các nhánh khác.

## Validation performed

- **Verified / exit 0:** `node artifacts/reports/error-audit-2026-10-29/deep/ui-remainder-review/probe.cjs` từ root. Copy probe gốc cùng độ sâu thư mục; hash script không đổi. Hai kết quả khớp kết quả tác giả; output riêng [probe-results.json](probe-results.json). JSX object tree/helper/save-handler thật, API rejection giả lập, không React DOM.
- **Verified / exit 0:** `node artifacts/reports/error-audit-2026-10-29/deep/ui-remainder-review/verify.cjs`. Kiểm denominator99=43+56, danh sách/disposition, 99 source hashes, focused test-support, 8 probe-source hashes và 2 kết quả mới. [verification.json](verification.json) lưu từng tệp và hash evidence đầu vào.
- Đã đọc dossier/report hiện hành và review cũ để giữ ERR-012/015 correction, IDs 021–023, giới hạn runtime và register gốc 23 nhóm. Kết quả review này không thay thế các review cũ hoặc chứng nhận phần DB đồng thời.

## Files changed và Scope alignment

Chỉ tạo thư mục `deep/ui-remainder-review/` với `report.md`, `probe.cjs`, `probe-results.json`, `verify.cjs`, `verification.json` và bằng chứng kiểm cuối trong cùng thư mục. Không sửa source, test, task docs AI/VI, artifacts gốc hoặc schema; không SQL/browser/API/process/server/install/Git mutation/cleanup. Không tài nguyên runtime cần release. Tracked diff ở thời điểm verifier trống; các untracked audit/DB/task artifacts của tác giả khác được giữ nguyên.

## Validation not performed

**Not run:** React/browser/DOM/hydration, end-input probes, actual HTTP/auth/API validation, SQL/persistence/migrations, provider/payment/webhook/submission, build/lint/broad tests. Đây là review chỉ đọc source và chạy fixture trong artifacts; không có runnable product change cần restart. Runtime/DB thuộc owner khác, không mượn kết quả để nâng evidence level.

## Risks/Deferred items và Next recommended step

**Deferred:** mọi fix UI/backend/copy, contract design, migration integration và release. Full-system verification vẫn chưa hoàn tất; không khẳng định đã tìm hết lỗi. Root/synthesizer có thể thêm ERR-024/P2 và gộp ba mở rộng vào paired dossier, giữ rõ 99/99 là manual source coverage, hai probe là mock; chỉ kết hợp kết quả DB/runtime mới khi owner cung cấp evidence và snapshot tương ứng.
