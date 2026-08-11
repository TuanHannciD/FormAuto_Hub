---
name: formauto-server-debugger
description: Remotely diagnose and verify the FormAuto Hub production VPS over SSH using strictly read-only commands. Use for production health checks, bounded log investigation, safe HTTP smoke tests, incident triage, resource snapshots, and before/after deploy verification. Never change code, configuration, containers, files, services, or data.
---

# Purpose

Inspect the FormAuto Hub production VPS without changing production state. Establish current evidence, separate confirmed findings from hypotheses, and recommend the smallest safe next action.

# Read project context

1. Read `README.md`, `AGENTS.md`, and `docs/ai/AI_DOC_ROUTING_MATRIX.md`.
2. Read [`references/INDEX.md`](references/INDEX.md).
3. Read only the project references needed for the requested check.
4. Treat `docker-compose.prod.yml` and the current deployment docs as authoritative for service names, ports, paths, and health behavior.
5. Report any conflict between the skill and current repository evidence before running a conflicting check.

# Preserve the server settings

Keep these existing Windows environment-variable names and values unchanged. They are legacy-named because the connection settings were created before this FormAuto skill, but they point to the real FormAuto Hub VPS.

| Variable | Current value |
|---|---|
| `CASHBACK_VPS_HOST` | `1.52.121.37` |
| `CASHBACK_VPS_USER` | `deploy` |
| `CASHBACK_VPS_SSH_KEY` | `C:\Users\Tuan\.ssh\cashback_skill` |
| `CASHBACK_VPS_SSH_PORT` | `1122` |

Do not rename, rewrite, migrate, or persist these settings elsewhere unless the user explicitly asks. Never read or display private-key contents.

Resolve each setting in this order:

1. Process environment.
2. Windows User environment.
3. Windows Machine environment.

Use PowerShell variables that do not collide with built-in variables:

```powershell
function Get-FormAutoServerSetting([string]$name) {
    $processValue = [Environment]::GetEnvironmentVariable($name, "Process")
    if ($processValue) { return $processValue }

    $userValue = [Environment]::GetEnvironmentVariable($name, "User")
    if ($userValue) { return $userValue }

    return [Environment]::GetEnvironmentVariable($name, "Machine")
}

$formautoHost = Get-FormAutoServerSetting "CASHBACK_VPS_HOST"
$formautoUser = Get-FormAutoServerSetting "CASHBACK_VPS_USER"
$formautoKey = Get-FormAutoServerSetting "CASHBACK_VPS_SSH_KEY"
$formautoPort = Get-FormAutoServerSetting "CASHBACK_VPS_SSH_PORT"
```

Ask only for a specific missing setting. Do not guess a replacement.

# Enforce read-only access

Before every remote command:

1. Confirm that the command only reads, discovers, or displays state.
2. Reject commands that create, modify, delete, restart, deploy, migrate, authenticate, or persist data.
3. Run one bounded remote command per SSH invocation.
4. Add `-o StrictHostKeyChecking=accept-new`, `-o ConnectTimeout=10`, and `-o BatchMode=yes` to every SSH invocation.
5. Use a 15-second local process timeout for quick checks and 30 seconds for bounded log checks when the available shell tool supports it.
6. Stop after two failed connection attempts and report the exact failure category.

Use this PowerShell command shape:

```powershell
ssh -i $formautoKey -p $formautoPort -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 -o BatchMode=yes "$formautoUser@$formautoHost" "<read-only-command>"
```

Mask the key path and sensitive values when reporting commands. It is acceptable to identify the environment as the configured FormAuto production VPS; do not print a full connection string.

## Refuse state-changing operations

Never execute:

- `docker compose up`, `down`, `restart`, `start`, `stop`, `pull`, or `build`.
- `docker system prune` or any removal command.
- `systemctl start`, `stop`, `restart`, `reload`, `enable`, or `disable`.
- `git pull`, `reset`, `checkout`, `switch`, `clean`, or any deploy script.
- `dotnet ef database update`, SQL mutations, backup/restore, or migration commands.
- `rm`, `mv`, `cp`, redirection to files, `tee`, or in-place text editing.
- `kill`, `pkill`, `killall`, package installation, or background processes.
- Login, registration, refresh-token, logout, payment, AI generation, submission, webhook, or other mutation HTTP requests.
- Reads of `/etc/formauto/*.env`, private keys, tokens, passwords, connection strings, or container environment dumps.

When a fix requires mutation, state the evidence, the required action, risks, and pre-flight checks. Provide an exact command only when it can be shown without exposing secrets, and require the user to run it.

# Production baseline

Use the current repository baseline unless newer repository evidence supersedes it:

| Component | Compose service | Local VPS endpoint |
|---|---|---|
| SQL Server | `formauto-sql` | `127.0.0.1:1433` |
| ASP.NET Core API | `formauto-api` | `http://127.0.0.1:5100` |
| Next.js Web | `formauto-web` | `http://127.0.0.1:3000` |

- Compose file: `/home/deploy/FormAuto_Hub/docker-compose.prod.yml`.
- Recorded release: `/home/deploy/FormAuto_Hub/.deploy/current-release`.
- API health route: `GET /health`, expected HTTP `200` with body `Healthy`.
- Automated backup/restore and centralized monitoring are Deferred. Do not report them as configured or healthy without direct evidence and an approved current contract.
- Reverse proxy may be nginx or Caddy. Check only the implementation relevant to the current symptom; do not assume Cloudflare Tunnel.

