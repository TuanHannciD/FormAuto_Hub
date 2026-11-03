# Sổ thực thi — docs/ai/tasks/FAH-UI-003/PLAN.md

## Nghiệm thu ảnh và quyền chốt task — 2026-11-03

Người dùng đã nghiệm thu kết quả ảnh, yêu cầu rà/tinh gọn trang user còn lại theo cùng quy tắc, dọn task và merge local; người dùng tự push/deploy. Quyền này thay giới hạn không commit/merge local trước đó cho file thuộc task. Không push/deploy/install/tác động thật. Root triển khai inline; scout chỉ đọc user_pages_final_audit và nckh_user_final_audit đều kiểm catalog gpt-6.1-sol/high, không agent lồng.

Plan: U1 rà đủ các bề mặt user còn lại; U2 tinh gọn metadata lượt AI/card chế độ khi có dữ liệu, làm rõ nhãn metric theo trang, đặt tên ổn định filter có sẵn và nút sao chép44px; U3 xử lý finding NCKH về chữ/bố cục trong phạm vi nhỏ; U4 regression chọn, ảnh có dữ liệu/đã ổn định, build/lint/auth và review độc lập mới; U5 sao lưu nguyên hồ sơ/ảnh task gốc ở main ra ngoài repo và kiểm hash, commit file task, fast-forward main local nếu đúng ancestry, kiểm bản đã merge và dọn tài nguyên sinh ra thuộc task. Main chỉ có ba thư mục task untracked gốc; giữ worktree normalize-topup không liên quan. Xóa worktree gắn T3 phải theo quyền sở hữu host; giữ nếu không có công cụ thoát workspace được hỗ trợ.

Ruling: nghiệm thu ảnh của người dùng chấp nhận giới hạn đo lịch sử, không biến thiếu kiểm tra thành pass; baseline AI và thiết bị/zoom thật vẫn Not run. Không cần thiết kế lại để chốt local. Không mở rộng contract/nghiệp vụ; vẫn báo giới hạn tích hợp.

## Kết quả hiện tại — đã xác minh triển khai cục bộ

Đã triển khai T1–T7; hoàn tất kiểm tra cục bộ áp dụng và review độc lập T8. T0 có thiếu hụt lịch sử rõ ràng: không có ảnh trước của AI đã lưu/kết quả. Không thể tái tạo trung thực số đo đó; đã kiểm/chụp trạng thái chỉ-sau. Không khẳng định tích hợp/phát hành.

| Trạng thái | Bằng chứng / phạm vi |
| --- | --- |
| Verified | Build exit0 (`build.log`) gồm gate token màu; lint exit0 (`lint-final.log`), hai cảnh báo cleanup effect tài khoản có sẵn; auth9/9 (`auth-final.log`) |
| Verified | Regression chọn cuối171 đạt, một test bổ sung mới sai giả định disclosure/tiêu đề kết quả (`final-regression.log`); sửa test rồi cả suite forms10/10 (`forms-accepted.log`); ca reflow cuối1/1 (`ai-mobile-reflow-final.log`). Tổng hợp có bằng chứng đạt cho172 ca đã chọn; không khẳng định có một lần chạy172/172 |
| Verified | Next do runner sở hữu được khởi động lại sau build; route/chunk/hydration với phiên giả lập;61 ảnh sau và manifest không lỗi trang/chunk/tràn ngang. Không có mock API/server chạy tách nền |
| Verified | AI đã lưu30câu trả lời dài tại320/390/430×568: focus vùng cuộn có tên, nút gửi44px, chế độ reduced-motion, khóa trước xác nhận và gửi đúng ID/kết quả sau xác nhận;683×384 mô phỏng reflow1366×768 tại200%. Root đã xem ảnh cuối |
| Verified | Review nguồn và ảnh đại diện độc lập, không còn P1/P2. Detector cuối `[]`; `git diff --check`; checker tài liệu song ngữ |
| Not run | Ca textarea host riêng3001 không đổi; zoom bằng UI trình duyệt/thiết bị thật; API/DB/Google/AI/PayOS thật. Reflow không phải zoom trình duyệt thật; phiên giả lập không chứng minh đăng nhập tích hợp |

Reviewer nguồn `/root/final_source_review` và ảnh `/root/final_visual_review`: đều kiểm catalog thực tế `gpt-6.1-sol/high`, chỉ đọc, không agent lồng. Reviewer trước `/root/t1_safety_review`, `/root/forms_shell_review`, `/root/operations_review` cùng giới hạn; đã giải quyết finding. SHA256 diff production `b0dfa7fc3043392a94b3758aba09ccfec34a7f7413ecbe4c9ea1e45afe970f3d` (29file).

