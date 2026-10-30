> Báo cáo lượt static là lịch sử; số **20 nhóm**/evidence thuộc checkpoint đó. Hiện hành: **24 nhóm, 2 P1 / 20 P2 / 2 P3**, [báo cáo sâu](DEEP_AUDIT_REPORT.md), [finding mới](DEEP_AUDIT_FINDINGS.md). ERR-012/015 được đính chính trọng yếu bên dưới; bằng chứng/disposition hiện tại theo report sâu. [Baseline docs](../../../../artifacts/reports/error-audit-2026-10-29/deep/synthesis/baseline-documents.json) giữ nguyên văn trước sửa.

# FAH-ERR-001 — Phát hiện sau lượt rà toàn bộ

2026-10-29 · HEAD `a19f7a2f3dc1bc54ff645d662d94fc614439256a`.

Tổng cộng **20 nhóm phát hiện: 2 P1, 17 P2, 1 P3**, gồm [ERR-001–005](FINDINGS.md) và 15 nhóm dưới đây. Đây là lượt rà tĩnh toàn phạm vi đã chọn, có kiểm chứng cô lập đại diện; chưa chứng nhận runtime toàn hệ thống. P1 là mức ưu tiên xử lý rủi ro từ mã, không khẳng định sự cố production đã xảy ra. Chưa sửa sản phẩm.

[Coverage](COVERAGE.md) · [Inventory](SOURCE_INVENTORY.md) · [Validation](VALIDATION.md)

Mỗi nhóm ghi nguồn/symbol, điều kiện và hậu quả, đề xuất cùng cách kiểm tra. Mức bằng chứng tiếng Anh ở từng mục dùng thống nhất: Static = đọc mã, Verified = probe đã chạy; Not run = chưa chạy tình huống runtime. Các đề xuất là Deferred, chưa duyệt hợp đồng mới.

## ERR-006 — P2: Body phản hồi thô từ PayOS có thể tới UI hoặc console trình duyệt

**CreatePaymentLinkAsync** · [PayosClient.cs](../../../../src/FormAutoHub.Api/Services/PayosClient.cs), [PaymentService.cs](../../../../src/FormAutoHub.Api/Services/PaymentService.cs), [PaymentsController.cs](../../../../src/FormAutoHub.Api/Controllers/PaymentsController.cs)

Body phản hồi thô từ PayOS có thể tới UI hoặc console trình duyệt. Lỗi HTTP và thiếu checkout URL ghép responseText; PaymentService chuyển tiếp và PaymentsController trả Conflict. Chuỗi ngắn qua readableError, chuỗi dài có thể bị showError ghi log. Nhiều lỗi provider cũng thành 409. Chưa tái hiện việc lộ bí mật thực tế.

**Đề xuất / kiểm tra:** Tách hướng dẫn thanh toán an toàn khỏi dữ kiện provider có giới hạn và che dữ liệu; giữ status gốc nội bộ. Rà hợp đồng trước khi đổi HTTP. Gợi ý UI: “Chưa tạo được liên kết thanh toán. Vui lòng kiểm tra lại yêu cầu nạp tiền.”

**Evidence:** Static chain + structural assertion; sandbox malformed/non-2xx body and safe console assertions required.

## ERR-007 — P2: Usage status là Failed cho job lỗi/tạm dừng/đã hủy, nhưng Description luôn là “Gửi form thành công”

**SendAsync / WriteUsageLogAsync** · [SubmissionService.cs](../../../../src/FormAutoHub.Api/Services/SubmissionService.cs), [page.tsx](../../../../apps/web/app/dashboard/usage-logs/page.tsx)

Usage status là Failed cho job lỗi/tạm dừng/đã hủy, nhưng Description luôn là “Gửi form thành công”. Lịch sử mâu thuẫn kết quả dù UI gửi có phân biệt trạng thái/số lượng trả về.

**Đề xuất / kiểm tra:** Mô tả đúng kết quả và số lượng hiện có. Không ngầm sửa lịch sử cũ. Test job lỗi, kết quả hỗn hợp, tạm dừng, hủy và màn hình lịch sử.

