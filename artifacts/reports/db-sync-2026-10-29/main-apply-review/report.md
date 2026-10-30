# Review độc lập B2 và main apply — FIX R1

2026-10-30 ICT; giữ task path ngày29. Reviewer `/root/db_sync_fix_r1_review`, root dispatch `gpt-6.1-sol / high`, children0; không API introspection backing model. Tiếp tục cùng fixed source R1, không thêm source changes. Dùng `formauto-db-risk-reviewer` và `verification-before-completion`.

## Findings / verdict

**Không còn blocker ở B2 hoặc exact main wrapper đã review. P2 về bằng chứng guard→ALTER đã CLOSED bằng actual SQL DMV, không dựa test cũ có Sch-M.**

**GO cho sole runtime owner áp dụng local main bằng đúng `runtime/main-apply-reviewed.ps1` SHA-256 `dd27c4515da3476961958f3f3ec68b65275cf33aa685451aa1011ca04b9bced9`, với switch `-ExecuteReviewedMainApply`, chỉ dùng incremental SHA-256 `dce67d64eeae54917532b6905146b7259f576fbbd1886a8d2699543db6dfb362` lên `DESKTOP-TS5JR7L / FormAutoHub / database_id7`.** Đây là GO review trong quyền user đồng bộ local đã cấp, không phải yêu cầu cấp quyền lại.

Điều kiện vận hành đã có trong scope/wrapper: root và runtime giữ owned API/writers dừng đến khi POST + fingerprint hoàn tất; không khởi động API giữa các bước. Quiescence là sample, không reservation. Nếu xuất hiện writer/session mới, fingerprint/shape/history/backup đổi, bất kỳ hash/guard/operation khác0, phải dừng, giữ evidence và kiểm độc lập; không override để chạy tiếp. Backup khác baseline cần fresh backup + actual restore rehearsal + review, không tự restore đè main. GO không cấp DROP/reset/Down/history rewrite/cleanup/deploy.

## Summary — bằng chứng B2 được chấp nhận

Đã đọc final `runtime/b2-report.md`, SHA `b272e3f0227034f98f40348ff2217759f0b41598857c568028c13b412975cd8b`, và trực tiếp kiểm raw logs/TRX/JSON/scripts. Không chỉ dựa narrative hoặc số tổng trong report.

| Gate | Verified / giới hạn |
| --- | --- |
| Fixed clean/full chain | Same frozen full-chain `81e3b60f5d6426303f256e254501a442889e511e912f54841c183d690ca78807` đã chạy SQL thật thành công; clean current/applied13, pending0, modelPendingfalse, canonical400/100bytes. |
| Existing legacy | PRE đúng một planned pending +2max; incremental exit0 theo runtime evidence; POST compatible/current13/applied14, giữ known legacy ID. |
| Actual SQL tests | Reviewer parse actual TRX: **16 UnitTestResult, tất cả Passed,0failed/0skipped**; includes3timeout theory rows mỗi row success+original51003. TRX SHA `904f0f3a763cc4c156528c4b02570b2805dde60de100c09997b6dc65421fe554`. |
| Caller timeout | Standalone harness6branches: -1/0/4321 success và originalshape51002, restored đúng mỗi caller; outer session -1→-1. Theory kiểm thêm originaloversize51003/state1/message. Không gộp thành19tests hoặc gọi là mọi SQL error path. Log SHA `460057cb0daad41618eff43f1738c82aba88a87d48aec387d7f2fdb8e659f848`. |
| Required schema | Official clean/restored/safety POST đều compatible/pending0/modelPendingfalse/blocking[]. Clean/safety rawdiff0; restored chỉ2exact optional index INFO. |
| Preservation | Reviewer tự tính từ captured fingerprints: **33/33 business tables** same count +full PK hash +full-row hash; bao gồm evidence bytes/links, money/ledger/audit/usage/submissions/RowVersion. History13→14, applied set delta chỉ planned ID, không ID bị bỏ. |
| Indexes | Full raw signatures của2optional legacy indexes PRE/POST bằng nhau; các required indexes/FK/check/column shapes được strict catalog POST so clean baseline. Không thêm uniqueness hoặc drop/rebuild legacy index. |
| Repeats | Clean/restored full-chain repeat:34table count/key/fullrow hashes bằng trước repeat, gồm history. Safety trước hook và sau hook+negatives cũng34/34 bằng nhau. |
| Negative guards / rollback | Missing table51001, missing column51002, rolled back owned transaction; fresh independent connection xác minh canonical names/lengths, empty synthetic evidence và history13. Other unexpected-shape/oversize cases nằm SQL16. Offline Down3/3 kiểm fail trước legacy Down, không actual downgrade DB. |
| Backup relationship | Restored baseline34tables bằng pre-backup source; fresh B2main34tables vẫn bằng same source34tables. Không suy ngày29 tự bảo đảm backup ngày30: wrapper bắt fresh equality +backup bytes hash +fresh VERIFYONLY trước apply. |

