# Task 1 — Proposed SQL Server / EF Core design and risk review

> Current authority (2026-11-05): Task 1 independent reviews R1–R3 and user approval of L1/L2/P1/O1 plus reviewed contracts/schema are recorded in [PROGRESS](PROGRESS.md). Tasks 2–6 are authorized for local implementation and validation in the isolated worktree. Earlier proposal/pending wording below preserves design history; it does not reopen approved decisions. No production activation, live provider, commit or deployment authority is inferred.

Status: **Author proposal and self-review, not independent DB approval.** [Contracts](CONTRACTS.md), [cutover](CUTOVER.md), [spec](INDEX.md) govern interpretation. No migration, SQL connection or data change was performed. New tables/columns/constraints below require review before Tasks 2–5.

## Source evidence and smallest persistence change

Read `Entities/GeneratedResponse.cs`, `SubmissionJob.cs`, `SubmissionLog.cs`, `UserCreditAccount.cs`, `CreditTransaction.cs`, `FormProject.cs`, `AiGenerationRun.cs`, `AiGenerationRunItem.cs`, `Data/FormAutoHubDbContext.cs`; services CreditService, CreditWriteTransaction, SubmissionAdmission, ResponseGenerationService, AiGenerationService and DirectRuleSubmissionService. Current account precision is decimal(18,2) and RowVersion is configured. The model has no unique UserCreditAccount.UserId index and no reservation model. Current admission locks project before preparation; this must change consistently, not be combined with account-first code.

Use four core new tables plus the legacy evidence table below, additions to existing response/job/log tables and a unique account-owner index. Do not add an account Reserved counter: compute outstanding sum under the account lock, avoiding duplicate sources of truth. Keep GeneratedResponses/payloads and audit physically present on eviction. Do not rewrite old ledger/pricing. EF-generated migration/designer/snapshot only after authorization; do not edit old migrations.

## Exact proposed physical schema

Notation: `!` NOT NULL, `?` NULL. Guid=`uniqueidentifier`; UTC=`datetimeoffset(7)`; money=`decimal(18,2)`; hash=`char(64)` lowercase SHA-256 with binary collation. All PKs are explicitly allocated Guid, no NEWID defaults; all new enum strings are `varchar`, lengths given below, exact values in CONTRACTS. All new FKs use NO ACTION/Restrict, including user/project/batch/item/ledger/log/audit links. No cascading ledger/audit deletion. Existing unrelated schema is unchanged.

### GenerationBatches

| Fields | SQL type/nullability |
|---|---|
| Id (PK), UserId, ProjectId | Guid ! |
| Mode | varchar(16) ! (`rules|ai-default|ai-custom`) |
| PricingPolicy | varchar(24) ! (`SeparatedV1|LegacyBundledV1`) |
| RequestedCount, GeneratedCount, GenerationCredits | int ! |
| CreatedAt | UTC !; durable generation completion time |
| EvictedAt | UTC ?; logical reuse removal only |
| FormName | nvarchar(200) !; immutable name snapshot |
| FormUrl, FormActionUrl | nvarchar(2048) ! each |
| ObservedMetadataJson | nvarchar(max) !; metadata observed at creation, may have unknown required/constraints/receipt, no provider secrets |
| ObservedMetadataSha256 | hash ! |
| AiGenerationRunId | Guid ?; null for rules |
| LegacyGroupingEvidence | nvarchar(1000) ?; required for imported legacy group |

FK UserId->Users.Id, `(ProjectId,UserId)`->FormProjects `(Id,UserId)` alternate key, AiGenerationRunId->AiGenerationRuns.Id. Alternate key `(Id,ProjectId)` for response membership. Filtered unique AiGenerationRunId where nonnull prevents one AI run importing twice. Index `(UserId,CreatedAt DESC,Id DESC) WHERE EvictedAt IS NULL` includes ProjectId/Mode/counts/GenerationCredits/PricingPolicy; separate ProjectId index. CHECK `1<=GeneratedCount<=RequestedCount<=100`, GenerationCredits>=0, and for SeparatedV1 GenerationCredits=GeneratedCount*(0/1/2 by Mode). CreatedAt immutable; imported legacy completion time must be proven, never guessed from neighboring response timestamps.

### GeneratedResponses additions (existing columns preserved)

