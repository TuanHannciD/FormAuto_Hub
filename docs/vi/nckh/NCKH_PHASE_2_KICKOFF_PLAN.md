# NCKH_PHASE_2_KICKOFF_PLAN

## Mục đích

Xác định kế hoạch kickoff có gate approval cho NCKH Phase 2 để có thể giao việc theo từng pass hẹp, không tự bịa contract và không kéo scope rộng hơn.

Ghi chú closeout: Phase 2 hiện đã được implement và validate cho đúng scope backend-only đã duyệt. Dùng `NCKH_PHASE_2_CLOSEOUT.md` làm completion evidence hiện tại. Giữ kickoff plan này như context handoff lịch sử.

## Mục tiêu phase

Mở slice implementation đầu tiên sau Phase 1 cho module NCKH:

- tạo và quản lý `ResearchModel` theo user
- tạo và quản lý `ResearchVariable`
- tạo và quản lý `ObservedQuestionMapping`

Phase 2 là phase định nghĩa model. Phase này không phê duyệt canvas relation, Google Form write/update, response collection, normalization, export, credit, hoặc admin UI.

## Repo truth hiện tại

- NCKH Phase 1 đã hoàn tất cho scope đã duyệt.
- NCKH Phase 2 đã hoàn tất cho scope backend-only đã duyệt.
- Mặc định hiện không có NCKH implementation phase nào đang active.
- Phase 3 là phase đề xuất tiếp theo và vẫn cần approval rõ trước khi implementation.
- Repo evidence hiện tại cho thấy Google link của NCKH chỉ yêu cầu Forms read permission, chưa yêu cầu Google Sheets scope.

## Scope Phase 2 đã xác định

Trong scope của kickoff plan này:

- entity, migration, DbSet, service, controller, DTO, test cho `ResearchModel`
- entity, migration, DbSet, service, controller, DTO, test cho `ResearchVariable`
- entity, migration, DbSet, service, controller, DTO, test cho `ObservedQuestionMapping`
- boundary CRUD theo quyền sở hữu user cho 3 area trên
- rule validation cho variable code, type, scale và mapping ownership
- cho phép nhiều model trên một imported form, nhưng tối đa chỉ một model ở trạng thái `Active` trên mỗi imported form
- response list/detail có paging ở nơi bề mặt API là dạng list
- delivery của Phase 2 là backend-only

## Ngoài scope

Không được làm trong Phase 2:

- `ModelRelation` và `NodePosition`
- React Flow canvas
- Google Forms create/update
- Google Sheets response pull
- normalization hoặc dataset generation
- CSV/Excel/SPSS export
- credit deduction hoặc pricing
- NCKH admin UI
- background jobs, watches, hoặc Pub/Sub

## Gate vào phase

Trước khi bất kỳ implementation worker nào bắt đầu, phải xác nhận đủ các điểm sau:

1. User approve rõ việc mở NCKH Phase 2.
2. Đã xong contract review cho route, DTO, status, và lifecycle wording.
3. Đã xong DB risk review cho entity fields, FK, delete behavior, index, và migration reversibility.
4. `docs/ai/nckh` và `docs/vi/nckh` sẵn sàng giữ sync cho mọi thay đổi contract.
5. Công việc của Phase 2 không âm thầm kéo theo concern của Phase 3-8.

## Các quyết định đã duyệt

Các quyết định sau đã được duyệt cho planning của Phase 2:

1. Cardinality model trên imported form
   - Cho phép nhiều model trên một imported form.
   - Tối đa chỉ một model ở trạng thái `Active` trên mỗi imported form.

2. Độ sâu của Phase 2
   - Phase 2 đi backend-only trước.

3. Hướng contract của mapping
   - `ObservedQuestionMapping` được xử lý bằng endpoint riêng, không đi theo payload nested của variable create/update.

4. Hướng lifecycle
   - Phase 2 phải hỗ trợ `Draft` làm trạng thái mặc định và tối thiểu.
   - Phase 2 đồng thời hỗ trợ transition rõ ràng `Draft -> Active`.
   - `Archived` nằm ngoài scope của Phase 2.

5. Hướng xử lý xóa model
   - Cho phép xóa model trong Phase 2.
   - Implementation phải rà soát constraint và dependency tới các bảng ngoài nhánh cascade do model sở hữu trước khi chốt delete behavior.
   - Nếu sau này có frontend delete flow, UI phải dùng dialog xác nhận theo style chung, tóm tắt dữ liệu nào bị ảnh hưởng, hiển thị số lượng bản ghi bị ảnh hưởng ở mức gần đúng, và yêu cầu user nhập đúng tên model trước khi xác nhận xóa.

