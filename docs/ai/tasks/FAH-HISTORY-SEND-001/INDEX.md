# FAH-HISTORY-SEND-001 — Rules submission repair plan

> Execute inline with executing-plans, TDD and a fresh independent whole-diff review.

**Goal:** Restore authorized rules direct submission and history reuse for supported public Google Forms, preserve credit safety, then merge local main and close owned resources.
**Base:** 0b25aea08dc2c654614660e12bfa2f776df69e41; branch fah-history-001.
**Authority:** User requested plan, fix, local merge and clean closeout. On 2026-11-07 user supplied a test form in response to the max-two-submission request. No push/deploy.
**Architecture:** Dedicated strict public metadata parser, distinct from permissive import. Refresh outside SQL retries; immutable semantic evidence and payload checks before dispatch. Only complete, same-form Google confirmation documents authorize successful settlement; ambiguity retains existing holds and fences.
**Stack:** .NET9 / EF Core SQL Server / Next.js. No schema, external endpoint, price or state additions.
**Spec:** Existing GENERATION_HISTORY_CONTRACT and FAH-HISTORY-001 contracts plus current user bug-fix authorization.

## Design and limits

- Support verified text, choice/dropdown/checkbox metadata; ordinary sequential sections are supported, branching/unknown validation/file upload/auth restrictions are blocked. The supplied form contains text, choice, checkbox and one ordinary section. Other-option metadata is recognized but generated answers remain enumerated choices.
- Check complete inventory, required flags, options and immutable form/action identity. Labels, session tokens and check timestamps are excluded from semantic hashes.
- Validate selected/generated payload against refreshed metadata before any possible dispatch. Refresh per controlled batch of ten and preflight every item before PossibleDispatch. No automatic POST replay or redirects.
- Use the real authorized confirmation observation (first of two submissions) as classifier provenance. Require HTTP200, complete document, Google form root, same-form public-load identity with empty form data, confirmation container and same-form confirm link; text alone never proves success.
- Persist response evidence and hashes privately outside the web root. No personal payloads or tokens in tracked artifacts. If persistence fails, retain uncertainty.
- Existing Unknown retention and explicit accountable operator reconciliation requirements remain. No automatic reconciliation or production activation is claimed.
- History display eligibility is advisory; send always rechecks admission. Existing partial generation observations are preserved.

## Steps and checks

- [x] Add failing strict metadata and real-derived receipt regression cases, including malformed/unsupported/changed metadata, required/unknown entry, false markers and redirects. Run dotnet test with focused filters and observe RED.
- [x] Implement parser/refresh and receipt evidence in Integrations/GoogleForms, wire SubmissionCompatibilityService, validate immutable targets and payloads; run focused tests GREEN and affected submission/history suites.
- [x] Make direct errors actionable without altering command recovery. Test direct rejection and existing uncertain transport recovery; lint/build web.
- [x] Restart owned worktree API/web; verify SQL migrations, authenticated browser direct count1 against the supplied form (second and final real submission), ledger1, retained batch, reservation0, replay with no extra dispatch, history and JS chunks/logs. Mock transport covers additional cases without consuming live budget.
- [x] Fresh independent review of immutable diff; fix findings and rerun checks. Sync AI/VI results.
- [x] Commit only owned files, merge local main, verify ancestry and clean status, stop owned runtime and remove owned branch/worktree when safe. Preserve DB/evidence and unrelated resources. No remote operation.

## Ownership and review focus

Root gpt-6.1-sol/medium implements. Design reviewer gpt-6.1-sol/high completed; final independent review uses fresh Sol <=high after live catalog discovery. Allowed zones: GoogleForms integration, submission/history services and tests, direct error UI/tests, paired task dossier. Preserve other worktrees and main ignored runtime evidence.

Focus: cross-form immutable targets; dynamic token/hash drift; required/choice mismatch; script/comment/foreign-form receipt markers; uncertain transport and financial replay. Every case needs a focused regression.

