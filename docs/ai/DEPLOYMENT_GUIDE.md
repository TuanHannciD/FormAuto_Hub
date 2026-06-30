# DEPLOYMENT_GUIDE — First-Time Deploy

## Purpose

Step-by-step guide to deploy FormAuto Hub to a fresh Linux server using Docker Compose.

## Target Audience

DevOps engineers and developers deploying FormAuto Hub for the first time.

---

## Architecture Overview

| Component | Tech | Port | Notes |
|---|---|---|---|
| SQL Server | MSSQL 2025 | 1433 | Data persisted via Docker volume |
| Backend API | ASP.NET Core 9 | 8080 (internal) → 5100 (host) | Binds to localhost only |
| Web Dashboard | Next.js 15 | 3000 (internal) → 3000 (host) | Binds to localhost only |
| Reverse Proxy | nginx / Caddy (external) | 80, 443 | Not included; set up separately |

Typical production topology:

```
Internet → Reverse Proxy (nginx/Caddy) → [formauto-web:3000, formauto-api:8080]
                                                    ↕
                                              formauto-sql:1433
```

---

## 1. Prerequisites

### 1.1 Server

- Ubuntu 24.04 (or newer) with at least:
  - 2 CPU cores
  - 4 GB RAM
  - 30 GB free disk
- SSH access with a non-root `sudo` user
- Ports 80 and 443 open (firewall / security group)
- A domain name pointed to the server IP for HTTPS

### 1.2 Installed Packages

```bash
sudo apt update
sudo apt install -y git curl ca-certificates
```

Install Docker (if not present):

```bash
curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
sudo sh /tmp/get-docker.sh
sudo usermod -aG docker $USER
newgrp docker   # or log out and back in
```

> Docker Compose v2 is included with Docker Engine 24+.

Verify:

```bash
docker --version          # ≥ 27
docker compose version    # ≥ 2
```

---

## 2. Repository Setup

Clone into the deploy path (adjust to your preference):

```bash
sudo mkdir -p /home/FormAuto_Hub
sudo chown $USER:$USER /home/FormAuto_Hub
cd /home/FormAuto_Hub
git clone https://github.com/<your-org>/FormAuto_Hub.git .
```

Default deploy path used in CI: `/home/FormAuto_Hub` (configurable via `DEPLOY_PATH` secret).

---

## 3. Environment Configuration

FormAuto Hub needs **two env files** on the host at `/etc/formauto/`. Create the directory:

```bash
sudo mkdir -p /etc/formauto
```

### 3.1 `/etc/formauto/sql.env` — SQL Server Credentials

```env
# Required — change the password to a strong secret
ACCEPT_EULA=Y
MSSQL_SA_PASSWORD=<YOUR_STRONG_SA_PASSWORD>
MSSQL_PID=Express
```

Example:

```env
ACCEPT_EULA=Y
MSSQL_SA_PASSWORD=MyStr0ng!Pass123
MSSQL_PID=Express
```

### 3.2 `/etc/formauto/api.env` — Backend API Configuration

```env
# --- Database ---
ConnectionStrings__DefaultConnection=Server=formauto-sql,1433;Database=FormAutoHub;User Id=sa;Password=<SAME_SA_PASSWORD>;TrustServerCertificate=True;Encrypt=True;

# --- Auth ---
Auth__Issuer=FormAutoHub
Auth__Audience=FormAutoHub
Auth__SigningKey=<RANDOM_64_CHAR_STRING>
Auth__GoogleClientId=<YOUR_GOOGLE_CLIENT_ID>
Auth__GoogleOAuthClientId=<YOUR_GOOGLE_OAUTH_CLIENT_ID>
Auth__GoogleOAuthClientSecret=<YOUR_GOOGLE_OAUTH_CLIENT_SECRET>

# --- AI ---
AI__ProviderAdapter=OpenAICompatible
AI__RequestTimeoutSeconds=300
AI__BatchSize=10
AI__MaxParallelBatches=5
```

> **Important:** `Auth__SigningKey` must be a strong random string (≥ 32 characters). Generate one:
> ```bash
> openssl rand -base64 48
> ```

### 3.3 Web frontend `.env.production`

Create `apps/web/.env.production` in the repo directory:

```env
NEXT_PUBLIC_API_BASE_URL=https://api-formautohub.<your-domain>
NEXT_PUBLIC_SITE_URL=https://formautohub.<your-domain>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<YOUR_GOOGLE_CLIENT_ID>
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=<YOUR_GOOGLE_OAUTH_CLIENT_ID>
NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT_URI=https://formautohub.<your-domain>/auth/google/callback
```

### 3.4 Secure the env files

```bash
sudo chown root:root /etc/formauto/sql.env /etc/formauto/api.env
sudo chmod 600 /etc/formauto/sql.env /etc/formauto/api.env
```

---

## 4. First-Time Startup

### 4.1 Build and start all services

```bash
cd /home/FormAuto_Hub
docker compose -f docker-compose.prod.yml up -d --build
```

This will:
1. Pull `mcr.microsoft.com/mssql/server:2025-latest`
2. Build `formauto-api` from `Dockerfile.api`
3. Build `formauto-web` from `apps/web/Dockerfile`
4. Start all three containers

### 4.2 Check container status

```bash
docker compose -f docker-compose.prod.yml ps
```

All three should show `Up`:

```
NAME              STATUS
formauto-sql      Up (healthy)
formauto-api      Up
formauto-web      Up
```

### 4.3 Check logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs --tail=50

# Specific service
docker compose -f docker-compose.prod.yml logs formauto-api --tail=50
docker compose -f docker-compose.prod.yml logs formauto-web --tail=50
docker compose -f docker-compose.prod.yml logs formauto-sql --tail=50

