# FAH-ERR-001 — Bổ sung độc lập ERR-021–024

2026-10-29 · HEAD `a19f7a2f3dc1bc54ff645d662d94fc614439256a` · Chỉ audit; sửa sản phẩm còn Deferred.

Danh sách hiện hành và disposition ID cũ: [báo cáo sâu](DEEP_AUDIT_REPORT.md). Bản đầu: [ERR-001–005](FINDINGS.md), [ERR-006–020](FULL_PASS_FINDINGS.md). Evidence ID trỏ tới [kết quả UI](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui/probe-results.json), [báo cáo UI](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui/report.md), [báo cáo runtime](../../../../artifacts/reports/error-audit-2026-10-29/deep/runtime/report.md) và [review độc lập](../../../../artifacts/reports/error-audit-2026-10-29/deep/review/report.md) cuối. Không khẳng định có incident production hoặc đã sửa xong.

## ERR-021 — P2: Đọc lỗi vẫn hiện tài khoản trống, Google chưa liên kết hoặc danh sách NCKH rỗng

**Nhóm:** gộp/phân loại sai nguyên nhân + dễ hiểu cho người dùng. **Đối tượng/lớp:** User; component tài khoản và danh sách NCKH. P2 vì coi đọc lỗi là trạng thái nghiệp vụ hợp lệ, đồng thời vẫn cho lưu hồ sơ.

**Source / unit hoàn chỉnh:**

- [AccountProfilePanel](../../../../apps/web/components/account-profile-panel.tsx): effect GET profile, `save`, tên có thể sửa và nút lưu.
- [AccountSecurityPanel](../../../../apps/web/components/account-security-panel.tsx): đọc profile và nhãn liên kết.
- [Danh sách NCKH](../../../../apps/web/app/dashboard/nckh/page.tsx): `loadForms`, empty state bảng và alert lỗi.
- Luồng ghi profile: [ProfileController](../../../../src/FormAutoHub.Api/Controllers/ProfileController.cs), [ProfileService](../../../../src/FormAutoHub.Api/Services/ProfileService.cs), record profile liên quan trong [Phase2Dtos](../../../../src/FormAutoHub.Api/Contracts/Phase2Dtos.cs).

**Trigger / quan sát:** GET profile hoặc danh sách form thất bại (503 ở browser fixture); điều này không xác nhận tên trắng, tài khoản chưa liên kết hoặc danh sách rỗng.

| Vùng | UI / diagnostics hiện tại | Bằng chứng |
| --- | --- | --- |
| Hồ sơ | Tên trắng sửa được, email trắng disabled, `Lưu hồ sơ` enabled; toast lỗi đọc thoáng qua. Với detail fixture, toast là `Service Unavailable`. | UI-P02 chạy component/save gốc với PUT mock `{fullName:""}`. RUNTIME-03 xác nhận input trắng/nút ở app render thật, **không bấm lưu**. |
| Bảo mật | `Chưa liên kết`, `Email hiện tại: -` sau khi đọc profile lỗi. Nút Google disabled; không nói vẫn cho liên kết. | UI-P03 component mock; RUNTIME-04 render + GET profile503. Dùng `browser-security-confirmed.json` làm bằng chứng chính thức. |
| Danh sách NCKH | Alert `Không tải được danh sách form. Vui lòng thử lại.` đồng thời bảng `Chưa có form nào` và `Dán URL Google Form vào ô trên để nhập.` Ô được nhắc không có trong state đã chụp. Reload lỗi sau đó còn có thể giữ items cũ mà bảng không đánh dấu độ hợp lệ. | UI-P04 mock; RUNTIME-05 render lần đọc đầu 503 với cả error + empty. Giữ items cũ chỉ qua source trace, chưa tái hiện browser. |

**Mong đợi / tác động:** Đọc lỗi phải còn là chưa biết/lỗi, không thành dữ liệu trống/chưa liên kết đã xác nhận. Trạng thái lỗi/retry bền vững giúp hiểu vì sao thao tác bị chặn. Source profile chấp nhận tên gửi lên; mock chứng minh đường handler gửi tên trắng, **không phải ghi đè DB thật**. Bộ lọc thông báo chung thuộc ERR-003; ERR-021 nói về tính hợp lệ trạng thái và hiển thị dữ liệu mâu thuẫn, gộp một nhóm qua nhiều consumer thay vì ba ID.

