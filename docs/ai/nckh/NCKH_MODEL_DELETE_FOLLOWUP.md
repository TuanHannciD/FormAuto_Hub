# NCKH_MODEL_DELETE_FOLLOWUP

## Scope

2026-10-08: user-approved completion of model-delete confirmation and case testing. No new global/NCKH phase, API route, DTO, database field, migration, Google scope or integration. Existing deletion ownership and FK rules are preserved. This follow-up supersedes the confirmation gap recorded in `../UI_CREDIT_FOLLOWUP_SYNC.md`.

User acceptance: the user tested the popup and confirmed it was satisfactory, then authorized final review, documentation sync, local commit and merge into `main`. Push/deployment are not authorized by that request.

## Files and behavior

| File | Purpose |
|---|---|
| `apps/web/app/dashboard/nckh/forms/[formId]/_components/delete-model-dialog.tsx` | Fresh owned impact GETs; six category counts; exact-name entry; final name/generated-form recheck; loading/error/reload; no automatic replay; pending dismissal prevention; shared dialog/motion/styles; fixed header/footer with scrolling body |
| `apps/web/app/dashboard/nckh/forms/[formId]/page.tsx` | Opens model popup, labels delete action, locks other mutations during confirmation, removes only deleted model from UI and preserves another selected model |
| `apps/web/components/dialog.tsx` | Optional `dismissible` defaults true; Escape/backdrop ignored when false during pending deletion; optional `onAfterClose` fires after dismissal or controlled close, releasing the workspace lock; existing popup consumers retain behavior |
| `src/FormAutoHub.Api/Services/Nckh/ResearchModelService.cs` | Split-query loading avoids multiplying collection rows; explicitly removes canvas positions/relations before model in one SaveChanges; generated-form FK protection returns existing Conflict result before mutations |
| `tests/FormAutoHub.Tests/NckhPhase2ModelApiTests.cs` | Adds four service cases: Draft/Active canvas cleanup, foreign/unknown ownership, generated-form protection and repeat deletion |
| `apps/web/tests/nckh-delete-model.spec.ts` | Fifteen browser cases with intercepted API fixtures |
| `apps/web/tests/nckh-delete-live.spec.ts` | Opt-in real SQL/API browser deletion using disposable runtime state |
| `apps/web/tests/nckh.spec.ts` | Updates previous model cancellation regression to the new popup; mapping confirmation remains shared |
| Paired contract guide, progress ledger, UI follow-up record and this report | Current behavior and validation sync in AI/VI |

## User flow

Open delete → load model plus variables/mappings/relations/positions/responses/dataset through existing GETs → show affected counts and permanent-deletion warning → exact name enables deletion → recheck current name/generated-form state → DELETE → close and remove model from UI.

Paginated counts use `totalItems` with pageSize=1, never loaded first-page lengths. Positions use the complete position-list length. Collection logs are explicitly mentioned as deleted; no count is invented because no existing log-list API is available. Original imported form/questions and data on Google are not deleted.

Generated-form references preserve existing Restrict FK behavior: popup explains the block; backend returns 409 using existing error shape. Generated forms are not detached or deleted. Cancel/Escape/backdrop send no DELETE, except they are disabled while a delete is already pending. Failed writes require explicit reload/confirmation; none are automatically repeated.

## Verified

- Release backend suite: 158 passed, zero skipped; includes 12 model service tests. Existing NU1603 Google Forms package-resolution warning remains.
- Fresh production frontend mirror build, TypeScript and color-token compliance passed. Production browser runtime starts on 3021 from updated source; fixture routes exist only in the mirror.
- Targeted browser suite: 59 passed (NCKH, model deletion, shared dialog). New cases cover wrong/blank/case/accent/space names, counts beyond one page, loading, partial failure/reload, invalid counts, cancel/Escape/backdrop/reopen, late loading results, rename/generated-form changes before DELETE, 404/409/500, duplicate clicks and pending dismissal, empty model, 320px/reduced motion, preserving an unrelated selected model.
- Opt-in real API browser test: passed against isolated SQL Server/database and API on 7040, via production UI on 3021. Fresh counts matched persisted variables/mapping/relation/positions/response/dataset; authenticated DELETE returned 204, subsequent GET returned 404 and imported form remained 200. No page errors.
- HTTP/SQL harness: clean migrations; anonymous 401, foreign/unknown 404, generated-form 409, populated model 204, repeated delete 404, empty Active 204. Queries verify all seven dependent categories removed and unrelated owner/models/imported/generated forms preserved.
- A deliberately enabled trigger in the disposable DB forces SQL Server's OUTPUT/trigger failure (HTTP 500). Model, variables, mappings, relations, positions, responses, datasets and logs remain after rollback; removing the test trigger allows successful deletion. This is injected test failure, not a production trigger/schema change.
- Desktop/mobile popup screenshots inspected; mobile footer stays in viewport. Logs inspected: only the deliberately injected SQL exception was expected; preview stderr clean.
- Main local API rebuilt/restarted on 7039: health and authenticated NCKH model list return 200, logs clean. Source UI on 3020 also passed the primary deletion browser fixture case. Temporary SQL/API verification resources are cleaned up; main local app remains available.

## Final review

The final review reproduced a missing post-success cleanup: after controlled popup closure, remaining model actions stayed disabled. `onAfterClose` now releases the pending state after the close animation for both success and dismissal. Fixture and real-API browser assertions verify the remaining model's delete action is enabled after success; no change to the deletion API or database rules.

Final gates after this correction: 158 backend tests, 9 auth tests and production frontend build/TypeScript/color checks passed. Full browser suite: 97 passed, two opt-in integration cases skipped; the NCKH SQL/API browser case was separately run and passed with the new unlock assertion. HTTP/SQL deletion, ownership/FK protection and injected rollback checks passed again. Documentation audit: 213 Markdown files, 75 AI/VI pairs, valid UTF-8 and Markdown targets; source references and edited contract meanings reviewed across four changed pairs. The manual-credit opt-in live test was not rerun in this final NCKH review; its previous validation remains recorded in the UI/credit report.

## Limits and Deferred

- Counts are read-time values from multiple GETs, not a transaction snapshot or server-enforced confirmation token. Exact-name entry is a frontend guard; the existing DELETE has no new request body. A small concurrent-change window remains after the final GET; FK failures roll back rather than partially delete.
- No generated-form unlink/delete workflow is added. No production database/model is deleted for testing.
- Not run: deployment/push, live Google calls, real multi-tab concurrent stress, external-provider workflows. No claim to exhaustive coverage of every possible infrastructure failure.
- Next step: complete the authorized local commit/merge; any push/deployment or future server-side version/confirmation contract requires a separate request/scoped review.
