# Task 1 — Proposed cutover and reconciliation gates

> Current authority (2026-11-05): Task 1 independent reviews R1–R3 and user approval of L1/L2/P1/O1 plus reviewed contracts/schema are recorded in [PROGRESS](PROGRESS.md). Tasks 2–6 are authorized for local implementation and validation in the isolated worktree. Earlier proposal/pending wording below preserves design history; it does not reopen approved decisions. No production activation, live provider, commit or deployment authority is inferred.

Status: **Proposal; rehearsal, migration, operator writes and activation are not authorized by Task 1.** Links: [contracts](CONTRACTS.md), [DB design](DB_REVIEW.md), [approved scope](INDEX.md). No physical purge, NCKH, identity/auth redesign, official Google Forms API, new provider, background worker, commit or deployment.

## Legacy classification and grouping

Preserve the pre-cutover ledger/usage/submission/AI records byte-for-byte; do not refund, recalculate historical prices or revise Balance/TotalUsed. Old rules generation cost1, AI Option2/3 cost2/3 includes the proposed prepaid first-success benefit; new creation is0/1/2 plus successful send1. Store policy on batch, response and admitted item; never deduce it from today's price or browser storage.

| Proven legacy evidence | Proposed entitlement/send policy |
|---|---|
| Valid stored response with bundled creation debit provenance; no attempt evidence after drain | Available: first confirmed success prepaid0; subsequent successful sends1. |
| Reliable previous success, linked to this response | Consumed: every new successful resend1. Existing Success status alone is insufficient because old client accepted2xx/302. Ambiguous evidence=>reconciliation. |
| Confirmed rejection, no previous success | **L1 user decision:** recommend Available; consume prepaid entitlement only on first confirmed success. Not adopted until reviewed/approved. |
| Possible invocation, unfinished log, timeout, ambiguous Failed/Success, missing evidence | ReconciliationRequired; no new send, no automatic free retry/debit/release. Existing pre-cutover unknown may have no monetary hold; do not invent a retroactive hold or debit. |
| Missing pricing provenance or contradictory owner/ledger/log evidence | Quarantine from new reuse/send; preserve read-only owner recovery and audit until authorized resolution. |

No grouping by close timestamps, identical payloads, UI selection or current project is allowed. Candidate proof:

- AI: exact distinct response IDs through AiGenerationRunItems.GeneratedResponseId (items are per-question, so deduplicate), one owner/project, valid completed run counts/timestamps and ledger reference to that AiGenerationRun. Verify missing/duplicate links, partial/zero-output audit, fees, question snapshot and known completion time. Zero valid output never imports a run.
- Direct rules: a command/job plus complete persisted membership evidence and generation debit provenance may prove a run. SubmissionLog includes attempted responses only; a paused/crashed job may omit never-attempted generated responses, so logs alone cannot prove full membership. A ledger reference to job/first response does not enumerate the rest.
- Ordinary rules: one ledger referring to the first response and nearby timestamps is insufficient to establish a group. Leave GenerationBatchId null; do not create one-response synthetic runs or invent completion times merely to fit the quota.

Prepare an idempotent, reviewed backfill manifest keyed by source evidence IDs, with response membership, owner/project, proven completion time, policy, entitlement basis, evidence hash and exclusion reason. Import each provable nonempty run once; use deterministic batch identity (first proven response in explicit manifest order) and preserve source AI RunId separately. Per user select newest20 proven imported runs with the same SQL time/ID order; mark older ones evicted. No ledger/AI audit copying or recharging. Unbatched but individually proven legacy responses retain narrow owner preview/first-use recovery; this does not grant generalized new history membership. Physical storage remains outside this quota.

## Quiesce/drain sequence (future authorized operation)

1. Record immutable source SHA/snapshot, reviewed schema/contracts/decisions, server/DB identity, process/account/operator ownership and restoration plan. Verify backup/restore under separate operational permission. Starting API may apply migrations: never start against an unapproved DB to inspect behavior.
2. Fence all old generation and send admission, including direct rules, old tabs and simultaneous API instances; show maintenance/upgrade response. Keep owner GET polling available. A frontend-only switch is insufficient. Do not run old bundled and new separated pricing writers together.
3. Drain in-flight AI creation to a durable audit/result under old pricing or proven precommit rollback; inventory all active Pending/Running/Paused/Cancelled-without-ack jobs and attempted/unattempted items. Do not kill an unknown process or mark calls rejected merely to finish drain.
4. Wait for runner acknowledgement and durable outcomes for sent items. Unknowns require evidence classification; do not replay a provider call. Remaining unattempted items can be stopped only with proof/acknowledgement. Inventory legacy unknowns separately from future monetary holds. If state cannot be classified, keep the affected path fenced; production activation requires the reviewed exclusion/reconciliation policy and no unsafe old runner.
5. Preflight duplicate accounts, orphans, counts and evidence. Under authorized migration, add reviewed nullable columns/new tables first, run deterministic backfill manifest, verify constraints/indexes and required nonnull v2 data; retain old rows. Stop on any discrepancy; no automatic merge/delete.
6. Independently verify imported membership/entitlements/newest20 per account, original ledger/account/audit totals, holds/events/item invariants and both owner access paths. Rehearse lost commit acknowledgement and rollback using synthetic receiver/fake AI; compare provider call counts and fresh SQL reads.
7. Restart only owned runtimes on the reviewed version/schema, smoke User/wrong-owner/Admin/no-session routes and history/resend/direct-rules controls. Verify UI reload/session switch, chunks/hydration and API logs. Keep live provider disabled until evidence/operational reconciliation gate passes. Review activation evidence before separately authorized enablement; Task1 does not release.

