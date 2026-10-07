# ENVIRONMENT_SETUP

## Mục đích

Định nghĩa expectation về môi trường mà không tự bịa deployment detail.

## Trạng thái hiện tại

Repository có backend và Next.js dashboard đã triển khai. Global Phase 9 đã closeout; chưa chọn global phase tiếp theo. Xem `DEPLOYMENT_GUIDE.md` về nền tảng CI/CD production đã duyệt và tài liệu NCKH cho module riêng đó. Khôi phục môi trường local hiện có không phê duyệt tính năng mới hay integration Deferred.

## Nhóm local dự kiến

Backend:

- .NET 9 SDK
- ASP.NET Core Web API
- SQL Server local/dev instance
- EF Core CLI/tools

Configuration:

- database connection string
- JWT settings cho authentication hiện có
- Google client settings cho identity login hiện có và phạm vi NCKH OAuth/import riêng đã duyệt
- PayOS settings cho chức năng Phase 8 đã duyệt
- AI settings cho chức năng có phạm vi của Phase 6 đã hoàn tất

## Launcher chạy full app tại local

Repository cung cấp `run-local.bat` làm workflow local-development chuẩn trên Windows.

- Chạy `run-local.bat` từ thư mục gốc repository để khởi động web app và API cùng lúc.
- Web app lắng nghe tại `http://localhost:3020`.
- API dùng HTTPS launch profile hiện có tại `https://localhost:7039`.
- `npm run dev` trong `apps/web` khởi động cùng workflow full app.
- `npm run dev:web` chỉ khởi động Next.js app tại port `3020`.
- `npm run dev:api` chỉ khởi động ASP.NET Core API.
- CORS allowlist của API local gồm `localhost` và `127.0.0.1` tại port `3020`.
- Launcher tự cài frontend dependencies còn thiếu và báo rõ khi thiếu Node.js, npm, .NET SDK hoặc HTTPS development certificate.

Hướng setup AI provider cho Phase 6:

- AI provider API keys nên được nhập qua admin AI provider settings, không commit vào source-controlled configuration.
- AI API keys phải được lưu encrypted khi persist.
- environment/appsettings chỉ có thể cung cấp encryption key material hoặc local fallback sau khi review.
- provider và model phải có giá trị trước khi enable AI generation.
- Base URL optional của AI provider phải là absolute URL dùng `http` hoặc `https` khi được cấu hình.
- request generation từ normal user không được mang provider API key.
- `AI__ProviderAdapter=Deterministic` là switch chỉ dùng local/test để smoke validation AI generation bằng deterministic output.
- `AI__ProviderAdapter=OpenAICompatible` bật scoped live OpenAI-compatible chat completions adapter.
- Nếu chưa cấu hình runtime AI provider adapter được duyệt, backend AI generation phải fail an toàn và không được tạo preview giả như provider thật.
- Không đặt deterministic adapter switch trong production configuration.

## Môi trường dự kiến

- Local development
- Test/integration validation
- Production

Production dùng nền tảng một host với Docker Compose/GHCR/GitHub Actions đã duyệt, được mô tả trong `DEPLOYMENT_GUIDE.md`. Các khả năng deployment bổ sung vẫn Deferred.

## Kỷ luật SQL Server

- Dùng SQL Server cho persistence.
- Dùng EF Core migrations cho schema changes.
- Không dùng schema drift thủ công làm workflow bình thường.
- Database changes phải có migration validation.

## Secrets

- Không commit secrets.
- Không document real credentials.
- Dùng environment variables, cấu hình local được Git bỏ qua hoặc secret storage được bảo vệ phù hợp với từng môi trường.

## Khôi phục cấu hình local

- Backend local overrides nằm trong `src/FormAutoHub.Api/appsettings.Development.json`; frontend local overrides nằm trong `apps/web/.env.local`. Git bỏ qua cả hai đường dẫn. Không đặt secrets trong biến `NEXT_PUBLIC_*`; trình duyệt nhìn thấy các giá trị này.
- Dùng SQL instance local. Connection string lấy từ production không được khiến app local kết nối production. Tạo khóa ký JWT riêng cho local.
- `run-local.bat` / `npm run dev:web` cung cấp URL localhost cho API, site và NCKH callback. `.env.example` có các URL fallback cũ và không phải cấu hình local đầy đủ; không sao chép máy móc API/site URL từ file đó.
- Chỉ khôi phục Google client configuration khi có yêu cầu rõ. OAuth callback của launcher này là `http://localhost:3020/dashboard/nckh/callback`; Google phải cho phép redirect URI đó và local origin tương ứng. Sao chép client secret không chứng minh Google allowlist đã đúng.
- AI/PayOS credentials là settings được mã hóa trong database. Khôi phục env values không đủ để lấy lại chúng. Key ring gắn với application discriminator và protector purpose; dùng tài liệu khôi phục có phạm vi được liên kết từ `DEPLOYMENT_GUIDE.md`, giữ nguyên key/ciphertext local hiện có và xác minh giải mã trước khi báo khôi phục thành công.
- Lưu key ring của runtime local bên ngoài thư mục tạm, ví dụ `%LOCALAPPDATA%/FormAutoHub/DataProtection-Keys`, với quyền Windows được giới hạn. Đặt `DataProtection:KeysPath` trong cấu hình backend được Git bỏ qua. Bảo toàn thư mục này cùng các bản backup database local.
- Đối chiếu SQL migration history hiện có với source trước khi khởi động: API gọi `Database.Migrate()` lúc startup. Bảo toàn database có migration thiếu trong source và báo sự lệch; không xóa migration history.
- Cài frontend dependencies bằng `npm ci` tại `apps/web`, rồi chạy launcher và xác minh API health, route local, authentication và log liên quan. Báo trạng thái integration ngoài riêng với trạng thái khởi động local.

## Ranh giới cấu hình và các mục Deferred

Google identity configuration, NCKH OAuth/import configuration thuộc phạm vi riêng đã duyệt, PayOS credentials/webhook URLs của Phase 8 và AI provider configuration có phạm vi của Phase 6 phục vụ hành vi đã được phê duyệt. Giá trị của chúng là secrets theo môi trường, không phải phê duyệt tính năng mới. Google Forms integration cho core và AI rollout rộng hơn vẫn Deferred.

Deferred:

- Google Forms integration ngoài phạm vi NCKH riêng đã duyệt
- payment providers khác PayOS
- AI adapters ngoài OpenAI-compatible path có phạm vi đã duyệt
- live provider/model catalog validation ngoài OpenAI-compatible adapter path đã duyệt
- queue/background job settings
- webhook platforms ngoài PayOS flow đã duyệt
- email provider settings
