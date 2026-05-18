# ARCHITECTURE_BOUNDARIES

## Mục đích

Định nghĩa trách nhiệm layer và các hành vi chuyển ownership bị cấm.

## Hướng kiến trúc đã chốt

- Backend: ASP.NET Core Web API .NET 9.
- API style: controller-based REST API cho MVP.
- Database: SQL Server.
- ORM: Entity Framework Core với migrations.
- Background processing: Deferred cho MVP, chỉ xem xét sau khi synchronous flow cơ bản chạy đúng.
- Frontend framework: Next.js web dashboard.

## Trách nhiệm layer

### Controllers

Sở hữu:

- route binding
- request DTO input
- response DTO output
- HTTP status mapping
- authorization attributes/filters khi đã duyệt

Không sở hữu:

- business logic nặng
- credit deduction logic
- nội bộ parse/submit Google Forms
- EF Core query composition ngoài việc gọi service

### Services

Sở hữu:

- business workflow
- credit và usage orchestration
- validation orchestration
- transaction boundary khi cần
- integration coordination

Services không được return framework-specific HTTP results.

### EF Core DbContext

Sở hữu:

- persistence access
- entity sets
- transaction integration
- schema changes có migration

Không giấu business decision trong DbContext.

### Entities

Entities biểu diễn persisted domain state.

Không được:

- gọi external API
- biết HTTP
- thực hiện Google Forms submission
- giấu business workflow

### DTOs

DTOs biểu diễn API request/response contracts.

Đổi DTO phải review API contract.

### Integration Services

Sở hữu external calls tới Google Forms, payment providers, AI providers hoặc future queues.

Deferred integrations không được gọi là production-complete.

## Boundary bắt buộc

- Google Forms integration không được trộn vào credit/account services.
- Credit deduction phải đi qua dedicated credit service.
- Credit changes phải ghi ledger entry.
- Tool usage phải ghi `UsageLogs`.
- Submission actions phải ghi `SubmissionLogs`.
- Nếu tool action fail sau credit deduction, refund behavior là Deferred và không được tự bịa.
