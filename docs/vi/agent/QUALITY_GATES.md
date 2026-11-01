# Kiểm chứng, browser testing, review và Done

Dùng `verification-before-completion` trước khi tuyên bố kết quả. Ca nghiệp vụ ở [TESTING_STRATEGY](../TESTING_STRATEGY.md); quyền và ownership tài nguyên ở [execution rules](EXECUTION_RULES.md).

## Bằng chứng và hoàn tất

- `Verified`: đã chạy và đạt đúng target/scope; `Failed`: đã chạy và thất bại.
- `Not run`: chưa chạy, có lý do; `Blocked`: check bắt buộc thiếu điều kiện/quyền, có điều kiện gỡ. `N/A` cần lý do và không che check thiếu.
- Ghi ngày, command/tool, cwd, target/môi trường, role/dữ liệu, result/exit, assertion, artifact và giới hạn. Tool/package hiện diện, build, screenshot và báo cáo lịch sử khác với test hành vi.
- Done yêu cầu acceptance đã duyệt, check áp dụng bắt buộc, review bắt buộc và tài liệu song ngữ đạt. Chỉ báo check thiếu không làm gate đạt. Ngoại lệ được người dùng chấp nhận vẫn giữ Failed/Not run và hậu quả; không đổi thành xanh. Ngoại lệ không cấp quyền làm yếu safety.
- Tách implemented, reviewed, integrated và released. Acceptance chỉ tài liệu không đòi chạy/deploy app. Cài đặt không chứng minh mọi skill/tool hoạt động.

## Gate theo tác động

- Tài liệu: link/anchor, UTF-8, nguồn/quyền nhất quán, nghĩa AI/VI, routing và giữ approval/lịch sử.
- Đóng gói skill: nguồn/pin, inventory, hash/license, metadata, mirror/routing và pilot đúng scope; hash khớp không là chữ ký upstream hoặc audit an toàn script.
- Backend: build/unit/integration phù hợp; kiểm contract, validation/nhánh lỗi, role và invariant ledger/log.
- Database: review entity/migration/transaction; apply trên SQL Server test sạch và baseline test đang có khi áp dụng; xác nhận schema runtime và cách khôi phục. EF InMemory không kiểm transaction/migration SQL Server.
- Frontend/auth/shared UI: lint/build, auth/Playwright liên quan, hành vi route thật, consumer và role. Tách coverage mock/API thật.
- Payment/webhook/provider: request mock/sandbox an toàn trong scope; live integration chỉ khi có cấu hình, credential và quyền rõ. Không tạo thanh toán/submission/chi phí provider thật chỉ để hoàn tất smoke tổng quát.

## Runtime smoke bắt buộc

Thay đổi runnable qua API/browser/auth/DB/payment/callback/webhook/public hoặc tunnel cần runtime smoke áp dụng ngoài build/test:

1. Restart process bị ảnh hưởng thuộc task sau thay đổi; kiểm đang phục vụ đúng code.
2. HTTP request thật tới API ảnh hưởng với đúng role/session và status/body marker mong đợi.
3. Kiểm browser render/hydrate; JavaScript/CSS chunk cần thiết tải được, gồm HTTP 200 cho Next.js chunk qua public/tunnel.
4. Xác nhận migration cần thiết trong DB test thật trước smoke phụ thuộc schema.
5. Kiểm hành vi payment/webhook ảnh hưởng an toàn bằng mock/sandbox và đọc log terminal/server sau smoke.

Thiếu runtime check bắt buộc áp dụng thì báo implemented với `Not run`/`Blocked`; không đóng task runnable là Done.

## Discovery browser và target

Browser trực tiếp trong T3 theo runtime hiện tại: `preview_status` trước, `preview_open` nếu chưa có preview automation; đọc locator từ snapshot. Tab human-owned chỉ đọc; thao tác trên tab sở hữu. Chỉ dùng profile đã lưu khi quyền task bao phủ.

Đọc lỗi có thể xử lý và retry đúng. Chỉ đổi browser khi tool T3 vắng, open báo rõ unsupported/unavailable, cùng bước trên tab mở lỗi hai lần, hoặc user/workflow repo chỉ định tool khác. Lưu lỗi thô sau che secret và lý do fallback. Playwright Test là runner regression, khác browser MCP; HTML preview để trình bày, không kiểm chứng app.

Trước mutation xác định origin web/API, process owner, identity DB thật, tài khoản/role test, browser context, expected behavior, nơi evidence và cleanup. Không âm thầm dùng lại server chưa rõ. Cổng 3020/7039 là workflow local chuẩn; Playwright mặc định web 3000; SEO có target riêng. Kiểm cấu hình thật thay vì suy một chế độ bao phủ tất cả.

## Assertion browser và debug

Tách bốn mức bằng chứng: static/mockup/build; browser có API mock; sandbox web–API–DB; live provider/production. Browser automation vẫn có thể gọi API mock. Không nâng một mức thành mức khác.

Thao tác người dùng phù hợp; assert UI cùng network target/status và persistence độc lập khi acceptance có lưu dữ liệu. Reload/đăng nhập lại, retry/error và role theo rủi ro. Kiểm keyboard/focus, reduced motion, overflow và viewport liên quan cho UI ảnh hưởng. Viewport mobile mô phỏng không là thiết bị thật.

Tái hiện → đọc console/network/backend log liên quan → lập giả thuyết → khoanh lớp sở hữu → sửa → chạy lại ca lỗi và regression ảnh hưởng. Tránh retry mù/chờ cố định. Giữ assertion, trace/screenshot đã che dữ liệu và evidence lỗi. Xác minh release tài nguyên riêng với kết quả test đạt.

## Review

Tự rà toàn bộ diff trong scope: acceptance, boundary kiến trúc, contract/DB, safety/ledger/log, kiểm chứng và AI/VI. Dùng requesting-code-review/receiving-code-review làm phương pháp; findings theo severity, có path, tác động và cách kiểm lại.

Review độc lập bắt buộc cho auth/security, credit/payment, migration và submission-safety; các thay đổi khác theo rủi ro hoặc yêu cầu task rõ. Reviewer cần scope đã duyệt, base..tip hoặc snapshot bất biến, diff liên quan đầy đủ, check và giới hạn. Tác giả đọc lại diff là self-review, không độc lập. Không dispatch khi chưa được quyền phiên; thiếu review bắt buộc thì gate Blocked, tiếp tục phần độc lập đã được phép.

Sau sửa chạy lại check ảnh hưởng và review snapshot mới khi yêu cầu độc lập. Không bỏ fresh review chỉ vì upstream giới hạn vòng fix/review. Giải quyết lỗi chặn acceptance; ghi findings thật sự ngoài scope mà không che chúng.
