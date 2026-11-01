# Main attempts01–02 — guard abort, chưa apply

2026-10-30 ICT. Cả hai attempts chạy đúng reviewed wrapper/hash và user/root authorization; giữ main writers/API dừng. **Cả hai dừng ở final quiescence trước gọi normalization SQL. Không có `main-normalization-01.log` hoặc `main-normalization-02.log`, không POST hoặc history write.** Main vẫn history13/two max/evidence5,34fingerprints bằng restore-tested backup.

Attempt01: initial guards/fingerprint/backuphash/VERIFYONLY/officialparentPRE pass; final Msg51202. Independent query ngay sau process exits không còn session/request/transaction. Năm read-only samples sau PRE cũng0 nhưng không xác định được activity tại thời điểm lỗi. Review đã cấp đúng một attempt02 để thêm diagnostics, không nới guard.

Attempt02: `main-cutover-quiescence-final-02.log` UTC19:37:46.027 ghi otherSessions1/requests0/transactions0 và **SPID53,is_user_process1,sleeping,open_transaction_count0,program_name FAHERR001_Fingerprint**. Đây là connection do chính helper tạo, `Close()` trả vào SqlClient pool trong cùng PowerShell process đang sống. Khi wrapper process exits, independent diagnostic0sessions. **Root cause là resource-release bug trong artifact runner, không migration/source defect và không writer người dùng.** Guard đúng khi abort; không override/KILL/ClearAllPools.

Correction được chuẩn bị riêng để review: `Capture-Fingerprint-NoPooling.ps1`, chỉ thêm `Pooling=false` cho exactowned connection string. Original `Capture-Fingerprint.ps1` giữ SHA956b0b7...; before-pooling-fix copy giữ cùng bytes. New helper SHAf459752d05fd7b66a7414523e2acf65e7d1125d5ac122f271705abdc0ec33745. Không đổi serializer/query/hash semantics; no business DML.

Same-process proof: helper mới đọc main34tables, sau Close gọi independent sqlcmd **trước PowerShell parent kết thúc**; UTC19:39:08.103 otherSessions0,ownedFingerprintSessions0,targetTransactions0. `main-no-pooling-helper-release-proof.json`34/34count/key/fullrow hashes bằng source-before-backup; log giữ zero-session assertion. Không chạy migration hoặc API main trong proof.

Final attempt03 wrapper `main-apply-reviewed-attempt03.ps1` SHA32a89cc669efd11afd70f525f725115179715e1a886766109991d2f444091a8a: only suffix02→03 + helperpath/hash pin; same guards/THROW/source/binary/SQL/backup/PRE/POST/preservation. `main-attempt03-final-wrapper-diff.patch`; parser0errors. **Chưa execute; chờ fresh independent review/rootGO03.** Draft675... khác helperpath đã superseded trước execute, không dùng hash đó.

R1/R2 failure JSON/logs, original wrappers và oldhelper giữ nguyên. Không drop/reset/Down/historyrewrite/automaticrestore/cleanup. Main sync chưa Done; independent owned-clone HTTP audit đã tiến hành theo authorization riêng và ghi dưới `error-audit-2026-10-29/deep/api-sql/`.
