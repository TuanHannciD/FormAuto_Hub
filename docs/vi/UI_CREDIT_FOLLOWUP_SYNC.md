# UI_CREDIT_FOLLOWUP_SYNC

## Phạm vi và trạng thái

Ngày: 2026-10-08. Follow-up implementation/fix được user duyệt trên `ui/shared-ui-foundation`; không chọn global phase mới. Ghi nhận các task UI/auth/credit thủ công đã hoàn thành ở local và doc sync. Không claim đã deploy, tích hợp Google thật hay thanh toán PayOS thật.

## Source đã triển khai

| Khu vực | Source | Kết quả |
|---|---|---|
| Trình bày chung | `apps/web/components/ui-styles.ts`, `ui.tsx`, `metric-card.tsx`, `base-table.tsx`, `dropdown-select.tsx` | Tập trung style panel/control/nút; tái sử dụng metric, bảng, select, alert và hàng thông tin |
| Khung app và logo | `apps/web/components/shell-layout.tsx`, `dashboard-shell.tsx`, `admin-shell.tsx` | Một khung dashboard/admin; topbar/sidebar bo tròn; logo nổi bật ngoài vùng navigation cuộn |
| Tài khoản | `apps/web/components/account-menu.tsx`, `account-dialog.tsx`, `account-profile-panel.tsx`, `account-security-panel.tsx` | Mục topbar; hồ sơ/bảo mật chung pop-up; bỏ route hồ sơ riêng; giữ payload API |
| Animation và xác nhận | `apps/web/components/dialog.tsx`, `confirm-dialog.tsx`, `motion/transition-region.tsx`, `motion/use-popup-motion.ts`, `motion/motion-presets.ts`, `motion/use-element-size.ts` | Đổi kích thước trước nội dung; pop-up giãn/hiện và ẩn/thu; focus, Escape, bấm ngoài, ngắt chuyển tiếp/reduced-motion dùng chung |
| UI nghiệp vụ biểu mẫu | `apps/web/app/dashboard/forms/page.tsx` và `_components/` | Nền/control/chế độ/preview chung; giữ phần neo, giới hạn phản hồi và preview/xác nhận |
| Frontend NCKH | `apps/web/lib/nckh-google-auth.ts`, `apps/web/lib/api.ts`, các trang/kiểm thử NCKH | Lỗi Google nhận diện chính xác không làm hết session JWT core; lỗi chung có thử lại; đồng bộ style workspace |
| Nạp của user | `apps/web/app/dashboard/top-up/page.tsx`, `[id]/page.tsx`, `_components/topup-order-detail.tsx` | Bố cục gói/thanh toán, pop-up chi tiết chung, lịch sử client 10 dòng/trang; API vẫn trả toàn bộ đơn |
| Credit admin | `apps/web/app/admin/manual-credits/page.tsx`, `_components/manual-grant-history.tsx` | Tìm user, cộng trực tiếp, duyệt/từ chối đơn thủ công, xem ảnh và lịch sử cộng có tìm kiếm/phân trang |
| Thanh toán/lịch sử/AI | Route kết quả PayOS, lịch sử user, các trang AI dashboard/admin | Style nút/hàng/alert/metric chung; không thêm nghiệp vụ thanh toán |
| Artifact duyệt | `prototypes/motion-review.html` | Demo lịch sử độc lập; production không tải và không lấy làm nguồn chính cho animation chung |

Primitive UI là React/Tailwind của repo theo pattern shadcn/ui; không claim đã cài Radix hay package shadcn sinh sẵn. Landing/SEO và hiệu ứng mờ topbar có chủ đích tách biệt với panel nghiệp vụ dashboard. Đã xóa CSS `glass-panel`/`glass-sidebar` không dùng.

## Contract credit và persistence

- Giữ ranh giới controller/service/DTO: `AdminCreditOperationsController`, `AdminCreditOperationsService`, `Contracts/ManualCreditDtos.cs`; ghi credit qua `CreditService` và `CreditWriteTransaction`.
- Admin cộng trực tiếp cần credit nguyên dương, người nhận và lý do không trống (tối đa 1000 ký tự). Ghi sổ `ManualGrant` và audit admin trong cùng transaction; mỗi request được chấp nhận là một lần cộng riêng. Browser không tự gửi lại write.
- Duyệt/từ chối chỉ dành cho admin và đơn thủ công đang chờ. Credit PayOS thuộc xử lý thanh toán đã xác minh. Xử lý lặp/stale trả conflict; row version bảo vệ đơn và tài khoản credit.
- Minh chứng PNG/JPEG/WebP riêng tư, tối đa 5 MB; giữ kiểm tra owner khi upload/gắn ảnh và đọc của owner/admin. Header admin không thay thế role JWT.
- `TopupEvidence` tái sử dụng `TopupOrderEvidenceFiles` cũ; migration `20261007181332_ManualCreditFlow` tạo storage thiếu và nhận storage/link cũ. Không thêm bảng/migration cho lịch sử.
- Lịch sử cộng đọc `CreditTransactions`/`AuditLogs` hiện có, chọn actor khớp mới nhất không nhân đôi sổ, để trống thông tin actor cũ bị thiếu. API trang từ 1, pageSize 1..50, UI 10 dòng; tìm người nhận/người thực hiện và lý do.
- Lịch sử nạp user 10 dòng/trang client; giữ toàn bộ đơn để nhận diện yêu cầu thủ công đang chờ. Không phân trang server hay giảm dữ liệu API tải về.

