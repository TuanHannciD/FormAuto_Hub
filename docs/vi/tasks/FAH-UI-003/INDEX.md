# FAH-UI-003 — đánh giá tinh gọn UI sau đăng nhập

Ngày: 2026-11-03. Người dùng đã nghiệm thu báo cáo ảnh, duyệt rà/tinh gọn trang user còn lại, dọn task và merge local. Đã triển khai U1–U3; đang kiểm tra/review cuối và tích hợp. [Sổ hiện tại](PROGRESS.md). Người dùng tự push/deploy.

> Phần dưới là lịch sử đánh giá/lập kế hoạch; quyền triển khai và bằng chứng runtime mới trong PROGRESS thay thế các trạng thái chờ duyệt/Blocked ở giai đoạn đó.
## Quyền và kết quả cần đạt

Người dùng yêu cầu bố cục bớt to, giảm chữ thừa/khó hiểu và tối ưu thứ tự đọc trên điện thoại. Sau đó mở rộng ra mọi trang user/admin sau đăng nhập, ưu tiên Tự động hoá biểu mẫu vì dùng thường xuyên, và duyệt bước đánh giá/đề xuất.

Phần đánh giá đã duyệt: khảo sát mã nguồn, đánh giá độc lập có giới hạn, điều tra runtime giả lập cục bộ và cặp đánh giá/brief. “Approved next step” mới nhất chấp nhận hướng thiết kế đã trình bày và cho lập kế hoạch triển khai. Chưa duyệt thực thi kế hoạch chưa có lúc đó, phương án disclosure/sticky còn mở, sửa sản phẩm, commit, push, merge hay deploy.

Đầu ra: [đánh giá và brief thiết kế](AUDIT.md), bao phủ 18 route sau đăng nhập, popup tài khoản/chi tiết dùng chung và hai route kết quả PayOS liên quan. Không thiết kế lại trang chủ/SEO/đăng nhập/đăng ký.

Đầu ra mới: [kế hoạch triển khai](PLAN.md), T0–T8 có ownership file, interface, gate tái hiện, kiểm regression/browser và review. Dùng `writing-plans`; bước này chưa chạy skill triển khai/tạo worktree/khởi động runtime. Khuyến nghị làm inline kèm review độc lập có giới hạn; chưa chọn cách thực thi thay người dùng.

## Snapshot và quyền sở hữu

- Workspace: `D:/TinHoc/FormAuto_Hub`, nhánh `main`, base `817bdee8519e7cc658794d99f52171d60ebb36a8`; sạch lúc bắt đầu. Không đổi mã nguồn sản phẩm.
- Root tổng hợp và viết tài liệu song ngữ. Giữ bằng chứng ignored/untracked hiện có; không suy ra quyền dọn dẹp.
- Skill: Brainstorming làm rõ ý định/ranh giới thiết kế, Impeccable đánh giá cấu trúc, UI UX Pro Max tra cứu UX cụ thể, contract guard bảo vệ luồng nghiệp vụ, verification-before-completion báo cáo theo bằng chứng.
- Kiểm catalog model trước dispatch. Agent con có context riêng, không tạo agent lồng nhau.

| Agent con | Model / reasoning thực tế | Phần phụ trách / kết quả |
| --- | --- | --- |
| `/root/forms_deep_audit` | `gpt-6.1-sol` / `high` | Đọc trọn nguồn/components/tests của forms; không ghi file |
| `/root/surface_inventory_audit` | `gpt-6.1-sol` / `medium` | Kiểm kê 18 route và UI dùng chung; không ghi file |
| `/root/audit_fixture_runtime` | `gpt-6.1-sol` / `medium` | Chuẩn bị helper/bằng chứng giả lập trong artifacts của task; startup Blocked |
| `/root/proposal_review` | `gpt-6.1-sol` / `medium` | Review độc lập brief song ngữ/an toàn/bằng chứng; không blocker; đã xử lý hai góp ý diễn đạt chính xác |

Tất cả tuân thủ giới hạn chỉ Sol. Hai lượt sơ bộ trước đó trong hội thoại dùng `gpt-6.1-sol` / `medium` và `low`; kết quả detector bốn tệp cũ được thay bằng lượt quét rộng hiện tại.

## Bằng chứng và tài nguyên

