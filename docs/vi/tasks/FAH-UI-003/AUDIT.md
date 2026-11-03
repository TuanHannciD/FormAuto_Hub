# Đánh giá UI sau đăng nhập và brief thiết kế đề xuất

Ngày: 2026-11-02. Lưu đánh giá ban đầu và brief thiết kế đã duyệt; hiện đã có quyền triển khai. [Thực thi/bằng chứng hiện tại](PROGRESS.md). Các phát hiện dưới đây mô tả bản trước thay đổi.

## Ý định và mức bằng chứng

Giúp người dùng thường xuyên cấu hình, kiểm tra và gửi phản hồi biểu mẫu được phép với ít chữ phải đọc và ít cuộn thừa, đặc biệt trên điện thoại. Admin cần tìm đúng bản ghi và cấu hình để xử lý mà không phải đi qua nhiều lời giải thích chung. Giữ UI vận hành, tiếng Việt, token ngữ nghĩa, component dùng chung và hành vi sản phẩm hiện có.

Phương pháp: hai lượt đọc nguồn độc lập bởi `/root/forms_deep_audit` và `/root/surface_inventory_audit`, sau đó root tổng hợp và quét detector. Chưa xem app render hiện tại: startup runtime Blocked, localhost3020 từ chối kết nối. Đây là đánh giá nguồn và brief đề xuất, không phải chứng nhận thị giác/heuristic hoàn chỉnh. Chưa có cơ sở chấm điểm usability hay cam kết phần trăm giảm cuộn.

Tra cứu UI UX Pro Max có kết quả phù hợp về Mobile First, xử lý nội dung dài và vị trí trợ giúp nhất quán. Truy vấn hiển thị chi tiết theo nhu cầu cùng một lần thử lại không tìm được kết quả phù hợp; khuyến nghị đó dựa vào hướng dẫn giảm tải nhận thức của Impeccable, không được trình bày là kết quả tra cứu dữ liệu.

## Phát hiện theo mức ảnh hưởng

Ưu tiên là thứ tự công việc đề xuất, không phải mức sự cố production. Cấu trúc nguồn đã xác minh; ảnh hưởng sau render vẫn cần đo.

