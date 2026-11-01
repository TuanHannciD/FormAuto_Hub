# Backend G — implementation frozen, GREEN pending

## Regression wording correction checkpoint

Sole runner reports GREEN57 passed57/57 exit0. Related regression87 ran:85passed/2failed/0skip/compiler0. Đã đọc actual `../runtime/backend-boundaries-regressions/test.log`: hai lỗi đều exact English assertion tại `AdminAiProviderSettingsTests.UpdateAsync_RejectsInvalidBaseUrl` và `ControllerUpdate_ReturnsBadRequestForBlankModel`.

Root duyệt sửa đúng2expectations. Đã đối chiếu production: BaseUrl vẫn chỉ chấp nhận absolute http/https (fixture ftp bị từ chối); default model vẫn từ chối whitespace và controller vẫn400, checks secret exclusion vẫn giữ. Test kỳ vọng đủ câu Việt tương ứng, không đổi input, exception/status assertions hoặc điều kiện. Không production change. Snapshot21manifest chỉ đổi1file test, SHA256 mới `530d2dfa303412e09af2b225ed744c012ff79f41bad29377a1f2fa7f29451628`; fullpatch đã cập nhật. Static diffcheck exit0. Rerun87 pending; failed87 evidence giữ nguyên, không ghi đè hoặc relabel pass.

Task FAH-ERR-001, plan `docs/ai/tasks/FAH-ERR-001/REMEDIATION_PLAN.md`, HEAD `a19f7a2f3dc1bc54ff645d662d94fc614439256a`.

## Summary / Scope alignment

Resume kiểm thấy không có production/test G hoặc backend-boundaries artifact dở dang. Đã triển khai sau valid RED47 và root release A sau independent review. Không runner/build/process/SQL/browser/provider thật. Model/effort dispatch do root xác nhận `gpt-6.1-sol/high`; không agent con.

## Files changed

- `tests/FormAutoHub.Tests/FahErrBoundaryTests.cs`: 26 cases cho ERR005/006/012/013/019.
- `tests/FormAutoHub.Tests/FahErrBoundaryGoogleTests.cs`: 21 original RED cases +10 consumer/flow characterization =31 cases.
- 17 production files +4 test files hiện frozen: danh sách chính xác trong `after-hashes.json`, full copies dưới `snapshot/`.
- Production G gốc 12 file theo dispatch; root mở thêm hai internal GoogleIntegration type files, ResearchFormService/ResearchDataService và Collect action trong ResearchDataController. Hai existing assertion dịch tương ứng tại AiPromptProfileServiceTests/AdminAiProviderSettingsTests, không đổi điều kiện.
- `before-hashes.json`, `before/` giữ baseline; `before-reviewed-a/` + manifest giữ bản A đã review; `backend-g.patch` là full G delta (A được tính từ reviewed A, không từ HEAD); `reviewed-a-consumer-delta.patch` riêng delta hai consumer A.

## RED plan / expected failures

Sole runtime owner đã chạy47 original RED: executed47, failed44, passed3, skip0, compiler0, hash drift0. Evidence `../runtime/backend-boundaries-red47/verification.json` + TRX/log. Đã đọc failures. Tiếp theo GREEN filter tương tự, hiện57cases; 10 bổ sung là characterization, không gắn nhãn đã quan sát RED.

1. ERR005: invalid URL/host/parser lỗi dễ hiểu; failed AnalyzeForm UsageLog bằng safe public message, CreditsUsed0, không tạo project; transport original inner được giữ nhưng provider marker không vào usage/UI.
2. ERR006: non2xx, missing URL/data và malformed JSON trả failed safe không raw body/marker. Giữ public response shape/409 ở existing caller.
3. ERR012: existing constraints negative/integer/100-total/date-order/time-step/required HH:mm/root-object trả guidance cụ thể, không ghi rule; malformed JSON vẫn có JsonException inner.
4. ERR013: create/update known package validation→400; no row; không parameter suffix. Production dùng shared `PackageService.GetValidationError` tại controller request boundary và service; không blanket catch, service vẫn exact ArgumentException để giữ regression hiện hữu.
5. ERR019: provider check mô tả rõ local configuration và chưa thử kết nối; audience syntax error dùng bối cảnh, giữ syntax cause. Không đổi provider/Ready/status fields.
6. ERR010: Forms 401/403/404/429/503 giữ HTTP metadata bằng typed HttpRequestException; OAuth config/non2xx/missing/malformed token không trở thành null-unlinked; import/link map existing service result theo operation; caller cancellation vẫn cancellation.

## Implementation decisions / pending overlap

Root đồng ý thêm internal `Integrations/Google/GoogleIntegrationException.cs` + enum file riêng, không DTO công khai. Null giữ absence link/token; typed failure giữ safe operation/kind/status, inner cause; không raw provider description/token/body vào message hoặc logs. OAuth user-info dùng injected HttpClient hiện có để fake HTTP kiểm trọn chain. Core identity verifier chỉ thêm safe diagnostics cho config/invalidJWT, giữ generic identity/auth result.

Independent A review `../review-ab-resume/report.md` chấp nhận source007/008; root release hai consumer sau đó. Link/Import/Generate wrapper catch typed, map existing results. Configuration/rate/transport/parse→ExternalError502; invalid_grant link→InvalidRequest; invalid_client→ExternalError. Unauthorized detail giữ exact English discriminator hiện có để không kích JWT refresh/logout. Generate provider-stage failures trả existing ExternalError với hướng dẫn kiểm Google Forms trước khi thực hiện lại; A remote identity audit/original stage Data giữ nguyên. Collect service vẫn A catch/save bằng bounded token/throw original; controller Collect catch typed sau throw và map HTTP existing contract. Typed log description an toàn, tests fresh context/cause có thêm.

ERR012 gọi validator hiện có trực tiếp thay boolean để giữ constraint guidance; chỉ thêm ValueKind guards để trả thông báo constraint cùng hành vi rejection hiện hữu, không thêm rule/limit. Syntax vẫn giữ JsonException inner. ERR019 dịch audience/config/provider messages và xác nhận provider check chưa thử kết nối; không historical backfill.

Ruling: không dùng exception subclass package dự kiến ban đầu vì xUnit regression yêu cầu exact ArgumentException; shared validator xử lý tại request boundary, không bắt exception từ arbitrary service operations. Cost nếu sai: validation controller/service có thể lệch nếu bỏ một caller; hiện cùng một helper.

## Validation performed

- Verified static `git diff --check` cho G owned files, exit0, trước freeze GREEN.
- Verified bằng đọc actual runtime RED verification/log:47executed/44fail/3pass/0skip/compiler0,14hashes ổn định.
- Baseline/frozen source snapshot + SHA256, full patch và isolated A-consumer delta lưu tại thư mục này.

## Validation not performed / Risks / Next recommended step

- Not run/pending: GREEN57/regression/build và actual API/SQL/browser; sole runtime owner chịu runner.
- Not run: independent G auth/payment review.
- Các ID đã implemented, chưa Verified fix/Done vì GREEN/runtime/review pending. Không claim integration/release.
- Next: GREEN57, regressions A + Phase3/usage/PayOS/package/prompt/provider/NCKH phase1/4/5; independent auth/payment review trên frozen21files; actual400/no-write/FailedUsage smoke trên clone và safe Google/PayOS mock HTTP/DI/log/callback/auth discriminator checks. Giữ provider thật/payment/submission/schema/cleanup/release Deferred.
