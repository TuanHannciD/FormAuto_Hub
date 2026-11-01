# FAH-ERR-001 — Real API/JWT/SQL follow-up

2026-10-30 · **Representative actual runtime audit Verified;no error fixes or full-system acceptance.** Source is parent Release binary SHA256 `1497eab5c545e04ffbdd44091c94af18050e864756855a8747a5ff9a8f268485`. [Sanitized owner report](../../../../artifacts/reports/error-audit-2026-10-29/deep/api-sql/report.md),[HTTP observations](../../../../artifacts/reports/error-audit-2026-10-29/deep/api-sql/clone-http-results.json),[ledger](../../../../artifacts/reports/error-audit-2026-10-29/deep/api-sql/ledger.json).

## Target, roles and denominator

Fresh owned PID16928/localhost5248 ran actual Program/Migrate/MVC/JWT/EF SQL Server against **owned restored clone** `FormAutoHub_FAHERR001_restore_20261029_a19f7a2` id8,normalized/history14. **15bounded scenarios +health+2authentication setup =18HTTP observations**,not18independent error groups. User/Admin sessions came from actual register/login/refresh with process-only signing key;no forged bearer or admin bypass. Main user DB had no auth/fixture DML from this audit.

| Scenario | Observed result and implication |
| --- | --- |
| Invalid JSON/missing login fields |400 application/problem+json;actual English validation fields/errors and existing traceId. Strengthens ERR-002/019;new contract not assumed. |
| Short password registration |400 generic `Bad Request`;does not prove prior synthetic specific-password sentence or ERR-018 mapping fixture is emitted by current API. |
| Wrong password/anonymous profile |401ProblemDetails `Unauthorized` vs401empty challenge. Strengthens actual backend boundary for ERR-001;preserve generic credential privacy. |
| User/Admin access |Real User403 `Forbidden`;real Admin200 for same admin-packages GET. |
| Profile/refresh |Owned profile200;refresh200 then profile200 using newly issued token. Actual auth/session/SQL path;not account503 browser fallback reproduction. |
| Missing topup/evidence |Random UUID genuine404 `Not Found`;ERR-016 baseline. Does not reproduce realAPI503 or reveal other ownership. |
| Invalid URL analyze/usage |400 `Form analysis failed` / `Invalid form URL.`;UsageLogs GET and independent SQL aggregate confirm Failed/AnalyzeForm record,CreditUsed0,no external Google call. Strengthens ERR-005 persistence. |
| Admin package price0 |Actual500 text/plain in Development;internal ArgumentException at PackageService.ValidatePackageInput;package count unchanged. Strengthens ERR-013 from in-process throw to realHTTP500;not a successful fix. |

## Persistence, logs and safe resources

Register used AuthService→dedicated CreditService,with one owned user/account/CreditTransaction. After audit these remain1/1/1;failed AnalyzeForm log1,refresh tokens1→3. Only direct SQL fixture changed exact synthetic User.Role to Admin;no direct balance/credit ledger changes. Clone fixtures occurred **after B2 preservation**,so current clone is no longer byte-equal main;B2 preservation proof remains dated and valid.

Server log has34JSON records;existing TraceId correlates **13/18observations**. Five requests lack a matching application record under current configuration;do not claim every request was logged. Auth payload artifacts retain key names only;500response retains bytecount/content-type only,not DeveloperExceptionPage/Authorization content. Bounded scans found no JWT/Bearer values or external-client origins;this is not a whole-machine/no-secret proof.

PID16928 terminated on request,exit1 reflects requested termination;PID/port released and SQLservice preserved. Process-only DB/JWT/AI overrides,no config/source edit. DP key store outside Git retained. No browser acquired,provider/charge/submission/external calls or cleanup. [Release](../../../../artifacts/reports/error-audit-2026-10-29/deep/api-sql/clone-resource-release.json).

## Four supplemental evidence-storage cases

A separate owned User session on the same clone uploaded a68-byte PNG with244ASCII filename code units:HTTP200,stored filename200units. Independent SQL aggregate confirms one evidence row,filename DATALENGTH400,MIME18bytes,image/png,content68bytes,unattached;orders0,registrationaccount1/CreditTransaction1 via actual Auth/CreditService. Download200 returns identical bytes/SHA256,`Cache-Control:no-store`,`X-Content-Type-Options:nosniff`;invalidtype400 and emptyfile400 preserve current Vietnamese guidance. [Four results and SQL aggregates](../../../../artifacts/reports/error-audit-2026-10-29/deep/api-sql/supplement-evidence-results.json).

This is actual API/SQL storage validation of the normalized columns,not another finding group or provider/submission test. PID19496/5249 released after requested termination;clone-only fixture DML,no main mutation. Main fingerprint remained unchanged after clone writes. Keep this4-case denominator separate from the earlier18observations and3main read smoke requests. No further case expansion or error fix.

## Limits and next action

Not run:new browser/render/hydration/chunks,provider-stub integration through unchanged DI,provider network/timeout/payment/webhook/submission,all error surfaces,security penetration or production. Earlier browser5/fixture remains separate. No new finding IDs;register stays24=2P1/20P2/2P3,all unfixed. Main synchronization/startup is a separate [DB checkpoint](../FAH-DB-SYNC-001/VALIDATION.md). Obtain independent final review of these bounded observations and paired synthesis;full-system audit gates remain incomplete.

## Final frozen evidence and resource release

[Canonical22-file evidence manifest](../../../../artifacts/reports/error-audit-2026-10-29/deep/api-sql/evidence-hashes-final.json) replaces the preserved stale draft;use its current report/hash/size entries,not the old manifest. [Final State Listen proof](../../../../artifacts/reports/db-sync-2026-10-29/runtime/final-resource-release-listen-final.json) verifies PIDs16928/24496/19496 absent and0TCP listeners on5247/5248/5249. Earlier PID0rawcapture is historical,not final listener proof. SQLservice/DBs/backup/evidence and DPkeys retained;no cleanup. [Final independent review](../../../../artifacts/reports/db-sync-2026-10-29/final-review/report.md) now accepts the frozen execution evidence;final paired doc bytes are verified by the documentation owner,not certified by the reviewer.
