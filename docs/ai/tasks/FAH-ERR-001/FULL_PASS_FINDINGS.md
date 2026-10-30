> Historical static-pass report; its **20-group** count/evidence describe that checkpoint. Current register: **23 groups, 2 P1 / 20 P2 / 2 P3**, [deep report](DEEP_AUDIT_REPORT.md), [new findings](DEEP_AUDIT_FINDINGS.md). ERR-012/015 materially corrected below; all current evidence/dispositions follow the deep report. Exact pre-correction text is preserved in [baseline documents](../../../../artifacts/reports/error-audit-2026-10-29/deep/synthesis/baseline-documents.json).

# FAH-ERR-001 — Full-pass findings

2026-10-29 · HEAD `a19f7a2f3dc1bc54ff645d662d94fc614439256a`.

Total **20 finding groups: 2 P1, 17 P2, 1 P3**, including [ERR-001–005](FINDINGS.md) and the 15 groups below. This is a full selected-scope static screening pass with representative isolated checks, not full-system runtime certification. P1 prioritizes source-demonstrated risk, not a confirmed production incident. No product fixes.

[Coverage](COVERAGE.md) · [Inventory](SOURCE_INVENTORY.md) · [Validation](VALIDATION.md)

Each group records source/symbol, trigger/consequence, recommendation and verification. Static means source inspection; Verified refers to an executed probe; Not run remains unexecuted runtime coverage. Recommendations are Deferred and approve no new contract.

## ERR-006 — P2: Raw PayOS response bodies reach UI or browser diagnostics

**CreatePaymentLinkAsync** · [PayosClient.cs](../../../../src/FormAutoHub.Api/Services/PayosClient.cs), [PaymentService.cs](../../../../src/FormAutoHub.Api/Services/PaymentService.cs), [PaymentsController.cs](../../../../src/FormAutoHub.Api/Controllers/PaymentsController.cs)

Raw PayOS response bodies reach UI or browser diagnostics. HTTP failure and missing checkout URL interpolate responseText; PaymentService forwards it and PaymentsController returns Conflict. Short text passes readableError, long text can be logged by showError. Different provider failures also become 409. No actual secret disclosure was reproduced.

**Proposal / validation:** Separate safe payment guidance from bounded, redacted provider diagnostics; retain existing status internally. Review contract before changing HTTP classification. Suggested UI: “Chưa tạo được liên kết thanh toán. Vui lòng kiểm tra lại yêu cầu nạp tiền.”

**Evidence:** Static chain + structural assertion; sandbox malformed/non-2xx body and safe console assertions required.

## ERR-007 — P2: Usage status is Failed for failed/paused/cancelled jobs, yet Description always says “Gửi form thành công”

**SendAsync / WriteUsageLogAsync** · [SubmissionService.cs](../../../../src/FormAutoHub.Api/Services/SubmissionService.cs), [page.tsx](../../../../apps/web/app/dashboard/usage-logs/page.tsx)

Usage status is Failed for failed/paused/cancelled jobs, yet Description always says “Gửi form thành công”. History contradicts the outcome even though the submission UI distinguishes returned status/counts.

**Proposal / validation:** Describe the actual existing outcome and counts. Do not rewrite historical rows implicitly. Test failed, mixed, paused and cancelled jobs and the rendered history.

**Evidence:** Static + structural assertion; no failed submission executed.

## ERR-008 — P1: Interrupted external operations can lose diagnostic persistence

**SendAsync / CollectResponsesAsync / CreateGeneratedFormAsync** · [SubmissionService.cs](../../../../src/FormAutoHub.Api/Services/SubmissionService.cs), [ResearchDataService.cs](../../../../src/FormAutoHub.Api/Services/Nckh/ResearchDataService.cs), [ResearchFormService.cs](../../../../src/FormAutoHub.Api/Services/Nckh/ResearchFormService.cs), [GoogleFormsClient.cs](../../../../src/FormAutoHub.Api/Integrations/GoogleForms/GoogleFormsClient.cs)

Interrupted external operations can lose diagnostic persistence. Submission saves Running before sending, adds an attempt log only after SubmitAsync returns and saves per batch. Network exceptions bypass completion; current attempt and buffered earlier results may be absent while external sends may already exist. Payload JsonException is rethrown without inner exception and leaves the job unfinished. NCKH collection adds its log before I/O but saves later; thrown failures bypass the null-result failure path. Remote form creation can succeed before question creation/import fails without retaining the remote outcome locally.

**Proposal / validation:** First preserve original cause, existing operation IDs and known/unknown outcome safely. Review persistence/transaction and recovery policy before implementation; do not blindly resend or generate again. Fault-injection tests must assert durable logs and job state after exceptions, including a failure after one successful external operation.

