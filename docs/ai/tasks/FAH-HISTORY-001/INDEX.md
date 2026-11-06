# FAH-HISTORY-001 — Generation history and separated pricing specification

> Current status: **Done, accepted by user**. Cleanup/local commit authorized; see [CLOSEOUT](CLOSEOUT.md). Older review/resource entries below are historical.

> Current authority (2026-11-05): Task 1 independent reviews R1–R3 and user approval of L1/L2/P1/O1 plus reviewed contracts/schema are recorded in [PROGRESS](PROGRESS.md). Tasks 2–6 are authorized for local implementation and validation in the isolated worktree. Earlier proposal/pending wording below preserves design history; it does not reopen approved decisions. No production activation, live provider, commit or deployment authority is inferred.

## Status, authority and workspace

- Date: 2026-11-04. User approved this written specification in the conversation; implementation is not yet authorized.
- User approved the conversational design: reuse generated data, separate generation/send pricing, 20 runs per user, automatic oldest eviction and credit reservation before sending.
- Authoring snapshot: main, HEAD df5cce54f4a8516ab9dd0bf2b5dff561c1cb8d5c; clean git status before these files.
- Root is author; no independent review or agent dispatch. No commit/remote/deployment permission granted for this task.
- Authorized writes: paired task specification and implementation plan in docs/ai and docs/vi. No canonical contract or product source edits.
- No processes started, DB accessed, providers called or application data changed. Preserve existing data/evidence.
- Paired copies: [AI](../../../ai/tasks/FAH-HISTORY-001/INDEX.md), [VI](../../../vi/tasks/FAH-HISTORY-001/INDEX.md).

## Goal and approved decisions

Users can view and resend the complete data of their latest 20 generation runs. The quota applies across the account, not separately per project.

- Each run retains the existing 1–100 response limit.
- Rules generation: 0 credits per response.
- Default AI generation: 1 credit per response.
- Custom AI generation: 2 credits per response.
- Every successful Google Forms send: 1 credit per response, including deliberate resends of previously successful responses.
- AI creation charges apply only to newly generated data, not reuse.
- Reserve enough credits for the selected responses before sending. Settle successes only; release confirmed failures.
- Unknown outcomes remain reserved pending reconciliation, without automatic resend.
- A 21st run automatically evicts the oldest from reusable history; credit and submission records remain.
- Resending is a new explicitly confirmed user action with a duplicate-data warning.

Example: generating 10 default-AI responses costs 10. Seven successful sends cost another 7; three failures incur no send debit. Successfully retrying those three costs 3. Deliberately resending all ten successfully costs another 10, without calling AI or charging generation again.

## Source-verified baseline

- GeneratedResponse stores ProjectId, PayloadJson, PreviewText, Source, Status, IsReadOnly and CreatedAt; there is no common rules/AI generation group.
- ResponseGenerationService currently charges 1 for rules generation. AiGenerationService currently charges x2/x3 for AI creation.
- GET /api/projects/{projectId}/responses verifies ownership and reads selected IDs or the entire project; it is not paginated.
- SubmissionService currently charges no send fee and rejects responses no longer Previewed or already having SubmissionLog evidence.
- DirectRuleSubmissionService has read-only command replay and one-action rules generation/send.
- SubmissionAdmission uses a local admission transaction and SQL Server project lock; provider calls are outside execution-strategy retries.
- UserCreditAccount has Balance, TotalUsed and RowVersion, but no credit reservations.
- AI analytics reads AiGenerationRuns; creditsUsed must continue representing actual generation expenditure after cutover.

Sources: [response generation](../../../../src/FormAutoHub.Api/Services/ResponseGenerationService.cs), [submission](../../../../src/FormAutoHub.Api/Services/SubmissionService.cs), [admission](../../../../src/FormAutoHub.Api/Services/SubmissionAdmission.cs), [direct rules](../../../../src/FormAutoHub.Api/Services/DirectRuleSubmissionService.cs), [AI generation](../../../../src/FormAutoHub.Api/Services/AiGenerationService.cs), [EF model](../../../../src/FormAutoHub.Api/Data/FormAutoHubDbContext.cs).

## Alternatives and recommended approach

