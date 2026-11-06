# FAH-HISTORY-001 Task4 — Independent scoped review R2

Ngày: 2026-11-05. Reviewer: `/root/history_task4_review_r2`, gpt-6.1-sol/high; không có agent con. Phương pháp: requesting-code-review và verification-before-completion, theo quyền review chỉ đọc; không chạy lại build/test/SQL. Chỉ ghi artifact này.

## Summary / Findings

**I1 ADDRESSED. New Critical: 0. New Important: 0. New Minor: 0.** Chấp nhận bản sửa I1 trong snapshot R2 cho local Task4; verdict này không đóng các runtime/provider gates hoặc xác nhận integration/release.

Target bất biến: `artifacts/reports/fah-history-001/task4-review-r2-20261105-163508/`; base và HEAD đọc được là `df5cce54f4a8516ab9dd0bf2b5dff561c1cb8d5c`. Đã đọc brief/report/R1 artifact/manifest/full fix diff, toàn bộ affected service và SQL test, các dependency finalization/admission/replay, fixture guard và phần lifecycle hợp đồng liên quan.

**Verified trong review:** 28/28 SHA256 source hiện tại và 28/28 SHA256 snapshot khớp manifest R2. So sánh manifest R1/R2 xác nhận đúng hai source/test files thay đổi: `SubmissionService.cs`, `GenerationHistorySubmissionSqlTests.cs`. SHA256 của `task4-final-manifest.json` đúng `221679bbdc5b17cd994030e38032832ca3d2731d6657f298af3fde60364f2446`.

## I1 — ADDRESSED

- `src/FormAutoHub.Api/Services/SubmissionService.cs:145`: initial item query đã chuyển vào `try`; lỗi query hoặc cancellation sau acknowledged admission đi qua catch tại169, clear tracker, đánh dấu interrupted, rethrow và chạy finally tại176. Không còn await tải item ngoài vùng finalization.
- `src/FormAutoHub.Api/Services/SubmissionService.cs:178`: finalizer dùng token riêng có hạn30 giây, không liên kết request token bị cancel. Nó không phụ thuộc biến `items` chưa tải thành công.
- `src/FormAutoHub.Api/Services/CreditReservationService.cs:114` và `src/FormAutoHub.Api/Services/SubmissionItemMutation.cs:23`: finalizer đọc lại durable job/items/reservation dưới ordered locks và reload tracked rows. Ack, status, finish, release và counter projection nằm trong local transaction. `ReleaseCoreAsync` tại134 chỉ đổi Planned thành NotDispatched và Released/PrepaidReleased; PossibleDispatch/Unknown không được release. Nhánh hoàn prepaid giữ nguyên.
- `src/FormAutoHub.Api/Services/SubmissionService.cs:50`/`:75` cùng `src/FormAutoHub.Api/Services/SubmissionAdmission.cs:85`: chỉ admission `Run=true` mới vào runner; observation sau lost admission acknowledgement vẫn trả `Run=false` tại89. Việc di chuyển query không mở runner takeover hoặc release cho admission chưa acknowledged.
- `tests/FormAutoHub.Tests/GenerationHistorySubmissionSqlTests.cs:21`: sáu ca selected/direct × query-fault/query-cancel/after-ack-cancel kiểm tra lỗi gốc được ném, interceptor thực sự trigger, receiver0, debit0, hai NotDispatched/Released, outstanding0/released2, balance2, ack+finish, inactive fence và không SubmissionLog. Replay cùng command vẫn receiver0/held0. Interceptor tại272 chỉ arm sau commit admission; sau đó fail/cancel đúng truy vấn initial items, hoặc cancel token ngay trong callback commit thành công mà không làm mất acknowledgement.

**Evidence đánh giá:** retained `task4-r1-red-initial-load-six.log` có6 failures thực tế (expected Failed, actual Running), không phải lỗi compile. `task4-r1-green-initial-load.log` có6 passed với đủ sáu tổ hợp và output ack/finish/inactive. Đã đọc log và đối chiếu assertions/source; đây là author-run evidence, không phải reviewer rerun.

## Minor / Risks retained

