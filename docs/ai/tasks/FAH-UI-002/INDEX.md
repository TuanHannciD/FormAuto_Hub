# FAH-UI-002 — compact UI refinement implementation plan

> For agentic workers: use `subagent-driven-development`; use `dispatching-parallel-agents` only for disjoint ownership. Coordinator does not implement product code. Checklist states describe actual execution.

**Status:** First refinement implemented and independently reviewed locally; user visual acceptance reopened. Latest scope is homepage only; dashboard/admin/auth are acceptable. Provider-success remains Blocked; no release. [PROGRESS](PROGRESS.md).
**Date:** 2026-10-28.
**Goal:** Make the existing UI compact, restrained and consistent, with purposeful feedback and independently verified usability.
**Architecture:** Refine the existing shared primitives/shell first, then their page consumers. Preserve component APIs, routing, business workflows and the current stack.
**Tech stack:** Next.js 15 / React 19 / Tailwind / existing shared UI and lucide-react; .NET 9 API unchanged.
**Spec/brief:** User requests and the design brief below, grounded in the [visual audit](../../../../artifacts/reports/ui-audit-2026-10-28/visual-audit/report.html) and [manifest](../../../../artifacts/reports/ui-audit-2026-10-28/visual-audit/manifest.json).
**Method already selected:** Root coordinates multiple implementers and independent reviewers; serial dependencies, parallel disjoint page work.

## Authority and snapshot

- The user approved this reviewed plan and multi-agent execution on 2026-10-28. Their next instruction requires committing/syncing documentation and checking worktree cleanup before implementation; do not ask for plan approval again.
- Baseline HEAD at audit: `8a4f18e`; existing dirty docs/skills and all evidence must survive. This is not a pristine committed snapshot.
- Source authority: [frontend guide](../../FRONTEND_STYLE_GUIDE.md), [source rules](../../SOURCE_STRUCTURE_AND_NAMING_RULES.md), [execution](../../agent/EXECUTION_RULES.md), [quality](../../agent/QUALITY_GATES.md), [tooling](../../agent/TOOLING.md).
- Scope: existing public/auth/dashboard/admin UI and reachable dialogs/states. All 29 route templates have an explicit coverage row; callback branches are states, not separate completed integrations.
- No API/DTO/status/ledger/permission changes, new product features, SEO claims/metadata changes, provider calls/cost, migrations, Google linking/import or submissions.
- No dependency installation, global hooks, automatic package updates, merge/deploy or unrelated cleanup. Exception explicitly authorized on 2026-10-28: pre-implementation documentation/skills/evidence commits and remote sync on a documentation branch; main push would trigger production deployment and is excluded.
- Allowed documents: this AI/VI dossier; paired frontend guide or UI follow-up record only where an approved implementation changes their UI commitments. Do not rewrite unrelated history.

## Design brief and choices

This is refinement of existing surfaces, not a new visual identity or subsystem. User/admin pages prioritize operating tasks; public articles prioritize reading; the homepage retains its marketing role. Keep violet/navy identity, semantic palette, current fonts, factual Vietnamese copy, navigation and action meaning.

Recommended approach: establish compact shared geometry, validate representative pages, then fix remaining local excess. Only fixing individual pages would leave shared inconsistency; replacing the visual identity would exceed the requested correction.

**Proposed targets — become acceptance targets upon plan approval, not observations of the current UI:**

