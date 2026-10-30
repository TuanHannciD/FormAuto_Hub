# Review độc lập main wrapper — attempt03

2026-10-30 ICT. Reviewer `/root/db_sync_fix_r1_review`, dispatch `gpt-6.1-sol/high`, children0; không API introspection backing model. Review giới hạn runner/helper mới và evidence cause/release; B2/source R1 giữ nguyên.

## Findings / Summary / verdict

**Không phát hiện blocker mới. GO đúng một lần chạy final** `runtime/main-apply-reviewed-attempt03.ps1` với `-ExecuteReviewedMainApply`, SHA-256 **`32a89cc669efd11afd70f525f725115179715e1a886766109991d2f444091a8a`**. Chỉ sole runtime owner chạy trong quyền user local DB sync đã có.

Helper bắt buộc đúng path `runtime/Capture-Fingerprint-NoPooling.ps1`, SHA **`f459752d05fd7b66a7414523e2acf65e7d1125d5ac122f271705abdc0ec33745`**. Không dùng draft attempt03 cũ hoặc helper path cũ. Incremental vẫn `dce67d64eeae54917532b6905146b7259f576fbbd1886a8d2699543db6dfb362`; target vẫn `DESKTOP-TS5JR7L / FormAutoHub / database_id7`.

Giữ owned main API/writers dừng đến khi POST + fingerprints xong. Nếu attempt03 thất bại, phải đọc evidence và chẩn đoán trước attempt khác; không blind loop/override guard/kill unknown sessions/restore đè main. Đây không là quyền release hoặc task Done.

## Cause được evidence xác nhận và sửa runner

Attempt02 dừng Msg51202 ở final quiescence, **trước normalization SQL**. `main-cutover-quiescence-final-02.log` UTC19:37:46.027 ghi otherSessions1, requests0, targetTransactions0; session53 user/sleeping/open_transaction_count0/program `FAHERR001_Fingerprint`. Normalization02/POST02 files không tồn tại. Đây là owned helper connection còn ở SQL client pool trong tiến trình PowerShell, không có bằng chứng unknown business writer hoặc lỗi schema/API.

Old helper `Close()` có thể trả connection vào pool thay vì đóng physical session trong khi wrapper sống; cause phù hợp exact program metadata và helper code. `Pooling=false` trên helper riêng làm Close giải phóng physical connection, không cần exclude application name khỏi guard. Original helper đã phục hồi nguyên hash `956b0b7e58623db66a28cdd0fb02a7982b34177435614fabec4e5a5742bcabb2`; không ghi đè historical reviewed helper.

Reviewer đối chiếu actual files: new helper chỉ thêm đúng **một** `Pooling=false;` vào connection string. Bỏ đoạn này trả lại toàn bộ old helper text sau chuẩn hóa newline. Target allowlist/identity, serializable read transaction, lock timeout, ordered full-column/PK hashes, rollback/finally.Close, output unique/path guards đều không đổi. Không production/config/package change, ClearAllPools hoặc global pooling setting.

`main-no-pooling-helper-release-proof.json` UTC19:39:08.038 có34table fingerprints; reviewer tính độc lập **34/34 bằng restore-tested backup source**, gồm history13. Log observation UTC19:39:08.103 sau helper, theo runtime same-process execution, ghi otherSessions0/ownedFingerprintSessions0/targetTransactions0. Reviewer đọc evidence, không tự query SQL hoặc tự quan sát process. Code +same-process evidence giải quyết chính cause đã đo được; không chỉ chờ PowerShell process kết thúc.

## Exact wrapper delta / Scope alignment

Đã đọc final diff `main-attempt03-final-wrapper-diff.patch`, old02/final03 wrapper và helper. Reviewer tự kiểm: đổi chỉ evidence suffix03→02, helper path mới→cũ và helper hash mới→cũ thì **toàn bộ final03 wrapper text bằng old02** sau chuẩn hóa newline. Parser cả new helper và final wrapper **0errors**.

Do đó unchanged: diagnostics, mọi quiescence predicate/THROW, server/DB7/state guard, source17/API/probe/manifest/SQL/baseline pins, backup hash +fresh VERIFYONLY, fresh34fingerprints gắn actual restored backup, strict PRE/POST sets/catalog, sqlcmd-I/-b/t60,33business/index/history preservation và fail-without-automatic-recovery. Không thêm application-name exception hoặc retry loop. B2 accepted16SQLtests/6timeoutbranches/direct X-lock proof không bị thay đổi.

`fingerprint-pooling-fix.diff` có header của bước chuẩn bị tạm dùng old helper path; authority ở review này là **actual separate NoPooling file và final03 hash**, đã đối chiếu trực tiếp, không suy final file từ header diff cũ. Draft03 khác hash không được GO.

## Validation performed

**Verified trong reviewer:** direct hashes old helper/new helper/final wrapper; exact two deltas bằng comparison độc lập; parser0errors cho2files; actual attempt02 guard/session metadata và absence normalization02/POST02; independent34table release-proof equality với backup baseline; release proof zero sessions/transactions. `verification/static-and-release-proof.json` giữ assertions, `input-hashes.json` giữ9input hashes. Không lặp fullsuite/build hoặc B2 khi source/SQL không đổi.

## Files changed / Validation not performed / Risks / Deferred

Chỉ tạo `main-apply-review-attempt03/report.md` và bounded `verification/`. Không edit source/runtime/helper cũ, SQL connection/query/DDL/DML, build/process/API/browser/install/Git/remote/cleanup/agent con. Reports/evidence attempt01/02 preserved.

**Not run tại freeze:** final03 execution/fresh guards/main apply/POST/preservation và main API/auth/HTTP/browser/log smoke, full audit. Chưa claim local DB synced/Done/released. Pooling fix không miễn fresh guards; bất kỳ activity/backup/data/hash drift mới phải dừng theo wrapper. No destructive recovery và các Deferred scope giữ nguyên.

## Next recommended step

Root gửi GO đúng final03 +new helper hashes cho sole runtime owner chạy một lần. Kiểm main POST và33business/index/history trước start main API, sau đó tiếp tục safe read smoke main và owned-clone audit theo scope đã giao. Nếu có failure mới, chẩn đoán từ exact evidence trước quyết định tiếp theo.
