# FAH-DIRECT-001 — Independent frontend re-review

Date: 2026-11-01. Reviewer: `/root/direct_rules_frontend_review`, `gpt-5.6-sol`, reasoning `high`; independent of the frontend author, no child agents. Base: `297ee2143f7a37ca02739157d75e3db06ab4be17`; current frozen dirty/untracked frontend snapshot, no commit.

## Summary

**Current spec/code-review verdict: Passed; F1–F4 are resolved.** Final independent rereview on 2026-11-02 by `/root/direct_rules_final_review`, `gpt-6.1-sol`, reasoning `high`, verified the F2 round 2 snapshot. No new Critical/Important finding was identified. **Quality verdict: runtime acceptance remains separate and pending root integration of the final owned browser/API/SQL evidence.** This is not a local Done or release claim. The initial F2 finding is preserved below as history.

## Finding status

### F1 — Resolved: uncertain terminal job retains the command

- Verified at `apps/web/app/dashboard/forms/page.tsx:492`: an uncertain-result log prevents terminal command clearing; the command remains locked and is checked through the same ID.
- Covered at `apps/web/tests/direct-rule-submission.spec.ts:202`: the direct action remains disabled, rule writes remain one, repeated checks reuse the original ID, and storage retains it.

### F2 — Important, resolved in round 2: HTTP 400 is not a reliable pre-admission discriminator

- Location: `apps/web/app/dashboard/forms/page.tsx:543`, `sendDirectRuleCommand`.
- Prior reviewed behavior (history): every 400/403/404/409/422 response cleared the command and unlocked a fresh direct action.
- Counterexample: direct admission commits `CommandId == SubmissionJob.Id` and the debit before `SubmissionService.RunAsync`. The runner can then throw `InvalidOperationException` for an invalid generated payload or missing entry IDs at `src/FormAutoHub.Api/Services/SubmissionService.cs:117` / `:122`; it finalizes the persisted job and rethrows. `SubmissionsController.SendRulesDirect` maps that exception to HTTP 400 at `src/FormAutoHub.Api/Controllers/SubmissionsController.cs:22`.
- Impact: the frontend can discard an accepted command after job/debit persistence and allow another command, breaking same-command recovery and potentially charging/generating again.
- Required correction: do not clear from status 400 alone. The smallest compatible fix is an owner/session-safe `GET /api/projects/{projectId}/submissions/jobs/{commandId}` probe after POST 400: GET 200 applies the persisted job; GET 404 for the same current user/project after POST completion may clear; session change or any unresolved read retains the command fail-closed. A machine-readable pre-admission rejection discriminator is also valid but expands the API contract.
- Required tests: post-admission 400→GET 200 preserves/applies the same command; pre-admission 400→owner-scoped GET 404 may clear; failed/ambiguous verification retains it. The current 503 test does not cover this distinction.

### F3 — Resolved: user-scoped storage, cross-tab serialization and compare-before-clear

- Verified in `_helpers.ts:430`: per-user keys, safe legacy migration and command-ID comparison before removal.
- Verified in `page.tsx:144` and `:586`: storage/session hydration, storage-event synchronization, Web Locks before rule writes, a second in-lock check, and unsupported-browser fail-closed UI.
- Covered by account-switch, second-tab, missing-Web-Locks and newer-command tests at `direct-rule-submission.spec.ts:239`, `:265`, `:286` and `:312`.

### F4 — Resolved: total, success and failure meanings are separated

- Verified in `page.tsx:495`, `:1260` and `WorkflowSummary.tsx:29`: `total` is generated/accepted for processing; successful and failed submissions use `successCount` and `failedCount`.
- Covered by the mixed-result and credit-shortage assertion at `direct-rule-submission.spec.ts:351`.

## Test quality verdict

Current round 2: source review verifies POST 400/409 now probes the existing GET job route, checks the original user before and after the read, and accepts only a structurally valid job with matching command/project identity. A same-user 404 clears only the matching stored command; failed, mismatched, malformed or session-changed reads retain it. Other HTTP errors also retain it. Five added cases cover 400→200, 400→404, 409→503, identity mismatch and session change; assertions check storage/action state and relevant request counts. Writer reports focused 17/17, lint/build success and detector `[]`; final reviewer inspected these tests but did not rerun them against runtime-owned processes. Malformed-read behavior is source-inspected, without a dedicated added test. See [FINAL_REVIEW](FINAL_REVIEW.md) for final hashes and evidence provenance.