**Evidence:** Static risk, submission call/log ordering structurally asserted; persistence and live external outcomes Not run. P1: ambiguous external side effects and retry risk.

## ERR-009 — P1: Every AI request and response is logged at Information as raw JSON

**GenerateAsync / BuildPayload** · [OpenAiCompatibleProviderAdapter.cs](../../../../src/FormAutoHub.Api/Integrations/AI/OpenAiCompatibleProviderAdapter.cs), [AiGenerationService.cs](../../../../src/FormAutoHub.Api/Services/AiGenerationService.cs)

Every AI request and response is logged at Information as raw JSON. Payload includes prompts, question snapshots and contextual identifiers; concurrent batches produce large logs without an explicit run/batch scope in these messages. The Authorization header is separate: this is not evidence that an API key is logged.

**Proposal / validation:** Use bounded, redacted diagnostic metadata and existing run/project context; keep sensitive payload access/retention a separate explicit decision. Test logger capture with synthetic personal text, token-like content, large responses and parallel batches.

**Evidence:** Static + structural assertion, no real payload collected. P1: routine raw user-content logging at normal log level.

## ERR-010 — P2: Missing OAuth config, token HTTP failure and missing token collapse to null; Forms non-2xx responses also collapse to null/false without status or provider request context

**ExchangeCodeAsync / Google Forms integration boundary** · [GoogleOAuthService.cs](../../../../src/FormAutoHub.Api/Integrations/Google/GoogleOAuthService.cs), [GoogleFormsApiService.cs](../../../../src/FormAutoHub.Api/Integrations/Google/GoogleFormsApiService.cs), [ResearchFormService.cs](../../../../src/FormAutoHub.Api/Services/Nckh/ResearchFormService.cs), [page.tsx](../../../../apps/web/app/dashboard/nckh/callback/page.tsx), [GoogleIdentityVerifier.cs](../../../../src/FormAutoHub.Api/Auth/GoogleIdentityVerifier.cs)

Missing OAuth config, token HTTP failure and missing token collapse to null; Forms non-2xx responses also collapse to null/false without status or provider request context. Downstream messages can blame expired authorization, inaccessible form or not-found even for provider 429/503. Core identity verifier also returns null for missing client config and invalid JWT; keep credential UI generic but distinguish configuration internally.

**Proposal / validation:** Preserve safe upstream failure identity internally and map known causes per operation. Keep NCKH Google/JWT discriminator contract and auth-session behavior intact. Test config missing, invalid_grant, invalid_client, 403/404/429/503, transport failure and malformed body.

**Evidence:** Static end-to-end trace; provider runtime Not run.

## ERR-011 — P2: Run ErrorMessage can distinguish provider failure/timeout, guard rejection and credit failure, but response and analytics projections omit that reason

**GenerateAsync / ToResponse / createAiPreviews** · [AiGenerationService.cs](../../../../src/FormAutoHub.Api/Services/AiGenerationService.cs), [OpenAiCompatibleProviderAdapter.cs](../../../../src/FormAutoHub.Api/Integrations/AI/OpenAiCompatibleProviderAdapter.cs), [AiAnalyticsService.cs](../../../../src/FormAutoHub.Api/Services/AiAnalyticsService.cs), [page.tsx](../../../../apps/web/app/dashboard/forms/page.tsx)

Run ErrorMessage can distinguish provider failure/timeout, guard rejection and credit failure, but response and analytics projections omit that reason. UI maps Failed to “AI chưa tạo được bản xem trước hợp lệ. Không trừ credit.” Provider non-2xx keeps only HTTP status; extraction can turn malformed output into no outputs. Task.WhenAll also needs per-batch evidence when a sibling fails.

**Proposal / validation:** Design safe cause-specific guidance and support correlation using existing run identity. Any response additions require contract review; never return raw exception text. Test each existing Failed branch and partial parallel provider failure; verify actual credit ledger separately.

**Evidence:** Static trace, no AI cost incurred; actual balances/runtime Not run.

## ERR-012 — P2: Valid JSON with invalid rule constraints collapses to one generic mismatch

**Correction after independent deep review:** [AnswerRuleService.ValidateRequest](../../../../src/FormAutoHub.Api/Services/AnswerRuleService.cs) parses syntax first: malformed JSON throws `ConfigJson must be valid JSON.` with JsonException inner. The original claim that syntax failure loses cause into the helper's generic false branch is rejected. Valid JSON with invalid shape/type/constraint can still produce `Answer rule config does not match the selected mode and question.` without field/constraint guidance.

**Evidence:** actual service BE-P08, independently rerun: malformed `{` has JsonReaderException inner; negative/over-100 weights share generic mismatch, inner null. Controller returns Message only; retained inner object does not prove logging. Other modes/API/browser remain Not run. See [current disposition](DEEP_AUDIT_REPORT.md).