`verification/independent-preservation-and-trx.json` giữ reviewer recompute, không chỉ copy runtime booleans. `runtime/b2-validation.json` SHA `650b156554cd255731f606230aa1f2b14d0001eab09e1de2fc897e0991d42624` đồng ý với các kết quả này.

## P2 closed — X lock trước mọi ALTER

Đọc toàn `b2-table-x-hook.ps1`, instrumented SQL và result. Reviewer byte-check: bỏ đúng **một** comment+WAITFOR8s trả lại nguyên rawUp bytes hash `69d79032c5d95ce1bc99cf574fccae738e27b5e72d33b5540dc50030e8b27356`. Instrumented hash `6778de61c0882b363cf04a830c882dbe369cd6971840d8cada840f01863864fe`; không dùng bản instrumented để apply main.

Setup max/max đã autocommit trước measured transaction: -1/-1,@@TRANCOUNT0, owner chỉ DATABASE S và không Sch-M. Tại hook sau byteguard/trước first ALTER, owner72 có granted **OBJECT X** đúng evidence object690101499 trên16lockpartitions, không Sch-M. Writer73 INSERT201 ký tự bị `LCK_M_IX`, blockedby72 trên đúng object khi owner đang WAITFOR trước ALTER. Sau ALTER+COMMIT, writer lỗi2628; final400/100bytes,0evidence/history13. Result SHA `4cc85cba3b97e81e0fb2e79f96ce8cdea8540b55e37d4971c8b569c4e6ffc7f7`.

Failed hook observer attempt cũ đòi exactly1OBJECTX trong khi DMV có16partitions được giữ; correction artifact assertion ít nhất1 đúngobject hợp lý. Đây không là migration failure hoặc việc che thiếu lock. Failed candidate Msg102 và failed runner QI0/Msg1934 cũng giữ nguyên; corrected `sqlcmd -I` chạy same frozen SQL. Không chuyển lịch sử Failed thành Passed.

## Exact main wrapper review

Đã đọc full wrapper, independently hash-check và PowerShell parser0errors; **không execute** trong reviewer. `verification/wrapper-static-verification.json` giữ results.

