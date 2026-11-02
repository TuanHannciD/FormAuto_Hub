# FAH-DIRECT-001 — Direct rule generation and submission

Status: **Done locally** within the approved scope after independent review of the final copy correction. It is not committed, integrated, deployed, or released; no live Google or paid AI provider call was made.

## Approval and immutable baseline

- User approved implementation and paired documentation. Option 1 (`rules`, x1) uses one **Tạo và gửi ngay** action without preview UI, checkbox, or second confirmation.
- Options 2/3 keep AI preview and explicit confirmation; common `/submissions/send` retains `Confirmed`.
- Base: `297ee2143f7a37ca02739157d75e3db06ab4be17`. Backend created `feat/direct-rule-submission` from `main`; no commit, push, install, deployment, destructive cleanup, real Google submission, or paid provider call is authorized by this dossier.
- Preserve pre-existing ignored/untracked evidence. The paired dossier was untracked task-owned work when implementation started.

## Final root contract and DB ruling

- `POST /api/projects/{projectId}/submissions/send-rules-direct`.
- Request: `DirectRuleSubmissionRequest(Guid CommandId, int Count)`; reject empty GUID and counts outside 1..100.
- Response: existing `SubmissionJobResponse`, with `Total` equal to affordable generated count. No proposed wrapper is used. The requested count and missing credits remain in generation usage evidence; clients retain their requested count.
- `CommandId == SubmissionJob.Id` is the persisted reservation. First accepted command wins. Replay after owner/project authorization only returns the existing job/logs, even when count differs; it never generates, debits, submits, resumes, or takes over.
- Reuse on another project/user returns 404 through the null service result. No deterministic response IDs, membership field, lease, new status, schema, or migration.
- Shared common/direct admission holds the SQL project row with `UPDLOCK,HOLDLOCK` before active-job check, generation, debit and persistence. Credit changes use `ICreditService`, existing `UserCreditAccount.RowVersion`, and `CreditTransactions` referencing the job.
- Only the local admission transaction is inside EF execution strategy. Provider HTTP is outside both transaction and retry delegate. A committed reservation observed after ambiguous commit returns read-only; no runner starts from that read.
- Rule validation/generation and x1 partial-credit semantics are reused. Zero affordable responses reject without a reserved job or provider call.
- Both routes use the existing sequential runner, batches of at most 10, pre-call attempt logs, persisted returned outcomes and usage/audit evidence. Authorized rejected direct admissions persist a Failed zero-credit usage row outside the rolled-back admission; wrong-owner projects are neither disclosed nor logged, and replay remains read-only.
- Common send rejects any response with a persisted `SubmissionLog`, including uncertain `Failed` with null `SubmittedAt`, even if still `Previewed`.
- Unsent responses with no attempt log may be manually previewed and confirmed later without generating/debiting again.

## Cancellation and recovery boundaries

- `Cancelled` plus null `FinishedAt` remains active for admission. Cancel requests do not mark a worker finished; runner acknowledgement at a batch boundary or interruption does.
- SQL conditional status updates prevent pause/cancel/completion races from overwriting cancellation or reopening admission before worker acknowledgement.
- No automatic crash recovery or job takeover. A hard crash can leave `Running` or `Cancelled` with null `FinishedAt`; manual reconciliation is required.
- Limitation: existing `Paused` does not distinguish a requested pause from an acknowledged pause. Cancel after a paused runner already exited can remain `Cancelled` with null `FinishedAt`, blocking the project until reconciliation. This is the root-approved fail-closed choice for no-schema v1.
- Never automatically resend an unknown result. No provider/refund behavior or new business rules are introduced.

## Ownership and implementation ledger

- Contract survey: `gpt-5.6-sol`, reasoning `medium`; read-only, no child.
- Database design/risk ruling: `gpt-6.1-sol`, reasoning `high`; no child.
- Backend writer `/root/direct_rules_backend`: `gpt-6.1-sol`, reasoning `high`; no nested agent. Owns backend source/tests and this INDEX/BACKEND pair.
- Backend reviewer `/root/direct_rules_backend_review`: `gpt-6.1-sol`, reasoning `high`; independent, no child.
- Frontend writer `/root/direct_rules_frontend`: `gpt-5.6-sol`, reasoning `medium`; no child.
- Frontend reviewer `/root/direct_rules_frontend_review`: `gpt-5.6-sol`, reasoning `high`; independent, no child.
- Runtime owner `/root/direct_rules_runtime`: root-dispatched `gpt-5.6-sol`, reasoning `medium`; owns dedicated SQL/runtime resources and evidence, not production service implementation.
- Documentation sync `/root/direct_rules_docs_sync`: `gpt-5.6-sol`, reasoning `low`; no child.
- Final reviewer `/root/direct_rules_final_review`: `gpt-6.1-sol`, reasoning `high`; independent, no child.
- Copy-fix writer `/root/direct_copy_fix`: `gpt-5.6-sol`, reasoning `medium`; no child.
- Copy-fix closure reviewer `/root/direct_closure_review`: `gpt-5.6-sol`, reasoning `medium`; independent, no child.
- Every dispatched agent used the Sol family within the approved ceiling; no Astra or nested child was used.
- No schema changes. Existing migrations are applied only by runtime owner to `FormAutoHub_DirectRule_Safety_20261101` on the local default SQL instance. Existing application DB/config is preserved.

