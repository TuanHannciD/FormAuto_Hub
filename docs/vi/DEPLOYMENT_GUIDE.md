# DEPLOYMENT_GUIDE — Hướng Dẫn Triển Khai Lần Đầu

## Mục đích

Hướng dẫn từng bước triển khai FormAuto Hub lên máy chủ Linux mới bằng Docker Compose.

## Đối tượng

Kỹ sư DevOps và lập trình viên triển khai FormAuto Hub lần đầu tiên.

---

## Tổng Quan Kiến Trúc

| Thành phần | Công nghệ | Cổng | Ghi chú |
|---|---|---|---|
| SQL Server | MSSQL 2025 | 1433 | Dữ liệu lưu qua Docker volume |
| Backend API | ASP.NET Core 9 | 8080 (nội bộ) → 5100 (host) | Chỉ bind localhost |
| Web Dashboard | Next.js 15 | 3000 (nội bộ) → 3000 (host) | Chỉ bind localhost |
| Reverse Proxy | nginx / Caddy (bên ngoài) | 80, 443 | Không bao gồm; cài riêng |

Topology production điển hình:

```
Internet → Reverse Proxy (nginx/Caddy) → [formauto-web:3000, formauto-api:8080]
                                                    ↕
                                              formauto-sql:1433
```

---

## 1. Điều Kiện Tiên Quyết

### 1.1 Máy chủ

- Ubuntu 24.04 (hoặc mới hơn) với tối thiểu:
  - 2 nhân CPU
  - 4 GB RAM
  - 30 GB dung lượng trống
- Truy cập SSH với user `sudo` không phải root
- Cổng 80 và 443 mở (firewall / security group)
- Tên miền trỏ về IP máy chủ để dùng HTTPS

### 1.2 Các gói cần cài

```bash
sudo apt update
sudo apt install -y git curl ca-certificates
```

Cài Docker (nếu chưa có):

```bash
curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
sudo sh /tmp/get-docker.sh
sudo usermod -aG docker $USER
newgrp docker   # hoặc logout rồi login lại
```

> Docker Compose v2 đã đi kèm với Docker Engine 24+.

Kiểm tra:

```bash
docker --version          # ≥ 27
docker compose version    # ≥ 2
```

---

## 2. Thiết Lập Repository

Clone vào thư mục deploy (điều chỉnh theo nhu cầu):

```bash
sudo mkdir -p /home/deploy/FormAuto_Hub
sudo chown $USER:$USER /home/deploy/FormAuto_Hub
cd /home/deploy/FormAuto_Hub
git clone https://github.com/<tổ-chức-của-bạn>/FormAuto_Hub.git .
```

Đường dẫn deploy mặc định dùng trong CI: `/home/deploy/FormAuto_Hub` (có thể cấu hình qua secret `DEPLOY_PATH`).

---

## 3. Cấu Hình Biến Môi Trường

FormAuto Hub cần **hai file env** đặt tại `/etc/formauto/`. Tạo thư mục:

```bash
sudo mkdir -p /etc/formauto
```

### 3.1 `/etc/formauto/sql.env` — Thông Tin SQL Server

```env
# Bắt buộc — đổi mật khẩu thành chuỗi bảo mật mạnh
ACCEPT_EULA=Y
MSSQL_SA_PASSWORD=<MẬT_KHẨU_SA_MẠNH>
MSSQL_PID=Express
```

Ví dụ:

```env
ACCEPT_EULA=Y
MSSQL_SA_PASSWORD=MyStr0ng!Pass123
MSSQL_PID=Express
```

### 3.2 `/etc/formauto/api.env` — Cấu Hình Backend API

```env
# --- Database ---
ConnectionStrings__DefaultConnection=Server=formauto-sql,1433;Database=FormAutoHub;User Id=sa;Password=<CÙNG_MẬT_KHẨU_SA>;TrustServerCertificate=True;Encrypt=True;

# --- Auth ---
Auth__Issuer=FormAutoHub
Auth__Audience=FormAutoHub
Auth__SigningKey=<CHUỖI_NGẪU_NHIÊN_64_KÝ_TỰ>
Auth__GoogleClientId=<GOOGLE_CLIENT_ID_CỦA_BẠN>
Auth__GoogleOAuthClientId=<GOOGLE_OAUTH_CLIENT_ID_CỦA_BẠN>
Auth__GoogleOAuthClientSecret=<GOOGLE_OAUTH_CLIENT_SECRET_CỦA_BẠN>

# --- AI ---
AI__ProviderAdapter=OpenAICompatible
AI__RequestTimeoutSeconds=300
AI__BatchSize=10
AI__MaxParallelBatches=5
```