**Evidence:** Static + structural assertion; no failed submission executed.

## ERR-008 — P1: Gián đoạn thao tác ngoài có thể làm thiếu dấu vết bền vững

**SendAsync / CollectResponsesAsync / CreateGeneratedFormAsync** · [SubmissionService.cs](../../../../src/FormAutoHub.Api/Services/SubmissionService.cs), [ResearchDataService.cs](../../../../src/FormAutoHub.Api/Services/Nckh/ResearchDataService.cs), [ResearchFormService.cs](../../../../src/FormAutoHub.Api/Services/Nckh/ResearchFormService.cs), [GoogleFormsClient.cs](../../../../src/FormAutoHub.Api/Integrations/GoogleForms/GoogleFormsClient.cs)

Gián đoạn thao tác ngoài có thể làm thiếu dấu vết bền vững. Gửi form lưu Running trước, chỉ thêm log lượt gửi sau khi SubmitAsync trả về và lưu theo lô. Ngoại lệ mạng bỏ qua hoàn tất; có thể thiếu log lượt hiện tại và kết quả trước đó trong lô dù bên ngoài đã nhận. JsonException payload bị ném lại không giữ inner exception, job chưa kết thúc. Thu thập NCKH thêm log trước I/O nhưng lưu sau; ngoại lệ bỏ qua nhánh thất bại dành cho kết quả null. Tạo form ngoài có thể thành công rồi lỗi tạo câu hỏi/import mà chưa lưu được kết quả ngoài.

**Đề xuất / kiểm tra:** Ưu tiên giữ nguyên nhân gốc, ID thao tác hiện có và phần kết quả đã biết/chưa xác định. Rà chính sách lưu/transaction và khôi phục trước triển khai; không tự gửi/tạo lại. Test chèn lỗi phải kiểm tra log đã lưu và trạng thái job, gồm lỗi sau một thao tác ngoài thành công.

**Evidence:** Static risk, submission call/log ordering structurally asserted; persistence and live external outcomes Not run. P1: ambiguous external side effects and retry risk.

## ERR-009 — P1: Mọi request/response AI được ghi Information dưới dạng JSON thô

**GenerateAsync / BuildPayload** · [OpenAiCompatibleProviderAdapter.cs](../../../../src/FormAutoHub.Api/Integrations/AI/OpenAiCompatibleProviderAdapter.cs), [AiGenerationService.cs](../../../../src/FormAutoHub.Api/Services/AiGenerationService.cs)

Mọi request/response AI được ghi Information dưới dạng JSON thô. Payload chứa prompt, ảnh chụp câu hỏi và định danh ngữ cảnh; các lô song song tạo log lớn, hai câu log này thiếu phạm vi run/batch tường minh. Header Authorization nằm riêng: chưa có bằng chứng API key bị ghi log.

**Đề xuất / kiểm tra:** Dùng metadata có giới hạn, che dữ liệu và ngữ cảnh run/project hiện có; quyền truy cập/lưu payload nhạy cảm cần quyết định riêng. Test logger với dữ liệu cá nhân giả, chuỗi giống token, phản hồi lớn và lô song song.

**Evidence:** Static + structural assertion, no real payload collected. P1: routine raw user-content logging at normal log level.

## ERR-010 — P2: Thiếu cấu hình OAuth, HTTP đổi token lỗi và thiếu token bị gộp null; Forms non-2xx cũng thành null/false, mất status/ngữ cảnh request provider

**ExchangeCodeAsync / Google Forms integration boundary** · [GoogleOAuthService.cs](../../../../src/FormAutoHub.Api/Integrations/Google/GoogleOAuthService.cs), [GoogleFormsApiService.cs](../../../../src/FormAutoHub.Api/Integrations/Google/GoogleFormsApiService.cs), [ResearchFormService.cs](../../../../src/FormAutoHub.Api/Services/Nckh/ResearchFormService.cs), [page.tsx](../../../../apps/web/app/dashboard/nckh/callback/page.tsx), [GoogleIdentityVerifier.cs](../../../../src/FormAutoHub.Api/Auth/GoogleIdentityVerifier.cs)

