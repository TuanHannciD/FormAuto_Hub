# UI_CREDIT_FOLLOWUP_SYNC

## Scope and status

Date: 2026-10-08. User-approved implementation/fix follow-up on `ui/shared-ui-foundation`; no new global phase selected. This record describes the completed local UI/auth/manual-credit work and documentation sync. It does not claim deployment, live Google integration or a real PayOS payment.

## Implemented source

| Area | Source | Result |
|---|---|---|
| Shared presentation | `apps/web/components/ui-styles.ts`, `ui.tsx`, `metric-card.tsx`, `base-table.tsx`, `dropdown-select.tsx` | Central panel/control/button defaults and reusable metrics, tables, selects, alerts and rows |
| App shell and brand | `apps/web/components/shell-layout.tsx`, `dashboard-shell.tsx`, `admin-shell.tsx` | One shell for dashboard/admin; rounded topbar/sidebar; prominent brand outside scrolling navigation |
| Account | `apps/web/components/account-menu.tsx`, `account-dialog.tsx`, `account-profile-panel.tsx`, `account-security-panel.tsx` | Topbar entry; profile/security share a popup; former standalone profile routes removed; existing API payloads preserved |
| Motion and confirmation | `apps/web/components/dialog.tsx`, `confirm-dialog.tsx`, `motion/transition-region.tsx`, `motion/use-popup-motion.ts`, `motion/motion-presets.ts`, `motion/use-element-size.ts` | Resize before content replacement; popup grow/reveal and hide/shrink; shared focus, Escape, outside-click, interrupted/reduced motion handling |
| Workflow UI | `apps/web/app/dashboard/forms/page.tsx` and its `_components/` | Shared surfaces, controls, mode panels and preview; existing sticky anchors, response limit and preview/confirmation preserved |
| NCKH frontend | `apps/web/lib/nckh-google-auth.ts`, `apps/web/lib/api.ts`, NCKH pages/tests | Exact recognized Google authorization failures do not expire the core JWT session; generic failures have retry; remaining workspace styling aligned |
| User top-up | `apps/web/app/dashboard/top-up/page.tsx`, `[id]/page.tsx`, `_components/topup-order-detail.tsx` | Package/payment layout, shared detail popup and 10-row client history pagination; API still returns all user orders |
| Admin credit | `apps/web/app/admin/manual-credits/page.tsx`, `_components/manual-grant-history.tsx` | User search, direct grant, manual-order approve/reject, evidence preview and searchable paged grant history |
| Payment/history/AI | PayOS result route, user histories, dashboard/admin AI pages | Shared button/row/alert/metric styles; no new payment behavior |
| Review artifact | `prototypes/motion-review.html` | Standalone historical review demo; not loaded by production app and not the authoritative shared motion implementation |

Repository UI primitives are React/Tailwind components following shadcn/ui-style patterns. They are not a claim that Radix or a generated shadcn package is installed. Public landing/SEO layouts and intentional topbar blur remain distinct from dashboard workflow panels. Unused `glass-panel`/`glass-sidebar` CSS was removed.

## Credit and persistence contracts

- Controller/service/DTO boundaries remain explicit: `AdminCreditOperationsController`, `AdminCreditOperationsService`, `Contracts/ManualCreditDtos.cs`; credit mutations go through `CreditService` and `CreditWriteTransaction`.
- Admin direct grants require a positive integer amount, recipient and nonblank reason (max 1000 characters). They write `ManualGrant` ledger and admin audit atomically; accepted requests are distinct grants. The browser does not automatically replay writes.
- Approve/reject are admin-only and accept only pending manual orders. PayOS credit belongs to verified payment handling. Stale/repeated processing returns conflict; row versions protect orders and credit accounts.
- Evidence is private PNG/JPEG/WebP content, max 5 MB; upload owner checks, attachment ownership and owner/admin reads remain enforced. Admin headers cannot substitute JWT roles.
- `TopupEvidence` reuses legacy `TopupOrderEvidenceFiles`; migration `20261007181332_ManualCreditFlow` supports missing storage and adopts legacy storage/links. No history-specific table/migration was added.
- Grant history reads existing `CreditTransactions`/`AuditLogs`, chooses the latest matching actor without duplicating ledger rows and leaves missing legacy actor information absent. API pagination is 1-based, pageSize 1..50, UI 10 rows; search covers recipient/actor and reason.
- User top-up history is 10 rows per client page and keeps the full order set for detecting pending manual requests. It does not provide server-side pagination or reduce API download size.

