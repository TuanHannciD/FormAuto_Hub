# FAH-DIRECT-001 - Visual suites evidence

Date: 2026-11-02 08:13 +07. Status: `Verified` for the retained local artifacts; no source/test change was made by this verification pass.

## Scope

Three-flow evidence is retained for direct rules, error/recovery, and form automation. The focused contract themes are validation/credit, replay, concurrency, rollback, cancellation, unknown-result fencing, and AI confirmation. Live Google submission, paid AI calls, deployment, and `.next` rebuild are outside scope.

## Results

| Suite | Result | Count | Artifact |
|---|---|---:|---|
| Backend full solution | `Verified` | 335 passed / 0 failed / 6 skipped; 341 discovered | `artifacts/reports/direct-rules-visual-20261102/suites/backend-full.trx` |
| Backend direct service | `Verified` | 24 passed / 0 failed | Included in TRX |
| Backend direct SQL | `Verified` | 20 passed / 0 failed | Included in TRX; exact opt-in DB |
| Playwright combined | `Verified` | 35 expected / 35 passed / 0 unexpected / 0 skipped | `artifacts/reports/direct-rules-visual-20261102/suites/playwright-combined.json` |

The six backend skips are the existing `TopupEvidenceSqlServerTests` normalization cases. They are reported honestly and are unrelated to direct-rule coverage. The TRX is complete: XML namespace is `http://microsoft.com/schemas/VisualStudio/TeamTest/2010`, `ResultSummary` is `Completed`, and 341 `UnitTestResult` nodes are present.

Name-matched direct-test coverage (overlapping categories, not additive): validation/credit 44, replay 8, concurrency 5, rollback 10, cancel 7, unknown-result fence 1, AI/common confirmation 22. The counts include parameterized rows and are a navigation summary, not a new contract.

## Playwright breakdown

- `direct-rule-submission.spec.ts`: 17/17.
- `fah-err-forms-errors.spec.ts`: 13/13.
- `form-automation.spec.ts`: 5/5.
- The direct flow keeps one action without preview/checkbox; unknown transport and 400 recovery reuse the same command; AI Options 2/3 retain preview and confirmation.

## Commands and environment

- Backend artifact corresponds to `dotnet test FormAutoHub.sln -c Release`; the TRX does not embed the original shell command line. Start `2026-11-02T08:12:34.5892184+07:00`, finish `2026-11-02T08:12:44.0437002+07:00`, cwd `D:\TinHoc\FormAuto_Hub`.
- Playwright artifact is the combined local harness run; the JSON records start `2026-11-02T01:11:39.467Z` and duration `29365.958 ms` (08:11:39.467 +07, about 29 s). The original wrapper command is not embedded in the JSON. No rerun was performed.
- SQL opt-in identity for the retained backend evidence is `FORMAUTO_DIRECT_SQL_SERVER=.` and `FORMAUTO_DIRECT_SQL_DATABASE=FormAutoHub_DirectRule_Safety_20261101`; no application DB was targeted.

## Hashes

- `backend-full.trx`: `A7AEC710ED138068B45377EB88EBB71E90E2721368B1A09CE775FB1C61C00B62`.
- `playwright-combined.json`: `4300FCF89C6143C1E8CDA70CA539D6501FA91CCEA69D12B8CE727F8A75E7B922`.
- `playwright-combined.junit.xml`: `BAB1415CAC2382DF32CB72174C51CB51D0D1672376266BEBCCA25DCB6E6882BB`.

## Limits

No live Google or paid AI provider call was made. No runtime process was acquired, no `.next` build was started, and no existing artifacts were overwritten. The six unrelated normalization skips remain `Not run` rather than being promoted to pass.