## Evidence ledger

- Verified baseline: rules UI POST409 FormEvidenceUnavailable; SQL no generation/hold/debit mutation. Root cause is unconditional compatibility rejection and receipt classifier always Unknown.
- Verified authorized live attempt1: HTTP200, 75,723-byte Google confirmation document, SHA256 b2b12834858fa8cf613c32d24df0131ed641651099f1a09497d38bef9f176843. Saved privately in main .codex-tmp/history-local-debug-20261107. Live remaining budget after attempt1: 1; exhausted after final attempt2.
- API5307/web3307 restarted from the fix worktree before smoke. Local DB FormAutoHub_History_Safety_20261104, synthetic user; no production writes.
- Implementation and runtime verified; local merge and cleanup verified. Production release is outside this task.

Ruling: Initial supported subset is text, multiple-choice, dropdown and checkbox with sequential sections. Linear scale and other types stay blocked pending verified metadata schema; no promise of broad form compatibility. R1 found unrecognized form/question settings being ignored: added RED cases and reject unknown settings/extensions. Stored option lists must match refresh.

## Verification and review — 2026-11-07

- Release solution tests416 pass49 opt-in skip; focused SQL submission13 pass on authorized localhost Safety DB without reset. API Release build, web lint/build and18 mocked direct browser tests pass; existing NU1603/two hook warnings remain. Impeccable detector empty.
- R1 five Important fixed with regressions: settings/extensions fail closed, receipt DOM (AngleSharp1.10.0 NuGet, no scripting/resource execution), preflight before PossibleDispatch, immutable batch known options check, scoped support corrected. R2 no Critical/Important;18 manifest hashes verified. Root16 unknown-string check added RED/GREEN after R2; stricter schema only. Minor closure single-use enforcement deferred: runner already invokes once.
- Live attempt2 from local UI count1: command424ffa8e-d9f4-4e87-acad-45cc68922753, Completed/Success1/Unknown0; balance5 to4, held0; one send debit/log; immutable history response, generation fee0. Receipt artifact d90616442e4d4537836dbe8293f8aff3 retrievable and SHA matches DB. Replay command read-only, SQL counters unchanged.2/2 authorized real submissions used; no more live sends.
- History API selectable (sendBlocked=false), browser list shows new run/success1; clean smoke JS/CSS200/no console error. Stale synthetic browser refresh was rotated by CLI and was replaced before successful smoke; that failure had no dispatch/mutation.
- Evidence outside web root: GoogleForms:EvidencePath, default LocalApplicationData/FormAutoHub/submission-evidence; private raw response file contains audit evidence, retain/backup with DB. Unix0700/0600 implemented; Windows app-account inherited ACL. Linux ACL not run.
- Not run: paid AI, live history resend (budget exhausted; unit/SQL synthetic covers), deployment/production, unsupported form types. No production readiness claim; operator reconciliation remains Deferred.
- Root model gpt-6.1-sol/medium; all three reviewers Sol/high, no children. Preserve main ignored evidence and both SQL test DBs.

## Local closeout

- Fix84d22eb fast-forward merged to local main. Fresh post-merge dotnet test FormAutoHub.sln -c Release:416 passed49 skipped. First --no-restore run failed because main assets predated new AngleSharp dependency; normal restore+test passed. No code repair needed.
- Synthetic refresh session revoked, browser local session cleared and owned tab closed. Owned API12240/parent5444 and web23428/parent15532/server26412 stopped after ownership checks; ports5307/3307 verified released.
- Worktree evidence copied to main ignored history-local-debug-20261107/worktree-evidence before removal; original provider/SQL/browser evidence retained. Exact dependency junction removed without touching target node_modules. Worktree registration and fah-history-001 branch deleted after merged ancestry proof. Other worktrees unchanged; main git status clean before this closeout edit.
- Status: Done for authorized local repair and integration. No push/deployment. Production still serves its previous revision until separately released. Supported-schema/receipt and operator reconciliation limits above remain.
