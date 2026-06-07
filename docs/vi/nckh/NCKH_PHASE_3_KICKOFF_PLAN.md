# NCKH_PHASE_3_KICKOFF_PLAN

## Mục đích

Định nghĩa kế hoạch kickoff có approval gate cho NCKH Phase 3 để phần Canvas Quan hệ & Giả thuyết đi theo cùng quy trình kiểm soát đã dùng cho NCKH Phase 2.

Tài liệu này là artifact planning và handoff. Nó không đánh dấu Phase 3 là đã implement hoặc completed.

## Mục tiêu phase

Mở slice implementation tiếp theo sau Phase 2 cho module NCKH:

- tạo và quản lý quan hệ giữa các research variables trong model
- lưu và tải vị trí node trên canvas để chỉnh sửa model
- sinh mã và nội dung giả thuyết theo cách deterministic từ dữ liệu variable/relation đã duyệt

Phase 3 là phase canvas-and-relation. Phase này không duyệt Google Forms write/update, thu thập response từ Google Sheets, normalization, export, credit, pricing, admin UI, phân tích thống kê, hoặc AI-generated hypothesis text.

## Repo truth hiện tại

- NCKH Phase 1 đã completed cho scope OAuth và Google Forms read/import đã duyệt.
- NCKH Phase 2 đã completed cho scope backend-only model, variable, và mapping đã duyệt.
- Phase 3 là phase NCKH đề xuất tiếp theo.
- Implementation Phase 3 vẫn cần approval gate cho đến khi contract review và DB risk review hoàn tất.
- Closeout evidence Phase 2 là baseline dependency cho mọi planning Phase 3.
- Review Pass 0 contract và database freeze được ghi trong `NCKH_PHASE_3_CONTRACT_DB_FREEZE.md`.

## Scope Phase 3 đề xuất

Trong scope của kickoff plan này:

- entity, migration, DbSet, service, controller, DTO, và tests cho `ModelRelation`
- entity, migration, DbSet, service, controller, DTO, và tests cho `NodePosition`
- boundary CRUD theo user ownership cho model relations
- lưu/tải node positions cho variables và relation canvas nodes nếu được duyệt trong contract freeze
- validation relation cho ownership, cùng model, duplicate relation, và self-relation
- sinh hypothesis code/text deterministic từ relation và variable metadata đã duyệt
- backend-first delivery trừ khi frontend work được duyệt riêng sau khi backend contracts đã freeze

## Ngoài scope

Không được làm trong Phase 3:

- AI-generated hypothesis text
- phân tích thống kê
- Google Forms create/update
- Google Sheets response pull
- thu thập response
- normalization hoặc dataset generation
- CSV/Excel/SPSS export
- trừ credit hoặc pricing
- NCKH admin UI
- background jobs, watches, hoặc Pub/Sub
- React Flow frontend implementation trước khi backend contracts được duyệt
- hành vi destructive với Google Form

## Entry gates

Trước khi bất kỳ implementation worker nào bắt đầu, phải xác nhận đủ các điểm sau:

1. User approve rõ việc mở implementation NCKH Phase 3.
2. Contract review đã hoàn tất cho routes, DTOs, relation types, tương tác lifecycle/status được phép, và wording output giả thuyết.
3. DB risk review đã hoàn tất cho entity fields, FKs, delete behavior, indexes, uniqueness, và migration reversibility.
4. Phase 3 không âm thầm kéo scope Phase 4-8 vào.
5. `docs/ai/nckh` và `docs/vi/nckh` được giữ synced cho mọi thay đổi contract hoặc phase-state.

## Quyết định cần freeze trước khi code

Các điểm sau phải được xác nhận trước implementation:

1. Hình dạng relation
   - Proposed: relation thuộc về một `ResearchModel`.
   - Proposed: relation nối một source `ResearchVariable` với một target `ResearchVariable` trong cùng model.
   - Approval needed: danh sách giá trị relation type và display label được phép.

2. Duplicate và self-relation behavior
   - Approval needed: có reject `sourceVariableId == targetVariableId` hay không.
   - Approval needed: có reject duplicate source-target-type combinations hay không.
   - Approval needed: inverse relations có được xem là duplicate hay không.

3. Constraint theo trạng thái model
   - Approval needed: relations và node positions chỉ được sửa khi model `Draft`, hay cũng được sửa khi `Active`.
   - Deferred: mọi hành vi `Archived` cho đến khi một phase lifecycle tương lai duyệt.

