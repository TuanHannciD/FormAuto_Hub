# FAH-UI-002 — kế hoạch triển khai tinh gọn UI

> Dành cho Agent thực hiện: dùng `subagent-driven-development`; chỉ dùng `dispatching-parallel-agents` khi vùng sở hữu tách biệt. Điều phối viên không viết code sản phẩm. Checkbox phản ánh thực tế thực hiện.

**Trạng thái:** Người dùng đã duyệt ngày 2026-10-28; chuẩn bị commit tài liệu/skills sạch và sync remote trước khi triển khai UI.
**Ngày:** 2026-10-28.
**Mục tiêu:** Giao diện hiện tại gọn, tinh tế, nhất quán, có phản hồi chuyển động hữu ích và được kiểm chứng độc lập.
**Kiến trúc:** Tinh chỉnh primitive/shell dùng chung trước, rồi các trang tiêu thụ. Giữ API component, route, luồng nghiệp vụ và stack.
**Stack:** Next.js 15 / React 19 / Tailwind / shared UI hiện có và lucide-react; API .NET 9 không đổi.
**Spec/brief:** Yêu cầu người dùng và brief dưới đây, dựa trên [audit hình ảnh](../../../../artifacts/reports/ui-audit-2026-10-28/visual-audit/report.html) và [manifest](../../../../artifacts/reports/ui-audit-2026-10-28/visual-audit/manifest.json).
**Cách thực hiện đã chọn:** Root điều phối nhiều Agent sửa và reviewer độc lập; phụ thuộc chạy tuần tự, các nhóm trang tách biệt chạy song song.

## Thẩm quyền và snapshot

- Người dùng đã duyệt plan qua review và cách thực hiện nhiều Agent ngày 2026-10-28. Chỉ đạo tiếp theo yêu cầu commit/sync tài liệu và kiểm tra dọn worktree trước triển khai; không hỏi duyệt plan lại.
- HEAD lúc audit: `8a4f18e`; giữ toàn bộ docs/skills dirty và bằng chứng có sẵn. Đây không phải snapshot commit sạch.
- Nguồn chuẩn: [frontend guide](../../FRONTEND_STYLE_GUIDE.md), [source rules](../../SOURCE_STRUCTURE_AND_NAMING_RULES.md), [execution](../../agent/EXECUTION_RULES.md), [quality](../../agent/QUALITY_GATES.md), [tooling](../../agent/TOOLING.md).
- Phạm vi: UI công khai/auth/dashboard/admin hiện có và các dialog/trạng thái truy cập được. Cả 29 route template có dòng coverage; nhánh callback là trạng thái, không được coi là integration hoàn tất.
- Không đổi API/DTO/status/ledger/quyền, thêm tính năng, đổi metadata/claim SEO, gọi provider/tốn phí, migration, liên kết/import Google hoặc submission.
- Không cài dependency, hook toàn cục, tự cập nhật package, merge/deploy hay dọn công việc không liên quan. Ngoại lệ được cho phép rõ ngày 2026-10-28: commit tài liệu/skills/bằng chứng trước triển khai và sync remote trên nhánh tài liệu; push main sẽ kích hoạt deploy production nên nằm ngoài phạm vi.
- Vùng tài liệu: dossier AI/VI này; cặp frontend guide hoặc UI follow-up chỉ khi triển khai được duyệt làm thay đổi cam kết UI. Không viết lại lịch sử ngoài phạm vi.

## Brief thiết kế và lựa chọn

Đây là tinh chỉnh các màn hình hiện có, không tạo nhận diện hoặc subsystem mới. Trang user/admin ưu tiên thao tác; bài công khai ưu tiên đọc; trang chủ giữ vai trò marketing. Giữ nhận diện tím/navy, màu semantic, font hiện tại, nội dung tiếng Việt có tính sự thật, điều hướng và ý nghĩa thao tác.

