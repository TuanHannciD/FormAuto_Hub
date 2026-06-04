# TECH_STACK_DECISIONS

## Mục đích

Ghi lại công nghệ đã duyệt và các phần Deferred.

## Đã chốt

- Backend: ASP.NET Core Web API .NET 9.
- API style: controller-based REST API preferred for MVP.
- Database: SQL Server.
- ORM: Entity Framework Core.
- Migrations: EF Core migrations.
- Architecture style: simple service layer hoặc repository/service pattern.
- Frontend framework: Next.js web dashboard.
- Frontend UI baseline: shadcn/ui với Tailwind CSS.
- Frontend icon baseline: lucide-react.

## Deferred

- Flutter Web / Flutter Android.
- Authentication implementation details.
- JWT claim structure.
- Google OAuth.
- Official Google Forms API integration.
- Payment gateway integration.
- Background job framework.
- AI answer generation.
- AI mapping.
- lựa chọn AI provider và model cuối.
- Email notification provider.
- Webhook platform.
- Production deployment platform.

## Backend direction

- Ưu tiên controllers cho MVP.
- Controllers phải mỏng.
- Business logic đặt trong services.
- Persistence đặt trong EF Core `DbContext` và migrations.
- Dùng SQL Server làm persistence target.
- Không đưa microservices vào MVP.

## Background job direction

Background job processing là Deferred cho MVP.

Future options có thể gồm:

- ASP.NET Core `BackgroundService`
- Hangfire
- Quartz.NET
- queue-based worker

Chưa option nào được duyệt.

## AI provider direction

AI provider settings được duyệt cho planning Phase 6 như một vùng cấu hình database do admin quản lý.

Hướng đã duyệt cho worker:

- lưu provider API keys qua admin settings và encrypt trước khi persist
- validate provider và model không rỗng trước khi enable provider setting
- validate Base URL optional là absolute URL dùng `http` hoặc `https`
- không để normal-user generation requests phụ thuộc vào provider secrets
- dùng abstraction `Integrations.AI` cho provider-specific calls
- runtime mặc định phải fail-safe khi chưa cấu hình live provider adapter đã duyệt
- deterministic AI adapter chỉ được dùng cho local/test validation khi bật rõ bằng configuration
- OpenAI-compatible adapter chỉ được dùng khi runtime configuration bật rõ `AI:ProviderAdapter=OpenAICompatible`

Deferred:

- provider cuối
- model cuối
- lựa chọn provider SDK hoặc HTTP client library
- nguồn validate provider/model catalog khi live
- provider-specific SDK adapter ngoài OpenAI-compatible HTTP adapter đã duyệt
- raw audit retention infrastructure
- production background worker cho AI generation

## Frontend direction

Frontend framework đã được duyệt là Next.js web dashboard.

Frontend UI baseline đã được duyệt là shadcn/ui với Tailwind CSS cho dashboard/admin components.

Icon baseline đã được duyệt là lucide-react.

Frontend alternative đang Deferred:

- Flutter Web / Flutter Android

API contracts vẫn phải frontend-agnostic dù Next.js đã được duyệt.

## Quy tắc upgrade

Không đưa framework, provider, infrastructure hoặc library mới thành project commitment nếu chưa cập nhật cả `docs/ai` và `docs/vi`.
