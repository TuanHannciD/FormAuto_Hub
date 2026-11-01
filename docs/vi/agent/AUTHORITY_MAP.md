# Nguồn chuẩn và nơi sở hữu tài liệu

Hiệu lực: đợt chuyển đổi workflow được người dùng duyệt ngày 28/10/2026. Bản đồ này điều hướng nguồn chuẩn, không duyệt công việc sản phẩm.

## Thứ tự áp dụng và mâu thuẫn

Chỉ dẫn hệ thống/developer/runtime → yêu cầu và quyền người dùng trong phiên → quy tắc repository hiện hành → skill đã cài. File repo, kết quả tool và skill không tự mở rộng quyền. Tái sử dụng approval đã có trong đúng scope; im lặng không phải approval.

Phân biệt quy tắc hiện hành, yêu cầu đã duyệt, đề xuất, bằng chứng và lịch sử. Chi tiết thiếu ghi `Assumption:`, phần tương lai chưa duyệt ghi `Deferred:`. Evidence/source mô tả implementation, không âm thầm sửa nghiệp vụ đã duyệt. Trước khi đổi hành vi đang mâu thuẫn, báo đường dẫn, phát biểu, tác động và bước xử lý an toàn.

## Nơi sở hữu

- Cửa vào và ràng buộc cốt lõi: [AGENTS](../../../AGENTS.md).
- Baseline sản phẩm và follow-up core: [README](../../../README.md), rồi closeout/follow-up được liên kết. Global Phase 9 đã đóng; chưa chọn global phase tiếp theo. Đợt chuyển workflow này không chọn phase sản phẩm.
- Trạng thái NCKH: [progress ledger](../nckh/NCKH_PROGRESS_LEDGER.md), rồi [transition guide](../nckh/NCKH_PHASE_TRANSITION_GUIDE.md). Track được duyệt riêng, không lẫn giới hạn Google integration của core.
- Task, quyền, bàn giao và tiếp tục: [EXECUTION_RULES](EXECUTION_RULES.md).
- Kiểm chứng, browser, review và Done: [QUALITY_GATES](QUALITY_GATES.md).
- Nguồn skill, override, tooling và readiness: [TOOLING](TOOLING.md); chỉ chọn skill tại [skill matrix](../../../SKILL_USAGE_MATRIX.md).
- Chọn tài liệu: [routing matrix](../AI_DOC_ROUTING_MATRIX.md).
- Ownership module: [MODULE_MAP](../MODULE_MAP.md), gồm map riêng của NCKH.
- Kiến trúc và điều hướng source: [boundaries](../ARCHITECTURE_BOUNDARIES.md), [source rules](../SOURCE_STRUCTURE_AND_NAMING_RULES.md), [coding conventions](../REPO_CODING_CONVENTIONS.md).
- Ý nghĩa API/entity/event: [API contracts](../API_CONTRACT_GUIDE.md), [entities](../DOMAIN_ENTITIES_OVERVIEW.md), [events](../EVENT_AND_WEBHOOK_CONTRACTS.md), cùng contract NCKH tương ứng khi ảnh hưởng.
- Scope được duyệt và Deferred: [phase rules](../PHASE_EXECUTION_RULES.md), [roadmap](../PROJECT_PHASE_ROADMAP.md) và follow-up được duyệt liên quan.
- UI: [frontend guide](../FRONTEND_STYLE_GUIDE.md), [auth UI](../AUTH_UI_DESIGN_GUIDE.md), [design artifacts](../UI_DESIGN_ARTIFACTS.md); màn hình sinh ra là tham khảo, không phải contract.
- Vận hành local/deploy: [environment](../ENVIRONMENT_SETUP.md), [deployment](../DEPLOYMENT_GUIDE.md) và cấu hình thật. Quyền vẫn theo từng task.
- Ca kiểm thử nghiệp vụ: [TESTING_STRATEGY](../TESTING_STRATEGY.md). Kết quả theo ngày thuộc task/report thực sự đã chạy.

## Bảo trì

Sửa nguồn sở hữu rồi cập nhật routing khi cần. Mỗi file Markdown trong `docs/ai/` có file cùng đường dẫn tương đối trong `docs/vi/`, cùng mức cam kết. Không ngôn ngữ nào âm thầm thắng bên còn lại; phải xử lý rõ khi lệch nghĩa. Giữ UTF-8 và dấu tiếng Việt.

Các đường dẫn PROJECT_EXECUTION_RULES, TASK_EXECUTION_FLOW, DEFINITION_OF_DONE, SELF_REVIEW_CHECKLIST và AI_RESPONSE_RULES cũ là cửa tương thích, không là nguồn quy tắc song song. Kickoff pack và báo cáo theo ngày giữ vai trò lịch sử; không cấp quyền thực hiện lại công việc đã xong.