## Plan and acceptance

1. Approved contract/no-schema root ruling and DB review: recorded above.
2. Backend DTO/controller, shared admission/runner, generation reuse and tests: implemented; see [BACKEND](BACKEND.md).
3. Frontend rules-only direct action and unchanged AI flow: separate writer/report.
4. Runtime owner: SQL concurrency/transaction tests, owned API/web restarts, authenticated safe HTTP and browser smoke, persistence and logs.
5. Independent review of final immutable base plus working snapshot; fix and recheck findings before local Done.

Acceptance includes counts 1/100 and rejected 0/101, empty command, wrong owner/project, invalid/missing/unsupported rules, x1 partial/zero credit, stable replay, competing command/common route, sequential batch boundary, unknown-result fence, explicit common confirmation, cancellation acknowledgement, and AI preview preservation.

## Validation and next action

- Verified 2026-11-01: backend RED 3 existing safety regression cases and RED 20 direct cases before implementation; later cancellation/provider-fault RED then GREEN.
- Verified initially: backend focused 24 direct cases; direct plus persistence regression run 38/38. B1 correction: actual SQL RED 10 failures / 2 passes, then focused direct/unit/SQL/persistence GREEN 58/58, zero skipped, on the dedicated safety DB. The 20 SQL cases include durable rejection logs, wrong-owner privacy, replay, rollback, concurrency and cancellation.
- Verified: Release solution build exit 0. Full backend before final diagnostics-only adjustment: 315 passed, 12 SQL methods skipped (6 existing normalization methods, 6 direct SQL methods; opted-in theory expands concurrency cases).
- Verified backend: focused 58/58, zero skipped, including 20 actual SQL cases; initial runtime SQL concurrency suite 8/8. The earlier broad backend snapshot passed 315 with 12 SQL methods skipped and is qualified by its recorded snapshot boundary. Release build passed.
- Verified frontend: affected combined Playwright 30/30 before F2 round 2; focused direct spec 17/17 on the final correction; final lint and production build passed with only recorded outside-scope warnings.
- Verified independent review: backend B1 rereview passed; frontend F1–F4 rereview passed; final code/spec review matched all 24 frozen hashes and found no unresolved Critical/Important finding.
- Verified runtime: real auth against the owned API/isolated SQL DB, safe loopback fake receiver rather than Google, B1 HTTP 400 plus durable zero-credit SQL audit, wrong-owner 404 privacy, stable replay without a second receiver call, and final browser behavior including fixture-only analysis, actual rule save/direct commit, same-command recovery after an injected transport reset, 42 chunks HTTP 200, no page errors, AI preview without direct send, and a 390px mobile viewport.
- Verified final runtime SQL/log/resources: the completed job had total/success 1/1, one -1 debit, one submitted generated response, two usage rows totaling one credit with zero failures, one successful submission log, and balance 4. The intentional reset and expected absent-AI-profile 404 were diagnosed in bounded logs. Owned ports 7042/3020/18081 were released; the dedicated evidence DB, screenshots, and synthetic fixtures remain preserved.
- Verified final copy correction: Rules metadata/toast/editor helpers now describe direct create-and-send while AI retains preview/confirmation. Focused RED 1 then GREEN 3/3, affected Playwright 35/35, lint/build exit 0, and fresh mocked-browser production runtime recorded 32/32 chunks HTTP 200 with no console/page errors. See [COPY_FIX](COPY_FIX.md) and independent [COPY_FIX_REVIEW](COPY_FIX_REVIEW.md).
- Not run: real Google submission, paid AI provider, deployment, commit, push, migration/schema change, or release.
- Verified: `git diff --check` exit 0. Existing NU1603 Google Forms package version-resolution warning remains; dependency files were not changed.
- SQL command: set `FORMAUTO_DIRECT_SQL_SERVER=.` and `FORMAUTO_DIRECT_SQL_DATABASE=FormAutoHub_DirectRule_Safety_20261101`, then `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --filter DirectRuleSubmissionSqlServerTests --no-restore -v minimal`.
- Local closure: independent copy-fix review found no unresolved Critical/Important finding and accepted the snapshot as Done locally. The user may decide whether to commit/integrate it. Commit, push, deployment, production verification, cleanup, and release remain separate authorization/events; selective staging must inventory untracked artifacts and secret-check `src/FormAutoHub.Api/artifacts/` rather than staging the whole dirty tree automatically.
