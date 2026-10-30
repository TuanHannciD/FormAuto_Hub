# H / ERR-020 — GREEN-ready packet, 2026-10-30

## Summary / files changed / scope alignment

Root approved shared helper `apps/web/scripts/legacy-smoke.mjs` plus three existing entrypoints (`smoke-test.mjs`, `apps/web/smoke-test.mjs`, `apps/web/smoke-debug.mjs`). Each entrypoint now delegates to the same bounded smoke. Only root entrypoint additionally reads the Admin AI settings page; an owned Admin fixture account is required for that scope.

Required environment: `SMOKE_BASE_URL`, `SMOKE_EMAIL`, `SMOKE_PASSWORD`. No embedded target/account/password/form URL/output path. Missing/invalid configuration fails before browser startup. Existing `@playwright/test` supplies Chromium; no dependency installed.

Scripts log in, assert same-origin route/HTTP response and required headings/button, check page errors/Next chunk HTTP or request failures, then close their owned browser. Required probe failure sets nonzero exit. Unrelated aborted requests do not fail the bounded probe. No fixed sleeps, `page.eval`, raw HTML/text/request data/screenshot/credential logs or claim of whole-system coverage. No analyze/generate/submit, live provider or payment action; forms controls are only inspected. Shared helper is scoped test tooling, not product behavior.

## Validation performed

- Runtime-owned valid RED: `runtime/legacy-smoke-red24/verification.json`, `test.log`, `source-hashes-before.json`: 24 executed,21 expected assertion failures,3 baseline pass,0 skip, exit1; no unguarded exceptions; three original scripts and test stable. Production changed only after this result.
- Node fixture executes actual wrapper bodies/helper with a fake browser/VM boundary. For each entrypoint: positive explicit target/account/read-only action checks; missing heading/button, wrong route, page error, chunk failure must exit1; missing configuration must make zero navigation; unrelated abort remains success. No actual browser/process/network acquired by author.
- Writer static `git diff --check` exit0. Before/after SHA256 manifests and tracked diff saved. New helper/test are untracked; full source remains at their named paths and manifests include them.

## Validation not performed / next step

- **Not run by writer:** GREEN24, actual ESM browser execution, CLI/browser launch/cleanup verification, lint/build or full UI/runtime. VM fixtures do not validate actual DOM/browser/package import; they prove bounded entrypoint behavior at the explicit browser boundary.
- Runtime owner command, cwd `D:/TinHoc/FormAuto_Hub/apps/web`: `node --test tests/fah-err-legacy-smoke.test.cjs`.
- Actual script execution is allowed only against an identified owned synthetic runtime/account under runtime owner. Scope is read-only forms/admin UI after login; never run earlier scripts or target unknown application/provider.
- Independent H review pending; root schedules against `after-hashes.json` and this packet. No finding marked Done; remaining required runtime/review stays outstanding.

## C fixture-only correction

Five C browser cases used `getByRole('alert')`, which also matched the empty Next route announcer. Runtime observed all five expected app messages but strict locator failed all5. Test-only locator is now `p[role="alert"]`; no C production changes. Hash: `shared-web/browser-fixture-r1-hashes.json`. Existing failed run remains at `runtime/shared-web-browser-green/`; runtime reruns the same five cases.

## Risks / Deferred

Helper scope does not validate provider connectivity, prompt modes after analysis, SQL, credits, external submission, complete route coverage or release. These limits are explicit in output. No historical evidence/backups/worktrees/DB-sync changed, no installation/commit/deploy/cleanup performed.
