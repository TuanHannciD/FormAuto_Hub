# FAH-ERR-001 — Rà sâu UI/shared helpers độc lập

Ngày 2026-10-29; HEAD `a19f7a2f3dc1bc54ff645d662d94fc614439256a`; model thực tế `gpt-6.1-sol`, reasoning `high`. Không dispatch agent con. Chỉ audit, không sửa production/contract/schema, không commit/push/deploy/install/cleanup. Agent này không sở hữu process/port/browser/DB.

Kết luận: giữ phần cốt lõi các ERR cũ nhưng **ERR-015 cần loại NCKH khỏi ví dụ catch báo mutation thất bại**, mở rộng sang AI đã trả kết quả rồi tải preview lỗi. Có omission về trạng thái chưa biết bị trình bày thành dữ liệu rỗng/mặc định; mapper NCKH gán sai nguyên nhân với **chuỗi có thật trong service**; race đổi mô hình ngay cả khi tất cả GET thành công. Chưa có bằng chứng sự cố production hoặc trừ tiền/credit lặp thực tế.

## Phát hiện độc lập

### UI-001 — P2: Không tải được dữ liệu vẫn trình bày trạng thái rỗng/mặc định; hồ sơ còn cho gửi tên trắng

- Nguồn: `apps/web/components/account-profile-panel.tsx:12`, `AccountProfilePanel`, effect GET và `save` tại dòng 24; nút Lưu dòng 52. `apps/web/components/account-security-panel.tsx:151`, `AccountSecurityPanel`. `apps/web/app/dashboard/nckh/page.tsx:99`, `loadForms` và render danh sách dòng 293.
- Trigger: GET `/api/profile` hoặc GET `/api/v1/nckh/forms?page=1&pageSize=20` thất bại ngoài nhánh hết phiên/Google chưa liên kết.
- Thực tế hồ sơ: toast “Không tải được hồ sơ.” nhưng email/tên vẫn rỗng; không có trạng thái lỗi bền vững/retry, tên và nút **Lưu hồ sơ** vẫn hoạt động. Probe gửi lại đúng handler `save` ghi nhận PUT mock `{fullName:""}`. `ProfileController.Update` → `ProfileService.UpdateAsync` gán `user.FullName = request.FullName`, DTO `Phase2Dtos.cs` không có ràng buộc độ dài tên. Đây là **nguy cơ ghi đè**, chưa thực hiện ghi DB.
- Thực tế bảo mật: toast lỗi nhưng nhãn **“Chưa liên kết”** xuất hiện khi `profile === null`; nút Google được disabled bởi `!profile`, nên không kết luận người dùng vẫn bấm liên kết được. Trạng thái đã liên kết và chưa tải được đang bị đồng nhất ở nhãn.
- Thực tế NCKH: có alert **“Không tải được danh sách form. Vui lòng thử lại.”** trong thẻ liên kết, nhưng bảng vẫn nhận `items:[]`, **“Chưa có form nào”**, “Dán URL Google Form vào ô trên để nhập.” Không phải toàn trang nuốt lỗi; đây là thông điệp mâu thuẫn ở hai vùng. Khi tải lại thất bại sau dữ liệu cũ, bảng còn giữ dữ liệu cũ mà không đánh dấu tại bảng.
- Tác động: người dùng hiểu thất bại đọc là thông tin tài khoản trống/chưa liên kết/chưa có form. P2 vì tác động vượt vấn đề câu chữ, đặc biệt đường Lưu hồ sơ.
- Gợi ý tiếng Việt: “Chưa tải được hồ sơ. Vui lòng tải lại trước khi lưu thay đổi.”; bảo mật “Chưa xác định được trạng thái liên kết”; danh sách “Chưa tải được danh sách biểu mẫu.” Chỉ cho trạng thái rỗng sau khi đọc thành công; bảo toàn dữ liệu hiện có và khóa save cho dữ liệu chưa được xác nhận.
- Chẩn đoán: ghi nhận thao tác GET, vùng dữ liệu và lỗi an toàn; không chỉ toast biến mất. Không thêm field/code API ngầm.
- Bằng chứng: `UI-P02/03/04` **Verified mock** với component gốc transpile, hook state tối giản và cây JSX. Không phải React DOM/browser. Luồng controller/service đọc source; DB/write thực **Not run**.

### UI-002 — P2: AI đã trả kết quả tạo nhưng GET preview lỗi bị báo là tạo AI thất bại và bỏ thông tin kết quả

