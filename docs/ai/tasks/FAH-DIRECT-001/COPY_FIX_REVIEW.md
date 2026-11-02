# FAH-DIRECT-001 — Independent copy-fix closure review

Date: 2026-11-02. Reviewer: `/root/direct_closure_review`, `gpt-5.6-sol`, reasoning `medium`; independent of the copy-fix author, no child agent and no Astra. Branch `feat/direct-rule-submission`, dirty/untracked local snapshot, no commit.

## Findings and verdict

**No unresolved Critical or Important finding. The copy-fix delta passes independent spec/quality review, and FAH-DIRECT-001 is eligible for local Done within its approved scope.** This does not claim commit, integration, deployment, production verification, or release.

- Rules consistently describes the approved direct workflow: the analysis toast asks the user to review answers before creating and sending, workflow metadata says **Cài đặt → Tạo và gửi ngay**, and the rule-editor date/time/quantity helpers no longer describe a preview step.
- AI Options 2/3 still say **Cài đặt → Xem trước → Xác nhận** and retain preview plus explicit confirmation. The copy change does not weaken the AI safety boundary.
- The copy-only delta changes no API/DTO, backend, database, credit, usage/submission logging, lifecycle, dependency, provider, or layout behavior.
- Minor coverage limit: the date/time/quantity helper text was source-inspected but has no dedicated browser assertion. This is not a closure blocker because the helpers are static copy and the relevant Rules/AI workflow labels have executed coverage.

## Frozen snapshot and prior evidence reuse

| Changed by the copy fix | SHA-256 |
| --- | --- |
| `apps/web/app/dashboard/forms/page.tsx` | `5B6ADDF23E30BF3F32880D7C09E8652B9391BE528C86DAACC65265D5FC8B5CB3` |
| `apps/web/app/dashboard/forms/_components/RuleEditor.tsx` | `0AE4E80AEC4A479602CD2B8262513052CBDD07CC01B49B907333ECABF2695115` |
| `apps/web/tests/direct-rule-submission.spec.ts` | `32FB42555903C41F1A95B231D3313FC6274773F277DDC2FC4AEC2AB05218FD8E` |

The other 22 files from the prior 24-hash final-review freeze still match exactly, including all backend production/tests, frontend helpers/types/other affected specs, repository rules, and paired API/architecture contracts. Only `page.tsx` and the direct spec differ from that prior table; `RuleEditor.tsx` is newly included because the copy correction touched it. Therefore the retained backend/API/SQL and independent backend review evidence is reused honestly rather than rerun for a frontend-copy-only delta.

## Closure acceptance matrix

| Gate | Result | Evidence/limit |
| --- | --- | --- |
| Approved scope and direct-vs-AI contract | `Verified` | Source/spec review and rendered screenshots show Rules direct action and AI preview/confirmation separation. |
| Authorization, 1..100 limit, safety, credit and logs | `Verified` unchanged | Backend and contract hashes match the previously independently reviewed/SQL-runtime-verified snapshot. No backend rerun was needed for this copy-only delta. |
| Frontend regression | `Verified` | Author RED 1 failure on stale Rules toast, then GREEN 3/3 focused; affected combined Playwright 35/35. |
| Lint/build/color/type | `Verified` | `npm run lint` and `npm run build` exit 0; two pre-existing account-panel hook warnings remain outside scope; detector returned `[]`. |
| Fresh browser/hydration/chunks | `Verified` | Owned production Next runtime on port 3021, synthetic authenticated `User` session with mocked API: Rules label/toast/result and AI label rendered; 32/32 chunks HTTP 200; console/page errors 0; listener after stop 0. |
| Actual API/SQL runtime after copy fix | `Not run` and not required for this delta | No API/backend/DB behavior changed. Prior safe API-SQL-loopback and persistence evidence remains applicable and its backend hashes are unchanged. |
| Paired documentation | `Verified` | `COPY_FIX.md` and this review are paired AI/VI; INDEX/CLOSEOUT current status is updated together. |
| No-schema fail-closed/Web Locks limits | `Verified` preserved | No code in those paths changed; previously accepted no-schema/manual-reconciliation and Web Locks fail-closed limits remain documented. |
| Live Google/paid AI/production/release | `Not run` | Not required for local Done and not authorized. |

## Validation performed by reviewer

- Inspected the complete copy delta in `page.tsx`, `RuleEditor.tsx`, and the covering direct spec.
- Recomputed the three frozen copy-fix hashes, the browser-evidence hash, and all three screenshot hashes; all matched the author report.
- Inspected `browser-evidence.json` and the runtime harness: authenticated fixture role is `User`, `/api/**` is explicitly mocked, chunk count is 32, non-200 chunks and browser error events are empty.
- Visually inspected the three screenshots for Rules configuration, Rules result, and AI configuration.
- Confirmed port 3021 had no listener after shutdown and `git diff --check` exited 0 with only the already recorded line-ending warnings.
- Recomputed the previous 24-file freeze: 22 unchanged; the two expected changes are `page.tsx` and the direct spec. Backend hashes remain unchanged.

## Validation not performed and next step

The reviewer did not rerun lint, build, Playwright, backend tests, API/SQL runtime, or provider calls. Those executions are author/runtime-owner evidence inspected against the frozen files and artifacts. Real Google, paid AI, deployment, production smoke, commit, push, integration, cleanup, and release remain `Not run`.

The user may decide whether to commit/integrate the snapshot now eligible for **Done locally**. Any selective staging must first inventory untracked artifacts and secret-check `src/FormAutoHub.Api/artifacts/`; it must not automatically stage the whole dirty tree. Push/deployment, production verification, and evidence/database cleanup remain separate authorized events.
