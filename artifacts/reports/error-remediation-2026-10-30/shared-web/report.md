# C — shared web/auth, GREEN ready (2026-10-30)

## Summary / scope alignment

Implemented ERR-001–004 and auth part of ERR-018 at existing client boundaries. No server HTTP/status/contract change. ERR-011 generation result has only the approved optional nullable `errorMessage` TypeScript field. No DB/process/provider/payment/submission action, commit or cleanup. All pre-existing dirty/untracked/ignored work preserved.

Before resume, all seven C source files matched baseline; no prior shared-web packet directory existed. Runtime RED3 verified baseline unchanged, 13/13 failed assertions, no unguarded harness errors. Writer implemented only after that result.

## Files and consumer handoff

- `lib/api.ts`: exports `ApiError`, `ApiErrorKind`; JSON/blob use shared safe HTTP parsing. Status retained; method uppercase; path excludes query/hash and is capped256. `fieldErrors` contains at most nine known MVC field identities, one locally generated Vietnamese message each; unknown fields/raw messages dropped. `traceId` retains only existing W3C/ASP.NET request trace syntax. Error body parsing capped at32KiB; title/detail/plain/HTML are never rendered or logged. Network and malformed successful JSON classified; deliberate `AbortError` rethrown. No raw cause retained in public error object.
- `lib/toast.ts`: accepts locally classified ApiError/SessionExpired and translates known Google discriminator class; unknown errors/strings get the caller fallback. No raw console logging. SessionExpired/AbortError generate no duplicate toast.
- Login/register: full error objects flow from real catches into endpoint/status mappers; no substring guessing, no invented lockout duration. Generic bad-credential wording and existing explicit409 flow retained.
- Security panel: mapper/catch only; route/method/status select known conflict guidance. Session expiration does not create a second toast. Profile loading/state/render remains F-owned and unchanged by C.
- Usage/credit history: catch-only safe mapper; existing request ownership and cancellation guards preserved.
- `AiGenerateResponsesResult.errorMessage?: string | null` follows exact approved backend handoff. `AiRecentRun` lives in `app/dashboard/ai-usage/page.tsx`; D must add matching field there and consume safe reason. C did not invent a duplicate shared type.

### D/E/F interface

`ApiError extends Error`: `status:number|null`, `method:string`, `path:string` (no query/hash), `fieldErrors:Readonly<Record<string,readonly string[]>>`, `traceId?:string`, `kind:"http"|"network"|"invalid-response"`. `message` comes only from fixed Vietnamese client messages. Consumers inspect object metadata and pass full objects to `readableError`; do not reconstruct identity by searching `.message`.

The unchanged NCKH Google401 discriminator runs before shared error parsing for JSON/blob; JWT still refreshes at most once, with existing rotated-token/session protection. G must preserve its exact existing Unauthorized detail. Deliberate aborts remain aborts; do not display or relabel them as failures.

## Validation performed

- Runtime owner: valid RED3 `runtime/shared-web-red3/{test.log,verification.json,source-hashes-before.json,runner-result.json}`; 13 Failed/13 assertions, zero unguarded errors, seven original sources unchanged and eight run hashes stable. Earlier failed snapshot/RED2 artifacts remain preserved.
- Writer: `git diff --check` exit0 (Git noted existing configured LF→CRLF conversion for toast); scoped Impeccable detector over five touched TSX files returned `[]`. No visual/style/layout edits.
- Snapshot: `before-hashes.json`, `after-hashes.json`, `source.patch`. New tests are untracked, so patch does not include their content; hash manifest names both test files.
- New `tests/fah-err-shared-errors.test.cjs`: 13 original RED cases plus supplemental source security/Google conflict coverage, total15. Tests use actual transpiled modules and source functions with transport/toast boundary fakes. Trace fixture corrected to an actual W3C shape; lockout test uses the same ApiError constructor identity as its loaded source mapper. These are test-harness corrections, not relaxed product assertions.
- New `tests/fah-err-auth-errors.spec.ts`: five actual caller/browser cases: login title-only401, empty423, sensitive plain500, register400 password wording, transport failure. Assertions include expected UI, preserved input, exact mutation count, no raw browser logs/page errors or failed chunks. Browser cases are supplemental; no claim they ran RED.

## Validation not performed / next recommended step

Writer did not run test/build/lint/browser/API/SQL. Runtime owner commands, cwd `D:/TinHoc/FormAuto_Hub/apps/web`:

1. `node --test tests/fah-err-shared-errors.test.cjs`
2. `npm run test:auth`
3. `npx playwright test tests/fah-err-auth-errors.spec.ts tests/auth-session.spec.ts --workers=1` under an owned verified runtime/config (default config starts3000; do not silently reuse unknown process).
4. Relevant lint/build; restart owned affected process and smoke actual missing/malformed auth400, wrong-credential401, privacy/role/blob failures with console/chunk checks. Mock browser does not replace API-live validation.

Independent auth/security/shared-consumer review is **Not run**. No C finding is Done; completion requires runtime and review gates. Known limits: field metadata only recognizes explicitly mapped existing fields; no raw general server cause is forwarded. Provider/live payments/submissions, historical backfill, broader contract/schema/retention/recovery remain Deferred.