4. Ownership của node position
   - Proposed: node positions thuộc về một `ResearchModel`.
   - Approval needed: positions chỉ lưu cho variables hay cả relation/hypothesis nodes.
   - Approval needed: coordinate precision và bounds validation.

5. Sinh giả thuyết
   - Proposed: chỉ deterministic, dùng relation order/type và variable names/codes.
   - Deferred: AI-generated hypothesis text.
   - Approval needed: template text và format code chính xác.

6. Delete behavior
   - Approval needed: cascade hoặc restrict behavior khi xóa variable có relations.
   - Approval needed: delete behavior cho node positions khi variables hoặc models bị xóa.
   - Phải review lại delete behavior Phase 2 trước khi làm migration.

## Contract guardrails

- Không xem proposed relation fields hoặc route examples là final cho đến khi contract review hoàn tất.
- Không invent lifecycle statuses ngoài model states `Draft` và `Active` đã duyệt.
- Không thêm behavior `Archived` trong Phase 3.
- Không biến hypothesis generation thành AI-backed.
- Không bắt canvas save/load phụ thuộc frontend implementation trong Phase 3 nếu chưa được approve rõ.
- Không thêm Google Forms write scope, Google Sheets scope, export behavior, hoặc credit behavior.

## Database guardrails

- Migration Phase 3 phải reversible.
- Bảng mới không được thay đổi behavior Google token/import của Phase 1.
- Bảng mới không được thay đổi semantics model, variable, mapping của Phase 2 trừ FK/delete behavior đã review.
- Relations phải enforce user ownership qua chuỗi ownership model/variable.
- Indexes phải hỗ trợ lookup relation và node-position theo model.
- Uniqueness rules phải rõ trước khi generate migration.

## Delivery passes đề xuất

### Pass 0 - Contract And DB Freeze

Mục tiêu:

- khóa entities, route surface, relation rules, node-position rules, hypothesis output rules, và DB behavior được phép

Expected outputs:

- approved Phase 3 scope note
- checklist entity và route đã duyệt
- decision log rõ cho relation types, duplicate behavior, self-relation behavior, và delete behavior

Skill mix khuyến nghị:

- `formauto-contract-guard`
- `formauto-db-risk-reviewer`
- `formauto-delivery-planner`

### Pass 1 - Persistence Foundation

Mục tiêu:

- thêm entities Phase 3 và EF Core configuration mà không mở rộng sang behavior phase sau
- dùng `NCKH_PHASE_3_CONTRACT_DB_FREEZE.md` làm baseline contract và DB

Vùng file được phép:

- `src/FormAutoHub.Api/Entities/Nckh/`
- `src/FormAutoHub.Api/Data/FormAutoHubDbContext.cs`
- `src/FormAutoHub.Api/Data/Migrations/`
- `tests/FormAutoHub.Tests/`

Expected outputs:

- `ModelRelation`
- `NodePosition`
- DbSet additions
- `OnModelCreating` rules
- migration
- entity/migration tests khi phù hợp

Stop conditions:

- relation types chưa được duyệt
- delete behavior chưa rõ
- ownership node position hoặc coordinate rules chưa rõ
- migration cần fields của Phase 4-8 mới có nghĩa

### Pass 2 - Relation API

Mục tiêu:

- implement create/list/detail/update/delete cho model relations thuộc user

Vùng file được phép:

- `src/FormAutoHub.Api/Contracts/`
- `src/FormAutoHub.Api/Controllers/Nckh/`
- `src/FormAutoHub.Api/Services/Nckh/`
- `tests/FormAutoHub.Tests/`

Expected outputs:

- relation DTOs
- service workflow cho ownership checks và same-model variable validation
- controller routes dưới NCKH route prefix đã duyệt
- tests cho duplicate relation, self-relation, cross-model variable, và ownership errors

Stop conditions:

- route shape chưa được duyệt
- relation validation phụ thuộc future data-collection rules
- implementation cần statistical analysis hoặc AI behavior

### Pass 3 - Node Position API

Mục tiêu:

- implement save/load behavior cho node positions trong owned model

Expected outputs:

- node-position DTOs
- bulk upsert hoặc replace behavior chỉ khi được duyệt trong contract freeze
- tests cho ownership, invalid node references, và coordinate validation

Stop conditions:

- node identity rules chưa rõ
- React Flow payload frontend-specific bị xem là final khi chưa approve

