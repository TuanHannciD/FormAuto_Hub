# FAH-DIRECT-001 - Khảo sát runtime và kế hoạch kiểm chứng

Ngày: 2026-11-01; tiếp tục và hoàn tất ngày 2026-11-02
Trạng thái: Đã hoàn tất kiểm chứng runtime cho snapshot local frozen; không tuyên bố integration hay release.
Chủ sở hữu: subagent runtime, model `gpt-5.6-sol`, reasoning `medium`; không dispatch agent con.
Tài nguyên sở hữu: cặp báo cáo này, artifacts ignored được giữ lại và database local `FormAutoHub_DirectRule_Safety_20261101`. Toàn bộ API/web/receiver process và port thuộc quyền sở hữu đã được giải phóng; DB cùng evidence synthetic được cố ý giữ lại.

## Bằng chứng khảo sát

- `Verified`: dịch vụ SQL Server local mặc định `MSSQLSERVER` đang chạy; đã có `sqlcmd`, và Windows integrated authentication truy cập được local default instance khi bật trust certificate rõ ràng (`-C`). Danh tính server là máy local/default instance.
- `Verified`: database chuyên dụng không tồn tại trước khi provisioning. Sau đó root cho phép tạo; DB hiện `ONLINE/MULTI_USER` trên local default instance, đã áp dụng 13 migrations đến `20261029142938_NormalizeTopupEvidenceColumnLengths`, và có 0 user ngay sau migration.
- `Verified`: file ignored `src/FormAutoHub.Api/appsettings.Development.json` tồn tại; danh tính đã che nhạy cảm là `localhost` / `FormAutoHub`, integrated authentication, không có SQL user/password. Đây là database development hiện hữu chưa rõ quyền sở hữu và bị cấm dùng cho task này.
- `Verified`: file ignored `apps/web/.env.local` tồn tại. Chỉ kiểm tra tên biến, không in giá trị hay token.
- `Verified`: tại thời điểm khảo sát không có listener ở port 3000, 3020 và 7039. Không start/stop process nào.
- `Verified`: đã có .NET, Node/npm, Docker CLI và `sqlcmd`. Việc có tool không phải bằng chứng runtime đã đạt.
- `Verified`: API tự migrate database được cấu hình khi startup. Đăng ký ẩn danh có sẵn và cấp 5 credit ban đầu, nên có thể dùng tài khoản dùng một lần để smoke số lượng nhỏ mà không cần mutation credit đặc quyền.
- `Verified`: cấu hình Playwright hiện tại sở hữu web port 3000 và thường tự start Next. Full app chuẩn dùng web 3020 và API 7039, vì vậy phải chỉ định target/config rõ ràng.
- `Verified`: test direct-service hiện dùng EF InMemory và fake `IGoogleFormsClient`. SQL fixture hiện hữu là opt-in và thể hiện guard local-instance/exact-database cần thiết, nhưng thuộc database task khác.
- `Verified`: DI production bind `IGoogleFormsClient` vào HTTP implementation thật và chưa có fake switch runtime trong repo. Không được phép gọi Google live.

Các lệnh chỉ đọc đã dùng:

```powershell
Get-NetTCPConnection -LocalPort 3000,3020,7039 -State Listen
Get-Service | Where-Object { $_.Name -match 'MSSQL|SQL' }
Get-Command sqlcmd,dotnet,node,npm,docker
sqlcmd -S . -E -C -d master -Q "SELECT name FROM sys.databases WHERE name IN ('FormAutoHub_DirectRule_Safety_20261101');"
```

Việc kiểm tra cấu hình chỉ báo cáo server/database/auth-mode an toàn và tên biến môi trường. Không in connection string, JWT, cookie, password, provider key hay giá trị env local.

## Điều kiện trước khi kiểm tra snapshot đóng băng

Backend dự kiến thêm SQL test opt-in với guard:

