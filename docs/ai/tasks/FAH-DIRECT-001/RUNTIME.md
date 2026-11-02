# FAH-DIRECT-001 runtime discovery and verification plan

Date: 2026-11-01; resumed and finalized 2026-11-02
Status: Runtime verification complete for the frozen local snapshot; no integration or release claim.
Owner: runtime subagent, model `gpt-5.6-sol`, reasoning `medium`; no child dispatched.
Owned resources: this report pair, retained ignored artifacts, and local database `FormAutoHub_DirectRule_Safety_20261101`. All owned API/web/receiver processes and ports were released; the database and synthetic evidence were intentionally retained.

## Discovery evidence

- `Verified`: local default SQL Server service `MSSQLSERVER` is running; `sqlcmd` is installed and Windows integrated authentication reaches the local default instance when certificate trust is explicit (`-C`). Server identity is the local machine/default instance.
- `Verified`: the dedicated database was absent before provisioning. Root then authorized its creation; it is now `ONLINE/MULTI_USER` on the local default instance, has 13 applied migrations through `20261029142938_NormalizeTopupEvidenceColumnLengths`, and had 0 users immediately after migration.
- `Verified`: ignored `src/FormAutoHub.Api/appsettings.Development.json` exists and its redacted identity is `localhost` / `FormAutoHub`, integrated authentication, no SQL user/password. This is an existing development database of unknown ownership and is forbidden for this task.
- `Verified`: ignored `apps/web/.env.local` exists. Only variable names were inspected; no values or tokens were printed.
- `Verified`: ports 3000, 3020, and 7039 had no listener during discovery. No process was started or stopped.
- `Verified`: .NET, Node/npm, Docker CLI, and `sqlcmd` are installed. Tool presence is not runtime verification.
- `Verified`: the API migrates its configured database at startup. Anonymous registration is available and grants 5 initial credits, so a disposable account can authenticate a small-count smoke without privileged credit mutation.
- `Verified`: the checked-in Playwright configuration owns web port 3000 and normally starts Next itself. The standard full app uses web 3020 and API 7039, so the target/configuration must be explicit.
- `Verified`: current direct-service tests use EF InMemory and a fake `IGoogleFormsClient`. Existing SQL fixtures are opt-in and demonstrate the required local-instance/exact-database guard, but they own another task database.
- `Verified`: production DI binds `IGoogleFormsClient` to the real HTTP implementation and there is no checked-in runtime fake switch. No live Google request is authorized.

Read-only commands used:

```powershell
Get-NetTCPConnection -LocalPort 3000,3020,7039 -State Listen
Get-Service | Where-Object { $_.Name -match 'MSSQL|SQL' }
Get-Command sqlcmd,dotnet,node,npm,docker
sqlcmd -S . -E -C -d master -Q "SELECT name FROM sys.databases WHERE name IN ('FormAutoHub_DirectRule_Safety_20261101');"
```

Configuration inspection reported only safe server/database/auth-mode fields and environment variable names. It did not print connection strings, JWTs, cookies, passwords, provider keys, or local env values.

## Frozen-snapshot prerequisite

Backend plans opt-in SQL tests guarded by:

- `FORMAUTO_DIRECT_SQL_SERVER=.` or `localhost` only.
- `FORMAUTO_DIRECT_SQL_DATABASE=FormAutoHub_DirectRule_Safety_20261101` exactly.
- Windows integrated authentication and `TrustServerCertificate`; no connection-string secret.
- Fixture does not create, drop, restore, or reset a database. It seeds random GUID rows into a pre-provisioned, fully migrated database and uses only fake `IGoogleFormsClient` calls.

`Verified`: root authorized the exact isolated DB. It was created and migrated using only a process-scoped `ConnectionStrings__DefaultConnection` override; ignored app configuration was not changed. The first `--no-build` attempt targeted an absent Debug artifact and failed before connecting. The Release `--no-build` attempt completed all 13 migrations. A frozen implementation snapshot is still required before seed, tests, or process startup.

## Proposed verification sequence

The sequence below began as a proposal; executed steps now carry explicit `Verified` evidence and unexecuted scope is listed under `Not run`.

1. Provisioning is complete. The executed form was equivalent to the following; `FormAutoHub` and other databases were not targeted.

```powershell
sqlcmd -S . -E -C -d master -Q "CREATE DATABASE [FormAutoHub_DirectRule_Safety_20261101];"
$env:ConnectionStrings__DefaultConnection='Server=.;Database=FormAutoHub_DirectRule_Safety_20261101;Trusted_Connection=True;TrustServerCertificate=True;Encrypt=False'
dotnet tool run dotnet-ef database update --no-build --configuration Release --project src/FormAutoHub.Api --startup-project src/FormAutoHub.Api
```

