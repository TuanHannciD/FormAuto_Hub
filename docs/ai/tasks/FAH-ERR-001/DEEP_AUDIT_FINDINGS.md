# FAH-ERR-001 — Independent additions ERR-021–024

2026-10-29 · HEAD `a19f7a2f3dc1bc54ff645d662d94fc614439256a` · Audit only; remediation Deferred.

Current register and old-ID dispositions: [deep report](DEEP_AUDIT_REPORT.md). Initial drafts: [ERR-001–005](FINDINGS.md), [ERR-006–020](FULL_PASS_FINDINGS.md). Evidence IDs refer to [UI results](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui/probe-results.json), [UI report](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui/report.md), [runtime report](../../../../artifacts/reports/error-audit-2026-10-29/deep/runtime/report.md) and final [independent review](../../../../artifacts/reports/error-audit-2026-10-29/deep/review/report.md). No production incident or completed fix is asserted.

## ERR-021 — P2: Failed reads appear as empty account data, unlinked Google or an empty NCKH list

**Group:** combined/misclassified causes + user comprehension. **Audience/layer:** User; account components and NCKH list. P2 because failed reads are treated as valid domain state and profile saving remains possible.

**Sources / complete units:**

- [AccountProfilePanel](../../../../apps/web/components/account-profile-panel.tsx): profile GET effect, `save`, editable name and save button.
- [AccountSecurityPanel](../../../../apps/web/components/account-security-panel.tsx): profile load and linked-state label.
- [NCKH list](../../../../apps/web/app/dashboard/nckh/page.tsx): `loadForms`, table empty state and error alert.
- Profile write path: [ProfileController](../../../../src/FormAutoHub.Api/Controllers/ProfileController.cs), [ProfileService](../../../../src/FormAutoHub.Api/Services/ProfileService.cs), relevant profile record in [Phase2Dtos](../../../../src/FormAutoHub.Api/Contracts/Phase2Dtos.cs).

**Trigger / observed:** Profile or forms-list GET fails (503 in browser fixture); this does not establish blank name, unlinked account or empty list.

| Surface | Current UI / diagnostics | Evidence |
| --- | --- | --- |
| Profile | Blank editable name, blank disabled email, enabled `Lưu hồ sơ`; transient load-error toast. With fixture detail, toast is `Service Unavailable`. | UI-P02 executes original component/save with mock PUT `{fullName:""}`. RUNTIME-03 confirms blank inputs/button in real rendered app, **without clicking save**. |
| Security | `Chưa liên kết`, `Email hiện tại: -` after failed profile read. Google button disabled; no claim linking remains actionable. | UI-P03 component mock; RUNTIME-04 rendered + profile GET503. Canonical `browser-security-confirmed.json`. |
| NCKH list | Alert `Không tải được danh sách form. Vui lòng thử lại.` plus table `Chưa có form nào` and `Dán URL Google Form vào ô trên để nhập.` The referenced input is absent in captured state. Previous items may remain on a subsequent failed reload without a table validity marker. | UI-P04 mock; RUNTIME-05 first-load 503 rendered error + empty messages. Old-items behavior source-traced, not browser reproduced. |

**Expected / impact:** A failed read remains unknown/error rather than confirmed empty/unlinked data. A persistent error/retry state should make the blocked action understandable. Profile source accepts the supplied name; the mock proves the blank-write handler path, **not a real database overwrite**. Shared message filtering is ERR-003; ERR-021 concerns state validity and conflicting data presentation, so it is one cross-consumer group rather than three independent IDs.

**Proposal (Deferred):** Preserve known data, distinguish successful absence from unavailable data, and gate profile saving until current data is confirmed. Suggested copy: `Chưa tải được hồ sơ. Vui lòng tải lại trước khi lưu thay đổi.`, `Chưa xác định được trạng thái liên kết`, `Chưa tải được danh sách biểu mẫu.` Keep NCKH alert consistent with the table. Do not invent a missing-link/domain cause.

**Diagnostics / contracts:** Retain safe read failure identity and affected region/operation; a transient toast alone is insufficient state feedback. No new status/DTO/DB field is assumed. Preserve credential privacy and Google/JWT distinction; no account enumeration change.

**Validation to approve with remediation:** Successful populated/empty reads, 503/transport/auth failures, reload failure after prior data, account-dialog reopen, retry and save gating; browser plus network assertions. If acceptance includes persistence, authorized test account/API/SQL proof and reload are required. **Not run:** actual profile PUT/DB overwrite, real linked/unlinked account, full account E2E.

