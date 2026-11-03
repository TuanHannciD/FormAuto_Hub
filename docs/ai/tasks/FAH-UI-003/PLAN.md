# Authenticated UI cleanup implementation plan

> **For agentic workers:** Use `executing-plans` for inline execution, or `subagent-driven-development` if selected by the user. Execute checkbox tasks in order; project permissions override upstream commit/dispatch defaults.

**Goal:** Reduce unnecessary reading/scrolling across all authenticated pages, prioritizing frequent form automation.
**Architecture:** Preserve Next.js/shared React/Tailwind components, tokens and current API/state boundaries. Prove repairs separately from presentation changes; use existing components and callbacks rather than new workflows.
**Tech stack:** Next.js 15 / React 19 / TypeScript / Tailwind / lucide-react; existing Playwright Test and Node auth tests; .NET 9/SQL Server unchanged.
**Spec:** [approved design direction and assessment](AUDIT.md); [authorization/evidence](INDEX.md).

## Authorization and execution

2026-11-02: user “Tôi duyệt kế hoạch này” explicitly approved this plan and inline implementation with bounded independent reviews. Local code, test and paired task-document changes are authorized; no further permission gate for that scope. No install/commit/push/merge/deploy/live provider/DB effects. Root remains sole implementer; reviewers use catalog-confirmed Sol <=gpt-6.1-sol/high. Current acceptance evidence and exceptions: [PROGRESS](PROGRESS.md).

## Global constraints

- Scope: 18 routes in `/dashboard` and `/admin`, shared account/detail surfaces; PayOS return/cancel presentation regression boundary. Exclude public homepage/SEO/login/register redesign.
- Preserve identity/tokens; no global font/control shrinking. Mobile primary actions stay at least 44px. Widths 320/390/430/768/1366/1440; include short screens, zoom and long data.
- Rules: one **Tạo và gửi ngay** action; no preview/checkbox/second confirmation. AI: saved read-only preview and explicit confirmation; keep stale/draft/read-retry protections.
- Generate 1–100 responses per action, sequential batches of 10, existing authorization and credit/usage/submission logs. No new API/DTO/entity/status/provider/DB/policy, no implicit Deferred work.
- Preserve current question/preview disclosure defaults. No new sticky toolbar, polling, ETA, persistent disclosure preference or automatic replay.
- Existing dirty/untracked/ignored assessment/evidence stays intact. Root exclusively writes shared components/tests/docs; only disjoint page groups can be delegated after dependencies settle.
- Before any dispatch inspect live catalog; Sol only, at most `gpt-6.1-sol` / `high`; record exact model/effort/task in ledger. No nested children unless explicitly assigned.
- Runtime startup previously rejected `blocked by policy`; do not retry the same action via wrapper/transport. Resolve through a permitted runtime and record ownership; no required check may be replaced with a disclosure or mockup.

## Review focus

1. Direct→AI after a completed/unknown direct command: summary correct; unknown locks/replay unaffected (T1).
2. Charged AI preview with failed subsequent read: retry only GET; actual cost distinct from estimate (T1/T2).
3. Long question labels/30-question form with short viewport and keyboard: reachable controls without hidden focus (T2).
4. Switching mobile menu/account modal and crossing desktop breakpoint: no stranded focus/body lock or duplicate dialog (T3).
5. Long IDs/amounts and stale payment/NCKH state: compact details retain facts, role guards and safe actions (T4–T7).

## File ownership and interfaces

No new public component/API contract is planned. Keep current props and handlers:

- `WorkflowSummary` consumes `mode`, `requestedCount`, `previewCount`, `multiplier`, `balance`, `creditsUsed`, result counts and `stale`; correct values at caller, not through new billing state.
- `AiModePreparationPanel`, `RuleEditor`, `GenerationModeSelector`, `PreviewAccordion` retain callbacks/controlled values; presentation never invokes generate/send.
- `ShellLayout({children,navigation,subtitle,heading,actions,mobileOpen,onMobileChange})` retains callers. Existing `Dialog`, `DialogContent`, `DialogTitle`, `DialogClose` own focus/dismissal; do not globally restyle dialog motion.
- `BaseTable<T>` and `BaseTableColumn<T>` stay unchanged; use `hideOnMobile` + existing `mobileFooter(item)` for accessible secondary `<details>`. Desktop columns remain complete. Never hide a field without mobile access elsewhere.
- Page-local metric/list/order components reuse `ui.tsx`, `metric-card.tsx`, `status-badge.tsx`, pagination and current DTOs. No common component is added solely to move code between files.

## T0 — execution snapshot and runtime baseline (gate)

Files: task INDEX/PLAN/evidence only; product source untouched. Prerequisite to claiming any measured improvement.

- [x] Re-read approved spec/plan and current task status; record current SHA, branch, all preserved work and chosen execution method. At execution use `using-git-worktrees`; detect existing isolation and honor actual user choice. If a separate checkout is selected, explicitly carry the uncommitted approved docs/snapshot without auto-committing user work.
- [x] Establish a permitted runtime: verify process identities/ports, test User/Admin sessions, synthetic/mock versus real API target and DB identity if applicable. Do not launch the rejected helper again to bypass review. If runtime cannot be obtained, keep T0 Blocked and do not advance runnable implementation to Done.
- [ ] Inspect existing fixture tests before reuse. Capture before data/roles at 390×844 and1440×900 for all18 routes/account; forms initial/rules/AI default/custom/results with1/10/30 questions. Callback/unknown/payment states use fixtures, never provider calls. Capture extra320/430/768 widths for boundary checks.
- [ ] Save screenshot hashes, route/state/dataset manifest, page heights and distance to task action/first record. No blanket reduction percentage; prove less scrolling on identified redundant-content cases without hiding facts or adding unnecessary taps.
## T1 — reproduce and repair forms navigation/count binding (F02/F04)

Modify: `apps/web/app/dashboard/forms/page.tsx`; tests `apps/web/tests/form-automation.spec.ts`, `direct-rule-submission.spec.ts`, `fah-err-forms-errors.spec.ts` as relevant. No service/API/DTO edits.

- [x] Add a failing “rules step navigation targets existing sections” test: after analysis inspect enabled navigation links; `document.querySelector(anchor.hash)` exists. Sending/current status uses existing `isSending/directCommand/submission`; verify AI anchors/confirmation remain correct.
- [x] Add a failing “AI summary uses active request count after direct mode” test: complete fixture direct count2, choose AI, set count3; summary must show3 and the active multiplier's estimate, not old count2. Unknown direct command stays locked; switching must not bypass the lock.
- [x] Run those exact tests to confirm the failures are the findings, not fixture/setup errors; record command/output. If a finding does not reproduce, leave it unimplemented with evidence rather than changing unrelated state.
- [x] Correct only step mapping/existing anchors and mode-specific summary binding. For rules, use existing configuration/action/result sections; in-flight step remains status-only if no meaningful anchor. Preserve command creation/storage/replay and AI snapshot/reset logic.
- [x] Run `npx playwright test tests/form-automation.spec.ts tests/direct-rule-submission.spec.ts tests/fah-err-forms-errors.spec.ts`. Existing locks/two-tab/reload/unknown/AI GET-retry assertions stay intact. Independent safety review before this task is accepted.

## T2 — forms hierarchy, copy, labels and action context (F01/F03/F05)

Modify: forms `page.tsx`; `_components/{GenerationModeSelector,RuleEditor,AiModePreparationPanel,AiQuestionBlock,PreviewAccordion,WorkflowSummary}.tsx`; `_constants.ts` for display copy only. Tests: `form-automation.spec.ts`, `fah-err-forms-errors.spec.ts`; optional new `tests/ui-cleanup.spec.ts` for shared geometry/coverage assertions only.