Artifacts cục bộ: `artifacts/reports/ui-cleanup-2026-11-02/`. Gồm helper API giả lập, script khởi động **chưa chạy**, hồ sơ sở hữu runtime và HTML minh hoạ bố cục. Đây là artifacts đánh giá, không phải route sản phẩm hoặc bằng chứng tích hợp.

- Web/API dự kiến: `http://127.0.0.1:3035` / `http://127.0.0.1:3036`; chỉ dữ liệu giả, không DB/tài khoản/provider thật.
- Kiểm tra phê duyệt tự động từ chối lệnh khởi động process ẩn: `blocked by policy`; không cung cấp lý do khác. Không được đổi wrapper để vượt lần từ chối này.
- Agent runtime đã xác minh không tạo listener/process cho hai origin; không có runtime do task sở hữu cần dừng.
- Công cụ T3 preview có sẵn. Mở `http://localhost:3020/dashboard/forms` lỗi `Preview automation open failed: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3020/dashboard/forms`.
- Chưa có ảnh app hiện tại, overlay detector trực tiếp, thao tác browser sau đăng nhập hoặc kiểm tra thiết bị thật. Ảnh/tests lịch sử chỉ là tham khảo có ngày, không phải phép đo hiện tại.
- HTML minh hoạ chỉ là đề xuất; preview của nó không xác minh app.

## Sổ kiểm chứng

| Trạng thái | Phạm vi / bằng chứng |
| --- | --- |
| Verified | Kiểm kê route/nguồn hiện tại; assessor đọc trọn forms page, tám component cục bộ, helpers/types/constants và tests direct/AI/error liên quan |
| Verified | `node .agents/skills/impeccable/scripts/detect.mjs --json apps/web/app/dashboard apps/web/app/admin apps/web/components`: exit 0, `[]`; quét regex không chứng minh chất lượng UX sau render |
| Verified | Không process/listener trên 3035/3036 sau startup bị từ chối, ghi trong `runtime-ownership.json` |
| Blocked | Khởi động app giả lập, từ đó chưa đo hình học/tương tác browser hiện tại; kiểm tra tự động từ chối startup |
| Failed | T3 `preview_open` tới localhost3020 đang không chạy: connection refused; chưa phải kết luận lỗi sản phẩm |
| Not run | Build/lint/regression: không đổi mã sản phẩm; nguồn test hiện có mô tả kiểm tra cần giữ, không phải bằng chứng pass hiện tại |
| Not run | Tích hợp API/DB/auth/Google/AI/PayOS thật; không cần cho đề xuất nguồn và không có quyền gọi provider |
| Verified | `python artifacts/reports/ui-cleanup-2026-11-02/verify-docs.py`: kiểm sáu tài liệu song ngữ, UTF-8, link tương đối, inventory18 route, checkbox/mã task kế hoạch khớp và không đổi nguồn sản phẩm; kết quả tại `artifacts/reports/ui-cleanup-2026-11-02/verification.json` |
| Verified | HTML minh hoạ được `html_preview` kiểm ở 728px và 390px; không lỗi console. Chỉ xác minh artifact đề xuất, không phải hành vi app |

Kết quả review: reviewer độc lập không thấy blocker về quyền/an toàn/song ngữ. Đã sửa F02 để phân biệt link bước 3 Quy tắc thiếu anchor với bước 4 disabled, và thay tham chiếu kiểm chứng mơ hồ bằng checker/artifact cụ thể. Chưa review hoặc duyệt triển khai sản phẩm.

Tự review kế hoạch: F01–F10 ánh xạ T1–T7; đủ owner cho18 route/tài khoản/ranh giới thanh toán. Interface giữ props hiện tại; kế hoạch không thêm mã sản phẩm/API. Review độc lập đánh giá ở trên áp dụng AUDIT, chưa phải review độc lập PLAN. Giữ toàn bộ artifacts/nguồn hiện có.

## Bước tiếp theo

Người dùng xem PLAN và chọn inline hoặc agent con theo từng task. Sau duyệt làm T0, giải quyết runtime qua đường được phép và ghi snapshot/ownership thực tế; không vượt startup đã bị từ chối. Chưa chọn phase toàn cục hay phát hành. Tách sửa hành vi với trình bày, đặc biệt điều hướng bước, binding số lượng và xử lý trạng thái gửi.
