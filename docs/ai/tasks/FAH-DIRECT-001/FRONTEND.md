# FAH-DIRECT-001 frontend implementation report

Date: 2026-11-01
Owner: frontend implementer
Status: F1-F4 repair locally verified and frozen; runtime and fresh independent review remain owned by the root task

## Summary

- Rules mode now has one `Tạo và gửi ngay` action and no preview accordion, confirmation checkbox, or call to the common preview submission route.
- The direct request uses `POST /api/projects/{projectId}/submissions/send-rules-direct` with exactly `{ commandId, count }`.
- The command snapshot stores `projectId`, `commandId`, `count`, `userId`, and creation time before the direct POST. It is restored only for the same signed-in user.
- Network or invalid-response uncertainty retains the same command and offers `Kiểm tra kết quả gửi`; that action does not save rules again and does not create a new command ID.
- Terminal HTTP results clear the pending command. Credit refresh is a separate read and cannot replay or erase the confirmed submission result.
- Partial jobs compare `SubmissionJob.total` with the original requested count and display the actual sent subset plus the missing count.
- AI Option 2 and Option 3 retain the existing generated-preview read, checkbox confirmation, and common `/submissions/send` request with `confirmed: true`.
- Review repair F1: a `Failed` job containing the approved uncertain-result marker retains the command and blocks every new direct action; repeated checks use the same command.
- Review repair F2 (current round 2 behavior): HTTP status alone never releases the command. POST 400/409 triggers the owner/session-safe persisted-job probe described below; other unresolved errors retain the command.
- Review repair F3: command storage is scoped per user, synchronized across tabs, serialized with Web Locks, and cleared only when the stored command ID still matches. Browsers without Web Locks fail closed before rule writes.
- Review repair F4: `total` is labeled as generated/admitted for processing; successful and failed provider submissions use `successCount` and `failedCount` separately.
- Review repair F2 round 2: a POST 400/409 is reconciled by reading `GET /api/projects/{projectId}/submissions/jobs/{commandId}` under the original user session. A matching valid 200 applies the existing job; a same-session 404 releases the command; failed, malformed, mismatched, or session-changed probes retain it fail-closed.

## Files changed

- `apps/web/app/dashboard/forms/page.tsx`
- `apps/web/app/dashboard/forms/_types.ts`
- `apps/web/app/dashboard/forms/_constants.ts`
- `apps/web/app/dashboard/forms/_helpers.ts`
- `apps/web/app/dashboard/forms/_components/WorkflowSummary.tsx`
- `apps/web/tests/direct-rule-submission.spec.ts`
- `apps/web/tests/form-automation.spec.ts`
- `apps/web/tests/fah-err-forms-errors.spec.ts`
- `docs/ai/tasks/FAH-DIRECT-001/FRONTEND.md`
- `docs/vi/tasks/FAH-DIRECT-001/FRONTEND.md`

## Scope alignment

- Changed only the existing forms frontend, affected frontend tests, and this paired report.
- No backend, task index, dependency, design-token, Git, deployment, Google, payment, or paid-AI action was performed.
- Existing rule-preview generation code is no longer reachable from Rules mode. Legacy Rules preview recovery is cleared instead of replaying that mutation; AI recovery remains unchanged.

## Validation performed

- Verified TDD RED: the initial direct-rule suite had 3 expected failures because the old UI still exposed Rules preview/confirmation; both AI regression cases already passed.
- Verified TDD RED for F1-F4/no-lock: six focused failures reproduced the unsafe terminal/5xx/storage/copy branches, and the no-Web-Locks test failed before the fail-closed guard was added.
- Verified: `npx playwright test tests/direct-rule-submission.spec.ts tests/form-automation.spec.ts tests/fah-err-forms-errors.spec.ts --project=chromium --workers=1` — 30/30 passed.
- Verified: `npm run lint` — exit 0; two pre-existing `react-hooks/exhaustive-deps` warnings remain in account components outside scope.
- Verified: `npm run build` — color-token check, TypeScript validation, production compilation, and 33-page static generation passed; the same two outside-scope warnings were reported.
- Verified: Impeccable detector on the changed forms UI returned `[]`.
- Verified: frozen eight-file frontend SHA256 values were captured and sent to the root/runtime owners; `page.tsx` is `6F10FE8780478A6F9A2EB20BBD01253F42936078E3932EE7C28C5F57AF7E7C12`.
- Verified F2 round 2 RED/GREEN: post-admission 400→GET 200, pre-admission 400→GET 404, failed reconciliation, mismatched job identity, and changed-session cases were added; `npx playwright test tests/direct-rule-submission.spec.ts --project=chromium --workers=1` passed 17/17.
- Verified F2 round 2: `npm run lint` exited 0 with the same two outside-scope warnings; `npm run build` passed color tokens, TypeScript, compilation, and 33-page generation; detector returned `[]`.
- F2 round 2 frozen hashes: `page.tsx` `51AF7F64AE72AA5000CB51461D7D8308A682C577A983666A1282A7834B0127E0`; `_helpers.ts` `C0CF496065859B5283E89C349062BDBB4B7AFFF98419BA2E1D5FF72F8BB10B64`; direct spec `D41A2D599B391F7895743C13D269967FDEE6DD70B38361A583C803BC519E2A9A`. The other five frontend review hashes are unchanged from the prior freeze.

## Validation not performed

- Not run: real backend/browser integration, authenticated local runtime, real Google submission, payment, or paid AI. These are outside this frontend writer's runtime ownership and are delegated by the root task.
- Not run: full repository Playwright suite; focused affected suites were run as requested.
- Not run: independent review; self-review is not independent review.

## Risks and deferred items

- Normal recovery replays the direct endpoint with the same command, which reads an accepted reservation without rerunning it. Reconciliation after POST 400/409 uses the existing GET job route because the accepted command ID is the job ID.
- A server-side active/non-terminal job keeps the command locked and requires checking the same command again; the UI does not offer pause/cancel or a new direct action while unresolved.
- Web Locks is required for cross-tab direct-command creation safety. Unsupported browsers receive a visible fail-closed state and cannot save rules or create a direct command.
- Existing unrelated lint warnings and the stale Browserslist data notice remain unchanged.

## Next recommended step

Run the root-owned authenticated browser smoke against the frozen frontend and current backend, then complete independent review before any integration or release decision.
