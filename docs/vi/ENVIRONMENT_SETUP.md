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
- queue/background job settings
- webhook URLs
- email provider settings