| Added fields | SQL type/nullability |
|---|---|
| GenerationBatchId | Guid ? (unproven/unbatched legacy remains null) |
| BatchOrdinal | int ?; 0..99, present exactly when batch ID present |
| PricingPolicy | varchar(24) ? during migration; new rows require SeparatedV1 |
| LegacyEntitlementState | varchar(24) ? (`Available|Claimed|Consumed|ReconciliationRequired|NotApplicable`) |
| LegacyClaimItemId | Guid ? |
| LegacyEvidenceReference | nvarchar(1000) ?; backfill manifest/evidence identity |

Composite FK `(GenerationBatchId,ProjectId)`->GenerationBatches `(Id,ProjectId)`; FK LegacyClaimItemId->SubmissionJobItems.Id. Alternate key `(Id,ProjectId)`; index GenerationBatchId, unique `(GenerationBatchId,BatchOrdinal)` filtered nonnull. CHECK both batch fields null or both nonnull; Claimed iff claim ID present, except reconciliation may retain a claim; claim ID otherwise null. SeparatedV1=>NotApplicable; LegacyBundledV1=>Available/Claimed/Consumed/ReconciliationRequired. Null policy never grants free send or reuse, it fences pending classification. Service validates ordinal < batch.GeneratedCount, owner/policy consistency, count <=100 and immutable membership/payload; new feature does not add response editing.

### SubmissionJobs additions

| Added fields | SQL type/nullability |
|---|---|
| UserId, CommandId, GenerationBatchId | Guid ? (nullable for unclassified old jobs) |
| RequestFingerprint | hash ? |
| ContractVersion | int ? |
| RouteKind | varchar(16) ? (`selected|direct`) |
| PricingPolicy | varchar(24) ? |
| RunnerAcknowledgedAt | UTC ? |
| RowVersion | rowversion ! |

For v2: CommandId=Id, ContractVersion=2, owner/fingerprint/route/policy mandatory; batch mandatory except proven unbatched legacy recovery. Existing Status/Total/counts/times remain. Unique `(UserId,CommandId)` filtered CommandId nonnull; nonclustered index key `(ProjectId,RunnerAcknowledgedAt)` INCLUDE `(Status)` for the active-job query. Existing `Status` is `nvarchar(max)`: it is an included non-key column, never an index key; no narrowing/type migration is proposed. The full active predicate below (including item-state EXISTS and legacy handling) is evaluated under the ordered locks; this supporting index does not enforce one active job. FKs `(ProjectId,UserId)`->FormProjects `(Id,UserId)`, GenerationBatchId->GenerationBatches.Id. Alternate key `(Id,ProjectId)` for item consistency. The account/project transaction enforces one active job; do not invent a filtered Status index that cannot express all legacy/control conditions. Paused remains active until cancelled/acknowledged; no resume endpoint is introduced.

### SubmissionJobItems (one item = one non-repeatable attempt)

| Fields | SQL type/nullability |
|---|---|
| Id (PK), JobId, ProjectId, ResponseId | Guid ! |
| GenerationBatchId | Guid ? for unbatched legacy |
| Ordinal | int !; execution order 0..99 |
| PayloadJson, ObservedMetadataJson, CompatibilityEvidenceJson | nvarchar(max) ! each; immutable payload, creation observation, and complete pre-send evidence |
| CompatibilityCheckedAt | UTC ! |
| FormActionUrl | nvarchar(2048) !; immutable validated target |
| PayloadSha256, ObservedMetadataSha256, CompatibilityEvidenceSha256 | hash ! each |
| PricingPolicy | varchar(24) ! |
| MaximumSendCredits | int !; 0 (claimed prepaid) or 1 (paid) |
| AttemptState | varchar(24) !; exact enum CONTRACTS |
| SettlementState | varchar(24) !; exact enum CONTRACTS |
| CreatedAt | UTC ! |
| PossibleDispatchAt, OutcomeAt | UTC ? |
| SettlementCreditTransactionId | Guid ? |
| RowVersion | rowversion ! |

FK `(JobId,ProjectId)`->SubmissionJobs `(Id,ProjectId)`, `(ResponseId,ProjectId)`->GeneratedResponses `(Id,ProjectId)`, GenerationBatchId->GenerationBatches.Id, SettlementCreditTransactionId->CreditTransactions.Id. Unique `(JobId,Ordinal)` and `(JobId,ResponseId)`; unique filtered SettlementCreditTransactionId nonnull; index `(ResponseId,AttemptState)`; index JobId. Payload/target/source IDs/ordinal/price never mutate. State/timestamps/settlement link change only with append-only events in the same local transaction. Application verifies selected response membership, price and batch relationship before snapshot insert. No automatic second attempt per item, including after server restart.