- Pin parent17source qua frozen manifest, manifest hash, incremental, clean baseline, fingerprint helper, parent API/probe và API copy cạnh probe. Reviewer rehash parent17source:17/17match R1; pinned binaries/helper đều match. Parent API SHA `1497eab5c545e04ffbdd44091c94af18050e864756855a8747a5ff9a8f268485`; probe `de5022e8ac451b2b8b926b2e88712111cf7d8dd8e7c08f493eed0109406a1698`.
- Exact local server/database/id7/state guards; no other target sessions/requests/transactions, data-fit check và caller/QI metadata; final quiescence check ngay trước SQL apply. Unknown sessions được giữ và wrapper abort, không kill/reset. Maintained writer-free window do root/runtime sở hữu.
- Fresh serializable34table fingerprint phải bằng `source-before-backup.json` gắn actual restore-tested backup. Backup file SHA phải `ebc3bac4a26ff7222401d37309d47aaef7848b55eb1f0b54d0d91b6b3d7ee856`, tiếp theo fresh `RESTORE VERIFYONLY ... CHECKSUM,STOP_ON_ERROR`. Đây chỉ verify backup, không RESTORE DATABASE main. StageA actual restore/CHECKDB proof vẫn còn và B2restored clone đã apply/preserve thành công.
- Official parent PRE bind exact clean-chain baseline SHA `5fc4a8014e452a4338a0f32d993a8f5d6a533f7f30e4e2aee6f0e028dda74d61` và plannedSQL hash, check source/applied sets/model/required catalog/exact legacy allowance. Count13 ở wrapper là extra pin của known unchanged cutover baseline, không dùng count thay set comparison hoặc đòi source13=applied13 sau sync.
- Apply same frozen incremental qua explicit `-d FormAutoHub`, Integrated Security, `sqlcmd -I -b -t60`; SQL không USE/databaseDDL/cross-DB redirect. Existing migration BEGIN/Up/historyINSERT/COMMIT giữ shared transaction; byte guard dưới TABLOCKX/HOLDLOCK được SQL proof bên trên. Không production SQL mutation để phục vụ review.
- Official POST compatible/pending0/model false, applied14 giữ mọi oldID và thêm đúng1ID; all33business fingerprints bằng before, exact2legacyindexsignatures bằng PRE. Source-set policy bảo đảm addedID chính là planned normalization. Không report success chỉ từ commandexit.
- Unique output guards bảo toàn evidence; catch ghi failure và dừng, không automaticDown/restore/drop/cleanup/retry. Nếu failure sau commit, chỉ reviewed forward recovery hoặc quyền recovery riêng; không suy rollback saucommit.

## Files changed / Scope alignment

Chỉ tạo mới `main-apply-review/report.md` và bounded `verification/` hashes/comparisons/static parser evidence. Không ghi đè `fix-r1-review/report.md` hoặc old review/runtime/source. Không SQL connection/query/DDL/DML, process/API/browser, build/test rerun, installation, commit/remote/cleanup/child dispatch. Parent integration17files được kiểm riêng và matches same approved R1; không thêm business/schema/index/lifecycle behavior.

## Validation performed

**Verified trong reviewer:** filesystem reads/hashes; actual16TRX outcomes; independent33business/history/index/repeat/main-backup equality comparisons; hook byte provenance và DMV observations; finalB2report+wrapper hash; parent17source/binaries/helper bindings; wrapper parser0errors. Evidence hashes ở `verification/runtime-evidence-hashes.json`, integrated source hashes và static/provenance JSON riêng. Fresh focused24pass/SQLexport/model/Down của prior R1review được giữ riêng, không chạy lại build/fullsuite không cần thiết.

**Verified qua sole runtime evidence:** actual clean/restored/safety SQL applies/repeats/probe, timeout scenarios, negative guards, lock proof, SQL16cases. Reviewer không tự gọi SQL; phân biệt producer/runtime và independent evidence review.

## Validation not performed / Risks / Deferred

**Not run tại report freeze:** main wrapper execution, fresh checks do chính wrapper thực thi, main POST/preservation, owned API restart/intendedtarget/read-only roles/HTTP/browser hydration/chunks/log smoke, full original error-audit runtime cases. Các gate đó vẫn bắt buộc sau schema cutover; GO này không là whole DBsync Done hoặc release. Các error branches ngoài16cases/6harness không được tuyên bố đã test toàn bộ.

Không có quyền restore đè user DB, reset/drop/history cleanup hoặc provider/production/release. Deferred: audit remediation, canonical legacy index semantics/workload, NU1603 repair. Backup và clone/evidence tiếp tục giữ; exact equality proof không là semantic ledger/accounting audit.

## Next recommended step

Root gửi sole runtime owner GO đúng wrapper+SQL hashes ở đầu report, giữ writers/API dừng, thực thi một lần và kiểm main POST/data/index/history trước start API. Sau đó restart owned parent API với intended DB, thực hiện safe read smoke main; synthetic roles/mutations và provider stubs zero external cost dùng owned clone khi tiếp tục FAH-ERR-001. Báo kết quả thật, giữ các audit/runtime gate còn thiếu mở; không claim full system Done từ schema success.
