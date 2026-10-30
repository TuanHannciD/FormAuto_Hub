# Review độc lập design và SQL preflight — 2026-10-29

## Findings theo mức độ

**Không tìm thấy blocker cho riêng ba SQL stage backup/restore-rehearsal/clean-create ở snapshot đã hash. Có một correction P2 về diễn giải gate trước triển khai probe/apply. Main DB apply chưa được review hoặc GO.**

| Mức | Finding | Correction / recheck |
| --- | --- | --- |
| P2 trước implementation gate | `design/report.md`, mục Verifier: pending current migration và wrong required shape là BLOCKING “không sync”; nhưng trước sync đã duyệt, đúng một migration normalization chưa applied và hai cột max chính là baseline cần xử lý. Nếu dùng kết quả compatible cuối làm prerequisite cho migration, task tự chặn chính mình. | Giữ probe compatible mặc định nghiêm ngặt: exit2 khi pending hoặc max. Tách pre-sync authorization check có exact planned migration ID/hash, không có pending khác, model-pending=false, chỉ đúng hai max allowances hoặc canonical; toàn bộ required shape còn lại phải đúng. Post-sync bắt buộc pending0 + canonical200/50. Không gọi pre-sync là compatible hoặc suppress raw difference. Có thể thực hiện bằng runtime wrapper/state rõ ràng; không cần xin lại quyền user. |

Đây là lỗi diễn giải sequencing trong design, không phải reproduced DB/runtime failure. Correction không chặn backup/restore rehearsal/clean-create độc lập. Không cần sửa business contract, index hoặc source model để xử lý.

## Summary và verdict tách biệt

| Gate | Verdict | Phạm vi và điều kiện |
| --- | --- | --- |
| A — backup + actual restore rehearsal + clean CREATE | **GO có điều kiện vận hành đã ghi** | Chỉ `stage-01-backup.sql`, `stage-02-restore-rehearsal.sql`, `stage-03-clean-db.sql` với exact hashes trong `verification.json`. Runtime owner refresh identity, absence/files/space, full sessions/requests/transactions và quiescent fingerprints ngay trước acquire; chạy từng stage riêng, dừng khi bất kỳ assertion/operation lỗi. Không chạy migration/main apply trong GO này. |
| B — design sẵn sàng implementation | **Chấp nhận hướng; correction P2 phải được tiếp thu trước gate implementation** | Forward hai cột, byte guard + X lock cùng EF transaction, exact optional legacy index INFO, history sets và Down fail-fast là hợp lý trong scope. Làm rõ pre-sync/post-sync như finding rồi triển khai/tests. Đây chưa phải review patch hoặc generated SQL. |
| C — apply vào `FormAutoHub` | **NOT YET** | Chưa có migration patch/SQL immutable, clean+existing+oversize/concurrency SQL tests, preservation comparison/rehearsal và independent patch review. Sau các gate đó vẫn cần fresh cutover target/writer/backup checks và root checkpoint. |

GO A là review an toàn trong quyền local đã được user cấp qua root; không phải yêu cầu cấp quyền mới. Không được dùng GO A để restore đè user DB, drop/reset DB, delete history hoặc cleanup.

## SQL preflight: lý do chấp nhận A

- Exact target được guard bằng `@@SERVERNAME=DESKTOP-TS5JR7L`; stage01 dùng `FormAutoHub`, stage02/03 chạy master và chỉ tạo exact owned DB names mới. Literal T-SQL paths được quote đúng; hiện không có apostrophe/interpolation hoặc unchecked substitution.
- Stage01 kiểm destination chưa tồn tại; `COPY_ONLY,CHECKSUM,COMPRESSION,STOP_ON_ERROR`, không INIT/FORMAT, không đổi recovery hoặc shrink. COPY_ONLY giữ differential backup base. Stage có VERIFYONLY CHECKSUM và HEADERONLY/FILELISTONLY; VERIFYONLY chưa chứng minh restore thành công.
- **Checkpoint bắt buộc trước stage02:** operator đọc output stage01, xác nhận backup source `FormAutoHub`, backup identity/position/checksums và đúng hai logical files `FormAutoHub`/`FormAutoHub_log`; lưu manifest + backup hash. Stage02 hardcode hai MOVE và không tự kiểm output này, nên không chạy stage02 nếu checkpoint chưa Verified. Nếu có additional logical file phải dừng; không cho SQL dùng original paths mặc định. Đây đã là yêu cầu STAGES/report, không phải sửa code mới.
- Stage02 kiểm owned destination DB và cả hai physical paths chưa tồn tại, RESTORE với MOVE riêng, không REPLACE/SINGLE_USER/ROLLBACK IMMEDIATE; CHECKDB sau restore. Stage03 kiểm name/files tương tự, explicit files dưới SQL DATA, collation trùng captured source. Clone không thể redirect sang tên user DB qua input.
- Runtime report ghi Backup ACL chỉ SYSTEM/Admin/Tuan/SQL service/CREATOR OWNER; DATA ACL từ OS bị access denied là **Not run**, không giả thành thiếu quyền SQL. Rehearsal thực sẽ kiểm khả năng tạo files. Backup sensitive được giữ ngoài repo, hash/ACL kiểm sau tạo.
- Fresh captured preflight cho thấy 0 other sessions/requests/transactions, 5 evidence rows vừa400/100 bytes, dung lượng đủ; đây là sample chứ không phải lock hoặc reservation. Runtime owner duy nhất phải coordinate writers, refresh full queries và compare source fingerprints trước/sau backup. Stage01 kiểm session theo current database không thay full request/transaction recheck trong report.
- Không có cleanup/drop statement trong ba scripts. Tên overlength clone chỉ là proposed; cần exact reviewed script riêng, không nằm trong GO A. Không tự xóa clone/backup/evidence dù operation fail.

