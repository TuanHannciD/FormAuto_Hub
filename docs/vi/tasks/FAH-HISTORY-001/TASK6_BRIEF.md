# Brief Task6 — runtime, diễn tập chuyển đổi và bàn giao

## Thẩm quyền và điều kiện bắt đầu

Chỉ thực thi sau khi review độc lập Task5 được chấp nhận. Brief chuẩn bị Task6 đã được duyệt, không miễn cổng review. Đọc README/AGENTS/authority, EXECUTION_RULES/QUALITY_GATES/TOOLING, Task6 trong IMPLEMENTATION_PLAN, CONTRACTS/DB_REVIEW/CUTOVER, PROGRESS và báo cáo hiện hành. Nhãn chờ duyệt cũ được thay bằng ghi chú thẩm quyền và phê duyệt L1/L2/P1/O1 đã ghi nhận.

Worktree `D:/TinHoc/FormAuto_Hub/.worktrees/fah-history-001`, nhánh `fah-history-001`, base/HEAD `df5cce54f4a8516ab9dd0bf2b5dff561c1cb8d5c`; toàn bộ thay đổi chưa commit. Bảo toàn mọi dữ liệu dirty/untracked/ignored, SQL và bằng chứng. Root điều phối; implementer Task6 mới là người ghi duy nhất cho harness/test runtime và tài liệu trong phạm vi. Không tạo agent con. Chỉ model gpt-6.1-sol/high được chỉ định rõ.

## Tài nguyên và thao tác được phép

- Chỉ hai DB localhost `FormAutoHub_History_Safety_20261104` và `FormAutoHub_History_Baseline_20261105`, integrated auth; ServerName/MachineName phải là `DESKTOP-TS5JR7L`. Dùng kiểm tra danh tính nghiêm ngặt của GenerationHistorySqlFixture trước ghi. Không DROP/reset/EnsureDeleted hoặc tiếp quản DB task cũ.
- Root vừa kiểm tra Safety chỉ đọc: đúng danh tính và có hai migration `20261105043707_GenerationHistoryAndReservations` / `20261105044810_HardenHistoryNullableContractChecks`. Kiểm tra lại danh tính/schema/config trước khởi động API vì Program.cs tự migrate. Không khởi động với DB chưa rõ.
- Chọn cổng API loopback còn trống (đề xuất 5305), ghi executable/arguments/cwd/PID/startTime/log. Cấu hình kết nối SQL được sở hữu, khóa DataProtection trong vùng task, khóa ký tạo cục bộ, AI deterministic và CORS cho web sở hữu. Không in secret/mật khẩu/JWT/cookie. Session/config cần giữ chỉ đặt ở đường dẫn task đã xác nhận ignored.
- Quyền sở hữu web3305 nằm trong báo cáo cuối Task5 và `task5-final-web2-owner.json` / listener JSON. Xác minh PID/path/startTime thật trước dùng/dừng. Build/khởi động lại khi đổi API base origin; không build đồng thời với Next dùng chung `.next`. Không đụng server/cổng mặc định/process chưa rõ.
- Chỉ tài khoản/project/dữ liệu tổng hợp gắn nhãn task. Dùng JWT đăng nhập thật cho User, chủ khác, Admin và request không session; không đổi chính sách identity. Fixture chỉ seed đúng DB sở hữu và giữ dữ liệu/bằng chứng.
- Không cài/tải dependency, gọi Google/AI trả phí/payment thật, đổi global settings/hosts/proxy, nhắn bên ngoài, commit/push/merge/deploy hoặc dọn phá hủy. Gửi production tiếp tục fail-closed. Test host tổng hợp được thay integration ngoài qua interface hiện có, không thêm bypass/config production hay endpoint công khai. Phân biệt bằng chứng API cấu hình production bị chặn với settlement trong host tổng hợp.

## Nghiệm thu và phạm vi

1. Lưu snapshot SHA256 ban đầu, baseline kiểm tra liên quan, quyền sở hữu process/schema và việc cấp tài nguyên trước ghi. Dùng công cụ/package đã có; đọc đủ đơn vị bị ảnh hưởng và phụ thuộc trước sửa có giới hạn.
2. Khởi động lại API/web sở hữu trên đúng mã/schema. Kiểm HTTP history/list/detail/phân trang, Balance/Reserved/Available, tạo rules0, AI deterministic1/2 và partial/error nếu áp dụng. Kiểm owner/chủ khác/Admin/không session, version fence, lịch sử hết hạn, reload/xóa session và phục hồi chỉ GET. Fixture trình duyệt không chứng minh persistence API.
3. Chạy luồng web–API–SQL thật bằng user tổng hợp, kiểm network/status và đọc SQL độc lập. Giữ preview/xác nhận AI và rules một thao tác; kiểm gửi production bị từ chối mà không gọi ngoài/giữ/trừ phí. Settlement/resend/Unknown thành công dùng harness integration tổng hợp ghi nhãn rõ qua service/interface hiện có; ghi số lần receiver riêng với bằng chứng Google thật.
4. Diễn tập cutover bằng dữ liệu legacy/v2 tổng hợp được giữ: version/admission fence, drain có acknowledgement, active predicate chính xác, RunnerAcknowledgedAt/FinishedAt kể cả null, membership/entitlement có chứng cứ, 20 lượt mới nhất, snapshot bất biến và ledger lịch sử được giữ. Không gom theo timestamp hay tạo endpoint vận hành. Reconciliation success/rejection/Unknown dùng service đã duyệt với actor/reason/evidence và replay idempotent; thiếu chứng cứ phải giữ fence.
5. Chạy build/full test và cổng SQL opt-in chính xác (Safety và Baseline có dữ liệu riêng). Xử lý rõ SQL bắt buộc bị skip bằng mapping coverage tương đương hoặc chạy fixture sở hữu; không coi skip là pass. Chạy lint/auth/build và browser bị ảnh hưởng sau sửa; restart trước smoke runtime. Không lặp kiểm tra rộng không đổi nếu không có lý do.
6. Trình duyệt T3: preview_status trước, tab incognito riêng/reuseExistingTab false, tabId rõ. Giữ tab người dùng. Kiểm chunks200, hydration/console, keyboard/mobile, xác nhận/lỗi/reload và log backend. Playwright Test vẫn là runner regression được phép. Giữ artifact riêng từng lượt.
7. Cập nhật cặp CUTOVER/VALIDATION/HANDOFF và canonical API/entities/boundaries/UI_CREDIT_FOLLOWUP_SYNC liên quan chỉ cho hành vi đã duyệt/triển khai. Giữ cam kết hai ngôn ngữ, UTF-8 và <400 dòng mỗi Markdown đang sửa. Ghi xử lý Task3M1 và hoãn precedence lỗi an toàn Task4M2 cho review cuối.
8. Tự review, đóng băng inventory/SHA256 đầy đủ và báo cáo Summary/Files/Scope/Validation performed/not performed/Risks/Next. Trả source đóng băng cho review task mới rồi root review độc lập toàn nhánh. Sửa blocker nghiệm thu qua RED/GREEN có giới hạn và review mới; không tự release.

## Giới hạn báo cáo

Receipt/số lần receiver tổng hợp không chứng minh Google nhận thật. Phân loại receipt thật và reconciliation vận hành cần quyền riêng vẫn chặn kích hoạt production. Tách Verified cục bộ với Not run/Blocked; không miễn runtime còn thiếu chỉ bằng công khai. Giữ DB/bằng chứng sở hữu và ghi process/tab còn lại trước bàn giao.
