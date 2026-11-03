# FAH-UI-003 — bằng chứng UI cục bộ

- `before/`:61ảnh baseline ngày02/11 (không có AI đã lưu/kết quả).
- `after/`:61ảnh đã được người dùng nghiệm thu; `before-after-report.html` mở offline bằng đường dẫn ảnh tương đối.
- `after-only/`: AI30câu trả lời dài/màn thấp/reflow/kết quả. Không khẳng định có baseline trước cho các trạng thái này.
- `user-final/`: bổ sung03/11 có lượt AI thực từ fixture, chi tiết kỹ thuật mở/đóng, NCKH linked/empty/mapping/dataset, popup nạp đã mở ổn định.
- `closeout-final/`:61ảnh toàn18route/account/forms của bản cuối, popup chi tiết được chờ ổn định.
- `fixture-data.json`: dữ liệu giả lập dùng bởi regression; không phải API/DB/provider thật.
- `closeout-regression-final.log`, `closeout-build-final.log`, `closeout-lint.log`, `closeout-auth.log`: kiểm bản cuối; đọc kết quả thực tế trong ledger task.
- Giữ log RED/lỗi tác giả test như lịch sử; log lỗi không thay cho kết luận về bản cuối.

Hồ sơ/ảnh gốc ở main đã sao lưu ngoài repo và kiểm SHA256 tại `D:/TinHoc/FormAuto_Hub-task-archive/FAH-UI-003-20261103/original-main`. Helper startup bị từ chối, fixture API server không dùng, file tạm và ảnh CSS zoom không hợp lệ đã chuyển sang `retired-artifacts` cùng archive, kiểm hash; không còn là công cụ chạy trong repo. Không chạy lại helper/wrapper bị từ chối.

Giới hạn: fixture/session giả lập, viewport mô phỏng; không live login/API/DB/Google/AI/PayOS, thiết bị thật hoặc zoom bằng UI trình duyệt. Người dùng nghiệm thu phạm vi hình ảnh và cho merge local, tự push/deploy. Đo chiều cao không đo thời gian thao tác.

Log runner được giữ nguyên byte UTF-8/ANSI qua `.gitattributes` cục bộ (`-text -diff`); đọc trực tiếp file để xem kết quả, không sửa log gốc chỉ để chuẩn hóa whitespace.

Sau merge local main: `merged-build.log`, `merged-auth.log` (9/9), `merged-browser-smoke.log` (8/8); `postmerge-smoke/` chứa ảnh bổ sung và hash. Nguồn giữ nguyên commit triển khai; `local-integration.json` ghi kết quả. Xóa cache/dependency sinh ra bị kiểm tra phê duyệt tự động từ chối (`blocked by policy`); giữ thư mục ignored và checkout T3, không thử lại. Không push/deploy.

Bổ sung admin03/11: `admin-before/`18ảnh, `admin-after/`19ảnh gồm chi tiết AI320; `admin-before-after-report.html` đối chiếu tương tác, cuộn từng ảnh. Baseline chụp xong trước sửa nguồn; ảnh sau từ runtime khởi động lại sau build cuối. `admin-regression.log`58/58, `admin-smoke-final.log`8/8, `admin-build-final.log`, `admin-lint.log`, `admin-auth.log`9/9, `admin-detector.json` và `admin-validation.json`. Không có DB/provider thật. Metric tiền/credit không đổi phép tính; nhãn chế độ chỉ đổi hiển thị; filter gửi query hiện có khi bấm Lọc.

Admin đã merge main local: `admin-merged-build.log` exit0, `admin-merged-auth.log`9/9, `admin-merged-smoke.log`8/8, `admin-merged/`19ảnh và hash. Review độc lập trong `admin-independent-review.md`; không còn P1/P2/P3 trong delta admin. Nguồn giữ nguyên sau review. Chưa push/deploy.
