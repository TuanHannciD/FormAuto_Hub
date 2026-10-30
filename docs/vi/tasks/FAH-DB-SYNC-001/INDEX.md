# FAH-DB-SYNC-001 — Đồng bộ cơ sở dữ liệu local

2026-10-30 (giữ evidence dưới đường dẫn 2026-10-29) · HEAD nền `a19f7a2f3dc1bc54ff645d662d94fc614439256a` · **Đã tích hợp source R1;rehearsal SQL riêng Verified;normalization main Verified;smoke API main và review cuối độc lập Verified. **Hoàn tất DB sync local giới hạn.****

## Closeout — DB sync local giới hạn Verified

[Review cuối độc lập](../../../../artifacts/reports/db-sync-2026-10-29/final-review/report.md),SHA256 `64796a012c30d21adadb7f3e1845b8f81f79bfb6aa24999ae93fb6b3ae630624`,nhận source17,SQL/main preservation thật,startup/read smoke main thật,evidence clone18+4API giới hạn và packet/resource proof cuối. Không còn blocker code/SQL/runtime cho scope đồng bộ hai cột đã duyệt. Integrity docs cuối/ý nghĩa AI-VI do người viết này kiểm;reviewer không chứng nhận bytes bản dịch cuối.

Timeline30tháng10 ICT:binary parent R1 sẵn sàng02:25;normalization main02:42:12;read smoke main02:42:34–36;supplement evidence clone02:45:23;StateListen release cuối07:15:17;freeze review độc lập07:17:27. Source/evidence vẫn local/chưa commit,không push/deploy/release. Giữ backup/DB riêng/key/evidence,không cleanup.

**Tiếp theo:** checkpoint DB này hoàn tất. Đã giao audit lỗi gốc giới hạn với24nhóm chưa sửa;gap provider/browser/toàn hệ thống còn Not run/Deferred,không chặn persistence scope được review này. Chọn nhóm remediation cụ thể trước khi sửa product;không tự mở thêm case hoặc activate provider.

## Normalization main và audit thật tiếp tục — hiện tại

**Verified main apply thật UTC2026-10-29T19:42:12 (ICT2026-10-30):** attempt03 dùng wrapper/helper NoPooling đã review chính xác,cùng incremental R1 không đổi. Main current13/applied14,pending0/modelPendingfalse,POST compatible,canonical400/100bytes;chỉthêm planned migration,count/PK/full-row hash33bảng business không đổi,giữ hai index legacy exact INFO. [Kết quả execute](../../../../artifacts/reports/db-sync-2026-10-29/runtime/main-cutover-result-03.json),[POST thật](../../../../artifacts/reports/db-sync-2026-10-29/runtime/main-cutover-post-03.log). History14/source13 là legacy đã biết đúng kỳ vọng,không blocker. Program/Migrate startup/read smoke main thật nay Verified:health200,profile anonymous401,route thiếu404;PID24496/5247 riêng đã dừng theo yêu cầu,fingerprint34bảng sau migration không đổi qua startup. [HTTP proof](../../../../artifacts/reports/error-audit-2026-10-29/deep/api-sql/main-http-results.json). [Review cuối độc lập](../../../../artifacts/reports/db-sync-2026-10-29/final-review/report.md) nhận DB sync giới hạn và audit đại diện;không release/full-system.

Attempts01/02 dừng trước normalization bởi guard không đổi;attempt02 chứng minh session fingerprint pooled riêng. Helper NoPooling riêng/attempt03 đã có [GO độc lập mới](../../../../artifacts/reports/db-sync-2026-10-29/main-apply-review-attempt03/report.md);giữ helper gốc/evidence lỗi,không nới guard. [Lịch sử attempt](../../../../artifacts/reports/db-sync-2026-10-29/runtime/main-attempts01-02-report.md). Candidate SQL Msg102 ban đầu giữ Failed/đã rút;R1source17integration/B2SQL16pass0skip là evidence thành công riêng.

[Follow-up API/JWT/SQL thật](../FAH-ERR-001/RUNTIME_API_SQL.md) nay ghi **15scenario+health+2authsetup=18quan sát HTTP** trên restored clone riêng,session User/Admin/refresh thật,13/18log correlation bằng trace hiện hữu. Tăng ERR-002MVC errors/traceId thật,ERR-005UsageLog AnalyzeForm thất bại persisted và ERR-013HTTP500 thật/noPackagePersist;không ID mới/sửa lỗi. Fixture sau B2 khiến clone hiện không còn byte-equal main. Browser/provider/full E2E còn thiếu;không nâng mock cũ hoặc18quan sát thành đã test cả24nhóm.

