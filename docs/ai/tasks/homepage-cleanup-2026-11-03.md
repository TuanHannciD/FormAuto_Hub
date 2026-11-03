# Homepage cleanup — local follow-up, 2026-11-03

## Authorization and scope

After FAH-UI-003 closed locally at `d42eff5`, the user requested a more compact homepage under the same rules and approved the concrete in-chat design with “Approved”. Bounded follow-up: existing homepage only; root implements inline, one independent read-only Sol reviewer. This record does not reopen or alter the historical authenticated-page closeout.

Workspace: `C:/Users/Tuan/.t3/worktrees/FormAuto_Hub/ui-fah-ui-003`, branch `ui/fah-ui-003`, clean base `d42eff5eff288c936d2f9c8a5e49799830305598`. Main and unrelated normalize-topup worktree were preserved. No dependency installation, backend/API/DB/provider changes, commit, merge, push or deployment in this follow-up.

## Implemented

- Smaller hero heading, spacing and illustration; remove floating duplicate claims and introductory badge.
- Consolidate duplicate benefit strip and instructions into three short ordered steps; preserve existing anchors.
- Two concise service descriptions instead of three tall promotional cards. Free credits remain in pricing and registration CTA.
- Compact pricing cards retain all prices, credit conversion, quantities, entry links and non-subscription explanation.
- Native FAQ retains keyboard interaction. All homepage preview claims now distinguish direct rules “Tạo và gửi ngay” from AI preview and explicit confirmation. No submission behavior changed.
- Keep brand tokens, heading hierarchy, CTA targets at least44px, metadata and JSON-LD. No global CSS change.

Files: `apps/web/app/page.tsx`, `apps/web/tests/homepage-cleanup.spec.ts`, this paired record and task artifacts.

## Validation

| Status | Evidence |
| --- | --- |
| Verified | Before screenshots at320/390/768/1024/1440 captured before product edits; `before-geometry.json` |
| Failed — intentional RED | `baseline-red.log`: existing page lacks direct-rules FAQ wording;1capture test passed/1copy test failed. Initial logging command could not create missing directory and ran no test; corrected before baseline |
| Verified | `regression.log`:5/5 new/existing homepage cases passed |
| Verified | Build exit0, lint exit0 (`build.log`, `lint.log`); two pre-existing account hook warnings; auth9/9 (`auth.log`) |
| Verified | After final build, runner-owned Next restarted; `runtime-final.log`:6/6 homepage/shared-elevation cases passed; `verified/` captures same final source |
| Verified | HTTP200, browser hydration/chunks, no page errors/chunk HTTP≥400, no horizontal overflow at five widths; keyboard menu/FAQ, visible prices, CTA reachability and44px minimum |
| Verified | Metadata block byte-equivalent after text decoding, canonical and JSON-LD checks; no change to SEO helpers or metadata |
| Verified | Root inspected representative mobile/desktop images; detector `[]`, whitespace and paired document/link/encoding checks |
| Verified | Independent read-only `gpt-6.1-sol/high` source/representative-image review: no P1/P2 or significant new P3. Reviewer did not run tests/server |
| Not run | Live API/DB/Google/AI/PayOS, real login, physical device, browser-chrome zoom or screen reader; unnecessary live effects for this public display-only change |

Source SHA256: `e0d9219b73d1c05baa7599849bb4368d9f47ca74c003686009872b5a62749014`. Review task: `homepage-cleanup-review-20261103-r1`, catalog-confirmed provider `codex_cx_via_9router`, actual model `gpt-6.1-sol`, reasoning `high`, no nested agents. No source edits after review.

At390px, document height6014→3194px, pricing top3295→1403px; at1440px3332→1978px. These measure document geometry with closed FAQ, not user speed. Illustration is labeled illustrative; Next dev indicator in captures is not a production control.

## Evidence and handoff

[Portable comparison report](../../../artifacts/reports/homepage-cleanup-2026-11-03/before-after-report.html), [independent review](../../../artifacts/reports/homepage-cleanup-2026-11-03/independent-review.md). Artifacts include raw logs, before/after/verified images, diagnostics and SHA256 manifest. HTML preview verified without console errors before inline publication.

Runtime origin: runner-owned `http://localhost:3000`; public page, APIs aborted by new fixture test, no DB/provider. Shared elevation regression uses existing synthetic User/Admin context. Checked ports before runner acquisition and after release. No detached helper was run; prior rejected startup/cleanup actions were not retried. Ignored caches and T3-owned checkout remain intact.

Outcome: **Implemented and verified locally; homepage follow-up remains uncommitted in feature checkout**. Next: inspect comparison and integrate locally when included in the user's next integration action. Main remains the previously closed `d42eff5` snapshot; no release claim.
