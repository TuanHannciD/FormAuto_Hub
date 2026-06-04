# AI_DOC_ROUTING_MATRIX

## Mục đích

Định tuyến tài liệu tối thiểu cần đọc trước khi AI lập kế hoạch, viết code, review hoặc sửa tài liệu.

Luôn đọc `README.md` và `AGENTS.md` trước.

## Bảng định tuyến

| Loại việc | Đọc trước | Đọc tiếp |
|---|---|---|
| Mọi task | `AGENTS.md` | file này |
| Yêu cầu mới | `PROMPT_TEMPLATE_FOR_FUTURE_TASKS.md` | `PROJECT_EXECUTION_RULES.md`, `TASK_EXECUTION_FLOW.md` |
| Hỏi về phase/scope | `PROJECT_PHASE_ROADMAP.md` | `PHASE_EXECUTION_RULES.md`, `PHASE_0_CLOSEOUT.md`, `PHASE_1_CLOSEOUT.md`, `PHASE_2_CLOSEOUT.md`, `PHASE_7_CLOSEOUT.md`, `PHASE_8_KICKOFF_PLAN.md`, `PHASE_8_CLOSEOUT.md`, `PHASE_9_KICKOFF_PLAN.md`, `PHASE_9_CLOSEOUT.md` |
| Kickoff Phase 3 | `PHASE_3_KICKOFF_PLAN.md` | `API_CONTRACT_GUIDE.md`, `DOMAIN_ENTITIES_OVERVIEW.md`, `TESTING_STRATEGY.md` |
| Kickoff Phase 8 | `PHASE_8_KICKOFF_PLAN.md` | `PROJECT_PHASE_ROADMAP.md`, `PHASE_EXECUTION_RULES.md`, `API_CONTRACT_GUIDE.md`, `DOMAIN_ENTITIES_OVERVIEW.md`, `TESTING_STRATEGY.md` |
| Kickoff, thực thi hoặc closeout Phase 9 | `PHASE_9_KICKOFF_PLAN.md` | `PHASE_9_CLOSEOUT.md`, `TESTING_STRATEGY.md`, `DEFINITION_OF_DONE.md`, `SELF_REVIEW_CHECKLIST.md`, `PROJECT_PHASE_ROADMAP.md`, `PHASE_EXECUTION_RULES.md` |
| Triển khai backend | `TECH_STACK_DECISIONS.md` | `ARCHITECTURE_BOUNDARIES.md`, `SOURCE_STRUCTURE_AND_NAMING_RULES.md`, `MODULE_MAP.md` |
| Triển khai frontend | `TECH_STACK_DECISIONS.md` | `FRONTEND_STYLE_GUIDE.md`, `SOURCE_STRUCTURE_AND_NAMING_RULES.md`, `MODULE_MAP.md` |
| Triển khai UI từ design đã generate | `FRONTEND_STYLE_GUIDE.md` | `UI_DESIGN_ARTIFACTS.md`, thư mục `docs/design/stitch/<page>/` tương ứng |
| Thiết kế hoặc triển khai Auth UI | `AUTH_UI_DESIGN_GUIDE.md` | `FRONTEND_STYLE_GUIDE.md`, `UI_DESIGN_ARTIFACTS.md`, `API_CONTRACT_GUIDE.md` |
| Authentication/JWT backend | `API_CONTRACT_GUIDE.md` | `DOMAIN_ENTITIES_OVERVIEW.md`, `PROJECT_PHASE_ROADMAP.md`, `TESTING_STRATEGY.md` |
| Thiết kế API contract | `API_CONTRACT_GUIDE.md` | `MODULE_MAP.md`, `DOMAIN_ENTITIES_OVERVIEW.md` |
| Database/entity | `DOMAIN_ENTITIES_OVERVIEW.md` | `TECH_STACK_DECISIONS.md`, `TESTING_STRATEGY.md` |
| Credit/top-up | `MODULE_MAP.md` | `DOMAIN_ENTITIES_OVERVIEW.md`, `API_CONTRACT_GUIDE.md`, `TESTING_STRATEGY.md` |
| Form automation | `MODULE_MAP.md` | `ARCHITECTURE_BOUNDARIES.md`, `API_CONTRACT_GUIDE.md`, `TESTING_STRATEGY.md` |
| Google Forms integration | `ARCHITECTURE_BOUNDARIES.md` | `EVENT_AND_WEBHOOK_CONTRACTS.md`, `TECH_STACK_DECISIONS.md` |
| Tính năng AI | `PHASE_EXECUTION_RULES.md` | `PHASE_6_AI_MAPPING_GENERATION_REQUIREMENT_PACKAGE.md`, `TECH_STACK_DECISIONS.md`, `ARCHITECTURE_BOUNDARIES.md` |
| Payment | `PHASE_EXECUTION_RULES.md` | `PHASE_8_KICKOFF_PLAN.md`, `API_CONTRACT_GUIDE.md`, `DOMAIN_ENTITIES_OVERVIEW.md` |
| Testing/validation | `PHASE_9_KICKOFF_PLAN.md` | `TESTING_STRATEGY.md`, `DEFINITION_OF_DONE.md`, `SELF_REVIEW_CHECKLIST.md` |
| Sửa tài liệu | `PROJECT_EXECUTION_RULES.md` | cặp file tương ứng trong `docs/ai` và `docs/vi` |
| Review | `SELF_REVIEW_CHECKLIST.md` | `DEFINITION_OF_DONE.md`, tài liệu theo task |
| Task NCKH | `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`, `docs/ai/nckh/NCKH_PHASE_TRANSITION_GUIDE.md` | `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`, `docs/ai/nckh/NCKH_PHASE_1_CLOSEOUT.md`, `docs/ai/nckh/NCKH_PHASE_2_CLOSEOUT.md`, `docs/ai/nckh/NCKH_PHASE_2_KICKOFF_PLAN.md`, `docs/ai/nckh/NCKH_REQUIREMENT_PACKAGE.md`, `docs/ai/nckh/NCKH_DOMAIN_ENTITIES_OVERVIEW.md`, `docs/ai/nckh/NCKH_MODULE_MAP.md`, `docs/ai/nckh/NCKH_ARCHITECTURE_BOUNDARIES.md`, `docs/ai/nckh/NCKH_API_CONTRACT_GUIDE.md` |

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

