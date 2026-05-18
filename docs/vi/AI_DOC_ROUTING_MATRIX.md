# AI_DOC_ROUTING_MATRIX

## Mục đích

Định tuyến tài liệu tối thiểu cần đọc trước khi AI lập kế hoạch, viết code, review hoặc sửa tài liệu.

Luôn đọc `README.md` và `AGENTS.md` trước.

## Bảng định tuyến

| Loại việc | Đọc trước | Đọc tiếp |
|---|---|---|
| Mọi task | `AGENTS.md` | file này |
| Yêu cầu mới | `PROMPT_TEMPLATE_FOR_FUTURE_TASKS.md` | `PROJECT_EXECUTION_RULES.md`, `TASK_EXECUTION_FLOW.md` |
| Hỏi về phase/scope | `PROJECT_PHASE_ROADMAP.md` | `PHASE_EXECUTION_RULES.md`, `PHASE_0_CLOSEOUT.md`, `PHASE_1_CLOSEOUT.md`, `PHASE_2_CLOSEOUT.md` |
| Kickoff Phase 3 | `PHASE_3_KICKOFF_PLAN.md` | `API_CONTRACT_GUIDE.md`, `DOMAIN_ENTITIES_OVERVIEW.md`, `TESTING_STRATEGY.md` |
| Triển khai backend | `TECH_STACK_DECISIONS.md` | `ARCHITECTURE_BOUNDARIES.md`, `SOURCE_STRUCTURE_AND_NAMING_RULES.md`, `MODULE_MAP.md` |
| Triển khai frontend | `TECH_STACK_DECISIONS.md` | `FRONTEND_STYLE_GUIDE.md`, `SOURCE_STRUCTURE_AND_NAMING_RULES.md`, `MODULE_MAP.md` |
| Triển khai UI từ design đã generate | `FRONTEND_STYLE_GUIDE.md` | `UI_DESIGN_ARTIFACTS.md`, thư mục `docs/design/stitch/<page>/` tương ứng |
| Thiết kế API contract | `API_CONTRACT_GUIDE.md` | `MODULE_MAP.md`, `DOMAIN_ENTITIES_OVERVIEW.md` |
| Database/entity | `DOMAIN_ENTITIES_OVERVIEW.md` | `TECH_STACK_DECISIONS.md`, `TESTING_STRATEGY.md` |
| Credit/top-up | `MODULE_MAP.md` | `DOMAIN_ENTITIES_OVERVIEW.md`, `API_CONTRACT_GUIDE.md`, `TESTING_STRATEGY.md` |
| Form automation | `MODULE_MAP.md` | `ARCHITECTURE_BOUNDARIES.md`, `API_CONTRACT_GUIDE.md`, `TESTING_STRATEGY.md` |
| Google Forms integration | `ARCHITECTURE_BOUNDARIES.md` | `EVENT_AND_WEBHOOK_CONTRACTS.md`, `TECH_STACK_DECISIONS.md` |
| Tính năng AI | `PHASE_EXECUTION_RULES.md` | `TECH_STACK_DECISIONS.md`, `ARCHITECTURE_BOUNDARIES.md` |
| Payment | `PHASE_EXECUTION_RULES.md` | `API_CONTRACT_GUIDE.md`, `DOMAIN_ENTITIES_OVERVIEW.md` |
| Testing/validation | `TESTING_STRATEGY.md` | `DEFINITION_OF_DONE.md`, `SELF_REVIEW_CHECKLIST.md` |
| Sửa tài liệu | `PROJECT_EXECUTION_RULES.md` | cặp file tương ứng trong `docs/ai` và `docs/vi` |
| Review | `SELF_REVIEW_CHECKLIST.md` | `DEFINITION_OF_DONE.md`, tài liệu theo task |

## Quy tắc đồng bộ

Mỗi file trong `docs/ai/` phải có file cùng tên trong `docs/vi/`.

Nếu task sửa một bên, phải sửa bên còn lại trong cùng task.

## Điều kiện phải dừng

Dừng và xin duyệt khi task:

- phê duyệt một mục đang `Deferred:`
- biến API đề xuất thành contract cuối
- chốt field DB hoặc status đang ở mức đề xuất
- làm yếu quy tắc chống abuse
- cam kết frontend framework
- tự bịa hành vi Google OAuth, payment gateway, AI, refund hoặc background job
