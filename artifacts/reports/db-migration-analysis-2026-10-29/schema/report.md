# Kiểm tra chỉ đọc: DB thực tế, EF model và migrations

Ngày 2026-10-29; HEAD `a19f7a2f3dc1bc54ff645d662d94fc614439256a`; agent `gpt-6.1-sol`, reasoning `high`, không agent con. Đây là phân tích để duyệt đề xuất, không phải triển khai sửa DB.

## Summary

**Verified:** DB local đã có đủ cả 12 migration hiện tại; EF trả **0 pending migrations**, **HasPendingModelChanges=false**, diff model/snapshot **0 operations**. History có thêm `20260601083335_Phase10ManualCreditOperations`; riêng dòng này không chứng minh DB hỏng hoặc startup bị lỗi.

**Verified:** có khác biệt schema nhỏ còn lại từ storage legacy: 2 cột minh chứng vẫn là `nvarchar(max)` thay vì độ dài 200/50, và 2 index bổ sung. Migration hiện tại cố ý adopt bảng cũ, chỉ tạo khi thiếu; không có bước thu hẹp cột hoặc xóa index cũ. Vì thế migration history đầy đủ và model/snapshot đồng bộ vẫn có thể đi cùng khác biệt catalog thực tế.

**Not run:** startup API, `Migrate()`, DDL/DML, clean/existing test DB application, runtime HTTP/auth/ledger checks. Không thể chứng nhận startup thành công bằng metadata/harness này. Startup thật vẫn gọi `Migrate()` tại `Program.cs:142`, nên chưa chạy vào DB người dùng trong phiên chỉ đọc.

## Target và bảo toàn dữ liệu

- Kết nối từ file Development, được parse trong bộ nhớ và guard bắt buộc local `localhost`/`.`/`(local)`, database `FormAutoHub`, Integrated Security. Không xuất connection string, password, token hay nội dung appsettings. Không có environment override `ConnectionStrings__DefaultConnection` khi harness chạy. Đây là target Development được kiểm tra, không khẳng định mọi host/environment dùng cùng target.
- SQL trả server/machine `DESKTOP-TS5JR7L`, default instance (`InstanceName=null`), DB `FormAutoHub`, SQL Server `17.0.1145.4`, Standard Developer Edition 64-bit, compatibility 170, collation `SQL_Latin1_General_CP1_CI_AS`, DB không read-only, Read Committed Snapshot ON, Snapshot Isolation OFF. `sql-metadata.json` chứa identity đầy đủ, không credentials.
- Chỉ SELECT sys catalogs và `__EFMigrationsHistory`; thêm một SELECT aggregate đếm độ dài để đánh giá bảo toàn dữ liệu. Không đọc business row IDs, filename, MIME values, binary content, email, số tiền hoặc ledger descriptions.
- `sys.partitions` ước lượng: evidence 5, top-up orders 26, credit accounts 37, credit transactions 142, audit logs 30. Đây là metadata approximate counts, không kiểm toán ledger/balance.
- Aggregate thật: **5 evidence rows; 0 tên dài hơn 400 bytes; 0 content-type dài hơn 100 bytes** (`DATALENGTH`, không dùng LEN để bỏ sót trailing spaces). Tại thời điểm đo, cả 5 rows vừa `nvarchar(200)` và `nvarchar(50)`. Điều này không chứng minh một ALTER đã chạy, không đảm bảo rows phát sinh sau đó, không cho phép truncate/delete dữ liệu.

## Ba loại lệch được tách riêng

| Loại kiểm tra | Actual result | Ý nghĩa |
| --- | --- | --- |
| Tập migration source/applied | 12 source, 13 applied; đủ cả 12 current IDs; extra 1 legacy ID | Không có current migration chờ áp dụng; không cần sửa history chỉ để count bằng nhau |
| Current EF design model ↔ current ModelSnapshot | `HasPendingModelChanges=false`; `IMigrationsModelDiffer` 0 operations | Không phát hiện EF9 model/snapshot drift trong assembly vừa build từ source hiện tại |
| Current relational model ↔ SQL catalogs | 33 tables, 311 expected columns, 33 keys, 52 expected indexes, 28 FKs, 2 check constraints đã đối chiếu; 11 raw differences được phân loại dưới đây | Có legacy shape khác nhau; EF pending/model checks không so catalog DB với model |

