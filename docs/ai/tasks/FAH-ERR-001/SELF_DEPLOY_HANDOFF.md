# FAH-ERR-001 — Bàn giao tự triển khai

Ngày 2026-10-30. Phạm vi tài liệu: chuẩn bị để người dùng tự triển khai bản sửa lỗi đã review; agent chỉ đọc repository và ghi bàn giao. **Production/deployment: Not run. Production migration history, pending migrations, backup, keys và health hiện tại: UNKNOWN.** Không SSH, probe public, commit/push/merge, chạy workflow, thay cấu hình hay migration trong lần bàn giao này. Hai bản AI/VI dùng cùng nội dung tiếng Việt để giữ nguyên từng lệnh vận hành.

## Kết quả local và điều kiện release

[Acceptance hiện tại](REMEDIATION_VALIDATION.md) và [review độc lập cuối](../../../../artifacts/reports/error-remediation-2026-10-30/final-overall-review/report.md) chấp nhận 24/24 finding ở boundary local đã ghi, không còn source finding mở. Đây không phải bằng chứng production hoặc toàn hệ thống không còn lỗi.

- Local backend: 291 Passed / 6 SQL migration opt-in Skipped / 0 Failed; sáu ca vẫn **Skipped**, không được đổi thành pass nhờ SQL durability tests. Remediation không sửa schema; DB-sync là baseline riêng.
- Lint exit 0 còn hai warning cleanup numeric ref ở profile/security; build thành công vẫn giữ baseline NU1603. Không gọi lint/build “không warning”.
- Broad browser 83 vẫn là 69 pass / 14 fail với các rerun nhắm đích tiếp theo; không có full83 rerun green. H cuối ba ESM entrypoint pass không giải thích được lần cold health failure trước đó; cần kiểm cold startup sau deploy.
- Live Google/OAuth, AI có phí, PayOS/charge, gửi form thật, public/tunnel và production **Not run**. Chỉ chạy provider/payment sandbox thêm khi người dùng chủ động cấp môi trường/quyền phù hợp; không tự tạo phí/giao dịch/submission để hoàn tất smoke.
- [DB-sync local](../FAH-DB-SYNC-001/INDEX.md) đã Verified trên SQL Windows local: current13/applied14/pending0/modelPendingfalse, có đúng một history-only legacy được chấp nhận. **Không replay DB-sync local; không suy production có cùng trạng thái.**

**Chưa sẵn sàng bấm deploy ngay:** worktree còn nhiều thay đổi/untracked/ignored thuộc nhiều task. Commit SHA gốc `a19f7a2f3dc1bc54ff645d662d94fc614439256a` không chứa các patch chưa commit. Cần người dùng chốt đúng snapshot đã review thành release commit trên `main`, kiểm CI và checkpoint production ở dưới. Không dùng `git add -A`, reset/clean hoặc ghi đè work khác để tạo release.

Đường integration đang chuẩn bị là draft PR xếp lớp: review baseline `review/fah-err-baseline-a19f7a2` tại `a19f7a2…`, candidate `fix/fah-err-001-closeout-20261030`, DB-sync17 tách commit khỏi ERR80/docs/evidence đã curate. Đây là **kế hoạch snapshot/review**, không xác nhận branch/PR đã tồn tại trên remote. Baseline có bốn commit UI/workflow trước đó chưa nằm trên production main; diff PR chỉ cô lập phần DB/ERR phía trên baseline. **PR base này không phải production main/release-ready ref.** Trước khi đưa lên main, người dùng cần quyết định/review riêng toàn bộ chuỗi prerequisite, gồm các commit UI/workflow đó; không merge draft stack thẳng main chỉ vì diff ERR đã accepted. Release workflow chỉ nhận SHA reachable `origin/main`, không phải tên branch draft hoặc uncommitted snapshot. Xem hồ sơ closeout/integration của root để lấy actual commit/PR sau khi được tạo.

## Đường triển khai thực tế trong repository