**Proposal / validation (Deferred):** retain safe, mode/constraint-specific guidance and diagnostics; test syntax/type/constraint separately without exposing ConfigJson. No new error contract approved.

## ERR-013 — P2: PackageService throws ArgumentException for invalid package input; controller create/update does not translate it and Program has no explicit application exception mapper

**ValidatePackageInput / CreatePackage / UpdatePackage** · [PackageService.cs](../../../../src/FormAutoHub.Api/Services/PackageService.cs), [AdminPackagesController.cs](../../../../src/FormAutoHub.Api/Controllers/AdminPackagesController.cs), [Program.cs](../../../../src/FormAutoHub.Api/Program.cs), [page.tsx](../../../../apps/web/app/admin/packages/page.tsx)

PackageService throws ArgumentException for invalid package input; controller create/update does not translate it and Program has no explicit application exception mapper. Admin input can escape as an unhandled error rather than actionable validation. Exact 500 body depends on environment and was not exercised.

**Proposal / validation:** Map known validation consistently at the existing service/controller boundary, preserving field guidance. Verify invalid price/credits/name through API and admin UI, plus an unexpected exception; do not prescribe a global response contract.

**Evidence:** Static source trace; actual HTTP body/status Not run.

## ERR-014 — P2: Any profile load error resets direction/prompt/scope/questions to defaults and resolves silently

**loadAiPromptProfile** · [page.tsx](../../../../apps/web/app/dashboard/forms/page.tsx)

Any profile load error resets direction/prompt/scope/questions to defaults and resolves silently. A 503 is indistinguishable from absence of saved configuration. A later save could overwrite saved settings; that write was not executed.

**Proposal / validation:** Distinguish confirmed absence from failed read; retain unsaved/current state and show “Chưa tải được cấu hình đã lưu. Vui lòng tải lại trước khi chỉnh sửa.” Test absent profile, 503, model/project switch and saving after failed load.

**Evidence:** FULL-04 Verified with extracted original function and synthetic 503; browser/persistence Not run.

## ERR-015 — P2: Confirmed mutation result is conflated with a throwing follow-up reload

**Corrected consumer map:** top-up `createPayosLink`/`submitOrder`, admin manual-credit/package mutations and provider checks await loaders that rethrow read failure. They can report the operation failed after success; PayOS may skip redirect. **Reject the old NCKH mutation-failed example:** `loadWorkspace` catches/records and resolves; `loadModelData` allSettled resolves, as do list/security loaders. UI-P06 independently rerun confirms createModel success toast plus workspace-read error, without mutation-failure toast.

**Expanded evidence:** UI-P05 actual `createAiPreviews` + `loadGeneratedPreviews` with mock POST success/GET failure reports `Không tạo được AI preview.` before retaining returned run/preview IDs, credit result or resume context. Backend source saves previews, credit transactions/run/UsageLog before return; fixture does not prove actual debit/double debit. Original FULL-05 PayOS remains mock evidence. Sibling handlers are source-traced; rendered mutation/read-failure E2E Not run.

**Proposal / validation (Deferred):** retain confirmed result/IDs, show `Thao tác đã thành công nhưng chưa tải lại được dữ liệu.` or action-specific guidance, retry only the read where safe. No automatic POST retry or duplicate-charge claim. See [deep report](DEEP_AUDIT_REPORT.md) and UI loader matrix.

## ERR-016 — P2: Every detail load failure sets isMissing=true

**top-up detail load catch** · [page.tsx](../../../../apps/web/app/dashboard/top-up/[id]/page.tsx)

Every detail load failure sets isMissing=true. Network/server failure therefore renders “Không tìm thấy yêu cầu nạp” and ownership guidance, inventing a cause unrelated to the response.

**Proposal / validation:** Separate verified not-found from unavailable data, preserving privacy for absent/not-owned resources. Suggested unknown-load copy: “Chưa tải được yêu cầu nạp tiền. Vui lòng thử tải lại.” Test 404, permission, 503 and transport failure.

**Evidence:** Static UI branch; rendered/browser reproduction Not run.

## ERR-017 — P2: Six datasets use allSettled; fulfilled slices update, failed slices retain previous values, and only the first rejection is shown without aggregate diagnostics

**loadModelData** · [page.tsx](../../../../apps/web/app/dashboard/nckh/forms/[formId]/page.tsx)

Six datasets use allSettled; fulfilled slices update, failed slices retain previous values, and only the first rejection is shown without aggregate diagnostics. On a model switch this can mix old variables with new model data. Subsequent editing consequences were not reproduced.

**Proposal / validation:** Track dataset validity per current model; prevent stale data being presented as current and record each failed dataset safely. UI: “Chưa tải đủ dữ liệu mô hình. Vui lòng tải lại.” Test switching models, two simultaneous failures and out-of-order responses.

