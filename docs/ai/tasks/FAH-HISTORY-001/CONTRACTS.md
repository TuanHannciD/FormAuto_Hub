# Task 1 — Proposed contracts

> Current authority (2026-11-05): Task 1 independent reviews R1–R3 and user approval of L1/L2/P1/O1 plus reviewed contracts/schema are recorded in [PROGRESS](PROGRESS.md). Tasks 2–6 are authorized for local implementation and validation in the isolated worktree. Earlier proposal/pending wording below preserves design history; it does not reopen approved decisions. No production activation, live provider, commit or deployment authority is inferred.

Status: **Proposal for review; no production authority.** Read [approved specification](INDEX.md), [DB proposal](DB_REVIEW.md) and [cutover gates](CUTOVER.md). All new names below are proposed, including internal states; existing public job/log statuses are preserved. Tasks 2–5 must use the reviewed version, after financial decisions and independent review are resolved.

## Source and approved invariants

Read baseline: `Contracts/Phase3Dtos.cs`, `Phase6AiGenerateDtos.cs`; `Controllers/SubmissionsController.cs`, `GeneratedResponsesController.cs`; services `SubmissionService`, `SubmissionAdmission`, `DirectRuleSubmissionService`, `ResponseGenerationService`, `AiGenerationService`, `CreditService`; integration `GoogleFormsClient.cs` and `GoogleFormModels.cs`, all under `src/FormAutoHub.Api`.

- 20 reusable runs/account; each run has 1–100 responses; sending uses sequential batches of 10, one active job/project.
- Generation: rules 0, default AI 1, custom AI 2 credits/valid persisted response. Every successful send/resend costs 1, except the legacy prepaid first-success entitlement below.
- Rules keeps one **Tạo và gửi ngay** action without preview/second confirmation. AI requires preview and explicit confirmation. Each history resend requires new explicit confirmation and a duplicate-data warning.
- Balance is posted ledger balance; Available = Balance - Reserved. Reservation/release is neither expenditure nor refund. Credit/tool/submission actions retain their dedicated ledger/log ownership.

## Exact proposed routes and error boundary

All routes require authenticated context and owner-scoped SQL predicates. Admin has no implicit access to another user's data. Authorize before validation/audit tied to a project. Return the same 404 for missing/inaccessible resources. Never accept UserId or pricing authority from a client. Responses use `Cache-Control: no-store`.

| Route | Contract |
|---|---|
| `GET /api/generation-history?page=1&pageSize=10` | Account-wide eligible batches only; page integer >=1, pageSize integer 1..20; omitted defaults 1/10, invalid is 400. Page beyond last returns empty items with requested page. TotalItems <=20, TotalPages=ceil(TotalItems/PageSize), zero when empty. |
| `GET /api/generation-history/{batchId:guid}` | Owner's eligible batch, <=100 immutable responses ordered Ordinal ASC; absent, unowned or evicted =>404. |
| `POST /api/projects/{projectId:guid}/submissions/send` | Extend existing send request with command, batch and version below. Return extended existing SubmissionJobResponse, HTTP 200 for admission/replay. |
| `POST /api/projects/{projectId:guid}/submissions/send-rules-direct` | Existing one-action route; add ContractVersion=2 to CommandId/Count. Generate affordable subset, append its batch, snapshot/reserve/job in one local transaction. Count 1..100; zero affordable =>409. No confirmation field/second action. |
| `GET /api/projects/{projectId:guid}/submissions/jobs/{jobId:guid}` | Existing read-only owner polling; Job.Id=CommandId for new jobs, preserving direct command lookup. Include settlement data; never resume a runner. |
| existing job `/pause` and `/cancel` POST routes | Request control only; no release until runner acknowledgement. Unknown remains held. Unowned/missing =>404, invalid control transition=>409. |

`GET /api/projects/{projectId}/responses` remains an owner recovery route: eligible batches plus individually proven legacy recovery responses only. IDs from an evicted batch return 404 and are never re-exposed by an unfiltered project query. Unbatched legacy reads do not create history slots. Job payload snapshots are available through owner job status, not as reusable evicted responses.