Đối chiếu [CI](../../../../.github/workflows/ci.yml), [release workflow](../../../../.github/workflows/deploy.yml), [deploy script](../../../../scripts/deploy-production.sh), [Compose](../../../../docker-compose.prod.yml), [API Dockerfile](../../../../Dockerfile.api), [Web Dockerfile](../../../../apps/web/Dockerfile), [Program](../../../../src/FormAutoHub.Api/Program.cs), [deployment guide](../../DEPLOYMENT_GUIDE.md) và [environment](../../ENVIRONMENT_SETUP.md).

**Push `main` → CI thành công → tự build/push GHCR images → deploy production qua SSH.** Kiểm protection/reviewer thực tế trước khi merge/push; YAML không chứng minh protection đã bật. Không coi push là chỉ lưu source. Manual `Release and Deploy Production` cũng triển khai thật và không có job chạy lại unit/lint/browser trước deploy; phải chọn commit có CI/checks phù hợp đã pass.

Workflow build cả API và Web theo full lowercase 40-character SHA, yêu cầu commit reachable từ `origin/main`. Không có switch frontend-only/API-only trong workflow hiện tại; không tự đổi pipeline để tách release.

| Thành phần | Cấu hình đã có / cần người dùng xác nhận lại |
| --- | --- |
| VPS | Deployment guide ghi `113.23.68.58`, user `deploy`, SSH `1122`; chưa kiểm tra hiện tại. Dùng đúng endpoint/fingerprint GitHub environment `production`; không tắt host-key verification. |
| Cwd VPS | `DEPLOY_PATH`, guide mặc định `/home/deploy/FormAuto_Hub`; dùng giá trị environment thực, không mặc định mù. |
| Containers | `formauto-sql` (SQL Server 2025 CU7), Compose service `formauto-api`, `formauto-web`. API/Web container names lấy bằng `docker compose ps -q`, không hardcode số suffix. |
| Runtime | SQL `127.0.0.1:1433`, API `127.0.0.1:5100` → container8080, Web `127.0.0.1:3000`; public qua reverse proxy. |
| Secrets | `/etc/formauto/api.env`, `/etc/formauto/sql.env`; chỉ kiểm tra protected storage/quyền/khả năng đọc, không `cat`, chụp màn hình hay đưa giá trị vào log/report. |
| Persistence | Named volumes SQL data và Data Protection; backups mount `${DEPLOY_PATH}/sql/backups` → `/var/opt/mssql/backups`. Không `down -v`, xóa volume hay thay key/application discriminator. |
| Public build config | Repo vars `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SITE_URL` phải HTTPS; Google public client/callback vars nếu dùng. `NEXT_PUBLIC_*` là công khai và được compile vào Web image. Sửa `.env.production` trên VPS không sửa bundle đã build. |
| Deploy settings | Environment vars `DEPLOY_HOST`, `DEPLOY_PORT`, `DEPLOY_USER`, `DEPLOY_PATH`, `DEPLOY_SSH_FINGERPRINT`, `PRODUCTION_URL`; secret `DEPLOY_SSH_KEY`. Workflow mặc định port1122 nếu thiếu. Không thay/chụp giá trị secret để bàn giao. |

## 1. Chốt source và production preflight trước mọi push main

Trên Windows, PowerShell tại `D:\TinHoc\FormAuto_Hub` (chỉ đọc; không fetch/push ở bước này):

```powershell
Set-Location -LiteralPath 'D:\TinHoc\FormAuto_Hub'
git status --short
git branch --show-current
git rev-parse HEAD
```

Đối chiếu ownership manifest của [remediation](../../../../artifacts/reports/error-remediation-2026-10-30/dossier-checkpoint/owned-delta-from-baseline371-final.json) và [DB-sync](../../../../artifacts/reports/db-sync-2026-10-29/dossier/current-source-inventory.json). Chỉ release snapshot thực sự chứa source/test/migration đã review; giữ nguyên artifacts, backup, worktree và local config. Việc tạo commit/merge/push là thao tác release do người dùng quyết định riêng, không được thực hiện bởi bàn giao này. Nếu chỉ muốn lưu source nhưng chưa muốn deploy, không push main khi trigger/protection chưa được xử lý.

