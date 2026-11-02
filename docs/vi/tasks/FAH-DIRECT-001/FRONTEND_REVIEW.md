# FAH-DIRECT-001 — Review lại frontend độc lập

Ngày: 2026-11-01. Reviewer: `/root/direct_rules_frontend_review`, `gpt-5.6-sol`, reasoning `high`; độc lập với tác giả frontend, không agent con. Base: `297ee2143f7a37ca02739157d75e3db06ab4be17`; snapshot frontend dirty/untracked hiện tại đã đóng băng, không commit.

## Summary

**Kết luận spec/code review hiện tại: Passed; F1–F4 đã được giải quyết.** Review lại độc lập cuối ngày 2026-11-02 bởi `/root/direct_rules_final_review`, `gpt-6.1-sol`, reasoning `high`, đã xác minh snapshot F2 vòng 2. Không phát hiện finding Critical/Important mới. **Kết luận chất lượng: runtime acceptance tách riêng, chờ root tổng hợp bằng chứng browser/API/SQL cuối của runtime owner.** Đây không phải tuyên bố local Done hoặc release. Finding F2 ban đầu bên dưới được giữ như lịch sử.

## Trạng thái finding

### F1 — Đã giải quyết: job terminal chưa xác định giữ command

- Verified tại `apps/web/app/dashboard/forms/page.tsx:492`: log có marker chưa xác định ngăn clear terminal; command tiếp tục bị khóa và được kiểm bằng cùng ID.
- Có coverage tại `apps/web/tests/direct-rule-submission.spec.ts:202`: action direct vẫn disabled, rule chỉ ghi một lượt, lần kiểm tra lặp lại dùng ID cũ và storage giữ ID đó.

### F2 — Important, đã giải quyết ở vòng 2: HTTP 400 không phải discriminator pre-admission đáng tin cậy

- Vị trí: `apps/web/app/dashboard/forms/page.tsx:543`, `sendDirectRuleCommand`.
- Hành vi ở snapshot review trước (lịch sử): mọi phản hồi 400/403/404/409/422 đều xóa command và mở action direct mới.
- Phản ví dụ: admission direct commit `CommandId == SubmissionJob.Id` và debit trước `SubmissionService.RunAsync`. Runner sau đó có thể ném `InvalidOperationException` do payload generated sai hoặc thiếu entry ID tại `src/FormAutoHub.Api/Services/SubmissionService.cs:117` / `:122`; runner finalize job đã lưu rồi rethrow. `SubmissionsController.SendRulesDirect` map exception đó thành HTTP 400 tại `src/FormAutoHub.Api/Controllers/SubmissionsController.cs:22`.
- Ảnh hưởng: frontend có thể bỏ command đã được nhận sau khi job/debit đã lưu và cho phép command khác, phá recovery cùng command và có thể trừ credit/generate lại.
- Sửa bắt buộc: không clear chỉ dựa vào status 400. Cách tương thích nhỏ nhất là probe `GET /api/projects/{projectId}/submissions/jobs/{commandId}` an toàn theo owner/session sau POST 400: GET 200 áp dụng job đã lưu; GET 404 của đúng user/project hiện tại sau khi POST kết thúc mới được clear; session đổi hoặc read chưa giải quyết phải giữ command fail-closed. Discriminator rejection pre-admission máy đọc được cũng hợp lệ nhưng mở rộng API contract.
- Test bắt buộc: post-admission 400→GET 200 giữ/áp dụng cùng command; pre-admission 400→GET 404 theo owner được phép clear; verification lỗi/mơ hồ giữ command. Test 503 hiện tại chưa bao phủ phân biệt này.

### F3 — Đã giải quyết: storage theo user, serialize giữa tab và compare-before-clear

- Verified trong `_helpers.ts:430`: key theo user, migrate legacy an toàn và so command ID trước khi remove.
- Verified trong `page.tsx:144` và `:586`: hydrate storage/session, đồng bộ storage event, Web Locks trước rule writes, kiểm lần hai trong lock và UI fail-closed khi browser không hỗ trợ.
- Có coverage đổi tài khoản, tab thứ hai, thiếu Web Locks và command mới hơn tại `direct-rule-submission.spec.ts:239`, `:265`, `:286` và `:312`.

### F4 — Đã giải quyết: tách nghĩa total, success và failure

- Verified tại `page.tsx:495`, `:1260` và `WorkflowSummary.tsx:29`: `total` là đã tạo/nhận xử lý; số gửi thành công/thất bại dùng `successCount` và `failedCount`.
- Có coverage mixed-result và thiếu credit tại `direct-rule-submission.spec.ts:351`.

## Kết luận chất lượng test

