# SOURCE_STRUCTURE_AND_NAMING_RULES

## Mục đích

Định nghĩa quy tắc đặt source và naming trước khi có implementation.

## Trạng thái repo

Production source structure chưa được duyệt. Các quy tắc này chỉ định hướng cho lần scaffold sau này.

## Cấu trúc backend dự kiến

Khi backend code được duyệt, có thể dùng cấu trúc ASP.NET Core Web API rõ ràng như:

```text
src/
  FormAutoHub.Api/
    Controllers/
    Contracts/
    Services/
    Entities/
    Data/
    Integrations/
    Configuration/
tests/
  FormAutoHub.Tests/
```

Đây là cấu trúc đề xuất, chưa phải contract bất biến.

## Quy tắc naming

- Controllers: `<Module>Controller`.
- Services: `<Module>Service` hoặc tên cụ thể như `CreditService`.
- DTOs: `<Action>Request`, `<Action>Response`, hoặc `<Entity>Dto`.
- Entities: tên domain số ít như `User`, `TopupOrder`, `UsageLog`.
- Integration services: tên theo provider như `GoogleFormsAnalyzer`.
- AI provider adapters nên đặt theo provider dưới `Integrations/AI` hoặc folder AI integration tương đương đã review khi Phase 6 implementation được duyệt.

## Quy tắc đặt tên file

- Mỗi file C# nên có một public type chính, và tên file phải khớp tên type đó.
- Controllers dùng `<Module>Controller.cs`, ví dụ `TopupOrdersController.cs`.
- Services dùng `<Module>Service.cs` hoặc tên workflow cụ thể như `CreditService.cs`.
- Entity files dùng tên domain số ít, ví dụ `User.cs`, `TopupOrder.cs`, và `UsageLog.cs`.
- API contract và DTO files đặt trong `Contracts/`. Chỉ gom DTO theo feature khi các DTO nhỏ và liên quan chặt với nhau, ví dụ `Phase2Dtos.cs`; nếu không, tách theo workflow với dạng `<Workflow>Dtos.cs`.
- Domain constant files dùng tên tập giá trị số nhiều, ví dụ `TopupOrderStatuses.cs`, `CreditTransactionTypes.cs`, `UsageLogStatuses.cs`, và `UserRoles.cs`.
- AI domain constant files nên dùng tên tập giá trị số nhiều, ví dụ `AiGenerationRunStatuses.cs`, sau khi contract review duyệt values.
- EF Core context files dùng đúng tên context type, ví dụ `FormAutoHubDbContext.cs`.
- EF Core migration files phải giữ format timestamp và migration name do EF tạo: `<yyyyMMddHHmmss>_<MigrationName>.cs`, `<yyyyMMddHHmmss>_<MigrationName>.Designer.cs`, và `FormAutoHubDbContextModelSnapshot.cs`.
- Mapping helpers phải scope theo feature và đặt tên theo feature, ví dụ `Phase2Mappings.cs`; không tạo file chung kiểu `Mapper.cs`, `Helpers.cs`, hoặc `Utils.cs` nếu chưa có reuse thật.
- Test files dùng `<Subject>Tests.cs`, ví dụ `FoundationTests.cs` hoặc `Phase2TopupApprovalTests.cs`.
- Project và solution files giữ tên product/project: `FormAutoHub.Api.csproj`, `FormAutoHub.Tests.csproj`, và `FormAutoHub.sln`.
- Frontend Next.js files trong tương lai phải theo convention chuẩn của Next.js như `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, và component colocated dùng PascalCase filename. Không tạo frontend files trước khi có task frontend implementation được duyệt.

## Quy tắc placement

- API contracts và DTOs đặt trong `Contracts/`.
- Business logic đặt ở services.
- EF Core persistence đặt trong `Data` và entity configuration.
- External provider calls đặt trong `Integrations`.
- AI provider calls đặt trong `Integrations/AI` hoặc boundary AI integration đã review; không đặt trong controllers, credit services, hoặc frontend code.
- AI provider settings, prompt profiles, và AI generation audit entities chỉ đặt trong `Entities/` và EF Core `Data/` sau DB review.
- Shared code chỉ tạo khi có reuse thật.
- Chỉ tạo frontend folders khi task duyệt rõ frontend implementation, và phải theo hướng Next.js web dashboard đã được duyệt.
- Shared frontend UI components đặt dưới `apps/web/components/`. Trước khi thêm UI local trong page, phải kiểm tra folder này và dùng lại component có sẵn. Nếu một pattern cần nhất quán toàn dự án, hãy update hoặc tạo shared component thay vì duplicate riêng cho từng page.

## Các chuyển ownership bị cấm

- Không tạo hoặc thay đổi cam kết kiến trúc frontend qua folder name.
- Không giấu business logic trong controllers.
- Không giấu credit ledger behavior trong helper chung.
- Không đưa Google Forms provider behavior vào account hoặc credit modules.
- Không đưa AI provider API keys, provider calls, raw provider payload handling, hoặc prompt/output validation vào frontend-only code.
- Không đặt AI credit multiplier logic ngoài credit/generation service boundary đã được contract review duyệt.
- Không tạo microservice boundary trong MVP.
