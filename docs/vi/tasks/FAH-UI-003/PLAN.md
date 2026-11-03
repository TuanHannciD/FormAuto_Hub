# Kế hoạch triển khai tinh gọn UI sau đăng nhập

> **Dành cho agent thực thi:** Dùng `executing-plans` khi làm inline hoặc `subagent-driven-development` nếu người dùng chọn. Làm các checkbox theo thứ tự; quyền dự án cao hơn mặc định commit/dispatch của skill.

**Mục tiêu:** Giảm đọc/cuộn thừa trên toàn bộ trang sau đăng nhập, ưu tiên tự động hoá biểu mẫu thường dùng.
**Kiến trúc:** Giữ Next.js/component React/Tailwind chung, token và ranh giới API/state. Chứng minh sửa lỗi riêng với đổi trình bày; dùng component/callback hiện có thay vì tạo workflow mới.
**Stack:** Next.js 15 / React 19 / TypeScript / Tailwind / lucide-react; Playwright Test và Node auth tests hiện có; không đổi .NET 9/SQL Server.
**Đặc tả:** [hướng thiết kế đã duyệt và đánh giá](AUDIT.md); [quyền/bằng chứng](INDEX.md).

## Quyền và ranh giới thực thi

Ngày 2026-11-02 người dùng “Tôi duyệt kế hoạch này” duyệt rõ kế hoạch và cách triển khai inline kèm review độc lập có giới hạn. Đã có quyền sửa nguồn, test và tài liệu task song ngữ cục bộ; không cần hỏi lại quyền trong phạm vi này. Không install/commit/push/merge/deploy/provider/DB thật. Root là người triển khai duy nhất; reviewer dùng Sol được kiểm catalog, tối đa gpt-6.1-sol/high. Bằng chứng nghiệm thu và ngoại lệ hiện tại: [PROGRESS](PROGRESS.md).

## Ràng buộc toàn cục

- Phạm vi: 18 route trong `/dashboard` và `/admin`, popup tài khoản/chi tiết chung; trình bày PayOS return/cancel là ranh giới regression. Không thiết kế lại trang chủ/SEO/đăng nhập/đăng ký.
- Giữ nhận diện/token; không giảm toàn bộ font/control. Hành động chính mobile ít nhất 44px. Chiều rộng320/390/430/768/1366/1440; có màn thấp, zoom và dữ liệu dài.
- Quy tắc: một hành động **Tạo và gửi ngay**, không preview/checkbox/xác nhận thứ hai. AI: bản xem trước chỉ đọc đã lưu và xác nhận tường minh; giữ bảo vệ stale/draft/retry đọc.
- Tạo1–100 phản hồi mỗi hành động, tuần tự nhóm10, quyền và log credit/sử dụng/gửi hiện có. Không thêm API/DTO/entity/status/provider/DB/chính sách, không ngầm kích hoạt Deferred.
- Giữ mặc định mở/đóng câu hỏi/preview hiện có. Không thêm thanh sticky, polling, ETA, nhớ disclosure hoặc tự replay.
- Giữ toàn bộ đánh giá/bằng chứng dirty/untracked/ignored. Root ghi độc quyền component/test/docs chung; chỉ giao nhóm trang tách biệt sau khi phụ thuộc ổn định.
- Trước mỗi dispatch kiểm catalog; chỉ Sol, tối đa `gpt-6.1-sol` / `high`; ghi model/effort/task thực tế. Không tạo agent lồng trừ khi được giao rõ.
- Startup runtime từng bị từ chối `blocked by policy`; không đổi wrapper/transport để retry cùng hành động. Giải quyết bằng runtime được phép và ghi ownership; không thay kiểm tra bắt buộc bằng lời công bố hoặc mockup.

## Trọng tâm review

1. Direct→AI sau command đã kết thúc/chưa rõ: summary đúng, khóa/replay unknown không đổi (T1).
2. AI đã thu phí nhưng lần đọc sau lỗi: retry chỉ GET; phí thực khác dự kiến (T1/T2).
3. Nhãn dài/form30 câu, viewport thấp và bàn phím: control tới được, không giấu focus (T2).
4. Chuyển menu mobile/popup tài khoản và qua breakpoint desktop: không kẹt focus/body lock hoặc dialog trùng (T3).
5. ID/số tiền dài, thanh toán/NCKH stale: chi tiết gọn vẫn giữ dữ kiện, quyền và hành động an toàn (T4–T7).