**Evidence:** FULL-06 Verified with extracted original function, two rejected boundaries and prior state; no browser/API.

## ERR-018 — P2: Substring matching misclassifies unrelated causes

**readableNckhError / registerErrorMessage** · [_helpers.ts](../../../../apps/web/app/dashboard/nckh/forms/[formId]/_helpers.ts), [page.tsx](../../../../apps/web/app/register/page.tsx), [ResearchCanvasService.cs](../../../../src/FormAutoHub.Api/Services/Nckh/ResearchCanvasService.cs)

Substring matching misclassifies unrelated causes. NCKH “Conflict” suggests stale data/renormalization even for other conflicts, while duplicate directed relation detail falls back to generic. Registration matches “already” or “password”; a synthetic password requirement maps to “Email đã tồn tại…”. This fixture does not establish that the current API emits that exact password message.

**Proposal / validation:** Use verified endpoint-specific identity and precise existing known messages; do not infer recovery from broad English words/status alone. Test relation duplicate, stale normalization, active model, registration validation and unknown errors. Preserve NCKH Google auth discriminator.

**Evidence:** FULL-01/02/03 Verified at original mapper functions with synthetic messages; actual endpoint behavior Not run.

## ERR-019 — P2: Additional technical language survives shared filters: ConfigJson/AudienceJson validation; English provider check message; ArgumentException parameter suffixes; payment guidance mentioning backend/webhook; NCKH env/config or “contract NCKH” advice

**validation / provider check / payment return guidance** · [AiPromptProfileService.cs](../../../../src/FormAutoHub.Api/Services/AiPromptProfileService.cs), [AiProviderSettingsService.cs](../../../../src/FormAutoHub.Api/Services/AiProviderSettingsService.cs), [AiOutputValidator.cs](../../../../src/FormAutoHub.Api/Services/AiOutputValidator.cs), [page.tsx](../../../../apps/web/app/admin/ai-provider-settings/page.tsx), [page.tsx](../../../../apps/web/app/payment/payos/return/page.tsx), [_helpers.ts](../../../../apps/web/app/dashboard/nckh/forms/[formId]/_helpers.ts), [page.tsx](../../../../apps/web/app/dashboard/nckh/page.tsx)

Additional technical language survives shared filters: ConfigJson/AudienceJson validation; English provider check message; ArgumentException parameter suffixes; payment guidance mentioning backend/webhook; NCKH env/config or “contract NCKH” advice. Some admin concepts are legitimate, but raw implementation terms do not tell ordinary users how to recover. AI output validator has detailed English internal errors: translate only if displayed, do not erase useful internal detail.

**Proposal / validation:** Centralize reviewed Vietnamese presentation by audience, field and action while retaining technical diagnostics. Payment example: “Hệ thống đang chờ xác nhận thanh toán. Bạn có thể kiểm tra lại sau.” Do not promise credit until verified. Review field errors, checks, callbacks and history in browser.

**Evidence:** Static wording/consumer trace; complements ERR-003/005, not another defect for every identical consumer.

## ERR-020 — P3: Legacy scripts print booleans and completion text without asserting expected UI; missing optional buttons can skip interactions and still reach Done

**legacy smoke entrypoints** · [smoke-test.mjs](../../../../smoke-test.mjs), [smoke-test.mjs](../../../../apps/web/smoke-test.mjs), [smoke-debug.mjs](../../../../apps/web/smoke-debug.mjs)

Legacy scripts print booleans and completion text without asserting expected UI; missing optional buttons can skip interactions and still reach Done. They do not comprehensively capture pageerror/failed requests. A root script also uses page.eval, which needs compatibility verification. These are weaker evidence than assertion-based tests, not a claim current CI is green falsely.

**Proposal / validation:** Mark exploratory diagnostics clearly or add meaningful expected-state/network assertions when these scripts are next maintained. Redact credentials and use owned test accounts; no execution against unknown runtime. Verify intentional missing-element failures return nonzero.

**Evidence:** Static only; scripts not executed because they log in and can mutate analysis state.

## Proposed remediation order

1. ERR-008/009: interrupted-operation persistence and raw AI logging; review recovery/persistence/privacy decisions first.
2. ERR-014/015/017/007/016: incorrect outcome and data-state presentation.
3. ERR-001–004/006/010/011/012/013/018: preserve errors at shared boundaries, then update consumers.
4. ERR-005/019/020: presentation/history wording and smoke evidence quality.

Do not replace all messages in one sweep. Shared fix groups: API/toast helpers → auth/NCKH mappers → UI handlers → provider boundaries → operation logging/persistence. Agree design and tests per group; no implicit schema/status/field or ledger changes. No implementation/commit/deploy.