Người dùng tự mở phiên SSH đã tin cậy tới đúng endpoint ở bảng trên. Trên VPS Bash, đặt đường dẫn từ GitHub `DEPLOY_PATH`; các lệnh sau không in env/secrets:

```bash
set -Eeuo pipefail
read -r -p 'DEPLOY_PATH đã xác nhận: ' DEPLOY_PATH
[[ "$DEPLOY_PATH" = /* && -d "$DEPLOY_PATH" ]]
cd "$DEPLOY_PATH"
test -f docker-compose.prod.yml
whoami
docker compose version
docker compose -f docker-compose.prod.yml ps
test ! -f .deploy/current-release || cat .deploy/current-release
docker compose -f docker-compose.prod.yml images
sudo test -r /etc/formauto/api.env
sudo test -r /etc/formauto/sql.env
sudo stat -c '%a %U:%G %n' /etc/formauto/api.env /etc/formauto/sql.env
```

Kỳ vọng đúng `deploy`/Compose v2, đúng ba service đang có; file secrets theo guide `600 root:root` và deploy identity có quyền vận hành hiện hữu. Nếu `sudo`/Docker/secret read fail thì dừng, không chmod mở rộng tùy tiện. Ghi lại previous good SHA và image references **ngoài Git**, bảo vệ bản ghi. Không dùng `docker inspect` toàn bộ container hoặc `docker compose config` không `--quiet` vì có thể lộ env.

## 2. Guard production DB và bảo toàn trước thay container

**API gọi `db.Database.Migrate()` vô điều kiện khi startup.** `compose up --wait` sẽ tạo startup/migration thật, không phải dry run. `/health` là health endpoint cơ bản, không kiểm tính đúng schema/ledger/provider.

Người vận hành xác nhận database đích trong `/etc/formauto/api.env` bằng công cụ bảo mật tại chỗ, không đưa connection string ra terminal/report; rồi nhập tên database ở dưới. Tên `FormAutoHub` trong guide là ví dụ cấu hình đã có, không phải chứng cứ đích hiện tại. Query sau chỉ metadata/count, không đọc nội dung người dùng:

```bash
read -r -p 'Database production đã đối chiếu api.env: ' APP_DB
[[ "$APP_DB" =~ ^[A-Za-z0-9_]+$ ]]
docker exec -i -e APP_DB="$APP_DB" formauto-sql bash -c '
  export SQLCMDPASSWORD="$MSSQL_SA_PASSWORD"
  exec /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -C -I -b -d "$APP_DB"
' <<'SQL'
SELECT CONVERT(nvarchar(128),SERVERPROPERTY('ServerName')) AS ServerName, DB_NAME() AS DatabaseName;
SELECT MigrationId, ProductVersion FROM dbo.__EFMigrationsHistory ORDER BY MigrationId;
SELECT c.name, TYPE_NAME(c.system_type_id) AS SqlType, c.max_length, c.is_nullable
FROM sys.columns AS c WHERE c.object_id=OBJECT_ID(N'dbo.TopupOrderEvidenceFiles')
AND c.name IN (N'OriginalFileName',N'ContentType');
SELECT COUNT_BIG(*) AS OversizeRows FROM dbo.TopupOrderEvidenceFiles
WHERE DATALENGTH(OriginalFileName)>400 OR DATALENGTH(ContentType)>100;
SQL
```

Đối chiếu **exact migration IDs**, không chỉ số dòng history, với release source. Normalization mới `20261029142938_NormalizeTopupEvidenceColumnLengths` thu hẹp canonical `nvarchar(200)`/`nvarchar(50)` (400/100 UTF-16 bytes), có transaction/X-lock/15s timeout/shape và oversize guards; Down chủ động throw. [Migration source](../../../../src/FormAutoHub.Api/Data/Migrations/20261029142938_NormalizeTopupEvidenceColumnLengths.cs). Không truncate dữ liệu, xóa history hay replay migration cũ để vượt guard.

