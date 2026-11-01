# DB compatibility probe — normalization 2026-10-29

Probe chỉ đọc SQL/catalog và gọi các API EF thật: `GetMigrations`, `GetAppliedMigrations`,
`GetPendingMigrations`, `HasPendingModelChanges`. Không khởi động API, không `Migrate`,
`EnsureCreated`, `SaveChanges` hoặc business DML. Integrated Security, local instance,
server/database explicit; không đọc appsettings/secrets. Exit **0** theo state đã in,
**2** BLOCKING, **1** technical error có nguyên nhân; không tiếp tục sau exception.

`post-sync` là mặc định: pending0, model false, required schema bằng clean-chain catalog.
`pre-sync` chỉ cho phép đúng `20261029142938_NormalizeTopupEvidenceColumnLengths` pending,
SQL hash khớp manifest và hai cột đang canonical hoặc max với mọi thuộc tính khác đúng.
State `ready-for-planned-sync` không có nghĩa DB đã compatible. Oversize luôn BLOCKING;
migration kiểm lại trong X lock/transaction. Không waive max khi migration đã applied.

History-only `20260601083335_Phase10ManualCreditOperations` và đúng hai legacy index signatures
là INFO; absence index hợp lệ. Sai tên/shape/unique/filter/order/include/enabled hoặc extras
khác đều BLOCKING. Raw differences luôn được giữ. Clean-chain catalog so đúng defaults,
filters, PK/indexes, FK/check trust, rowversions, columns và các objects khác đã capture;
không normalize tùy ý SQL definitions. Baseline được đối chiếu thêm với storage tables/columns
của current relational model. Capture chỉ nhận exact owned clean DB của runtime plan.

## Offline build và export

Từ isolated checkout, chỉ restore existing cache; không install/update:

```powershell
dotnet restore tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj --source C:/Users/Tuan/.nuget/packages --ignore-failed-sources
dotnet build FormAutoHub.sln -c Release --no-restore
dotnet test FormAutoHub.sln -c Release --no-restore
dotnet scripts/db-compatibility/bin/Release/net9.0/DbCompatibilityProbe.dll --write-scripts <new-empty-output-directory> --source-commit a19f7a2f3dc1bc54ff645d662d94fc614439256a
```

Export dùng provider SQL Server thật để sinh incremental và idempotent full-chain; không mở
connection. UTF-8 không BOM; `sql-manifest.json` chứa SHA-256 chính xác của bytes được viết.
`sourceCommit` là base do operator khai báo; source patch/hash và assembly hash là provenance
bổ sung bắt buộc, không gọi base commit là commit đã chứa uncommitted patch.

## Thứ tự runtime owner — không chạy trong implementer

Root phải review immutable patch/SQL. Runtime owner dùng backup/restore/clean stage đã review,
xác minh local target/writers/files và tạo clean DB bằng reviewed full-chain script trước capture.
Không capture baseline từ main/restored legacy hoặc từ model-only DDL. Không sửa baseline
cho giống main. Baseline defaults/filters đến từ chính migration chain SQL Server thật.

```powershell
$probe = '<reviewed-checkout>/scripts/db-compatibility/bin/Release/net9.0/DbCompatibilityProbe.dll'
$base = 'a19f7a2f3dc1bc54ff645d662d94fc614439256a'
$baseline = '<new-protected-runtime-output>/clean-baseline.json'
dotnet $probe --server DESKTOP-TS5JR7L --database FormAutoHub_FAHERR001_clean_20261029_a19f7a2 --source-commit $base --capture-baseline $baseline
if ($LASTEXITCODE -ne 0) { throw 'Capture failed' }
$baselineHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $baseline).Hash.ToLowerInvariant()
# Root/reviewer xác nhận baseline hash cùng clean-chain execution evidence trước dùng tiếp.
$plannedHash = '<normalization-only.sql SHA-256 từ reviewed sql-manifest.json>'
dotnet $probe --server DESKTOP-TS5JR7L --database FormAutoHub_FAHERR001_restore_20261029_a19f7a2 --source-commit $base --baseline $baseline --baseline-sha256 $baselineHash --mode pre-sync --planned-sha256 $plannedHash
if ($LASTEXITCODE -ne 0) { throw 'Pre-sync blocked' }
# Runtime owner apply reviewed incremental SQL vào restore clone, rồi:
dotnet $probe --server DESKTOP-TS5JR7L --database FormAutoHub_FAHERR001_restore_20261029_a19f7a2 --source-commit $base --baseline $baseline --baseline-sha256 $baselineHash --mode post-sync
if ($LASTEXITCODE -ne 0) { throw 'Post-sync blocked' }
```

Baseline hash phải đến từ manifest đã review; không tự tính lại để chấp nhận file bị sửa.
Không gọi startup API để apply. Runtime owner validate SHA-256, script không USE/cross-DB,
target identity và transaction boundary, rồi dùng `sqlcmd -S DESKTOP-TS5JR7L -E -C -d <exact-target>
-b -i <reviewed-script> -o <unique-owned-log>`. Full-chain chỉ cho clean; incremental cho restore/main.
Main `FormAutoHub` chỉ sau clone tests/preservation, independent patch review và root checkpoint
cho exact main wrapper/hash; trước/sau main dùng cùng probe với `--database FormAutoHub`.
Preflight metadata không thay backup, writer quiescence hoặc runtime/browser/auth/ledger gates.

## SQL safety tests

Runtime owner tạo riêng `FormAutoHub_FAHERR001_safety_20261029_a19f7a2` từ clean reviewed chain.
Không dùng restore clone chứa user data cho các ca varchar/collation conversion. Fixture không
CREATE/DROP DB; exact DB/server identity được guard. Synthetic inserts và ALTER trong transaction
được rollback, riêng concurrency commit widen+narrow để giữ canonical shape và chứng minh writer
bị chặn đến commit rồi lỗi 2628/8152. Cần quyền xem `sys.dm_exec_requests` cho concurrency case.

```powershell
$env:FORMAUTO_SQL_TEST_SERVER = 'DESKTOP-TS5JR7L'
$env:FORMAUTO_SQL_TEST_DATABASE = 'FormAutoHub_FAHERR001_safety_20261029_a19f7a2'
dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-restore --filter FullyQualifiedName~TopupEvidenceSqlServerTests --logger trx --results-directory <unique-owned-test-results>
```

Mandatory run phải assert **0 skipped**, tất cả expanded theory cases pass. Không set env thì
routine suite báo Skip/Not run, không có SQL proof. Các test này kiểm raw Up operation và catalog;
runtime rehearsal vẫn phải kiểm full EF-generated script/history trên clean/restored clones,
apply lại, exact original rows/bytes/links/money/ledger/audit/rowversions, failure rollback qua
connection mới và HTTP/browser smoke. Không dùng InMemory làm migration proof.

## Recovery

Không Down: migration mới throw `NotSupportedException` trước SQL/history deletion. Không thể
suy baseline cũ từ 200/50 sau Up; không widen đoán, không chạy ManualCreditFlow.Down (drop rowversions).
Failure trước commit: connection rollback, rồi kiểm schema/history/data độc lập. Sau commit:
giữ backup/evidence và writers trong maintenance scope, chuẩn bị reviewed forward repair.
Restore đè main cần quyền riêng; không reset/drop main hoặc xóa lịch sử/ledger để “sync”.