List ordering and eviction share SQL Server `(CreatedAt DESC, Id DESC)` with a persisted UTC completion timestamp and SQL uniqueidentifier ordering (not .NET Guid comparison). A consistent read transaction produces count/page. Separate requests may see changes when a new run completes; stable ordering does not promise a cross-request snapshot.

## Exact DTO proposal

C# records below describe JSON camelCase, UTC DateTimeOffset values and JSON numbers for decimal credits. Existing GeneratedResponseResponse, GeneratedAnswerResponse and FormQuestionResponse remain defined by Phase3Dtos.cs.

```csharp
public sealed record CreditAvailabilityResponse(decimal Balance, decimal Reserved, decimal Available);
public sealed record HistoryOutcomes(int SuccessfulAttempts, int RejectedAttempts,
    int UnknownAttempts, int NeverAttemptedResponses);
public sealed record GenerationHistoryListItem(Guid BatchId, Guid ProjectId, string FormName,
    string Mode, DateTimeOffset CreatedAt, int RequestedCount, int GeneratedCount,
    int GenerationCredits, string PricingPolicy, HistoryOutcomes Outcomes);
public sealed record GenerationHistoryPageResponse(IReadOnlyList<GenerationHistoryListItem> Items,
    int Page, int PageSize, int TotalItems, int TotalPages);
public sealed record HistoryResponseItem(int Ordinal, GeneratedResponseResponse Response,
    bool PrepaidFirstSuccessAvailable, bool SendBlocked, string? BlockReason, HistoryOutcomes Outcomes);
public sealed record ObservedQuestionResponse(Guid? QuestionId, string? EntryId, string? QuestionType,
    bool? Required, IReadOnlyList<string>? Options, string? ConstraintsJson, string Provenance);
public sealed record FormObservationResponse(IReadOnlyList<ObservedQuestionResponse> Questions,
    string Completeness, string ReceiptCapability);
public sealed record GenerationHistoryDetailResponse(GenerationHistoryListItem Run,
    string FormUrl, FormObservationResponse Observation,
    IReadOnlyList<HistoryResponseItem> Responses, CreditAvailabilityResponse Credits);
public sealed record SendSubmissionRequest(int ContractVersion, Guid CommandId, Guid? BatchId,
    IReadOnlyList<Guid> ResponseIds, bool Confirmed, bool DuplicateWarningAccepted);
public sealed record DirectRuleSubmissionRequest(int ContractVersion, Guid CommandId, int Count);
public sealed record SubmissionItemResponse(Guid ItemId, Guid ResponseId, string AttemptState,
    string SettlementState, int MaximumSendCredits, int SettledCredits, string? EvidenceCode);
public sealed record SubmissionFeeResponse(Guid ReservationId, int MaximumSendCredits,
    decimal HeldCredits, int SettledCredits, decimal ReleasedCredits, int UnknownCount,
    int NotDispatchedCount, bool RunnerAcknowledged, CreditAvailabilityResponse Credits);
```

Extend existing SubmissionJobResponse with `CommandId: Guid?`, `ContractVersion: int?`, `BatchId: Guid?`, `Fees: SubmissionFeeResponse?`, `Items: IReadOnlyList<SubmissionItemResponse>`, `UnknownCount: int?`, `NotDispatchedCount: int?`, `HeldCount: int?`, `RunnerAcknowledgedAt: DateTimeOffset?`. Nullable fields identify legacy jobs without fabricated hold evidence. Keep existing Total/SuccessCount/FailedCount/Status/Logs; FailedCount counts confirmed rejections only. UnknownCount/NotDispatchedCount are distinct, so Total need not equal SuccessCount+FailedCount. No raw provider HTML, secrets or raw AI audit in any DTO. History outcomes count attempts, so resends can make successes exceed GeneratedCount.

Generation responses retain current fields. Add `GenerationBatchId: Guid?`, `GenerationFeePerResponse: int`, `Credits: CreditAvailabilityResponse` to GenerateResponsesResponse and AiGenerateResponsesResponse. Keep AI RunId as AiGenerationRun ID (not batch ID); CreditsUsed and Multiplier represent actual generation fees only (0/1/2), BalanceAfter remains posted balance. Zero valid output => null batch, 0 debit, no eviction. Partial output charges only valid committed responses. Existing DashboardSummary `CurrentCreditBalance` keeps posted meaning; add `ReservedCreditBalance` and `AvailableCreditBalance` decimal fields. AI analytics continues summing AiGenerationRuns.CreditsUsed; never include send fees or holds.

