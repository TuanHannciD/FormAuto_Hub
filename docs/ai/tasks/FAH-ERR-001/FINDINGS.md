> Historical initial checkpoint. Current **24-group** register and evidence: [deep report](DEEP_AUDIT_REPORT.md), [ERR-021–024](DEEP_AUDIT_FINDINGS.md), [coverage](COVERAGE.md), [validation](VALIDATION.md). Queued/next-step statements below apply only to the initial checkpoint.

# FAH-ERR-001 — Initial findings: shared error handling

Date: 2026-10-29. Audited HEAD: `a19f7a2f3dc1bc54ff645d662d94fc614439256a`.
Status: **Partial audit; no remediation implemented**. All five findings are P2: user comprehension or diagnostic loss affecting ordinary failure handling; no confirmed production incident or secret disclosure. Groups follow [INDEX](INDEX.md). [Coverage](COVERAGE.md) lists remaining work.

## Evidence and reproduction

Local evidence: [probe](../../../../artifacts/reports/error-audit-2026-10-29/shared-error-probe.cjs), [results and source hashes](../../../../artifacts/reports/error-audit-2026-10-29/shared-error-probe-results.json), [inventory manifest](../../../../artifacts/reports/error-audit-2026-10-29/source-manifest.json).

Command from repository root: `node artifacts/reports/error-audit-2026-10-29/shared-error-probe.cjs` — exit 0, 5/5 observations reproduced. The probe transpiles actual TS helper code; login mapping is extracted from its actual function AST. Fetch/auth/toast are synthetic boundaries, with no browser, API, DB or provider call. These passing assertions confirm problematic current behavior, not successful fixes. No assertion proves rendered browser behavior.

From `apps/web`: `npm run test:auth` — exit 0, 9/9 existing tests passed. These cover session handling, not general error readability. Existing `public-ui-refinement.spec.ts` explicitly expects `Unauthorized` in the login alert; that browser test was read, not rerun.

## ERR-001 — HTTP identity is discarded before login translates errors

- Group: combined/misclassified causes + UI comprehension + diagnosis. P2 because users can see an English status title and consumers cannot reliably distinguish statuses.
- Source: [api.ts](../../../../apps/web/lib/api.ts), `apiFetchInternal`; [login](../../../../apps/web/app/login/page.tsx), `authErrorMessage`; [AuthController](../../../../src/FormAutoHub.Api/Controllers/AuthController.cs), `ToActionResult`. Auth service intentionally combines wrong credentials; preserve that protection.
- Trigger: a login response with HTTP 401 and `{title: "Unauthorized", status: 401}`. `apiFetchInternal` keeps only title/detail in a plain Error; login looks for `401`/`423` inside the message. **Verified in mock, PROBE-01:** mapped message is `Unauthorized`; Error has no status property.
- Expected: select the appropriate existing auth UI wording from reliable response identity while keeping credential failure generic. Proposed wording for this case: `Email hoặc mật khẩu không đúng.`
- Diagnostic impact: status/path/method are not explicitly attached by this helper. Browser network tools may retain them; do not claim all tracing is impossible.
- Proposed repair: preserve existing HTTP identity internally and map it at the consumer; review sibling register/Google/account mappings before selecting a shared design. No server response contract change is assumed.
- Validation: 401 title-only, 423, conflict and unknown failure fixtures; auth/session regressions plus browser alert and network assertions. Update the test expecting English only after the new wording is approved.

## ERR-002 — Validation details and trace information are lost

- Group: combined causes + diagnosis + UI comprehension. P2 because a user loses field-level correction guidance and developers lose correlation data already present in the response.
- Source: [api.ts](../../../../apps/web/lib/api.ts), non-success response parsing.
- Trigger: HTTP 400 with a generic title, `errors` per field and `traceId`. **Verified in mock, PROBE-02:** resulting Error contains only `One or more validation errors occurred.`; neither `errors` nor `traceId` is retained.
- Expected: preserve available safe diagnostics and distinguish field validation from a generic failure. Proposed generic copy: `Một số thông tin chưa hợp lệ. Hãy kiểm tra các mục được báo lỗi.` Use it only when the UI actually identifies those fields; otherwise avoid promising highlights that do not exist.
- Proposed repair: inspect actual validation payloads by endpoint, retain existing structured details internally, and map known fields/messages to Vietnamese. New response fields or a global `ProblemDetails` contract remain unapproved.
- Validation: multiple fields, unknown field, missing title, malformed JSON, and actual model-binding responses. **Not run:** actual ASP.NET validation payload reproduction; the probe uses a representative fixture, not a verified endpoint response.

## ERR-003 — Readability filtering passes English network errors and raw text