Ruling: prop số dư trình bày cục bộ AiModePreparationPanel dùng state sẵn có; ariaLabel tùy chọn của DropdownSelect/SearchableDropdownSelect hiện có bổ sung khả năng truy cập còn thiếu đã chứng minh, kiểm cả bốn tên NCKH. Không đổi callback/API/payload. Reviewer phát hiện ariaLabel nhầm kiểu option; đã chuyển sang DropdownSelectProps trước build thành công.

Geometry390px cùng dữ liệu giả lập: tổng quan1262→988; nạp2228→2050; rules10câu7690→6958; AI mặc định30câu7606→6092. Không giảm mọi trang: manual-credit1288→1288, payments959→983. Toast/loading/vị trí cuộn chưa chuẩn hóa; chỉ là chiều cao tài liệu tham khảo, không khẳng định tốc độ/usability. Ảnh fullPage sticky không chứng minh che khuất khi thao tác. Giữ phần khoảng trắng panel cấu hình theo hành vi sticky hiện có.

Thử nghiệm không hợp lệ: giữ `after-only/ai-preview-desktop-css-zoom-200.png` làm lịch sử, loại khỏi nghiệm thu. CSS root zoom không đổi media query; đã thay ảnh reflow đúng kích thước. Giữ log lỗi khi viết test bổ sung; không suy ra lỗi sản phẩm từ chúng.

Phạm vi: đánh giá đủ18route sau đăng nhập; sửa29file production trong ownership đã duyệt; giữ nguyên unit tài khoản/callback/canvas vốn đủ gọn. Không đổi backend/API/DB, không dependency mới, commit/push/merge/deploy hay tác động provider. Giữ nguyên bản chính và worktree không liên quan. Tiếp theo: người dùng có thể xem diff/ảnh cục bộ; tích hợp/phát hành là hành động riêng.

## Historical ledger / Lịch sử thực thi

## Phê duyệt và snapshot

2026-11-02: người dùng duyệt rõ kế hoạch (“Tôi duyệt kế hoạch này”), chấp nhận cách làm inline được khuyến nghị kèm review độc lập có giới hạn. Được triển khai/kiểm tra/tài liệu cục bộ; chưa được commit/push/merge/deploy/chi phí provider hoặc dọn dẹp phá hủy.

Base nguồn: `817bdee8519e7cc658794d99f52171d60ebb36a8`, root `D:/TinHoc/FormAuto_Hub`, nhánh `main`. Giữ untracked: hồ sơ task song ngữ và `artifacts/reports/ui-cleanup-2026-11-02/`. Worktree `t3/normalize-topup-evidence-columns` khác không thuộc task, không chạm tới.

## Chuẩn bị và quyết định

- Skill đã đọc: executing-plans, test-driven-development, using-git-worktrees, craft floor Impeccable, systematic-debugging. Quyền dự án cao hơn helper script, tự commit và cleanup.
- Ruling: làm trong worktree do T3 tạo từ SHA cục bộ, không setup script/install — giữ main và worktree khác. Chuyển rõ docs/artifacts task chưa commit, không tự commit chúng.
- Ruling: thử webServer tạm thời do runner Playwright regression hiện có quản lý với API route fixture, thay vì lệnh process web+API ẩn đã bị từ chối. Đây là vòng đời test đã duyệt, không mock API chạy tách, không retry helper/wrapper cũ. Nếu bị từ chối, dừng hành động đó và ghi đúng lý do, không vượt chặn.
- Phụ thuộc trước chạy: T1/T2 chung forms state/callback/test, root ghi tuần tự; T2/T3 chung kỳ vọng shell/stacking, kiểm trước chuyển task; pattern record T3 cấp cho T4–T7 qua props BaseTable hiện có; T4/T5 chung test tài khoản/thanh toán, làm tuần tự; T6 khác trang nhưng chung runtime/test host, làm tuần tự.
- Inventory runtime: không listener3000/3020/3035/3036/7039/5235 khi chuẩn bị. Chưa lấy session/DB thử. Công cụ T3 preview có sẵn, chưa tab attached.

## Trạng thái task

- T0: đang làm — handoff native sang `ui/fah-ui-003`, rồi copy hồ sơ, kiểm dependency và chạy fixture regression/baseline hiện có. Chưa sửa sản phẩm.
- T1–T8: chưa làm.