- `FORMAUTO_DIRECT_SQL_SERVER=.` hoặc chỉ `localhost`.
- `FORMAUTO_DIRECT_SQL_DATABASE=FormAutoHub_DirectRule_Safety_20261101` chính xác.
- Windows integrated authentication và `TrustServerCertificate`; không dùng secret connection string.
- Fixture không tạo, drop, restore hay reset database. Fixture seed các row GUID ngẫu nhiên vào database đã được runtime tạo và migrate đầy đủ, đồng thời chỉ dùng fake `IGoogleFormsClient`.

`Verified`: root đã cho phép đúng DB cô lập. DB được tạo và migrate chỉ bằng process-scoped override `ConnectionStrings__DefaultConnection`; không sửa ignored app configuration. Lần thử `--no-build` đầu trỏ tới Debug artifact chưa có nên fail trước khi kết nối. Lần Release `--no-build` hoàn thành đủ 13 migrations. Vẫn cần snapshot triển khai đóng băng trước khi seed, chạy test hay start process.

## Trình tự kiểm chứng đề xuất

Trình tự dưới đây ban đầu là đề xuất; bước đã chạy hiện có bằng chứng `Verified` rõ ràng, còn phạm vi chưa chạy được liệt kê dưới `Not run`.

1. Provisioning đã hoàn thành. Dạng lệnh đã chạy tương đương nội dung dưới đây; không target `FormAutoHub` hay database khác.

```powershell
sqlcmd -S . -E -C -d master -Q "CREATE DATABASE [FormAutoHub_DirectRule_Safety_20261101];"
$env:ConnectionStrings__DefaultConnection='Server=.;Database=FormAutoHub_DirectRule_Safety_20261101;Trusted_Connection=True;TrustServerCertificate=True;Encrypt=False'
dotnet tool run dotnet-ef database update --no-build --configuration Release --project src/FormAutoHub.Api --startup-project src/FormAutoHub.Api
```

Trước test, đọc `SERVERPROPERTY('MachineName')`, `DB_NAME()` và `__EFMigrationsHistory` từ đúng DB này. Dừng nếu danh tính hoặc migration tip khác dự kiến.

2. Chạy SQL concurrency test tập trung rồi regression backend. Dùng filter theo class test của snapshot đóng băng, không giả định tên trước khi freeze.

```powershell
$env:FORMAUTO_DIRECT_SQL_SERVER='.'
$env:FORMAUTO_DIRECT_SQL_DATABASE='FormAutoHub_DirectRule_Safety_20261101'
dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --filter FullyQualifiedName~DirectRuleSubmissionSqlServerTests
dotnet test FormAutoHub.sln -c Release
```

Assertion SQL bắt buộc: cùng command chỉ có một job/debit/send; command khác nhau trên cùng project chỉ một request được nhận; direct đối đầu legacy send chỉ một request được nhận; cùng user trên hai project khác nhau không thể tiêu vượt account chung. Kiểm tra `SubmissionJobs`, `GeneratedResponses`, `CreditTransactions`, `UsageLogs`, `SubmissionLogs` theo GUID fixture và số lần gọi fake provider. EF InMemory không đủ chứng minh các race này.

`Verified` ngày 2026-11-01: sau khi backend xác nhận source/tests của họ đã frozen, lệnh focused ở trên (không gồm dòng full suite) đạt 8/8 trong 6 giây, 0 fail và 0 skip. Lệnh compile Release target và phát cảnh báo `NU1603` hiện hữu về phiên bản package Google Forms; không restore hay gọi provider live. Số lượng evidence được giữ lại trong DB thuộc quyền sở hữu sau run: 8 users, 9 projects, 7 jobs, 6 credit transactions, 13 usage logs và 6 submission logs. Đây là fixture GUID synthetic và chưa cleanup.

3. Authenticated API smoke an toàn cần API process thuộc quyền sở hữu trên port không xung đột, đúng DB cô lập, user đăng ký dùng một lần và local loopback fake submission receiver (hoặc test-only DI host được duyệt rõ). Không bao giờ trỏ `FormActionUrl` tới Google. Lưu session JSON trong file state ignored của task và không in token.

