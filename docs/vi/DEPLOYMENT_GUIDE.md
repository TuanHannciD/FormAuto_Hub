# DEPLOYMENT_GUIDE — FormAuto Hub Production Deployment

**Cập nhật lần cuối:** 2026-08-11 | **Phase:** Production CI/CD foundation

## Tổng quan kiến trúc

```text
Internet
  |
  v
nginx / reverse proxy :80/:443 trên VPS
  |---> 127.0.0.1:3000 -> formauto-web:3000  (Next.js standalone)
  |
  `---> 127.0.0.1:5100 -> formauto-api:8080  (ASP.NET Core .NET 9)
                                  |
                                  v
                         formauto-sql:1433 (SQL Server 2025 CU7)
                                  |
                                  v
                         Docker volume: formauto-sql-data
```

Các service app chỉ bind ra `127.0.0.1`. Public internet đi qua reverse proxy. SQL Server cũng chỉ bind localhost host port `1433`, không mở public.

Production deploy không build source trên VPS. GitHub Actions build API/Web image, push lên GHCR với tag full commit SHA, rồi SSH vào VPS để pull đúng image đó.

## Điều kiện cần

| Yêu cầu | Khuyến nghị | Lệnh kiểm tra |
|---|---|---|
| Ubuntu | 24.04+ | `lsb_release -a` |
| Docker Engine | 27+ | `docker --version` |
| Docker Compose | v2 plugin | `docker compose version` |
| Git | bất kỳ | `git --version` |
| curl | bất kỳ | `curl --version` |
| nginx | nếu tự quản reverse proxy | `nginx -v` |
| SSH user | `deploy` | `whoami` |

Domain cần trỏ về VPS:

- Web: `https://formautohub.<domain>`
- API: `https://api-formautohub.<domain>`

## Quick start lần đầu

### 1. Chuẩn bị repo trên VPS

Chạy trên VPS:

```bash
sudo adduser deploy --disabled-password
sudo usermod -aG docker deploy
sudo mkdir -p /home/deploy/FormAuto_Hub
sudo chown -R deploy:deploy /home/deploy/FormAuto_Hub

sudo -iu deploy
cd /home/deploy/FormAuto_Hub
git clone https://github.com/<owner>/FormAuto_Hub.git .
```

Nếu repo đã tồn tại, chỉ kiểm tra:

```bash
cd /home/deploy/FormAuto_Hub
git remote -v
docker compose version
```

### 2. Tạo runtime secrets trên VPS

Chạy trên VPS:

```bash
sudo mkdir -p /etc/formauto
sudo nano /etc/formauto/sql.env
sudo nano /etc/formauto/api.env
sudo chown root:root /etc/formauto/sql.env /etc/formauto/api.env
sudo chmod 600 /etc/formauto/sql.env /etc/formauto/api.env
```

`/etc/formauto/sql.env`:

```env
ACCEPT_EULA=Y
MSSQL_SA_PASSWORD=<strong-sql-password>
MSSQL_PID=Express
```

`/etc/formauto/api.env`:

```env
ConnectionStrings__DefaultConnection=Server=formauto-sql,1433;Database=FormAutoHub;User Id=sa;Password=<same-sql-password>;TrustServerCertificate=True;Encrypt=True;

Auth__Issuer=FormAutoHub
Auth__Audience=FormAutoHub
Auth__SigningKey=<random-secret>
Auth__GoogleClientId=<google-client-id>
Auth__GoogleOAuthClientId=<google-oauth-client-id>
Auth__GoogleOAuthClientSecret=<google-oauth-client-secret>

AI__ProviderAdapter=OpenAICompatible
AI__RequestTimeoutSeconds=300
AI__BatchSize=10
AI__MaxParallelBatches=5
```

Tạo `Auth__SigningKey`:

```bash
openssl rand -base64 48
```

### 3. Tạo deploy SSH key trên máy Windows/local

Chạy trong PowerShell trên máy cá nhân, không chạy trên VPS:

```powershell
New-Item -ItemType Directory -Force ~/.ssh
Test-Path ~/.ssh/formauto_github_actions
ssh-keygen -t ed25519 -C "github-actions-formauto-production" -f ~/.ssh/formauto_github_actions
```

Nếu dòng `Test-Path` trả về `True`, file key đã tồn tại. Đừng ghi đè nếu bạn không chắc; đổi tên file mới. Khi hỏi passphrase, nhấn Enter để trống vì workflow hiện tại chưa nhận SSH key passphrase.

Sau lệnh này có 2 file:

| File | Dùng để làm gì |
|---|---|
| `formauto_github_actions` | Private key. Dán toàn bộ nội dung vào GitHub secret `DEPLOY_SSH_KEY`. |
| `formauto_github_actions.pub` | Public key. Cài lên VPS trong `authorized_keys`. |

Cách lấy `DEPLOY_SSH_KEY`:

```powershell
notepad ~/.ssh/formauto_github_actions
```

Copy toàn bộ nội dung trong Notepad, từ dòng `-----BEGIN OPENSSH PRIVATE KEY-----` đến dòng `-----END OPENSSH PRIVATE KEY-----`. Đó chính là giá trị của GitHub secret `DEPLOY_SSH_KEY`.