**Independent disposition:** UI-001 accepted by final independent review at the stated evidence level; included in the current 24-group register.

## ERR-022 — P3: Clipboard rejection leaves no actionable feedback

**Group:** UI comprehension + unhandled error boundary. **Audience/layer:** User/Admin; copy-code/link click handlers. P3 because it is an auxiliary action with a possible manual workaround.

**Sources:** `RequestCode.copyId` in [top-up](../../../../apps/web/app/dashboard/top-up/page.tsx) and [manual credits](../../../../apps/web/app/admin/manual-credits/page.tsx); `copyWebhookUrl` in [PayOS settings](../../../../apps/web/app/admin/payos-settings/page.tsx); inline copy handler in [top-up detail](../../../../apps/web/app/dashboard/top-up/_components/topup-order-detail.tsx).

**Trigger / observed:** `navigator.clipboard.writeText` rejects or is unavailable. Handlers await it and then show success; no catch/fallback shows failure. **UI-P08 Verified**: original `copyId` rejects to its caller and emits no user notification with a rejected synthetic clipboard boundary. Sibling handlers source-traced. Browser `unhandledrejection` is **Not run**, so neither an observed browser event nor missing console stack is claimed.

**Expected / impact:** Failed copy gives clear feedback and a manual option instead of appearing unresponsive. Existing browser diagnostics may retain the rejection; absence of a custom log is not proof all diagnosis is lost.

**Proposal (Deferred):** Catch clipboard failure, display `Chưa sao chép được mã. Bạn có thể chọn và sao chép thủ công.` or the equivalent for a link, and retain safe operation/cause context. Do not log copied content. This local UI handling needs no response/schema change.

**Validation to approve with remediation:** Rejected/missing Clipboard API, successful write, repeated clicks and keyboard activation in an owned browser. Assert failure feedback and absence of unhandled rejection after repair; use synthetic content. **Not run:** real clipboard permission behavior/browser rejection in this audit. No real clipboard content read.

**Independent disposition:** UI-005 accepted by final independent review at the stated evidence level; included in the current 24-group register.

## ERR-023 — P2: Submission details omit failure reasons already returned by the API

**Group:** user comprehension + diagnostic presentation. **Audience/layer:** User; submission result detail UI. P2 because details cannot distinguish why an attempt failed or identify the affected attempt for support.

**Sources / chain:** [GoogleFormsClient.SubmitAsync](../../../../src/FormAutoHub.Api/Integrations/GoogleForms/GoogleFormsClient.cs) → [SubmissionService.SendAsync](../../../../src/FormAutoHub.Api/Services/SubmissionService.cs) → [Phase3Mappings](../../../../src/FormAutoHub.Api/Services/Phase3Mappings.cs) → `SubmissionJob.logs` in [api.ts](../../../../apps/web/lib/api.ts) → `submissionLogsOpen`, `buildSubmissionBatches` and the detail render in [forms page](../../../../apps/web/app/dashboard/forms/page.tsx).

**Trigger / observed:** A returned failed attempt includes `errorMessage` and `responseId`. External non-success can produce `Google Form returned HTTP {status}.`; service records/projects this into logs. UI shows `Lượt gửi kết thúc: X thành công, Y lỗi.` and opening `Chi tiết các lượt gửi` still only counts Success/Failed per group. It does not consume the existing attempt `errorMessage`/`responseId` for useful details.

**Evidence:** UI-006 is **static source-to-consumer**, reviewed independently. No failed real submission, browser detail interaction, SQL persistence or Google call was executed. Do not claim the backend has no logs: this finding is specifically omission of fields already returned for a completed response. ERR-007 is contradictory usage wording; ERR-008 is missing evidence after interruption; ERR-023 is a separate display omission when evidence exists.

**Expected / impact:** Explain safely what is known and provide the existing job/attempt reference when useful. Do not expose raw provider text or assume a safe retry when external outcome is uncertain.

**Proposal (Deferred):** Render classified safe reasons and existing support IDs alongside counts. Generic fallback: `Chưa gửi được lượt này. Vui lòng kiểm tra lại biểu mẫu hoặc liên hệ hỗ trợ kèm mã lượt gửi.` Cause-specific guidance must be supported by the actual error identity; the fallback is a proposal, not a new contract or promise. Keep raw diagnostics internal and preserve preview/confirmation/sequential-batch controls.