Exact routes/fields are in `API_CONTRACT_GUIDE.md` and `DOMAIN_ENTITIES_OVERVIEW.md`. NCKH Google-error recognition is in `nckh/NCKH_API_CONTRACT_GUIDE.md`.

## Documentation audit

- Read/scanned all 209 existing `docs/**/*.md` files for pairing, source references, relative links, contract identifiers and stale current-state wording. Current-reference documents were reviewed against source; historical phase/closeout records retain their original approval and evidence context.
- All 73 original AI/VI pairs existed; no broken relative Markdown links or UTF-8 replacement characters were found. This report adds one pair, bringing the paired set to 74.
- Synced shared UI inventory, retired profile routes, motion, top-up versus grant pagination, manual-credit contracts/entities and current implementation status.
- Restored missing Vietnamese payload examples and DbContext/namespace/data-integrity detail for NCKH. Removed the undocumented VI-only `google_reauth_required` claim; corrected the nonexistent `Researcher` role, DTO file path, unimplemented `Archived` state and false claim that model deletion retains responses/datasets.
- Existing NCKH deletion requirements are preserved. The current backend uses cascade deletion of owned responses/datasets; this sync changes documentation only, not deletion code.
- Added/updated TOCs for edited long documents. Different translated section layouts are allowed; matching commitments, routes, technical fields, constraints and validation boundaries are required.

## Validation

Verified on the local checkout:

- Backend: `dotnet test tests/FormAutoHub.Tests --configuration Release --no-restore`: 154 passed, none skipped. Existing NU1603 Google Forms dependency resolution warning remains.
- Auth: `npm run test:auth`: 9 passed.
- Frontend production build, TypeScript and semantic-color check passed; freshly started production verification server on port 3021 was used.
- Full browser suite: 82 passed, one opt-in real-API test skipped in the fixture run. That test was then run separately against an isolated SQL database/API on port 7040 and passed (upload, submit, inspect, approve, direct grant, history refresh and history role checks).
- Real HTTP/SQL harness passed clean migrations, evidence ownership, spoofed/non-admin denial, invalid grant, atomic ledger/audit/balance checks, repeated approval conflict and pending rejection. Temporary test database/API are cleaned up after validation.
- Desktop/mobile screenshots were inspected for form automation, NCKH canvas, top-up/manual details and PayOS result pages; browser overflow/hydration/runtime and sticky-action checks passed. Preview server logs had no errors. Main local app/API stay available on 3020/7039.

Not run in this closeout: production deployment/push, real PayOS payment/webhook delivery, live Google OAuth/Forms calls, live AI provider calls, exhaustive verification of every archived document's historical runtime evidence. Browser fixtures are not proof of external-provider success.

## Remaining gaps and Deferred

- NCKH model-delete confirmation was missing in this sync. A subsequent user-approved implementation closes that gap; see [NCKH_MODEL_DELETE_FOLLOWUP.md](nckh/NCKH_MODEL_DELETE_FOLLOWUP.md) for current behavior and separate validation evidence.
- Client top-up pagination still downloads all orders. Server pagination is a future scoped improvement, not implemented here.
- Evidence retention/cleanup and external object storage, other payment providers, broader AI rollout and background jobs remain Deferred unless separately approved.
- No new global phase, refund policy, Google restriction bypass or submission automation without preview/confirmation is approved.

## Next step

The UI/credit source/tests/prototype and paired documentation were committed locally as `f50f062`. The subsequent NCKH delete follow-up was user-tested and accepted, with final review/local commit/merge into main authorized; see its report. Push/deploy and other remaining gaps require a separate request.