## Phạm vi và quyền thực hiện

Người dùng cho phép đồng bộ local thực với backup/restore an toàn,rồi tiếp tục [FAH-ERR-001](../FAH-ERR-001/INDEX.md). Root chỉ điều phối. Scope:một forward migration guarded `20261029142938_NormalizeTopupEvidenceColumnLengths`,probe compatibility chỉ đọc,SQL test và runtime audit phù hợp. Cột evidence canonical:`OriginalFileName nvarchar(200) NOT NULL`, `ContentType nvarchar(50) NOT NULL`. Giữ row/bytes/link/credit/ledger/audit/history/rowversion/FK và hai index legacy optional đúng shape. Không reset/drop/restore đè main,xóa history,truncate,đổi hợp đồng/index,sửa nhóm lỗi hoặc release.

“Sạch” là required schema đúng canonical cùng allowance legacy tương thích rõ. History13/source12/pending0 ban đầu là baseline legacy đã biết,không chứng minh DB hỏng/startup lỗi. Source đã tích hợp hiện13 migration/model-pendingfalse;main nay14dòng history:gồm13current và một legacy đã biết,normalization applied,pending0. Không gate bằng count.

## Acceptance và evidence hiện tại

| Bước | Trạng thái và bằng chứng |
| --- | --- |
| Chẩn đoán/thiết kế/preflight | Verified analysis/review giới hạn;pre-sync cho planned pending chính xác,tách khỏi compatibility post-sync nghiêm. [Review preflight](../../../../artifacts/reports/db-sync-2026-10-29/preflight-review/report.md). |
| Backup/restore Stage A | Verified backup COPY_ONLY/CHECKSUM9,916,416 bytes,VERIFYONLY/header/filelist,restore thật+CHECKDB,count/PK/full-row hash34bảng bằng nhau. [Report](../../../../artifacts/reports/db-sync-2026-10-29/runtime/stage-a-report.md). |
| Candidate ban đầu | **Failed;đã rút GO cũ.** SQL clean riêng thật Msg102 gần `SET LOCK_TIMEOUT` dùng biến;giữ patch/SQL/failure state cũ. [Rút GO](../../../../artifacts/reports/db-sync-2026-10-29/code-review/report-stage-b-failure.md). Không apply SQL cũ. |
| Review/tích hợp source R1 | Verified review GO đúng17file,chỉ3delta so candidate lỗi;đã copy/rehash ở parent. [Review mới](../../../../artifacts/reports/db-sync-2026-10-29/fix-r1-review/report.md),[tích hợp](../../../../artifacts/reports/db-sync-2026-10-29/integration/fix-r1/report.md). Build Release pass;offline182pass/0fail/**6nhóm SQL skipped**. Skip không là SQL proof. |
| SQL B2 thật | **Verified16/16pass,0fail,0skip**,thêm6branch timeout success/error độc lập,khôi phục setting caller-1/0/4321 và giữ original51002. [Assertion](../../../../artifacts/reports/db-sync-2026-10-29/runtime/b2-validation.json). |
| X lock từ guard tới ALTER | Verified setup max/max riêng đã COMMIT,không Sch-M trước,raw Up chính xác chỉ chèn hook sau byte guard. DMV:OBJECT X evidence trên16partition,writer LCK_M_IX bị chặn trước ALTER đầu;sau owner COMMIT writer lỗi2628. [Hook](../../../../artifacts/reports/db-sync-2026-10-29/runtime/b2-table-x-hook-result.json),[provenance độc lập](../../../../artifacts/reports/db-sync-2026-10-29/main-apply-review/verification/independent-hook-provenance.json). |
| Kết quả clean/restored/safety | Cả3DB test riêng POST compatible/pending0. Clean history13;restored history13→14 chỉ thêm planned ID. Count/PK/full-row hash33bảng application không đổi,giữ2index legacy chính xác. Repeat clean/restored34bảng no-op;negative guard/rollback connection độc lập pass. [Assertion độc lập](../../../../artifacts/reports/db-sync-2026-10-29/main-apply-review/verification/independent-preservation-and-trx.json). |
| Wrapper/review main | Wrapper gốc đã review/kiểm hash;**attempt01 đã execute và dừng bởi guard trước migration**:`dd27c4515da3476961958f3f3ec68b65275cf33aa685451aa1011ca04b9bced9`. [Kiểm tĩnh](../../../../artifacts/reports/db-sync-2026-10-29/main-apply-review/verification/wrapper-static-verification.json). [Review main độc lập](../../../../artifacts/reports/db-sync-2026-10-29/main-apply-review/report.md) đã GO exact-wrapper;failure guard attempt01 và state attempt02 phía trên thay mốc chưa execute cũ. |
| Main apply/audit API/browser | **Schema main và API read smoke Verified.** Fingerprint34bảng main vẫn bằng backup đã restore thử tại mẫu B2. Cần fresh cutover check;main result thật ở trên;smoke API/review cuối được nhận;full audit còn thiếu. |

## Source R1 bất biến và chính sách warning

Patch `40d5b3efeec58a4ef0314e3dc61349ddcf33b24186b60c8b8433ae3b4e03b75c`;SHA256 review `4c1291d1c3f51bd67f9d4ec66a27cdac743883c1884f892ddbce4e6f6615ba5c`. SQL incremental `dce67d64eeae54917532b6905146b7259f576fbbd1886a8d2699543db6dfb362`;fullchain `81e3b60f5d6426303f256e254501a442889e511e912f54841c183d690ca78807`. Toàn Up dùng một constant `sys.sp_executesql`,literal timeout15000;giữ transaction caller dùng chung,guard byte/shape/X-lock và Down fail closed. [Inventory17file hiện tại](../../../../artifacts/reports/db-sync-2026-10-29/dossier/current-source-inventory.json) và [hash tích hợp](../../../../artifacts/reports/db-sync-2026-10-29/integration/fix-r1/final-validation.json) định danh source parent. Inventory candidate cũ là lịch sử,không cần khớp worktree đã đổi.

Giữ các attempt Failed:lỗi grammar SQL ban đầu;NETSDK1004 parent đầu được xử lý bằng restore cache local có sẵn;B2 sqlcmd QUOTED_IDENTIFIER OFF1934 được sửa runner `-I` ON với cùng frozen SQL (session0→1),không source patch. Cảnh báo NU1603 Forms baseline và key-length index lịch sử vẫn công khai. Không claim “hết mọi warning” hoặc suppression.

## Sở hữu và tài nguyên giữ lại

Root `gpt-6.1-sol / medium` điều phối;worker được giao `gpt-6.1-sol / high`,không con/Astra. Checkout isolated gốc `C:/Users/Tuan/.t3/worktrees/FormAuto_Hub/t3-ecd39b00`;parent `D:/TinHoc/FormAuto_Hub`,branch `ui/compact-refinement-20261028`,HEAD nền không đổi. Tích hợp17source chính xác là local/chưa commit;kiểm riêng bytes321nguồn sàng lọc lỗi lịch sử,không claim toàn source hiện tại không đổi. Không commit/push/deploy.

Owner SQL/runtime duy nhất `/root/db_sync_runtime_owner`. Giữ restore DB `FormAutoHub_FAHERR001_restore_20261029_a19f7a2`,clean DB `FormAutoHub_FAHERR001_clean_20261029_a19f7a2`,safety DB `FormAutoHub_FAHERR001_safety_20261029_a19f7a2`,backup/evidence và ignored output. Identity id8/id9 Stage A mô tả lúc acquire;safety về sau là DB test riêng. Backup ngoài Git tại SQL default Backup directory `FormAutoHub_FAHERR001_pre_sync_20261029_a19f7a2.bak`,SHA256 `EBC3BAC4A26FF7222401D37309D47AAEF7848B55EB1F0B54D0D91B6B3D7EE856`. Không raw row/secret trong report;chưa duyệt cleanup. Người viết chỉ sửa task docs/dossier song ngữ,không acquire DB/process/browser.

## Rủi ro,Deferred và bước tiếp theo

Wrapper main phải kiểm mới identity/quiescence/source34bảng bằng backup,backup hash+VERIFYONLY,binary/source/PRE parent và SQL planned hash chính xác,rồi POST/preservation. Mẫu B2 không giữ chỗ tương lai. Down không suy được baseline cũ;restore đè main vẫn ngoài scope. [Validation](VALIDATION.md) ghi check thật.

Tiếp theo:hoàn tất review độc lập exact-wrapper/cutover,chỉ execute main sau root GO đã review,rồi restart API riêng đúng binary và kiểm HTTP/role/log/browser thật phù hợp;tiếp tục audit lỗi giới hạn. Cả24nhóm sửa lỗi,hợp đồng/correlation mới,recovery/retention,ngữ nghĩa index,provider/payment/submission live và release còn Deferred. Chưa Done tới khi đạt gate main/runtime/review bắt buộc.