CHECK Ordinal 0..99; MaximumSendCredits in(0,1); paid settlement states Held/Settled/Released iff price1, prepaid states PrepaidHeld/PrepaidConsumed/PrepaidReleased iff price0. Ledger ID nonnull iff Settled. PossibleDispatchAt nonnull for PossibleDispatch/Unknown/Succeeded/Rejected; no dispatch timestamp for Planned/NotDispatched. Unknown stays Held/PrepaidHeld. Succeeded iff Settled/PrepaidConsumed; Rejected/NotDispatched iff Released/PrepaidReleased. These cross-field constraints are mandatory in the generated migration, not just DTO validation.

### CreditReservations

| Fields | SQL type/nullability |
|---|---|
| Id (PK), UserId, JobId | Guid ! |
| InitialAmount, OutstandingAmount, SettledAmount, ReleasedAmount | money ! |
| CreatedAt | UTC ! |
| ClosedAt | UTC ?; null while any item held, including prepaid claims |
| RowVersion | rowversion ! |

FK UserId->Users.Id, JobId->SubmissionJobs.Id; unique JobId; index `(UserId,ClosedAt)` INCLUDE OutstandingAmount. A zero-credit reservation exists for an all-prepaid job to link evidence. CHECK amounts >=0 and InitialAmount=OutstandingAmount+SettledAmount+ReleasedAmount; amounts integral for this send policy. Service verifies InitialAmount=sum(item.MaximumSendCredits), OutstandingAmount=sum(price of Held items), item owner/job matches reservation, ClosedAt only when no Held/PrepaidHeld items. Cross-table invariants require transaction/SQL tests; ordinary CHECK cannot query other rows.

### CreditReservationEvents (append-only attempt/reservation evidence)

| Fields | SQL type/nullability |
|---|---|
| Id (PK), ReservationId | Guid ! |
| ItemId, EvidenceId, CreditTransactionId, ActorUserId | Guid ? |
| Sequence | int !, monotonic within reservation |
| Kind | varchar(32) ! (`Reserved|PrepaidClaimed|PossibleDispatch|OutcomeUnknown|Settled|Released|PrepaidConsumed|PrepaidReleased`) |
| OutstandingDelta, SettledDelta, ReleasedDelta | money ! |
| AttemptStateAfter, SettlementStateAfter | varchar(24) ?; required with ItemId |
| EvidenceCode | varchar(64) ? |
| ClassifierVersion | varchar(32) ? |
| ArtifactReference | nvarchar(512) ?; opaque reference, no raw HTML/secrets |
| ArtifactSha256 | hash ? |
| ObservedAt | UTC ? |
| Reason | nvarchar(1000) ? |
| CreatedAt | UTC ! |

FK ReservationId->CreditReservations.Id, ItemId->SubmissionJobItems.Id, CreditTransactionId->CreditTransactions.Id, ActorUserId->Users.Id. Unique `(ReservationId,Sequence)`; unique `(ItemId,EvidenceId)` filtered both nonnull; filtered unique `(ItemId)` for Kind IN('Settled','Released','PrepaidConsumed','PrepaidReleased') ensures one terminal financial event. Index ItemId and EvidenceId; service validates event ownership/job and sequential state. Reservation creation emits one Reserved(+1) or PrepaidClaimed(0) event/item. Settlement emits (-1,+1,0); release (-1,0,+1); prepaid/unknown/dispatch events have zero deltas. Terminal outcome evidence requires EvidenceId/code/classifier/reference/hash/ObservedAt; operator resolution additionally ActorUserId+Reason. No UPDATE/DELETE through services; contradictions require investigation, never overwriting old evidence.

### Ledger/log/account integrity additions