### 4. Cài public key lên VPS

Giả sử VPS mới có IP ví dụ `203.0.113.10` và SSH port mặc định `22`. Khi làm thật, thay `203.0.113.10` bằng IP VPS của bạn. Nếu VPS dùng SSH port khác, thay `22` bằng port đó.

Bước 1 — mở public key trên máy Windows/local:

```powershell
notepad ~/.ssh/formauto_github_actions.pub
```

Copy toàn bộ một dòng trong file. Dòng đó bắt đầu bằng `ssh-ed25519`.

Bước 2 — vào VPS bằng root/password lần đầu:

```powershell
ssh root@203.0.113.10
```

Nếu nhà cung cấp VPS không bật root SSH, mở console trên trang quản lý VPS rồi đăng nhập bằng user/password họ cấp.

Bước 3 — tạo user `deploy` trên VPS:

```bash
adduser deploy
usermod -aG sudo deploy
```

Bước 4 — tạo file `authorized_keys` cho user `deploy`:

```bash
mkdir -p /home/deploy/.ssh
nano /home/deploy/.ssh/authorized_keys
```

Dán public key đã copy ở bước 1 vào file này. File chỉ cần một dòng bắt đầu bằng `ssh-ed25519`. Lưu file rồi thoát nano.

Bước 5 — sửa owner và permission trên VPS:

```bash
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Bước 6 — quay lại PowerShell trên máy Windows/local và test private key:

```powershell
ssh -i ~/.ssh/formauto_github_actions -p 22 -o IdentitiesOnly=yes deploy@203.0.113.10 "whoami"
```

Kết quả đúng:

```text
deploy
```

Nếu chưa ra `deploy`, dừng lại sửa SSH trước. Đừng dán private key vào GitHub khi test local còn fail.

### 5. Login GHCR trên VPS

Nếu GHCR package private, tạo GitHub classic token với scope `read:packages`, rồi chạy trên VPS bằng user `deploy`:

```bash
printf 'GHCR token: '
read -s CR_PAT
echo
echo "$CR_PAT" | docker login ghcr.io -u '<github-user>' --password-stdin
unset CR_PAT
```

Token GHCR không phải `DEPLOY_SSH_KEY`. Nó chỉ dùng để Docker trên VPS pull image private.

### 6. Điền GitHub Actions settings

Vào GitHub repo -> Settings -> Environments -> tạo/chọn `production`.

Environment variables:

| Variable | Value |
|---|---|
| `DEPLOY_HOST` | IP public hoặc DNS của VPS |
| `DEPLOY_PORT` | SSH port, ví dụ `1122` |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_PATH` | `/home/deploy/FormAuto_Hub` |
| `DEPLOY_SSH_FINGERPRINT` | Chỉ phần `SHA256:...` của SSH host fingerprint tại đúng IP/DNS và port deploy |
| `PRODUCTION_URL` | `https://formautohub.<domain>` |

Environment secret:

| Secret | Value |
|---|---|
| `DEPLOY_SSH_KEY` | Nội dung đầy đủ của private key `formauto_github_actions`, không phải file `.pub` |

Lấy host fingerprint từ máy Windows của bạn, không chạy trong VPS. Dùng đúng IP/DNS và SSH port đã nhập ở GitHub:

```powershell
ssh-keyscan -p 1122 203.0.113.10 > "$env:TEMP\formauto_host_key.txt"
ssh-keygen -lf "$env:TEMP\formauto_host_key.txt" -E sha256
```
Đổi `203.0.113.10` và `1122` thành server thật. Nếu output là `256 SHA256:... [203.0.113.10]:1122 (ED25519)` thì chỉ dán `SHA256:...`; không dán `256`, host, port, hoặc `(ED25519)`.
Vào GitHub repo -> Settings -> Secrets and variables -> Actions -> Variables.

Repository variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://api-formautohub.<domain>` |
| `NEXT_PUBLIC_SITE_URL` | `https://formautohub.<domain>` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google client id nếu dùng |
| `NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` | Google OAuth client id nếu dùng |
| `NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT_URI` | `https://formautohub.<domain>/dashboard/nckh/callback` |

Không tạo `apps/web/.env.production` trên VPS. Các `NEXT_PUBLIC_*` được compile vào Web image trong GitHub Actions.

### 7. Deploy

Sau khi code đã merge/push lên `main`:

- CI chạy API build/test, Web lint/build, Docker build validation.
- Deploy workflow build image immutable và SSH vào VPS.
- Production environment có thể chờ reviewer nếu đã bật protection.

Manual deploy: GitHub Actions -> `Release and Deploy Production` -> Run workflow -> nhập full commit SHA thuộc `main`.

## Thư mục production