| ID | Ưu tiên | Bằng chứng và ý nghĩa | Hướng xử lý đề xuất |
| --- | --- | --- | --- |
| F01 | 1 | `dashboard/forms/page.tsx` mở toàn bộ trình chỉnh quy tắc sau phân tích; `RuleEditor` lặp nhiều lớp viền, metadata và cấu hình ở mỗi câu. Summary chi phí nằm sau toàn fieldset khi dưới `xl`. Form dài lặp cấu trúc này nhiều lần. | Giảm lớp trang trí, đưa chi phí/số dư quan trọng cạnh hành động, giúp quét từng câu nhanh. Ban đầu giữ mặc định mở; đổi mặc định cần duyệt tương tác riêng. |
| F02 | 1 | Sau phân tích, bước 3 Quy tắc liên kết tới `#workflow-step-3` không tồn tại; anchor đó chỉ có ở AI. Bước 4 thường disabled vì Quy tắc không có preview. Tính bước hiện tại chưa phản ánh direct-command/đang gửi. | Sửa ánh xạ bằng state hiện có, review riêng như sửa hành vi; không tạo lifecycle job mới. |
| F03 | 1 | Ô số lượng chỉ có đoạn văn trước Input, chưa có label liên kết (`forms/page.tsx`, `AiModePreparationPanel`). AI ghi “chi phí thật sẽ là” dù tạo một phần chỉ thu bản hợp lệ đã lưu. | Liên kết label/mô tả; gọi mức ước tính là “Chi phí dự kiến”; tách số thực thu theo kết quả đã xác nhận. |
| F04 | 1 | `WorkflowSummary` nhận `directRequestedCount ?? previewCount` cả ở AI; số yêu cầu direct cũ có thể còn sau đổi chế độ. | Tái hiện direct→AI, xác định binding đúng theo chế độ trước khi sửa. Lỗi tiềm năng có cơ sở nguồn, chưa chứng minh lỗi runtime. |
| F05 | 1 | Banner AI, thanh tạo, summary, header/badge preview và nhắc chỉ đọc lặp giải thích. Preview có hai tầng đóng/mở; nhãn câu hỏi bị cắt và vùng cuộn bên trong không có tên. | Một giải thích ở điểm quyết định; số bản xem trước/trạng thái chỉ đọc rõ; nhãn đọc được và vùng cuộn có tên/focus. Giữ xem trước và xác nhận tường minh. |
| F06 | 2 | `BaseTable` đã có bản ghi mobile; sáu cột trở thành sáu dòng nhãn/giá trị mỗi bản ghi. Tổng quan user xếp bốn chỉ số dọc dưới `sm`, khác hai cột của admin. | Thiết kế tóm tắt mobile theo loại bản ghi, vẫn truy cập đủ trường; kiểm hai cột chỉ số với số dài. Không kết luận bảng desktop rộng cố định gây tràn mobile. |
| F07 | 2 | `admin/page.tsx` luôn có giải thích backend/webhook màu vàng; doanh thu có placeholder lớn, filter/export vô hiệu và chữ gợi ý sắp có hoàn tiền/thuê bao/provider. Shell có nút thông báo/trợ giúp chưa hoạt động và tìm kiếm disabled. | Tách ngoại lệ thật với trợ giúp, giảm diện tích tính năng chưa dùng được, bỏ hứa hẹn tương lai chưa duyệt. Không xây chức năng còn thiếu trong task dọn UI. |
| F08 | 2 | NCKH workspace có input mô hình/biến/ánh xạ dựa vào placeholder; canvas cao cố định 520px, các panel bên cạnh xếp dọc. | Có nhãn thường trực, ưu tiên từng tác vụ/tab. Đo canvas/bàn phím trước khi đổi hình học hay tương tác. |
| F09 | 2 | Menu mobile tự dựng thiếu focus trap/trả focus, Escape và trạng thái mở trên nút kích hoạt trong `ShellLayout`. | Kiểm bàn phím thực và đặt tiêu chí điều hướng truy cập được. Khi triển khai tái dùng primitive chung phù hợp. |
| F10 | 3 | Mô tả lịch sử lặp cơ chế phân trang/filter; thống kê AI user lẫn “generation”, “runs”, “Previews”, “Provider” và tên thời gian mơ hồ. Một số lỗi yêu cầu tải lại cả trang hoặc thiếu retry. | Tiếng Việt theo tác vụ, phân biệt thời điểm/thời lượng và tổng trong trang. Thử đọc lại an toàn, không tự lặp write. |

Nền tảng nên giữ: control chính phù hợp chạm mobile (44px), shell giới hạn chiều rộng, bảng/bản ghi mobile dùng chung, focus của dialog, nhiều trang đã phân biệt loading/error/empty và tests bảo vệ direct/AI. Không thu nhỏ toàn bộ control/font.

## Bố cục biểu mẫu đề xuất

**Hướng đã duyệt để lập kế hoạch:** tổ chức lại thứ bậc và bỏ lặp trong thiết kế hiện tại. Chỉ chỉnh khoảng cách sẽ còn trùng thông tin; thay toàn bộ phong cách tạo thêm phạm vi không cần thiết.

Desktop: tiêu đề gọn → điều hướng đúng nhánh đang chọn → cột cấu hình và cột summary hẹp hiện có. Giữ thương hiệu/token/control chung. Gom metadata biểu mẫu, ưu tiên tên và số câu hỗ trợ; tên nội bộ/ngày/mã kỹ thuật đặt trong chi tiết có thể mở. Cách tạo và hệ số credit nằm cạnh nhau. Giảm container lồng cho từng câu hỏi.

Mobile: một cột; làm rõ bước hiện tại và vẫn tới được các phần khả dụng khác. Dễ tìm biểu mẫu đang làm, chế độ và hành động tiếp theo. Đặt số lượng, chi phí dự kiến và số dư cạnh hành động thay vì chỉ có ở cuối trang. Trình chỉnh câu hỏi mở vẫn đủ chiều ngang, nhãn dễ đọc.

Hành động: mỗi giai đoạn có hành động chính rõ. Vùng sticky phải được đo trên màn hình thấp và khi focus input; tránh thêm thanh cố định mới. Đợt trình bày đầu giữ mặc định accordion hiện tại. Mặc định đóng câu hỏi, tự thu biểu mẫu sau phân tích hoặc nhớ trạng thái mở qua lần truy cập là **phương án tương tác đề xuất**, chưa phải yêu cầu đã duyệt.