Before tests, read `SERVERPROPERTY('MachineName')`, `DB_NAME()`, and `__EFMigrationsHistory` from that exact DB. Stop if identity or migration tip differs.

2. Run focused real-SQL concurrency tests, then the backend regression suite. Use test filters from the frozen test class rather than assuming names before freeze.

```powershell
$env:FORMAUTO_DIRECT_SQL_SERVER='.'
$env:FORMAUTO_DIRECT_SQL_DATABASE='FormAutoHub_DirectRule_Safety_20261101'
dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --filter FullyQualifiedName~DirectRuleSubmissionSqlServerTests
dotnet test FormAutoHub.sln -c Release
```

Required SQL assertions: same command collapses to one job/debit/send; different commands on one project admit only one; direct versus legacy send admits only one; same user across different projects cannot overspend the shared account. Inspect `SubmissionJobs`, `GeneratedResponses`, `CreditTransactions`, `UsageLogs`, and `SubmissionLogs` by fixture GUID, with fake-provider call counts. EF InMemory evidence is insufficient for these races.

`Verified` 2026-11-01: after backend declared its source/tests frozen, the focused command above (without the full-suite line) passed 8/8 in 6 seconds, 0 failed and 0 skipped. It compiled the Release target and emitted the existing `NU1603` Google Forms package-resolution warning; no restore or live provider call occurred. Post-run retained evidence counts in the owned DB were 8 users, 9 projects, 7 jobs, 6 credit transactions, 13 usage logs, and 6 submission logs. These are synthetic GUID fixtures and have not been cleaned.

3. Safe authenticated API smoke requires an owned API process on a non-conflicting port, the exact isolated DB, a disposable registered user, and a local loopback fake submission receiver (or an explicitly approved test-only DI host). Never point `FormActionUrl` at Google. Keep session JSON in an ignored task state file and never print tokens.

Proposed HTTP cases: unauthenticated direct request is 401; wrong owner is 404; invalid count/empty command is 400 without ledger rows; first accepted direct command returns existing `SubmissionJobResponse`; replay with the same command and changed count returns the same job with no second debit/provider call; another command conflicts while active; legacy send still rejects `confirmed=false`; direct rule path never invokes AI generation.

`Verified` 2026-11-01 against the backend-frozen source: the Release API DLL SHA-256 was `9DC810554FFA36F5D5F9E83102F703D6C543927C7226052E83DAE7E6DACA3A09` and its timestamp was newer than all listed affected backend source files. An owned production Kestrel process ran on `127.0.0.1:7041` with process-only DB/JWT overrides; an owned loopback receiver ran on `127.0.0.1:18081`. Results were health 200, anonymous direct 401, invalid count 400, empty command 400, wrong owner 404, legacy `confirmed=false` 400, and first direct request 200/Completed with total=2/success=2. Replaying the same command with count changed to 5 returned the same job and original total=2. The receiver observed exactly two POSTs, both from the first command; replay made none. Parameterized SQL verification for command `7621df2b-5991-44e7-9025-3264cbd90637` returned one job, one debit, two generated responses, two submission logs, and balance 3. Both ports were verified released after the smoke.

The first seeding attempt registered one disposable user and then failed before project seed because direct PowerShell loading of `Microsoft.Data.SqlClient` reported unsupported platform. The successful retry used PowerShell's built-in `System.Data.SqlClient` with parameters. The orphan synthetic registration remains retained evidence; no token/password was printed. The API log had one expected local HTTP warning because only an HTTP URL was intentionally bound and HTTPS redirection could not determine an HTTPS port.

`Verified` B1 rejection-audit rerun on 2026-11-01: source `DirectRuleSubmissionService.cs` SHA-256 was `CEB334225F2F7213B5BF64CAC7B5289A39189028924462A202C8DE1A4A58EF3D`; the fresh Release API DLL SHA-256 was `6E34EF601E9DE0C04D651B1F9B1842A2D16A5483C19A08F72F56D9A318FB31F3`. Invalid count, empty command, no credit, missing rule, and active-job conflict each returned HTTP 400 and wrote exactly one `FormAutomation` / `SubmitResponses` / `Failed` usage log with 0 credits. Each left 0 new jobs/debits/generated responses/submission logs; active conflict retained only its one pre-seeded job. A wrong-owner request with invalid input returned 404 and wrote no usage log or other effect. A fresh successful count=1 command completed, replay with changed count returned the same job/original total, and the loopback receiver observed exactly one POST.

