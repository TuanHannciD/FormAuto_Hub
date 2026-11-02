# FAH-DIRECT-001 — Direct rules copy correction

Date: 2026-11-02. Status: `Verified` for the task-local frontend copy and mocked-browser runtime scope. This does not claim commit, integration, deployment, release, live Google submission, or paid AI execution.

## Summary and scope

- Root cause: the Rules workflow behavior had changed to direct generation/submission, while static analysis-success, workflow metadata, and rule-editor helper text still described preview and confirmation.
- Rules now says **Cài đặt → Tạo và gửi ngay** and tells the user to review answers before generating and sending.
- AI Options 2/3 still say **Cài đặt → Xem trước → Xác nhận** and keep their preview/confirmation behavior.
- No API, DTO, backend, database, credit, submission, state-machine, dependency, or layout behavior changed.

## Files and frozen hashes

| File | SHA-256 |
| --- | --- |
| `apps/web/app/dashboard/forms/page.tsx` | `5B6ADDF23E30BF3F32880D7C09E8652B9391BE528C86DAACC65265D5FC8B5CB3` |
| `apps/web/app/dashboard/forms/_components/RuleEditor.tsx` | `0AE4E80AEC4A479602CD2B8262513052CBDD07CC01B49B907333ECABF2695115` |
| `apps/web/tests/direct-rule-submission.spec.ts` | `32FB42555903C41F1A95B231D3313FC6274773F277DDC2FC4AEC2AB05218FD8E` |
| `artifacts/reports/direct-rules-copy-fix-20261102/harness/capture-copy.mjs` | `9E1854F27DE3E6E2947841373E1960D89D977EB825D6D44D869735B8E97F40EC` |
| `artifacts/reports/direct-rules-copy-fix-20261102/browser-evidence.json` | `C00D3E15A3A79F0224614D0F01E1490F877C1EEE020400855BE4AED97E431BC2` |

Agent ledger: writer `gpt-5.6-sol`, reasoning `medium`; no nested agent and no Astra.

## Validation performed

- `RED`: `npx playwright test tests/direct-rule-submission.spec.ts --grep "rules uses one direct action" --reporter=line` — 1 failed because the Rules toast still lacked `trước khi tạo và gửi`.
- `GREEN`: `npx playwright test tests/direct-rule-submission.spec.ts --grep "rules uses one direct action|AI Option" --reporter=line` — 3/3 passed, covering Rules plus AI Option2/Option3 labels.
- `Verified`: `npx playwright test tests/direct-rule-submission.spec.ts tests/fah-err-forms-errors.spec.ts tests/form-automation.spec.ts --reporter=line` — 35/35 passed.
- `Verified`: `npm run lint` — exit 0; only the two pre-existing `react-hooks/exhaustive-deps` warnings in account panels.
- `Verified`: `npm run build` — exit 0; color check, compile, type check, and 33 static pages completed; the same two outside-scope warnings remained.
- `Verified`: Impeccable detector on the two changed UI targets returned `[]`.
- `Verified`: `git diff --check` on the three source/test files — exit 0.

## Fresh browser runtime

The production build was served by an owned Next process at `http://127.0.0.1:3021`. The browser used a synthetic local session and mocked `/api/**` responses; it made no Google, paid AI, backend, or database call.

- Rules label and analysis toast were visible; Rules direct result rendered.
- AI default retained the preview/confirmation label.
- 32 Next static chunks were observed, all HTTP 200.
- Browser `pageerror`/console error count: 0.
- Owned port 3021 listener count after shutdown: 0.

Screenshots:

| Artifact | SHA-256 |
| --- | --- |
| `artifacts/reports/direct-rules-copy-fix-20261102/screenshots/rules-copy-mobile.png` | `62CDDE0B178EEE979BA95F69FE2DD66CF41F6DE14C508415DBDD36294683DEC3` |
| `artifacts/reports/direct-rules-copy-fix-20261102/screenshots/rules-result-mobile.png` | `D164E2A2E34BD483D7498229FD2FF1B3CCD1E732DB6145C7146E9333B65A2EA3` |
| `artifacts/reports/direct-rules-copy-fix-20261102/screenshots/ai-copy-mobile.png` | `C1BE6997C7C76D26A688F685218BE5676D2FFA008D8770D1113DE11DEE4CB04F` |

## Validation not performed and next step

- `Not run`: backend tests, API/SQL runtime, live Google, paid AI, deployment, commit, push, integration, or release. Backend/source contracts were unchanged; the previously retained backend evidence remains separate.
- Independent closure review remains required before root updates `INDEX.md`/`CLOSEOUT.md` or makes a task-closure decision.