- Nguồn: `apps/web/app/dashboard/forms/page.tsx:718`, `createAiPreviews`; dòng 728 `await loadGeneratedPreviews`; `continueMissingGeneration` dòng 416 có cùng chuỗi AI POST → GET. Cùng nguyên nhân sửa với **ERR-015**, không cộng thành defect độc lập khi tổng hợp.
- Trigger: POST `/api/projects/{projectId}/ai-responses/generate` trả thành công với `runId`, `generatedPreviewIds`, `creditsUsed`, `balanceAfter`, sau đó GET `/api/projects/{projectId}/responses?ids=...` thất bại.
- Thực tế: handler đã `clearPreviewWorkflow()` rồi mới POST. Trước khi xử lý kết quả/ghi resume, nó phải GET toàn bộ preview; GET lỗi đi chung catch **“Không tạo được AI preview.”**. `setCreditBalance`, `setGenerationResult`, `setPreviews`, `saveResumeContext` chưa được gọi; `runId` không được giữ. Không có đường “chỉ tải lại các preview đã tạo” trong state sau thất bại này. Người dùng có thể nghĩ nên tạo mới trong khi API đã báo đã tạo/trừ credit.
- Contract hiện có nói chỉ trừ credit cho preview đã lưu, POST trả ID và số credit; đây là đủ căn cứ để UI phải phân biệt kết quả POST với lỗi tải, không phải bằng chứng debit DB lần này. Không đề xuất gọi endpoint run detail đang Deferred.
- Gợi ý: “Đã tạo bản xem trước nhưng chưa tải được nội dung. Vui lòng thử tải lại.” Chỉ nói số credit khi đã nhận được kết quả xác nhận; giữ các ID hiện có để retry GET, không tự động retry POST.
- Chẩn đoán: giữ operation/run/project/preview IDs đã có, phân biệt POST thành công với GET thất bại, bảo toàn cause an toàn. Mở rộng response/correlation contract cần review riêng.
- Bằng chứng: `UI-P05` **Verified mock** dùng nguyên hàm `createAiPreviews` và `loadGeneratedPreviews`, POST fixture đúng shape contract, GET lỗi synthetic. Giá trị credits=2/balance=3 là fixture; ledger/runtime/provider **Not run**.

### UI-003 — P2: Link Google Form sai bị đổi thành lỗi xác thực hết hạn

- Nguồn: `apps/web/app/dashboard/nckh/page.tsx:39`, `readableNckhError`, nhánh `invalid` dòng 48 → `handleImport` catch. Origin: `src/FormAutoHub.Api/Services/Nckh/ResearchFormService.cs:141`, `ImportFormAsync`; `ResearchFormsController.ToActionResult` và `apps/web/lib/api.ts:104`.
- Trigger không cần gọi Google: nhập URL tuyệt đối của host khác, ví dụ `https://example.invalid/form`; input type=url chấp nhận, service kiểm host trước DB/provider rồi trả `InvalidRequest`, **`detail: "Invalid Google Form URL."`**, controller 400.
- Thực tế mapper bắt từ `invalid` và hiển thị **“Dữ liệu xác thực không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.”**. Người dùng được hướng sang xác thực, trong khi lỗi là link. Không phải fixture mật khẩu giả định; câu detail được xác nhận trong complete service unit hiện tại.
- Gợi ý: “Liên kết biểu mẫu chưa hợp lệ. Hãy dùng liên kết Google Biểu mẫu và kiểm tra lại.” Duy trì `NckhGoogleAuthorizationError` cho đúng nhánh Google 401, không trộn JWT/Google.
- Chẩn đoán: nhận diện lỗi theo endpoint và nguyên nhân đã biết; giữ safe detail/status trước khi ánh xạ. Không dùng từ `invalid` chung cho URL, input và authorization.
- Bằng chứng `UI-P01` **Verified mapper mock + static source/controller chain**. Chưa gửi request API thật hay render browser. Gộp vào **ERR-018**, tăng độ chắc của ví dụ hiện hữu.
- Các actual detail khác bị fallback: “This form has already been imported.” → “Không nhập được form.”; “This directed relation already exists in the model.” → “Không thêm được quan hệ.”. Nhánh duplicate relation còn có client guard, nên backend duplicate thường cần stale client/race; không mô tả là mỗi click tạo trùng đều xảy ra.

### UI-004 — P2: GET của mô hình cũ trả muộn vẫn ghi đè dữ liệu mô hình mới