## Sở hữu file và interface

Không dự kiến thêm interface component/API công khai. Giữ props/handler hiện tại:

- `WorkflowSummary` nhận `mode`, `requestedCount`, `previewCount`, `multiplier`, `balance`, `creditsUsed`, số kết quả và `stale`; sửa giá trị tại caller, không thêm state tính phí.
- `AiModePreparationPanel`, `RuleEditor`, `GenerationModeSelector`, `PreviewAccordion` giữ callback/giá trị controlled; trình bày không tự gọi tạo/gửi.
- `ShellLayout({children,navigation,subtitle,heading,actions,mobileOpen,onMobileChange})` giữ caller. `Dialog`, `DialogContent`, `DialogTitle`, `DialogClose` hiện có sở hữu focus/đóng; không đổi toàn bộ motion dialog.
- Giữ `BaseTable<T>` và `BaseTableColumn<T>`; dùng `hideOnMobile` + `mobileFooter(item)` hiện có để render `<details>` trường phụ truy cập được. Cột desktop đầy đủ. Không giấu trường mà mobile không xem được ở đâu khác.
- Metric/list/order cục bộ tái dùng `ui.tsx`, `metric-card.tsx`, `status-badge.tsx`, phân trang và DTO hiện tại. Không thêm component chung chỉ để chuyển mã giữa file.

## T0 — snapshot thực thi và baseline runtime (gate)

File: INDEX/PLAN/bằng chứng task; chưa sửa nguồn sản phẩm. Điều kiện trước khi tuyên bố cải thiện đã đo.

- [x] Đọc lại đặc tả/kế hoạch/trạng thái đã duyệt; ghi SHA, nhánh, mọi việc được giữ và cách thực thi đã chọn. Khi thực thi dùng `using-git-worktrees`; nhận biết cách ly sẵn có và theo lựa chọn thực tế của người dùng. Nếu chọn checkout riêng, chuyển rõ docs/snapshot đã duyệt còn uncommitted, không tự commit việc của người dùng.
- [x] Có runtime được phép: xác minh process/cổng, session User/Admin thử, API mock hay thật và DB nếu áp dụng. Không chạy lại helper bị từ chối để vượt review. Nếu chưa có runtime, giữ T0 Blocked và không đưa triển khai chạy được thành Done.
- [ ] Đọc fixture tests trước tái dùng. Chụp before cùng dữ liệu/quyền ở390×844 và1440×900 cho18 route/tài khoản; forms ban đầu/quy tắc/AI mặc định/tùy chỉnh/kết quả với1/10/30 câu. Callback/unknown/payment dùng fixture, không gọi provider. Thêm320/430/768 cho kiểm ranh giới.
- [ ] Lưu hash ảnh, manifest route/state/dataset, chiều cao trang và khoảng cách tới hành động/bản ghi đầu. Không đặt tỷ lệ giảm chung; chứng minh giảm cuộn ở trường hợp dư nội dung mà không giấu dữ kiện hay tăng nhấn thừa.
## T1 — tái hiện và sửa điều hướng/count forms (F02/F04)

Sửa: `apps/web/app/dashboard/forms/page.tsx`; tests `apps/web/tests/form-automation.spec.ts`, `direct-rule-submission.spec.ts`, `fah-err-forms-errors.spec.ts` khi liên quan. Không sửa service/API/DTO.

- [x] Thêm test đỏ “rules step navigation targets existing sections”: sau phân tích duyệt link navigation khả dụng; `document.querySelector(anchor.hash)` tồn tại. Bước đang gửi dùng `isSending/directCommand/submission` hiện có; anchor/xác nhận AI vẫn đúng.
- [x] Thêm test đỏ “AI summary uses active request count after direct mode”: hoàn thành direct giả lập count2, chọn AI và count3; summary phải là3 với dự kiến theo hệ số đang dùng, không count2 cũ. Command unknown vẫn khóa; đổi chế độ không vượt khóa.
- [x] Chạy đúng test đó để xác nhận lỗi từ phát hiện, không do fixture/setup; ghi lệnh/output. Nếu không tái hiện, để chưa sửa kèm bằng chứng thay vì đổi state không liên quan.
- [x] Chỉ sửa ánh xạ bước/anchor và binding summary theo chế độ. Quy tắc dùng phần cấu hình/hành động/kết quả sẵn có; bước đang xử lý chỉ là trạng thái nếu không có anchor có nghĩa. Giữ tạo/lưu/replay command và snapshot/reset AI.
- [x] Chạy `npx playwright test tests/form-automation.spec.ts tests/direct-rule-submission.spec.ts tests/fah-err-forms-errors.spec.ts`. Giữ assertions lock/hai tab/reload/unknown/AI GET-retry. Review an toàn độc lập trước nghiệm thu task.