- [x] Pin meaningful assertions: quantity inputs discoverable by label; estimated versus actual credit distinct for AI Partial; cost/balance in the same action region; long preview question text available; existing confirmation still required. New tests must fail for the problem they protect; no tests mirroring CSS class strings.
- [x] Consolidate analyzed-form metadata into a compact summary with accessible optional details. Reduce repeated card/border layers in question editors and mode banners; retain all choices/validation, current disclosure defaults and current data state. Keep a desktop summary column; remove repeated general descriptions.
- [x] Label quantity inputs with real `<label>`/IDs and described limits/costs. Place available balance and estimate next to existing action controls. Unknown balance remains unknown, never0. Use “Hướng dẫn chung”, “Điền gợi ý hướng dẫn”, “Lưu và tạo bản xem trước AI”, “Chi phí dự kiến”; actual credit comes from confirmed result. Keep “Tạo và gửi ngay” unchanged.
- [x] Make preview labels readable and scroll region named/focusable where scrolling remains. Put one read-only explanation near the decision; preserve every saved answer, stale warning, charge/read recovery, preview selection/confirmation and result/log action.
- [x] Retain sticky behavior unless measured clipping requires a minimal geometry adjustment; do not add a second sticky band. Check1/10/30 questions,320/390/430 widths, short viewport, keyboard focus and modal/menu stacking. Maintain primary44px touch areas and current text legibility.
- [x] Run T1 suite plus `npx playwright test tests/dashboard-ui-refinement.spec.ts tests/shared-ui.spec.ts`; inspect paired before/after desktop/mobile screenshots and error states. Record measured difference without claiming unobserved user-study results.

## T3 — shared mobile navigation and compact record pattern (F06/F09)

Modify: `components/{shell-layout,dashboard-shell,admin-shell}.tsx`; add compact page-local details through current `BaseTable` props in later tasks. `ui.tsx`, `ui-styles.ts`, `base-table.tsx` read-only unless a demonstrated missing shared capability is documented and reviewed. Tests: `shared-ui.spec.ts`, `account-navigation.spec.ts`, `ui-refinement.spec.ts`, `auth-session.spec.ts`.

- [x] Reproduce keyboard gaps. Add “mobile menu returns focus and clears modal state at breakpoint”: open via keyboard, cycle Tab/Shift+Tab within navigation, Escape returns to trigger, reopen and resize desktop; background usable and body scroll restored. Account popup and long menu remain reachable.
- [x] Reuse existing Dialog behavior for mobile navigation with an accessible title and trigger `aria-expanded`/`aria-controls`; retain desktop sidebar and visual identity. Close on navigation and desktop breakpoint without stale locks. Do not alter auth/session logic.
- [x] Remove inactive admin notification/help affordances and disabled global search from main workflow; do not build replacements. Keep working account and navigation actions.
- [x] Define a consistent page-local record composition using existing `hideOnMobile`/`mobileFooter`: primary identification/value/status/time remain readable; secondary fields in labeled details; all actions and facts stay accessible. No new fetch or DTO field.
- [x] Run the named four specs and forms drawer/sticky regression; baseline-dependent fixture hosts must be explicitly started under ownership, not silently assumed. Independently review focus/auth-adjacent changes and any shared-consumer diff.

## T4 — top-up, detail and account surfaces

Modify: `app/dashboard/top-up/page.tsx`, `[id]/page.tsx`, `_components/topup-order-detail.tsx`; `components/{account-dialog,account-profile-panel,account-security-panel}.tsx`. Tests: `topup-ui.spec.ts`, `manual-credit-ui.spec.ts`, `account-navigation.spec.ts`, `auth-session.spec.ts`, `fah-err-account-payments-errors.spec.ts`.