Quy tắc: giữ một hành động **Tạo và gửi ngay** và lời nhắc gọn rằng thao tác gửi trực tiếp. Không preview, checkbox hay xác nhận thứ hai. Khi chưa rõ kết quả có hành động riêng “Kiểm tra kết quả gửi” cho đúng command cũ.

AI: giữ hướng dẫn → tạo bản xem trước đã lưu → kiểm tra → xác nhận tường minh → gửi. Dùng “Hướng dẫn chung” nhất quán; dễ tìm hướng dẫn từng câu khi tùy chỉnh. Giữ AI preview chỉ đọc, bảo vệ stale và điều kiện xác nhận hiện có; không thêm điều kiện phải mở mọi preview. Tóm tắt kết quả gọn trước đáp án/log chi tiết.

## Quy tắc chữ và ví dụ

Mỗi câu cần giúp nhận biết trạng thái, quyết định, hành động hoặc tránh sai sót cụ thể. Giữ chi phí, giới hạn, hậu quả, trạng thái chờ/chưa rõ và cách khôi phục ngay tại chỗ. Giải thích chung/ví dụ/mã kỹ thuật chuyển vào chi tiết có tên rõ, không giấu lỗi hoặc trường thiết yếu. Trợ giúp có vị trí tương đối nhất quán.

| Ví dụ hiện tại | Chữ / cách xử lý đề xuất |
| --- | --- |
| `Prompt chung` | `Hướng dẫn chung` |
| `Điền prompt` | `Điền gợi ý hướng dẫn`; giải thích một lần: `Miễn phí; lưu khi tạo bản xem trước.` |
| `Lưu và tạo AI preview` | `Lưu và tạo bản xem trước AI` |
| `chi phí thật sẽ là 6 credit` | `Chi phí dự kiến: 6 credit. Chỉ trừ cho bản xem trước hợp lệ đã lưu.` |
| `Preview hiện có` | `Bản xem trước hiện có` |
| Giải thích khôi phục direct command | `Chưa xác định kết quả gửi. Kiểm tra lại kết quả; hệ thống không tự động gửi lại.` Giữ mã lệnh trong chi tiết truy cập được. |
| Giải thích phân trang lịch sử lặp | Bỏ phần lặp; giữ phân biệt `Credit trong trang` với tổng toàn thời gian. Không đổi filter mặc định lịch sử sử dụng. |
| `Cảnh báo webhook/payment` kèm giải thích backend chung | Đưa cơ chế xác minh vào trợ giúp; hiển thị trạng thái thanh toán thật bằng trường hiện có. Không suy ra nhóm “cần đối soát” mới. |
| Hoàn tiền/thuê bao/provider “đang cập nhật” | Bỏ ngụ ý cam kết; không kích hoạt khả năng Deferred. |

## Bao phủ toàn bộ giao diện và thứ tự đề xuất

Mọi dòng đã được đánh giá nguồn. Từng route cần bằng chứng browser hiện tại phù hợp trước nghiệm thu triển khai. Nhóm là thứ tự công việc, không phải phase mới.