Modes on history/batch: `rules|ai-default|ai-custom`; map existing Source Rule/AI and AI Option2/Option3 without changing their existing enum values. PricingPolicy: `SeparatedV1|LegacyBundledV1`.

## Command and admission semantics

ContractVersion must be 2 for new commands. CommandId must be non-empty. Confirmed must be true for `/send`; DuplicateWarningAccepted must be true when any selected response has a prior attempt (and for the history resend UI). There is no client-supplied fingerprint or fee.

Server fingerprint = lowercase SHA-256 over UTF-8 JSON array, no whitespace, in this exact order: `[2, userIdD, projectIdD, routeKind, batchIdDOrNull, sortedResponseIdDArray, requestedCountOrNull, confirmed, duplicateWarningAccepted]`. GUIDs use lowercase D; sort IDs by ordinal text solely for fingerprinting; routeKind is `selected|direct`. For direct use empty IDs, requested Count, false/false. Direct also snapshots rules/form hash at admission, never re-generates on replay. Execution order is stored ordinal, independent of request ID order.

First verify project owner, then lookup CommandId. Same owner/project/route/fingerprint => read the original job (even evicted, unknown, cancelled, insufficient current balance, or form changed), without compatibility refresh, logging, hold, generation, provider call or runner takeover. Same owned command with different fingerprint/project=>409 CommandConflict. A global job-ID collision with another owner=>404; never overwrite it. Legacy commands lack a fingerprint: only owner GET recovery is allowed after cutover (see CUTOVER).

New selected admission requires 1..100 distinct non-empty IDs, complete membership in one eligible batch/project; no silent subset. BatchId=null is allowed only for proven unbatched legacy recovery with matching owner/project and policy. Mixed batches/legacy policies=>400; inaccessible IDs=>404; owned evicted batch=>409 HistoryExpired before membership lookup. Reserve total MaximumSendCredits after compatibility, under account lock. Insufficient Available=>409 InsufficientAvailableCredit; UI can explicitly choose fewer responses. Outstanding possible-dispatch/unknown attempt for any selected response=>409 OutcomeUnresolved, even with a new command or a different project/job status.

400: malformed body/version shape, count/IDs/confirmation/pagination. 404: ownership/missing resource. 409: unsupported old client (`ClientUpgradeRequired`), active job (`ActiveSubmissionJob`), expired history, incompatible/unsupported form (`FormIncompatible|FormEvidenceUnavailable`), insufficient available credit, command conflict, unresolved outcome or stale concurrent admission. Use ProblemDetails with `code` extension above, no private identifiers. Auth failures retain existing 401/403. Services return typed domain results/errors, controllers map HTTP.

## Job lifecycle and active-project mapping

Every v2 item is mapped to exactly one `SubmissionJob`; the job is the aggregate projection of its items. `SubmissionJob.Status` remains the existing `Pending|Running|Paused|Cancelled|Completed|Failed` vocabulary. `FinishedAt` is operational termination time (Completed/Failed/Cancelled), set with runner acknowledgement even if Unknown remains; Paused keeps FinishedAt null; `RunnerAcknowledgedAt` records that the runner stopped/handed back control and may precede `FinishedAt` for Paused; it does not resolve an Unknown item still held. v2 counters are derived separately: `SuccessCount` counts `Succeeded` with `Settled|PrepaidConsumed` items, `FailedCount` counts `Rejected` with `Released|PrepaidReleased` items only, and `UnknownCount`, `NotDispatchedCount`, `HeldCount` are persisted/read projections. Legacy jobs without item rows keep old counters/status as display-only history; they are never converted into v2 certainty.