If rollback is needed, fence writes again. Once new holds/settlements exist, do not restart old writers or execute a destructive Down migration: they do not understand Available or prepaid claims. Prefer forward repair; restore only under separate reviewed recovery authorization with external-outcome reconciliation. Preserving backup alone cannot undo a Google submission.

## Old clients, recovery and session behavior

- v2 send/direct requests require ContractVersion2. Unknown/missing version with a new command=>409 ClientUpgradeRequired; do not reinterpret the old bundled-price request. Same v2 command uses current owner GET/replay and never re-executes. Old direct command replay with no fingerprint is GET-only recovery; POST=>409, including a changed Count. This intentionally tightens the current test that ignores changed count.
- Future web resume envelope: `version:2`, `userId`, `projectId`, `batchId|null`, `commandId|null`, response IDs and server-derived fee/display snapshot. No browser balance/fee/payload/confirmation is authority. Version1 or unversioned preview IDs must be re-fetched through owner recovery; require a fresh explicit AI/history confirmation before a new command. A previously issued command first uses GET; never auto-POST on mount/reload/reconnect/topup return.
- Legacy command IDs from user-scoped local storage (currently DirectRuleCommandContext) are read-only recovery hints. Missing/unknown job does not prove no dispatch; do not silently retry generation/send. Report server state; request a new deliberate action only after eligibility/uncertainty review.
- Logout/user switch clears in-memory history, selection, payloads and pending confirmation, aborts stale reads, keys cache by authenticated user/session and re-fetches owner data. Do not import another user's legacy local-storage snapshot; do not delete unrelated/unreadable evidence. Never restore accepted confirmation from storage.
- Existing owner preview recovery may remain for individually proven unbatched legacy data, subject to compatibility and entitlement. Evicted batched responses are unavailable through either old or new history routes. Existing admitted job snapshots and GET status remain readable after eviction.

## Reconciliation proposal (operator tooling Deferred)

No public mutation endpoint or automatic worker is proposed. Implementation/tooling and operator rights require separate review/authorization before production activation. Read-only job polling cannot decide financial outcomes. Lack of an operator or evidence does not become permission to release funds.

Accepted success evidence must uniquely link the v2 item/attempt or legacy response/log/manifest identity, form identity and immutable payload to a reliably acknowledged/received result. Accepted non-success evidence must prove no accepted response (e.g. durable acknowledged no-dispatch before provider I/O, or a reviewed definitive validation rejection). A visible matching answer row alone may be ambiguous among duplicate payloads; an absent row/count difference, elapsed time, screenshot, user assertion, HTTP status, error text or old Failed flag is insufficient. Core has no official Google response receipt/read capability. Do not assume owner response exports always identify an attempt, grant new OAuth scopes or call NCKH/official Forms APIs to manufacture proof.

Operator procedure when separately authorized:

1. Freeze the selected v2 item or legacy response/log identity and its new-send eligibility and verify actor role/right, owner, payload/form hashes, pre-call event, provider trace and prior outcome/settlement evidence. Read artifacts from controlled internal storage; never fetch a client-supplied URL or log tokens/raw sensitive answers.
2. Record reviewed evidence ID, classifier/version, artifact reference+SHA256, observed time, actor UserId and nonblank reason (max1000); immutable event append. A reviewer must attest that the source can distinguish this attempt from duplicates; if not, retain Unknown.
3. For existing v2 item/reservation use SettleAttemptAsync with ordered locks and exact evidence key: success debits its own held credit or consumes prepaid claim; proven rejection releases only its own hold/claim. For legacy no-hold with no item/reservation use ReconcileLegacyAttemptAsync(LegacyAttemptIdentity, VerifiedSubmissionOutcome), never SettleAttemptAsync: validate owner/project/response/log-or-reviewed-manifest/hash, append immutable LegacyAttemptEvidence+AuditLog and update entitlement/fence atomically. No fabricated item/reservation/retroactive hold/debit. Success consumes already-approved entitlement; confirmed non-success can restore only with L1 approved and no earlier success/unresolved legacy attempt; Unknown keeps fence. Tooling and operator mutation remain Deferred. Neither path calls provider, refunds or edits historical ledger.
4. Fresh-read event/item/reservation/account/ledger/usage/submission projections and compare invariants. Repeated same evidence returns existing result. Contradictory terminal facts are a conflict; stop for separately authorized investigation, never overwrite/auto-compensate.
5. Preserve access-controlled evidence and review record. Re-enable only reconciled response eligibility. No TTL, automatic resend, automatic release or runner takeover. If evidence cannot resolve an unknown, funds/claim stay held and path stays fenced; notify through approved product UI, not new external messages.

