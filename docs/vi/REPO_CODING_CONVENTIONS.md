# REPO_CODING_CONVENTIONS

## Mục đích

Định nghĩa coding conventions cho implementation sau này.

## Trạng thái hiện tại

Initial Phase 1 backend scaffold đã tồn tại. Các convention này áp dụng cho mọi implementation work sau này.

## Quy tắc chung

- Ưu tiên code đơn giản, dễ đọc.
- Giữ thay đổi đúng scope.
- Tránh refactor rộng khi đang làm feature.
- Không thêm abstraction trước khi có duplication hoặc complexity thật.
- Chỉ comment khi giúp làm rõ behavior không hiển nhiên.

## Quy tắc ASP.NET Core

- Controllers phải mỏng.
- Dùng DTOs cho request/response contracts.
- Không expose EF Core entities trực tiếp.
- Business logic đặt trong services.
- Provider calls đặt trong integration services.
- Persistence đặt trong EF Core `DbContext` và repositories/services nếu đã duyệt.

## Naming rules

- Dùng PascalCase cho C# types và public members.
- Dùng camelCase cho local variables và parameters.
- Dùng module names khớp `MODULE_MAP.md`.
- Đặt tên rõ cho credit và ledger operations.

## Refactor rules

- Không refactor unrelated modules.
- Không chuyển ownership boundary nếu chưa cập nhật docs.
- Không tạo shared packages hoặc frontend structure trước khi duyệt.

## Contract rules

- DTO changes cần API contract review.
- Entity changes cần database review.
- Status changes cần lifecycle review.