Danh sách migration đầy đủ và extra/pending arrays ở `ef-model.json`; `pending=[]`, `extraHistory=[20260601083335_Phase10ManualCreditOperations]`. Không có missing/extra application table, missing/extra column, PK/FK/check mismatch hay disabled/untrusted constraint trong phạm vi đối chiếu. History table được loại khỏi application model comparison có chủ đích.

## Khác biệt thực sự liên quan storage legacy

| Object | Current EF/snapshot/clean ManualCreditFlow | Actual DB | Hệ quả |
| --- | --- | --- | --- |
| `TopupOrderEvidenceFiles.OriginalFileName` | `nvarchar(200) NOT NULL` | `nvarchar(max) NOT NULL` | DB rộng hơn model, không thiếu dữ liệu/cột. API upload hiện cắt tên ở 200 UTF-16 units; DB hiện không tự cưỡng chế trần này |
| `TopupOrderEvidenceFiles.ContentType` | `nvarchar(50) NOT NULL` | `nvarchar(max) NOT NULL` | API hiện chỉ tạo `image/png`, `image/jpeg`, `image/webp`; DB rộng hơn model |
| `IX_TopupOrderEvidenceFiles_TopupOrderId` | Không khai báo trong current model/migration | UNIQUE NONCLUSTERED `(TopupOrderId) WHERE TopupOrderId IS NOT NULL`, enabled | Cưỡng chế thêm tối đa một evidence row cho mỗi order ID khác NULL; xóa index làm yếu ràng buộc DB, không phải cleanup thuần túy |
| `IX_TopupOrderEvidenceFiles_UserId_TopupOrderId` | Không khai báo trong current model/migration | NONCLUSTERED `(UserId,TopupOrderId)`, nonunique, enabled | Index phụ, có chi phí ghi/storage; chưa đo workload/performance nên chưa kết luận cần xóa |

Không phát hiện extra FK từ evidence `TopupOrderId` tới orders. Unique index trên evidence `TopupOrderId` khác với unique constraint trên order `EvidenceFileId`; không được suy diễn hai thứ đồng nghĩa.

Các prerequisite mà `20261007181332_ManualCreditFlow.Up()` đảm bảo đều có và phù hợp: evidence table 8 cột, PK `Id`, nullable `TopupOrderId`; `TopupOrders.EvidenceFileId uniqueidentifier NULL`; `TopupOrders.RowVersion` và `UserCreditAccounts.RowVersion` là SQL Server timestamp/rowversion 8 bytes NOT NULL; index order `EvidenceFileId` và evidence `UserId`; FK `FK_TopupOrders_TopupOrderEvidenceFiles_EvidenceFileId` đúng cột/target, enabled/trusted, ON DELETE NO ACTION, tương đương `DeleteBehavior.Restrict` trên SQL Server. Chỉ 2 độ dài evidence khác clean-create shape.

Các cột còn lại của evidence: `Id/UserId uniqueidentifier NOT NULL`, `TopupOrderId uniqueidentifier NULL`, `Length bigint NOT NULL`, `Content varbinary(max) NOT NULL`, `CreatedAt datetimeoffset(7) NOT NULL`; defaults/computed không có. `CreditTransactions` và `UserCreditAccounts` không có missing columns, decimal precision/nullability/key khác model trong phần đã so.

## 7 raw differences không được quy thành 7 lỗi mới

`schema-diff.json` giữ nguyên **11 raw differences**, không giấu kết quả ban đầu. Ngoài 4 khác biệt legacy bên trên:

- 3 unique AI indexes có thêm `IS NOT NULL` filters: `IX_AiPromptProfiles_ProjectId_Mode`, `IX_AiProviderSettings_Provider`, `IX_AiQuestionPrompts_ProfileId_QuestionId`. Tất cả cột tham gia là NOT NULL, nên predicate luôn đúng với rows hợp lệ. Chính `IMigrator.GenerateScript()` của chain hiện tại sinh các filters này; không phải bằng chứng riêng của Phase10 hoặc lỗi uniqueness. Chưa benchmark execution-plan/performance.
- Defaults `GeneratedResponses.IsReadOnly` và `NormalizedDatasets.IsStale`: SQL `CONVERT(bit,(0))` so với model boolean false, tương đương giá trị mặc định. Đây là khác cách biểu diễn trong diff thô.
- `Users.FailedLoginCount` có DB DEFAULT 0 và `UserExternalLogins.UpdatedAt` có DEFAULT `'0001-01-01T00:00:00.0000000+00:00'` trong khi current model không khai báo default. Cả hai được current migration chain tạo khi ADD NOT NULL column; offline SQL xác nhận. Không cần xóa default chỉ để khớp object model; tác động với out-of-band INSERT chưa kiểm thử.

## Đề xuất kỹ thuật và kết quả dự kiến, chưa thực thi

1. **Giữ history và DB hiện tại, gỡ kết luận “13 vs 12 là lỗi” khỏi chẩn đoán.** Không mất dữ liệu; current pending vẫn 0. Ghi nhận 4 legacy shape deltas và test runtime trên DB được phép ghi. Đây là lựa chọn ít thay đổi nhất nếu mục tiêu chỉ là xác minh mismatch. Không tự chứng minh API runtime pass.
2. **Nếu cần schema chuẩn giống clean model: thêm forward migration mới để normalize có điều kiện.** Không sửa/xóa history legacy, không sửa migration đã applied để hy vọng nó chạy lại. Recheck DATALENGTH aggregate trong cửa sổ deploy rồi narrow 2 cột nếu an toàn; nếu có overlength, dừng và xin quyết định bảo toàn/chuyển đổi, không truncate. Xử lý 2 extra indexes riêng: giữ và quản lý chính thức hoặc loại bỏ chỉ sau duyệt invariant/workload. Current 5 rows vừa độ dài; thay đổi vẫn cần test clean + representative existing test DB, lock/recovery plan và independent review. Schema normalize hoàn toàn có thể cần quyết định index model; không giả định phải drop cả hai.
3. **Nếu muốn giữ legacy như baseline chính thức: thiết kế cập nhật model/migration nhất quán.** Lựa chọn chấp nhận cột max hoặc quản lý unique/composite indexes đòi hỏi duyệt persistence/contract rationale; không tự nới approved API limits. Model + snapshot + future clean DB chain phải thống nhất, tránh chỉ sửa snapshot hoặc chỉ đánh dấu history. Tốn scope hơn yêu cầu diagnosis, chưa có phê duyệt triển khai.
4. **Tạo test DB độc lập từ current migration chain sau khi được phép ghi.** Bảo toàn DB người dùng, so clean shape với legacy shape và chạy startup/credit/evidence/concurrency/rollback tests ở đó. Đây là nơi xác minh runtime; không phải sửa local DB đang dùng. Không tạo/restore/copy DB trong lượt này.

Không đề xuất `DELETE __EFMigrationsHistory`, downgrade/reset/drop DB, thêm lại migration cũ chỉ để count khớp, hoặc chạy `database update` không kiểm tra. Chúng không tự thu hẹp 2 cột/index, có thể làm lịch sử sai hoặc mất dữ liệu. `ManualCreditFlow.Down()` chỉ drop rowversions nhưng giữ evidence/links; downgrade cũng không hoàn tác đầy đủ adoption và làm mất concurrency tokens.

## Validation performed và evidence