| v2 item/settlement situation | SubmissionJob.Status | RunnerAcknowledgedAt / FinishedAt | Active project? |
|---|---|---|---|
| Admission committed, no acknowledged runner stop | Pending then Running | null / null | Yes |
| Runner stopped; every item Succeeded + Settled/PrepaidConsumed | Completed | stop time / stop time | No |
| Runner stopped; any Rejected/Released or NotDispatched/Released, no unresolved hold | Failed | stop time / stop time | No |
| Runner stopped; any PossibleDispatch/Unknown with Held/PrepaidHeld | Failed (unless Cancelled control already set) | stop time / stop time | Yes; hold and response/project fence remain |
| Pause requested, runner not yet acknowledged | Paused | null / null | Yes |
| Pause acknowledged; Planned items released, possible/unknown held | Paused | stop time / null | Yes, until explicit cancel; no resume introduced |
| Cancel requested, runner not yet acknowledged | Cancelled | null / null | Yes |
| Cancel acknowledged, unattempted released, any unknown held | Cancelled | stop time / stop time | Yes iff unresolved items remain |
| Later authorized reconciliation closes final Unknown | Preserve Failed/Cancelled (operational history); update counters/fees | unchanged / unchanged | No, unless Paused or another active job exists |

Exact v2 active predicate for the same owner/project: Status in Pending/Running/Paused OR RunnerAcknowledgedAt is null OR EXISTS item with AttemptState in PossibleDispatch/Unknown OR SettlementState in Held/PrepaidHeld. Evaluate under the common account->project locks. Legacy active predicate stays the current Pending/Running/Paused OR (Cancelled AND FinishedAt IS NULL), until cutover drain proves no old runner; no fictitious v2 counters/ack are backfilled. Paused jobs must be explicitly cancelled to clear their control fence. Unknown blocks new sends for the project and affected responses even after runner stop; unrelated projects are affected only by the account's outstanding Reserved. Same-command replay only reads. All counters/status/ack/finish writes occur in the corresponding local item/runner-finalization transaction; reconciliation never rewrites operational FinishedAt or pretends the original run completed normally.

Legacy no-hold attempts are a separate path: they may have no `SubmissionJobItem`, reservation or hold. They are never passed to `SettleAttemptAsync(itemId, ...)`.

## Internal types/interfaces for Tasks 2–5 (proposed freeze)

```csharp
public enum SubmissionOutcomeKind { ConfirmedSuccess, ConfirmedRejected, Unknown }
public enum SubmissionAttemptState { Planned, PossibleDispatch, Unknown, Succeeded, Rejected, NotDispatched }
public enum SubmissionSettlementState { Held, Settled, Released, PrepaidHeld, PrepaidConsumed, PrepaidReleased }
public sealed record SubmissionEvidence(Guid EvidenceId, string Code, string ClassifierVersion,
    string ArtifactReference, string ArtifactSha256, DateTimeOffset ObservedAt,
    Guid? ActorUserId, string? Reason);
public sealed record VerifiedSubmissionOutcome(SubmissionOutcomeKind Kind, SubmissionEvidence Evidence);
public sealed record CreditReservationResult(Guid ReservationId, decimal InitialAmount,
    decimal OutstandingAmount, CreditAvailabilityResponse Credits);
public sealed record SubmissionSettlementResult(Guid ItemId, SubmissionAttemptState AttemptState,
    SubmissionSettlementState SettlementState, Guid? CreditTransactionId,
    int SettledCredits, CreditAvailabilityResponse Credits);
```

Evidence construction is internal to the reviewed integration/reconciliation boundary, never accepted from public send JSON. ArtifactReference is an opaque internal reference, not a URL to fetch. Repeated EvidenceId with different facts=>conflict; contradictory terminal outcomes=>conflict/manual investigation. Stored terminal results are read-only on same-fact replay; reconciliation never calls Google.