## Contract guardrails

- Không tự bịa status mới ngoài các lifecycle value của `ResearchModel` đã được duyệt.
- Không tự bịa variable type hoặc scale type mới ngoài tập đã ghi trong doc nếu chưa được approve riêng.
- Không để NCKH entities rò sang module automation, credit, hoặc payment của FormAuto Hub.
- Không để Google Forms re-import phá hủy mapping.
- Không thêm Google Sheets scope hoặc write scope vào Phase 2.
- Không gộp mapping trở lại vào nested payload của variable.
- Không coi dialog xác nhận xóa trong tương lai là scope frontend của Phase 2.
- Không coi API example đang proposed là final nếu chưa review.

## Database guardrails

- `ResearchModel -> ResearchVariable` dùng cascade delete.
- `ResearchVariable -> ObservedQuestionMapping` dùng cascade delete.
- `ObservedQuestionMapping -> ResearchFormQuestion` dùng `DeleteBehavior.Restrict`.
- `ResearchModel.FormId` phải cho phép nhiều model trên một form nhưng vẫn enforce tối đa một model `Active` trên mỗi form.
- Unique của variable code phải được enforce ở mức database theo từng model.
- Unique của mapping phải được enforce cho cả `(VariableId, FormQuestionId)` và `(VariableId, ObservedCode)`.
- Delete behavior phải được review với các bảng phụ thuộc ngoài nhánh sở hữu trước khi chốt delete contract.
- Migration phải reversible và không được làm thay đổi behavior của Google token hoặc form import ở Phase 1.

## Các pass delivery được đề xuất

### Pass 0 - Khóa contract và DB

Mục tiêu:

- resolve các approval point bên trên
- khóa entity set, lifecycle, route surface, và DB rules được phép dùng

Đầu ra mong đợi:

- note scope Phase 2 đã được duyệt
- checklist entity/route đã được duyệt
- decision log rõ cho activation flow đã được duyệt

Bộ skill khuyến nghị:

- `formauto-contract-guard`
- `formauto-db-risk-reviewer`
- `formauto-delivery-planner`

### Pass 1 - Nền persistence

Mục tiêu:

- thêm entity và EF Core configuration cho Phase 2 mà không kéo sang behavior phase sau

Vùng file được phép:

- `src/FormAutoHub.Api/Entities/Nckh/`
- `src/FormAutoHub.Api/Data/FormAutoHubDbContext.cs`
- `src/FormAutoHub.Api/Data/Migrations/`
- `tests/FormAutoHub.Tests/`

Đầu ra mong đợi:

- `ResearchModel`
- `ResearchVariable`
- `ObservedQuestionMapping`
- thêm DbSet
- rule trong `OnModelCreating`
- migration
- test cho entity/migration nếu phù hợp

Điều kiện dừng:

- lifecycle values chưa rõ
- migration đòi hỏi field của Phase 3 mới hợp lý
- delete behavior tới các bảng không thuộc ownership của model vẫn chưa rõ sau khi review FK

### Pass 2 - ResearchModel API

Mục tiêu:

- implement create/list/detail/update/delete cho model theo user

Vùng file được phép:

- `src/FormAutoHub.Api/Contracts/`
- `src/FormAutoHub.Api/Controllers/Nckh/`
- `src/FormAutoHub.Api/Services/Nckh/`
- `tests/FormAutoHub.Tests/`

Đầu ra mong đợi:

- model DTO
- workflow service cho ownership check, multi-model-per-form, và single-active-model enforcement
- controller route dưới `/api/v1/nckh/models`
- test cho validation, ownership, duplicate form usage, và delete behavior

Điều kiện dừng:

- contract review phát hiện route shape xung đột với hướng mapping đã approve
- lifecycle của model không thể implement nếu chưa kéo rule relation/data của phase sau

### Pass 3 - ResearchVariable API

Mục tiêu:

- implement variable CRUD trong một model với validation cho code/type/scale

Đầu ra mong đợi:

- variable DTO
- validation trong service cho duplicate code, tổ hợp scale/type hợp lệ, và archived-model guard
- test cho payload scale không hợp lệ và duplicate code

Điều kiện dừng:

- rule bắt buộc cho `scalePoint`, `minValue`, và `maxValue` vẫn còn mơ hồ

### Pass 4 - Mapping API

Mục tiêu:

- implement create, update, list, delete cho question-to-variable mapping mà không kéo relation/canvas/data logic vào