**Đề xuất (Deferred):** Giữ dữ liệu đã biết, tách không có sau đọc thành công khỏi chưa đọc được, khóa lưu profile tới khi xác nhận dữ liệu hiện tại. Gợi ý: `Chưa tải được hồ sơ. Vui lòng tải lại trước khi lưu thay đổi.`, `Chưa xác định được trạng thái liên kết`, `Chưa tải được danh sách biểu mẫu.` Đồng nhất alert NCKH với bảng. Không bịa nguyên nhân chưa liên kết/nghiệp vụ.

**Diagnostics / hợp đồng:** Giữ định danh lỗi đọc an toàn và vùng/thao tác liên quan; toast thoáng qua không đủ phản hồi trạng thái. Không mặc định thêm status/DTO/field DB. Giữ bảo vệ credential và phân biệt Google/JWT; không đổi khả năng dò tài khoản.

**Validation cần duyệt cùng sửa:** Đọc thành công có/rỗng dữ liệu, 503/transport/auth, reload lỗi sau dữ liệu cũ, mở lại dialog, retry và chặn lưu; browser kèm network assertion. Acceptance có persistence phải có tài khoản test/API/SQL được phép và kiểm reload. **Not run:** PUT profile/ghi đè DB thật, tài khoản đã/chưa liên kết thật, account E2E đầy đủ.

**Disposition độc lập:** UI-001 được review độc lập cuối chấp nhận ở mức bằng chứng đã nêu; đã vào danh sách 24 nhóm hiện hành.

## ERR-022 — P3: Clipboard từ chối nhưng không có hướng dẫn cho người dùng

**Nhóm:** dễ hiểu UI + boundary lỗi chưa xử lý. **Đối tượng/lớp:** User/Admin; handler sao chép mã/link. P3 vì đây là thao tác phụ, có thể dùng cách sao chép thủ công.

**Source:** `RequestCode.copyId` tại [top-up](../../../../apps/web/app/dashboard/top-up/page.tsx), [manual credits](../../../../apps/web/app/admin/manual-credits/page.tsx); `copyWebhookUrl` tại [PayOS settings](../../../../apps/web/app/admin/payos-settings/page.tsx); handler inline tại [chi tiết top-up](../../../../apps/web/app/dashboard/top-up/_components/topup-order-detail.tsx).

**Trigger / quan sát:** `navigator.clipboard.writeText` reject hoặc không có. Handler await rồi báo success; không catch/fallback báo lỗi. **UI-P08 Verified**: `copyId` gốc reject ra caller và không thông báo khi boundary clipboard giả bị từ chối. Handler tương tự qua source trace. Browser `unhandledrejection` là **Not run**, nên không coi đã quan sát event browser hoặc mất stack console.

**Mong đợi / tác động:** Sao chép lỗi cần phản hồi và lựa chọn thủ công, tránh cảm giác không có tác dụng. Diagnostics browser hiện có vẫn có thể giữ rejection; thiếu custom log không chứng minh mất mọi chẩn đoán.

**Đề xuất (Deferred):** Bắt lỗi clipboard, hiện `Chưa sao chép được mã. Bạn có thể chọn và sao chép thủ công.` hoặc câu tương ứng cho link, giữ ngữ cảnh thao tác/cause an toàn. Không ghi nội dung sao chép vào log. Xử lý UI cục bộ không cần đổi response/schema.

**Validation cần duyệt cùng sửa:** Clipboard API reject/không có, ghi thành công, bấm lặp và keyboard ở browser riêng. Assert báo lỗi, không unhandled rejection sau sửa; dùng nội dung giả. **Not run:** quyền clipboard/rejection browser thật trong audit. Không đọc clipboard thật.

**Disposition độc lập:** UI-005 được review độc lập cuối chấp nhận ở mức bằng chứng đã nêu; đã vào danh sách 24 nhóm hiện hành.