## T2 — thứ bậc, chữ, nhãn và ngữ cảnh hành động forms (F01/F03/F05)

Sửa: forms `page.tsx`; `_components/{GenerationModeSelector,RuleEditor,AiModePreparationPanel,AiQuestionBlock,PreviewAccordion,WorkflowSummary}.tsx`; `_constants.ts` chỉ chữ hiển thị. Tests: `form-automation.spec.ts`, `fah-err-forms-errors.spec.ts`; có thể thêm `tests/ui-cleanup.spec.ts` chỉ cho assertions hình học/coverage chung.

- [x] Chốt assertions có ý nghĩa: tìm được ô số lượng bằng nhãn; phân biệt credit dự kiến/thực với AI Partial; chi phí/số dư cùng vùng hành động; xem đủ nhãn câu preview dài; vẫn phải xác nhận. Test mới đỏ đúng vấn đề bảo vệ, không soi chuỗi CSS class.
- [x] Gom metadata biểu mẫu thành tóm tắt gọn và chi tiết phụ truy cập được. Giảm card/viền lặp trong trình chỉnh câu hỏi/banner chế độ; giữ mọi lựa chọn/validation, mặc định disclosure và state hiện tại. Giữ summary desktop; bỏ mô tả chung lặp.
- [x] Nhãn thật bằng `<label>`/ID và mô tả giới hạn/chi phí. Đặt số dư và dự kiến cạnh control hành động sẵn có. Không tải được số dư vẫn là chưa rõ, không phải0. Dùng “Hướng dẫn chung”, “Điền gợi ý hướng dẫn”, “Lưu và tạo bản xem trước AI”, “Chi phí dự kiến”; phí thực từ kết quả đã xác nhận. Giữ “Tạo và gửi ngay”.
- [x] Nhãn preview đọc được, vùng cuộn có tên/focus khi còn cuộn. Một giải thích chỉ đọc tại điểm quyết định; giữ mọi đáp án đã lưu, cảnh báo stale, khôi phục phí/lần đọc, chọn/xác nhận preview và hành động kết quả/log.
- [x] Giữ sticky trừ khi phép đo cắt nội dung cần chỉnh hình học tối thiểu; không thêm thanh sticky thứ hai. Kiểm1/10/30 câu,320/390/430, màn thấp, focus bàn phím và lớp modal/menu. Giữ chạm chính44px, chữ dễ đọc.
- [x] Chạy bộ T1 cùng `npx playwright test tests/dashboard-ui-refinement.spec.ts tests/shared-ui.spec.ts`; xem cặp ảnh desktop/mobile và trạng thái lỗi. Ghi chênh lệch đã đo, không tuyên bố kết quả user study chưa quan sát.

## T3 — điều hướng mobile chung và pattern bản ghi gọn (F06/F09)

Sửa: `components/{shell-layout,dashboard-shell,admin-shell}.tsx`; task sau dùng props `BaseTable` để thêm chi tiết cục bộ. `ui.tsx`, `ui-styles.ts`, `base-table.tsx` chỉ đọc trừ khi có thiếu sót chung được chứng minh, ghi nhận và review. Tests: `shared-ui.spec.ts`, `account-navigation.spec.ts`, `ui-refinement.spec.ts`, `auth-session.spec.ts`.

