# ENVIRONMENT_SETUP

## Mục đích

Định nghĩa expectation về môi trường mà không tự bịa deployment detail.

## Trạng thái hiện tại

Initial Phase 1 backend scaffold đã tồn tại. Environment details vẫn là foundation guidance cho đến khi business implementation và deployment decisions được duyệt.

## Nhóm local dự kiến

Backend:

- .NET 9 SDK
- ASP.NET Core Web API
- SQL Server local/dev instance
- EF Core CLI/tools

Configuration:

- database connection string
- auth settings khi đã duyệt
- Google integration settings khi đã duyệt
- payment settings chỉ sau khi payment gateway được duyệt
- AI settings chỉ sau khi AI feature được duyệt

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

Exact hosting và deployment platform: Deferred.

## Kỷ luật SQL Server

- Dùng SQL Server cho persistence.
- Dùng EF Core migrations cho schema changes.
- Không dùng schema drift thủ công làm workflow bình thường.
- Database changes phải có migration validation.

## Secrets

- Không commit secrets.
- Không document real credentials.
- Dùng environment variables hoặc secret storage khi hosting được duyệt.

## Deferred configuration

Deferred:

- Google OAuth client settings
- official Google Forms API credentials
- payment gateway credentials
- AI provider keys
- AI provider encryption key material trước khi AI provider settings được duyệt
- lựa chọn production AI provider adapter
- live provider/model catalog validation ngoài OpenAI-compatible adapter path đã duyệt
- queue/background job settings
- webhook URLs
- email provider settings