Đề xuất: thiết lập kích thước dùng chung gọn hơn, kiểm trang đại diện, rồi sửa phần dư cục bộ. Chỉ sửa từng trang sẽ để lại bất nhất dùng chung; thay nhận diện vượt yêu cầu chỉnh sửa.

**Mục tiêu đề xuất — trở thành tiêu chí nghiệm thu khi plan được duyệt, không phải mô tả UI hiện tại:**

- Topbar desktop dùng chung dashboard/admin: 56–64 px thay 76; khoảng đầu nội dung 20–24 px thay 42. Chỉ H1 trang vận hành: 24–28 px desktop, 22–24 px mobile; heading public/auth/bài đọc theo tiêu chí form/CTA/khả năng đọc riêng. Giữ body dễ đọc; không giảm zoom hoặc thu nhỏ font toàn cục để tạo cảm giác gọn.
- Tóm tắt mobile: grid/list gọn; tổng chiều cao ba metric lịch sử sử dụng/giao dịch credit không quá 180 px là khuyến nghị, không phải gate chặn. Bắt buộc: với bộ dữ liệu baseline ở 390×844, bản ghi đầu hoặc empty state hiện trong viewport đầu sau bộ lọc gọn; ghi số đo phần tử.
- Gate bắt buộc nạp credit: ở 390×844 với cùng năm gói local, gói đã chọn, số tiền và nút thanh toán hiện trọn trong viewport đầu, không phải cuộn qua toàn bộ card gói. Chọn gói khác cập nhật tóm tắt đang thấy; chứng minh bằng hình học và request-contract test cô lập, không thanh toán thật. Giữ lựa chọn gói, chi phí rõ và xác nhận thanh toán chủ động.
- Auth: ở 1366×768 thấy đủ form chính và nút chính không phải cuộn với nội dung bình thường. Mobile ưu tiên form; nút đăng ký hiện trọn ở 390×844 trong trạng thái đầu thông thường. Màn hình nhỏ hơn/lỗi/bàn phím mở được cuộn tự nhiên.
- Trang chủ: giảm heading/hero để CTA chính hiện trọn ở 1366×768. Sửa xung đột tên kích thước/màu `shadow-overlay` đã xác nhận; các consumer màu overlay vẫn đúng.
- Border/shadow tiết chế: giảm các lớp nổi, đặc biệt shell và trang trí landing; vẫn rõ phân cấp và focus. Không âm thầm xóa thông tin hữu ích.
- Motion: phản hồi ngắn cho hover/press/loading, tab/dialog khi có ích; giữ cơ chế popup đổi kích thước trước. Không thêm chuyển động trang trí vào dashboard, không clip nội dung khi chuyển động bị ngắt; tôn trọng reduced-motion.
- Thao tác chính mobile có vùng chạm tối thiểu 44×44 px. Control desktop được gọn nhưng phải rõ focus/label. Tương phản body tối thiểu 4.5:1; không có control ẩn/mất khả năng truy cập.
- Không tràn ngang document ngoài ý muốn hoặc cắt nội dung có nghĩa tại 320, 390, 768, 1024, 1366, 1920 px. Bảng rộng được cuộn trong container rõ ràng; overlay đang mở được che nền có chủ đích.

## Trọng tâm review

1. Nhãn tiếng Việt dài, tên người dùng và số dư lớn: wrap/truncate vẫn giữ ý nghĩa truy cập; không mất thao tác.
2. Empty/loading/error/dữ liệu dày: bố cục ổn định; metric không đẩy tác vụ chính xuống quá xa.
3. Màn hình hẹp, bàn phím/focus, cuộn modal: control truy cập được; header/footer sticky không che nội dung đang focus.
4. Mở/đóng/đổi tab nhanh và reduced-motion: không chồng nội dung, panel cũ, mất focus hoặc clip khi resize.
5. Luồng payment/credit/form: giữ chi phí, role, preview, xác nhận; sửa hình thức không đổi request.

## Vai trò Agent, quyền file và song song