- Dashboard/admin shared desktop topbar: 56–64 px instead of 76; content top spacing 20–24 px instead of 42. Operating-page h1 only: 24–28 px desktop and 22–24 px mobile; public/auth/article headings follow their separate form/CTA/readability criteria. Keep readable body text; do not achieve density by globally shrinking the browser or font.
- Mobile summaries: compact grids/lists; a combined height of at most 180 px for the three usage/credit-history metrics is a recommendation, not a blocking gate. Mandatory: on the captured 390×844 baseline datasets, show the first record or explicit empty state within the first viewport after compact filters; record exact element geometry.
- Top-up mandatory gate: at 390×844 with the same five local packages, the selected package, amount and payment-action button must be fully visible in the initial viewport, without traversing all package cards. Selecting another package must update the visible summary; prove via geometry and an isolated request-contract test without real payment. Preserve package choice, cost visibility and deliberate payment confirmation.
- Auth: at 1366×768, complete primary form and primary action visible without page scroll with normal content. Mobile prioritizes the form; registration action fully visible at 390×844 in its ordinary initial state. Smaller/error/keyboard-open states may scroll naturally.
- Homepage: scale heading/hero so primary CTA is fully visible at 1366×768. Fix the verified `shadow-overlay` size/color naming collision; existing overlay color consumers remain correct.
- Restrained borders/shadows: reduce elevation layers, especially shell and landing decoration; keep hierarchy and visible focus. Do not silently remove useful information.
- Motion: short feedback for hover/press/loading, tabs and dialogs where useful; preserve existing resize-first popup semantics. No decorative motion added to dashboard, no content clipping during interrupted transitions; honor reduced-motion.
- Mobile primary actions keep at least 44×44 px touch targets. Desktop controls may be compact with clear focus/labels. Body contrast at least 4.5:1; no hidden or unreachable controls.
- No unintended document horizontal scroll or clipped meaningful content at 320, 390, 768, 1024, 1366 and 1920 px. Wide tables may scroll within labeled/clear containers; overlays may intentionally cover background while open.

## Review focus

1. Long Vietnamese labels, names and large numeric balances: wrap/truncate only with accessible meaning; no lost actions.
2. Empty/loading/error/dense data: geometry remains coherent; metrics never displace the actual task indefinitely.
3. Narrow widths, keyboard/focus and modal scrolling: controls remain reachable; no sticky header/footer hides focused content.
4. Rapid open/close/tab changes and reduced-motion: no overlap, stale panels, focus loss or resize clipping.
5. Payment/credit/form flows: visible cost, roles, preview and confirmation preserved; visual edits must not change requests.

## Agent roles, ownership and concurrency

Maximum current native capacity: root plus 3 active children. Hard user ceiling effective immediately: Sol models only, at most `gpt-6.1-sol` with reasoning `high`; Astra is forbidden without exception. Recheck the live catalog and explicitly set allowed model/effort for every dispatch, including final review, fallback and nested children; upstream escalation rules cannot exceed this cap. Read-only reviewers are fresh agents, never the author. One agent can finish a turn while its owned app processes remain running.

| Owner | Exclusive writable production zone | Tests/evidence |
| --- | --- | --- |
| Runtime operator | No product code; start/restart/stop owned processes only | Runtime logs, PID/port identity and health |
| A — foundation | `apps/web/components/{shell-layout,ui,ui-styles,metric-card,base-table,pagination-controls,dialog}.tsx/.ts` as actually named; `app/globals.css`, `tailwind.config.ts`; motion components only if evidence requires | `shared-ui.spec.ts`, `account-navigation.spec.ts`; proposed `ui-refinement.spec.ts` |
| B — user workflows | `apps/web/app/dashboard/**`, excluding dashboard layout held by A; includes NCKH callback; page-local existing dependencies only | `topup-ui.spec.ts`, `form-automation.spec.ts`, `nckh.spec.ts` |
| C — admin | `apps/web/app/admin/**`, excluding shared shell; page-local dependencies | `admin-ui.spec.ts`, `manual-credit-ui.spec.ts` |
| D — public/auth/payment results | `app/page.tsx`, `app/login/**`, `app/register/**`, `app/auth/**`, `app/google-forms/**`, `app/anti-abuse/**`, `app/payment/**` including layout and both PayOS result pages; `components/auth-shell.tsx`, `seo-keyword-page.tsx`, existing landing components | Relevant existing auth/SEO checks; proposed `public-ui-refinement.spec.ts` |
| Code/behavior reviewer | Read-only stable scoped snapshot | Findings with severity, path, reproduction and evidence |
| Visual/UX reviewer | Read-only stable scoped snapshot + real screenshots/browser | Before/after comparison, route/state findings, acceptance verdict |
| Root coordinator | Dossier, scope/ownership ledger and evidence manifests | Assignments, arbitration, integrated gates, final user handoff |