## Design và contract scope

Current context map `OriginalFileName`200/`ContentType`50; `ManualCreditFlow.Up` chủ động adopt legacy và create-on-missing. Source model không có hai extra legacy indexes. Index unique filtered `(TopupOrderId)` bảo vệ một hướng liên kết khác với `TopupOrders.EvidenceFileId`; service owner/reuse checks không đủ cho phép drop hoặc add invariant toàn cục. Giữ đúng hai shapes optional INFO, không gọi full catalog equality, là lựa chọn phù hợp.

`DATALENGTH`400/100 inclusive tránh bỏ trailing spaces hoặc sai UTF-16 storage; lock `TABLOCKX,HOLDLOCK` phải thật sự còn giữ qua guards, cả hai ALTER và history write/commit. Implementation phải fail khi thiếu transaction, unexpected shape/collation/oversize, có finite lock timeout và rollback verified từ connection khác. Review hiện tại chấp nhận thiết kế; chưa chứng minh SQL locking behavior.

Down mới fail-fast được chấp nhận: canonical state không cho biết baseline cũ đã max hay200/50; không tạo metadata mới chỉ để đoán rollback. Không chạy Down cũ vì nó drop rowversions. Recovery trước commit kiểm rollback; sau commit forward repair có review, giữ backup. Restore user DB thật vẫn nằm ngoài quyền overwrite của task.

History hiện13/source12/pending0 không tự là corruption/startup failure. Sau migration mới dự kiến main14/current13; exact known legacy ID là INFO khi current set đủ. Pending/model/physical shape phải kiểm độc lập. Preserve mọi row/evidence bytes/links/money/ledger/audit/rowversion, không backfill/replay credits. Unknown extras tiếp tục review-required blocker, không tự xóa.

## Snapshot và read paths

Reviewer độc lập với design/runtime authors; root dispatch `gpt-6.1-sol / high`, không children. Backing model introspection không có; ghi đúng cấu hình dispatch, không tự chứng nhận API identity. HEAD đọc fresh `a19f7a2f3dc1bc54ff645d662d94fc614439256a`; tracked diff không đổi, các untracked/ignored evidence/dossier giữ nguyên.

Đã đọc README/AGENTS; authority/execution/quality/tooling/routing; task FAH-ERR-001 INDEX; skills formauto-db-risk-reviewer và verification-before-completion; bốn prior reports schema/proposal/review/provenance; final design report/plan/decisions/verification; runtime report/ledger/STAGES/preflight-hashes, cả ba stage SQL, preflight SQL/OS/path-permission outputs. Source đọc trực tiếp: ManualCreditFlow Up/Down, context mapping, evidence/order/account entities, full TopupEvidenceService/TopupOrderService; contract sections API manual-credit/evidence, entity evidence và UI_CREDIT_FOLLOWUP_SYNC credit/persistence. `verification.json` đóng hashes inputs chính.

## Validation performed

**Verified:** read-only filesystem/Git snapshot; all7 runtime manifest entries khớp hash hiện tại; final design report hash `dd53aba571e8af89b998299bfc172a54daeba428e80e8e6d432433b7bef52881`, plan `c4b58c9f5dbbfd84627fc3756add28c6778cc2c784e11b5d8b2d920df3a8940d` khớp root; đọc manual safety/contract review và UTF-8/report checks ghi verification. Captured SQL/OS evidence được đối chiếu, không query lặp.

## Validation not performed

**Not run trong reviewer:** SQL connection/query/backup/restore/create/DDL/DML/migration, build/tests, process/port/browser acquisition, runtime HTTP/auth/provider, physical data/ledger equality, concurrency. Không có implementation hoặc fix pass claim. Main apply **Blocked** ở các prerequisite C chưa có; không gọi backup hoặc restore Verified trước actual execution.

## Files changed / Scope alignment

Chỉ `preflight-review/report.md` và `preflight-review/verification.json`. Không sửa design/runtime/source/config/docs/DB; không dispatch/install/Git mutation/remote/provider cost/cleanup. Bounded normalization đã được user chọn; 23 error-group repairs và audit findings khác không bị sửa trong review.

## Risks/Deferred và Next recommended step

Risks thực còn lại: writers sau sample, operation/file ACL thực chưa thử, schema lock contention, backup sensitive, exact recovery của writes mới sau backup. Chúng có checkpoint/rehearsal trong plan; không dựng blocker lý thuyết mới cho GO A. Deferred: index semantics/workload, user DB overwrite recovery, cleanup/retention, live providers và release.

Root gửi GO A cho sole runtime owner; tiếp thu P2 vào design/implementation instructions, rồi triển khai patch/tests trên snapshot isolated. Sau rehearsal+independent patch review, review lại exact main apply wrapper/hash và cutover state trước local apply; sau đó runtime smoke và tiếp tục audit FAH-ERR-001. Không claim integration/release từ local completion.