Các case HTTP đề xuất: direct không auth trả 401; sai owner trả 404; count sai/command rỗng trả 400 và không có ledger row; command direct được nhận lần đầu trả `SubmissionJobResponse` hiện hữu; replay cùng command dù đổi count vẫn trả cùng job, không debit/gọi provider lần hai; command khác conflict khi đang active; legacy send vẫn từ chối `confirmed=false`; direct rules không gọi AI generation.

`Verified` ngày 2026-11-01 trên source backend đã frozen: Release API DLL có SHA-256 `9DC810554FFA36F5D5F9E83102F703D6C543927C7226052E83DAE7E6DACA3A09` và timestamp mới hơn toàn bộ file backend bị ảnh hưởng đã liệt kê. Kestrel production thuộc quyền sở hữu chạy tại `127.0.0.1:7041` với DB/JWT override chỉ trong process; loopback receiver thuộc quyền sở hữu chạy tại `127.0.0.1:18081`. Kết quả: health 200, direct không auth 401, count sai 400, command rỗng 400, sai owner 404, legacy `confirmed=false` 400, và direct request đầu trả 200/Completed với total=2/success=2. Replay cùng command nhưng đổi count thành 5 trả đúng cùng job và total gốc=2. Receiver chỉ nhận đúng hai POST từ command đầu; replay không phát sinh POST. SQL kiểm tra tham số hóa cho command `7621df2b-5991-44e7-9025-3264cbd90637` trả một job, một debit, hai generated responses, hai submission logs và balance 3. Cả hai port được xác minh đã giải phóng sau smoke.

Lần seed đầu đã đăng ký một user dùng một lần rồi fail trước khi seed project vì nạp trực tiếp `Microsoft.Data.SqlClient` trong PowerShell báo không hỗ trợ platform. Lần retry thành công dùng `System.Data.SqlClient` có sẵn trong PowerShell với parameters. Registration synthetic mồ côi được giữ lại làm evidence; không in token/password. API log có một cảnh báo HTTP local dự kiến vì cố ý chỉ bind HTTP URL nên HTTPS redirection không xác định được HTTPS port.

`Verified` rerun rejection-audit B1 ngày 2026-11-01: source `DirectRuleSubmissionService.cs` có SHA-256 `CEB334225F2F7213B5BF64CAC7B5289A39189028924462A202C8DE1A4A58EF3D`; Release API DLL mới có SHA-256 `6E34EF601E9DE0C04D651B1F9B1842A2D16A5483C19A08F72F56D9A318FB31F3`. Count sai, command rỗng, hết credit, thiếu rule và active-job conflict đều trả HTTP 400 và ghi đúng một usage log `FormAutomation` / `SubmitResponses` / `Failed` với 0 credit. Mỗi case để lại 0 job/debit/generated response/submission log mới; active conflict chỉ giữ đúng một job đã seed. Request sai owner kèm input sai trả 404, không ghi usage log hay effect khác. Một command count=1 mới hoàn tất; replay dù đổi count vẫn trả cùng job/total gốc, và loopback receiver chỉ nhận đúng một POST.

Build B1 lần đầu fail vì hai Kestrel child thuộc runtime trước đó đã nhả port nhưng vẫn sống và khóa DLL cũ. Command chính xác, parent đã mất, creation time trùng các lần runtime launch và không còn listener đã chứng minh ownership; PID 36776 và 31068 được dừng. Build Release sau đó đạt, chỉ còn cảnh báo `NU1603` hiện hữu. Để chờ browser run cuối, API session 13850 thuộc sở hữu dùng child PID 32112 (PowerShell parent 32340) trên port 7042; receiver session 41225 dùng PowerShell PID 35544 trên port 18081.

4. Browser smoke nên dùng Playwright config rõ ràng trỏ tới web/API process thuộc quyền sở hữu. Vì `/api/forms/analyze` sẽ gọi Google, chỉ intercept bước analyze bằng response deterministic của project đã seed; auth, lưu rule, direct send, đọc job và dashboard vẫn forward tới API/SQL cô lập thật. Biên submit của API phải kết thúc tại loopback receiver thuộc quyền sở hữu. Kiểm tra rules mode chỉ có một direct action, không preview accordion/checkbox/common-send request, command ổn định khi khôi phục sau transport loss, và AI mode vẫn giữ preview cùng confirmation. Ghi network status, hydration/chunk, bằng chứng SQL và log server/receiver có giới hạn.