- Actual filenames must be resolved in an exclusive file/test ownership manifest before assignment; extension shorthand above is not permission to create parallel variants. Any additional shared dependency needs root assignment before editing. A owns `dashboard/layout.tsx`, `admin/layout.tsx`, dashboard/admin shell consumers and shared account components if they need edits; B owns `dashboard/nckh/callback/page.tsx`. A also owns `dialog.spec.ts`/`dialog-fixture.tsx` and motion specs/fixtures if applicable.
- For task 1 only, A temporarily owns only the shadow token/class consumer edits in `app/page.tsx` required to remove the naming collision. Once verified/reviewed, root records the handoff of that file to D for task 2; never concurrent writers or a page-specific CSS workaround to hide the collision.
- Work in the current checkout with exclusive file locks after preserving baseline; fresh worktrees at HEAD would omit uncommitted skills/rules. Do not create commits just to populate worktrees.
- A finishes and passes task review before B/C/D rely on its shared styles. During B/C/D execution shared files are frozen; shared fixes return to A through root, applied serially, then affected consumers are rechecked.
- Root may run B+C+D concurrently when runtime operator is idle; alternatively B+C plus a reviewer of a frozen completed group. No four active children.
- Each reviewer receives scope, original brief, baseline-to-task diff, exact file hashes, screenshots, checks, earlier findings/responses and unresolved objections. No live edits to the reviewed scope until verdict. Other disjoint scopes can continue.
- Browser agents use separate tabs and pass tabId every time; runtime/build/test ownership is exclusive. No concurrent Next build/dev/test servers writing the same `.next`.
- Every round uses a new delegated review task; record IDs and snapshot. With T3 delegation use a distinct clientRequestId per round and task_status/task_cancel, not messages to its backing child thread.

## Execution tasks and gates

### 0. Preserve and close audit gaps — root + runtime operator

- [x] Revalidate app ownership from `artifacts/reports/ui-audit-2026-10-28/runtime-ownership.json`; health-check actual web/API/DB target without migration or seed changes.
- [x] Capture task-start git status and relevant original source bytes/hashes under `artifacts/reports/ui-refinement-2026-10-28/baseline/`; later diffs compare task-start bytes, not unrelated HEAD changes.
- [x] Create 29-route coverage matrix: role, viewport, state/data, baseline artifact, finding, owner, after artifact and Verified/Failed/Not run/Blocked.
- [x] Confirm real User/Admin sessions and authorized existing NCKH form data. Reproduce long data, empty/loading/error, modal and workflow-step states in isolated API fixtures when needed; label them mock.
- [x] Existing audit limitations remain visible: no imported NCKH form, no separate User audit, provider callbacks only without params. Missing real state cannot become Verified via fixtures; request the missing prerequisite while independent work continues.
- [x] Gate: immutable baseline, safe target and resource ownership recorded; no claim all states were previously inspected.

### 1. Shared foundation — A, serial prerequisite

- [x] Read full affected components, consumers and tests. Use Impeccable refinement references; load craft-floor only immediately before actual UI edits; targeted UI UX Pro Max research supports specific UX questions.
- [x] Reproduce shadow collision with computed style. Add a focused regression in `ui-refinement.spec.ts`: the targeted landing shadow uses intended translucent alpha and overlay backdrops retain intended color. Fail before fix, then verify pass.
- [x] Apply compact shell/header/metric/table defaults with unchanged exported prop contracts. Retain existing modal resize behavior; modify motion code only for a reproduced defect.
- [x] Add meaningful geometry/reachability regression cases for 390×844 history fold, 320 px overflow and keyboard popup access; avoid snapshotting every CSS class.
- [ ] Capture representative dashboard, history, top-up, admin and popup before/after at laptop/mobile with identical content.
- [x] Run relevant shared/account tests; obtain fresh code/behavior and visual review. Gate: no open blocking findings, coherent shared scale, root records the approved internal baseline for page workers.

