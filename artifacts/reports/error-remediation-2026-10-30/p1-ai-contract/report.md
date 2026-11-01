# FAH-ERR-001 — ERR-011 AI contract và review shape fix

2026-10-30 · Writer `/root/ai_contract_resume` · `gpt-6.1-sol/high`, không child · Base HEAD `a19f7a2f3dc1bc54ff645d662d94fc614439256a`, shared dirty checkout theo file ownership. Không commit/integration/release.

## Summary

- Thêm trailing optional `string? ErrorMessage = null` vào `AiGenerateResponsesResponse` và `AiRecentRunResponse`, JSON `errorMessage`; giữ direct constructor callers cũ tương thích.
- `AiGenerationErrorMessages` tạo mới thông báo tiếng Việt từ allowlist exact causes. HTTP cause chỉ nhận toàn bộ format hiện hữu với đúng 3 chữ số400–599; không đưa bất kỳ raw string vào response. Timeout/kết nối, xác thực/quyền, giới hạn/tạm ngừng dịch vụ, credit, safety, sai envelope/content/output có hướng dẫn riêng. `Failed` không nhận diện trả thông báo chung; mọi status khác trả null kể cả historic ErrorMessage bẩn.
- `ToResponse` và đủ3analytics projections user/admin/paged lấy safe mapping sau materialization. Không thay entity/schema/retention/backfill. Raw success audit persistence giữ nguyên.
- Adapter kiểm mọi item trong root array hoặc `responses` array phải là object có `answers` array trước khi trả outputs. Null/number/array/missing-answers và mixed array lỗi trở thành `FormatException`, qua batch catch hiện hữu để lưu Failed run/UsageLog và zero debit; không blanket catch và không tự retry provider.
- API contract guide AI/VI cùng cập nhật field, mapping và example null. Handoff exact TS `errorMessage?: string | null` cho shared_web_resume; recent-run type nằm local `app/dashboard/ai-usage/page.tsx`, root/D tiếp consumer. Writer không sửa web.

## Files changed / snapshot

Hai DTO; `AiGenerationService.cs`; `AiAnalyticsService.cs`; new `AiGenerationErrorMessages.cs`; `OpenAiCompatibleProviderAdapter.cs`; new `FahErrAiErrorContractTests.cs`; paired `API_CONTRACT_GUIDE.md`. Existing `FahErrAiDiagnosticsTests.cs` giữ nguyên, có trong manifest để chứng minh preservation.

`before-hashes.json` + `before/` giữ8input byte copies; hashes adapter/generation/analytics/diagnostics khớp prior p1-ai/after-hashes tại resume. `after-hashes.json` + `snapshot/` giữ10files của snapshot này. `delta-from-before.diff` tách chính xác thay đổi packet khỏi dirty implementation cũ. Không đọc/sửa secret, csproj, migrations/schema, DB-sync hoặc tài nguyên runtime.

## Scope alignment / review finding

ERR-011 optional field đã user approve qua root; không cần quyết định hợp đồng mới. Helper feature-scoped được root cấp ownership. Giữ credit service/ledger, required preview, user context, không submit. Không thay all-or-failure parallel batches hoặc caller cancellation lifecycle.

Independent original snapshot review `review-ab-resume/report.md` ghi nguyên văn finding:

> P2 — ERR-011 còn đường output sai cấu trúc làm mất run/usage diagnostic
>
> Trigger: HTTP200 envelope hợp lệ có assistant content là `{"responses":[null]}`, `[null]`, hoặc phần tử number/array thay cho response object.
>
> Adapter trả từng phần tử bằng `GetRawText()` mà chưa kiểm loại phần tử. Validator trả kết quả invalid an toàn, nhưng `ReadRawAnswerItems` tiếp tục gọi `RootElement.TryGetProperty("answers", ...)` trên Null/Number/Array. API JsonElement ném `InvalidOperationException`; helper chỉ catch `JsonException` và đoạn xử lý này nằm ngoài catch của `Task.WhenAll`.

Writer đã đọc full original review, adapter/validator/raw-reader chain và thêm8case tái hiện trước sửa. Fresh review snapshot mới vẫn **Not run**, không kế thừa verdict original.

## Validation performed

- **Verified RED1 evidence đọc từ runner:** `runtime/ai-contract-red17/verification.json`:17failed,compiler0,hashDrift0.14generation/success fail missing serialized field đúng kỳ vọng;3analytics fail vì fixture thiếu project principal và trả0rows. Ba lỗi fixture không được gọi product RED.
- Sửa test fixture only: seed project liên kết cho từng history run và foreign user. Giữ RED1 evidence.
- **Verified RED2 evidence đọc từ runner:** `runtime/ai-contract-red25/verification.json` + actual TRX/log:25executed,25failed,0passed,0skip,compiler0,hashDrift0.17cases đạt missing field assertion (analytics counts9/10/10 đã qua);6shape fail bằng unhandled InvalidOperationException Null/Number/Array;2shape fail thiếu phân loại định dạng. Runner `/root/runtime_resume` xác nhận trước production edit.
- **Verified static:** `git diff --check` cho owned tracked files exit0; self-review delta và AI/VI equivalent meaning/JSON example. Mới thêm field sau ctor cuối; đủ3analytics projections đi cùng helper. Static check không thay runtime acceptance.

## GREEN request / validation not performed

Runtime runner duy nhất chạy từ repository cwd:

```powershell
dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-restore --filter "FullyQualifiedName~FahErrAiErrorContractTests|FullyQualifiedName~FahErrAiDiagnosticsTests|FullyQualifiedName~OpenAiCompatibleProviderAdapterTests|FullyQualifiedName~AiGenerationServiceTests" --logger "trx;LogFileName=fah-ai-contract-green.trx" --results-directory artifacts/reports/error-remediation-2026-10-30/p1-ai-contract/green
```

Expected focused total48cases:25new +23prior regression. **Not run GREEN** tại thời điểm packet; chưa claim pass/fixed/Done. Writer không tự build/test/process/SQL/browser.

**Not run:** full solution suite; real API sau restart với đúng User/Admin/session; SQL Server persistence/ledger fresh read; runtime logger sink; browser hydration/chunks/consumer; fresh independent review snapshot10files; no live provider. InMemory tests không chứng minh SQL durability. NU1603 dependency warning baseline không sửa.

## Risks / Deferred items / next recommended step

Unknown historical errors được generic hóa để tránh lộ nội dung; không backfill hoặc suy đoán nguyên nhân từ raw text. Shape validation làm malformed array fail toàn batch, giữ parallel all-or-failure contract. Không thay retry/retention/lifecycle, không migration, không charge/provider call thật, không submission/cleanup/remote.

Root giao runtime GREEN48 rồi fresh reviewer against after manifest và delta; tiếp safe API/SQL/browser gates + consumer TypeScript/UI. Missing gates giữ ERR-011 chưa Done. Khi có GREEN, đọc runner artifacts và cập nhật report bằng kết quả thực tế, không lặp runner.