`Verified` ngày 2026-11-02 trên frontend hash `page.tsx` `51AF7F64AE72AA5000CB51461D7D8308A682C577A983666A1282A7834B0127E0`, `_helpers.ts` `C0CF496065859B5283E89C349062BDBB4B7AFFF98419BA2E1D5FF72F8BB10B64`, và direct spec `D41A2D599B391F7895743C13D269967FDEE6DD70B38361A583C803BC519E2A9A`. T3 `preview_status` trả `available:false`; `preview_open` fail `ERR_CONNECTION_REFUSED` trước khi web server thuộc quyền sở hữu được start, nên Playwright là fallback đúng tài liệu.

Browser run cuối dùng đăng ký JWT thật, dashboard read thật, answer-rule POST thật, direct API/SQL workflow thật và loopback receiver thuộc quyền sở hữu. Chỉ `/api/forms/analyze` được fulfill bằng project deterministic đã seed để tránh gọi Google live. Direct POST đầu commit thành công phía server nhưng browser response được cố ý reset; reload giữ command theo user, **Kiểm tra kết quả gửi** dùng lại cùng command, không lưu rule lần nữa và hiển thị job hoàn tất. Rules mode không có section preview/confirmation hay checkbox. AI Option 2 hiển thị **Lưu và tạo AI preview**, không hiển thị **Tạo và gửi ngay**, và không gọi AI generation/provider.

Bằng chứng network/browser: một rule write thật, hai browser attempt cùng command, direct replay HTTP 200, dashboard HTTP 200, 42 Next chunks đều HTTP 200, không có page exception, kết quả ở viewport mobile 390x844 hiển thị và không overflow ngang. Console error chỉ gồm `ERR_CONNECTION_RESET` được tiêm có chủ ý và 404 dự kiến do chưa có `ai-prompt-profile?mode=Option2`; API log xác nhận 404 này. SQL cho project `caf53934-1a17-46fd-b939-dbc2534b0517` và job `6ab6a236-c33c-4a0c-a196-74895cace149` có 1 job hoàn tất (total/success 1/1), 1 debit -1, 1 generated response đã Submitted, 2 usage rows tổng 1 credit và 0 failed usage, 1 submission log Success, balance 4. Screenshot được giữ tại `artifacts/reports/direct-rules-20261101/direct-result-mobile.png` (SHA-256 `CF2AD2620969A56ABD824669467A8FF569B91BF7E81E76ADF4DC720775584E44`) và `ai-gate-desktop.png` (SHA-256 `D458C28871EBC67CBD1967F049166C4517786F01FF806151D783619BC9A35F3D`).

5. `Verified`: API 7042, web 3020 và loopback receiver 18081 thuộc quyền sở hữu đã dừng. Child process còn sống sau PTY interruption được đối chiếu exact command và creation time trước khi terminate; sau đó cả ba port đều từ chối TCP connection. Việc giữ/xóa DB cần chỉ đạo rõ của root; DB vẫn là evidence.

## Rủi ro và hạng mục Deferred

- `Verified`: provider boundary an toàn dùng localhost receiver; không gọi Google hay paid AI provider.
- `Risk`: đăng ký chỉ cấp 5 credit. Dùng count tối đa 5 cho public auth smoke, hoặc fixture được duyệt seed balance lớn hơn trong DB cô lập cho batch/concurrency.
- `Risk`: API startup gọi `Database.Migrate()`. Trỏ nhầm connection sẽ mutation DB đó, nên phải chứng minh danh tính DB trước startup.
- `Deferred`: automatic hard-crash takeover nằm ngoài contract no-schema đã duyệt; replay job `Pending`/`Running` chỉ đọc.
- `Not run`: Google live, AI generation live/trả phí, production/current DB, deployment và release. Confirmation-after-preview của AI được cover bởi frozen Playwright fixture suite thay vì runtime provider smoke vì không được phép gọi provider. Dedicated DB, tài khoản/fixture synthetic và screenshot được giữ lại làm evidence.