## File vượt 400 dòng

Một số file docs vượt ngưỡng 400 dòng. Trước khi đọc toàn bộ, nên quét headers để xác nhận task có thực sự cần nội dung bên trong (xem chiến lược đọc trong `PROJECT_EXECUTION_RULES.md#tổ-chức-file--chiến-lược-đọc`).

| File | ~Dòng |
|---|---|
| `PHASE_6_AI_MAPPING_GENERATION_REQUIREMENT_PACKAGE.md` | ~500 |
| docs/ai/nckh/NCKH_API_CONTRACT_GUIDE.md | ~150 |
| docs/ai/nckh/NCKH_DOMAIN_ENTITIES_OVERVIEW.md | ~200 |
| `API_CONTRACT_GUIDE.md` | ~450 |

Số dòng là gần đúng và có thể lệch theo thời gian. Khi mở file không có trong danh sách nhưng có vẻ lớn, áp dụng cùng cách tiếp cận TOC-first.

## Chiến lược đọc

Trước khi đọc bất kỳ file docs nào, áp dụng các quy tắc sau để tránh tốn token không cần thiết (quy tắc đầy đủ trong `PROJECT_EXECUTION_RULES.md#tổ-chức-file--chiến-lược-đọc`):

1. File này là điểm xuất phát — xác định bộ file tối thiểu cho task trước khi đọc bất cứ file nào khác.
2. Với file > 200 dòng: quét headers/TOC trước, chỉ đọc full các section liên quan.
3. Không đọc lại file đã đọc trong cùng phiên.
4. Thứ tự ưu tiên: rules/contracts → overview kiến trúc → chi tiết implementation.
5. Dùng TOC kèm dòng để nhảy đến section cần thay vì đọc toàn bộ file lớn.