- [x] Tái hiện thiếu sót bàn phím. Thêm “mobile menu returns focus and clears modal state at breakpoint”: mở bằng bàn phím, Tab/Shift+Tab trong menu, Escape về nút mở, mở lại và resize desktop; dùng được nền, trả body scroll. Popup tài khoản/menu dài vẫn tới được.
- [x] Tái dùng Dialog cho menu mobile với tên truy cập và nút `aria-expanded`/`aria-controls`; giữ sidebar desktop/nhận diện. Đóng khi điều hướng/qua breakpoint desktop, không kẹt khóa. Không sửa auth/session.
- [x] Bỏ affordance thông báo/trợ giúp chưa hoạt động và tìm kiếm toàn cục disabled khỏi vùng làm việc chính; không xây thay thế. Giữ tài khoản/điều hướng đang hoạt động.
- [x] Chốt bản ghi cục bộ nhất quán bằng `hideOnMobile`/`mobileFooter`: nhận diện/giá trị/trạng thái/thời gian chính dễ đọc; trường phụ trong chi tiết có nhãn; vẫn tới mọi dữ kiện/hành động. Không thêm fetch hoặc trường DTO.
- [x] Chạy bốn spec đã nêu và regression drawer/sticky forms; fixture host phụ thuộc baseline phải được khởi động rõ ownership, không mặc định có sẵn. Review độc lập focus/giáp auth và mọi diff consumer chung.

## T4 — nạp, chi tiết và tài khoản

Sửa: `app/dashboard/top-up/page.tsx`, `[id]/page.tsx`, `_components/topup-order-detail.tsx`; `components/{account-dialog,account-profile-panel,account-security-panel}.tsx`. Tests: `topup-ui.spec.ts`, `manual-credit-ui.spec.ts`, `account-navigation.spec.ts`, `auth-session.spec.ts`, `fah-err-account-payments-errors.spec.ts`.

- [x] Gói/giá/credit/hành động đã chọn nằm viewport đầu390×844 khi có năm gói; gom giải thích phụ/lịch sử. Dùng pattern bản ghi chung, giữ pending guard, chứng từ và ghi chú.
- [x] Gom chi tiết/tài khoản gọn mà không đổi route/modal, xử lý khóa/mật khẩu, Google linking hay callback. Lỗi hành động/retry đọc an toàn vẫn rõ; xem được thông tin nhận diện/tham chiếu dài.
- [x] Không trình bày trạng thái query thành credit đã quyết toán; không tự retry thanh toán. Chạy spec đã nêu với write được chặn giả lập, giữ payload assertions; phải smoke browser/API phù hợp nếu thực sự đổi đường ghi.

## T5 — vận hành admin và cấu hình provider

Sửa: `app/admin/{manual-credits,packages,payos-settings,ai-provider-settings}/page.tsx`, `manual-credits/_components/manual-grant-history.tsx`. Tests: `admin-ui.spec.ts`, `admin-ui-refinement.spec.ts`, `manual-credit-ui.spec.ts`, `fah-err-account-payments-errors.spec.ts`.

- [x] Giữ rõ người nhận/email, tiền/credit, lý do, chứng từ và quyết định cho cấp trực tiếp/đối soát. Gom danh sách/chi tiết quanh dữ kiện đó; không mặc định giấu chứng từ quan trọng để duyệt.
- [x] Tách cảnh báo giữ khóa PayOS khi để trống khỏi tài liệu URL/setup có thể mở. Đặt trạng thái đã lưu/kết nối gần control liên quan. Giữ guard xác minh lần đọc AI, nghĩa model/key, lỗi tải và xác nhận lưu.
- [x] Nhãn/trợ giúp tiếng Việt nhất quán, editor gói/lịch sử cấu hình gọn. Không lộ khóa, tự tạo nhóm ngoại lệ hay đổi payload/quyền/validation/side effect.
- [x] Chạy spec đã nêu; kiểm tên/tiền/model/URL dài, loading503, đơn stale và payload duyệt/từ chối. Mock không chứng minh credit/provider thật; review độc lập nếu ảnh hưởng write thanh toán/auth.

## T6 — danh sách, callback và workspace NCKH

Sửa: `app/dashboard/nckh/page.tsx`, `callback/page.tsx`, `forms/[formId]/page.tsx`, `_components/{overview-panel,dataset-preview,loading-state,delete-model-dialog}.tsx` khi cần. Tests: `nckh.spec.ts`, `nckh-delete-model.spec.ts`, `fah-err-nckh-errors.spec.ts`.