## Bước tiếp chính xác

Gọi native `t3_worktree_handoff` cuối lượt với `startFromOrigin:false`, `baseRef:817bdee8519e7cc658794d99f52171d60ebb36a8`, `branch:ui/fah-ui-003`, `runSetupScript:false` và hướng dẫn tiếp tục. Trong checkout mới chỉ copy docs/artifacts do task sở hữu từ main, giữ nguyên bản gốc; tái dùng dependency đã cài không install nếu được. Đọc plan/spec và làm T0→T8 không hỏi lại giữa task. Root triển khai; review độc lập chỉ dùng Sol đã kiểm catalog <=gpt-6.1-sol/high, ghi cấu hình thực tế.

## Continuation / Tiếp tục — 2026-11-02

- Worktree active: `C:/Users/Tuan/.t3/worktrees/FormAuto_Hub/ui-fah-ui-003`, branch `ui/fah-ui-003`, base817bdee. Task docs/artifacts copied; originals preserved. / Đã copy hồ sơ task, giữ nguyên bản gốc.
- Cross-drive dependency junction failed Next resolution. Replaced only verified junction with local copy of existing deps, no install. / Junction khác ổ gây lỗi; đã thay bằng bản sao dependency hiện có.
- Verified: existing rules browser test1/1 via Playwright transient webServer, all APIs intercepted; no DB/provider. / Kiểm thử quy tắc đạt1/1 với API giả lập.
- T0 baseline running; T1 reproduction tests added, no product edits. / Đang chụp baseline, đã thêm test tái hiện T1, chưa sửa sản phẩm.
- Next: finish baseline → T1 RED/GREEN → T2–T8 inline, independent reviews. No permission checks/commits/remotes/live effects. / Tiếp tục đúng phạm vi đã duyệt.

## T0/T1/T2 checkpoint — 2026-11-02

- T0 Verified baseline runner1/1,61 screenshots + manifest + SHA256 under `before/`;18 routes + account profile/security, forms rules/AI default/custom1/10/30,320/430/768 edges. Synthetic Admin session; all APIs intercepted. Supplementary AI preview/result states still required; no measured improvement claim yet.
- T1 RED2/2 reproduced missing anchor and stale count; GREEN37/37 (`t1-green.log`). Reviewer `/root/t1_safety_review`, catalog-confirmed actual `gpt-6.1-sol/high`, found empty-supported-question missing anchor. Reproduced with extra RED case (`t1-review-red-t2-green.log`), fixed enabled gate; final green/re-review pending. Root remains sole implementer.
- T2 RED missing real quantity label (`t2-red.log`); GREEN quantity/cost case passed in combined review run. Compact metadata/modes/questions and copy in progress. A JSX closing-tag edit error was caught during startup and corrected; it is not counted as RED finding evidence.
- Ruling: add local `balance: number | null` presentation prop to AiModePreparationPanel, using existing balance state, to satisfy same-action-region context; no fetching/billing contract/state added. Cost if wrong: local prop adjustment only.
- T3 keyboard regression added; RED running. No shared source changes yet.

## T3–T7 implementation checkpoint — 2026-11-02

- T3 RED missing accessible modal (`t3-red.log`); mobile navigation now existing Dialog with native focus trap/Escape/return and desktop breakpoint close; removed inactive admin tools. Shared API unchanged.
- T4 compact package spacing, remove repeated payment steps, combine mobile payment/evidence facts; detail empty evidence smaller. Account profile/security and routed-detail controller assessed already compact; preserved source. No payment/auth payload edits.
- T5 package copy clarified; PayOS secret-preservation warning stays visible, general URL help expandable; AI endpoint help concise; manual grant/approval-critical facts retained.
- T6 RED model label missing (`t6-red.log`); added persistent labels to model/variable/mapping inputs and visible dropdown group captions. Canvas geometry preserved pending measured need; callback behavior/source already compact and unchanged.
- T7 RED user AI missing GET retry (`t7-red.log`); explicit read retries added user AI/admin payments, no write replay. Histories use existing mobileFooter details for descriptions; overview greeting/redundant min-height removed; admin generic warning becomes help; no-op exports and unavailable chart/filter/promises removed. Vietnamese AI mode/time copy; PayOS return CTA translated.
- Regression63/65 first combined run: account-switch fixture reinstalled user on every reload, now initial-session-only; Google rendering test lacked synthetic public client ID, now passed to runner. One interrupted run reused server while prior runner shutdown; refused connections were harness lifecycle failure, rerun after port release.
- Full regression171 cases running (`full-regression.log`). `forms_shell_review` independently reviewing current T1–T3, actual catalog-confirmed `gpt-6.1-sol/high`, no edits/runtime.
- Ruling: standalone3001 textarea host not available and shared textarea unchanged; omit that unrelated host-only case, record Not run; regression of affected controls uses actual authenticated routes. No alternate detached fixture server.