- CreditTransactions: filtered unique `(ReferenceId)` WHERE Type='CreditUsed' AND ReferenceType='SubmissionJobItem' AND ReferenceId IS NOT NULL; paid settlement uses ReferenceId=item.Id and Amount=-1. Reverse link on item plus uniqueness prevents two ledgers/attempt or one ledger/two items. Existing generation reference types and historical rows unchanged. Zero-credit/prepaid success does not call DeductUsageCreditsAsync(0) or create a zero ledger.
- SubmissionLogs: add ItemId Guid ? FK NO ACTION; filtered unique ItemId nonnull (one aggregate compatibility log/item). Existing legacy log Status retains approved Success/Failed values; Item.AttemptState and events determine certainty, never Failed or ErrorMessage. Reconciliation changes the projection only with immutable event evidence.
- UsageLogs: one new settlement usage row/paid item, CreditsUsed=1; prepaid success usage CreditsUsed=0. Add SubmissionItemId Guid ? FK NO ACTION and filtered unique nonnull. Generation usage charges actual 0/1/2 only; aggregate completion usage has 0 CreditsUsed and must not duplicate monetary totals.
- UserCreditAccounts: unique UserId index after duplicate-owner preflight; RowVersion and decimal(18,2) retained. No automatic merge of duplicate balances; conflicting rows block migration. FormProjects alternate key `(Id,UserId)` and GeneratedResponses/SubmissionJobs alternate keys above preserve cross-owner/project FKs. Check existing orphans before adding any FK; no silent deletion/repair.

## Job projection, active predicate and lifecycle invariants

`SubmissionJobItems` is the source of per-attempt certainty; `SubmissionJobs` is a projection updated in the same local transaction as each item terminal event. For v2, `SuccessCount = count(Succeeded with Settled|PrepaidConsumed)`, `FailedCount = count(Rejected with Released|PrepaidReleased)`, and separate projections `UnknownCount`, `NotDispatchedCount`, `HeldCount` are required. Legacy jobs without item rows retain old counters/status as display-only and never become v2 evidence.