Thiếu cấu hình OAuth, HTTP đổi token lỗi và thiếu token bị gộp null; Forms non-2xx cũng thành null/false, mất status/ngữ cảnh request provider. Lớp sau có thể báo mã hết hạn, không có quyền hoặc không tìm thấy dù provider trả 429/503. Core identity verifier cũng trả null cho thiếu client config và JWT sai; UI đăng nhập vẫn cần chung nhưng chẩn đoán cấu hình nên tách.

**Đề xuất / kiểm tra:** Giữ định danh lỗi upstream an toàn nội bộ, ánh xạ nguyên nhân đã biết theo thao tác. Bảo toàn hợp đồng phân biệt Google/JWT của NCKH và phục hồi phiên. Test thiếu config, invalid_grant, invalid_client, 403/404/429/503, mất mạng và body sai.

**Evidence:** Static end-to-end trace; provider runtime Not run.

## ERR-011 — P2: ErrorMessage của run có phân biệt lỗi provider/timeout, guard và credit, nhưng response và projection thống kê bỏ nguyên nhân

**GenerateAsync / ToResponse / createAiPreviews** · [AiGenerationService.cs](../../../../src/FormAutoHub.Api/Services/AiGenerationService.cs), [OpenAiCompatibleProviderAdapter.cs](../../../../src/FormAutoHub.Api/Integrations/AI/OpenAiCompatibleProviderAdapter.cs), [AiAnalyticsService.cs](../../../../src/FormAutoHub.Api/Services/AiAnalyticsService.cs), [page.tsx](../../../../apps/web/app/dashboard/forms/page.tsx)

ErrorMessage của run có phân biệt lỗi provider/timeout, guard và credit, nhưng response và projection thống kê bỏ nguyên nhân. UI gom Failed thành “AI chưa tạo được bản xem trước hợp lệ. Không trừ credit.” Provider non-2xx chỉ giữ HTTP status; trích xuất có thể biến output sai thành không có output. Task.WhenAll cũng cần bằng chứng từng lô khi một lô lỗi.

**Đề xuất / kiểm tra:** Đề xuất hướng dẫn theo nguyên nhân an toàn và đối chiếu hỗ trợ bằng ID run hiện có. Bổ sung response phải qua rà hợp đồng; không trả exception thô. Test từng nhánh Failed và một lô provider lỗi khi chạy song song; kiểm tra ledger credit riêng.

**Evidence:** Static trace, no AI cost incurred; actual balances/runtime Not run.

## ERR-012 — P2: JSON hợp lệ nhưng sai ràng buộc bị gộp thành mismatch chung

**Đính chính sau review sâu độc lập:** [AnswerRuleService.ValidateRequest](../../../../src/FormAutoHub.Api/Services/AnswerRuleService.cs) parse cú pháp trước: JSON sai throw `ConfigJson must be valid JSON.` với inner JsonException. Bác claim cũ rằng lỗi cú pháp mất cause vào false chung của helper. JSON hợp lệ sai shape/type/constraint vẫn có thể thành `Answer rule config does not match the selected mode and question.`, thiếu hướng dẫn trường/ràng buộc.

**Evidence:** BE-P08 service thật, reviewer đã rerun: `{` sai có inner JsonReaderException; weights âm/quá100 cùng mismatch chung, inner null. Controller chỉ trả Message; object inner còn không chứng minh đã log. Mode khác/API/browser còn Not run. Xem [disposition hiện tại](DEEP_AUDIT_REPORT.md).

**Đề xuất / kiểm tra (Deferred):** giữ hướng dẫn/diagnostics an toàn cụ thể mode/constraint; test syntax/type/constraint riêng, không phơi ConfigJson. Chưa duyệt hợp đồng lỗi mới.