Route/field cụ thể ở `API_CONTRACT_GUIDE.md` và `DOMAIN_ENTITIES_OVERVIEW.md`. Nhận diện lỗi Google NCKH ở `nckh/NCKH_API_CONTRACT_GUIDE.md`.

## Rà soát tài liệu

- Đọc/quét 209 file `docs/**/*.md` hiện có về cặp ngôn ngữ, đường dẫn source, liên kết tương đối, định danh contract và mô tả trạng thái cũ. Đối chiếu tài liệu hiện hành với source; giữ bối cảnh approval/bằng chứng của phase/closeout lịch sử.
- Đủ 73 cặp AI/VI gốc; không có liên kết Markdown tương đối thiếu hoặc ký tự thay thế UTF-8. Báo cáo này thêm một cặp, nâng tổng lên 74.
- Đồng bộ inventory UI, route hồ sơ đã bỏ, animation, phân trang nạp so với cộng thủ công, contract/entity credit và trạng thái implementation.
- Bổ sung ví dụ payload, chi tiết DbContext/namespace/toàn vẹn dữ liệu NCKH còn thiếu ở bản Việt. Bỏ claim `google_reauth_required` riêng bản Việt không có trong source; sửa role `Researcher` không tồn tại, đường dẫn DTO, trạng thái `Archived` chưa implement và mô tả sai rằng xóa model giữ responses/datasets.
- Giữ yêu cầu xóa NCKH hiện có. Backend hiện cascade responses/datasets thuộc model; doc sync chỉ sửa mô tả, không sửa code xóa.
- Thêm/cập nhật TOC cho tài liệu dài được sửa. Có thể khác bố cục bản dịch; phải đồng nghĩa về cam kết, route, field kỹ thuật, ràng buộc và giới hạn validation.

## Validation

Verified trên checkout local:

- Backend: `dotnet test tests/FormAutoHub.Tests --configuration Release --no-restore`: 154 passed, không skip. Còn warning NU1603 đã có về resolve dependency Google Forms.
- Auth: `npm run test:auth`: 9 passed.
- Build frontend production, TypeScript và kiểm tra màu đạt; dùng server production kiểm tra vừa khởi động ở port 3021.
- Toàn bộ browser suite: 82 passed, một test API thật opt-in skip trong lượt fixture. Sau đó chạy riêng test đó với SQL/API cô lập port 7040 và đạt (upload, gửi đơn, xem, duyệt, cộng trực tiếp, cập nhật lịch sử và role đọc lịch sử).
- Harness HTTP/SQL thật đạt migration sạch, owner minh chứng, chặn giả header/non-admin, cộng không hợp lệ, invariant sổ/audit/số dư nguyên tử, conflict duyệt lặp và từ chối pending. Dọn database/API tạm sau validation.
- Đã xem screenshot desktop/mobile của tự động hóa, canvas NCKH, chi tiết nạp/thủ công và kết quả PayOS; kiểm tra overflow/hydration/runtime và nút neo đạt. Log preview không có lỗi. App/API chính vẫn mở ở 3020/7039.

Not run trong closeout này: deploy/push production, thanh toán/webhook PayOS thật, OAuth/Forms Google thật, provider AI thật, xác minh toàn bộ bằng chứng runtime lịch sử của mọi tài liệu lưu trữ. Fixture browser không chứng minh provider ngoài thành công.

## Khoảng thiếu và Deferred

- Xác nhận xóa model NCKH còn thiếu tại lần sync này. Task implementation tiếp theo được user duyệt đã hoàn thiện khoảng thiếu; xem [NCKH_MODEL_DELETE_FOLLOWUP.md](nckh/NCKH_MODEL_DELETE_FOLLOWUP.md) về hành vi hiện tại và bằng chứng validation riêng.
- Phân trang nạp client vẫn tải mọi đơn. Phân trang server là cải tiến cần scope riêng, chưa triển khai ở đây.
- Retention/dọn ảnh và object storage ngoài, provider thanh toán khác, AI rollout rộng hơn và background jobs vẫn Deferred nếu chưa duyệt riêng.
- Không duyệt global phase mới, refund policy, vượt hạn chế Google hoặc gửi tự động không preview/xác nhận.

## Bước tiếp theo

Source/kiểm thử/prototype UI/credit và tài liệu song ngữ đã commit local tại `f50f062`. Follow-up xóa NCKH tiếp theo đã được user thử và nghiệm thu, duyệt rà cuối/commit local/merge vào main; xem báo cáo tương ứng. Push/deploy và các khoảng thiếu khác cần request riêng.