> **Quan trọng:** `Auth__SigningKey` phải là chuỗi ngẫu nhiên mạnh (≥ 32 ký tự). Tạo bằng:
> ```bash
> openssl rand -base64 48
> ```

### 3.3 File `.env.production` cho Web frontend

Tạo `apps/web/.env.production` trong thư mục repo:

```env
NEXT_PUBLIC_API_BASE_URL=https://api-formautohub.<tên-miền-của-bạn>
NEXT_PUBLIC_SITE_URL=https://formautohub.<tên-miền-của-bạn>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<GOOGLE_CLIENT_ID_CỦA_BẠN>
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=<GOOGLE_OAUTH_CLIENT_ID_CỦA_BẠN>
NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT_URI=https://formautohub.<tên-miền-của-bạn>/auth/google/callback
```

### 3.4 Bảo vệ file env

```bash
sudo chown root:root /etc/formauto/sql.env /etc/formauto/api.env
sudo chmod 600 /etc/formauto/sql.env /etc/formauto/api.env
```

---

## 4. Khởi Động Lần Đầu

### 4.1 Build và chạy tất cả service

```bash
cd /home/deploy/FormAuto_Hub
docker compose -f docker-compose.prod.yml up -d --build
```

Quá trình này sẽ:
1. Pull image `mcr.microsoft.com/mssql/server:2025-latest`
2. Build `formauto-api` từ `Dockerfile.api`
3. Build `formauto-web` từ `apps/web/Dockerfile`
4. Khởi động cả ba container

### 4.2 Kiểm tra trạng thái container

```bash
docker compose -f docker-compose.prod.yml ps
```

Cả ba đều phải hiển thị `Up`:

```
NAME              STATUS
formauto-sql      Up (healthy)
formauto-api      Up
formauto-web      Up
```

### 4.3 Xem log

```bash
# Tất cả service
docker compose -f docker-compose.prod.yml logs --tail=50

# Service cụ thể
docker compose -f docker-compose.prod.yml logs formauto-api --tail=50
docker compose -f docker-compose.prod.yml logs formauto-web --tail=50
docker compose -f docker-compose.prod.yml logs formauto-sql --tail=50

# Theo dõi log liên tục
docker compose -f docker-compose.prod.yml logs -f formauto-api
```

---

## 5. Database Migration

EF Core migrations được nhúng trong artifact API đã biên dịch. API tự động chạy migration khi khởi động.

### Chạy migration thủ công (nếu cần)

```bash
# Vào container API
docker exec -it formauto-api bash

# Chạy migration từ bên trong container
# (nếu auto-migration bị tắt)
dotnet ef database update --connection "<connection-string>"
```

> **Giả định:** API áp dụng các EF Core migration đang chờ xử lý khi khởi động. Nếu dự án phát triển và dùng migration runner riêng, hãy cập nhật phần này.

---

## 6. Reverse Proxy (nginx)

Cài nginx và cấu hình chuyển tiếp traffic:

```bash
sudo apt install -y nginx
```

### 6.1 Subdomain API: `/etc/nginx/sites-available/api-formautohub`