# Follow logs
docker compose -f docker-compose.prod.yml logs -f formauto-api
```

---

## 5. Database Migration

EF Core migrations are embedded in the compiled API artifact. The API runs migrations automatically on startup.

### Manual migration (if needed)

```bash
# Enter API container
docker exec -it formauto-api bash

# Run migration from inside the container
# (if auto-migration is disabled)
dotnet ef database update --connection "<connection-string>"
```

> **Assumption:** The API applies pending EF Core migrations at startup. If the project grows to use a separate migration runner, update this section.

---

## 6. Reverse Proxy (nginx)

Install nginx and configure it to forward traffic:

```bash
sudo apt install -y nginx
```

### 6.1 API subdomain: `/etc/nginx/sites-available/api-formautohub`

```nginx
server {
    listen 80;
    server_name api-formautohub.<your-domain>;

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

### 6.2 Web subdomain: `/etc/nginx/sites-available/formautohub`

```nginx
server {
    listen 80;
    server_name formautohub.<your-domain>;

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

### 6.3 Enable sites and HTTPS

```bash
sudo ln -s /etc/nginx/sites-available/api-formautohub /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/formautohub /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Get HTTPS certificates (Certbot):

```bash
sudo snap install certbot --classic
sudo certbot --nginx -d api-formautohub.<your-domain>
sudo certbot --nginx -d formautohub.<your-domain>
```

---

## 7. Health Check

### 7.1 API health

```bash
curl -s https://api-formautohub.<your-domain>/health
# Expected: HTTP 200 or 204 (depending on health check endpoint implementation)
```

Or check the API directly on localhost:

```bash
curl -s http://127.0.0.1:5100/health
```

### 7.2 Web dashboard

Open `https://formautohub.<your-domain>` in a browser. You should see the login/landing page.

### 7.3 Database connectivity

```bash
docker exec formauto-api dotnet ef database status --connection "<connection-string>"
```

---

## 8. GitHub Actions CI/CD

### 8.1 Required secrets

Set these in GitHub repo → Settings → Secrets and variables → Actions:

| Secret | Description |
|---|---|
| `DEPLOY_HOST` | Server IP or hostname |
| `DEPLOY_USER` | SSH user (e.g., `deploy`) |
| `DEPLOY_SSH_KEY` | Private SSH key for the deploy user |
| `DEPLOY_PATH` | Repo path on server (e.g., `/home/FormAuto_Hub`) |

### 8.2 Deploy workflow behavior

- **Trigger:** Push to `main` branch or manual dispatch (`workflow_dispatch`)
- **Process:**
  1. SSH into server
  2. `git fetch origin main && git reset --hard origin/main`
  3. Stop existing containers
  4. `docker compose up -d --build --remove-orphans`

### 8.3 SSH user setup on server

```bash
# As root on the server
sudo adduser deploy --disabled-password
sudo usermod -aG docker deploy
sudo mkdir -p /home/deploy/.ssh
# Paste the public key matching DEPLOY_SSH_KEY into:
sudo vim /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

---

## 9. Directory Reference

| Path | Purpose |
|---|---|
| `/home/FormAuto_Hub/` (or `$DEPLOY_PATH`) | Git repo root |
| `/home/FormAuto_Hub/docker-compose.prod.yml` | Production compose file |
| `/home/FormAuto_Hub/Dockerfile.api` | API Dockerfile |
| `/home/FormAuto_Hub/apps/web/Dockerfile` | Web Dockerfile |
| `/etc/formauto/sql.env` | SQL Server credentials |
| `/etc/formauto/api.env` | API configuration |
| `/home/FormAuto_Hub/apps/web/.env.production` | Web build-time env vars |
| `/var/opt/mssql` (Docker volume) | SQL Server data |

---

## 10. Troubleshooting

### API crashes on startup

1. Check the connection string in `/etc/formauto/api.env` — `Server` must be `formauto-sql` (the Docker Compose service name).
2. Verify SQL Server is running: `docker compose -f docker-compose.prod.yml ps formauto-sql`.
3. Check if SA password matches between `sql.env` and the API connection string.

### Web cannot reach API

- The web container uses `FORMAUTO_API_BASE_URL=http://formauto-api:8080` (Docker internal network).
- For browser-side Next.js API calls, `NEXT_PUBLIC_API_BASE_URL` must use the public URL (reverse proxy).

### Docker permission errors

```bash
sudo usermod -aG docker $USER
# Log out and back in, or:
newgrp docker
```

### Port already in use

```bash
sudo lsof -i :1433   # SQL Server
sudo lsof -i :5100   # API
sudo lsof -i :3000   # Web
```

### Migration failures

- Check that `formauto-sql` is healthy before API starts.
- The API depends on `formauto-sql` via `depends_on`, but readiness is not guaranteed — if the API starts before SQL Server accepts connections, restart the API:

```bash
docker compose -f docker-compose.prod.yml restart formauto-api
```

---

## 11. Post-Deploy Checklist

- [ ] All three containers running (`docker compose ps`)
- [ ] API health endpoint responds
- [ ] Web dashboard loads over HTTPS
- [ ] Reverse proxy configured with SSL
- [ ] Firewall allows only 80/443 (and 1122 for CI SSH)
- [ ] Env files have `600` permissions
- [ ] CI deploy workflow tested (push to main or manual dispatch)
- [ ] Database migrations applied (check container logs)
- [ ] Google OAuth callbacks configured in Google Cloud Console with production URIs

---

## Deferred

- Backup/restore automation
- Monitoring and alerting setup
- Log aggregation (ELK/Loki/etc.)
- Staging environment setup
- Blue-green / zero-downtime deploys