Nếu normalization/khác migration còn pending, sai shape/oversize, hoặc lịch sử khác chưa được giải thích: **Blocked cho deploy** đến khi có kế hoạch production cụ thể được review, backup restore rehearsal trên clone, kiểm schema/preservation/transactions và cửa sổ dừng writers. Query trên chưa chứng minh full compatibility hay EF model-pendingfalse. Probe [db-compatibility](../../../../scripts/db-compatibility/README.md) khóa Windows local/Integrated Security và clean DB tên cụ thể; **không chạy probe hoặc local main wrapper lên VPS**, không copy SQL failed candidate. Không có production migration runner đã verify trong bàn giao này.

Sau checkpoint đã chấp nhận đích/migration/recovery và vào maintenance window, người dùng dừng writers đúng phạm vi (kể cả tác nhân ngoài API nếu có), rồi tạo backup trước khi release:

```bash
cd "$DEPLOY_PATH"
API_CONTAINER=$(docker compose -f docker-compose.prod.yml ps -q formauto-api)
test -n "$API_CONTAINER"
BACKUP_STAMP=$(date -u +%Y%m%dT%H%M%SZ)
BACKUP_FILE="FAH_ERR_001_pre_${BACKUP_STAMP}.bak"
BACKUP_DIR="/home/deploy/formauto-backups/FAH_ERR_001_${BACKUP_STAMP}"
umask 077
mkdir -p "$BACKUP_DIR"
docker compose -f docker-compose.prod.yml stop formauto-web formauto-api
docker cp "$API_CONTAINER:/var/lib/formautohub/data-protection-keys" "$BACKUP_DIR/data-protection-keys"
test -n "$(find "$BACKUP_DIR/data-protection-keys" -maxdepth 1 -name 'key-*.xml' -print -quit)"
sudo install -m 600 /etc/formauto/api.env "$BACKUP_DIR/api.env"
sudo install -m 600 /etc/formauto/sql.env "$BACKUP_DIR/sql.env"
docker exec -i -e APP_DB="$APP_DB" -e BACKUP_FILE="$BACKUP_FILE" formauto-sql bash -c '
  export SQLCMDPASSWORD="$MSSQL_SA_PASSWORD"
  exec /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -C -I -b -d "$APP_DB" -v AppDb="$APP_DB" BackupFile="$BACKUP_FILE"
' <<'SQL'
BACKUP DATABASE [$(AppDb)] TO DISK=N'/var/opt/mssql/backups/$(BackupFile)' WITH COPY_ONLY,CHECKSUM;
RESTORE VERIFYONLY FROM DISK=N'/var/opt/mssql/backups/$(BackupFile)' WITH CHECKSUM;
SQL
sudo install -m 600 "$DEPLOY_PATH/sql/backups/$BACKUP_FILE" "$BACKUP_DIR/$BACKUP_FILE"
sudo sha256sum "$BACKUP_DIR/$BACKUP_FILE"
```

Kỳ vọng sqlcmd exit0, backup completed và verify valid; file backup không bị ghi đè do timestamp riêng. Bảo vệ toàn bộ `BACKUP_DIR`/key XML/config, sao lưu ra protected storage theo quy trình quản trị; không đưa vào Git/artifact công khai. **VERIFYONLY không thay actual restore+CHECKDB/preservation rehearsal.** Nếu copy key ring không tồn tại hoặc lỗi, dừng thay container, điều tra recovery; database backup một mình không giải mã được AI/PayOS/Google ciphertext. Khi bất kỳ bước nào fail, giữ maintenance/evidence, quyết định recovery có review; không tiếp tục deploy hay tự restore đè database.

## 3. Người dùng chạy release đúng SHA

Chỉ sau khi prerequisites/backup/migration checkpoint đã pass và nguồn đã được chốt đúng snapshot:

1. Kiểm GitHub repo vars/environment ở bảng, GHCR pull access, reverse proxy/TLS, disk và backup capacity. Không đặt deterministic AI adapter production; không đổi JWT/key ring nếu không có kế hoạch migration riêng.
2. Người dùng thực hiện integration/push main có chủ đích. CI chạy API build/test, Web lint/build, container build. Nó không chạy auth/Playwright/docs checks hay SQL opt-in tests nếu chưa cấu hình, nên CI xanh không thay các gate đó.
3. Theo dõi `Release and Deploy Production`, xác nhận full SHA đúng. Nếu environment yêu cầu reviewer, phê duyệt khi checkpoint sẵn sàng. Nếu không có protection, deploy sẽ tự chạy ngay sau CI success.
4. Nếu release commit đã trên main và chủ động chạy lại: GitHub Actions → `Release and Deploy Production` → `Run workflow` trên main → `release_sha=<full SHA đã review>`. Kiểm CI commit đó trước vì đường manual không đợi CI. Không để trống SHA để tránh deploy nhầm selected ref.

Deploy script lấy Compose từ exact SHA, giữ `.deploy/docker-compose.prod.previous.yml`, pull cả hai image, `up -d --remove-orphans --wait --wait-timeout 180`, gọi local health/Web rồi mới ghi `.deploy/current-release`. Kỳ vọng workflow success và `Deployment completed for release <SHA>`. Script **không** backup DB/keys, preflight migrations, kiểm role/browser/public chunks, tự rollback hoặc tự restore DB. Không chạy `docker compose up` thủ công với default `latest`; workflow mới export đúng image names/tag.

## 4. Kiểm sau restart trên production vừa deploy

VPS Bash, cwd `$DEPLOY_PATH`; dùng SHA vừa chọn làm expected, không chỉ đọc nhãn workflow:

```bash
cd "$DEPLOY_PATH"
cat .deploy/current-release
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml images
curl --fail --silent --show-error http://127.0.0.1:5100/health
curl --fail --silent --show-error --output /dev/null --write-out '%{http_code}\n' http://127.0.0.1:3000/
curl --silent --show-error --output /dev/null --write-out '%{http_code}\n' http://127.0.0.1:5100/api/profile
API_CONTAINER=$(docker compose -f docker-compose.prod.yml ps -q formauto-api)
docker inspect --format='{{index .Config.Labels "org.opencontainers.image.revision"}}' "$API_CONTAINER"
docker inspect --format='{{range .Mounts}}{{.Destination}} {{.Type}}{{println}}{{end}}' "$API_CONTAINER"
docker exec "$API_CONTAINER" sh -c 'test -n "$(find /var/lib/formautohub/data-protection-keys -maxdepth 1 -name "key-*.xml" -print -quit)"'
docker compose -f docker-compose.prod.yml logs --tail=120 --no-color formauto-api formauto-web formauto-sql
```

Kỳ vọng đúng release SHA/image revision, cả ba healthy, API body `Healthy`, Web200, anonymous profile401, DP volume đúng path/có key. Xem bounded logs tại chỗ để tìm migration/decryption/startup/request lỗi; không xuất raw log/secrets/payload vào report. Lặp metadata DB ở bước2 để xác nhận expected IDs/schema thực tế; lưu kết quả đã redact và lý do không còn pending theo exact release chain. Không coi health200 là thay bước DB.

Qua trình duyệt **origin public thực tế** từ `PRODUCTION_URL`/repo vars: mở trang/login, đăng nhập tài khoản kiểm thử User và Admin riêng, hard reload các route liên quan; Network xác nhận API gọi đúng production origin, JS/CSS `/_next/static/` cần thiết HTTP200 và không hydration/pageerror. Kiểm cả lần tải đầu sau restart để phát hiện cold health/chunk lỗi. Không đưa token/cookie/password vào evidence.

| Role/check | Kết quả cần ghi |
| --- | --- |
| Chưa login | `/api/profile`401; protected UI chuyển login theo session hiện hữu. |
| User | Profile200, dashboard/forms/usage/credit/top-up/NCKH tải đúng; lỗi đọc được phân biệt với danh sách rỗng. Network GET `/api/admin/packages`403 bằng session User, không dùng tài khoản Admin để kết luận role guard. |
| Admin | GET `/api/admin/packages`200, các màn AI/PayOS/package/manual-credit hiển thị; không bấm lưu secret/approve/adjust để smoke. |
| Shared errors | Read retry không gửi lại POST/PUT; error copy an toàn, không raw provider/body/HTML; status401 Google không bị suy thành JWT refresh sai. Fault injection/error-path đầy đủ nên chạy ở staging/fake boundary được phép, không gây lỗi production để thử. |
| Ownership/privacy | Chỉ tài khoản và tài nguyên test có quyền; không dò ID người khác. Local owner200/other404 đã có bằng chứng riêng, không biến thành claim production nếu chưa kiểm. |