Sức chứa native hiện tại: root và tối đa 3 Agent con đang hoạt động. Kiểm lại catalog provider/model khi giao việc; kế thừa model khả dụng, không giả định model vắng mặt. Reviewer chỉ đọc là Agent mới, không phải tác giả. Agent runtime có thể kết thúc lượt trong khi process app của nó vẫn chạy.

| Owner | Vùng production độc quyền ghi | Test/bằng chứng |
| --- | --- | --- |
| Runtime operator | Không code sản phẩm; chỉ start/restart/stop process sở hữu | Log, định danh PID/port và health |
| A — nền dùng chung | `apps/web/components/{shell-layout,ui,ui-styles,metric-card,base-table,pagination-controls,dialog}.tsx/.ts` theo tên thật; `app/globals.css`, `tailwind.config.ts`; motion chỉ khi có bằng chứng cần sửa | `shared-ui.spec.ts`, `account-navigation.spec.ts`; đề xuất `ui-refinement.spec.ts` |
| B — workflow user | `apps/web/app/dashboard/**`, trừ dashboard layout do A giữ; gồm NCKH callback; dependency cục bộ hiện có | `topup-ui.spec.ts`, `form-automation.spec.ts`, `nckh.spec.ts` |
| C — admin | `apps/web/app/admin/**`, trừ shell dùng chung; dependency cục bộ | `admin-ui.spec.ts`, `manual-credit-ui.spec.ts` |
| D — công khai/auth/kết quả thanh toán | `app/page.tsx`, `app/login/**`, `app/register/**`, `app/auth/**`, `app/google-forms/**`, `app/anti-abuse/**`, `app/payment/**` gồm layout và hai trang kết quả PayOS; `components/auth-shell.tsx`, `seo-keyword-page.tsx`, component landing hiện có | Auth/SEO check liên quan; đề xuất `public-ui-refinement.spec.ts` |
| Reviewer code/hành vi | Chỉ đọc snapshot ổn định đúng phạm vi | Finding có mức độ, path, tái hiện và bằng chứng |
| Reviewer thị giác/UX | Chỉ đọc snapshot ổn định + ảnh/browser thật | So sánh trước/sau, finding theo route/state, kết luận acceptance |
| Root điều phối | Dossier, sổ phạm vi/ownership và manifest bằng chứng | Giao việc, phân xử, gate tổng hợp, bàn giao người dùng |

- Chốt filename thật bằng manifest ownership file/test độc quyền trước giao việc; ký hiệu đuôi file ở trên không cho phép tạo biến thể song song. Dependency shared bổ sung phải được root phân quyền trước khi sửa. A sở hữu `dashboard/layout.tsx`, `admin/layout.tsx`, dashboard/admin shell consumer và account component dùng chung nếu cần sửa; B sở hữu `dashboard/nckh/callback/page.tsx`. A cũng sở hữu `dialog.spec.ts`/`dialog-fixture.tsx` và motion spec/fixture nếu áp dụng.
- Riêng task 1, A tạm sở hữu đúng các chỉnh sửa token/class consumer shadow trong `app/page.tsx` để loại xung đột tên. Sau khi kiểm chứng/review, root ghi bàn giao file cho D ở task 2; không có writer đồng thời hoặc CSS riêng trang để che xung đột.
- Làm trên checkout hiện tại với khóa file độc quyền sau khi giữ baseline; worktree mới từ HEAD sẽ thiếu skills/rules chưa commit. Không tạo commit chỉ để dựng worktree.
- A hoàn tất và qua review task trước khi B/C/D dùng style chung. Khi B/C/D chạy, khóa shared files; lỗi shared gửi root giao A sửa tuần tự, rồi kiểm lại consumer ảnh hưởng.
- Root có thể chạy B+C+D song song khi runtime operator nhàn; hoặc B+C cùng reviewer của nhóm đã khóa. Không có bốn Agent con cùng hoạt động.
- Mỗi reviewer nhận phạm vi, brief gốc, diff từ baseline đến task, hash file chính xác, ảnh, check, finding/phản hồi cũ và bất đồng còn lại. Không sửa vùng đang review đến khi có kết luận; vùng tách biệt khác được tiếp tục.
- Browser agent có tab riêng và luôn truyền tabId; quyền runtime/build/test độc quyền. Không chạy Next build/dev/test cùng ghi vào một `.next`.
- Mỗi vòng dùng delegated review task mới, ghi ID và snapshot. Nếu dùng T3 delegation: clientRequestId riêng từng vòng, task_status/task_cancel; không nhắn tiếp vào backing child thread để coi là vòng mới.

