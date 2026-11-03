# Tinh gọn homepage — bổ sung local, 03/11/2026

## Quyền và phạm vi

Sau khi FAH-UI-003 đóng local tại `d42eff5`, người dùng yêu cầu tinh gọn homepage theo cùng quy tắc và duyệt thiết kế cụ thể trong chat bằng “Approved”. Bổ sung giới hạn ở homepage hiện có; root làm inline, một reviewer Sol độc lập chỉ đọc. Hồ sơ này không mở lại hoặc sửa kết quả đóng task các trang sau đăng nhập.

Workspace: `C:/Users/Tuan/.t3/worktrees/FormAuto_Hub/ui-fah-ui-003`, nhánh `ui/fah-ui-003`, base sạch `d42eff5eff288c936d2f9c8a5e49799830305598`. Giữ nguyên main và worktree normalize-topup khác. Không cài dependency, đổi backend/API/DB/provider, commit, merge, push hay deploy trong bổ sung này.

## Đã triển khai

- Giảm tiêu đề, khoảng đệm và minh họa hero; bỏ nhãn giới thiệu và thông điệp nổi lặp lại.
- Gộp dải lợi ích và hướng dẫn trùng nhau thành ba bước ngắn; giữ các anchor hiện có.
- Hai mô tả dịch vụ ngắn thay cho ba thẻ quảng bá cao. Thông tin credit miễn phí vẫn ở bảng giá và nút đăng ký.
- Thẻ giá gọn hơn, giữ đủ giá, quy đổi credit, số lượt, đường dẫn và giải thích không phải thuê bao.
- FAQ native giữ tương tác bàn phím. Toàn bộ diễn đạt về xem trước phân biệt quy tắc “Tạo và gửi ngay” với AI cần xem trước và xác nhận. Không thay hành vi gửi.
- Giữ token thương hiệu, cấp tiêu đề, vùng bấm CTA ít nhất44px, metadata và JSON-LD. Không sửa CSS toàn cục.

File: `apps/web/app/page.tsx`, `apps/web/tests/homepage-cleanup.spec.ts`, hồ sơ song ngữ này và artifact task.

## Kiểm chứng

| Trạng thái | Bằng chứng |
| --- | --- |
| Verified | Chụp trước tại320/390/768/1024/1440 trước khi sửa sản phẩm; `before-geometry.json` |
| Failed — RED có chủ đích | `baseline-red.log`: trang cũ thiếu diễn đạt FAQ cho luồng quy tắc;1test chụp đạt/1test nội dung thất bại. Lệnh ghi log đầu chưa có thư mục nên không chạy test; đã sửa trước baseline |
| Verified | `regression.log`:5/5 ca homepage mới/hiện có đạt |
| Verified | Build exit0, lint exit0 (`build.log`, `lint.log`); hai cảnh báo hook account có từ trước; auth9/9 (`auth.log`) |
| Verified | Sau build cuối, Next do runner quản lý đã khởi động lại; `runtime-final.log`:6/6 ca homepage/bóng đổ dùng chung đạt; `verified/` chụp cùng nguồn cuối |
| Verified | HTTP200, hydration/chunk trình duyệt, không page error/chunk HTTP≥400, không tràn ngang tại năm kích thước; bàn phím menu/FAQ, đủ giá, CTA tiếp cận được và cao tối thiểu44px |
| Verified | Khối metadata giữ nguyên sau giải mã văn bản, kiểm canonical/JSON-LD; không sửa helper SEO hay metadata |
| Verified | Root xem ảnh mobile/desktop tiêu biểu; detector `[]`, whitespace và kiểm cặp tài liệu/link/encoding |
| Verified | Review độc lập chỉ đọc `gpt-6.1-sol/high` trên nguồn/ảnh tiêu biểu: không P1/P2 hoặc P3 mới đáng kể. Reviewer không chạy test/server |
| Not run | Live API/DB/Google/AI/PayOS, đăng nhập thật, thiết bị thật, zoom bằng UI trình duyệt hoặc screen reader; không cần tác động live cho thay đổi hiển thị công khai này |

SHA256 nguồn: `e0d9219b73d1c05baa7599849bb4368d9f47ca74c003686009872b5a62749014`. Task review: `homepage-cleanup-review-20261103-r1`, catalog xác nhận provider `codex_cx_via_9router`, model thực `gpt-6.1-sol`, reasoning `high`, không agent con lồng nhau. Không sửa nguồn sau review.

Ở390px, chiều dài6014→3194px, đầu bảng giá3295→1403px; ở1440px3332→1978px. Đây là số đo tài liệu khi FAQ đóng, không phải tốc độ thao tác. Minh họa có nhãn minh họa; biểu tượng Next dev trong ảnh không phải control production.

## Bằng chứng và bàn giao

[Báo cáo so sánh mở offline](../../../artifacts/reports/homepage-cleanup-2026-11-03/before-after-report.html), [review độc lập](../../../artifacts/reports/homepage-cleanup-2026-11-03/independent-review.md). Artifact có log gốc, ảnh trước/sau/verified, diagnostics và manifest SHA256. HTML preview không lỗi console trước khi hiển thị inline.

Origin runtime: `http://localhost:3000` do runner quản lý; trang công khai, test mới chặn API, không DB/provider. Hồi quy bóng đổ dùng context User/Admin tổng hợp hiện có. Kiểm cổng trước khi runner chạy và sau khi giải phóng. Không chạy helper detached; không thử lại startup/cleanup từng bị từ chối. Cache ignored và checkout T3 giữ nguyên.

Kết quả: **Đã triển khai và kiểm chứng local; phần homepage chưa commit trong checkout feature**. Tiếp theo: xem đối chiếu và tích hợp local khi nằm trong lần tích hợp tiếp theo của người dùng. Main vẫn ở snapshot đóng task trước `d42eff5`; không khẳng định release.