- [x] Nhãn hiển thị/truy cập thường trực cho input mô hình/biến/ánh xạ; giữ type/required/range và binding draft. Chụp nhãn dài/trường đã nhập để bao phủ mất placeholder.
- [x] Giảm giải thích chung/lồng panel, ưu tiên tác vụ/tab đang dùng. Giữ điều hướng/vị trí canvas, ánh xạ, tác động xóa/xác nhận tên, export và lỗi quyền/Google riêng. Chỉ đổi cao canvas khi có bằng chứng viewport; không thêm thư viện hay tương tác chạm mới.
- [x] Chạy spec đã nêu; kiểm disconnected/loading/error/empty/model/error-retry và dataset/export mobile/desktop. Không gọi OAuth/Forms thật hay xóa dữ liệu để có ảnh chứng minh.

## T7 — tổng quan, lịch sử, AI và doanh thu (đủ route)

Sửa: `app/dashboard/page.tsx`, `{usage-logs,credit-transactions,ai-usage}/page.tsx`; `app/admin/page.tsx`, `{payments,revenue,ai-usage}/page.tsx`; PayOS `return/page.tsx` chỉ chữ (`cancel/page.tsx` re-export). Tests: `dashboard-ui-refinement.spec.ts`, `admin-ui-refinement.spec.ts`, `admin-ui.spec.ts`, `shared-ui.spec.ts`, `fah-err-account-payments-errors.spec.ts`.

- [x] Tổng quan user: thay chào hỏi lặp bằng nhận diện trang, ưu tiên số dư/hành động, chỉ số phụ gọn nếu số dài vừa. Bỏ mô tả lịch sử/khoảng trắng min-height dư khi có bằng chứng trạng thái ổn định; không ép mọi thứ một màn hình.
- [x] Dùng pattern bản ghi cho lịch sử/thanh toán; giữ mọi trường, filter sử dụng mặc định, dấu sổ credit, ngày, trạng thái, nghĩa trong trang/toàn bộ và phân biệt phân trang server/client. Bộ lọc gọn thay lời giải thích cơ chế phân trang.
- [x] Thống kê AI: tên chế độ tiếng Việt, phân biệt thời điểm/thời lượng/số lượng; retry GET tường minh an toàn nơi thiếu. Lỗi fetch không giống dữ liệu trống. Không thêm metric/nghĩa query.
- [x] Tổng quan/doanh thu admin: giải thích webhook chung vào trợ giúp, bỏ export no-op và giảm placeholder chart/filter chưa hoạt động; bỏ hứa hẹn Deferred. Giữ tổng/trạng thái sẵn có và đường đối soát; không suy ra status “cần kiểm tra” mới hoặc xây export/chart.
- [x] PayOS return/cancel: chỉ nhất quán “bản xem trước”, phân biệt xác minh/đường quay lại. Chạy spec đã nêu và fixture callback/query; giữ resume context/broadcast.

## T8 — kiểm chứng cuối, review độc lập và bàn giao

File: docs task song ngữ và manifest bằng chứng; sửa lỗi trong vùng owner ở trên.

- [x] Tại `apps/web` chạy `npm run lint`, `npm run build` (có color check), `npm run test:auth`; chạy lại bộ liên quan sau sửa. Chỉ chạy cả Playwright sau kiểm fixture host và live opt-in; không ngầm chạy test write provider/DB thật. Ghi lựa chọn test và lý do loại trừ.
- [x] Khởi động lại runtime bị sửa do task sở hữu ở snapshot cuối, xác minh origin/session/quyền và chunks/hydration. Smoke HTTP/browser theo mức mock/API/DB thực tế, đọc log. Nếu thiếu smoke bắt buộc, giữ triển khai Blocked/Not run, không Done.
- [x] Chụp manifest18 route/tài khoản cuối và callback thanh toán liên quan; so đúng cặp dữ liệu/viewport/hình học với T0. Toàn bộ checklist state trong AUDIT bắt buộc cho forms; focus/zoom/mobile/dữ liệu dài áp dụng consumer khác.
- [x] Chạy detector Impeccable một lượt trên markup đã đổi; xem gộp desktop/mobile, sửa cùng lượt rồi xác nhận. Review độc lập phạm vi/truy cập/chữ/hợp đồng ở snapshot cuối bất biến; review lại sửa an toàn khi cần.
- [x] Cập nhật INDEX/PLAN AI/VI với check, review ID/model/effort, rủi ro và bước tiếp chính xác; giữ bằng chứng. Báo file/phạm vi/Verified/Failed/Not run/Blocked trung thực. Không commit/push/merge/deploy/cleanup nếu chưa có quyền riêng.

## Phụ thuộc, checkpoint và tự review