## Task thực hiện và gate

### 0. Giữ baseline, lấp khoảng trống audit — root + runtime operator

- [ ] Kiểm lại ownership app từ `artifacts/reports/ui-audit-2026-10-28/runtime-ownership.json`; health-check web/API/DB thật, không thay migration hoặc seed.
- [ ] Lưu git status và bytes/hash source gốc liên quan lúc bắt đầu dưới `artifacts/reports/ui-refinement-2026-10-28/baseline/`; diff sau đó so với bytes đầu task, không lẫn thay đổi HEAD ngoài phạm vi.
- [ ] Tạo ma trận 29 route: role, viewport, state/data, ảnh baseline, finding, owner, ảnh sau và Verified/Failed/Not run/Blocked.
- [ ] Xác định session User/Admin thật và NCKH form hiện có được phép dùng. Tái hiện dữ liệu dài, empty/loading/error, modal và bước workflow bằng API fixture cô lập khi cần; gắn nhãn mock.
- [ ] Giữ rõ giới hạn audit: chưa có NCKH form đã nhập, chưa audit User riêng, callback provider mới thiếu params. Fixture không biến trạng thái thật còn thiếu thành Verified; hỏi prerequisite thiếu trong khi tiếp tục phần độc lập.
- [ ] Gate: baseline cố định, target an toàn và ownership được ghi; không tuyên bố trước đây đã kiểm mọi trạng thái.

### 1. Nền dùng chung — A, phụ thuộc phải chạy tuần tự

- [ ] Đọc đầy đủ component ảnh hưởng, consumer và test. Dùng reference tinh chỉnh Impeccable; chỉ đọc craft-floor ngay trước sửa UI thật; tra UI UX Pro Max cho câu hỏi UX cụ thể.
- [ ] Tái hiện xung đột shadow bằng computed style. Thêm regression tập trung trong `ui-refinement.spec.ts`: shadow landing mục tiêu có alpha mờ đúng và backdrop overlay giữ màu đúng. Xác nhận fail trước sửa rồi pass sau sửa.
- [ ] Áp dụng shell/header/metric/table gọn với prop contract export không đổi. Giữ resize modal; chỉ sửa motion code nếu tái hiện được lỗi.
- [ ] Thêm regression hình học/khả năng truy cập có ý nghĩa cho fold lịch sử 390×844, overflow 320 px và truy cập popup bằng bàn phím; không snapshot mọi CSS class.
- [ ] Chụp dashboard, lịch sử, top-up, admin và popup đại diện trước/sau tại laptop/mobile với nội dung giống nhau.
- [ ] Chạy shared/account test liên quan; review code/hành vi và thị giác độc lập mới. Gate: không còn finding chặn, tỷ lệ chung nhất quán, root ghi baseline nội bộ cho các worker trang.

### 2. Consumer từng trang — B/C/D, chỉ song song sau task 1