- M2 từ R1 giữ nguyên: `src/FormAutoHub.Api/Services/SubmissionAdmission.cs:51` active guard có thể trả409 ActiveSubmissionJob trước OutcomeUnresolved cho selected Unknown. Không đổi trong fix R2; root đã giữ ledger cho final review. Không nâng severity hoặc mở rộng scope ở đây.
- Task3 M1 query amplification tiếp tục Deferred trong root ledger; không phải finding mới của Task4 R2.

## Spec Compliance — scoped ACCEPTED

Fix đáp ứng recheck I1: acknowledged runner luôn vào vùng finalization khi initial query lỗi/cancel, token finalization độc lập cancellation của request, chỉ unattempted Planned được release. Lost-admission-ack no-run semantics vẫn giữ nguyên. Không có thay đổi contract, pricing, trạng thái công khai, schema hoặc provider behavior trong hai-file delta ngoài bugfix đã yêu cầu. Các kết luận rộng của R1 được giữ làm baseline, không tái review toàn bộ code không thay đổi.

## Task Quality — scoped ACCEPTED

Thay đổi production tối thiểu; coverage kiểm tra durable SQL state cùng receiver/accounting độc lập và ba thời điểm lỗi cho cả selected/direct. Không thấy breakage mới do fix. Test theory dùng cùng strict owned DB guard; không lấy EF InMemory làm bằng chứng transaction SQL. Source finalizer vẫn có giới hạn30 giây; review không tuyên bố khôi phục thành công nếu bản thân DB/finalization tiếp tục không khả dụng.

## Validation performed

Reviewer chỉ chạy đọc/hash/so sánh snapshot và đọc retained logs, không chạy suite hay truy cập DB. Các kết quả dưới đây là **retained author-run evidence đã đọc**, không phải fresh execution của reviewer:

| Artifact | Kết quả trong log |
| --- | --- |
| `task4-r1-red-initial-load-six.log` | 6/6 RED, durable Running thay vì Failed |
| `task4-r1-green-initial-load.log` | 6/6 GREEN, ack/finish và inactive output |
| `task4-r1-final-sql-safety.log` | 36 passed: Task4 thirteen actual cases + foundation/history23; không skipped |
| `task4-r1-final-test.log` | 387 passed,0 failed,47 opt-in skipped,434 entries |
| `task4-r1-final-build.log` | 0 errors,3 baseline NU1603 |
| `task4-r1-final-pending.log` | No pending model changes |
| `task4-r1-final-diff.log` | Không whitespace error; LF/CRLF warning ở file không đổi bởi fix |

Safety log vẫn ghi đúng lost-admission-ack: receiver0 theo test assertion, Running/Planned, ack=null/finish=null/active=true; precall/outcome uncertainty giữ PossibleDispatch hold và fence. Đây là trạng thái bảo thủ cần giữ, không phải tái xuất I1.

## Validation not performed / Cannot verify

- Not run bởi reviewer: bất kỳ build/test/DB probe/migration/provider call nào; không cần focused probe bổ sung vì control flow và retained six-case evidence nhất quán.
- Không biến47 opt-in skipped entries thành pass. Theory sáu ca tương ứng một skipped entry trong full run; Safety36 actual cases đã chạy riêng theo retained evidence.15 legacy SQL fixture cases còn Not run; Baseline1/1 là retained unaffected evidence từ vòng trước, không được rerun ở R2.
- Cannot verify: API restart/authenticated HTTP, browser hydration/chunks/session, runtime end-to-end Task5/6, real Google metadata/receipt và operator reconciliation adequacy. Production paid sends vẫn Blocked/fail-closed; synthetic outcomes không thay thế real-flow proof.

## Declined to judge

- M2 exact409 precedence và Task3 M1 performance: đã được root ledgered, không thuộc fix I1.
- Unchanged Task2/3/Task4 broad implementation: R1 đã review; R2 chỉ xét I1 và breakage mới của delta.
- Task5 UI/history integration, Task6 runtime checks, real Google positive receipt/operator tooling và release: ngoài quyền/scope review này, gates vẫn mở.

## Files changed / Next recommended step

Chỉ thêm `artifacts/reports/fah-history-001/task4-review-r2.md`; không chỉnh source/docs/index/HEAD, author report hoặc evidence đã có. Root có thể ghi nhận I1 được đóng theo scoped independent review và tiếp tục Tasks5/6 đã duyệt, giữ M2/M1 trong ledger và hoàn tất runtime/real-flow gates tương ứng trước bất kỳ Done/integration/release claim nào.
