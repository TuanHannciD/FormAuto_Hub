# FAH-DIRECT-001 — Đồng bộ tài liệu baseline

Ngày: 2026-11-01. Writer: `/root/direct_rules_docs_sync`, `gpt-5.6-sol`, reasoning `low`; không có agent con.

## Tóm tắt và phạm vi

Đã đồng bộ baseline hiện hành với luồng quy tắc Option 1 được duyệt: một thao tác **Tạo và gửi ngay**, không có UI preview hoặc lần xác nhận thứ hai. Option 2/3 vẫn giữ human preview và xác nhận rõ. Đây là follow-up local của baseline phase đã đóng và không thay đổi, không phải tuyên bố integration hoặc release.

Chỉ cập nhật tài liệu baseline/owner hiện hành và counterpart tiếng Việt. Không viết lại phase package lịch sử, closeout evidence hoặc task ledger do agent khác sở hữu.

## File đã thay đổi

- `README.md`; `AGENTS.md`.
- `docs/ai/API_CONTRACT_GUIDE.md` và `docs/vi/API_CONTRACT_GUIDE.md`.
- `docs/ai/ARCHITECTURE_BOUNDARIES.md` và `docs/vi/ARCHITECTURE_BOUNDARIES.md`.
- Báo cáo này và `docs/ai/tasks/FAH-DIRECT-001/DOCS_SYNC.md`.

## Đồng bộ contract

Đã ghi nhận request và response hiện có của `POST /api/projects/{projectId}/submissions/send-rules-direct`, giới hạn count, `Total` partial-credit x1, replay chỉ đọc theo first-call-wins, audit lỗi 4xx cho owner đã xác thực, batch tuần tự và ranh giới recovery fail-closed. Không thêm schema, field DTO, status, refund rule, hành vi provider, cam kết exactly-once, tự động resume, phase hoặc cam kết release mới.

## Validation

- Verified: đối chiếu wording với chữ ký chính xác trong controller, DTO, direct service, admission source và contract/review backend đã frozen.
- Verified: review ý nghĩa AI/VI theo phạm vi, target link Markdown, đọc UTF-8 và `git diff --check` cho các file này.
- Not run: build/test/runtime/browser của ứng dụng; đây là thay đổi chỉ tài liệu và phần runnable vẫn thuộc frontend/runtime/root agent.

## Rủi ro và bước tiếp theo

Tại thời điểm ghi báo cáo, sửa frontend và runtime evidence cuối vẫn đang chờ. Root cần tổng hợp kết quả cuối của các phần đó với backend rereview đã pass trước mọi tuyên bố hoàn tất local.