- [x] Keep selected package/price/credit/action in first390×844 viewport with five packages; regroup ancillary payment explanations/history. Use shared compact record pattern; retain pending guards, evidence and payment note.
- [x] Compact shared detail/account grouping without changing route/modal behavior, secret/password handling, Google linking or callbacks. Keep actionable errors and safe read retries visible, long identity/reference data accessible.
- [x] Verify no query-derived status is presented as settled credit; no automatic payment retry. Run named specs with mutations intercepted and retain existing payload assertions; focused browser/API smoke required if an actual write path changes.

## T5 — admin operations and provider settings

Modify: `app/admin/{manual-credits,packages,payos-settings,ai-provider-settings}/page.tsx`, `manual-credits/_components/manual-grant-history.tsx`. Tests: `admin-ui.spec.ts`, `admin-ui-refinement.spec.ts`, `manual-credit-ui.spec.ts`, `fah-err-account-payments-errors.spec.ts`.

- [x] Keep recipient/email, amount/credit, reason, evidence and review decision explicit for direct grants/manual orders. Compact list/details around those facts; no collapsed approval-critical evidence by default.
- [x] Separate PayOS blank-secret preservation warning from expandable URL/setup documentation. Group saved/connection state with relevant controls. AI verified-read guards, model/key semantics, load errors and save confirmation remain unchanged.
- [x] Normalize labels/help Vietnamese, compact package editor/list and settings history. Never expose secrets, invent an exception category, or change payload, roles, validation or side effects.
- [x] Run named specs; verify long names/amounts/models/URLs, loading503, stale orders and approve/reject payloads. Mock fixture evidence is not live credit/provider verification; independent review for any payment/auth write impact.

## T6 — NCKH list, callback and workspace

Modify: `app/dashboard/nckh/page.tsx`, `callback/page.tsx`, `forms/[formId]/page.tsx`, its `_components/{overview-panel,dataset-preview,loading-state,delete-model-dialog}.tsx` only as needed. Tests: `nckh.spec.ts`, `nckh-delete-model.spec.ts`, `fah-err-nckh-errors.spec.ts`.

- [x] Add persistent visible/accessible labels to model/variable/mapping inputs; keep type/required/ranges and controlled draft bindings. Capture long labels and already-filled fields so placeholder disappearance is covered.
- [x] Reduce general explanations and panel nesting, prioritize active task/tab. Preserve canvas navigation/positions, mappings, deletion impact/name confirmation, export and ownership/Google-specific errors. Change fixed canvas height only if measured viewport evidence supports it; no new canvas library or touch interaction.
- [x] Run named specs; test disconnected/loading/error/empty/model/error-retry states and dataset/export layouts at mobile/desktop. No live OAuth/Forms calls or data deletion to obtain visual proof.

## T7 — overviews, histories, AI and revenue (complete route coverage)

Modify: `app/dashboard/page.tsx`, `{usage-logs,credit-transactions,ai-usage}/page.tsx`; `app/admin/page.tsx`, `{payments,revenue,ai-usage}/page.tsx`; PayOS `return/page.tsx` copy only (`cancel/page.tsx` re-export). Tests: `dashboard-ui-refinement.spec.ts`, `admin-ui-refinement.spec.ts`, `admin-ui.spec.ts`, `shared-ui.spec.ts`, `fah-err-account-payments-errors.spec.ts`.

- [x] User overview: replace repeated greeting with page identity, prioritize balance/action, arrange secondary metrics compactly if large values fit. Remove redundant history descriptions/min-height whitespace only with settled-state evidence; no forced one-screen goal.
- [x] Apply record pattern to histories/payments; preserve all fields, default usage filter, ledger signs, date, statuses, page versus total semantics and server/client pagination distinctions. Prefer concise filters over paging implementation prose.
- [x] AI statistics: Vietnamese mode terms, distinguish timestamp/duration and current result counts; safe explicit GET retry where absent. Failed fetch must never look like an empty dataset. No new metrics/query semantics.
- [x] Admin overview/revenue: move generic webhook explanation into help, remove no-op export action and reduce unavailable chart/filter placeholders; remove Deferred-feature promises. Keep currently available totals/statuses and reconciliation access; do not infer a new “needs review” status or implement export/charts.
- [x] Payment return/cancel: only consistent “bản xem trước” wording and clear verification distinction/return navigation. Run named specs and callback/query fixtures; ensure resume context/broadcast behavior unchanged.

