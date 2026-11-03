# Authenticated UI assessment and proposed design brief

Date: 2026-11-02. Historical assessment and approved design brief; implementation is now authorized. [Current execution/evidence](PROGRESS.md). Findings below describe the pre-change snapshot.

## Intent and evidence level

Help frequent users configure, review and submit authorized form responses with less reading and unnecessary scrolling, especially on phones. Admins should find actionable records and configuration without wading through general explanations. Preserve the established operational UI, Vietnamese copy, semantic tokens, shared components and existing product behavior.

Method: independent source assessments by `/root/forms_deep_audit` and `/root/surface_inventory_audit`, followed by root synthesis and deterministic scan. No current rendered app was inspected: runtime startup was Blocked and localhost3020 refused connection. This is a source audit and proposed brief, not a completed visual/heuristic certification. No numeric usability score or scroll-reduction percentage is justified.

UI UX Pro Max research matched Mobile First, long-content handling and consistent help placement. A focused progressive-disclosure query and one retry did not find a relevant match; that recommendation comes from Impeccable's cognitive-load guidance, not a claimed database match.

## Findings, highest impact first

Priority denotes proposed work order, not production incident severity. Source structure is verified; rendered impact remains to measure.

| ID | Priority | Evidence and implication | Proposed response |
| --- | --- | --- | --- |
| F01 | 1 | `dashboard/forms/page.tsx` opens all rule editors after analysis; `RuleEditor` combines multiple bordered layers, metadata and configuration for every question. Cost summary follows the entire fieldset below `xl`. Long forms repeat this structure many times. | Reduce decorative layers, move key cost/balance context beside the action, make each question easier to scan. Preserve current open defaults initially; changing defaults needs explicit interaction approval. |
| F02 | 1 | After analysis, rules step 3 links to missing `#workflow-step-3`; that anchor exists only in AI. Step 4 normally stays disabled because rules has no previews. Current-step calculation does not reflect direct-command/in-flight state. | Repair navigation mapping using existing state, separately review as behavior work; do not invent a new job lifecycle. |
| F03 | 1 | Count inputs have preceding paragraphs, not associated labels (`forms/page.tsx`, `AiModePreparationPanel`). AI cost says “chi phí thật sẽ là” although partial generation charges only valid saved previews. | Associate labels/descriptions; call the displayed estimate “Chi phí dự kiến”; show actual charge from the confirmed result separately. |
| F04 | 1 | `WorkflowSummary` receives `directRequestedCount ?? previewCount` even for AI; an old direct requested count can survive mode change. | Reproduce direct→AI and inspect correct mode-specific binding before a fix. Source-supported potential defect, not a demonstrated runtime failure. |
| F05 | 1 | AI mode banner, generation bar, summary, preview header/badges and read-only notice repeat explanations. Preview has outer and per-item disclosure; question headings truncate and inner scrolling is unnamed. | One explanation at the decision point, clear preview count/read-only status, readable question labels and named/focusable scroll regions. Preserve preview and explicit confirmation. |
| F06 | 2 | `BaseTable` already has mobile records; six columns become six label/value rows per record. User overview has four stacked metrics below `sm`, unlike admin's two-column metrics. | Design compact mobile summaries per record type, preserving access to all fields; evaluate two-column metrics with long values. Do not claim fixed-width desktop tables cause mobile overflow. |
| F07 | 2 | `admin/page.tsx` always renders a yellow backend/webhook explanation; revenue has large placeholders, disabled filters/export and copy implying future refunds/subscriptions/providers. Shell has inactive notification/help buttons and disabled search. | Separate real exceptions from help, reduce unavailable feature footprint, remove unapproved future promises. Do not implement missing features as part of cleanup. |
| F08 | 2 | NCKH workspace inputs for models, variables and mappings rely on placeholders; the canvas is fixed at 520px and adjacent panels stack. | Add persistent labels; prioritize one task/tab at a time. Measure canvas/keyboard usability before altering geometry or interactions. |
| F09 | 2 | Shared mobile menu is a custom overlay without focus trap/return, Escape handling or trigger expansion state in `ShellLayout`. | Verify keyboard behavior and define accessible navigation acceptance. Reuse an appropriate existing shared primitive when implemented. |
| F10 | 3 | History descriptions repeat paging/filter mechanics; user AI stats mix “generation”, “runs”, “Previews”, “Provider” and ambiguous time labels. Some errors require page reload or lack retry. | Use task-focused Vietnamese, distinguish timestamp/duration and current-page totals. Consistent safe read retry; no automatic replay of writes. |

Useful existing foundations: touch-oriented primary controls (44px on mobile), constrained shell width, shared table/mobile records, dialog focus behavior, clear loading/error/empty distinctions in many pages, and direct/AI safety tests. Retain these rather than globally shrinking controls or fonts.

## Proposed forms layout