| Nhóm | Route / bề mặt | Trọng tâm đề xuất |
| --- | --- | --- |
| A | `/dashboard/forms` | Cao nhất: thứ bậc, lặp chữ, chi phí, mật độ câu hỏi, preview/kết quả; tách sửa stepper/count |
| A | Shell/control/bảng/alert/menu tài khoản chung | Rút pattern từ forms; đánh giá mọi consumer trước sửa chung |
| B | `/dashboard/top-up` | Gói đã chọn, số tiền và hành động thanh toán trước; lịch sử/chi tiết sau, giữ đủ giá và chứng từ |
| B | `/dashboard/top-up/[id]` và popup chi tiết chung | Tái dùng cùng nội dung chi tiết gọn; giữ quyền sở hữu/lỗi/retry/đường quay lại |
| B | Popup hồ sơ/bảo mật tài khoản | Nhóm trường theo việc; giữ nhãn, trả focus, ngữ nghĩa mật khẩu/Google/bảo mật |
| B | `/admin/manual-credits` | Người nhận, số lượng, lý do, chứng từ và quyết định; không giấu dữ kiện cần để duyệt |
| B | `/admin/packages` | Danh sách/editor gọn; giữ validation và xác nhận lưu |
| B | `/admin/payos-settings` | Tách cảnh báo lưu khóa khỏi trợ giúp URL/setup, giữ nghĩa để trống khóa |
| B | `/admin/ai-provider-settings` | Kết nối/model/khóa trước; giữ chặn ghi khi chưa xác minh lần đọc và lỗi cấu hình |
| C | `/dashboard/nckh` | Trạng thái liên kết/nhập/danh sách, hướng dẫn gọn và thứ bậc danh sách |
| C | `/dashboard/nckh/forms/[formId]` | Nhãn, tab, canvas/panel/dialog; giữ hợp đồng dữ liệu/mô hình/xóa |
| C | `/dashboard/nckh/callback` | Tiến trình/lỗi liên kết rõ và quay lại an toàn; không đổi OAuth |
| D | `/dashboard` | Ưu tiên số dư/hành động; chỉ số và trạng thái trống/gần đây gọn |
| D | `/dashboard/usage-logs` | Bộ lọc và bản ghi có ích sớm hơn; ít chữ, giữ filter mặc định/phân trang |
| D | `/dashboard/credit-transactions` | Sổ credit/bộ lọc dễ đọc; giữ nghĩa dấu/số dư/tham chiếu |
| D | `/dashboard/ai-usage` | Chỉ số, chế độ, thời điểm/thời lượng và lỗi rõ |
| D | `/admin` | Chỉ số/thanh toán gần đây có ích trước; phân biệt trạng thái thật với hướng dẫn thường trực |
| D | `/admin/payments` | Bộ lọc, tóm tắt/chi tiết bản ghi gọn và khôi phục lần đọc an toàn |
| D | `/admin/revenue` | Ưu tiên tổng hiện có; giảm diện tích biểu đồ/export/filter chưa dùng được |
| D | `/admin/ai-usage` | Tổng quan/bộ lọc lịch sử gọn, thuật ngữ vận hành rõ |
| Liên quan | `/payment/payos/return`, `/payment/payos/cancel` | Đã đọc nguồn liên quan; chỉ nhất quán chữ/bố cục và quay lại tiến trình form. Trạng thái query không chứng minh credit đã quyết toán. |

## Tiêu chí mang sang triển khai

Chụp trạng thái trước/sau bất biến với cùng dữ liệu giả lập và viewport. Đo chiều cao trang, khoảng cách dọc tới hành động/bản ghi đầu tiên có ích và số lần nhấn để làm cùng một việc. Chỉ đặt mục tiêu giảm sau khi có baseline thật; chưa duyệt tỷ lệ phần trăm tùy ý. Trang ngắn hơn chưa đủ chứng minh hoàn thành tác vụ tốt hơn.

- Chiều rộng: 320, 390, 430, 768 và 1366/1440 CSS px; có màn mobile thấp, tên/nhãn dài, số dư lớn và zoom desktop. Viewport giả lập không phải thử thiết bị thật.
- Câu hỏi: bộ dữ liệu 1, 10 và 30 câu đại diện lựa chọn/văn bản/checkbox/ngày/giờ; đây là dữ liệu test, không đặt giới hạn số câu hỏi mới. Số phản hồi vẫn 1–100.
- Chạm: hành động chính tối thiểu 44px trên mobile; kiểm vùng chạm phụ. Giữ chữ dễ đọc, tương phản, focus rõ và bàn phím; không giảm toàn bộ font để đạt mật độ.
- Shell/dialog: lớp menu/popup, nền/focus, Escape, trả focus, zoom, giảm chuyển động và sticky không che trường focus. Không tràn ngang toàn trang; bảng/canvas có tên có thể cuộn khi phù hợp.
- Hiểu nội dung: người mới nhận ra bước tiếp theo; người dùng thường xuyên không phải đọc lại hướng dẫn chung. Không tuyên bố user study thành công khi chưa có người dùng được quan sát.