- **Verified**, cwd repo root: `& ./artifacts/reports/db-migration-analysis-2026-10-29/schema/run.ps1`, exit 0. Build toàn bộ current API source trong artifact-only project bằng existing cached assets và `--no-restore`; không chạy entrypoint. `source-build.log`: 0 errors, 1 NU1603 warning existing Google Forms version resolution `1.69.0.3673`; không install/restore. Harness compiled bằng Roslyn hiện có, có assembly-version unification warnings nhưng chạy exit 0.
- Harness guard target rồi SELECT metadata từ `sql-readonly.sql`; EF đọc migrations và tạo relational model/snapshot diff. `run.log`: tables33/source12/applied13/pending0/modelChangesfalse/snapshotDiff0; không host và không gọi Migrate/EnsureCreated/SaveChanges. `sql-metadata.json` và `ef-model.json` là dữ liệu đầu vào cho diff.
- **Verified**: `python artifacts/reports/db-migration-analysis-2026-10-29/schema/compare.py`, exit 0; 11 raw differences được phân loại ở trên. Comparator chuẩn hóa timestamp=rowversion, SQL Restrict=NO_ACTION, whitespace/parentheses cosmetic. Không phải full semantic SQL proof; các expression khác được reviewer đọc thủ công/source-chain đối chiếu.
- **Verified**: `sqlcmd -S localhost -E -C -d FormAutoHub -l 5 -b -W -s '|' -i <schema>/preservation-counts.sql -o <schema>/preservation-counts.log`, exit 0, aggregate `5|0|0`. Không row values/IDs.
- `offline-current-chain.sql` và `offline-manual-credit.sql` chỉ được GenerateScript và lưu file. Chúng chứa DDL nhưng **chưa bao giờ gửi SQL Server thực thi**; không phải remediation script đã duyệt, không phải schema đã applied trong lượt này.
- Đã đọc full context, migration ManualCreditFlow, relevant entities/services/test và relevant docs; test hiện tại `ManualCreditFlowTests` dùng EF InMemory, không chứng minh SQL schema/rowversion/index/transaction behavior.
- `hashes.json` ghi source-input và artifact hashes. Không tạo listener/process dài hạn, không dừng SQL service/process người dùng, không cleanup evidence.

Harness development retries trước kết quả thành công: thêm compile reference SqlClient bị thiếu; đổi snapshot initialization sang `IModelRuntimeInitializer` có trong runtime; dùng deps/runtimeconfig của API build và copy runtime-specific dependencies; escape SQL alias `[identity]`. Các lỗi này xảy ra trong harness artifact, không phải sản phẩm/DB lỗi. SQL alias error chỉ là SELECT parse failure. Copy retry từng tạo nested artifact-only `obj/obj`; giữ nguyên, không cleanup; build cuối không lỗi. Current `run.log`/`compile.log` là lần thành công cuối, không giả làm log toàn bộ retry.

## Files changed, scope alignment, validation not performed

Chỉ ghi `artifacts/reports/db-migration-analysis-2026-10-29/schema/`: report, SQL SELECT scripts, metadata/model/diff JSON, harness/compile/build/run evidence, offline SQL, source-build/runtime artifacts. Không sửa product/docs/test repository, Git history, tracked config hoặc DB. Các artifacts/report cũ và dirty/untracked công việc khác được giữ nguyên.

**Not run:** DDL/DML/migration/up/down, create/restore/reset/backup DB, startup API/listeners, HTTP/browser/auth role smoke, real provider/payment/submission, integrity/PII/ledger row audit, migration apply to clean/existing SQL DB, narrowing operation/lock behavior, runtime SQL concurrency/transaction tests. Không có deployment/integration/release claim.

## Risks/Deferred items và Next recommended step

**Deferred:** mọi remediation; kế hoạch normalization/index/schema baseline cần duyệt riêng. Kiểm tra này không tìm thấy căn cứ để coi extra history là startup blocker; việc chưa chạy API là giới hạn read-only, không phải reproduced startup failure. Root nên trình lựa chọn giữ nguyên/normalize/test DB với kết quả và chi phí tương ứng, rồi thực hiện đúng phương án được user chọn.