## ERR-023 — P2: Chi tiết gửi bỏ nguyên nhân lỗi mà API đã trả

**Nhóm:** dễ hiểu cho người dùng + trình bày chẩn đoán. **Đối tượng/lớp:** User; chi tiết kết quả gửi. P2 vì chi tiết không phân biệt nguyên nhân attempt lỗi hoặc nhận diện attempt cần hỗ trợ.

**Source / chuỗi:** [GoogleFormsClient.SubmitAsync](../../../../src/FormAutoHub.Api/Integrations/GoogleForms/GoogleFormsClient.cs) → [SubmissionService.SendAsync](../../../../src/FormAutoHub.Api/Services/SubmissionService.cs) → [Phase3Mappings](../../../../src/FormAutoHub.Api/Services/Phase3Mappings.cs) → `SubmissionJob.logs` trong [api.ts](../../../../apps/web/lib/api.ts) → `submissionLogsOpen`, `buildSubmissionBatches` và render chi tiết tại [trang forms](../../../../apps/web/app/dashboard/forms/page.tsx).

**Trigger / quan sát:** Attempt lỗi đã trả có `errorMessage`, `responseId`. Non-success ngoài có thể sinh `Google Form returned HTTP {status}.`; service ghi/project vào logs. UI hiện `Lượt gửi kết thúc: X thành công, Y lỗi.`, mở `Chi tiết các lượt gửi` vẫn chỉ đếm Success/Failed theo nhóm. Không dùng `errorMessage`/`responseId` của attempt để trình bày chi tiết có ích.

**Bằng chứng:** UI-006 là **source-to-consumer static**, đã được review độc lập. Không thực hiện gửi lỗi thật, mở chi tiết browser, lưu SQL hay gọi Google. Không nói backend không có log: finding chỉ là bỏ field đã trả trong response hoàn tất. ERR-007 là wording usage mâu thuẫn; ERR-008 là mất bằng chứng sau gián đoạn; ERR-023 độc lập về hiển thị khi bằng chứng đang có.

**Mong đợi / tác động:** Giải thích an toàn điều đã biết, đưa mã job/attempt hiện có khi hữu ích. Không phơi text provider thô hoặc mặc định retry an toàn khi outcome ngoài chưa rõ.

**Đề xuất (Deferred):** Hiện nguyên nhân đã phân loại an toàn và mã hỗ trợ hiện có bên cạnh số lượng. Fallback: `Chưa gửi được lượt này. Vui lòng kiểm tra lại biểu mẫu hoặc liên hệ hỗ trợ kèm mã lượt gửi.` Hướng dẫn cụ thể phải có định danh lỗi thật hỗ trợ; fallback là đề xuất, không phải contract/cam kết mới. Giữ diagnostics thô nội bộ và các kiểm soát preview/xác nhận/gửi theo lô tuần tự.

**Validation cần duyệt cùng sửa:** Fixture response hiện có cho success, lỗi đã biết, lý do lạ/thiếu, kết quả một phần và text provider nhạy cảm/dài; chi tiết render, network shape và mã hỗ trợ an toàn. Tách fault test backend cho outcome gián đoạn. **Not run:** failed-attempt E2E browser/API/SQL/provider thật hoặc tự gửi lại.

**Disposition độc lập:** UI-006 được review độc lập cuối chấp nhận ở mức bằng chứng đã nêu; đã vào danh sách 24 nhóm hiện hành.

## ERR-024 — P2: Mặc định ngày/giờ che cấu hình rỗng được gửi đi

**Source:** [RuleEditor](../../../../apps/web/app/dashboard/forms/_components/RuleEditor.tsx) `updateDateRange/updateTimeRange`; [helpers](../../../../apps/web/app/dashboard/forms/_helpers.ts) `readDateRange/readTimeRange`; [trang forms](../../../../apps/web/app/dashboard/forms/page.tsx) `canGenerate/saveRulesAndGenerate`. Phụ thuộc backend: `Phase3RuleHelpers.ReadRequiredDate/ReadRequiredTime/HasValidConfig`, `AnswerRuleService.ValidateRequest`, `AnswerRulesController`.

