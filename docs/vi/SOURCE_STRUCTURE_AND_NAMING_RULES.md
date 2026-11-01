# SOURCE_STRUCTURE_AND_NAMING_RULES

## Mục đích

Định nghĩa quy tắc đặt source và naming cho repository đã có implementation.

## Trạng thái repo

API đã triển khai trong `src/FormAutoHub.Api`, kiểm thử backend trong `tests/FormAutoHub.Tests`, dashboard Next.js trong `apps/web`. Quy tắc áp dụng cho source hiện tại và thay đổi được duyệt sau này.

## Cấu trúc backend dự kiến

Cấu trúc backend hiện tại:

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

Mở rộng cấu trúc hiện tại trong phạm vi được duyệt; không tự thiết kế lại.

## Quy tắc naming

- Controllers: `<Module>Controller`.
- Services: `<Module>Service` hoặc tên cụ thể như `CreditService`.
- DTOs: `<Action>Request`, `<Action>Response`, hoặc `<Entity>Dto`.
- Entities: tên domain số ít như `User`, `TopupOrder`, `UsageLog`.
- Integration services: tên theo provider như `GoogleFormsAnalyzer`.
- AI provider adapters nên đặt theo provider dưới `Integrations/AI` hoặc folder AI integration tương đương đã review cho scope Phase 6 đã duyệt và hoàn thành.

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
- Frontend Next.js files phải theo convention chuẩn của Next.js như `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, và component colocated dùng PascalCase filename. Không tạo frontend files trước khi có task frontend implementation được duyệt.

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

## File map và cách đọc source

- Không áp trần dòng cứng. Chỉ tách khi có trách nhiệm/reuse độc lập hoặc vấn đề điều hướng rõ; không chia transaction/lifecycle chỉ để giảm dòng. Shared UI giữ tại `apps/web/components/`; code local feature colocate với page (`_components/`, `_hooks.ts`, `_helpers.ts`, `_types.ts`, `_constants.ts`) khi có lý do, không tạo scaffolding rỗng.
- Giữ ngưỡng map hiện tại: file C# và TS/TSX viết tay trên 500 dòng vật lý được giữ chung cần map ngắn sau directive/import bắt buộc. Liệt kê symbol/trách nhiệm lớn và invariant; tìm symbol trong source hiện tại. Số dòng viết tay là gợi ý tùy chọn, không là địa chỉ chuẩn. Không sửa migration/snapshot sinh tự động, lockfile hoặc gói vendor để thỏa map.
- Module README hữu ích khi cây thư mục chưa đủ: điểm vào, ownership, dependency/data flow và test liên quan. Không tạo README cho mọi folder nhỏ hoặc chép contract nghiệp vụ vào đó.
- Bắt đầu từ hành vi đã duyệt và module/contract, tìm path/symbol bằng `rg`, đọc map/outline nếu có. Đọc đầy đủ function/component ảnh hưởng, gồm type/state, nhánh lỗi và cleanup. Theo DI registration, import/caller/consumer và test; mở rộng khi đổi shared, state, contract hoặc boundary. Không dùng chunk cố định làm mất invariant.
- Map thiếu/cũ không chặn khảo sát: tìm symbol hiện tại, ghi nợ điều hướng, cập nhật map trong scope khi đổi cấu trúc. Không refactor source ngoài task tài liệu. Review toàn diff/tác động liên quan, không chỉ map hoặc vài dòng chọn lọc.
- Quy tắc này không chứng nhận AST/LSP/map checker đã cài. Package checker chỉ kiểm đóng gói/mirror, không chứng minh map source hoặc cách Agent đọc.