1. Recommended: add a shared generation group and durable credit reservation; reuse GeneratedResponses, jobs and logs. Additional schema supports both modes, concurrency and crash recovery.
2. Infer groups from timestamps/browser state: less schema but unreliable boundaries, retention and cross-device behavior; fails requirements.
3. Debit everything upfront and refund failures: reuses current debits but introduces refund semantics rather than the approved reservation model; not selected.

## Workflow and ownership

- ResponseGeneration and EF Core persist groups and responses; AI integration generates data without Google submission.
- CreditManagement owns pricing, reservation, available balance and settlement through the dedicated credit service.
- Submissions owns admission, attempts and outcomes; Integrations.GoogleForms owns external calls.
- Controllers own HTTP, DTOs contracts, and Next.js history, pricing, preview/confirmation and results.
- Rules Option 1 keeps one Tạo và gửi ngay action without a preview UI or second confirmation. Its generated data is retained for reuse.
- AI Options 2/3 retain preview and explicit send confirmation. History resends require explicit confirmation for each new send.
- Maximum 100 responses/job, sequential batches of 10, one active job/project.
- Each deliberate resend uses a new command/job. Retrying the same command only reads the original result, without another send/debit.
- Pause/cancel releases definitely unattempted reservations only after the runner stops; never release an in-flight attempt.

## Generation groups and retention — Proposed

These choices seek specification approval; final table/field names are not established contracts.

- A group has identity, owner/project, timestamp, mode, requested/generated counts, generation fee, form/question snapshot and immutable response links.
- Only successful creation with at least one valid response occupies a slot. Partial creation retains valid responses; zero-output failures retain audit only.
- Proposed Assumption: each successful generation request is one run; topping up and requesting additional creation produces a new run, without implicit merging.
- Twenty slots apply account-wide, ordered by durable completion time with a stable identity tie-breaker. A SQL transaction serializes per-user insertion/eviction to prevent concurrent quota overflow.
- Eviction removes API/UI availability and rejects new reuse admission; hiding UI alone is insufficient.
- Admitted jobs hold immutable selected payload snapshots. Eviction does not remove active-job data, reservations or reconciliation evidence.
- Do not cascade-delete ledger, logs or AI audit. Removal means loss of reuse access, not destruction of every trace.
- Deferred: physical payload deletion after eviction and raw AI audit retention need separate policy. A 20-slot quota does not bound all storage.
- Validate form compatibility before sending; incompatible structure/entry IDs blocks sending and requires a new run rather than silently rewriting stored responses.

## Reservations and settlement — Proposed persistence

- Balance remains the posted ledger balance; available = Balance minus outstanding reservations.
- A reservation constrains spending separately from debit/refund; creating/releasing one does not increase TotalUsed. Preserve immutable evidence of reservation changes.
- Every spending path, including AI generation and other projects, must check available funds using the same account lock/RowVersion mechanism; changing send alone is insufficient.
- Admission atomically persists command/job, selected payload snapshots and reservation. Reject insufficient funds for the complete selected set; UI allows a smaller selection without silently changing it.
- Direct rules retains the current affordable-subset behavior, reserving send fees instead of charging generation.
- Persist the attempt before the external call. Do not wrap Google/AI calls in SQL transactions or execution-strategy retries.
- Each successful outcome settles in one transaction: persist attempt outcome, create exactly one 1-credit CreditUsed debit through credit service, reduce the outstanding reservation, update Balance/TotalUsed and UsageLogs.
- Unique settlement per attempt and admission per command prevent replay from increasing debits/provider calls.
- Confirmed failure atomically persists outcome and releases its reservation without a debit.
- Timeout/disconnect/crash after possible Google invocation keeps that attempt reserved, records uncertainty and forbids automatic retry. Exact fields/statuses require review; Failed alone cannot prove Google did not receive data.
- Reliable reconciliation evidence determines one-time successful settlement or release for proven non-success. No timeout-based automatic release.
- Deferred: exact operator tooling and trustworthy reconciliation evidence sources. Resolve before production activation to avoid permanently stranded reservations.
- Google and SQL have no shared transaction: exactly-once delivery is not promised. Provider success followed by persistence failure fences the attempt pending reconciliation.
- Reservations/active jobs survive eviction from visible history.

## API, UI and compatibility — Proposed