```csharp
// ICreditReservationService; availability owner checked by calling workflow
Task<CreditAvailabilityResponse> GetCreditAvailabilityAsync(Guid userId, CancellationToken ct);
Task<CreditReservationResult> ReserveSubmissionAsync(Guid userId, Guid jobId,
    IReadOnlyList<Guid> itemIds, CancellationToken ct);
// ISubmissionSettlementService
Task<SubmissionSettlementResult> SettleAttemptAsync(Guid itemId, VerifiedSubmissionOutcome outcome, CancellationToken ct);
Task<bool> MarkPossibleDispatchAsync(Guid itemId, CancellationToken ct);
Task<CreditReservationResult> ReleaseUnattemptedAsync(Guid jobId, CancellationToken ct);
// ILegacyAttemptReconciliationService; no reservation/ledger mutation for legacy no-hold
Task<LegacyReconciliationResult> ReconcileLegacyAttemptAsync(LegacyAttemptIdentity identity,
    VerifiedSubmissionOutcome outcome, CancellationToken ct);
public sealed record LegacyReconciliationResult(Guid ResponseId, string EntitlementState,
    bool SendBlocked, Guid EvidenceId, bool AlreadyApplied);
// IGenerationBatchWriter
Task<Guid> AppendBatchAsync(Guid projectId, string mode, IReadOnlyList<GeneratedResponse> responses,
    int requestedCount, int generationCredits, CancellationToken ct);
// IGenerationHistoryService; owner from ICurrentUserContext
Task<GenerationHistoryPageResponse> GetMineAsync(int page, int pageSize, CancellationToken ct);
Task<GenerationHistoryDetailResponse?> GetDetailAsync(Guid batchId, CancellationToken ct);
// ISubmissionCompatibilityService; read-only provider analysis before admission
Task<SubmissionCompatibilityResult> CheckAsync(Guid projectId, Guid? batchId,
    IReadOnlyList<Guid> responseIds, CancellationToken ct);
public sealed record SubmissionCompatibilityResult(bool Compatible, string? RejectionCode,
    string ObservedMetadataJson, string CompatibilityEvidenceJson, string CompatibilityEvidenceSha256,
    DateTimeOffset CheckedAt);
public sealed record LegacyAttemptIdentity(Guid UserId, Guid ProjectId, Guid ResponseId,
    Guid? LegacySubmissionLogId, string LegacyEvidenceHash);
```

ReserveSubmissionAsync and AppendBatchAsync require caller's existing transaction/ordered locks; they stage changes, never commit/nest a transaction. Append's generationCredits is recomputed/validated server-side; responses/count/debit/retention commit together. SettleAttemptAsync owns a local retryable transaction after provider I/O; no nested transaction. Credit deduction checks Available everywhere; settlement consumes its own held unit, not Available again. One item is one attempt; resend creates a different item/job. See [DB_REVIEW](DB_REVIEW.md) for durable transitions and idempotency.

## Read-only compatibility and testable evidence

`GoogleFormsClient` currently falls back to entry-regex ShortText and sets Required=false even in public-data parsing; it skips unsupported types. A creation-time batch therefore stores only **ObservedMetadata**; it must not be labelled complete or send-compatible when required/constraint fields are unknown. `SubmitAsync` reads no body and returns Success on 2xx/302. Its actual result is GoogleFormSubmitResult(bool Success, string ErrorMessage) in `GoogleFormModels.cs`; this boolean cannot authorize a debit.

Creation and history remain allowed with incomplete ObservedMetadata (the UI marks unknown required/constraint/receipt facts and `SendBlocked=true`). Proposed send support criteria: authorized public HTTPS docs.google.com form; exact normalized form identity and formResponse action for that identity; complete supported question inventory with proven entry IDs/types/required flags/options and validation constraints; no fallback inference, omitted unsupported questions, file upload, authentication/captcha/one-response restriction, multi-page branching or unparsed constraints. These criteria limit supported sends; they do not authorize a general parser rewrite or restriction bypass. If the existing public parser cannot establish them, return FormEvidenceUnavailable without admission/hold/send.

Refresh before new admission; compare stored observed metadata with full entries/types/options/required/constraints and answer validity. Persist the resulting CompatibilityEvidence separately from ObservedMetadata; missing evidence blocks only send admission, not creation/history. Missing/duplicate/changed IDs, type/options/required/constraints or unsupported metadata=>409. Presentation-only label/title change may be ignored; order is stored for display, never used to remap answers. Never silently mutate snapshots or project questions. Recheck identity/hash before each batch of 10 using read-only refresh outside DB transactions; mismatch stops remaining items and releases only definitely unattempted items after runner acknowledgement. Google may change between check and POST; this unavoidable race is not an exactly-once guarantee.