```nginx
server {
    listen 80;
    server_name api-formautohub.<tên-miền-của-bạn>;

    location / {
        proxy_pass http://127.0.0.1:5100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.2 Subdomain Web: `/etc/nginx/sites-available/formautohub`

```nginx
server {
    listen 80;
    server_name formautohub.<tên-miền-của-bạn>;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.3 Kích hoạt site và HTTPS

```bash
sudo ln -s /etc/nginx/sites-available/api-formautohub /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/formautohub /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Lấy chứng chỉ HTTPS (Certbot):

```bash
sudo snap install certbot --classic
sudo certbot --nginx -d api-formautohub.<tên-miền-của-bạn>
sudo certbot --nginx -d formautohub.<tên-miền-của-bạn>
```

---

## 7. Kiểm Tra Sức Khỏe

### 7.1 API health check

```bash
curl -s https://api-formautohub.<tên-miền-của-bạn>/health
# Kỳ vọng: HTTP 200 hoặc 204 (tùy vào cách triển khai health check endpoint)
```

Hoặc kiểm tra API trực tiếp trên localhost:

```bash
curl -s http://127.0.0.1:5100/health
```

### 7.2 Web dashboard

Mở `https://formautohub.<tên-miền-của-bạn>` trong trình duyệt. Bạn sẽ thấy trang đăng nhập/landing page.

### 7.3 Kết nối database

```bash
docker exec formauto-api dotnet ef database status --connection "<connection-string>"
```

---

## 8. GitHub Actions CI/CD

### 8.1 Các secret cần thiết

Thiết lập trong GitHub repo → Settings → Secrets and variables → Actions:

| Secret | Mô tả |
|---|---|
| `DEPLOY_HOST` | IP hoặc hostname máy chủ |
| `DEPLOY_USER` | User SSH (vd: `deploy`) |
| `DEPLOY_SSH_KEY` | Khóa SSH riêng cho user deploy |
| `DEPLOY_PATH` | Đường dẫn repo trên máy chủ (vd: `/home/deploy/FormAuto_Hub`) |

### 8.2 Hành vi của deploy workflow

- **Kích hoạt:** Push lên nhánh `main` hoặc kích hoạt thủ công (`workflow_dispatch`)
- **Quy trình:**
  1. SSH vào máy chủ
  2. `git fetch origin main && git reset --hard origin/main`
  3. Dừng các container hiện tại
  4. `docker compose up -d --build --remove-orphans`

### 8.3 Thiết lập user SSH trên máy chủ

```bash
# Với quyền root trên máy chủ
sudo adduser deploy --disabled-password
sudo usermod -aG docker deploy
sudo mkdir -p /home/deploy/.ssh
# Dán public key khớp với DEPLOY_SSH_KEY vào:
sudo vim /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

---

## 9. Tham Chiếu Thư Mục

| Đường dẫn | Mục đích |
|---|---|
| `/home/deploy/FormAuto_Hub/` (hoặc `$DEPLOY_PATH`) | Thư mục gốc Git repo |
| `/home/deploy/FormAuto_Hub/docker-compose.prod.yml` | File Compose cho production |
| `/home/deploy/FormAuto_Hub/Dockerfile.api` | Dockerfile cho API |
| `/home/deploy/FormAuto_Hub/apps/web/Dockerfile` | Dockerfile cho Web |
| `/etc/formauto/sql.env` | Thông tin đăng nhập SQL Server |
| `/etc/formauto/api.env` | Cấu hình API |
| `/home/deploy/FormAuto_Hub/apps/web/.env.production` | Biến môi trường build-time cho Web |
| `/var/opt/mssql` (Docker volume) | Dữ liệu SQL Server |

---

## 10. Xử Lý Sự Cố

### API crash khi khởi động

1. Kiểm tra connection string trong `/etc/formauto/api.env` — `Server` phải là `formauto-sql` (tên service trong Docker Compose).
2. Xác nhận SQL Server đang chạy: `docker compose -f docker-compose.prod.yml ps formauto-sql`.
3. Kiểm tra mật khẩu SA khớp giữa `sql.env` và connection string của API.

### Web không kết nối được API

- Web container dùng `FORMAUTO_API_BASE_URL=http://formauto-api:8080` (mạng nội bộ Docker).
- Với các API call phía trình duyệt của Next.js, `NEXT_PUBLIC_API_BASE_URL` phải dùng URL công khai (qua reverse proxy).

### Lỗi phân quyền Docker

```bash
sudo usermod -aG docker $USER
# Logout rồi login lại, hoặc:
newgrp docker
```

### Cổng đã bị chiếm dụng

```bash
sudo lsof -i :1433   # SQL Server
sudo lsof -i :5100   # API
sudo lsof -i :3000   # Web
```

### Migration thất bại

- Đảm bảo `formauto-sql` đã sẵn sàng trước khi API khởi động.
- API phụ thuộc vào `formauto-sql` qua `depends_on`, nhưng trạng thái sẵn sàng không được đảm bảo — nếu API khởi động trước khi SQL Server chấp nhận kết nối, khởi động lại API:

```bash
docker compose -f docker-compose.prod.yml restart formauto-api
```

---

## 11. Checklist Sau Triển Khai

- [ ] Cả ba container đang chạy (`docker compose ps`)
- [ ] API health endpoint phản hồi
- [ ] Web dashboard tải được qua HTTPS
- [ ] Reverse proxy đã cấu hình với SSL
- [ ] Firewall chỉ cho phép 80/443 (và 1122 cho CI SSH)
- [ ] File env có phân quyền `600`
- [ ] CI deploy workflow đã test (push lên main hoặc kích hoạt thủ công)
- [ ] Database migration đã được áp dụng (kiểm tra log container)
- [ ] Google OAuth callback đã cấu hình trong Google Cloud Console với URI production

---

## Deferred

- Tự động hóa backup/restore
- Thiết lập giám sát và cảnh báo
- Tập trung log (ELK/Loki/etc.)
- Thiết lập môi trường staging
- Deploy blue-green / zero-downtime