### 2. Page consumers — B/C/D, parallel only after task 1

- [x] B: refine overview, form steps/summary, top-up, histories and AI usage; inspect NCKH workspace when data is available. Preserve preview/confirmation and request payloads; do not analyze/submit external forms merely for screenshots.
- [x] C: compact metrics, filters, tables, alerts and settings hierarchy across all eight admin pages; preserve full safety information and deliberate credit/payment actions.
- [x] D: refine homepage hero/shadows, auth form priority and article spacing; preserve metadata/schema, URLs, factual content and public marketing identity.
- [x] Each worker demonstrates its acceptance targets and runs only relevant tests, then freezes its scope for independent review. Test owners do not modify another group's files.
- [ ] Gate: each group has matching before/after evidence and no open visual/behavior blockers. A shared regression reopens task 1 and rechecks affected groups.

### 3. Whole-app runtime and visual pass — root + runtime operator + independent reviewers

- [x] Stop owned dev before `npm run build` or Playwright using the same checkout; retain logs. From `apps/web`: `npm run lint`, `npm run build` (includes check:colors), `npm run test:auth`.
- [x] Run affected regression specs: shared-ui, account-navigation, topup-ui, admin-ui, manual-credit-ui, form-automation, nckh and the new refinement specs where changed. Inspect fixtures first. Default Playwright uses port 3000; explicitly own that target, do not confuse it with live 3020/API 7039.
- [x] `motion.spec.ts` requires its documented isolated motion fixture; never run blindly against a missing production route. Run if motion changes; otherwise use existing popup/account behavioral checks.
- [x] If `dialog.tsx`, confirmation primitives or related `ui.tsx` exports change, A runs `dialog.spec.ts` with `/dialog-test` from `dialog-fixture.tsx` in an isolated fixture environment: confirmation, focus trap/return, body scroll lock and reopen. Do not add the fixture route to the product. If none change, explicitly record this gate as not applicable with that reason.
- [x] Public/metadata impact: run relevant SEO spec using its explicit config/owned target, without indexing requests or provider mutations.
- [x] Restart owned affected runtime on final code, then live API/browser smoke at web 3020/API 7039 with actual authorized sessions. Check hydration/pageerrors, CSS/JS chunk status 200 and affected server logs; no mock-to-live equivalence claims.
- [x] Complete route coverage at laptop 1366×768 and mobile 390×844. Representative shared/template/layout risks additionally at 320, 768, 1024 and 1920 px; magnification/keyboard and reduced-motion as applicable.
- [x] Verify table internal scrolling, dropdowns, focus return, popup growth/shrink, long labels, dense records and rapid interactions. No payment, credit grant, provider cost or submission needed; those actions use isolated request-contract tests.
- [x] Mechanical Impeccable detector once over changed UI after completion; findings are triaged against project authority, not auto-fixed wholesale.
- [x] Fresh final code/behavior reviewer and visual/UX reviewer inspect the integrated frozen snapshot, not only individual task summaries.

### 4. Fix and re-review until acceptance

- [x] Root maintains findings ledger: ID, severity, route/state, evidence, owner, proposed correction, fixed snapshot, recheck and independent verdict.
- [x] For each round: reviewers batch findings → owner fixes their scope → affected checks and same-size screenshots → fresh independent re-review of the new snapshot.
- [x] Each implementer pass has a focused inspect/fix/confirm batch; remaining findings return to the coordinator-led review cycle. User-requested continued review and project gates override upstream polish-loop ceilings.
- [x] No arbitrary number of rounds turns a failure into pass. After two rounds with the same unresolved cause, root re-diagnoses the cause and ownership instead of accumulating cosmetic edits.
- [x] Disputed aesthetic findings are judged against this brief and before/after evidence. Escalate only a genuinely missing design/scope decision; routine in-scope fixes do not require repeated user permission.
- [ ] Stop only when the measurable targets pass, both independent reviewers report no blocking findings and all required route/state gates are Verified. Unavailable required real states keep the affected scope Blocked and prevent claiming whole-app Done.