- Exact status/time/active-job matrix is normative in [CONTRACTS](CONTRACTS.md#job-lifecycle-and-active-project-mapping). FinishedAt is operational termination time for Completed/Failed/Cancelled after runner acknowledgement, including a stopped Unknown; Paused keeps null. Reservation.ClosedAt remains null while any hold/claim remains. Reconciliation updates counters and financial projection, preserving operational status/FinishedAt.
- Active v2: same owner/project AND (Status Pending/Running/Paused OR RunnerAcknowledgedAt NULL OR any item's AttemptState PossibleDispatch/Unknown OR SettlementState Held/PrepaidHeld). An Unknown after runner stop blocks that project even with Failed/Cancelled + FinishedAt; unrelated projects can spend only Available. Paused requires explicit cancel. Legacy predicate/counters remain unchanged through drain; never fabricate v2 certainty.
- Add v2 projection columns `UnknownCount int?`, `NotDispatchedCount int?`, `HeldCount int?` to SubmissionJobs (null for legacy); for v2 all nonnull >=0 and each derived from items under parent locks. Success/Failed/Unknown/NotDispatched counts sum to Total when no Planned/PossibleDispatch remain; HeldCount is a financial overlay, not an extra response count. Item events and counter/runner acknowledgement changes commit atomically; a status enum alone never authorizes release.

## Lock order, transaction and retry boundaries

Every path that changes Balance, reservations, entitlement, batch eligibility or relevant job control uses one order: **Users(UserId) -> UserCreditAccounts(UserId) -> FormProjects(ProjectId) -> GenerationBatches(Id) -> GeneratedResponses/SubmissionJobItems(Id)**. Lock multiple IDs in SQL-defined ascending order; job/reservation/event rows are acquired only after these parent locks. Read immutable IDs first without write locks to discover parents, then acquire order and revalidate. Never retain a project lock while requesting an account lock. Include all spend paths (AI, rules/direct and send/settlement), topup/manual grants touching account, cancellation and eviction; PayOS semantics remain unchanged.

Users row `UPDLOCK,HOLDLOCK` serializes a missing account as well as retention at zero balance; unique account index prevents duplicate create. Existing accounts get the same locks/RowVersion checks. Fractional Available is preserved; affordable count uses floor(Available/unit fee); free rules never divides by zero or requires positive balance. No account-local SemaphoreSlim is an SQL correctness mechanism.

- Generation: allocate response IDs and AI RunId outside retries; call AI outside any transaction/retry. Revalidate Available at local commit; atomically batch+responses+generation ledger+usage+retention. If funds disappeared, persist failure audit only, no reusable run/debit/eviction; never replay AI to resolve SQL. Proposed idempotent batch identity = first response ID in the caller's fixed generation order (all response IDs allocated once before retry); AppendBatchAsync re-reads that ID and checks exact membership/fees on replay. This avoids hidden ambient IDs while preserving its planned signature. Nonmatching existing batch=>conflict. Zero response input rejected before deriving ID.
- Admission: read-only compatibility before transaction; in transaction acquire all ordered locks, recheck fingerprint/eligibility/active job/Available, insert job+immutable items+reservation/events and claim legacy entitlements. Direct rules generation/batch/retention are part of the same transaction. Only the original request with acknowledged commit may run; execution-strategy retry/lost commit acknowledgement returns durable status read-only, never starts or takes over a runner.
- Before call: save PossibleDispatch+event and create SubmissionLog in a short local transaction. Only an acknowledged transition authorizes one call. If its commit acknowledgement is lost, do not call; leave uncertain durable state for reconciliation. Google I/O occurs outside SQL/EF retries. Stop on Unknown; unattempted remaining items release only after runner acknowledgement.
- Settlement: lock ordered parents and item, fresh-read outcome/ledger/evidence key. Atomically terminal outcome+unique debit via dedicated credit service+balance/TotalUsed+reservation deltas+event+submission/usage projections. ConfirmedRejected or proven NotDispatched releases without debit/refund; Unknown records evidence, changes no money. Persist with bounded cancellation-independent diagnostic token after request cancellation. If commit acknowledgement is lost, fresh context looks up item/ledger/event; replay is local SQL only.
- Retention: account lock serializes batch append/admission; assign completion time once and keep newest20, evict others in same transaction. If admission wins, snapshots/holds survive later eviction; if eviction wins, new admission fails. No physical delete or cascade. Failed append rolls back eviction.
- EF execution strategy wraps only local SQL transactions and re-reads on every retry (`ChangeTracker.Clear`/fresh context). Stable IDs and unique facts identify lost commits; RowVersion alone cannot establish idempotency. InMemory cannot verify this design.

## Exact transition matrix

| Durable prior | Trigger/evidence | Durable next + accounting |
|---|---|---|
| none | admitted new command | Planned/Held or Planned/PrepaidHeld; immutable snapshot/event; reserve1 or claim prepaid0 |
| Planned | acknowledged pre-call transaction | PossibleDispatch; keep hold/claim; one call allowed to original runner |
| Planned | runner stopped, proven no dispatch | NotDispatched/Released or PrepaidReleased; release1 or restore entitlement |
| PossibleDispatch | verified confirmation | Succeeded/Settled (debit1) or PrepaidConsumed (debit0, entitlement Consumed), atomically |
| PossibleDispatch | verified rejection | Rejected/Released or PrepaidReleased; release1/restore claim, no debit |
| PossibleDispatch | transport/body/cancellation/crash uncertainty | Unknown/Held or PrepaidHeld; no release; stop/fence |
| Unknown or abandoned PossibleDispatch | authorized reliable success/non-success reconciliation | same terminal success/rejection paths; exact evidence key, actor/reason; no provider call |
| terminal | same fact replay | read existing terminal+ledger; no new charge/event/provider call |
| terminal | contradictory fact | conflict and investigation; no overwrite or automatic compensation |

Pause/cancel before runner acknowledgement changes job control only. After acknowledgement Planned items release; PossibleDispatch/Unknown retain hold/claim. Paused jobs remain active until explicit cancel/acknowledgement; the released items cannot resume under the old command. Existing Failed job/log status never releases unknown. ClosedAt requires every item terminal; RunnerAcknowledgedAt can exist while unknown funds remain held.

Legacy entitlement Available->Claimed at admission; Claimed->Consumed only with Succeeded in the same transaction. Confirmed rejection/NotDispatched restores Available if no previous success. Unknown keeps claim and fence. Consumed never reopens; a later paid resend failure does not restore the first-use entitlement. For legacy unknown with no known claim, ReconciliationRequired blocks sends until authorized evidence sets Available/Consumed. Decision L1 remains unapproved.

## Risks and required SQL proof before implementation completion

**High:** current success/parser evidence cannot authorize financial settlement; activation gate in CUTOVER. **High:** account-first migration must cover every writer, or deadlocks/overspend remain. **High:** legacy certainty/grouping and prepaid claims cannot be inferred from timestamps/status text. **Medium:** no physical purge means storage remains unbounded by 20 slots; Deferred separately.

Required tests: balance10 reserve7 =>10/7/3; success1=>9/6/3, reject1=>9/5/4, unknown stays; select10 with7 success/2 rejection/1 unknown=>debit7/held1. Same-command replay/different-command conflicts; two projects and concurrent AI/send; zero/fractional/missing accounts; prepaid claim race and success/reject/unknown replay; lost commit acknowledgements at admission/pre-call/settlement; append21/concurrent retention/eviction admission race; pause/cancel in flight. Apply future migration to clean and populated owned SQL Server DB, verify ledger/log counts unchanged, orphans/duplicates blocked, all unique/FK/check constraints and audit survival. Run safe receiver-call count checks independently of DB; no live Google needed. Task 1 only documents these gates; none ran.

## Legacy no-hold reconciliation persistence

A pre-cutover attempt with no durable item/reservation uses append-only `LegacyAttemptEvidence` (fifth proposed table, never a hold): `Id Guid! PK`, `UserId Guid!`, `ProjectId Guid!`, `ResponseId Guid!`, `LegacySubmissionLogId Guid?`, `LegacyEvidenceHash char(64)!`, `OutcomeKind varchar(24)!` (ConfirmedSuccess|ConfirmedRejected|Unknown), `EntitlementState varchar(24)!`, `EvidenceId Guid!`, `EvidenceCode varchar(64)!`, `ClassifierVersion varchar(32)!`, `ArtifactReference nvarchar(512)!`, `ArtifactSha256 char(64)!`, `ObservedAt datetimeoffset(7)!`, `ActorUserId Guid!`, `Reason nvarchar(1000)!`, `CreatedAt datetimeoffset(7)!`. Hashes are lowercase/binary-collated as above; reason nonblank. Exact FKs NO ACTION: UserId/ActorUserId->Users.Id, `(ProjectId,UserId)`->FormProjects `(Id,UserId)`, `(ResponseId,ProjectId)`->GeneratedResponses `(Id,ProjectId)`, LegacySubmissionLogId->SubmissionLogs.Id. Index `(ResponseId,CreatedAt,Id)`; unique `(ResponseId,EvidenceId)` for replay; filtered unique `(ResponseId,LegacyEvidenceHash)` WHERE OutcomeKind IN('ConfirmedSuccess','ConfirmedRejected') for one terminal classification per immutable legacy attempt identity. Unknown evidence can append before terminal; it never occupies that terminal unique key.

`LegacyEvidenceHash` hashes the fixed pre-cutover response/log identity and source manifest facts (not the new outcome evidence). Same identity + same EvidenceId/facts returns the existing row/result; reused EvidenceId with changed facts or contradictory terminal evidence=>conflict. Reconciliation of an already-terminal identity reads its result and does not append a later Unknown. Missing log identity requires independently reviewed manifest proof for that response's attempt; absence of a log alone never proves no send. Validate that no v2 item/hold belongs to the target attempt; otherwise use normal item settlement. No fabricated item/reservation is inserted.

Under the common Users/account->project->batch/response lock order, append evidence plus AuditLog (actor/action/reference/reason) and update response entitlement/fence atomically, with stable IDs outside SQL retry. Reliable prior success consumes prepaid entitlement. Confirmed non-success restores Available only after L1 approval, no earlier success, and all legacy attempts have been classified; otherwise preserve ReconciliationRequired. Any unresolved legacy attempt keeps the response fenced even if another known success already consumes entitlement. Do not alter old SubmissionLogs, legacy job counters/status, account balances, TotalUsed, UsageLogs or CreditTransactions. Tooling/operator authority remain Deferred; no provider call, retroactive hold/debit/refund.

## Observation versus compatibility evidence

`ObservedMetadataJson` is an honest creation-time snapshot and may explicitly carry `Required=null`, missing validation constraints, unsupported question types, incomplete receipt capability or parser provenance. It is useful for history display/reuse eligibility only; it is never treated as a send receipt or complete form proof. `CompatibilityEvidenceJson` is a separate, versioned, read-only refresh captured before admission and contains only facts actually observed (no fabricated required/constraints/receipt). Missing facts make the compatibility result false and the send `409`; they do not invalidate the already-created batch or hide it from history.