- Nguồn `apps/web/app/dashboard/nckh/forms/[formId]/page.tsx:314`, `loadModelData`, các setter dòng 328–333, effect đổi mô hình dòng 348; model name/options được derive từ `selectedModelId` riêng với dữ liệu.
- Trigger: chọn A rồi B; cả 6 GET của B hoàn tất trước A. Không có AbortController/request version/current model identity guard. Tất cả request có thể 200, không cần HTTP failure.
- Thực tế: state trở thành dữ liệu A sau khi selection đã chuyển B; không có `panelError` vì mọi request thành công. `isPanelLoading=false` của lượt cũ cũng có thể kết thúc trạng thái chờ của lượt mới. Khi chỉ một slice thất bại, dữ liệu slice cũ được giữ như **ERR-017** đã nêu.
- Gợi ý: chỉ áp dụng kết quả cho model đang chọn; theo dõi validity/owner của từng vùng. UI đang tải hoặc “Chưa tải đủ dữ liệu mô hình. Vui lòng tải lại.”; không suy ra dữ liệu rỗng. Chặn thao tác cần dữ liệu chưa xác nhận.
- Chẩn đoán: ghi đủ slice failed với model/request context; loading/error phải thuộc cùng identity. Không tự retry mutation.
- `UI-P07` **Verified mock original loadModelData**: thứ tự gọi A,B; resolve B,A; cuối Variables=A. Không gọi browser/API, chưa thực hiện edit sai dữ liệu. Gộp vào **ERR-017** như trigger race bổ sung.

### UI-005 — P3: Sao chép thất bại không có thông báo, promise rejection thoát khỏi click handler

- Nguồn `apps/web/app/dashboard/top-up/page.tsx:276`, `RequestCode.copyId`; `apps/web/app/admin/manual-credits/page.tsx:406`, cùng handler; `apps/web/app/admin/payos-settings/page.tsx:70`, `copyWebhookUrl`; `apps/web/app/dashboard/top-up/_components/topup-order-detail.tsx`, nút sao chép async inline.
- Trigger: `navigator.clipboard.writeText` bị từ chối hoặc Clipboard API không dùng được. Chỉ có `await writeText` rồi success toast, không catch/fallback.
- Thực tế nguyên hàm `copyId` reject, không có toast nào; React onClick nhận async handler trực tiếp. Browser phát `unhandledrejection` là suy luận từ boundary, **chưa quan sát browser**; không gọi nó là console trace bị mất vì browser có thể ghi stack.
- Gợi ý: “Chưa sao chép được mã. Bạn có thể chọn và sao chép thủ công.”; thông báo tương ứng với đường dẫn PayOS. Giữ stack/cause và operation an toàn, không log nội dung clipboard.
- Bằng chứng `UI-P08` **Verified mock** với clipboard rejected. Mã/URL là synthetic, không đọc clipboard thật. P3 vì tác vụ phụ, có thể thao tác thủ công.

### UI-006 — P2: “Mở chi tiết” lượt gửi chỉ hiển thị số lượng, không cho biết nguyên nhân của attempt thất bại

- Nguồn `apps/web/app/dashboard/forms/page.tsx:1144`, render `submissionLogsOpen`/`buildSubmissionBatches(submission.logs)` dòng 1162. `SubmissionJob.logs` trong `apps/web/lib/api.ts` có `responseId/status/errorMessage`.
- Origin đã trace: `GoogleFormsClient.SubmitAsync` trả `Google Form returned HTTP {status}.`; `SubmissionService.SendAsync` gán `SubmissionLog.ErrorMessage` rồi `ToResponse(logs)`. Bản thân API đã trả trường chẩn đoán nhưng UI không đọc `errorMessage`/`responseId`, chỉ đếm Success/Failed của từng nhóm.
- Thực tế người dùng nhận “Lượt gửi kết thúc: X thành công, Y lỗi.”, mở “Chi tiết các lượt gửi” vẫn chỉ số lượng. Không có thông tin để phân biệt link lỗi với HTTP failure hay biết attempt cần hỗ trợ. Không đề xuất show raw provider message; dùng nguyên nhân an toàn theo nguồn đã xác nhận và ID hiện có để hỗ trợ.
- Gợi ý: “Chưa gửi được lượt này. Vui lòng kiểm tra lại biểu mẫu hoặc liên hệ hỗ trợ kèm mã lượt gửi.” Chi tiết theo cause chỉ khi đã phân loại đúng; không hướng gửi lại tự động vì external outcome có thể không rõ.
- Bằng chứng **static source-to-consumer**, chưa tạo failed submission hay gọi Google. Độc lập với ERR-007 (usage description nói thành công) và ERR-008 (exception/persistence); không kết luận server không có log. P2 cho khả năng hiểu/xử lý lỗi; root có thể gộp nhóm diagnostic presentation với ERR-011 khi lập scope sửa.

## Phản biện ERR-015 theo từng handler

