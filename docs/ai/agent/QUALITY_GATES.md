# Validation, browser testing, review and Done

Use `verification-before-completion` before claiming results. Domain cases live in [TESTING_STRATEGY](../TESTING_STRATEGY.md); permissions and resource ownership in [execution rules](EXECUTION_RULES.md).

## Evidence and completion

- `Verified`: ran and passed for the stated target/scope; `Failed`: ran and failed.
- `Not run`: not executed, with reason; `Blocked`: a required check lacks prerequisite/permission, with unblock condition. `N/A` requires a reason and cannot hide a missing check.
- Record date, command/tool, cwd, target/environment, role/data, result/exit, assertions, artifact and limits. Tool/package presence, build, screenshot and historical reports are different evidence from behavioral tests.
- Done requires approved acceptance, applicable required checks, required review and paired documentation to pass. Merely reporting a missing check does not satisfy it. A user-accepted exception stays Failed/Not run and records its consequence; it does not turn green. Never treat an exception as permission to weaken safety.
- Separate implemented, reviewed, integrated and released. Documentation-only acceptance does not require starting or deploying the app. Installation is not proof that every skill/tool works.

## Gates by impact

- Docs: links/anchors, UTF-8, authority/permission consistency, AI/VI meaning, routing and preserved approvals/history.
- Skill packaging: source/pin, inventory, hashes/licenses, metadata, mirror/routing and scoped pilot; hash integrity is not an upstream signature or script safety audit.
- Backend: relevant build/unit/integration checks; validate contracts, validation/error paths, roles and ledger/log invariants.
- Database: review entity/migration/transaction effects; apply to a clean SQL Server test DB and an existing test baseline when applicable; confirm runtime schema and recovery notes. EF InMemory tests do not verify SQL Server transactions/migrations.
- Frontend/auth/shared UI: lint/build and relevant auth/Playwright checks, actual route behavior, consumer impact and roles. Keep mock/API-live coverage separate.
- Payment/webhook/provider: safe mock/sandbox requests under scope; live integration only with explicit configuration, credentials and authorization. No real charge/submission/provider cost merely to complete a general smoke test.

## Required runtime smoke

Runnable changes exposed through API/browser/auth/DB/payment/callback/webhook/public or tunnel paths require applicable runtime smoke beyond build/test:

1. Restart the affected owned process after the change; verify it serves the intended code.
2. Make real HTTP requests to affected API routes with the correct role/session and expected status/body markers.
3. Check browser rendering and hydration; required JavaScript/CSS chunks must load, including HTTP 200 for Next.js chunks through public/tunnel targets.
4. Confirm required migrations exist in the actual test DB before dependent smoke.
5. Verify affected payment/webhook behavior safely in mock/sandbox and read relevant terminal/server logs after smoke.

If an applicable required runtime check is missing, report implemented with `Not run`/`Blocked`; do not close runnable work as Done.

## Browser discovery and target

Direct browser work in T3 follows current runtime: `preview_status` first, `preview_open` if no automation-capable preview; inspect snapshot locators. Human-owned tabs are read-only; use an owned tab to interact. Use saved profiles only when task authorization covers them.

Inspect actionable errors and retry correctly. Use another browser only when T3 tools are absent, open explicitly reports unsupported/unavailable, the same step on an open tab fails twice, or the user/repository workflow requests another tool. Record the raw error after redaction and fallback reason. Playwright Test is the regression runner, distinct from browser MCP; HTML preview is presentation, not app verification.

Before mutating, identify web/API origin, process owner, actual DB identity, test account/role, browser context, expected behavior, evidence destination and cleanup. Do not reuse an unknown server silently. Ports 3020/7039 are the standard local workflow; default Playwright uses web 3000; SEO uses its own explicit target. Confirm actual configuration instead of assuming one mode covers all.

## Browser assertions and debug

Separate four evidence levels: static/mockup/build; browser with mocked API; sandbox web–API–DB; live provider/production. Browser automation can still call a mock API. Never promote one level into another.

Perform relevant user actions; assert UI state plus network target/status and independent persistence when acceptance involves saving. Reload/re-login, retry/error and role checks apply by risk. Check keyboard/focus, reduced motion, overflow and relevant viewports for affected UI. Simulated mobile viewport is not a physical device test.

Reproduce → inspect relevant console/network/backend logs → form a hypothesis → isolate the owning layer → repair → rerun the failing case and affected regressions. Avoid blind retries/fixed sleeps. Preserve redacted assertions, traces/screenshots and failure evidence. Verify release of owned resources separately from passing tests.

## Review

Self-review all in-scope diffs for acceptance, architecture boundaries, contract/DB effects, safety/ledger/logging, validation and AI/VI sync. Use requesting-code-review/receiving-code-review for the review method; report findings by severity with path, impact and recheck.

Independent review is required for auth/security, credit/payment, migration and submission-safety changes; use risk to decide other changes or follow explicit task requirements. Reviewer needs approved scope, immutable base..tip or snapshot, full relevant diff, checks and limits. An author rereading the diff is self-review, not independent review. Do not dispatch without session authorization; if required review is unavailable, mark that gate Blocked and continue independent authorized work.

After fixes rerun affected checks and obtain review of the new snapshot when independent review is required. Do not waive a fresh review merely because upstream limits fix/review cycles. Resolve acceptance blockers; record genuinely out-of-scope findings without hiding them.