## ERR-013 — P2: PackageService ném ArgumentException khi gói không hợp lệ; create/update controller không chuyển đổi và Program không có mapper ngoại lệ ứng dụng tường minh

**ValidatePackageInput / CreatePackage / UpdatePackage** · [PackageService.cs](../../../../src/FormAutoHub.Api/Services/PackageService.cs), [AdminPackagesController.cs](../../../../src/FormAutoHub.Api/Controllers/AdminPackagesController.cs), [Program.cs](../../../../src/FormAutoHub.Api/Program.cs), [page.tsx](../../../../apps/web/app/admin/packages/page.tsx)

PackageService ném ArgumentException khi gói không hợp lệ; create/update controller không chuyển đổi và Program không có mapper ngoại lệ ứng dụng tường minh. Input admin có thể thành ngoại lệ chưa xử lý thay vì validation hữu ích. Body 500 cụ thể tùy môi trường, chưa chạy thực tế.

**Đề xuất / kiểm tra:** Ánh xạ validation đã biết nhất quán tại ranh giới service/controller hiện có, giữ hướng dẫn trường. Kiểm tra giá/credit/tên sai qua API và UI admin, cùng ngoại lệ bất ngờ; chưa chốt hợp đồng lỗi toàn cục.

**Evidence:** Static source trace; actual HTTP body/status Not run.

## ERR-014 — P2: Mọi lỗi đọc profile đều reset direction/prompt/scope/questions về mặc định và kết thúc im lặng

**loadAiPromptProfile** · [page.tsx](../../../../apps/web/app/dashboard/forms/page.tsx)

Mọi lỗi đọc profile đều reset direction/prompt/scope/questions về mặc định và kết thúc im lặng. 503 bị đối xử như chưa có cấu hình. Nếu lưu tiếp có thể ghi đè cấu hình cũ; chưa thực hiện ghi đó.

**Đề xuất / kiểm tra:** Phân biệt chắc chắn chưa có cấu hình với lỗi đọc; giữ dữ liệu đang có/chưa lưu, báo “Chưa tải được cấu hình đã lưu. Vui lòng tải lại trước khi chỉnh sửa.” Test chưa có profile, 503, đổi project và lưu sau lỗi đọc.

**Evidence:** FULL-04 Verified with extracted original function and synthetic 503; browser/persistence Not run.

## ERR-015 — P2: Kết quả ghi đã xác nhận bị gộp với lỗi reload có throw

**Consumer map đã sửa:** top-up `createPayosLink`/`submitOrder`, mutation admin manual-credit/package và provider check await loader có rethrow lỗi đọc. Có thể báo thao tác thất bại sau thành công; PayOS bỏ redirect. **Bác ví dụ NCKH báo mutation thất bại cũ:** `loadWorkspace` catch/ghi lỗi rồi resolve; `loadModelData` allSettled resolve, loader list/security cũng vậy. UI-P06 đã rerun độc lập xác nhận createModel success toast cùng workspace-read error, không có mutation-failure toast.

**Bằng chứng mở rộng:** UI-P05 `createAiPreviews` + `loadGeneratedPreviews` gốc với POST success/GET failure giả báo `Không tạo được AI preview.` trước khi giữ run/preview ID đã trả, kết quả credit hoặc resume context. Source backend lưu previews, credit transactions/run/UsageLog trước return; fixture không chứng minh debit/double debit thật. FULL-05 PayOS cũ vẫn là mock. Handler tương tự qua source trace; rendered mutation/read-failure E2E Not run.

**Đề xuất / kiểm tra (Deferred):** giữ result/ID đã xác nhận, báo `Thao tác đã thành công nhưng chưa tải lại được dữ liệu.` hoặc câu theo tác vụ, chỉ retry đọc khi an toàn. Không tự retry POST hoặc claim trừ/nạp trùng. Xem [báo cáo sâu](DEEP_AUDIT_REPORT.md) và loader matrix UI.

## ERR-016 — P2: Mọi lỗi tải chi tiết đặt isMissing=true