| Handler | Loader theo sau | Loader reject hay tự xử lý GET lỗi? | Disposition |
| --- | --- | --- | --- |
| top-up `createPayosLink`/`submitOrder` | `loadData` | catch setLoadError rồi **throw** | Confirm cốt lõi ERR-015; lỗi refresh có thể tạo success rồi failure toast; PayOS bỏ redirect |
| admin `approveRequest`/`rejectRequest` | `loadRequests` | catch setRequestsError rồi **throw** | Confirm static; chưa thực hiện POST/ledger |
| admin `savePackage` | `loadData` | catch setLoadError rồi **throw** | Confirm static; dialog đã đóng trước refresh |
| admin AI/PayOS `check` | `loadData` | catch setLoadError rồi **throw** | Bổ sung sibling đúng: kết quả check đã info toast rồi “Không kiểm tra được...” do read lỗi |
| NCKH `createModel`/`activateModel` | `loadWorkspace` | catch **setError và resolve** | **Reject phần cáo buộc mutation-failed catch**; `UI-P06` xác minh createModel thành công + refresh reject chỉ success toast và workspace error |
| NCKH create/delete variable/mapping/relation, update direction/save positions, collect/normalize | `loadModelData` | `allSettled`, **setPanelError và resolve** | **Reject cùng cáo buộc** đối với GET reject; trạng thái partial/stale thuộc ERR-017 |
| NCKH list `handleImport` | `loadForms` | không await; loader **catch và resolve** | Không thuộc mutation-failed catch; danh sách/error presentation thuộc UI-001 |
| forms `createAiPreviews`/AI `continueMissingGeneration` | `loadGeneratedPreviews` | GET failure **throw** | **Expand ERR-015**, giữ returned IDs/credit outcome rồi retry read; UI-002 |
| account security link/unlink | `loadProfile` | không await, **catch showError** | Không thuộc mutation-failed catch; trạng thái unknown thuộc UI-001 |

Đọc toàn bộ các handler/loader trên. Chỉ `createModel` NCKH được probe động ở pass này; các sibling NCKH là static trace, không giả thành 10 reproduction.

## Disposition findings gốc

| ERR | Disposition độc lập | Giới hạn/chỉnh cần thiết |
| --- | --- | --- |
| 001 | Confirm static | `apiFetch` giữ detail/title nhưng bỏ status/field errors/trace; các auth mapper kiểm số trong message nên có thể không chạy. Generic credential policy vẫn phải giữ; runtime payload giao root/runtime agent. |
| 002 | Confirm static | Validation `errors`/`traceId` đã có trong payload bị bỏ, title generic thắng field guidance; cần actual model-binding body theo endpoint. Không suy ra mọi 400 có cùng body. |
| 003 | Confirm, expand consumer map | `readableError` chỉ lọc firstLine/length/System/at; trực tiếp `toast.error(readableError(...))` bỏ diagnostics. Usage/credit pages render `fetchError.message` trực tiếp, bypass filter hoàn toàn; không coi filter này là biên an toàn. Không tái hiện leak secret. |
| 004 | Confirm static | Blob errors bỏ body; Google 401 discriminator hiện được giữ ở cả JSON/blob; không thay bằng mapper catch-all. |
| 005 | Confirm source trace | GoogleFormsClient → FormProjectService ghi UsageLogs.Description → controller Detail → forms toast; history render trực tiếp. Inner exception được giữ ở FormProjectService; không cáo buộc mất chain tại đây. Mặc định usage filter không hiện AnalyzeForm; phải chọn đúng filter để thấy history lỗi. |
| 014 | Confirm | `loadAiPromptProfile` catch reset toàn bộ; chưa test ghi đè DB. GET 404 không mặc nhiên là absence hợp lệ khi endpoint/service semantics khác; cần phân biệt absence đã xác nhận với read fail. |
| 015 | **Revise + expand** | Ma trận trên; bỏ NCKH handler khỏi cáo buộc refresh throw, bổ sung AI create/read và admin provider check. |
| 016 | Confirm | Top-up detail mọi reject setIsMissing; privacy-safe not-found/ownership wording hợp lý cho 404/ẩn tài nguyên, không hợp lý cho 503/network. |
| 017 | Confirm + expand | `UI-P07` bổ sung out-of-order all-success race cùng lỗi identity; original partial-slice retention có source căn cứ. Không khẳng định đã ghi nhầm dữ liệu. |
| 018 | **Revise evidentiary strength + expand** | `Password must contain...` fixture của FULL-03 vẫn synthetic; current AuthService invalid password trả InvalidRequest không Message, chưa chứng minh emits literal đó. Source thực chỉ rõ duplicate email `Email already exists.` và link-required chứa `password`. Thêm UI-003 actual NCKH invalid-link cause mạnh hơn. Duplicate relation client guard cần tính tới. |
| 019 | Confirm wording subset | Payment return nói backend/webhook; NCKH env/contract/min-max/endpoint/Phase7; admin check message raw English có consumer. Không coi mọi API/model/provider identifier là lỗi UX; admin có nhu cầu chuyên môn. AiOutputValidator English chỉ là user-visible nếu đã trace consumer, không tự nâng toàn bộ string thành finding. |

