# Báo cáo triển khai frontend FAH-DIRECT-001

Ngày: 2026-11-01
Chủ sở hữu: frontend implementer
Trạng thái: đã xác minh và freeze bản sửa F1-F4 cục bộ; runtime và review độc lập mới vẫn thuộc task root

## Tóm tắt

- Chế độ Quy tắc chỉ còn một hành động `Tạo và gửi ngay`, không có accordion preview, checkbox xác nhận hoặc lời gọi route gửi preview chung.
- Yêu cầu trực tiếp dùng `POST /api/projects/{projectId}/submissions/send-rules-direct` với đúng payload `{ commandId, count }`.
- Snapshot command lưu `projectId`, `commandId`, `count`, `userId` và thời điểm tạo trước khi POST trực tiếp; chỉ khôi phục cho đúng người dùng đang đăng nhập.
- Khi lỗi mạng hoặc phản hồi không đọc được, UI giữ nguyên command và hiển thị `Kiểm tra kết quả gửi`; thao tác này không lưu lại rules và không tạo command ID mới.
- Kết quả HTTP terminal xóa command đang chờ. Việc đọc lại số dư credit được tách riêng, không thể phát lại hoặc làm mất kết quả gửi đã xác nhận.
- Job một phần so sánh `SubmissionJob.total` với số lượng yêu cầu gốc và hiển thị đúng số đã gửi cùng số còn thiếu.
- AI Option 2 và Option 3 giữ nguyên luồng đọc preview đã tạo, checkbox xác nhận và request chung `/submissions/send` với `confirmed: true`.
- Sửa review F1: job `Failed` có marker kết quả chưa xác định giữ nguyên command và chặn mọi action direct mới; các lần kiểm tra tiếp tục dùng cùng command.
- Sửa review F2 (hành vi vòng 2 hiện tại): status HTTP đơn lẻ không mở khóa command. POST 400/409 kích hoạt probe job đã lưu an toàn theo owner/session mô tả bên dưới; lỗi chưa giải quyết khác giữ command.
- Sửa review F3: storage command được scope theo user, đồng bộ giữa tab, serialize bằng Web Locks và chỉ xóa khi command ID đang lưu vẫn khớp. Trình duyệt thiếu Web Locks fail closed trước khi ghi rules.
- Sửa review F4: `total` được ghi là số đã tạo/nhận xử lý; số provider gửi thành công và thất bại dùng riêng `successCount` và `failedCount`.
- Sửa review F2 vòng 2: POST 400/409 được đối soát bằng `GET /api/projects/{projectId}/submissions/jobs/{commandId}` dưới đúng session user ban đầu. GET 200 hợp lệ và khớp sẽ áp dụng job hiện có; GET 404 cùng session mới mở khóa; probe lỗi, malformed, sai identity hoặc đổi session đều giữ command fail-closed.

## Tệp đã thay đổi

- `apps/web/app/dashboard/forms/page.tsx`
- `apps/web/app/dashboard/forms/_types.ts`
- `apps/web/app/dashboard/forms/_constants.ts`
- `apps/web/app/dashboard/forms/_helpers.ts`
- `apps/web/app/dashboard/forms/_components/WorkflowSummary.tsx`
- `apps/web/tests/direct-rule-submission.spec.ts`
- `apps/web/tests/form-automation.spec.ts`
- `apps/web/tests/fah-err-forms-errors.spec.ts`
- `docs/ai/tasks/FAH-DIRECT-001/FRONTEND.md`
- `docs/vi/tasks/FAH-DIRECT-001/FRONTEND.md`

## Phù hợp phạm vi

- Chỉ thay đổi frontend form hiện có, test frontend bị ảnh hưởng và báo cáo paired này.
- Không sửa backend, task index, dependency, design token; không thao tác Git, deploy, Google thật, thanh toán hoặc AI trả phí.
- Mã tạo rule preview cũ không còn đường truy cập từ chế độ Quy tắc. Recovery Rules preview cũ được xóa thay vì phát lại mutation; recovery AI giữ nguyên.