```text
/home/deploy/FormAuto_Hub/
├── docker-compose.prod.yml       # Compose production
├── Dockerfile.api                # API image
├── apps/web/Dockerfile           # Web image
├── scripts/deploy-production.sh  # Script GitHub Actions chạy qua SSH
├── sql/backups/                  # Nơi mount backup SQL nếu dùng
└── .deploy/
    ├── current-release           # SHA deploy thành công gần nhất
    └── docker-compose.prod.previous.yml

/etc/formauto/
├── api.env                       # Runtime secrets cho API
└── sql.env                       # SQL Server env
```

## Deploy bản mới

```bash
git status
git push origin main
```

Sau khi CI pass, deploy tự chạy. Theo dõi trong GitHub Actions.

Xem release hiện tại trên VPS:

```bash
cat /home/deploy/FormAuto_Hub/.deploy/current-release
docker compose -f /home/deploy/FormAuto_Hub/docker-compose.prod.yml ps
```

Deploy script lấy Compose từ đúng commit release, pull API/Web image theo SHA, chạy Compose với health wait, smoke check API/Web localhost, rồi ghi `.deploy/current-release`.

## Health checks

```bash
curl -i http://127.0.0.1:5100/health
curl -i http://127.0.0.1:3000/
docker compose -f /home/deploy/FormAuto_Hub/docker-compose.prod.yml ps
```

Kỳ vọng: API trả `HTTP 200` và body `Healthy`, Web trả `HTTP 200`, và ba container đều healthy.

## Logs

```bash
cd /home/deploy/FormAuto_Hub

docker compose -f docker-compose.prod.yml logs --tail=120
docker compose -f docker-compose.prod.yml logs --tail=120 formauto-api
docker compose -f docker-compose.prod.yml logs --tail=120 formauto-web
docker compose -f docker-compose.prod.yml logs --tail=120 formauto-sql

docker compose -f docker-compose.prod.yml logs -f formauto-api
```

## Troubleshooting

### GitHub Actions báo `ssh: handshake failed`

Kiểm tra theo thứ tự:

```powershell
ssh -i ~/.ssh/formauto_github_actions -p 22 -o IdentitiesOnly=yes deploy@203.0.113.10 "whoami"
```

Nếu local cũng fail:

- `DEPLOY_USER` sai.
- `DEPLOY_PORT` sai.
- Public key `.pub` chưa nằm trong `/home/deploy/.ssh/authorized_keys`.
- Permission sai: `~/.ssh` phải `700`, `authorized_keys` phải `600`.
- Bạn đã dán nhầm `.pub` vào GitHub secret thay vì private key.

### GitHub Actions báo missing production setting

Vào Environment `production`, không phải chỉ repository secrets. Kiểm tra:
- Environment variables có `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`, `DEPLOY_SSH_FINGERPRINT`, `PRODUCTION_URL`.
- Environment secrets có `DEPLOY_SSH_KEY`.

Nếu báo `DEPLOY_SSH_FINGERPRINT must be an SHA256 host-key fingerprint`, sửa value chỉ còn dạng `SHA256:...`; không dán hostname hoặc `(ED25519)`.

Nếu báo `host key fingerprint mismatch`, lấy đủ fingerprint trên VPS bằng `for f in /etc/ssh/ssh_host_ed25519_key.pub /etc/ssh/ssh_host_rsa_key.pub /etc/ssh/ssh_host_ecdsa_key.pub; do sudo ssh-keygen -lf "$f" -E sha256; done`, rồi cập nhật `DEPLOY_SSH_FINGERPRINT` bằng phần `SHA256:...` của từng dòng; thực tế `drone-ssh` có thể dùng `ECDSA` dù máy bạn hiện `ED25519`.

### VPS pull GHCR image fail

Chạy trên VPS bằng user `deploy`:
```bash
docker login ghcr.io -u '<github-user>'
docker pull ghcr.io/<owner>/formauto-hub-api:<sha>
```

Nếu package private, token cần scope `read:packages`.

### API unhealthy

```bash
docker compose -f /home/deploy/FormAuto_Hub/docker-compose.prod.yml logs --tail=120 formauto-api
docker compose -f /home/deploy/FormAuto_Hub/docker-compose.prod.yml logs --tail=120 formauto-sql
```

Nguyên nhân thường gặp: mật khẩu SQL không khớp giữa `sql.env` và `api.env`, SQL chưa healthy, migration lỗi, hoặc thiếu runtime secret trong `/etc/formauto/api.env`.

### Web không gọi được API

Kiểm tra repository variable:

```text
NEXT_PUBLIC_API_BASE_URL=https://api-formautohub.<domain>
```

Sau khi đổi biến này phải build/deploy Web image mới. Không sửa `.env.production` trên VPS.

### Port đã bị chiếm

```bash
sudo lsof -i :1433
sudo lsof -i :5100
sudo lsof -i :3000
sudo lsof -i :80
sudo lsof -i :443
```

## Rollback

Rollback image bằng cách chạy workflow thủ công với commit SHA tốt trước đó:

```bash
git log --oneline -10
```

Sau đó GitHub Actions -> `Release and Deploy Production` -> Run workflow -> `release_sha=<good-full-sha>`.

Quan trọng: rollback database không tự động. Nếu release mới đã chạy migration không backward-compatible, phải review database trước khi rollback image.
