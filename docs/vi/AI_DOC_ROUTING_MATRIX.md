# Điều hướng tài liệu

Bắt đầu README → AGENTS → [authority](agent/AUTHORITY_MAP.md) → task/handoff đã có. Chọn bộ đủ nhỏ bên dưới; [skill matrix](../../SKILL_USAGE_MATRIX.md) chọn phương pháp, không phải file này.

## Theo công việc

| Công việc | Đọc |
| --- | --- |
| Plan, thực hiện, tài liệu, bàn giao/tiếp tục hoặc quyền | [execution](agent/EXECUTION_RULES.md); task được duyệt và nguồn sở hữu bị ảnh hưởng |
| Test, review, browser hoặc Done | [quality](agent/QUALITY_GATES.md), [test nghiệp vụ](TESTING_STRATEGY.md) |
| Chọn/cài skill/tool hoặc claim năng lực | [tooling](agent/TOOLING.md), [skill matrix](../../SKILL_USAGE_MATRIX.md) |
| Phase hoặc yêu cầu mới | [phase rules](PHASE_EXECUTION_RULES.md), [roadmap](PROJECT_PHASE_ROADMAP.md), approval/closeout liên quan; [task brief](../../templates/TASK_BRIEF.md) |
| Backend hoặc điều hướng source | [stack](TECH_STACK_DECISIONS.md), [boundaries](ARCHITECTURE_BOUNDARIES.md), [source rules](SOURCE_STRUCTURE_AND_NAMING_RULES.md), [modules](MODULE_MAP.md) |
| Frontend/shared UI | [frontend guide](FRONTEND_STYLE_GUIDE.md), source rules, modules, shared component và consumer bị ảnh hưởng |
| Auth UI | [auth UI](AUTH_UI_DESIGN_GUIDE.md), frontend guide, [API](API_CONTRACT_GUIDE.md) |
| UI sinh ra/Stitch | frontend guide, [artifacts](UI_DESIGN_ARTIFACTS.md), thư mục `docs/design/stitch/` liên quan |
| API/auth/credit/top-up/payment | API, modules, [entities](DOMAIN_ENTITIES_OVERVIEW.md), scope đã duyệt và test nghiệp vụ; payment thêm [Phase 8](PHASE_8_KICKOFF_PLAN.md) |
| Database/migration | entities, stack, boundaries, migration/test và contract bị ảnh hưởng |
| Form automation/Google | modules, boundaries, API, [events](EVENT_AND_WEBHOOK_CONTRACTS.md); giữ phân biệt core/NCKH |
| AI | phase rules, [scope Phase 6](PHASE_6_AI_MAPPING_GENERATION_REQUIREMENT_PACKAGE.md), [closeout](PHASE_6_CLOSEOUT.md), API và integration thật |
| NCKH | [ledger](nckh/NCKH_PROGRESS_LEDGER.md) → [transition](nckh/NCKH_PHASE_TRANSITION_GUIDE.md) → module/architecture/contract NCKH và chỉ phase/follow-up liên quan |
| Local/server/deploy | [environment](ENVIRONMENT_SETUP.md), [deployment](DEPLOYMENT_GUIDE.md), cấu hình thật; server specialist để chẩn đoán production chỉ đọc |
| Follow-up UI/credit | [UI_CREDIT_FOLLOWUP_SYNC](UI_CREDIT_FOLLOWUP_SYNC.md), frontend guide, API; contract NCKH khi ảnh hưởng |
| Follow-up SEO/GEO | [implementation record](SEO_GEO_IMPLEMENTATION_PLAN.md), [validation runbook](SEO_GEO_VALIDATION_RUNBOOK.md), frontend guide và test liên quan; giữ UI đã chấp nhận |

## Cách đọc và đồng bộ

Tài liệu trên 200 dòng đọc heading trước để chọn phần cần. Không đọc lại nội dung chưa đổi đã nạp; mở rộng khi tính đúng cần. Rule/contract trước kiến trúc rồi implementation. TOC không thay đọc đầy đủ source/dependency/test bị ảnh hưởng.

Mỗi Markdown trong `docs/ai/` có file cùng đường dẫn tương đối trong `docs/vi/`; sửa cả hai, cùng mức cam kết. Kickoff/report lịch sử là ngữ cảnh, không là quyền hiện tại. Quyết định mới về contract/schema/safety/phase theo execution rules; không suy approval từ pack cũ.

Evidence SEO/GEO vẫn theo ngày: check local/public release 09/10/2026 là Verified, xử lý sitemap GSC là Blocked, hiệu quả search/AI là Not run. Recovery plan là đề xuất riêng; đọc khi liên quan. Đổi routing không chạy lại check đó, không cấp quyền release hoặc global phase mới.
