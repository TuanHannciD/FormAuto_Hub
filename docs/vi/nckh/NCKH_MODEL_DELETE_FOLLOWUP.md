# NCKH_MODEL_DELETE_FOLLOWUP

## Phạm vi

2026-10-08: user duyệt hoàn thiện xác nhận xóa model và kiểm thử các trường hợp. Không thêm phase global/NCKH, route API, DTO, trường database, migration, quyền Google hay integration. Giữ quyền sở hữu và quy tắc FK hiện có. Follow-up này thay thế khoảng thiếu xác nhận đã ghi tại `../UI_CREDIT_FOLLOWUP_SYNC.md`.

User nghiệm thu: user đã thử popup và xác nhận khá ổn, sau đó duyệt rà soát cuối, đồng bộ doc, commit local và merge vào `main`. Request đó chưa duyệt push/deploy.

## File và tác dụng

| File | Tác dụng |
|---|---|
| `apps/web/app/dashboard/nckh/forms/[formId]/_components/delete-model-dialog.tsx` | GET tác động mới theo owner; số lượng sáu nhóm; nhập tên chính xác; kiểm tra lại tên/form sinh; tải/lỗi/tải lại; không tự gửi lại; chặn đóng khi đang xóa; dialog/animation/style chung; đầu/cuối cố định, thân cuộn |
| `apps/web/app/dashboard/nckh/forms/[formId]/page.tsx` | Mở pop-up model, nhãn nút xóa, khóa thao tác sửa khác khi xác nhận, chỉ bỏ model đã xóa khỏi UI và giữ model khác đang chọn |
| `apps/web/components/dialog.tsx` | Tùy chọn `dismissible` mặc định true; khi false bỏ qua Escape/bấm nền trong lúc xóa; tùy chọn `onAfterClose` chạy sau khi hủy hoặc đóng bằng state để giải phóng khóa workspace; popup khác giữ hành vi |
| `src/FormAutoHub.Api/Services/Nckh/ResearchModelService.cs` | Đọc bằng split query tránh nhân số hàng giữa các nhóm; dọn vị trí canvas/quan hệ trước model trong một SaveChanges; bảo vệ FK form sinh trả Conflict hiện có trước khi sửa dữ liệu |
| `tests/FormAutoHub.Tests/NckhPhase2ModelApiTests.cs` | Thêm bốn case service: dọn canvas Draft/Active, sai owner/không tồn tại, bảo vệ form sinh và xóa lặp |
| `apps/web/tests/nckh-delete-model.spec.ts` | Mười lăm case browser dùng phản hồi API fixture |
| `apps/web/tests/nckh-delete-live.spec.ts` | Test browser SQL/API thật bật riêng qua state runtime dùng một lần |
| `apps/web/tests/nckh.spec.ts` | Cập nhật regression hủy xóa model cho popup mới; ánh xạ vẫn dùng xác nhận chung |
| Contract guide, progress ledger, báo cáo UI follow-up và báo cáo này theo cặp | Đồng bộ hành vi hiện tại và validation AI/VI |

## Luồng người dùng

Mở xóa → tải model và variables/mappings/relations/positions/responses/dataset qua GET hiện có → hiển thị số lượng và cảnh báo xóa vĩnh viễn → nhập đúng tên mới được xóa → kiểm tra lại tên/form sinh → DELETE → đóng và bỏ model khỏi UI.

Số lượng phân trang dùng `totalItems` với pageSize=1, không dùng độ dài trang đầu. Positions dùng độ dài danh sách đầy đủ. Nêu rõ nhật ký thu thập cũng bị xóa; không bịa số lượng vì chưa có API liệt kê log hiện có. Không xóa form nhập gốc/câu hỏi hoặc dữ liệu trên Google.

Model được form sinh tham chiếu giữ Restrict FK hiện có: popup giải thích việc chặn; backend trả 409 theo định dạng lỗi hiện có. Không gỡ liên kết hoặc xóa form sinh. Hủy/Escape/bấm nền không gửi DELETE; vô hiệu các thao tác đó khi đang có lệnh xóa chờ kết quả. Lỗi ghi cần tải lại/xác nhận chủ động; không tự gửi lặp.

## Verified

