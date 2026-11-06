# Task6 validation — runtime and cutover rehearsal

Date: 2026-11-05. Workspace: `D:/TinHoc/FormAuto_Hub/.worktrees/fah-history-001`, branch `fah-history-001`, base `df5cce54f4a8516ab9dd0bf2b5dff561c1cb8d5c`. All test accounts, projects and receiver calls below are synthetic.

## Verified

- Preflight: localhost integrated SQL identity was `DESKTOP-TS5JR7L` for `FormAutoHub_History_Safety_20261104` and `FormAutoHub_History_Baseline_20261105`; both had the two history migrations and 39 user tables. API auto-migration reported no pending work. The corrected leaf-file snapshot is `task6-start-snapshot-20261105.sha256`.
- API owner: release `FormAutoHub.Api.exe` PID 14444, loopback `127.0.0.1:5305`, isolated API cwd, exact owner record `task6-api-owner.json`; `/health` returned 200. The API used local DataProtection keys, generated signing material, exact Safety DB, CORS for owned web and `Deterministic` AI adapter.
- Authenticated API: `task6-api-http.json` records 61 assertions for no session, User, other owner and Admin, ownership/version fences, rules generation, AI default/custom/partial/zero output, 20-run pagination/eviction, dashboard balances, history recovery and production-config send rejection. Google sends returned `FormEvidenceUnavailable`; no provider receiver was called and no hold/job was persisted.
- Independent Safety SQL: `task6-safety-complete.log` is 56/56 (includes direct-rule SQL routed through the strict owned History fixture); `task6-safety-full.log` is the earlier 36/36 scope. Baseline migration test `task6-baseline.log` is 1/1. `task6-final-independent-sql.log` independently asserted the final synthetic account ledger, 20 reusable runs, no fail-closed submission job/hold and exact SQL identity.
- Synthetic cutover: `task6-cutover-final.log` is 2/2. `task6-cutover-transitions.jsonl` records `RunnerAcknowledgedAt`, `FinishedAt`, the exact active predicate and receiver-call counts for success, confirmed rejection and Unknown. v2 `SettleAttemptAsync` preserved immutable payload/evidence, actor/reason audit and idempotent replay. The legacy no-hold case retained `OutcomeUnresolved`, no new hold/ledger rewrite and `ReceiverCalls=0`.
- Web: production Next PID 9668, exact isolated `next start -p 3305`, API origin `http://127.0.0.1:5305`, owner record `task6-web-owner.json`; build `task6-web-build.log` exit 0, lint exit 0, auth 10/10, node tests 112/112. `task6-browser-runtime.log` is 5/5 real browser tests: owner reload/detail/mobile, other owner/Admin/no-session, account switch/logout, chunks 200 and no console errors. `task6-browser-actions-r2.log` is 1/1 real AI preview/confirmation and one-action rules send; both sends fail closed at 409 with no Google call. The new incognito tab is `tab_2_6f94ae41-270e-4168-b9a1-6e0f9bbc9735`; the retained Task5 tab is `tab_1_6f94ae41-270e-4168-b9a1-6e0f9bbc9735`.
- Full .NET suite: `task6-final-full.log` is 393 passed, 0 failed, 49 skipped with default opt-ins unset. Required owned history Safety (56), cutover (2) and Baseline (1) cases listed above were executed separately; a skip is never promoted to pass.

## Not run / Blocked

- Real Google Forms delivery, receipt provenance, operator reconciliation and production activation: Blocked by approved fail-closed P1/O1 limits. Synthetic receiver results are software evidence only.
- No-hold legacy reconciliation service/operator mutation path: Blocked/Deferred; no implementation or public endpoint exists and Task6 did not invent one. Legacy evidence remains read-only and fenced.
- Remaining unexecuted SQL scope: exactly 6 `TopupEvidenceSqlServerTests` method entries require their separately owned historical DB. They are unrelated normalization tests and remain Not run. All other 43 default skipped method entries have actual owned execution: direct9 expands to20 cases; submission8 expands to13; history12, reservation7, consumer4, cutover2 and Baseline1. The owned total is56+2+1=59 cases; direct20 is already part of56. See `task6-skip-map.json`.

## Commands and retained failures

Repository commands used `dotnet build FormAutoHub.sln -c Release --no-restore`, `dotnet test FormAutoHub.sln -c Release --no-restore`, and exact-class filters recorded in TRX/log files. SQL opt-in was `FAH_HISTORY_SQL_SERVER=localhost` with the exact Safety or Baseline database. Web commands from `apps/web`: `npm run build`, `npm run lint`, `npm run test:auth`, `node --test tests/*.test.cjs`, `node node_modules/typescript/bin/tsc --noEmit --incremental false`, and Playwright with `-c playwright.history-runtime.config.ts`. Final lint/types both exit0.

Initial cutover harness runs failed because serialized in-memory decimals differed from SQL canonical scale (`-1` versus `-1.00`); the assertion now compares independent persisted snapshots before/after. No production code changed. The first action browser run stopped at the intentionally disabled AI generation button; the error context showed the existing “Tải lại cấu hình AI” prerequisite, which the successful rerun performs. Failure artifacts remain retained. Existing NU1603 package warnings and two account-hook lint warnings remain unchanged.

## Handling note

The first synthetic registration diagnostic briefly selected refresh-token fields for local processing; the three sessions were immediately revoked through the API. No token marker was found under retained `artifacts/reports/fah-history-001`; current sessions/config reside only in ignored task-local files and are never copied into reports.

## R1 harness isolation recheck

Default Playwright discovery excludes runtime and SEO; the explicit runtime matcher lists6 tests without loading a fixture. Runtime execution now additionally requires `FAH_HISTORY_RUNTIME_OPT_IN=1`, its dedicated config and owned3305 baseURL. With fixture temporarily absent, default `--list` passed242 tests/29 files and dedicated runtime `--list` passed6/1; TypeScript passed. This was discovery only: no runtime mutation rerun. Exact logs and retained RED are in TASK6_REPORT's R1 checkpoint. Fresh scoped R2 review pending.