## T8 — final verification, independent review and handoff

Files: paired task docs and evidence manifest; any fixes restricted to owners above.

- [x] Run in `apps/web`: `npm run lint`, `npm run build` (includes color check), `npm run test:auth`; rerun relevant named suites after fixes. Run full Playwright suite only after inspecting required fixture hosts and live opt-ins; never silently execute provider/live-DB mutation tests. Record exact test selection and justified exclusions.
- [x] Restart affected owned runtime serving final snapshot, verify origin/session/role and required chunks/hydration. Perform applicable HTTP/browser smoke at actual mock/API/DB evidence level, inspect logs. If required smoke cannot run, leave runnable work Blocked/Not run, not Done.
- [x] Capture final18-route/account state manifest and relevant payment callbacks, compare matching data/viewport frames and geometry against T0. Full state checklist in AUDIT is required for forms; focus/zoom/mobile/long data applies across consumers.
- [x] Run Impeccable mechanical detector once over changed markup; batch desktop/mobile visual inspection, fix findings together and confirm. Review scope/accessibility/copy/contract preservation independently at final immutable snapshot; re-review safety fixes when needed.
- [x] Update AI/VI INDEX/PLAN with checks, review IDs/model/effort, pending risks and exact next action; preserve all evidence. Report files/scope/Verified/Failed/Not run/Blocked honestly. No commit/push/merge/deploy/cleanup without separate authorization.

## Dependencies, checkpoints and self-review

Sequence: T0 → T1 → T2 → T3 → T4/T5 → T6 → T7 → T8. T4/T5 may execute serially inline; concurrent delegation only with settled shared APIs, disjoint writers and actual authorization. Root serializes forms, shared components and shared tests. After each accepted task preserve a reviewable diff/evidence checkpoint; no automatic commits.

Coverage self-review: F01/F03/F05→T2; F02/F04→T1; F06→T3/T7; F07→T3/T7; F08→T6; F09→T3; F10→T4–T7. All18 routes, account/detail and payment boundaries covered. No new production interface or backend requirement; every behavioral repair has a reproduction gate and all five review-focus scenarios have owning checks.

Deferred: changed disclosure defaults/persisted preference, global typography/token replacement, fresh provider capabilities, DB/API changes, missing charts/exports/global search, automatic submission recovery, refunds, billing/pagination redesign and public-page redesign. Actual improvement measurements and runtime readiness remain unresolved until T0 succeeds.

## Acceptance interpretation

Checked T1–T7 tasks mean implementation and applicable fixture regressions/review; unchanged account/callback/canvas units were assessed and intentionally preserved. T0 capture boxes remain partial:61 before frames omit saved AI preview/result; supplementary states are after-only. No before evidence was fabricated. Interface deviations are the two local/shared presentation props recorded in PROGRESS. T8 check status and evidence are recorded there, not inferred from historical planning checks.

## U1–U5 — user-accepted closeout follow-up (2026-11-03)

- [x] U1: two read-only Sol scouts review user histories/account/topup and NCKH/callback/PayOS; preserve adequate surfaces.
- [x] U2: compact populated AI records/modes, page-scoped metric label, stable filter names,44px mobile copy control.
- [x] U3: combine linked NCKH status/import, remove duplicate empty instruction, label popup by task, align mapping submit, disclose existing dataset preview limits.
- [x] U4:179 selected fixture cases including61-frame final capture, populated/settled user/NCKH images, build/lint/auth, fresh independent source/visual review and paired docs.
- [ ] U5: verified backup of original untracked main task dirs; archive retired helpers/invalid experiments; commit task-owned files, local merge and merged-snapshot smoke; clean main and owned generated files. Retain host-bound checkout if no supported workspace exit. No push/deploy.