**top-up detail load catch** · [page.tsx](../../../../apps/web/app/dashboard/top-up/[id]/page.tsx)

Mọi lỗi tải chi tiết đặt isMissing=true. Lỗi mạng/máy chủ vì vậy hiện “Không tìm thấy yêu cầu nạp” và giải thích quyền sở hữu, gán nguyên nhân chưa có bằng chứng.

**Đề xuất / kiểm tra:** Tách không tìm thấy đã xác nhận khỏi chưa tải được; giữ bảo vệ riêng tư cho tài nguyên không tồn tại/không thuộc user. Gợi ý lỗi tải: “Chưa tải được yêu cầu nạp tiền. Vui lòng thử tải lại.” Test 404, quyền, 503, mất mạng.

**Evidence:** Static UI branch; rendered/browser reproduction Not run.

## ERR-017 — P2: Sáu tập dữ liệu dùng allSettled; phần thành công cập nhật, phần lỗi giữ giá trị cũ và chỉ hiện lỗi đầu tiên, thiếu chẩn đoán tổng hợp

**loadModelData** · [page.tsx](../../../../apps/web/app/dashboard/nckh/forms/[formId]/page.tsx)

Sáu tập dữ liệu dùng allSettled; phần thành công cập nhật, phần lỗi giữ giá trị cũ và chỉ hiện lỗi đầu tiên, thiếu chẩn đoán tổng hợp. Khi đổi mô hình có thể trộn biến cũ với dữ liệu mô hình mới. Chưa tái hiện hậu quả chỉnh sửa sau đó.

**Đề xuất / kiểm tra:** Theo dõi tính hợp lệ từng tập theo mô hình hiện tại; không trình bày dữ liệu cũ như dữ liệu mới, ghi từng tập lỗi an toàn. UI: “Chưa tải đủ dữ liệu mô hình. Vui lòng tải lại.” Test đổi mô hình, hai lỗi cùng lúc và response về lệch thứ tự.

**Evidence:** FULL-06 Verified with extracted original function, two rejected boundaries and prior state; no browser/API.

## ERR-018 — P2: Dò chuỗi con phân loại nhầm nguyên nhân

**readableNckhError / registerErrorMessage** · [_helpers.ts](../../../../apps/web/app/dashboard/nckh/forms/[formId]/_helpers.ts), [page.tsx](../../../../apps/web/app/register/page.tsx), [ResearchCanvasService.cs](../../../../src/FormAutoHub.Api/Services/Nckh/ResearchCanvasService.cs)

Dò chuỗi con phân loại nhầm nguyên nhân. NCKH “Conflict” gợi ý dữ liệu cũ/chuẩn hóa lại dù có nhiều xung đột khác, còn chi tiết trùng quan hệ có hướng bị rơi về chung. Đăng ký khớp “already” hoặc “password”; yêu cầu mật khẩu giả lập lại thành “Email đã tồn tại…”. Fixture không chứng minh API hiện tại phát đúng câu mật khẩu đó.

**Đề xuất / kiểm tra:** Dùng định danh đã kiểm chứng theo endpoint và thông điệp đã biết khớp chính xác; không suy cách khắc phục chỉ từ từ tiếng Anh/status rộng. Test trùng quan hệ, chuẩn hóa cũ, mô hình active, validation đăng ký và lỗi lạ. Giữ discriminator Google auth NCKH.

**Evidence:** FULL-01/02/03 Verified at original mapper functions with synthetic messages; actual endpoint behavior Not run.

## ERR-019 — P2: Thuật ngữ còn qua bộ lọc chung: validation ConfigJson/AudienceJson; kết quả kiểm tra provider bằng tiếng Anh; hậu tố tham số ArgumentException; hướng dẫn thanh toán nhắc backend/webhook; NCKH yêu cầu env/config hoặc “contract NCKH”