Prior-round test assessment (history):

- Focused specs now meaningfully cover F1, F3, F4, transport loss, 503 retry, compare-before-clear, unsupported Web Locks, partial credit and unchanged AI Option 2/3 confirmation.
- F2 coverage is incomplete because no case distinguishes a 400 before admission from a 400 after persisted admission.
- Writer reports six RED cases and combined Playwright 30/30 after repair. Reviewer confirmed the expected 30 cases by source enumeration but did not rerun Playwright.

## Files changed

- `docs/ai/tasks/FAH-DIRECT-001/FRONTEND_REVIEW.md`
- `docs/vi/tasks/FAH-DIRECT-001/FRONTEND_REVIEW.md`

No application source/test, dependency, process, database, Git history, provider or deployment state was changed by this review.

## Scope alignment

Reviewed only F1-F4 repairs in the changed forms source and affected specs. Rules retains one direct action without preview/second confirmation; AI Option 2/3 retains preview, checkbox confirmation and common send. No redesign, schema or recovery takeover is proposed.

## Validation performed

- **Verified by reviewer:** inspected current F1-F4 paths, affected tests, API error classification, direct controller/job-read route and runner exception path.
- **Verified:** `git diff --check -- apps/web`, exit 0; existing LF→CRLF warning remains for `fah-err-forms-errors.spec.ts`.
- **Verified:** Impeccable detector over the five changed forms targets returned `[]`.
- **Verified:** SHA256 before and after review matched for the frozen eight-file frontend snapshot below.
- **Reported, not rerun:** Playwright 30/30, lint exit 0 with two outside-scope warnings, production build/color/type/33 pages passed, detector `[]`.

| Prior-round frozen file (history; current hashes in FINAL_REVIEW) | SHA256 before = after prior review |
| --- | --- |
| `apps/web/app/dashboard/forms/_components/WorkflowSummary.tsx` | `DC06270A30984ACE01D7E5C904FA152BEC12136835A3A4009844D47AE6A45CCA` |
| `apps/web/app/dashboard/forms/_constants.ts` | `0511F34B5F93F5E66F7DC85FC9D77FC82F1DC63DD22AA1091D93E532E6ED7C3C` |
| `apps/web/app/dashboard/forms/_helpers.ts` | `A62A5A8186F448A5F1EAC7C58899EE3817B6B1F642CF6B25EA16941D07CFC780` |
| `apps/web/app/dashboard/forms/_types.ts` | `D9FA10765B8DC0D0C5973814EB7B63747914A6510C3E3F3D80632659184FE0E7` |
| `apps/web/app/dashboard/forms/page.tsx` | `6F10FE8780478A6F9A2EB20BBD01253F42936078E3932EE7C28C5F57AF7E7C12` |
| `apps/web/tests/direct-rule-submission.spec.ts` | `58B00DB270BED0134A893793B16AF3AF35583C9EB2A6B6E14F79EA81407F2E85` |
| `apps/web/tests/form-automation.spec.ts` | `7F172164E02FDB9E6EBE9265EBE08F21E2E94584D445B91CA9DD069901807F5A` |
| `apps/web/tests/fah-err-forms-errors.spec.ts` | `7F47BFB681666F697B14E71EBDB7B8A1C6CE03621D9516F71508921C7268C446` |

## Validation not performed

- Not run: Playwright, lint, build, authenticated browser/API/SQL smoke or provider calls. Runtime owns active browser/SQL resources.
- Not run: actual browser behavior when `navigator.locks` exists but `request()` rejects. Source fails closed before callback rule writes; runtime should confirm user-visible handling.

## Risks/Deferred items

- Approved no-schema hard-crash/manual-reconciliation limits remain Deferred; no automatic resend or client takeover is recommended.
- After F2 correction, runtime smoke should verify 400→job-read resolution, refresh recovery, cross-tab visibility and unsupported/failed Web Locks behavior.

## Next recommended step

Root combines the passed F2 independent rereview with the final runtime acceptance evidence. No source/test change is requested by this review.