**Approved direction for planning:** reorganize hierarchy and remove repetition within the incumbent design. Spacing-only changes would leave information duplication; a full visual replacement would add unnecessary scope.

Desktop: compact page title → navigation reflecting the active branch → main configuration column and existing narrow summary column. Keep the brand/tokens and shared controls. Consolidate analyzed-form metadata; prioritize title and supported question count, with internal name/date/technical identifiers in optional details. Present mode and credit multiplier together. Use fewer nested containers for questions.

Mobile: one content column; compact current-step context with access to other available sections. Keep form identification, active mode and next action easy to find. Put count, estimated cost and available balance next to the action rather than only at the end of the document. Expanded question editors remain full-width and labels remain readable.

Actions: each phase has a clear primary action. A sticky action area must be measured on short screens and with a focused input; avoid adding another persistent toolbar. Retain the current accordion defaults in the first presentation pass. Default collapsed questions, auto-collapse after analysis, or remembering disclosure across visits are **proposed interaction alternatives**, not approved requirements.

Rules: retain one **Tạo và gửi ngay** action and a concise reminder that it sends directly. No preview UI, checkbox or second confirmation. Uncertain results show a distinct “Kiểm tra kết quả gửi” action for the existing command.

AI: keep guidance → generate saved previews → review → explicit confirmation → send. Use “Hướng dẫn chung” consistently; custom per-question guidance remains discoverable. Retain read-only AI preview, stale protection and the existing confirmation condition; do not require opening every preview as a new gate. Prefer a compact result summary before detailed answers/logs.

## Copy rules and examples

Every visible sentence should help identify state, decide, act or avoid a concrete mistake. Keep costs, limits, consequences, pending/unknown outcomes and recovery inline. Move general explanations/examples/technical IDs to clearly named expandable details, without hiding errors or essential fields. Help remains in consistent relative locations.

| Current example | Proposed copy / treatment |
| --- | --- |
| `Prompt chung` | `Hướng dẫn chung` |
| `Điền prompt` | `Điền gợi ý hướng dẫn`; explain once: `Miễn phí; lưu khi tạo bản xem trước.` |
| `Lưu và tạo AI preview` | `Lưu và tạo bản xem trước AI` |
| `chi phí thật sẽ là 6 credit` | `Chi phí dự kiến: 6 credit. Chỉ trừ cho bản xem trước hợp lệ đã lưu.` |
| `Preview hiện có` | `Bản xem trước hiện có` |
| Direct command recovery explanation | `Chưa xác định kết quả gửi. Kiểm tra lại kết quả; hệ thống không tự động gửi lại.` Keep command ID in accessible details. |
| Repeated history paging explanation | Remove repetition; preserve distinctions such as `Credit trong trang` versus all-time totals. Do not change the default usage filter. |
| `Cảnh báo webhook/payment` with general backend prose | Move general verification mechanism to help; show real payment states with existing fields. Do not infer a new “needs reconciliation” category. |
| Refund/subscription/provider “đang cập nhật” | Remove the implied commitment; do not activate Deferred capabilities. |

## Whole-surface coverage and proposed order

All rows have source assessment only. Every route needs relevant current browser evidence before implementation acceptance. Groups are work order, not new phases.

| Group | Route / surface | Proposed focus |
| --- | --- | --- |
| A | `/dashboard/forms` | Highest priority: hierarchy, repetition, cost, question density, preview/results; isolate stepper/count repair |
| A | Shared shell, controls, tables, alerts, account menu | Derive patterns from forms; assess all consumers before a shared change |
| B | `/dashboard/top-up` | Selected package, amount and payment action first; history/detail secondary, retain all price and evidence facts |
| B | `/dashboard/top-up/[id]` and shared detail popup | Reuse the same compact detail view; preserve ownership/error/retry and return path |
| B | Account profile/security popup | Group fields by task, preserve labels, focus return, password/Google/security semantics |
| B | `/admin/manual-credits` | Recipient, amount, reason, evidence and review decision; never collapse facts needed for approval |
| B | `/admin/packages` | Compact list/editor; preserve validation and save confirmation |
| B | `/admin/payos-settings` | Separate key-saving warnings from URL/setup help, retain blank-secret semantics |
| B | `/admin/ai-provider-settings` | Connection/model/key essentials first; retain verified-read guards and settings errors |
| C | `/dashboard/nckh` | Link/import/list states, concise guidance and list hierarchy |
| C | `/dashboard/nckh/forms/[formId]` | Labels, tabs, canvas/panels and dialogs; preserve data/model/delete contracts |
| C | `/dashboard/nckh/callback` | Clear linking progress/error and safe return; no OAuth changes |
| D | `/dashboard` | Balance/action priority; compact metrics and empty/recent states |
| D | `/dashboard/usage-logs` | Filter and first useful record sooner; shorter copy, preserve default filter and paging |
| D | `/dashboard/credit-transactions` | Readable ledger records and filters; preserve signs/balance/reference meaning |
| D | `/dashboard/ai-usage` | Clear metrics, mode labels, timestamp/duration and errors |
| D | `/admin` | Useful metrics/recent payments first; real states distinguished from permanent guidance |
| D | `/admin/payments` | Filters, compact records/details and safe read recovery |
| D | `/admin/revenue` | Prioritize available totals; reduce unavailable chart/export/filter footprint |
| D | `/admin/ai-usage` | Compact overview/history filters with clear operational terms |
| Boundary | `/payment/payos/return`, `/payment/payos/cancel` | Adjacent source reviewed; copy/layout consistency and return to pending form progress only. Query status is not verified credit settlement. |