Thứ tự: T0 → T1 → T2 → T3 → T4/T5 → T6 → T7 → T8. T4/T5 có thể làm inline tuần tự; chỉ giao song song khi interface chung ổn định, writer tách biệt và đủ quyền. Root tuần tự forms/component chung/test chung. Sau từng task được chấp nhận giữ diff/bằng chứng có thể review; không tự commit.

Tự rà coverage: F01/F03/F05→T2; F02/F04→T1; F06→T3/T7; F07→T3/T7; F08→T6; F09→T3; F10→T4–T7. Đủ18 route, tài khoản/chi tiết và ranh giới thanh toán. Không thêm interface sản phẩm/yêu cầu backend; mỗi sửa hành vi có gate tái hiện, năm tình huống review đều có check sở hữu.

Deferred: đổi mặc định disclosure/nhớ lựa chọn, thay toàn cục typography/token, provider mới, DB/API, chart/export/tìm kiếm còn thiếu, tự khôi phục gửi, hoàn tiền, thiết kế lại thu phí/phân trang và trang công khai. Số đo cải thiện và runtime vẫn chưa giải quyết cho tới T0 thành công.

## Phê duyệt triển khai — 2026-11-02

Người dùng đã duyệt “Tôi duyệt kế hoạch này”, thay thế trạng thái chỉ lập kế hoạch. Root triển khai inline, review độc lập. Cho phép sửa/test/docs cục bộ; không commit/push/merge/deploy/install/provider thật/DB.

## Cách hiểu trạng thái nghiệm thu

T1–T7 được đánh dấu cho triển khai và regression/review fixture áp dụng; các unit tài khoản/callback/canvas không cần đổi đã được đánh giá và giữ nguyên. Hai mục chụp T0 còn một phần:61 ảnh trước thiếu AI đã lưu/kết quả; trạng thái bổ sung chỉ có ảnh sau. Không tạo giả bằng chứng trước. Hai ngoại lệ prop trình bày cục bộ/dùng chung đã ghi trong PROGRESS. Trạng thái T8 và bằng chứng ghi ở đó, không suy ra từ checkbox lịch sử.

## U1–U5 — bổ sung chốt task sau nghiệm thu (2026-11-03)

- [x] U1: hai scout Sol chỉ đọc rà lịch sử/tài khoản/nạp và NCKH/callback/PayOS; giữ bề mặt đã đủ tốt.
- [x] U2: tinh gọn lượt/card chế độ AI có dữ liệu, nhãn metric theo trang, tên filter ổn định, nút copy44px mobile.
- [x] U3: gom linked NCKH vào nhập, bỏ hướng dẫn rỗng lặp, tiêu đề popup theo việc, canh nút ánh xạ, nêu giới hạn preview dataset có sẵn.
- [x] U4:179 ca fixture chọn gồm61ảnh bản cuối, ảnh user/NCKH có dữ liệu/đã ổn định, build/lint/auth, review nguồn/ảnh độc lập mới và tài liệu song ngữ.
- [x] U5 tích hợp: đã sao lưu/kiểm hash task gốc ở main; lưu trữ helper; commit và fast-forward merge local; build/auth9/9/browser8/8 sau merge Verified. Không push/deploy. Xóa thư mục sinh ra Blocked bởi policy tự động; giữ thư mục và checkout host. Checkbox xác nhận tích hợp local, không khẳng định dọn sạch ổ đĩa.

## A1–A4 — bổ sung admin đã duyệt

- [x] A1: rà8route admin/contract và chụp18ảnh baseline.
- [x] A2: tái hiện finding; sửa nhãn/metric/chế độ/filter/khóa/chữ trong phạm vi.
- [x] A3: regression chọn cuối, build/lint/auth, ảnh đối chiếu và review Sol độc lập.
- [x] A4: chốt hồ sơ/bằng chứng song ngữ; tích hợp local theo quyền trước. Không push/deploy hoặc thử lại dọn cache bị từ chối.

## Kết quả thực thi đóng task

Toàn bộ hạng mục đã duyệt và phần bổ sung nhãn AI user đã hoàn tất. Bằng chứng đóng task nằm trong `PROGRESS.md`; task đủ điều kiện commit local và tích hợp fast-forward local. Push, deploy, kiểm tra live provider/DB và dọn thư mục sinh do host quản lý không thuộc closeout này.
