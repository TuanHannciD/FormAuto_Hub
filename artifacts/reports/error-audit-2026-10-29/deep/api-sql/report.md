# FAH-ERR-001 — actual API/JWT/SQL runtime audit

2026-10-30 ICT (UTC19:36 ngày29); sole runtime owner `gpt-6.1-sol/high`, không children. Đây là bounded audit thật trên owned restored clone; không sửa24errorgroups/source.

## Summary

**Verified:** actual parent Release API binary SHA`1497eab5c545e04ffbdd44091c94af18050e864756855a8747a5ff9a8f268485` chạy Program/Migrate/MVC/JWT/EF SQL Server, **15bounded scenarios +health+2authentication setup requests =18HTTP observations** đúng expected statuses. Role/session thật qua registration/login/refresh, không synthetic bearer giả. Requests chỉ localhost; invalidformURL bị reject trước external HttpClient.

DB target duy nhất cho mutations: `FormAutoHub_FAHERR001_restore_20261029_a19f7a2` id8; schema đã normalized/history14. Clone được dùng cho fixtures sau preservation checkpoint B2; **không gọi clone hiện tại còn byte-equal user source sau audit**. Main user DB không auth/fixture DML hoặc API startup trong lượt này.

## Results và liên hệ findings

| Scenario | Actual HTTP/persistence | Finding implication |
| --- | --- | --- |
| Invalid JSON login |400 application/problem+json, English validation title, fields `$`/`request`, detailed parser message, traceId khớp requesttrace |ERR-002 actual MVC payload proof; sharedhelper vẫn cần preserve existing errors/traceId, không tạo contract mới |
| Missing login fields |400 with Email/Password errors tiếng Anh, existing traceId |ERR-002/019, phân biệt modelbinding với service validation |
| Register short password |400 generic `Bad Request`, không field-error details |Actual service invalidrequest generic mapping; ERR-018/019 được thu hẹp theo payload thật, không giả API emit specific password sentence |
| Owned wrong password |401 ProblemDetails `Unauthorized`, traceId |ERR-001 actual backend source cho generic credential wording; không kiểm account enumeration |
| Anonymous protected profile |401 bodyempty |Phân biệt challenge với controller ProblemDetails401 |
| User vsAdmin permission |realUser token GET adminpackages403 `Forbidden`; realAdmin token GET same200 |Correct session/role, không dùng X-FormAuto-IsAdmin bypass hoặc forged token |
| Profile |GET200 đúng owned session id/role và expected response keys |Actual profile shape/auth tested; không thay prior fixture503 unknown-state findings |
| Missing own topup/evidence |GETrandomUUID404 ProblemDetails `Not Found` |ERR-016 genuine404 baseline; không tái tạo503 bằng realAPI hoặc suy account ownership leak |
| Invalid URL analyze |POST400 title `Form analysis failed`,detail `Invalid form URL.`; subsequent UsageLogs API200 includes Failed/AnalyzeForm/exactdescription |ERR-005 actual SQL persistence và UI-facing source text; URL malformed rejects before Google network. Failure records CreditsUsed0 |
| Admin package price0 |POST500 text/plain in Development, server ArgumentException from PackageService.ValidatePackageInput; packagecount unchanged |**ERR-013 strengthened to actual HTTP500**, prior in-process throw now realMVC failure. Unexpected error handling remains unfixed |
| Refresh session |POSTrefresh200 then GETprofile200 using issued token |Actual refresh/token SQL path succeeds on clone; no raw tokens persisted in evidence |

`clone-http-results.json` giữ method/path/status/content-type,safe titles/field-error values,existing traceId/request trace,bytecounts/shape flags. Auth success payload chỉ lưu **key names**, không values/email/password/tokens.500body chỉbytecount/content-type; không lưu DeveloperExceptionPage body vì có thể chứa Authorization headers. Không xuất raw personal rows hoặc provider payload.

## Independent SQL và logs

- Register dùng actual AuthService→dedicated CreditService GrantInitialCredits; aggregate owned user setup users1/accounts1/CreditTransactions1/UsageLogs0/RefreshTokens1. Sau errors/refresh:users1/accounts1/CreditTransactions1,expectedfailedAnalyzeLog1,RefreshTokens3. Không direct balance/credit ledger fixture; direct SQL duy nhất là exact synthetic user Role từ User→Admin để lấy realAdmin login. Existing user rows/accounts không bị cập nhật.
- Invalid price packagecount before/after bằng nhau. Failed Analyze UsageLog được xác nhận cả actual list API và SELECT aggregate; không chỉ process log.
- `clone-api-server.log` có34JSONrecords với scopes,EF parameter values mặc định redacted; `clone-log-correlation.json` nối **13/18observations** bằng existing TraceId tới server categories/error records.5requests còn lại không có serverrecord phù hợp trong loggingconfiguration hiện tại; không giả mọi request đã có applicationlog. Server exception/stack được giữ internal log, không raw500response hoặc Authorization tokens. Boundedscan không thấy JWT/Bearer-value patterns.
- Log pattern scan và external-client origin log checks là bounded checks, không chứng minh traffic toàn máy hoặc mọi possible secret encoding. Không invoke Google/PayOS/AI/submission endpoints; AI adapter disabled bằng process-only config.

## Resources / files changed / scope alignment

- Fresh port5248 absent trước acquire; PID16928, parentbinary/source hash trên. Override connection trong child process memory chỉ clone; random process-only JWTsigningkey khiến clone tokens không dùng được với main. Không sửa appsettings hoặc secret config. DPkey store riêng ngoài Git dưới TEMP, được giữ; chỉ framework tạo keyfiles nếu cần, không in keys.
- Health200 chứng minh actual Program Migrate startup chạy trên normalized clone. Process đã terminate đúng owned PID; `clone-resource-release.json`,exitCode1 do requested termination (không suy startup crash),PID absent/port5248 không listener sau release. SQLservice/userprocess/tab giữ nguyên,không cleanup DB/keys/evidence.
- Chỉ artifacthelper/report/log/JSON ở thư mục này và authorized ownedclone fixture mutations. Không productpatch/install/commit/push/deploy/providercost/externalformsubmit. Root integration17source riêng không phải edit của auditowner.

## Validation not performed / Risks / Next step

**Not run:** browser rerender/chunks/hydration lần này (đã có earlier realbrowser+fixture riêng),Google/PayOS/AI providerstub HTTP integrated toànDI,provider timeout/network failures qua actualAPI,webhook/payment/submission,fullsurface/errorbranches,authabuse/securitypenetration,production. Providerstubs chưa có wiring trong actual unchanged Program,không tự sửasource để gắn; markNotrun chứ không gọi DBblocker. Failed admin500 là existingerror được tái hiện,không repairpass.

Next: root nhận evidence/runtimefinding mapping và paired dossier; main sync/startup là checkpoint riêng. Không claim full24groupauditDone hoặc fixes/integrationrelease từ18representative observations. Giữ partial/Notrun gates thật.
