# Chọn skill FormAuto Hub

Nguồn chọn skill duy nhất. Đọc [TOOLING](docs/vi/agent/TOOLING.md) về nguồn/pin/override trước khi áp dụng. `.agents/skills/` là nguồn; `.claude/skills/` là mirror sinh ra. Chỉ đọc skill cần cho task; nếu chưa được harness liệt kê, đọc trực tiếp SKILL.md và báo đúng giới hạn discovery.

## Phương pháp — Superpowers v6.4.2

| Công việc | Skill |
| --- | --- |
| Bắt đầu/chọn skill theo harness | `using-superpowers` |
| Khám phá yêu cầu, actor, workflow, phương án | `brainstorming` |
| Lập plan có acceptance, vùng file và check | `writing-plans` |
| Thực hiện plan inline và giữ checkpoint | `executing-plans` |
| Thực hiện bằng Agent con, khi quyền phiên cho phép | `subagent-driven-development` |
| Giao các phần độc lập song song, khi được phép | `dispatching-parallel-agents` |
| Điều tra lỗi theo evidence trước khi sửa | `systematic-debugging` |
| Test hành vi quan trọng theo tác động | `test-driven-development` |
| Chuẩn bị review / xử lý feedback | `requesting-code-review`, `receiving-code-review` |
| Kiểm chứng trước tuyên bố kết quả | `verification-before-completion` |
| Cách ly checkout / kết thúc nhánh trong quyền đã có | `using-git-worktrees`, `finishing-a-development-branch` |
| Viết/sửa skill trong task được giao | `writing-skills` |
| Chẩn đoán workflow Agent kém hiệu quả | `diagnosing-superpowers` |

## UI

- `impeccable`: phương pháp thiết kế/audit/hoàn thiện UI chính; giữ frontend guide và UI đã được chấp nhận.
- `ui-ux-pro-max`: tra cứu bổ trợ theo câu hỏi UX/type/palette/pattern cụ thể; không thay brief hoặc contract.
- `formauto-stitch-ui-iterative-designer`: chỉ khi task dùng Stitch; kiểm tool thật, lưu artifact tham khảo theo quy tắc project.

## Specialist FormAuto — bổ sung domain

| Khi cần | Skill bổ sung |
| --- | --- |
| API/DTO/entity/status/event/webhook | `formauto-contract-guard` |
| Module/layer và vùng file sở hữu | `formauto-module-router` |
| SQL Server/EF Core/migration/transaction | `formauto-db-architecture-planner` |
| Phản biện rủi ro persistence/ledger | `formauto-db-risk-reviewer` |
| Kiểm route/API HTTP thật trong scope | `formauto-http-behavior-tester` |
| VPS/log/health chỉ đọc; recovery theo quyền hẹp | `formauto-server-debugger` |

Skill chuyên môn không tự duyệt nghiệp vụ, tạo lifecycle hay cấp quyền. Phase/safety/docs theo [authority](docs/vi/agent/AUTHORITY_MAP.md), [execution](docs/vi/agent/EXECUTION_RULES.md), [quality](docs/vi/agent/QUALITY_GATES.md). Tài liệu chỉ cần check tài liệu; không ép TDD, Agent con hoặc deploy.

## Chuyển từ skill cũ

- requirement-analyst / system-requirement-interviewer → brainstorming + nguồn domain.
- delivery-planner / ba-pm-planner-lite → writing-plans, độ chi tiết theo task.
- bug-triage → systematic-debugging, thêm HTTP/server specialist khi cần.
- implementation-worker → executing-plans hoặc subagent-driven-development được phép.
- reviewer → requesting-code-review / receiving-code-review + quality gates.
- controlled-doc-editor / phase-gate → quy tắc execution/authority và phase/contract liên quan.

Các tên cũ ở prompt NCKH Phase 2/3 là lịch sử, không phải routing hiện hành hoặc quyền dispatch.
