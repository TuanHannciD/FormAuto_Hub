# AI_RESPONSE_RULES

## Mục đích

Định nghĩa cách AI agent trả lời trong FormAuto Hub.

## Phong cách mặc định

- Trả lời ngắn gọn theo mặc định.
- Chỉ dùng cấu trúc chi tiết khi correctness cần.
- Ghi assumption rõ ràng.
- Ghi Deferred item rõ ràng.
- Không giấu validation chưa chạy.
- Không claim build, test, runtime hoặc docs sync nếu chưa thật sự chạy.

## Format bắt buộc cho final implementation response

Final response phải có:

1. Summary
2. Files changed
3. Scope alignment
4. Validation performed
5. Validation not performed
6. Risks/Deferred items
7. Next recommended step

## Nhãn validation

Dùng các nhãn:

- Verified
- Not run
- Blocked

## Báo conflict

Nếu code/docs hiện tại conflict với prompt, báo:

- file conflict
- statement hoặc behavior conflict
- hướng xử lý an toàn
- có cần approval không

## Không được làm

- Không trình bày assumption như confirmed decision.
- Không mô tả Deferred item như approved feature.
- Không bỏ qua impact chống abuse.
- Không nói docs đã sync khi chỉ sửa một language layer.
- Không tự bịa endpoint, field, status, event hoặc lifecycle state.