- Add owner-scoped list/detail of reusable runs; server-paginated list with stable order. Detail has at most 100 responses and excludes raw provider audit.
- Retain existing rules/AI generation routes and intentionally extend responses with run identity and actual creation fees.
- Resends require an idempotent command, response IDs from the same eligible run/project and user confirmation. Merely removing SubmissionService's resend guard is insufficient.
- Each attempt belongs to a new job with immutable payload; GeneratedResponse status cannot replace multiple-send history.
- UI shows available/reserved funds, creation fee, maximum send fee and actual settlement; dashboard/credit history/AI analytics do not count reservations as expenditure.
- History shows form name, mode, time, count and send outcomes; supports viewing payloads, selecting responses, confirming resends and warning about automatic oldest eviction.
- Final routes, DTOs, HTTP errors, schema/status transitions and presentation are completed during contract/DB review before product code. Speculative names are not published contracts.
- Do not change NCKH, identity auth, PayOS or official Google Forms integration policy.

## Legacy transition — Proposed, requires approval

Legacy data already paid bundled 1/2/3 creation pricing. Charging another 1 for its first send would yield 2/3/4, violating the unchanged first-use total.

Recommendation:
- Do not recalculate balances, refund or rewrite historical ledger.
- Legacy responses with no recorded attempt retain their original first-send entitlement without another send debit; subsequent resends after that success use the new fee.
- Legacy unknown attempts require reconciliation before any further send; no automatic free retry.
- Legacy previously successful responses pay 1 for each new successful resend.
- Do not infer old rules groups from timestamps. Import into the 20-run quota only when grouping is proven; otherwise do not enable new reuse by default. Preserve necessary API/preview recovery and audit data.
- Cutover stops old generation/send admission, drains/reconciles existing jobs and in-flight creation, snapshots pricing policy per response/job and verifies schema before enabling the new workflow. Do not run both pricing semantics concurrently.
- Deferred: exact migration/backfill and treatment of legacy confirmed failures with no previous success; finalize before cutover planning.

## Implementation acceptance and verification

Task6 evidence: [VALIDATION](VALIDATION.md), [HANDOFF](HANDOFF.md), [TASK6_REPORT](TASK6_REPORT.md). The [implemented local contract supplement](../../GENERATION_HISTORY_CONTRACT.md) records owner/version/fee/hold boundaries and distinguishes Deferred legacy tooling.

- Verify 1–100 responses, generation fees 0/1/2, zero-output AI failure with no debit and partial fees only for valid persisted responses.
- Twenty-one and concurrent runs yield exactly 20 account-wide slots; failed creation does not evict; expired reuse is blocked while logs/active snapshots survive.
- New sends/resends: successful count matches debits, failures release, unknown stays held, double-click/replay never duplicates send/debit.
- Real SQL Server: concurrent projects and AI creation on the same account never overspend; rollback, lost commit acknowledgement, crash and idempotent reconciliation cases.
- Migrations against clean DB and populated baseline preserve audit/ledger and prevent legacy double charges.
- JWT API ownership/Admin boundaries, list/detail, validation, expired history and fee projections.
- Separate mocked browser and real API/DB evidence: reload/relogin, selection, fees, history, AI confirmation, rules direct, keyboard/mobile, chunks/hydration and errors.
- Restart owned runtimes, verify actual schema, safe loopback providers, HTTP and logs. No unapproved live Google or paid AI calls are required.
- Independent review is required for credit/migration/submission safety before implementation completion; author rereading is not independent review.

## Self-review and next action

- Self-review distinguishes approved decisions from proposals, current source prices from requested prices and avoids implied schema/status/refund approval.
- Main risks: legacy double charging, cross-workflow overspend, long-lived unknown reservations, eviction destroying active data and misclassifying Google HTTP responses as success. These are verification/review gates.
- Verified: read-only source/docs and workspace inspection; structural/UTF-8/link validation is performed separately at authoring completion.
- Not run: build/tests/browser/DB/provider because this is specification-only. Independent review Not run; required during technical design/implementation with appropriate authorization.
- No commit, product changes, implementation or release.
- Written-spec approval received. Next: review the [implementation plan](IMPLEMENTATION_PLAN.md) and select an execution method; no code or dispatch before that decision. Spec-Deferred technical/financial decisions remain Task 1 gates.
