# DEPLOYMENT_GUIDE — FormAuto Hub Production Deployment

**Last updated:** 2026-08-11 | **Phase:** Production CI/CD foundation

## Architecture overview

```text
Internet
  |
  v
nginx / reverse proxy :80/:443 on the VPS
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

Application services bind to `127.0.0.1` on the host. Public traffic goes through the reverse proxy. SQL Server also binds only to localhost host port `1433`; it is not public.

Production does not build source on the VPS. GitHub Actions builds API/Web images, pushes them to GHCR with the full commit SHA tag, then SSHes into the VPS and pulls that exact release.

## Prerequisites

| Requirement | Recommended | Check |
|---|---|---|
| Ubuntu | 24.04+ | `lsb_release -a` |
| Docker Engine | 27+ | `docker --version` |
| Docker Compose | v2 plugin | `docker compose version` |
| Git | any | `git --version` |
| curl | any | `curl --version` |
| nginx | if self-managing reverse proxy | `nginx -v` |
| SSH user | `deploy` | `whoami` |

Domains should point to the VPS:

- Web: `https://formautohub.<domain>`
- API: `https://api-formautohub.<domain>`

## Quick start (first-time deploy)

### 1. Prepare the repository on the VPS

Run on the VPS:

```bash
sudo adduser deploy --disabled-password
sudo usermod -aG docker deploy
sudo mkdir -p /home/deploy/FormAuto_Hub
sudo chown -R deploy:deploy /home/deploy/FormAuto_Hub

sudo -iu deploy
cd /home/deploy/FormAuto_Hub
git clone https://github.com/<owner>/FormAuto_Hub.git .
```

If the repository already exists, just verify it:

```bash
cd /home/deploy/FormAuto_Hub
git remote -v
docker compose version
```

### 2. Create runtime secrets on the VPS

Run on the VPS:

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

Generate `Auth__SigningKey`:

```bash
openssl rand -base64 48
```

### 3. Generate the deploy SSH key on Windows/local

Run in PowerShell on the administrator machine, not on the VPS:

```powershell
New-Item -ItemType Directory -Force ~/.ssh
Test-Path ~/.ssh/formauto_github_actions
ssh-keygen -t ed25519 -C "github-actions-formauto-production" -f ~/.ssh/formauto_github_actions
```

If `Test-Path` returns `True`, the key file already exists. Do not overwrite it unless you are sure; choose another name. When prompted for a passphrase, press Enter to leave it empty because the current workflow does not accept an SSH key passphrase.

This creates 2 files:

| File | Use |
|---|---|
| `formauto_github_actions` | Private key. Paste the complete content into the GitHub secret `DEPLOY_SSH_KEY`. |
| `formauto_github_actions.pub` | Public key. Install this on the VPS in `authorized_keys`. |

How to obtain `DEPLOY_SSH_KEY`:

```powershell
notepad ~/.ssh/formauto_github_actions
```

Copy the entire content in Notepad, from `-----BEGIN OPENSSH PRIVATE KEY-----` through `-----END OPENSSH PRIVATE KEY-----`. That complete text is the value for the GitHub secret `DEPLOY_SSH_KEY`.

### 4. Install the public key on the VPS

Assume the new VPS has example IP `203.0.113.10` and default SSH port `22`. For a real deployment, replace `203.0.113.10` with the VPS IP. If the VPS uses a different SSH port, replace `22` with that port.

Step 1 — open the public key on Windows/local:

```powershell
notepad ~/.ssh/formauto_github_actions.pub
```

Copy the full single line from the file. It starts with `ssh-ed25519`.

Step 2 — log in to the VPS as root/password for the first time:

```powershell
ssh root@203.0.113.10
```

If the VPS provider does not enable root SSH, open the provider console and log in with the user/password they provide.

Step 3 — create the `deploy` user on the VPS:

```bash
adduser deploy
usermod -aG sudo deploy
```

Step 4 — create `authorized_keys` for the `deploy` user:

```bash
mkdir -p /home/deploy/.ssh
nano /home/deploy/.ssh/authorized_keys
```

Paste the public key copied in step 1 into this file. The file only needs one line starting with `ssh-ed25519`. Save and exit nano.

Step 5 — fix owner and permissions on the VPS:

```bash
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Step 6 — return to PowerShell on Windows/local and test the private key:

```powershell
ssh -i ~/.ssh/formauto_github_actions -p 22 -o IdentitiesOnly=yes deploy@203.0.113.10 "whoami"
```

Correct output:

```text
deploy
```

If it does not return `deploy`, fix SSH first. Do not paste the private key into GitHub while local SSH still fails.

### 5. Log in to GHCR on the VPS

If GHCR packages are private, create a GitHub classic token with `read:packages`, then run on the VPS as `deploy`:

```bash
printf 'GHCR token: '
read -s CR_PAT
echo
echo "$CR_PAT" | docker login ghcr.io -u '<github-user>' --password-stdin
unset CR_PAT
```

The GHCR token is not `DEPLOY_SSH_KEY`. It only lets Docker on the VPS pull private images.

### 6. Fill GitHub Actions settings

Go to GitHub repo -> Settings -> Environments -> create/select `production`.

Environment variables:

| Variable | Value |
|---|---|
| `DEPLOY_HOST` | VPS public IP or DNS |
| `DEPLOY_PORT` | SSH port, for example `1122` |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_PATH` | `/home/deploy/FormAuto_Hub` |
| `DEPLOY_SSH_FINGERPRINT` | `SHA256:...` value from the VPS |
| `PRODUCTION_URL` | `https://formautohub.<domain>` |