Smoke script đã có chỉ login/route/heading/button và phát hiện pageerror/chunk fail; không analyze/generate/submit. **Tùy chọn**, chạy ở Windows local với dependencies/browser đã có và tài khoản test production người dùng cho phép. Cwd root; lệnh đầu dùng User, lệnh thứ hai chỉ dùng Admin sau khi thay credential. Không ghi credential vào shell history:

```powershell
Set-Location -LiteralPath 'D:\TinHoc\FormAuto_Hub'
$env:SMOKE_BASE_URL = Read-Host 'Web production origin (https://.../)'
$smokeCredential = Get-Credential -Message 'Tài khoản smoke User được phép'
try {
    $env:SMOKE_EMAIL = $smokeCredential.UserName
    $env:SMOKE_PASSWORD = $smokeCredential.GetNetworkCredential().Password
    node apps/web/smoke-test.mjs
    if ($LASTEXITCODE -ne 0) { throw 'User bounded smoke failed; giữ evidence và điều tra' }
} finally {
    Remove-Item Env:SMOKE_EMAIL,Env:SMOKE_PASSWORD,Env:SMOKE_BASE_URL -ErrorAction SilentlyContinue
    $smokeCredential = $null
}
```

Admin: chạy lại cùng block với credential Admin và đổi entrypoint thành `node smoke-test.mjs` (thêm kiểm trang admin AI). Không chạy `smoke-debug.mjs` như bằng chứng mạnh hơn; nó dùng cùng User helper. Nếu thiếu browser/dependency, ghi **Blocked/Not run** và dùng kiểm trình duyệt thủ công có record; không tự cài để kết thúc bàn giao. Exit0 chỉ xác nhận smoke giới hạn; không xác nhận API/SQL/provider toàn trình.

## 5. Rollback và tiêu chí bàn giao kết quả

Nếu app regression: giữ current/previous SHA, logs đã redact và DB migration history; chặn thao tác gây phí/mutation theo maintenance plan. Đường rollback image có sẵn là chạy workflow thủ công với **previous good full SHA reachable main**. Cả API/Web được rebuild theo **repo vars hiện tại**, nên cần đối chiếu vars đã thay hay chưa; đây không phải tự chọn lại image digest cũ. `.previous.yml` là bằng chứng dự phòng, không phải nút auto rollback và không lưu tag đã export.

Trước rollback image, review schema/ciphertext compatibility của code cũ với database hiện tại. Normalization mới **forward-only**, không chạy `dotnet ef database update <old>`/Down, ManualCreditFlow.Down, xóa history hoặc widen đoán. Database restore đè production là thao tác riêng có mất dữ liệu sau backup, cần kế hoạch/quyền phục hồi và rehearsal; runbook này không phê duyệt hoặc cung cấp lệnh restore đè. Giữ SQL/DP volumes và backup. Sau rollback cũng chạy lại health/roles/browser/chunks/log/DB checks tương ứng.

Người vận hành ghi UTC, expected/actual SHA, CI/deploy run URL, database identity/migration disposition, backup+key-ring protected location, health/role/chunk assertions và bounded log kết luận (đã redact). Dùng **Verified / Failed / Not run / Blocked** cho từng mục. Các provider/payment/submission chưa chạy vẫn Not run. Chỉ kết luận production release sau checks production thực tế; local acceptance không tự trở thành release.

**Bước tiếp theo:** người dùng kiểm production preflight + backup/migration checkpoint trước khi tạo sự kiện push main hoặc manual release. Nếu muốn dừng ở closeout local, giữ bàn giao này và trạng thái deployment Not run; không cần triển khai để thay đổi kết luận 24 finding local.
