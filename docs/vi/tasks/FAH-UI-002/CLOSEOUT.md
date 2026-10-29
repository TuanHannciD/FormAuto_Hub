# FAH-UI-002 — đóng hồ sơ công việc

Ngày: 2026-10-29. Trạng thái: **Đóng theo yêu cầu người dùng, còn nghiệm thu chưa đạt và tài nguyên giữ lại**. Đây không phải khẳng định mọi gate Done, nghiệm thu thị giác, tích hợp hay phát hành.

## Tóm tắt và quyền thực hiện

Người dùng yêu cầu đóng task và kiểm kê thư mục sót. Triển khai/test/tài liệu được giữ tại commit `0698ecc`. Checkpoint này chỉ sửa tài liệu đóng hồ sơ theo cặp; không sửa sản phẩm hoặc xóa dọn. Giữ nhánh local hiện tại; chưa có quyền push/merge/deploy. Các agent con đã kết thúc lượt; tại thời điểm kiểm không có agent triển khai/review đang hoạt động.

## Kiểm tra và giới hạn

- Verified: Git/native và T3 đều chỉ có checkout gốc; không có worktree phụ đã đăng ký. Git sạch trước khi sửa hồ sơ đóng task.
- Check đã Verified trước đó: lint, auth9/9 và142 hash snapshot cuối; regression toàn bộ lịch sử129pass/1fail/1skip rồi targeted6/6 và capture1/1. Kết quả build/browser có thời điểm tại PROGRESS, không chạy lại để đóng tài liệu.
- Kiểm kê runtime hiện tại: giữ process web3020 sở hữu PID2792. Khôi phục API vẫn Blocked do DB có migration thiếu source; không sửa schema/config hoặc chạy migration.
- Phạm vi tìm thư mục: cấp đầu repo, các thư mục artifact task, `.codex-tmp` và thư mục con trực tiếp của `D:/TinHoc` khớp FormAuto. Không phải quét toàn máy hoặc kho ảnh browser.

## Thư mục giữ lại và ownership

| Vị trí | Phân loại / quyết định |
| --- | --- |
| `D:/TinHoc/.formauto-core-motion-verify` | Bản sao app kiểm chứng lịch sử, không `.git`, ngày7–8/10; không thấy process tương ứng đang chạy. Giữ chờ xác nhận chủ sở hữu/quyền xóa. |
| `D:/TinHoc/.formauto-shared-ui-baseline` | Bản sao app baseline lịch sử, không `.git`, ngày7/10; giữ chờ xác nhận chủ sở hữu/quyền xóa. |
| `D:/TinHoc/.formauto-ui-v10-verify` | Bản sao app kiểm chứng UI lịch sử, không `.git`, ngày7/10; giữ chờ xác nhận chủ sở hữu/quyền xóa. |
| `artifacts/reports/ui-audit-2026-10-28/` | Giữ bằng chứng audit gốc local; có thể chứa thông tin cá nhân. |
| `artifacts/reports/ui-refinement-2026-10-28/` | Giữ baseline bất biến, ảnh, log, review nhóm và bằng chứng cuối local. Có baseline-public và fixture foundation/dialog-app; không phải worktree sót. |
| `.codex-tmp/` | Giữ bằng chứng migration/pilot/auth/recovery/pre-sync cũ. Không tự mở rộng quyền dọn task sang nội dung lịch sử. |
| `test-results/`, `prototypes/motion-review.html` | Bằng chứng test/design lịch sử, không phải phần sót mới tạo của task; giữ nguyên. |
| `.impeccable/critique/` | Snapshot critique đã review và commit, được giữ có chủ đích. |

Không xóa, di chuyển hoặc clean đệ quy thư mục nào. Thư mục lân cận không liên quan chỉ được xem tên, không kiểm nội dung. Ba bản sao ngoài repo là ứng viên dọn, chưa chứng minh có thể hủy an toàn.

## Việc còn lại và quyết định cần chốt

1. Deferred: follow-up thị giác homepage vẫn là đề xuất/chưa triển khai. Phạm vi mới nhất không gồm dashboard/admin/auth. Đóng hồ sơ không có nghĩa chấp nhận hình thức homepage hiện tại; chỉ tiếp tục khi người dùng giao riêng.
2. Blocked: lệch migration/source của API và xác minh provider-success thật chưa giải quyết; đóng hồ sơ không đổi thành pass hay cấp quyền sửa/phát sinh chi phí provider.
3. Quyết định dọn: người dùng cần chọn xóa hay giữ ba bản sao kiểm chứng ngoài repo đã nêu. Trước khi xóa phải xác nhận ownership/nội dung và đích junction.
4. Quyết định runtime: web3020 sở hữu được giữ theo quy tắc trước để người dùng xem. Người dùng có thể yêu cầu dừng; không dừng process không rõ chủ.

## Bước tiếp theo

Không tiếp tục triển khai dưới task đã đóng này. Báo ba thư mục ngoài repo và lựa chọn giữ/dừng runtime cho người dùng. Giữ nhánh, bằng chứng và trạng thái Blocked/Deferred rõ ràng; không ngầm phát hành.
