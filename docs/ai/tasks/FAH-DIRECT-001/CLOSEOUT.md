# FAH-DIRECT-001 — Local closeout

Date: 2026-11-02. Status: **Closed locally** after independent review, local commit/integration at `5568ca0`, and authorized task cleanup; not pushed, deployed, or released.

## Summary

Option 1 rules now uses one **Tạo và gửi ngay** action without preview UI, checkbox, or second confirmation. Options 2/3 preserve AI preview and explicit confirmation. The direct route uses the approved existing response, x1 partial-credit semantics, first-call-wins read-only replay, shared sequential runner, and fail-closed recovery boundaries.

The final copy correction removes stale preview wording from the Rules analysis toast, workflow metadata, and rule-editor helpers while preserving AI preview/confirmation wording. Independent closure review found no unresolved Critical/Important finding.

## Files changed

- Backend/API services, DTO/controller/DI and focused tests listed in [BACKEND](BACKEND.md).
- Frontend rules workflow, command recovery and focused Playwright coverage listed in [FRONTEND](FRONTEND.md).
- Current paired baseline contracts and task reports, including [DOCS_SYNC](DOCS_SYNC.md).
- No entity, migration, dependency, production configuration, or provider integration change.

## Scope alignment

Authorization, 1..100 limits, sequential batches of 10, dedicated credit service/`CreditTransactions`, `UsageLogs`, `SubmissionLogs`, wrong-owner privacy, common AI confirmation, and anti-abuse rules remain enforced. No schema/status/refund/provider expansion, automatic takeover, automatic resend, or exactly-once promise was introduced.

## Validation performed

- Verified backend focused 58/58 with zero skipped, including 20 real-SQL cases; initial runtime SQL concurrency 8/8. Earlier broad backend snapshot: 315 passed and 12 SQL methods skipped, with its recorded snapshot limitation. Release build passed.
- Verified frontend affected suite 30/30 before F2 round 2, final focused direct suite 17/17, lint pass, and production build pass with only recorded outside-scope warnings.
- Verified independent backend, frontend, and final code/spec reviews. Final review matched 24 frozen hashes and found no unresolved Critical/Important finding.
- Verified safe runtime with real local auth, dashboard reads, rule write, direct API and isolated SQL persistence. Analysis alone used a deterministic fixture; submission terminated at an owned loopback fake receiver, not Google.
- Verified transport-reset recovery reused the same command without another rule save or provider call; 42 Next chunks returned 200, page exceptions were zero, mobile 390px had no horizontal overflow, and AI mode retained its preview gate without a provider call.
- Verified final SQL: one completed job total/success 1/1, one -1 debit, one submitted generated response, two usage rows totaling one credit with zero failures, one successful submission log, balance 4. Expected reset/AI-profile 404 logs were diagnosed.
- Verified owned API/web/receiver ports 7042/3020/18081 released. Dedicated DB, synthetic fixtures, logs, and screenshots remain retained evidence.
- Verified copy-fix RED 1 then GREEN 3/3, affected Playwright 35/35, lint/build exit 0, detector `[]`, and fresh production-browser mocked runtime with 32/32 chunks HTTP 200, zero console/page errors, and released port 3021. Frozen hashes and the acceptance matrix are recorded in [COPY_FIX](COPY_FIX.md) and [COPY_FIX_REVIEW](COPY_FIX_REVIEW.md).

## Validation not performed

- Not run: live Google submission, live/paid AI generation, production/current DB, deployment, production smoke, push, or release. Local commit/integration and cleanup were completed separately after the recorded validation.
- AI confirmation after preview is covered by the frozen Playwright suite, not a paid/live provider runtime call.
- This closeout does not claim a fresh broad full-repository suite after every final documentation/runtime update.
- The copy-fix reviewer did not rerun author suites or backend/API/SQL checks; backend hashes remain unchanged and the prior independently reviewed/runtime-verified evidence is reused for this frontend-copy-only delta.

## Risks and Deferred items

- A hard crash or uncertain commit can leave an active reservation requiring manual reconciliation; replay does not take over.
- Cancelling a paused runner that already exited can leave `Cancelled` with null `FinishedAt` and block admission until manual reconciliation.
- Web Locks support is required for safe cross-tab direct-command creation. Unsupported browsers fail closed before rule writes/direct command creation.
- Unknown provider outcomes are never resent automatically. No automatic recovery, refund behavior, or schema extension is approved.

## Next recommended step

The task is closed locally. The reviewed feature is committed/integrated on local `main`, and the authorized cleanup is recorded in [CLEANUP](CLEANUP.md), including the external sanitized archive and release of owned resources. The user will perform any push or deployment; production validation and release remain Not run.
