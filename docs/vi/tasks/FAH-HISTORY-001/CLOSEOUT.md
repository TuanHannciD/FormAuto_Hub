# Đóng task FAH-HISTORY-001

> Giao nhận mới nhất: đã merge vào main local, gỡ nhánh/đăng ký worktree tính năng. Xem [MERGE_CLOSEOUT](MERGE_CLOSEOUT.md); hướng dẫn giữ worktree cũ bên dưới là lịch sử.

Trạng thái: **Done — triển khai local đã duyệt**, theo xác nhận rõ của người dùng ngày 2026-11-06. Người dùng cho phép dọn tài nguyên task và commit cục bộ, sẽ tự push/deploy. Trạng thái này thay thế các ghi chú cũ còn chờ review hoặc giữ process chạy trong hồ sơ bàn giao.

## Phạm vi bàn giao

20 lượt tái sử dụng mới nhất mỗi tài khoản, mỗi lượt1–100 câu trả lời; phí tạo rules0/AI mặc định1/AI tùy chỉnh2; phí riêng mỗi lần gửi thành công1 credit; lịch sử/replay bất biến, giữ và quyết toán credit bền vững, cách ly owner/session và giao diện lịch sử. Review lại Task5/Task6 và review độc lập toàn nhánh đã đạt; không còn Critical/Important trong phạm vi local đã duyệt. Minor M2 về thứ tự ưu tiên lỗi an toàn giữ Deferred.

## Kiểm chứng

Bằng chứng runtime đã review gồm61 kiểm tra API,56 ca Safety SQL,2 ca cutover tổng hợp,1 ca migration Baseline có dữ liệu và6 ca browser web–API–SQL thật. Full .NET393 pass/49 opt-in skip mặc định;43 mục method skip đã chạy riêng trên DB sở hữu,6 method TopupEvidence SQL không đổi còn Not run. Web lint/build, auth10/10, Node112/112 và browser mock Task5 59/59 đã đạt như VALIDATION/TASK5_REPORT ghi nhận.

Kiểm tra và kết quả cuối của root được ghi trong `artifacts/reports/fah-history-001/closeout.json`. Báo cáo review toàn nhánh tại `artifacts/reports/fah-history-001/final-review.md`.

## Dọn tài nguyên và bảo toàn

- Thu hồi cả3 refresh session tổng hợp hiện tại qua logout HTTP200 trước khi dừng API.
- Xác minh executable/command/thời điểm bắt đầu chính xác rồi dừng API14444, web9668 và launcher API11748. Cổng3305/5305 không còn listener. Chỉ đóng hai tab preview do task sở hữu.
- Xóa file session đã thu hồi, cấu hình ký và khóa DataProtection tạm trong đúng thư mục task bị ignore. Giữ ID fixture và helper script; test runtime cần thiết lập mới thay vì dùng credential cũ.
- Giữ DB SQL, audit/ledger, toàn bộ artifact từng lượt và snapshot bất biến. `.gitignore` riêng thư mục artifact giữ output theo máy/snapshot lặp ở local; commit báo cáo Markdown, manifest được chọn và tóm tắt đóng task. Không xóa bằng chứng.
- Sao lưu `tsconfig.tsbuildinfo` sinh tự động có theo dõi bằng Git, xác minh SHA256 vào vùng task bị ignore rồi khôi phục đúng byte HEAD. Không reset source sản phẩm.

## Kiểm tra còn lại và giao nhận

Xác minh metadata/receipt Google thật và đối soát vận hành vẫn **Not run/Blocked**, chuyển thành việc tiếp theo sau triển khai và ngoài task local đã đóng. Chốt task không xác nhận các phần đó đã đạt hay tự bật gửi: admission cấu hình production vẫn fail-closed. Công cụ đối soát/import/backfill legacy không hold còn Deferred. Không migrate production, push, deploy hay gọi provider thật.

Commit giao nhận nằm trên nhánh `fah-history-001` trong worktree hiện tại. Người dùng tự push/deploy. Giữ worktree và hai DB thử nghiệm; không merge/xóa worktree trong lần đóng task này.
