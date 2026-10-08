# NCKH_ARCHITECTURE_BOUNDARIES

## Mục đích

Định nghĩa trách nhiệm từng tầng và các hành vi sở hữu bị cấm cho NCKH Survey Module.

## Hướng kiến trúc đã xác nhận

- Backend: ASP.NET Core Web API .NET 9 (dùng chung solution FormAuto Hub)
- Kiểu API: controller-based REST API
- Database: SQL Server (dùng chung database FormAuto Hub)
- ORM: Entity Framework Core với migration
- Frontend: Next.js web dashboard (dùng chung apps/web)
- UI framework: shadcn/ui + Tailwind CSS
- Auth: JWT access tokens (tái sử dụng Auth FormAuto Hub)

## Trách nhiệm từng tầng

### Controllers (NCKH)

Sở hữu: route binding, DTO input/output, HTTP status, [Authorize]
Không sở hữu: gọi Google API, logic chuẩn hóa, sinh file export, truy vấn EF Core phức tạp

### Services (NCKH)

Sở hữu: quy trình nghiệp vụ, điều phối Google API, engine chuẩn hóa, sinh file export, tự sinh giả thuyết, transaction
Không trả về: kết quả HTTP cụ thể của framework

### EF Core DbContext

Sở hữu: entity sets NCKH (10 entity), migration schema, transaction
Không chứa: quyết định nghiệp vụ

### Entities (NCKH)

Sở hữu: trạng thái miền đã lưu
Không được: gọi Google API, biết về HTTP, thực hiện I/O file

### DTOs (NCKH)

Sở hữu: hợp đồng request/response API

### Dịch vụ tích hợp (NCKH)

Sở hữu: gọi ngoài đến Google Forms API, Sheets API, OAuth
Tạm hoãn: Google Forms watches, Pub/Sub, background jobs

## Ranh giới bắt buộc

- Tích hợp Google Forms không được trộn vào dịch vụ model/biến.
- Chuẩn hóa dữ liệu phải qua DataNormalization, không phải DataCollection.
- Sinh file export không được phụ thuộc vào trạng thái Google API.
- Token Google OAuth phải mã hóa khi lưu, không bao giờ lộ trong DTO.
- Khóa/bí mật Google API không được lưu trong config quản lý bởi source control.
- Entity NCKH không được rò rỉ vào controller/dịch vụ FormAuto Hub.
- Entity FormAuto Hub (CreditTransactions, UsageLogs, SubmissionJobs) không được rò rỉ vào NCKH.

## Ranh giới NCKH-FormAuto Hub

```
FormAuto Hub                    NCKH Module
─────────────────────────────────────────────
Auth (dùng chung)      ───►    NCKH Controllers
Users (dùng chung)     ───►    NCKH Services
UserExternalLogins     ───►    NCKH Entities
                                NCKH Migrations
                                Google Integrations
                                Export Engine
```

Dùng chung: Auth, Users, UserExternalLogins, JWT pipeline, DbContext (mở rộng).
Tách biệt: Tất cả entity, service, controller, DTO, migration NCKH.
Cấm: Code NCKH trong dịch vụ FormAuto Hub; entity FormAuto Hub trong dịch vụ NCKH.

## Tích hợp tạm hoãn

- Google Forms watches / Cloud Pub/Sub
- Background job framework (thu thập theo lịch)
- AI sinh giả thuyết
- Đồng bộ dữ liệu real-time
- Tích hợp thanh toán/credit cho NCKH

## Cấu hình DbContext bắt buộc

| Entity | FK | DeleteBehavior | Lý do |
|---|---|---|---|
| ObservedQuestionMappings | FormQuestionId → ResearchFormQuestions | Restrict | Tránh mất mapping khi nhập lại form |
| ModelRelations | FromVariableId → ResearchVariables | Restrict | Hai FK cùng trỏ bảng biến |
| ModelRelations | ToVariableId → ResearchVariables | Restrict | Hai FK cùng trỏ bảng biến |
| ModelRelations | ModelId → ResearchModels | Cascade | Xóa model xóa quan hệ |
| ResearchVariables | ModelId → ResearchModels | Cascade | Xóa model xóa biến |
| ObservedQuestionMappings | VariableId → ResearchVariables | Cascade | Xóa biến xóa mapping |
| NodePositions | VariableId → ResearchVariables | Restrict / NoAction | Tránh nhiều đường cascade SQL Server; service dọn vị trí trước khi xóa biến |
| NodePositions | RelationId → ModelRelations | Cascade | Xóa quan hệ xóa vị trí |

Hai FK của ModelRelations phải cấu hình rõ bằng `HasForeignKey()` trong `OnModelCreating`. CHECK constraint của NodePositions chỉ cho một trong VariableId/RelationId có giá trị. Phase 3 dùng restrict/no-action trên NodePositions.ModelId và VariableId; việc dọn dữ liệu không thể cascade an toàn thuộc service.

## Namespace và persistence

- Entity: `FormAutoHub.Api.Entities.Nckh`; service: `FormAutoHub.Api.Services.Nckh`.
- Controller: `FormAutoHub.Api.Controllers.Nckh`, route `/api/v1/nckh`.
- DTO hiện nằm trong `FormAutoHub.Api.Contracts`; tích hợp Google: `FormAutoHub.Api.Integrations.Google`.
- Dùng chung `FormAutoHubDbContext`, database và folder `Data/Migrations/`; tên migration `NckhPhase{number}_{Description}`.
- Migration NCKH phụ thuộc migration FormAuto Hub trước đó; đồng bộ migration hiện tại trước khi tạo migration mới.
- Deferred: `NckhDbContext` riêng nếu sau này có database riêng.

## Toàn vẹn dữ liệu hiện tại

- Xóa model dùng EF cascade, bao gồm SurveyResponses và NormalizedDatasets thuộc model. Không claim giữ lại dữ liệu: `ResearchModelService.DeleteModelAsync` và `FormAutoHubDbContext` quyết định hành vi hiện tại.
- Sửa biến khi có dữ liệu đánh dấu `NormalizedDatasets.IsStale = true`, cần chuẩn hóa lại.
- Chỉ `Draft` và `Active` đã triển khai; `Archived` chưa phải trạng thái lifecycle đã implement.