Environment secret:

| Secret | Value |
|---|---|
| `DEPLOY_SSH_KEY` | Complete private key content from `formauto_github_actions`, not the `.pub` file |

Get the host fingerprint on the VPS:

```bash
sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub -E sha256
```

Go to GitHub repo -> Settings -> Secrets and variables -> Actions -> Variables.

Repository variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://api-formautohub.<domain>` |
| `NEXT_PUBLIC_SITE_URL` | `https://formautohub.<domain>` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google client id if used |
| `NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` | Google OAuth client id if used |
| `NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT_URI` | `https://formautohub.<domain>/dashboard/nckh/callback` |

Do not create `apps/web/.env.production` on the VPS. `NEXT_PUBLIC_*` values are compiled into the Web image in GitHub Actions.

### 7. Deploy

After code is merged/pushed to `main`:

- CI runs API build/test, Web lint/build, and Docker build validation.
- The deploy workflow builds immutable images and SSHes into the VPS.
- The production environment may wait for a reviewer if protection is enabled.

Manual deploy: GitHub Actions -> `Release and Deploy Production` -> Run workflow -> enter a full commit SHA reachable from `main`.

## Production directory layout

```text
/home/deploy/FormAuto_Hub/
├── docker-compose.prod.yml       # Production Compose
├── Dockerfile.api                # API image
├── apps/web/Dockerfile           # Web image
├── scripts/deploy-production.sh  # Script GitHub Actions runs over SSH
├── sql/backups/                  # SQL backup mount if used
└── .deploy/
    ├── current-release           # Last successful deployed SHA
    └── docker-compose.prod.previous.yml

/etc/formauto/
├── api.env                       # API runtime secrets
└── sql.env                       # SQL Server env
```

## Deploying updates

```bash
git status
git push origin main
```

After CI passes, deployment runs automatically. Watch it in GitHub Actions.

View the current release on the VPS:

```bash
cat /home/deploy/FormAuto_Hub/.deploy/current-release
docker compose -f /home/deploy/FormAuto_Hub/docker-compose.prod.yml ps
```

The deploy script fetches Compose from the exact release commit, pulls API/Web images by SHA, runs Compose with health wait, smoke-checks local API/Web, then writes `.deploy/current-release`.

## Health checks

```bash
curl -i http://127.0.0.1:5100/health
curl -i http://127.0.0.1:3000/
docker compose -f /home/deploy/FormAuto_Hub/docker-compose.prod.yml ps
```

Expected: API returns `HTTP 200` with body `Healthy`, Web returns `HTTP 200`, and all three containers are healthy.

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

### GitHub Actions reports `ssh: handshake failed`

Check in this order:

```powershell
ssh -i ~/.ssh/formauto_github_actions -p 22 -o IdentitiesOnly=yes deploy@203.0.113.10 "whoami"
```

If local SSH also fails:

- `DEPLOY_USER` is wrong.
- `DEPLOY_PORT` is wrong.
- The `.pub` key is not in `/home/deploy/.ssh/authorized_keys`.
- Permissions are wrong: `~/.ssh` must be `700`, `authorized_keys` must be `600`.
- The `.pub` file was pasted into GitHub secret instead of the private key.

### GitHub Actions reports missing production setting

Open Environment `production`, not only repository secrets. Verify:

- Environment variables contain `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`, `DEPLOY_SSH_FINGERPRINT`, `PRODUCTION_URL`.
- Environment secrets contain `DEPLOY_SSH_KEY`.

### VPS cannot pull GHCR image

Run on the VPS as `deploy`:

```bash
docker login ghcr.io -u '<github-user>'
docker pull ghcr.io/<owner>/formauto-hub-api:<sha>
```

If the package is private, the token needs `read:packages`.

### API is unhealthy

```bash
docker compose -f /home/deploy/FormAuto_Hub/docker-compose.prod.yml logs --tail=120 formauto-api
docker compose -f /home/deploy/FormAuto_Hub/docker-compose.prod.yml logs --tail=120 formauto-sql
```

Common causes: SQL password mismatch between `sql.env` and `api.env`, SQL is not healthy yet, migration failed, or a runtime secret is missing from `/etc/formauto/api.env`.

### Web cannot call API

Check repository variable:

```text
NEXT_PUBLIC_API_BASE_URL=https://api-formautohub.<domain>
```

After changing this value, build/deploy a new Web image. Do not edit `.env.production` on the VPS.

### Port already in use

```bash
sudo lsof -i :1433
sudo lsof -i :5100
sudo lsof -i :3000
sudo lsof -i :80
sudo lsof -i :443
```

## Rollback

Rollback the image by manually running the workflow with the previous good commit SHA:

```bash
git log --oneline -10
```

Then GitHub Actions -> `Release and Deploy Production` -> Run workflow -> `release_sha=<good-full-sha>`.

Important: database rollback is not automatic. If the new release ran a non-backward-compatible migration, review the database before rolling back the image.