## Xác minh đã thực hiện

- Verified TDD RED: suite direct-rule ban đầu có 3 lỗi đúng dự kiến vì UI cũ vẫn còn preview/xác nhận Rules; 2 ca regression AI đã pass ngay trên code cũ.
- Verified TDD RED cho F1-F4/no-lock: sáu lỗi focused tái hiện đúng các nhánh terminal/5xx/storage/copy không an toàn; test thiếu Web Locks cũng fail trước khi thêm guard fail-closed.
- Verified: `npx playwright test tests/direct-rule-submission.spec.ts tests/form-automation.spec.ts tests/fah-err-forms-errors.spec.ts --project=chromium --workers=1` — pass 30/30.
- Verified: `npm run lint` — exit 0; còn 2 warning `react-hooks/exhaustive-deps` có sẵn tại component tài khoản ngoài scope.
- Verified: `npm run build` — pass kiểm tra color token, TypeScript, production compilation và static generation 33 trang; vẫn báo 2 warning ngoài scope nêu trên.
- Verified: Impeccable detector trên UI form đã đổi trả về `[]`.
- Verified: đã chụp và gửi SHA256 của tám tệp frontend frozen cho root/runtime; `page.tsx` là `6F10FE8780478A6F9A2EB20BBD01253F42936078E3932EE7C28C5F57AF7E7C12`.
- Verified RED/GREEN F2 vòng 2: đã thêm các ca post-admission 400→GET 200, pre-admission 400→GET 404, reconcile lỗi, job sai identity và đổi session; `npx playwright test tests/direct-rule-submission.spec.ts --project=chromium --workers=1` pass 17/17.
- Verified F2 vòng 2: `npm run lint` exit 0 với hai warning ngoài scope cũ; `npm run build` pass color token, TypeScript, compilation và generation 33 trang; detector trả về `[]`.
- Hash frozen F2 vòng 2: `page.tsx` `51AF7F64AE72AA5000CB51461D7D8308A682C577A983666A1282A7834B0127E0`; `_helpers.ts` `C0CF496065859B5283E89C349062BDBB4B7AFFF98419BA2E1D5FF72F8BB10B64`; direct spec `D41A2D599B391F7895743C13D269967FDEE6DD70B38361A583C803BC519E2A9A`. Năm hash frontend review còn lại không đổi so với freeze trước.

## Xác minh chưa thực hiện

- Not run: tích hợp browser với backend thật, runtime local có đăng nhập, Google thật, payment hoặc AI trả phí. Các bước này ngoài quyền sở hữu runtime của frontend writer và đã được root phân công riêng.
- Not run: toàn bộ Playwright suite của repository; đã chạy các suite bị ảnh hưởng theo yêu cầu.
- Not run: review độc lập; self-review không thay thế review độc lập.

## Rủi ro và Deferred

- Recovery thông thường gọi lại endpoint direct bằng cùng command, chỉ đọc reservation đã được nhận mà không chạy lại. Đối soát sau POST 400/409 dùng route GET job hiện có vì command ID được nhận chính là job ID.
- Job active/non-terminal từ server tiếp tục khóa command và chỉ cho kiểm tra lại cùng command; UI không cho pause/cancel hoặc tạo hành động direct mới khi chưa giải quyết.
- Web Locks là điều kiện bắt buộc để tạo direct command an toàn giữa nhiều tab. Trình duyệt không hỗ trợ nhận trạng thái fail-closed rõ ràng và không thể lưu rules hoặc tạo direct command.
- Warning lint ngoài scope và cảnh báo dữ liệu Browserslist cũ được giữ nguyên.

## Bước tiếp theo đề xuất

Root chạy authenticated browser smoke trên frontend đã frozen và backend hiện tại, sau đó hoàn tất review độc lập trước mọi quyết định tích hợp hoặc release.