Vòng 2 hiện tại: review source xác minh POST 400/409 nay probe route GET job hiện có, kiểm user ban đầu trước và sau read, chỉ nhận job hợp lệ về cấu trúc và khớp command/project. GET 404 cùng user chỉ xóa command đang lưu khớp; read lỗi, sai identity, malformed hoặc đổi session giữ command. Các lỗi HTTP khác cũng giữ command. Năm ca thêm mới bao phủ 400→200, 400→404, 409→503, sai identity và đổi session; assertion kiểm storage/trạng thái action và số request liên quan. Writer báo focused 17/17, lint/build pass và detector `[]`; reviewer cuối đã đọc các test nhưng không chạy lại trên process thuộc runtime owner. Nhánh malformed được review source, chưa có test thêm riêng. Xem [FINAL_REVIEW](FINAL_REVIEW.md) để biết hash cuối và nguồn evidence.

Đánh giá test vòng trước (lịch sử):

- Spec tập trung nay bao phủ có ý nghĩa F1, F3, F4, mất transport, retry 503, compare-before-clear, thiếu Web Locks, partial credit và xác nhận AI Option 2/3 không đổi.
- Coverage F2 vẫn thiếu vì chưa có ca phân biệt 400 trước admission với 400 sau admission đã lưu.
- Writer báo sáu ca RED và Playwright gộp 30/30 sau sửa. Reviewer xác nhận đủ 30 ca dự kiến bằng liệt kê source nhưng không chạy lại Playwright.

## Files changed

- `docs/ai/tasks/FAH-DIRECT-001/FRONTEND_REVIEW.md`
- `docs/vi/tasks/FAH-DIRECT-001/FRONTEND_REVIEW.md`

Review này không đổi source/test ứng dụng, dependency, process, database, lịch sử Git, provider hoặc trạng thái deploy.

## Scope alignment

Chỉ review bản sửa F1-F4 trong source forms đã đổi và spec ảnh hưởng. Rules giữ một action direct không preview/xác nhận lần hai; AI Option 2/3 giữ preview, checkbox xác nhận và common send. Không đề xuất redesign, schema hoặc recovery takeover.

## Validation performed

- **Verified bởi reviewer:** đọc các đường F1-F4 hiện tại, test ảnh hưởng, phân loại lỗi API, route controller/job-read direct và nhánh exception runner.
- **Verified:** `git diff --check -- apps/web`, exit 0; còn warning LF→CRLF hiện có cho `fah-err-forms-errors.spec.ts`.
- **Verified:** Impeccable detector trên năm target forms đã đổi trả `[]`.
- **Verified:** SHA256 trước/sau review khớp cho snapshot frontend tám file đóng băng bên dưới.
- **Evidence được báo lại, reviewer không chạy:** Playwright 30/30, lint exit 0 với hai warning ngoài scope, build production/color/type/33 trang pass, detector `[]`.

| File frozen vòng trước (lịch sử; hash hiện tại ở FINAL_REVIEW) | SHA256 trước = sau review trước |
| --- | --- |
| `apps/web/app/dashboard/forms/_components/WorkflowSummary.tsx` | `DC06270A30984ACE01D7E5C904FA152BEC12136835A3A4009844D47AE6A45CCA` |
| `apps/web/app/dashboard/forms/_constants.ts` | `0511F34B5F93F5E66F7DC85FC9D77FC82F1DC63DD22AA1091D93E532E6ED7C3C` |
| `apps/web/app/dashboard/forms/_helpers.ts` | `A62A5A8186F448A5F1EAC7C58899EE3817B6B1F642CF6B25EA16941D07CFC780` |
| `apps/web/app/dashboard/forms/_types.ts` | `D9FA10765B8DC0D0C5973814EB7B63747914A6510C3E3F3D80632659184FE0E7` |
| `apps/web/app/dashboard/forms/page.tsx` | `6F10FE8780478A6F9A2EB20BBD01253F42936078E3932EE7C28C5F57AF7E7C12` |
| `apps/web/tests/direct-rule-submission.spec.ts` | `58B00DB270BED0134A893793B16AF3AF35583C9EB2A6B6E14F79EA81407F2E85` |
| `apps/web/tests/form-automation.spec.ts` | `7F172164E02FDB9E6EBE9265EBE08F21E2E94584D445B91CA9DD069901807F5A` |
| `apps/web/tests/fah-err-forms-errors.spec.ts` | `7F47BFB681666F697B14E71EBDB7B8A1C6CE03621D9516F71508921C7268C446` |

## Validation not performed

- Not run: Playwright, lint, build, smoke browser/API/SQL có auth hoặc provider. Runtime sở hữu tài nguyên browser/SQL đang hoạt động.
- Not run: hành vi browser thực khi `navigator.locks` tồn tại nhưng `request()` reject. Source fail-closed trước rule writes trong callback; runtime cần xác nhận feedback người dùng.

## Risks/Deferred items

- Giới hạn hard-crash/đối soát thủ công không schema đã duyệt vẫn Deferred; không đề xuất tự resend hoặc takeover phía client.
- Sau khi sửa F2, runtime smoke cần kiểm resolution 400→job-read, recovery refresh, hiển thị lock giữa tab và Web Locks không hỗ trợ/thất bại.

## Next recommended step

Root tổng hợp review độc lập F2 đã pass với bằng chứng runtime acceptance cuối. Review này không yêu cầu sửa source/test.