- [ ] B: tinh gọn tổng quan, bước form/tóm tắt, nạp credit, lịch sử và AI usage; xem workspace NCKH khi có dữ liệu. Giữ preview/xác nhận và request payload; không analyze/submit form bên ngoài chỉ để chụp ảnh.
- [ ] C: tinh gọn metric, filter, bảng, alert và phân cấp setting ở tám trang admin; giữ đầy đủ thông tin an toàn và thao tác credit/payment chủ động.
- [ ] D: tinh gọn hero/shadow trang chủ, ưu tiên form auth và khoảng cách bài viết; giữ metadata/schema, URL, nội dung sự thật và vai trò marketing công khai.
- [ ] Mỗi worker chứng minh acceptance của mình, chạy test liên quan rồi khóa phạm vi cho review độc lập. Test owner không sửa file nhóm khác.
- [ ] Gate: từng nhóm có ảnh trước/sau tương ứng, không còn blocker thị giác/hành vi. Regression shared mở lại task 1 và kiểm lại nhóm bị ảnh hưởng.

### 3. Runtime và thị giác toàn app — root + runtime operator + reviewer độc lập

- [ ] Dừng dev sở hữu trước `npm run build` hoặc Playwright dùng cùng checkout; giữ log. Từ `apps/web`: `npm run lint`, `npm run build` (gồm check:colors), `npm run test:auth`.
- [ ] Chạy regression ảnh hưởng: shared-ui, account-navigation, topup-ui, admin-ui, manual-credit-ui, form-automation, nckh và refinement spec mới tại vùng sửa. Đọc fixture trước. Playwright mặc định port 3000: xác nhận ownership target đó, không nhầm live 3020/API 7039.
- [ ] `motion.spec.ts` cần motion fixture cô lập theo hướng dẫn; không chạy mù vào route production không tồn tại. Chạy nếu đổi motion; còn lại dùng popup/account check hiện có.
- [ ] Nếu đổi `dialog.tsx`, primitive xác nhận hoặc export `ui.tsx` liên quan, A chạy `dialog.spec.ts` bằng `/dialog-test` từ `dialog-fixture.tsx` trong môi trường fixture cô lập: confirmation, focus trap/return, khóa cuộn body và reopen. Không thêm route fixture vào sản phẩm. Nếu không đổi các phần đó, ghi rõ gate không áp dụng và lý do này.
- [ ] Ảnh hưởng công khai/metadata: chạy SEO spec liên quan bằng config/target sở hữu rõ, không gửi indexing request hoặc thay provider.
- [ ] Restart runtime sở hữu bị ảnh hưởng trên code cuối, smoke API/browser thật tại web 3020/API 7039 với session đúng. Kiểm hydration/pageerror, CSS/JS chunk 200 và server log liên quan; không đánh đồng mock với live.
- [ ] Phủ route tại laptop 1366×768 và mobile 390×844. Rủi ro shared/template/layout đại diện kiểm thêm 320, 768, 1024, 1920 px; phóng đại/bàn phím và reduced-motion khi liên quan.
- [ ] Kiểm cuộn bảng nội bộ, dropdown, focus return, popup giãn/co, nhãn dài, bản ghi dày, thao tác nhanh. Không cần thanh toán/cộng credit/tốn provider/submission; thao tác đó dùng request-contract test cô lập.
- [ ] Chạy detector Impeccable một lần trên UI đã sửa khi hoàn tất; phân loại finding theo nguồn chuẩn dự án, không tự sửa toàn bộ máy móc.
- [ ] Reviewer code/hành vi và reviewer thị giác/UX cuối cùng đều là Agent mới, đọc snapshot tổng hợp đã khóa, không chỉ bản tóm tắt từng task.

### 4. Sửa và review lại đến khi đạt acceptance