**Operational limit:** synthetic receipts/receiver-call counts validate software but do not prove real Google delivery. If safe success/non-success evidence cannot be established for supported real forms, paid sending activation remains Blocked. A broader refund/manual goodwill policy is a new financial decision; none is invented here.

## Compact decisions for root/user review

| ID | Recommendation and reason | Consequence/gate |
|---|---|---|
| L1 (new financial decision) | Retain prepaid first-success benefit after confirmed legacy failure without prior success; preserves already-paid first-use total. | Explicit user approval before entitlement consumers/backfill; unknowns remain fenced. |
| L2 (technical/transition policy) | Import only proven complete groups; keep proven unbatched legacy recovery; quarantine uncertain rows, never guess timestamps or historical outcome certainty. | User review of excluded legacy reuse and incomplete historical certainty; manifest/SQL rehearsal before cutover. |
| P1 (provider evidence/support) | Restrict sends to fully verified public-form metadata and reviewed confirmation/rejection evidence; fail closed otherwise. | No reliable receipt is currently established. User reviews reduced supported coverage; independent safety review and real-flow evidence before paid sending activation. Generation/history remain in approved scope. |
| O1 (operational decision) | Approve scoped operator authority and evidence rubric/tooling separately; Unknown never expires automatically. | Authorize accountable reconciliation capability before activation, or keep sending disabled. No endpoint/worker permission follows from this document. |

Review route: root presents these concrete paired artifacts after fresh independent contract/DB/safety review; the author does not ask the human or mark decisions approved. Required financial gates remain Blocked until an explicit decision is recorded. Canonical API/entity/architecture docs stay unchanged in Task1; approved changes may be proposed there later.

Old-generation guard: both unchanged generation APIs require the v2 header defined in CONTRACTS after admission reopens. This is checked server-side on every instance; old generation tabs receive409, not new prices under an old UI. No additional generation confirmation is introduced for rules.

## Round 1 clarification: creation observation and job stopping

Backfill/import records creation-time ObservedMetadataJson as observed, including Required=null and unknown constraints/receipt, without pretending the old parser knew false/absent facts. Incomplete compatibility/receipt does not block creation/history retention; it blocks send admission only. A fresh full CompatibilityEvidence snapshot is captured separately at each new send admission and copied immutably into job items, never fabricated from old batch metadata.

The normative lifecycle/active predicate is in [CONTRACTS](CONTRACTS.md#job-lifecycle-and-active-project-mapping): runner acknowledgement is distinct from financial closure. A stopped Unknown may have Failed/Cancelled + FinishedAt but still fences that project and holds Reserved; other projects see reduced Available. Legacy no-hold unknown fences affected response eligibility, while old active jobs must still be drained/classified before cutover; do not invent v2 hold/counters/runner acknowledgement for them. Rehearsal must test these distinctions, including no-item legacy replay/conflict and creation/history succeeding with incomplete metadata.

Operational record requirement: every drain/finalization/reconciliation report must include exact RunnerAcknowledgedAt and FinishedAt values (or explicit null) and evaluated active-project predicate; do not infer them from Status text.

## Task6 local rehearsal record — 2026-11-05

The guarded Safety SQL rehearsal used deterministic API5305/web3305. See [VALIDATION](VALIDATION.md), [HANDOFF](HANDOFF.md), and [implemented supplement](../../GENERATION_HISTORY_CONTRACT.md). Ordinary production-config selected/direct sends fail closed with 409 FormEvidenceUnavailable and no job, hold or provider invocation. Synthetic receiver calls are labelled and do not prove Google delivery.

`task6-cutover-transitions.jsonl` records synthetic v2 success/rejection/Unknown after runner stop. Each preserves Failed and exact RunnerAcknowledgedAt/FinishedAt; success settles1 once, rejection releases1, Unknown leaves Reserved1 and an active fence. Same evidence replay is read-only; changed facts and missing actor reason are rejected. The no-hold legacy case has RunnerAcknowledgedAt=null, FinishedAt=2026-11-05T16:47:27.174296+00:00, LegacyActive=false and OutcomeUnresolved; no invented hold/group/ledger rewrite.

Root ruling: proposed `ILegacyAttemptReconciliationService.ReconcileLegacyAttemptAsync` is absent; operator mutation/backfill is Deferred and was not implemented. Legacy mutation/import and real Google receipt classification remain Blocked. No timestamp grouping, production cutover, admission reopen or activation occurred.