The B1 build first failed because two prior owned Kestrel children had released their ports but remained alive and locked the old DLL. Their exact command, parent loss, creation times matching prior runtime launches, and lack of listeners established ownership; PIDs 36776 and 31068 were stopped. The subsequent Release build passed with only the existing `NU1603` warning. For the pending final browser run, owned API session 13850 uses child PID 32112 (parent PowerShell 32340) on port 7042, and owned receiver session 41225 uses PowerShell PID 35544 on port 18081.

4. Browser smoke should use an explicit Playwright config targeting the owned web/API processes. Because `/api/forms/analyze` otherwise contacts Google, intercept only analysis with a deterministic seeded-project response while forwarding auth, rule save, direct send, job result, and dashboard reads to the real isolated API. The API submission boundary must terminate at the owned loopback receiver. Verify rules mode has one direct action, no preview accordion/checkbox/common-send request, stable command recovery after an induced transport loss, and AI modes retain preview plus confirmation. Record network statuses, hydration/chunk success, SQL evidence, and bounded server/receiver logs.

`Verified` 2026-11-02 on frontend hashes `page.tsx` `51AF7F64AE72AA5000CB51461D7D8308A682C577A983666A1282A7834B0127E0`, `_helpers.ts` `C0CF496065859B5283E89C349062BDBB4B7AFFF98419BA2E1D5FF72F8BB10B64`, and direct spec `D41A2D599B391F7895743C13D269967FDEE6DD70B38361A583C803BC519E2A9A`. T3 `preview_status` returned `available:false`; `preview_open` failed with `ERR_CONNECTION_REFUSED` before the owned web server started, so Playwright was the documented fallback.

The final browser run used real JWT registration, real dashboard reads, real answer-rule POST, real direct API/SQL workflow, and the owned loopback receiver. Only `/api/forms/analyze` was fulfilled with the deterministic already-seeded project to avoid a live Google request. The first direct POST committed successfully server-side and its browser response was intentionally reset; reload retained the user-scoped command, **Kiểm tra kết quả gửi** reused the same command, did not save rules again, and displayed the completed job. Rules mode had no preview/confirmation section or checkbox. AI Option 2 exposed **Lưu và tạo AI preview**, did not expose **Tạo và gửi ngay**, and no AI generation/provider call was made.

Network/browser evidence: one real rule write, two browser attempts with the same command, direct replay HTTP 200, dashboard HTTP 200, 42 Next chunks all HTTP 200, zero page exceptions, mobile 390x844 result visible with no horizontal overflow. Console errors were limited to the intentionally injected `ERR_CONNECTION_RESET` and expected 404 for absent `ai-prompt-profile?mode=Option2`; API logs confirmed that 404. SQL for project `caf53934-1a17-46fd-b939-dbc2534b0517` and job `6ab6a236-c33c-4a0c-a196-74895cace149` showed 1 completed job (total/success 1/1), 1 debit of -1, 1 submitted generated response, 2 usage rows totaling 1 credit with 0 failed usage, 1 successful submission log, and balance 4. Screenshots are retained as `artifacts/reports/direct-rules-20261101/direct-result-mobile.png` (SHA-256 `CF2AD2620969A56ABD824669467A8FF569B91BF7E81E76ADF4DC720775584E44`) and `ai-gate-desktop.png` (SHA-256 `D458C28871EBC67CBD1967F049166C4517786F01FF806151D783619BC9A35F3D`).

5. `Verified`: owned API 7042, web 3020, and loopback receiver 18081 were stopped. Child processes that survived PTY interruption were matched by exact command and creation time before termination; all three ports then rejected TCP connection. Database retention/deletion needs explicit root direction; it remains evidence.

## Risks and deferred items

- `Verified`: safe provider boundary used a localhost receiver; no Google or paid AI provider request was made.
- `Risk`: registration provides only 5 credits. Use count at most 5 for public auth smoke, or have an approved fixture seed a larger balance in the isolated DB for batch/concurrency cases.
- `Risk`: API startup calls `Database.Migrate()`. A wrong connection target would mutate it, so DB identity must be proven before startup.
- `Deferred`: automatic hard-crash takeover remains outside the approved no-schema contract; a `Pending`/`Running` replay is read-only.
- `Not run`: live Google, live/paid AI generation, production/current DB, deployment, and release. AI confirmation-after-preview remains covered by the frozen Playwright fixture suite rather than runtime provider smoke, because no provider call was authorized. The dedicated DB, synthetic accounts/fixtures, and screenshots remain retained evidence.