## Coverage thực tế

`coverage.json` ghi từng file, hash, full-file/focused-unit/unreviewed. Discovery tại `apps/web/{app,components,lib}` có 99 file TS/TSX: **43 đọc full, 56 chưa review bởi agent này**; thêm 13 file backend đọc full và 10 focused/evidence entries. Hashing không đổi trạng thái đọc. Không dùng screening 321 files để thay cho đọc tay.

- **Full files:** api/auth/toast/nckh-google-auth; shared ui; GoogleIdentityButton; account profile/security/menu/dialog; dashboard/admin/shell layout; login/register/auth callback/NCKH callback; top-up/list/detail/detail-component; payment return/cancel; dashboard/forms + forms helpers; NCKH list/workspace/helpers; admin packages/manual credits/history/AI settings/PayOS settings/payments/revenue/dashboard/AI usage; user dashboard/AI usage/usage logs/credit transactions. Consumer chains và error/loading/empty/mutation branches đã đọc.
- **Backend full files:** AuthController/AuthDtos, ProfileController/ProfileService, FormsController/FormProjectService/GoogleFormsClient, UsageLogsController/UsageLogService; NCKH Forms/Canvas/Models controllers. DTO Profile/NCKH AuthAndForm đọc các complete record liên quan. AuthService chỉ register/login/GoogleLogin/refresh/logout và phần đầu link, không full file; NCKH ResearchFormService chỉ Link/Import/List/Get; ResearchCanvasService complete relation validation; SubmissionService relevant send/log units; AiGenerationService/debit do backend agent sở hữu, pass này không chứng nhận đọc đầy đủ.
- **Chưa đọc full-file:** frontend leaf RuleEditor/AI panels/PreviewAccordion/canvas subcomponents, dialog/motion/dropdown/base-table internals, public marketing/SEO pages, webhook proxy và E2E specs không được gọi là fully reviewed trong pass này. Shared UI props được xem nhưng chưa kiểm accessibility DOM.
- Không rà a11y/performance/visual polish toàn diện; skill UI dùng cho copy/error state. UI UX search `error clarity recovery --domain ux` trả guidance Error Recovery/Error Messages phù hợp; không lưu design system hoặc đổi UI.

## Validation, scope và bước tiếp

| Check | Kết quả | Lệnh/đích/giới hạn |
| --- | --- | --- |
| Probe mới | **Verified 8/8** | Root cwd: `node artifacts/reports/error-audit-2026-10-29/deep/ui/probe.cjs`; exit 0. Original TS units/component JSX with mock I/O/manual hook state; [kết quả](probe-results.json) chứa source SHA-256. Đây là observations tái hiện defect hiện tại, không phải test báo sản phẩm đã sửa. |
| Harness lần đầu | **Failed, đã sửa harness** | Tính root path thừa một `..`, MODULE_NOT_FOUND trước mọi observation/I/O. Chỉ đổi probe own path; lần chạy sau exit 0. |
| Browser/API/SQL/provider | **Not run bởi agent này** | Runtime agent sở hữu target. Parent có thể bổ sung evidence của họ; báo cáo này không tự nhận kiểm DOM/hydration/session/SQL/provider. |
| Build/lint/backend/auth suite | **Not run lại** | Không thay product; run cũ không chuyển thành validation mới. |
| Product remediation/release | **Deferred** | Chưa được thực hiện. Thay contract/status/correlation/retention phải review scope riêng. |

Files changed chỉ dưới `artifacts/reports/error-audit-2026-10-29/deep/ui/`: `report.md`, `probe.cjs`, `probe-results.json`, `coverage.cjs`, `coverage.json`. Git diff tracked cuối pass rỗng. Giữ nguyên task docs AI/VI untracked và evidence cũ; không acquire resource cần release. Bước tiếp: root đối chiếu runtime/browser findings, gộp UI-002/003/004 về ERR-015/018/017, giữ UI-001 và UI-005 là omission mới; cân nhắc UI-006 với nhóm thiếu chẩn đoán khi trình scope remediation. Không gọi full-system audit Done khi runtime gates còn thiếu.