| Evidence fixture | Classification/action |
|---|---|
| Complete final confirmation document for same form; reviewed structural confirmation marker and redirect chain match versioned classifier; no auth/error/challenge marker | Candidate ConfirmedSuccess only after reviewer approves sanitized fixture provenance; settle once. No such fixture has been established by Task 1. |
| Recognized validation rejection document for same form, with reviewed semantics proving non-acceptance | ConfirmedRejected; release once. Generic status/error wording is insufficient. |
| HTTP 200 login/error, 302 accounts/login/unknown target, unrecognized success-looking text, malformed/truncated body, timeout/disconnect/cancellation, 4xx/5xx without proven rejection semantics | Unknown after possible dispatch; hold, fence response, stop runner. |
| Pre-call compatibility/payload failure and durable proof no dispatch transition occurred | NotDispatched; no provider call; release after acknowledgement. |
| Provider returned success but outcome commit/ack is uncertain | Re-read durable item/ledger in fresh context; if not provable terminal, keep PossibleDispatch/Unknown held; never send again. |

Task 4 must capture redirect chains without following arbitrary targets or automatic POST retry/307/308 replay; explicitly validate supported HTTPS host/path before every outbound hop. Fixture tests must cover body and redirect negatives as well as positives, unchanged/changed metadata and incomplete parser evidence. A marker is evidence of an acknowledged submission flow, not a reliable per-response Google receipt. Synthetic receiver fixtures prove implementation mechanics only. **Production paid sending is Blocked until supported real-flow evidence and reconciliation adequacy are reviewed; generation/history scope remains approved.** Official Forms API, live calls and automated receipt lookup remain outside this task.

## Legacy entitlement boundary

Known unattempted legacy response retains prepaid free first success; reliably known previous success means every later successful send costs 1. Unknown requires reconciliation before any new send. Existing Failed/Success flags alone are not trustworthy receiver evidence because of current boolean classification; ambiguous attempts stay fenced.

**Decision L1 requiring user review:** retain the prepaid first-success entitlement for confirmed legacy failure with no prior success. Recommendation: yes; preserve the already-paid first-use total (legacy 1/2/3). Claim entitlement at admission, consume atomically only on confirmed success, restore on confirmed non-success; unknown retains claim/fence. No refund/rewrite of old ledger. This is a new proposal for a spec-Deferred case, not an adopted rule. [CUTOVER](CUTOVER.md) records the other decision gates.

Generation compatibility guard (proposed): retain existing rules/AI generation URLs and request bodies, but require `X-FormAuto-Contract-Version: 2` for new generation writes after cutover; missing/unsupported header =>409 ClientUpgradeRequired, before provider/debit/generation. This fences old clients that cannot interpret 0/1/2 creation fees. MarkPossibleDispatchAsync owns the short ordered-lock transaction and returns true only to the original runner after a first acknowledged transition; false never authorizes a provider call. ReleaseUnattemptedAsync requires durable RunnerAcknowledgedAt, releases only Planned items/claims in one ordered-lock local transaction, and is idempotent; never releases PossibleDispatch/Unknown or resumes a paused job.

Legacy no-hold reconciliation is not a settlement: `ReconcileLegacyAttemptAsync` accepts LegacyAttemptIdentity plus immutable evidence, verifies owner/project/response/log identity, and appends an idempotent audit/evidence record. Confirmed success consumes the approved prepaid entitlement, confirmed non-success restores only after L1 approval and every prior attempt is classified without success (otherwise keeps the fence), and Unknown keeps `ReconciliationRequired`; it never creates a reservation, CreditTransaction, or retroactive ledger edit. Same evidence replays read-only; conflicting evidence returns conflict. Operator tooling remains Deferred.

Observation DTO rules: Completeness=`Partial|Complete` describes only known creation metadata, never admission approval; ReceiptCapability=`Unknown` until independently established. Required=null and ConstraintsJson=null mean unobserved, not false/no constraints. Options=null is unknown, empty means proven no options. Existing FormQuestion.Required=false without trustworthy provenance maps to null. Generation/history do not require receipt or Complete compatibility evidence.

Legacy reconciliation owns a local SQL-only retryable transaction under the same parent lock order; ActorUserId and Reason are mandatory for that operator evidence, even though SubmissionEvidence permits null for automated integration outcomes. Stable evidence/audit IDs are allocated before retry. The hash identifies immutable legacy attempt source facts; it is not a Google receipt.