| Trạng thái / tình huống | Bằng chứng cần đạt |
| --- | --- |
| Ban đầu / đang phân tích / lỗi / không có câu hỗ trợ | Trạng thái rõ, URL có nhãn, chưa cho gửi trước phân tích hợp lệ; câu của URL cũ không còn sau phân tích URL mới lỗi |
| Quy tắc hợp lệ / ngày-giờ sai / thiếu Web Locks | Một hành động trực tiếp; lỗi gần trường; không có khóa thì không write direct |
| Quy tắc nhấn đôi / hai tab / reload / kết quả chưa rõ | Giữ đúng command/count theo tài khoản; không tạo/thu/gửi mới hay replay không an toàn |
| Quy tắc một phần / kết quả lẫn | Tách số yêu cầu, đã nhận, thành công, thất bại; số thiếu vì credit không gọi là gửi lỗi |
| Chuyển direct→AI | Summary phản ánh đúng chế độ; kiểm binding count mà không đổi hợp đồng tiếp nhận |
| AI profile đang tải / 404 / lỗi | Giữ kiểm chứng lần đọc; 404 dùng mặc định, lỗi giữ draft và chặn write; retry chỉ đọc |
| AI tạo được / Partial / Failed | Số tạo và credit thực tế rõ; không lộ provider payload hoặc hứa tạo đủ |
| AI đã thu phí nhưng GET preview lỗi | Giữ ID/chi phí; chỉ tải lại, không tự tạo lại |
| AI stale / chưa xác nhận / đã xác nhận | Giữ điều kiện stale/reset hiện có; gửi đúng ID với xác nhận tường minh; không thay bằng route direct |
| Thiếu credit / nạp / tiếp tục | Giữ preview cũ, phí thực và ngữ cảnh tiếp tục; không tự lặp thanh toán/tạo/gửi |
| Đang gửi / tạm dừng / kết thúc / chưa rõ | Chỉ hành động đang hỗ trợ, kết quả/khôi phục an toàn; không thêm resume/polling/ETA |
| Danh sách/cấu hình/tài khoản/NCKH | Phân biệt loading/empty/error/success và quyền; payload/persistence đúng nếu sau này sửa |

Tests hiện có bảo vệ tự động hoá, replay/lock direct, khôi phục lỗi, shell gọn, viewport nạp, bản ghi/cấu hình admin và NCKH. Chỉ điều chỉnh test cho trình bày đã duyệt, không nới để che regression. Chạy build/lint/auth/browser phù hợp, khởi động lại runtime bị sửa do task sở hữu; báo đúng mức mock và API/DB. Phải review độc lập nếu chạm an toàn gửi, credit/thanh toán hoặc auth.

## Ranh giới và quyết định còn mở

Không thêm API/DTO/entity/status/event, persistence, provider, cách thu phí, hoàn tiền, background job hoặc chính sách gửi. Giữ tuần tự nhóm 10, 1–100 phản hồi, quyền, CreditTransactions/UsageLogs/SubmissionLogs và phân biệt core/NCKH. Không thiết kế lại trang công khai hoặc kích hoạt roadmap Deferred.

Assumption: giữ nhận diện hiện tại và kích thước chạm chính. Đưa người dùng xem: gom metadata/trợ giúp, khối câu hỏi nhẹ hơn, chi phí gọn cạnh hành động và bản ghi tóm tắt có đủ chi tiết truy cập được. Chưa chốt: đổi mặc định đóng/mở hoặc thiết kế lại sticky. Đo hình học runtime và baseline thao tác thực vẫn Blocked.

Bước tiếp theo: xem PLAN đã chuẩn bị và chọn cách thực thi. Kế hoạch bắt đầu baseline runtime, rồi forms và ảnh hưởng consumer chung. Giữ sửa hành vi F02/F04 thành task riêng có thể review sau tái hiện; không trộn ngầm vào chỉnh khoảng cách.

## Cập nhật bằng chứng triển khai

[PROGRESS](PROGRESS.md) ghi triển khai cục bộ, regression fixture, review độc lập, đối chiếu61ảnh và trạng thái AI đã lưu chỉ-sau. Phát hiện nguồn ở trên lưu bản đánh giá trước thay đổi; giới hạn thiếu baseline AI preview/kết quả và zoom/tích hợp thật vẫn được nêu rõ.
