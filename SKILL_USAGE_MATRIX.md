# SKILL_USAGE_MATRIX

Ma trận chọn nhanh bộ skill FormAuto Hub.

| Tình huống | Dùng skill | Kết quả mong đợi |
|---|---|---|
| Requirement mơ hồ hoặc nhiều rule nghiệp vụ | `formauto-requirement-analyst` | Requirement rõ, assumptions, Deferred items, acceptance criteria |
| Task nhỏ, rõ, ít dependency | `formauto-ba-pm-planner-lite` | Scope ngắn và một hướng xử lý an toàn |
| Task cần chia nhiều bước hoặc nhiều worker | `formauto-delivery-planner` | Delivery plan, thứ tự phụ thuộc, worker prompt |
| Chưa rõ module/layer sở hữu | `formauto-module-router` | Ownership map và vùng file được phép |
| Có rủi ro vượt phase | `formauto-phase-gate` | In phase, out of phase, safe subset |
| Đụng API/DTO/entity/status/webhook/event | `formauto-contract-guard` | Contract risk report |
| Cần quyết định SQL Server/EF Core/migration | `formauto-db-architecture-planner` | DB strategy đề xuất |
| Cần soi rủi ro DB trước khi chốt | `formauto-db-risk-reviewer` | Risk review và điểm cần duyệt |
| Có bug runtime/log/endpoint lỗi | `formauto-bug-triage` | Evidence, hypothesis, next step |
| Cần gọi route/API thật | `formauto-http-behavior-tester` | Request/response report |
| Sửa tài liệu | `formauto-controlled-doc-editor` | Proposal trước, edit sau approval |
| Dùng Stitch gen UI, tự review/sửa, lưu artifact | `formauto-stitch-ui-iterative-designer` | Stitch screen đạt chuẩn, screenshot/HTML/screen-map lưu ở `docs/design` |
| Scope đã khóa và cần implement | `formauto-implementation-worker` | Thay đổi nhỏ nhất đúng scope |
| Review kết quả worker | `formauto-reviewer` | Findings, risks, validation honesty |

## Chuỗi dùng phổ biến

- Requirement mới: `formauto-requirement-analyst` -> `formauto-module-router` -> `formauto-phase-gate` -> `formauto-delivery-planner`.
- Backend/API task: `formauto-contract-guard` -> `formauto-module-router` -> `formauto-implementation-worker` -> `formauto-reviewer`.
- Database task: `formauto-system-requirement-interviewer` -> `formauto-db-architecture-planner` -> `formauto-db-risk-reviewer`.
- Bug task: `formauto-bug-triage` -> `formauto-http-behavior-tester` -> `formauto-implementation-worker` -> `formauto-reviewer`.
- Documentation task: `formauto-controlled-doc-editor` -> paired `docs/ai` and `docs/vi` update -> `formauto-reviewer`.
- Stitch UI task: `formauto-stitch-ui-iterative-designer` -> save `docs/design/stitch/<page-slug>` -> `formauto-reviewer` if the design will be implemented.