### 5. Final evidence and handoff

- [x] Produce searchable before/after gallery, route/state matrix, check log and review ledger under `artifacts/reports/ui-refinement-2026-10-28/`.
- [x] Update paired dossier and affected UI commitments; verify UTF-8, links, AI/VI meaning, task diff and preserved baseline.
- [x] Report Vietnamese summary, changed files, scope alignment, checks performed/not performed, risks/Deferred and exact next action; distinguish implemented/reviewed/local verified from integrated/released.
- [x] Root presents the result for user visual acceptance; any in-scope feedback resumes the same ledger/review process. Retain owned runtime for user inspection unless asked to stop; no release implied.

## Status and next action

- Historical plan-preparation baseline: prior audit artifacts/source/test/tool discovery Verified. Current implementation status and review rounds are maintained in [progress](PROGRESS.md).
- Current: first refinement and final independent reviews completed; user requested further visual refinement. Homepage-only follow-up is proposed; no follow-up UI edits yet. See progress for runtime and acceptance limits.
- Plan review round 1 (`/root/ui_plan_review`): four findings addressed: payment/callback and shared dependency ownership, serial shadow consumer handoff A→D, scoped typography and mandatory versus recommended geometry, conditional isolated dialog regression.
- Independent round 2 (`/root/ui_plan_rereview`): Ready for user plan approval; no remaining blocking findings. AI/VI scope and gates equivalent. Reviewed content hashes before this status-only update: AI `58efad5589be679afbf68ce75ccbaba96872fc97793eeb051debebd8e5612e8c`, VI `fbe3acc65e837a6bcd69ca5f26cd4eacb769fefb49a2920a670562ac0e5eb0ee`.
- Historical plan-preparation checks: both UTF-8 files had 37 execution checkboxes and seven relative links; no product source changes at that stage. Later implementation checks are recorded in progress.
- Pre-implementation Git check: only the main checkout exists; no secondary worktree or stale registration to remove. Two historical UI branch refs are merged into main but have no worktrees; preserve them. Remote main matches the pre-sync HEAD. Skill mirror sync/check: 24 skills, 293 mirrored files, zero drift.
- Publication boundary: raw UI audit screenshots/manifest and unreviewed historical images remain local, excluded through Git local excludes, not deleted. Privacy review found email content in overflow metrics; raw SQL logs already match the repository log ignore. Commit only reviewed text evidence; local artifact links do not imply those raw files are published.
- Historical execution start: clean documentation sync completed at `be3c65b` on `docs/pre-ui-refinement-20261028`; implementation branch `ui/compact-refinement-20261028`. Baseline/runtime/29-route coverage recorded; foundation A dispatched as `gpt-6.1-sol` / `high`. Next: task 1 regression and independent reviews; live User/NCKH/provider-state prerequisites remain Blocked. See [progress](PROGRESS.md).

## Local handoff — 2026-10-29

Current local UI snapshot is implemented and independently reviewed. See progress for final verification, exact test history and evidence limits; provider-success remains Blocked.

Unchecked evidence gates: historical article before frames are transition/layout-only; some admin baseline frames are loading/placeholders and live datasets may differ. Group galleries and labels are accepted with these limits, not certified identical-state pairs. Optional settled baseline startup3002 was automatically rejected (`blocked by policy`); no bypass attempted. The full required-state gate remains Blocked for real provider success. Standalone motion spec not run because motion implementation was unchanged; popup/account checks and isolated dialog4/4 passed. Completed checkboxes refer to documented execution, not release authorization.

## Latest scope and commit checkpoint — 2026-10-29

The latest user correction limits the next visual refinement to the homepage; other pages are acceptable. Broad density proposals are assessment history, not an implementation mandate. Homepage changes remain proposed, not implemented. The user authorized documentation sync and a local commit of current UI work; push/merge/deploy are not authorized. Current web3020 was restored on the existing build; API restoration is Blocked by a DB/source migration mismatch. Earlier API health is historical, not current. Raw images/logs/baseline remain local. See [progress](PROGRESS.md) for exact validation and limitations.