**validation / provider check / payment return guidance** · [AiPromptProfileService.cs](../../../../src/FormAutoHub.Api/Services/AiPromptProfileService.cs), [AiProviderSettingsService.cs](../../../../src/FormAutoHub.Api/Services/AiProviderSettingsService.cs), [AiOutputValidator.cs](../../../../src/FormAutoHub.Api/Services/AiOutputValidator.cs), [page.tsx](../../../../apps/web/app/admin/ai-provider-settings/page.tsx), [page.tsx](../../../../apps/web/app/payment/payos/return/page.tsx), [_helpers.ts](../../../../apps/web/app/dashboard/nckh/forms/[formId]/_helpers.ts), [page.tsx](../../../../apps/web/app/dashboard/nckh/page.tsx)

Thuật ngữ còn qua bộ lọc chung: validation ConfigJson/AudienceJson; kết quả kiểm tra provider bằng tiếng Anh; hậu tố tham số ArgumentException; hướng dẫn thanh toán nhắc backend/webhook; NCKH yêu cầu env/config hoặc “contract NCKH”. Một số khái niệm admin cần thiết nhưng thuật ngữ triển khai thô không giúp người dùng khắc phục. Validator output AI có lỗi nội bộ tiếng Anh chi tiết: chỉ dịch nơi hiển thị, không xóa dữ kiện nội bộ hữu ích.

**Đề xuất / kiểm tra:** Tập trung cách trình bày tiếng Việt đã rà theo đối tượng, trường và thao tác, giữ chẩn đoán kỹ thuật riêng. Ví dụ thanh toán: “Hệ thống đang chờ xác nhận thanh toán. Bạn có thể kiểm tra lại sau.” Không hứa cộng credit khi chưa xác nhận. Rà lỗi trường, kiểm tra cấu hình, callback và lịch sử trong browser.

**Evidence:** Static wording/consumer trace; complements ERR-003/005, not another defect for every identical consumer.

## ERR-020 — P3: Script cũ in boolean và hoàn tất nhưng không assert UI mong đợi; thiếu nút có thể bỏ thao tác mà vẫn tới Done

**legacy smoke entrypoints** · [smoke-test.mjs](../../../../smoke-test.mjs), [smoke-test.mjs](../../../../apps/web/smoke-test.mjs), [smoke-debug.mjs](../../../../apps/web/smoke-debug.mjs)

Script cũ in boolean và hoàn tất nhưng không assert UI mong đợi; thiếu nút có thể bỏ thao tác mà vẫn tới Done. Chưa thu đầy đủ pageerror/request lỗi. Script gốc còn dùng page.eval cần kiểm chứng tương thích. Đây là bằng chứng yếu hơn test có assertion, không khẳng định CI hiện tại báo xanh sai.

**Đề xuất / kiểm tra:** Gắn nhãn chẩn đoán thăm dò hoặc bổ sung assertion trạng thái/network hữu ích khi bảo trì script. Che thông tin đăng nhập, dùng tài khoản test có quyền; không chạy vào runtime chưa rõ. Kiểm chứng thiếu phần tử bắt buộc phải exit khác 0.

**Evidence:** Static only; scripts not executed because they log in and can mutate analysis state.

## Thứ tự sửa đề xuất

1. ERR-008/009: dấu vết khi gián đoạn và log AI thô; rà quyết định lưu/khôi phục và riêng tư trước sửa.
2. ERR-014/015/017/007/016: loại thông báo sai kết quả và trạng thái dữ liệu sai.
3. ERR-001–004/006/010/011/012/013/018: bảo toàn lỗi ở ranh giới dùng chung, rồi cập nhật consumer.
4. ERR-005/019/020: chuẩn hóa câu chữ/lịch sử hiển thị và giá trị bằng chứng smoke.

Không gom thành một lần thay toàn bộ message. Đề xuất nhóm sửa: helper API/toast → mapper auth/NCKH → handler UI → ranh giới provider → log/lưu thao tác. Chốt thiết kế lỗi và test theo từng nhóm; không thêm schema/status/field hay sửa ledger ngầm. Chưa triển khai/commit/deploy.