- Group: UI comprehension + diagnosis. P2 because common network/proxy failures bypass the contextual Vietnamese fallback.
- Source: [api.ts](../../../../apps/web/lib/api.ts), raw response fallback and unwrapped fetch rejection; [toast.ts](../../../../apps/web/lib/toast.ts), `readableError` and `showError`.
- Trigger A: a short HTML error body from a synthetic 502 response. **Verified in mock, PROBE-03:** `<html><body>Upstream unavailable</body></html>` is returned unchanged by `readableError`. This is text exposure; React/sonner rendering was not tested and XSS is not established.
- Trigger B: fetch rejects with `TypeError('Failed to fetch')`. **Verified in mock, PROBE-05:** `showError(error, 'Không tải được dữ liệu.')` emits `Failed to fetch`; no `console.error` call occurs because raw equals displayed message. Devtools may independently record failed requests.
- Expected: contextual, understandable wording; retain safe diagnostic information without assuming network rejection identifies offline/CORS/TLS/proxy cause. Proposed UI: `Không kết nối được với hệ thống. Hãy kiểm tra kết nối và thử lại.`
- Proposed repair: classify transport/unexpected-body failures before UI display; do not treat line length and substring checks as a safe-message policy. Review the current branch that logs the original error when text is filtered, including confidentiality implications; no real secret leak was reproduced.
- Validation: failed fetch, abort, timeout, short HTML/plain text, JSON errors, multiline/long messages, safe log content and consumer rendering. Do not accidentally turn intentional aborts into user alerts.

## ERR-004 — File downloads discard the server explanation

- Group: combined causes + UI comprehension + diagnosis. P2 because downloads have less actionable information than JSON requests for the same server failure.
- Source: [api.ts](../../../../apps/web/lib/api.ts), `apiFetchBlob`; search-discovered consumers: evidence images in top-up/manual-credit pages and NCKH export. Consumer workflows are not yet fully reviewed.
- Trigger: non-401 download response with `{title, detail}`. **Verified in mock, PROBE-04:** the same synthetic 409 yields its detail through `apiFetch`, but `apiFetchBlob` yields only `Không tải được tệp. Mã lỗi HTTP 409.`
- Expected: an understandable operation-specific message and preserved safe cause/status internally. Suggested fallback: `Không tải được tệp. Vui lòng thử lại.` Conflict-specific guidance requires the actual endpoint reason; do not infer reload/retry safety from HTTP status alone.
- Proposed repair: share non-success parsing where response types allow it, while preserving the current special handling of Google authorization and FormAuto session recovery.
- Validation: image/export failures, JSON/plain/empty error body, 401 Google versus JWT, permission/not-found/conflict; existing session tests plus actual browser consumer checks.

## ERR-005 — English analysis failures also become user-visible usage descriptions

- Group: UI comprehension. P2 because the same developer-oriented messages reach both operation feedback and user history.
- Source chain: [GoogleFormsClient](../../../../src/FormAutoHub.Api/Integrations/GoogleForms/GoogleFormsClient.cs), `AnalyzeAsync` → [FormProjectService](../../../../src/FormAutoHub.Api/Services/FormProjectService.cs), `AnalyzeAsync`/`WriteUsageLogAsync` → [FormsController](../../../../src/FormAutoHub.Api/Controllers/FormsController.cs), `Analyze` → `apiFetchInternal` → [forms page](../../../../apps/web/app/dashboard/forms/page.tsx), `analyze`/`showError`. History: [UsageLogService](../../../../src/FormAutoHub.Api/Services/UsageLogService.cs) → [UsageLogsController](../../../../src/FormAutoHub.Api/Controllers/UsageLogsController.cs) → [usage page](../../../../apps/web/app/dashboard/usage-logs/page.tsx), description column.
- Static evidence: messages include `Invalid form URL.`, `Only public Google Forms URLs are supported.` and `Google Form action URL was not detected.` Service writes the same exception message to `UsageLogs.Description`; controller sends it as detail and toast's short-message filter passes it. The history column renders the description directly. **Verified by source tracing only; full DB/HTTP/browser reproduction Not run.**
- Expected: user-facing explanation in Vietnamese without implementation terms such as action URL/entries; diagnostics preserve technical detail separately. Suggested copy for the unsupported link branch: `Liên kết này không phải liên kết Google Biểu mẫu được hỗ trợ. Hãy kiểm tra lại liên kết.` Do not guess why question detection failed from the generic parser branch.
- Proposed repair: separate safe presentation from technical cause at existing boundaries. Historical persisted English descriptions need a separate decision; do not rewrite immutable history or migrate data as an implicit wording fix.
- Validation: invalid URL, unsupported host, parsing failure and provider HTTP failure through UI and history. Confirm original cause preservation: current service wraps with the original exception as inner exception, so this branch does **not** lose the exception chain at that point.

## Repair grouping, remaining questions and next action

Proposed order, not implementation approval: (1) investigate a shared error representation/parsing design for ERR-001/002/004; (2) safe UI mapping and diagnostics for ERR-003; (3) endpoint-specific wording and usage-description behavior for ERR-005. Keep shared auth distinctions and log/credit/submission invariants.

Inspection notes, not additional proven defects:

- `Program.cs` does not register explicit `UseExceptionHandler`/`AddProblemDetails`; it migrates the DB on startup. Determine actual environment behavior before judging unhandled errors; do not start the API casually to inspect responses.
- `readableNckhError` mixes plain Vietnamese with `contract NCKH`, `min/max` and broad substring grouping. The helper and variable controller were read; service/consumer contracts and runtime branches remain queued before assigning a separate finding.
- Usage/credit history pages explicitly distinguish failed loading from empty results in current code; do not report their use of `EmptyState` as proof of swallowed errors.

Next: continue endpoint/service/consumer tracing for the 282 queued files, prioritize payment/credit/submission and NCKH diagnostic boundaries, and inspect runtime ownership/schema prerequisites read-only. Full runtime/provider verification and independent review remain **Not run**. No release, deployment or product change made.