Kiểm tài nguyên cuối: runner kết thúc exit0; không listener3000/3001/3035/3036. Xác nhận lại hash diff production; lưu manifest kiểm tra cuối trong artifact task.

## Kết quả U1–U3 — 2026-11-03

Hai scout chỉ đọc đã rà lịch sử/tài khoản/nạp và NCKH danh sách/workspace/callback cùng PayOS liên quan. Hồ sơ/bảo mật, callback, overview/delete dialog và hành vi canvas đã đủ rõ nên giữ nguyên. Root tinh gọn metadata/card chế độ AI có dữ liệu; nhãn credit theo trang; tên ổn định cho filter/gói; nút copy44px mobile; gom trạng thái Google đã liên kết vào card nhập; giữ một empty-state khi chưa có mô hình; tiêu đề popup theo việc, canh form ánh xạ; nêu rõ giới hạn dòng/cột preview dữ liệu có sẵn. Không thêm field/handler/endpoint.

Bằng chứng RED: user-followup-red.log tái hiện5 thiếu hụt thực; ca AI có locator mơ hồ lúc đầu (không tính RED sản phẩm), đã sửa và tái hiện metadata kỹ thuật luôn mở trong user-ai-corrected-red.log. Đợt tiếp110/112; hai giả định test về tên giá trị/geometry khi dialog chưa mở xong được sửa, user-review-fixes.log2/2. Reviewer mới closeout_independent_review (kiểm catalog gpt-6.1-sol/high) phát hiện aria-label tĩnh che giá trị đang chọn; dropdown-description-red.log tái hiện thiếu accessible description; nối span giá trị bằng aria-describedby riêng cho consumer có nhãn. Đang chạy build/regression cuối.

Đã copy14file task gốc ở main/121827byte và kiểm toàn bộ SHA256: D:/TinHoc/FormAuto_Hub-task-archive/FAH-UI-003-20261103/original-main/backup-manifest.json. Giữ nguyên byte gốc khi merge local thay hồ sơ untracked cũ bằng bản cuối đã duyệt. T3 xác nhận workspace hiện do host gắn; không có tool thoát/đổi workspace được hỗ trợ nên giữ checkout sạch thay vì xóa workspace của thread đang chạy. Chỉ dọn dependency/cache do task tạo sau khi kiểm tra và sao lưu; giữ checkout không liên quan.


## Kiểm tra bổ sung cuối — 2026-11-03

Verified:179/179 ca Playwright chọn (`closeout-regression-final.log`), gồm61ảnh bản cuối và15ảnh user/NCKH có dữ liệu/đã ổn định; build exit0 (`closeout-build-final.log`), lint exit0 với hai cảnh báo cleanup tài khoản không đổi (`closeout-lint.log`), auth9/9 (`closeout-auth.log`), detector `[]`, whitespace diff và checker song ngữ. Next khởi động lại do runner sau build cuối; API/session fixture, không tác động thật. SHA256 diff production `20a7959a3ab0ec02619fc579881bad96c0e4fcd3dfb2e11f22641df37cf6a7e1`. Reviewer đã đọc lại bản sửa description giá trị; đang chờ kết luận ảnh đại diện cuối trước commit.

Đã chuyển helper/thử nghiệm hết dùng sang archive ngoài repo `retired-artifacts` và kiểm SHA256: start-fixture.ps1 bị từ chối, fixture-api.cjs không dùng, bản copy source tạm, ảnh CSS-zoom không hợp lệ và ảnh thăm dò user không phải baseline. Giữ bằng chứng before/after/final hợp lệ trong repo; đường dẫn ảnh tương đối giúp report mở được sau dọn checkout. Không chạm file/process không liên quan.


Review cuối độc lập chấp nhận nguồn và ảnh cuối đại diện, không còn P1/P2. Reviewer closeout_independent_review thực tế gpt-6.1-sol/high; lưu closeout-review.md. U4 Verified; tiếp theo đã được duyệt: commit riêng task, fast-forward main local, smoke bản đã merge và kiểm trạng thái sạch.