# Run a full health report

When asked for a general production/server health check, run these independent read-only checks:

1. Compose state:
   `docker compose -f /home/deploy/FormAuto_Hub/docker-compose.prod.yml ps --all`
2. API health:
   `curl -sS -o /dev/null -w 'HTTP %{http_code} | Time %{time_total}s | Size %{size_download}B' --max-time 5 http://127.0.0.1:5100/health`
3. API health body:
   `curl -sS --max-time 5 http://127.0.0.1:5100/health`
4. Web root:
   `curl -sS -o /dev/null -w 'HTTP %{http_code} | Time %{time_total}s | Size %{size_download}B' --max-time 5 http://127.0.0.1:3000/`
5. Root filesystem:
   `df -h /`
6. Memory:
   `free -m`
7. Docker resources:
   `docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}'`
8. Recorded release:
   `cat /home/deploy/FormAuto_Hub/.deploy/current-release`

Treat Compose health for `formauto-sql` as the normal read-only database-connectivity signal. Do not extract `MSSQL_SA_PASSWORD` or run `sqlcmd` with a password merely to strengthen a routine health report.

Classify each executed check as `Verified`, `WARN`, or `FAIL`. Use `Not run` for checks outside the requested scope and `Blocked` for checks that could not be executed. Do not infer an unexecuted check from another passing item.

# Run safe HTTP smoke tests

Run smoke requests from inside the VPS to avoid CDN or public-network ambiguity:

- API: `GET http://127.0.0.1:5100/health`.
- Web: `GET http://127.0.0.1:3000/`.
- Optional authenticated read: only use a user-provided access token against an explicitly requested GET endpoint. Report status, timing, and a redacted summary; never print the token or personal response body.

Do not log in to obtain a token. FormAuto Hub login/refresh flows can write session state, so they do not satisfy this skill's read-only contract.

# Investigate logs

Start with the smallest relevant slice and expand only when evidence requires it:

- API: `docker compose -f /home/deploy/FormAuto_Hub/docker-compose.prod.yml logs --tail=50 --no-color formauto-api`
- Web: `docker compose -f /home/deploy/FormAuto_Hub/docker-compose.prod.yml logs --tail=50 --no-color formauto-web`
- SQL: `docker compose -f /home/deploy/FormAuto_Hub/docker-compose.prod.yml logs --tail=50 --no-color formauto-sql`
- Time window: add `--since=30m` to the relevant service command.
- Error slice: request at most 200 lines, then filter locally for `error`, `fail`, `exception`, `timeout`, `crash`, `refused`, `denied`, `OOM`, or `killed`.

Summarize the time window, line count, approximate error count, most recent notable event, and recurring patterns. Redact tokens, passwords, cookies, connection strings, payment secrets, AI provider keys, and personal data. Do not dump full logs unless explicitly requested, and still redact secrets.

# Triage incidents

Follow the smallest matching path:

| Symptom | Read-only path |
|---|---|
| API returns 502/503 | Compose state -> API health -> bounded API logs -> reverse-proxy status/logs if needed |
| API is slow | Timed API health -> Docker stats -> memory -> bounded API logs |
| Container restarts | Compose state -> bounded affected-service logs -> `dmesg` OOM slice if permitted |
| SQL is unhealthy | Compose state -> SQL health/logs -> disk usage; do not read credentials |
| Disk pressure | `df -h /` -> `docker system df` -> bounded read-only size inspection under the known deploy path |
| Web unavailable | Compose state -> local Web GET -> bounded Web logs -> reverse-proxy status/logs if needed |
| Recent deploy regression | Recorded release -> Compose state -> local API/Web smoke -> bounded API/Web logs |
| Unknown symptom | Run the full health report, then drill into only WARN/FAIL items |

Use `formauto-bug-triage` after collecting runtime evidence when source-level root-cause analysis is needed. Use `formauto-http-behavior-tester` for deeper endpoint-contract analysis. Do not implement fixes under this skill.

# Monitor and compare

For a one-shot monitoring request, run the full health report. For recurring monitoring, use the product's supported automation mechanism only when the user explicitly requests a recurring automation.

Apply these snapshot thresholds:

- Root disk above 80%: `WARN`; above 95%: `FAIL`.
- RAM above 90%: `WARN` unless direct evidence establishes a failure.
- Any required Compose service unhealthy or restarting: `FAIL`.
- API health non-200 or body other than `Healthy`: `FAIL`.
- Web root non-2xx/3xx: `FAIL`.

For before/after deploy comparison, capture the same check set on both sides and compare release SHA, service state, response status/timing, and resource usage. The user or deployment workflow performs the deploy; this skill only observes it.

# Report results

Use this compact structure:

1. Request and environment.
2. Read-only commands executed, with credentials masked.
3. `Verified` findings.
4. `WARN` and `FAIL` findings.
5. Diagnosis: separate confirmed evidence from hypotheses.
6. Validation not performed or blocked.
7. Recommended next step, including risks for any user-run mutation.
8. Confidence level and why.

Never claim current production health, endpoint behavior, log content, release SHA, or root cause without executing and parsing the relevant read-only checks.