**Trigger / quan sát:** Xóa input ngày/giờ ghi `""` vào configJson; helper đọc dùng fallback `||` nên ô hiện mặc định. Gate tạo chấp nhận chuỗi JSON khác rỗng và POST nguyên trường rỗng. UIR-P01/P02 được chạy lại độc lập cho thấy ô hiện `2026-05-18` / `09:00`, nhưng POST `fromDate:""` / `fromTime:""`. Mock rejection dùng literal service hiện tại `Answer rule config does not match the selected mode and question.`, còn nguyên tới toast. Backend từ chối constraint/400 chỉ trace source, chưa thực thi C#/MVC/HTTP. Probe kiểm ô bắt đầu; cấu trúc ô kết thúc cùng dạng đã đọc nhưng chưa probe riêng.

**Tác động / phân biệt:** P2 vì ô nhìn hợp lệ khác request, chặn tạo preview mà không có hướng dẫn cạnh ô. Fixture dừng ở POST rule đầu; chưa xác nhận mất credit, lưu sai hoặc gửi form thật. ERR-012 vẫn là gộp nguyên nhân constraint ở backend; ERR-003/019 vẫn là wording thô. Chỉ sửa câu backend chưa đồng bộ UI/config.

**Đề xuất (Deferred):** Giữ ô trống khi xóa kèm hướng dẫn, hoặc khởi tạo mặc định một lần vào cùng state khi chọn mode. Kiểm đầu/cuối/thứ tự/bước giờ theo constraint hiện hữu trước gửi. Gợi ý: `Hãy chọn ngày bắt đầu.` / `Hãy chọn giờ bắt đầu.` Không mặc định DTO/status/field mới. Nghiệm thu sửa cần browser clear/retype/đổi mode cùng network payload và API validation thật.

**Evidence / review:** [Report tác giả](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui-remainder/report.md), [coverage](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui-remainder/coverage.json), [review độc lập](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui-remainder-review/report.md), [kết quả mock độc lập](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui-remainder-review/probe-results.json). Reviewer nhận ERR-024/P2 và tổng24 =2 P1/20 P2/2 P3; chạy lại2 quan sát mock, khớp8 hash nguồn. **Not run:** React DOM/browser/probe ô kết thúc/API/SQL/provider thật. Mọi triển khai còn Deferred.

## Mở rộng được chấp nhận không thêm nhóm

- **ERR-019:** UIR-002 trace `Option 2/3`, `product baseline`, `product safety rules` tới UI leaf AI/public. Copy đề xuất phải đúng trạng thái mở/thu gọn; copy public không tăng severity nhóm.
- **ERR-021 / liên quan ERR-017:** UIR-003 trace slice dataset NCKH null/đọc lỗi tới `Chưa có bộ dữ liệu`; parent có warning. Không cáo buộc cả trang nuốt lỗi hoặc mutation sai.
- **ERR-021:** UIR-004 trace admin search lỗi tới không có kết quả/options cũ. Có version guard chặn success cũ; chưa cộng nhầm credit. Đây là trace consumer tĩnh, không evidence browser/mutation mới.

## Ranh giới phê duyệt và bước tiếp theo

Mọi câu chữ, xử lý state, diagnostics và test đề xuất còn Deferred tới khi duyệt nhóm triển khai. Không duyệt endpoint, field/status, policy recovery/retention, migration, sửa lịch sử hoặc tự retry mới. Scope review cần gồm consumer helper/API dùng chung để giữ an toàn Google authorization/session. Không tuyên bố full-system audit Done, tích hợp hoặc release.

## Finding hiện hữu:follow-up API/SQL thật

[RUNTIME_API_SQL](RUNTIME_API_SQL.md) tăng ERR-002 bằng validation field/traceId MVC thật,ERR-005 bằng Failed AnalyzeForm UsageLog persisted và ERR-013 bằng Development HTTP500/no package write thật. Password ngắn400 chỉ generic `Bad Request`,không xác lập câu ERR-018 fixture cũ. Không ID mới/fix;vẫn24nhóm.