- Bộ backend Release: 158 đạt, không skip; gồm 12 test service model. Vẫn có cảnh báo NU1603 resolve package Google Forms đã tồn tại.
- Build frontend production mirror mới, TypeScript và kiểm tra token màu đạt. Browser production chạy 3021 từ source cập nhật; route fixture chỉ có trong mirror.
- Bộ browser liên quan: 59 đạt (NCKH, xóa model, dialog chung). Case mới gồm tên sai/trống/hoa/dấu/khoảng trắng, số lượng vượt một trang, tải, lỗi một phần/tải lại, số lượng không hợp lệ, Hủy/Escape/bấm nền/mở lại, kết quả tải muộn, đổi tên/sinh form trước DELETE, 404/409/500, bấm lặp/chặn đóng khi chờ, model rỗng, 320px/reduced motion, giữ model khác đang chọn.
- Test browser API thật bật riêng: đạt với SQL Server/database riêng và API 7040, UI production 3021. Số lượng mới khớp biến/ánh xạ/quan hệ/vị trí/response/dataset đã lưu; DELETE xác thực trả 204, GET tiếp theo 404 và form nhập còn 200. Không có page error.
- Harness HTTP/SQL: migration sạch; 401 chưa đăng nhập, 404 sai owner/không tồn tại, 409 form sinh, 204 model đầy đủ, 404 xóa lặp, 204 Active rỗng. Query xác minh bảy nhóm dữ liệu phụ thuộc đã xóa và giữ owner/model/form nhập/form sinh không liên quan.
- Bật trigger có chủ đích trong DB thử nghiệm gây lỗi SQL Server OUTPUT/trigger (HTTP 500). Model, biến, ánh xạ, quan hệ, vị trí, responses, datasets và logs còn nguyên sau rollback; bỏ trigger thử nghiệm thì xóa thành công. Đây là lỗi test được tạo chủ động, không thay schema/trigger production.
- Đã xem screenshot popup desktop/mobile; footer mobile nằm trong màn hình. Đã đọc log: chỉ lỗi SQL được tạo chủ động là dự kiến; stderr preview sạch.
- API local chính đã build/restart trên 7039: health và danh sách model NCKH có xác thực trả 200, log sạch. UI source 3020 cũng đạt case browser fixture xóa chính. Dọn SQL/API kiểm chứng tạm; app local chính vẫn mở.

## Rà soát cuối

Rà soát cuối tái hiện thiếu bước dọn trạng thái sau thành công: popup đóng bằng state nhưng thao tác của model còn lại vẫn bị vô hiệu. `onAfterClose` nay giải phóng trạng thái chờ sau animation đóng cho cả thành công và hủy. Assertion browser fixture và API thật kiểm tra nút xóa model còn lại được mở lại sau thành công; không đổi API xóa hoặc quy tắc database.

Gate cuối sau sửa: 158 test backend, 9 test auth và build frontend production/TypeScript/token màu đạt. Bộ browser toàn bộ: 97 đạt, bỏ qua hai case tích hợp bật riêng; case browser SQL/API NCKH đã chạy riêng và đạt với assertion mở khóa mới. Kiểm tra xóa HTTP/SQL, owner/bảo vệ FK và rollback lỗi chủ động đạt lại. Audit doc: 213 file Markdown, 75 cặp AI/VI, UTF-8 và đích liên kết Markdown hợp lệ; đã đối chiếu tham chiếu source và ý nghĩa contract được sửa ở bốn cặp thay đổi. Không chạy lại test live credit thủ công bật riêng tại lần rà NCKH cuối này; bằng chứng trước vẫn ghi trong báo cáo UI/credit.

## Giới hạn và Deferred

- Số lượng tại lúc đọc từ nhiều GET, không phải snapshot transaction hoặc token xác nhận bắt buộc trên server. Nhập tên là bảo vệ frontend; DELETE hiện có không thêm body. Vẫn có khoảng thời gian nhỏ cho thay đổi đồng thời sau GET cuối; lỗi FK rollback thay vì xóa dở dang.
- Không thêm luồng gỡ liên kết/xóa form sinh. Không xóa model/database production để test.
- Not run: deploy/push, Google thật, stress đồng thời nhiều tab thật, luồng provider ngoài. Không claim kiểm thử mọi lỗi hạ tầng có thể xảy ra.
- Bước tiếp: hoàn tất commit/merge local đã duyệt; push/deploy hoặc contract phiên bản/xác nhận phía server sau này cần request/review có phạm vi riêng.