## Acceptance to carry into implementation

Capture immutable before/after states with identical synthetic datasets and the same viewport. Measure document height and vertical distance to the relevant action/first useful record, plus clicks/taps needed for the same task. Reduction targets must follow an actual baseline; no arbitrary percentage is approved. Shorter pages alone do not prove better task completion.

- Widths: 320, 390, 430, 768 and 1366/1440 CSS px; include a short mobile viewport, long names/labels, large balances and desktop zoom. Viewport simulation is not a physical-device test.
- Questions: 1, 10 and 30 representative questions with choice/text/checkbox/date/time cases; these are test datasets, not a new question-count limit. Response count remains 1–100.
- Touch: primary actions at least 44px on mobile; inspect secondary hit areas too. Keep readable text, contrast, visible focus and keyboard navigation; do not globally reduce font size to hit a density target.
- Shell/dialog: menu/popup stacking, background/focus management, Escape, return focus, zoom, reduced motion and sticky controls not hiding the focused field. No whole-page horizontal overflow; named table/canvas regions may scroll when appropriate.
- User comprehension: first-time users can identify the next step; frequent users can work without repeatedly reading general instructions. No claim of user-study success without observed participants.

| State / scenario | Required proof |
| --- | --- |
| Initial / analyze busy / failed / zero supported questions | Clear state, URL label and no send action before valid analysis; old URL questions do not survive a failed new analysis |
| Rules valid / invalid date-time / missing Web Locks | One direct action; local validation near fields; locks unavailable means no direct write |
| Rules double click / two tabs / reload / unknown outcome | Same account-owned command/count retained; no new generation/debit/send or unsafe replay |
| Rules partial / mixed results | Requested, accepted, success and failed counts remain distinct; missing credit quantity is not reported as submission failure |
| Direct→AI switch | Summary reflects the active mode; verify count binding without changing admission contracts |
| AI profile loading / 404 / failed | Verified-read behavior preserved; 404 defaults, read errors preserve draft and block writes; retry reads only |
| AI generated / Partial / Failed | Show actual created count and charged credit; no raw provider payload or promised full success |
| AI charged but preview GET failed | Preserve saved IDs/charge; retry only the read, never regenerate automatically |
| AI stale / unconfirmed / confirmed | Existing stale/reset rules retained; send exact preview IDs with explicit confirmation; no direct-route substitution |
| Credit shortage / top-up / continue | Preserve old previews, actual charge and continuation context; no automatic repeated payment/generation/send |
| Sending / paused / terminal / unknown | Only currently supported actions, safe results/recovery; no new resume/polling/ETA lifecycle |
| Lists/settings/account/NCKH | Loading/empty/error/success and role guards distinguishable; correct persistence/payloads if later edited |

Existing browser tests protect form automation, direct-rule replay/locks, error recovery, compact shell, top-up first viewport, admin records/settings and NCKH. They must be adapted only for approved presentation changes, not weakened to hide regressions. Run relevant build/lint/auth/browser gates and restart owned changed runtimes; use mock and API/DB evidence at their actual level. Independent review is required if submission safety, credit/payment or auth behavior is touched.

## Boundaries and open decisions

No new API/DTO/entity/status/event, persistence, provider, billing, refund, background job or submission policy. Keep sequential batches of 10, 1–100 responses, authorization, CreditTransactions/UsageLogs/SubmissionLogs and core/NCKH separation. No redesign of public pages or activation of Deferred roadmap work.

Assumption: preserve the current visual identity and primary touch target sizes. Proposed for user review: consolidated metadata/help, lighter question containers, compact cost context near actions and record summaries with accessible full details. Not yet decided: any default collapse or persistent sticky redesign. Runtime geometry and actual task-effort baseline remain Blocked.

Next step: review the prepared PLAN and choose execution method. It starts with runtime baseline, then forms and shared-consumer impact. Keep F02/F04 behavior repair separately reviewable after reproduction; do not fold them silently into spacing edits.

## Implementation evidence update

[PROGRESS](PROGRESS.md) records completed local implementation, fixture regressions, independent review, matching61-frame comparison and after-only saved AI states. Historical source findings above remain the pre-change audit; missing baseline AI preview/result and real zoom/live integrations remain explicitly limited.
