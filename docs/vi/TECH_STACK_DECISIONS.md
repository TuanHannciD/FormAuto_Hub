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

## Frontend direction

Frontend framework đã được duyệt là Next.js web dashboard.

Frontend UI baseline đã được duyệt là shadcn/ui với Tailwind CSS cho dashboard/admin components.

Icon baseline đã được duyệt là lucide-react.

Frontend alternative đang Deferred:

- Flutter Web / Flutter Android

API contracts vẫn phải frontend-agnostic dù Next.js đã được duyệt.

## Quy tắc upgrade

Không đưa framework, provider, infrastructure hoặc library mới thành project commitment nếu chưa cập nhật cả `docs/ai` và `docs/vi`.