Đầu ra mong đợi:

- mapping DTO và mapping endpoint riêng
- validation ownership xuyên suốt user -> model -> variable -> imported form question
- test cho duplicate observed code, mapping sai model, và các assumption liên quan question delete bị restrict

Điều kiện dừng:

- mapping shape chưa được approve
- implementation đòi hỏi phải viết lại logic form re-import ngoài Phase 2

### Pass 5 - Frontend follow-up được defer

Mục tiêu:

- ghi nhận requirement UX đã được duyệt cho việc xác nhận xóa ở phase frontend sau này, nhưng không implement frontend trong Phase 2

Đầu ra mong đợi:

- giữ nguyên backend-only scope cho Phase 2
- có requirement được document cho delete-impact summary và exact-name confirmation dialog ở phase frontend sau

Điều kiện dừng:

- bất kỳ nỗ lực nào implement frontend trong Phase 2 khi chưa có approval riêng

### Pass 6 - Validation và closeout prep

Mục tiêu:

- verify trung thực slice Phase 2 đã approve trước khi claim closeout

Mức validation tối thiểu:

- `dotnet build FormAutoHub.sln -c Release`
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build`
- `npm run build` trong `apps/web` nếu có sửa frontend
- validation cho migration add/apply khi có thay đổi schema
- authenticated HTTP smoke cho route đã đổi
- inspect log sau smoke check

## Định tuyến sub-agent được đề xuất

Skill overlay của repo đang khả dụng cho công việc này. Định tuyến khuyến nghị:

1. Worker planning/approval
   - primary: `formauto-delivery-planner`
   - add: `formauto-contract-guard`, `formauto-db-risk-reviewer`

2. Worker backend persistence
   - primary: `formauto-implementation-worker`
   - add: `formauto-contract-guard`

3. Worker backend API
   - primary: `formauto-implementation-worker`
   - add: `formauto-contract-guard`

4. Worker review cuối
   - primary: `formauto-reviewer`
   - add: `formauto-contract-guard`

## Prompt handoff sẵn cho worker

### Worker A - Khóa contract/DB

"Review riêng NCKH Phase 2. Không viết production code. Xác nhận entity set, lifecycle values bao gồm transition `Draft -> Active` đã được duyệt, route surface, delete behaviors, index, và mọi approval gap còn lại cho `ResearchModel`, `ResearchVariable`, `ObservedQuestionMapping`. Tách rõ Confirmed, Proposed, Assumption, Deferred, và Approval Needed."

### Worker B - Nền persistence

"Chỉ implement NCKH Phase 2 Pass 1 persistence foundation cho `ResearchModel`, `ResearchVariable`, và `ObservedQuestionMapping` trong solution FormAuto Hub hiện tại. Không thêm controller, Google Sheets, relation, canvas, export, hoặc frontend behavior. Tôn trọng delete behavior và uniqueness rules đã được duyệt. Chỉ thêm hoặc cập nhật test cho persistence slice này."

### Worker C - Model API

"Chỉ implement NCKH Phase 2 Pass 2 model CRUD dưới `/api/v1/nckh/models`. Enforce user ownership và rule uniqueness form-to-model đã được duyệt. Không thêm variable, relation, data, export, hoặc frontend work ngoài phần bắt buộc cho API slice này. Thêm route/service/test cho validation và ownership errors."

### Worker D - Variable và Mapping API

"Chỉ implement NCKH Phase 2 Pass 3-4 cho `ResearchVariable` và `ObservedQuestionMapping`. Giữ scope đúng CRUD, validation, và test đã được duyệt. Không thêm relation của Phase 3, Google write/update, data collection, normalization, export, hoặc credit behavior."

### Worker E - Review

"Review slice NCKH Phase 2 về scope discipline, contract safety, migration risk, delete behavior correctness, test honesty, và docs sync. Ưu tiên findings. Nếu không có findings, nêu residual risks và validation gaps."

## Các doc cần sync khi mở Phase 2

Nếu implementation được approve, phải giữ sync các file sau:

- `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/vi/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/vi/nckh/NCKH_PHASE_ROADMAP.md`
- các doc contract/entity theo phase nếu bề mặt đã duyệt thay đổi

Không được đánh dấu Phase 2 completed chỉ dựa vào wording trong roadmap.

## Deferred

- mọi behavior của Phase 3-8
- Google Sheets API response pull
- Google Forms write scope
- canvas/node position persistence
- normalization/export
- credit/pricing
- NCKH admin UI
