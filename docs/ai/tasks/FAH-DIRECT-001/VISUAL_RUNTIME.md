# FAH-DIRECT-001 fresh visual/runtime verification

Date: 2026-11-02. Status: `Verified` for the fresh local API-SQL-loopback and browser scope below. This run did not call live Google or a paid AI provider and does not claim integration, deployment, or release.

## Scope and resources

- Fresh API publish: `dotnet publish src/FormAutoHub.Api/FormAutoHub.Api.csproj -c Release --no-restore -o artifacts/reports/direct-rules-visual-20261102/runtime-final/api-build ...`; exit 0 with the existing `NU1603` Google Forms package-resolution warning.
- Process-only API connection: exact local SQL database `FormAutoHub_DirectRule_Safety_20261101`; the default `FormAutoHub` database was not used.
- Owned runtime: API `http://127.0.0.1:7042`, Next.js `http://127.0.0.1:3020`, and safe loopback receiver `http://127.0.0.1:18081`. API health and web login returned HTTP 200 before behavioral checks.
- T3 `preview_status` was not present in the current tool catalog, so Playwright was used as the documented fallback. No human-owned browser tab was touched.
- The existing combined mocked Playwright artifact remained 35/35; it was not rerun as directed.

## Fresh API-SQL-loopback matrix

Authenticated requests used disposable local users and synthetic projects/questions/rules in the dedicated database.

| Case | Result |
| --- | --- |
| count `0` | `Verified`: HTTP 400 |
| count `101` | `Verified`: HTTP 400 |
| empty command ID | `Verified`: HTTP 400 |
| direct rules x1 | `Verified`: HTTP 200, `Completed`, total 1 |
| same-command replay with changed count | `Verified`: HTTP 200, same original total 1; no replay send |
| partial credit | `Verified`: request 5 with four remaining credits returned HTTP 200, `Completed`, total 4 |
| zero credit | `Verified`: HTTP 400 |
| wrong owner plus invalid request | `Verified`: HTTP 404 |

The receiver recorded five POSTs: one x1 send and four affordable partial sends. SQL evidence for that project recorded two jobs, five generated responses, five submission logs, eight usage rows totaling five credits, and two job-referenced debits totaling `-5.00`.

## Fresh browser evidence

The browser used real registration/JWT, dashboard reads, answer-rule save, direct API, SQL persistence, and the loopback receiver. Only form analysis and AI preview/provider responses were deterministic interceptions, so no Google or paid AI call occurred. Rules mode showed **Tạo và gửi ngay** with no preview checkbox. AI default/custom retained the preview and confirmation workflow. The fresh browser SQL aggregate recorded one job, one generated response, one submission log, two usage rows totaling one credit, and one `-1.00` debit.

Screenshots and SHA-256:

- `artifacts/reports/direct-rules-visual-20261102/runtime-final/screenshots/rules-config-mobile.png` — `E31151F44EC1D00E34F0DB7C4156F4A09608B3B13659AF24A1652AEAD1923EBD`
- `artifacts/reports/direct-rules-visual-20261102/runtime-final/screenshots/rules-result-mobile.png` — `BA166953578D537330AB05A50DA51A4988758C2A9423321F748CC8305AF8F1A4`
- `artifacts/reports/direct-rules-visual-20261102/runtime-final/screenshots/ai-default-mobile.png` — `12CC3A0B6B72646353F9C2BBE850078846D6A16E783127B060D2D5495328C1D9`
- `artifacts/reports/direct-rules-visual-20261102/runtime-final/screenshots/ai-preview-mobile.png` — `7DB0A5882869954FBBACDF6DF502DDAB3F6088F88DC4CC7FDBDE66D5BEC1D8BA`
- `artifacts/reports/direct-rules-visual-20261102/runtime-final/screenshots/ai-custom-mobile.png` — `E62ADBFBB922FBF5FBFCF7004520E06D887D191FE1BCC503C282160D3E5FF24F`
- `artifacts/reports/direct-rules-visual-20261102/runtime-final/screenshots/ai-custom-desktop.png` — `5F3BEF1CF5F831C5E21D9D2A3A1E59249539B894053025242C10C2FD4AEC9A2E`

Browser console evidence contained only two expected HTTP 404 messages for the absent local AI prompt profile; no page exception was recorded. Detailed evidence is under `artifacts/reports/direct-rules-visual-20261102/runtime-final/`.

## Resource release and limits

- `Verified`: owned API/web/receiver processes were matched by exact command/parentage, stopped, and ports 7042/3020/18081 had no listener afterward.
- `Not run`: live Google submission, live/paid AI provider, production/current database, deploy, commit, push, integration, or release.
- The dedicated database and synthetic evidence remain retained. Existing dirty/untracked work was preserved.