**Validation to approve with remediation:** Existing response fixtures for success, known failure, unknown/missing reason, partial results and sensitive/long provider text; rendered details, network shape and safe support reference. Backend fault tests should remain separate for interrupted outcomes. **Not run:** real browser/API/SQL/provider failed-attempt E2E or blind resend.

**Independent disposition:** UI-006 accepted by final independent review at the stated evidence level; included in the current 24-group register.

## ERR-024 — P2: Date/time defaults conceal empty submitted config

**Source:** [RuleEditor](../../../../apps/web/app/dashboard/forms/_components/RuleEditor.tsx) `updateDateRange/updateTimeRange`; [helpers](../../../../apps/web/app/dashboard/forms/_helpers.ts) `readDateRange/readTimeRange`; [forms page](../../../../apps/web/app/dashboard/forms/page.tsx) `canGenerate/saveRulesAndGenerate`. Backend dependency: `Phase3RuleHelpers.ReadRequiredDate/ReadRequiredTime/HasValidConfig`, `AnswerRuleService.ValidateRequest`, `AnswerRulesController`.

**Trigger / observed:** Clearing a date/time input writes `""` to configJson; the read helper uses `||` fallback so the input displays a default. The generate gate accepts nonempty JSON text and POSTs the unchanged empty field. Independently rerun UIR-P01/P02 show displayed `2026-05-18` / `09:00`, but POST `fromDate:""` / `fromTime:""`. Mock rejection uses current service literal `Answer rule config does not match the selected mode and question.`, which survives to toast. Backend constraint rejection/400 is source-traced, not executed C#/MVC/HTTP. Probe covers start fields; matching end-field structure was read but not separately probed.

**Impact / distinction:** P2 because visible valid-looking fields differ from the request, preventing preview generation without field guidance. Fixture stops at first rule POST; no actual credit loss, saved wrong data or submission established. ERR-012 remains backend constraint-cause collapse; ERR-003/019 remain raw wording. Fixing backend copy alone does not synchronize UI/config.

**Proposal (Deferred):** Keep cleared inputs empty with field guidance, or initialize defaults once into the same state when selecting mode. Validate required endpoints/order/time step using existing constraints before sending. Suggested guidance: `Hãy chọn ngày bắt đầu.` / `Hãy chọn giờ bắt đầu.` No new DTO/status/field is assumed. Remediation acceptance needs browser clear/retype/mode switch plus network payload and actual API validation.

**Evidence / review:** [Author report](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui-remainder/report.md), [coverage](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui-remainder/coverage.json), [independent review](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui-remainder-review/report.md), [independent mock results](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui-remainder-review/probe-results.json). Reviewer accepts ERR-024/P2 and total24 =2 P1/20 P2/2 P3;2 mocked observations rerun,8 source hashes matched. **Not run:** React DOM/browser/end-field probes/actual API/SQL/provider. All implementation remains Deferred.

## Accepted extensions without new groups

- **ERR-019:** UIR-002 traces `Option 2/3`, `product baseline` and `product safety rules` into leaf AI/public UI. Keep correct expanded/collapsed state in any proposed copy; public copy does not increase group severity.
- **ERR-021 / related ERR-017:** UIR-003 traces null/failed NCKH dataset slices into `Chưa có bộ dữ liệu`; parent warning exists. Do not allege whole-page error swallowing or a wrong mutation.
- **ERR-021:** UIR-004 traces admin search failures to no-result/old options. An existing version guard protects old success responses; no wrong credit grant established. These are static consumer traces, not new browser/mutation evidence.

## Approval boundary and next step

All proposed wording, state handling, diagnostics and tests above remain Deferred until an implementation group is approved. No new endpoint, field/status, recovery policy, retention, migration, historical-row rewrite or automatic retry is authorized. Review scope should include shared API/helper consumers to avoid losing Google authorization/session safety. Full-system audit Done, integration and release are not asserted.

## Existing findings:actual API/SQL follow-up

[RUNTIME_API_SQL](RUNTIME_API_SQL.md) strengthens ERR-002 with actual MVC validation fields/traceId,ERR-005 with persisted failed AnalyzeForm UsageLog,and ERR-013 with actual Development HTTP500/no package write. Short-password400 is generic `Bad Request`;it does not establish the old synthetic ERR-018 sentence. No new IDs or fixes;24groups remain.