### Pass 4 - Deterministic Hypothesis Output

Mục tiêu:

- expose deterministic hypothesis code/text output từ relation và variable data đã duyệt

Expected outputs:

- service logic chỉ dùng template đã duyệt
- tests cho repeatable output
- không có AI provider calls

Stop conditions:

- template wording giả thuyết chưa được duyệt
- request cố thêm AI-generated text
- request cố thêm statistical inference

### Pass 5 - Deferred Frontend Follow-Up

Mục tiêu:

- ghi nhận dependency frontend nhưng không implement React Flow nếu chưa được duyệt riêng

Expected outputs:

- giữ scope backend-first cho Phase 3
- frontend handoff được document cho slice đã duyệt sau này

Stop conditions:

- bất kỳ nỗ lực implement frontend trong Phase 3 khi chưa có approval rõ

### Pass 6 - Validation And Closeout Prep

Mục tiêu:

- verify đúng slice Phase 3 đã duyệt trước khi claim closeout

Validation tối thiểu:

- `dotnet build FormAutoHub.sln -c Release`
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release`
- `dotnet ef database update` trong development database mục tiêu nếu có migration mới
- authenticated HTTP smoke cho routes thay đổi
- inspect logs sau smoke checks
- `npm run build` và browser smoke chỉ khi frontend files thay đổi

## Sub-agent routing đề xuất

1. Planning/approval worker
   - primary: `formauto-delivery-planner`
   - add: `formauto-contract-guard`, `formauto-db-risk-reviewer`

2. Backend persistence worker
   - primary: `formauto-implementation-worker`
   - add: `formauto-contract-guard`

3. Backend API worker
   - primary: `formauto-implementation-worker`
   - add: `formauto-contract-guard`

4. Final review worker
   - primary: `formauto-reviewer`
   - add: `formauto-contract-guard`, `formauto-db-risk-reviewer`

## Worker-ready handoff prompts

### Worker A - Contract/DB Freeze

"Review NCKH Phase 3 only. Do not write production code. Confirm the allowed entity set, relation types, route surface, node-position behavior, deterministic hypothesis output, delete behavior, indexes, and remaining approval gaps for `ModelRelation` and `NodePosition`. Separate Confirmed, Proposed, Assumption, Deferred, and Approval Needed."

### Worker B - Persistence Foundation

"Implement only NCKH Phase 3 Pass 1 persistence foundation for approved `ModelRelation` and `NodePosition` behavior inside the existing FormAuto Hub solution. Do not add controllers, React Flow UI, Google Forms write/update, Google Sheets, data collection, normalization, export, credit, statistical analysis, or AI behavior. Respect approved delete behaviors and uniqueness rules. Add or update tests only for this persistence slice."

### Worker C - Relation API

"Implement only NCKH Phase 3 relation CRUD under the approved `/api/v1/nckh` route surface. Enforce user ownership, same-model variable constraints, approved duplicate/self-relation behavior, and approved model-status constraints. Do not add node-position UI, Google integration, data collection, export, credit, statistical analysis, or AI behavior. Add focused service/controller/tests."

### Worker D - Node Position And Hypothesis API

"Implement only approved NCKH Phase 3 node-position save/load behavior and deterministic hypothesis output. Keep the output template rule-based and repeatable. Do not add React Flow frontend, AI provider calls, statistical analysis, Google Forms write/update, Google Sheets, response collection, normalization, or export. Add focused tests and runtime smoke coverage."

### Worker E - Review

"Review the NCKH Phase 3 slice for scope discipline, contract safety, migration risk, delete behavior correctness, ownership enforcement, deterministic hypothesis behavior, validation honesty, and docs sync. Lead with findings. If no findings exist, state residual risks and validation gaps."

## Documentation sync cần khi mở Phase 3

Nếu implementation được approve, giữ các file này synced:

- `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/vi/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/vi/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/ai/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/vi/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- docs contract/entity theo phase nếu surface được duyệt thay đổi

Không đánh dấu Phase 3 completed chỉ từ wording kickoff.

## Deferred

- Bất kỳ behavior Phase 4-8 nào
- AI-generated hypothesis text
- phân tích thống kê
- Google Sheets API response pull
- Google Forms write scope
- thu thập response
- normalization/export
- credit/pricing
- NCKH admin UI
- production-readiness claims khi chưa có runtime validation hiện tại