- [ ] Root giữ sổ finding: ID, mức độ, route/state, bằng chứng, owner, phương án sửa, snapshot đã sửa, recheck và kết luận độc lập.
- [ ] Mỗi vòng: reviewer gom finding → owner sửa đúng vùng → check ảnh hưởng và ảnh cùng kích thước → reviewer độc lập mới kiểm snapshot mới.
- [ ] Mỗi lượt implementer là một batch inspect/fix/confirm có trọng tâm; finding còn lại quay về chu trình review do root điều phối. Yêu cầu tiếp tục review của người dùng và gate dự án ưu tiên hơn giới hạn polish-loop trong skill.
- [ ] Không lấy số vòng tùy ý để đổi fail thành pass. Sau hai vòng còn cùng nguyên nhân, root chẩn đoán lại nguyên nhân/ownership thay vì chồng chỉnh sửa trang trí.
- [ ] Bất đồng thẩm mỹ được xét theo brief và ảnh trước/sau. Chỉ hỏi lại khi thực sự thiếu quyết định thiết kế/phạm vi; sửa thường lệ đúng scope không cần xin phép lặp.
- [ ] Chỉ dừng khi đạt mục tiêu đo được, cả hai reviewer không còn finding chặn và các route/state gate bắt buộc đều Verified. Trạng thái thật còn thiếu giữ scope tương ứng Blocked, không tuyên bố Done toàn app.

### 5. Bằng chứng cuối và bàn giao

- [ ] Tạo gallery trước/sau tìm kiếm được, ma trận route/state, check log và review ledger dưới `artifacts/reports/ui-refinement-2026-10-28/`.
- [ ] Cập nhật dossier và cam kết UI ảnh hưởng theo cặp; kiểm UTF-8, link, ý nghĩa AI/VI, diff task và baseline được bảo toàn.
- [ ] Báo cáo tiếng Việt gồm tóm tắt, file đổi, khớp phạm vi, kiểm đã/chưa chạy, rủi ro/Deferred, bước tiếp; tách implemented/reviewed/local verified với integrated/released.
- [ ] Root trình kết quả để người dùng nghiệm thu thị giác; feedback đúng scope tiếp tục cùng sổ finding/review. Giữ runtime sở hữu cho người dùng xem trừ khi yêu cầu dừng; không ngầm phát hành.

## Trạng thái và bước tiếp

- Verified: có bằng chứng audit trước; đã xác định source/test liên quan và công cụ browser/delegation; hiện chỉ lập plan.
- Not run: toàn bộ triển khai, tiêu chí UI mới, check sản phẩm và review UI cuối.
- Review plan vòng 1 (`/root/ui_plan_review`): đã xử lý bốn finding: ownership payment/callback và dependency shared; bàn giao consumer shadow A→D tuần tự; typography đúng vùng và hình học bắt buộc so với khuyến nghị; regression dialog cô lập có điều kiện.
- Vòng 2 độc lập (`/root/ui_plan_rereview`): Ready để người dùng duyệt plan; không còn finding chặn. Phạm vi/gate AI/VI tương đương. Hash nội dung đã review trước lần chỉ cập nhật trạng thái này: AI `58efad5589be679afbf68ce75ccbaba96872fc97793eeb051debebd8e5612e8c`, VI `fbe3acc65e837a6bcd69ca5f26cd4eacb769fefb49a2920a670562ac0e5eb0ee`.
- Check tài liệu: hai file UTF-8 có 37 checkbox thực hiện, cả bảy link tương đối tồn tại; không đổi source sản phẩm. Check sản phẩm giữ Not run.
- Kiểm Git trước triển khai: chỉ có checkout chính; không có worktree phụ hoặc registration cũ cần xóa. Hai branch UI lịch sử đã merge vào main nhưng không có worktree; giữ nguyên branch. Remote main khớp HEAD trước sync. Skill mirror sync/check: 24 skill, 293 file mirror, không sai lệch.
- Ranh giới công bố: ảnh/manifest audit UI thô và ảnh lịch sử chưa review đầy đủ giữ local, loại qua Git local excludes, không xóa. Review privacy thấy nội dung email trong overflow metrics; log SQL thô đã thuộc ignore log của repo. Chỉ commit bằng chứng văn bản đã review; link artifact local không có nghĩa các file thô được công bố.
- Tiếp theo: hoàn tất sync tài liệu sạch đã được phép trên `docs/pre-ui-refinement-20261028`, rồi thực hiện task 0 và giao task 1 theo approval này; không audit lại toàn bộ từ đầu.
