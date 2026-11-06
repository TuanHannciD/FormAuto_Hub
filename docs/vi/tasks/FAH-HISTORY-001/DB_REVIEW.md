# Task 1 — Đề xuất SQL Server / EF Core và review rủi ro

> Thẩm quyền hiện tại (2026-11-05): Review độc lập Task 1 qua R1–R3 và việc người dùng duyệt L1/L2/P1/O1 cùng contract/schema đã review được ghi tại [PROGRESS](PROGRESS.md). Tasks 2–6 được phép triển khai và kiểm thử cục bộ trong worktree riêng. Các nhãn đề xuất/chờ duyệt bên dưới lưu lịch sử thiết kế, không mở lại quyết định đã duyệt. Không suy ra quyền kích hoạt production, gọi provider thật, commit hay deploy.

Trạng thái: **Đề xuất của tác giả và self-review, chưa phải DB approval độc lập.** [Contracts](CONTRACTS.md), [cutover](CUTOVER.md), [đặc tả](INDEX.md) quyết định cách hiểu. Không mở kết nối SQL, migration hay thay đổi dữ liệu. Bảng/cột/ràng buộc mới dưới đây phải được review trước Tasks 2–5.

## Bằng chứng source và thay đổi persistence nhỏ nhất

Đã đọc `Entities/GeneratedResponse.cs`, `SubmissionJob.cs`, `SubmissionLog.cs`, `UserCreditAccount.cs`, `CreditTransaction.cs`, `FormProject.cs`, `AiGenerationRun.cs`, `AiGenerationRunItem.cs`, `Data/FormAutoHubDbContext.cs`; các service CreditService, CreditWriteTransaction, SubmissionAdmission, ResponseGenerationService, AiGenerationService và DirectRuleSubmissionService. Account hiện precision decimal(18,2), có RowVersion. Model chưa có unique UserCreditAccount.UserId và reservation. Admission hiện lock project trước prepare; phải đổi nhất quán, không ghép code account-first ngược chiều.

Dùng bốn bảng core mới và bảng legacy evidence bên dưới, bổ sung bảng response/job/log hiện có và unique index owner account. Không thêm bộ đếm Reserved trên account: tính tổng outstanding dưới account lock để tránh hai nguồn sự thật. Giữ vật lý GeneratedResponses/payload/audit khi loại khỏi lịch sử. Không viết lại ledger/giá cũ. Chỉ tạo migration/designer/snapshot do EF sinh sau khi được phép; không sửa migration cũ.

## Schema vật lý chính xác đề xuất

Ký hiệu: `!` NOT NULL, `?` NULL. Guid=`uniqueidentifier`; UTC=`datetimeoffset(7)`; money=`decimal(18,2)`; hash=`char(64)` SHA-256 chữ thường collation nhị phân. PK Guid cấp rõ, không default NEWID; enum mới là `varchar`, độ dài dưới đây, giá trị exact ở CONTRACTS. Tất cả FK mới dùng NO ACTION/Restrict, gồm user/project/batch/item/ledger/log/audit. Không cascade xóa ledger/audit. Schema ngoài phạm vi không đổi.

### GenerationBatches

| Field | SQL type/nullability |
|---|---|
| Id (PK), UserId, ProjectId | Guid ! |
| Mode | varchar(16) ! (`rules|ai-default|ai-custom`) |
| PricingPolicy | varchar(24) ! (`SeparatedV1|LegacyBundledV1`) |
| RequestedCount, GeneratedCount, GenerationCredits | int ! |
| CreatedAt | UTC !; thời điểm hoàn tất tạo bền vững |
| EvictedAt | UTC ?; chỉ loại logic khỏi tái sử dụng |
| FormName | nvarchar(200) !; snapshot bất biến |
| FormUrl, FormActionUrl | nvarchar(2048) ! mỗi field |
| ObservedMetadataJson | nvarchar(max) !; metadata quan sát lúc tạo, required/constraint/receipt có thể unknown, không bí mật provider |
| ObservedMetadataSha256 | hash ! |
| AiGenerationRunId | Guid ?; null khi rules |
| LegacyGroupingEvidence | nvarchar(1000) ?; bắt buộc khi nhóm legacy import |

FK UserId->Users.Id, `(ProjectId,UserId)`->FormProjects `(Id,UserId)` alternate key, AiGenerationRunId->AiGenerationRuns.Id. Alternate key `(Id,ProjectId)` phục vụ membership. Filtered unique AiGenerationRunId khi khác null ngăn import AI run hai lần. Index `(UserId,CreatedAt DESC,Id DESC) WHERE EvictedAt IS NULL` include ProjectId/Mode/counts/GenerationCredits/PricingPolicy; index ProjectId riêng. CHECK `1<=GeneratedCount<=RequestedCount<=100`, GenerationCredits>=0 và SeparatedV1 phải bằng GeneratedCount*(0/1/2 theo Mode). CreatedAt bất biến; legacy chỉ dùng completion time có chứng minh, không đoán từ timestamp response lân cận.

### Bổ sung GeneratedResponses (giữ cột hiện có)

| Field | SQL type/nullability |
|---|---|
| GenerationBatchId | Guid ? (legacy chưa chứng minh giữ null) |
| BatchOrdinal | int ?; 0..99, có chính xác khi batch ID có |
| PricingPolicy | varchar(24) ? trong migration; row mới bắt buộc SeparatedV1 |
| LegacyEntitlementState | varchar(24) ? (`Available|Claimed|Consumed|ReconciliationRequired|NotApplicable`) |
| LegacyClaimItemId | Guid ? |
| LegacyEvidenceReference | nvarchar(1000) ?; identity manifest/bằng chứng backfill |

FK ghép `(GenerationBatchId,ProjectId)`->GenerationBatches `(Id,ProjectId)`; FK LegacyClaimItemId->SubmissionJobItems.Id. Alternate key `(Id,ProjectId)`; index GenerationBatchId; unique filtered `(GenerationBatchId,BatchOrdinal)` khi có giá trị. CHECK cả batch fields cùng null hoặc cùng nonnull; Claimed phải có claim ID, trừ reconciliation giữ claim; claim ID còn lại null. SeparatedV1=>NotApplicable; LegacyBundledV1=>Available/Claimed/Consumed/ReconciliationRequired. Policy null không tự cấp free send/reuse, chỉ fence. Service kiểm ordinal<batch.GeneratedCount, owner/policy/count<=100 và payload bất biến; không thêm sửa response.

### Bổ sung SubmissionJobs

| Field | SQL type/nullability |
|---|---|
| UserId, CommandId, GenerationBatchId | Guid ? (job cũ chưa phân loại) |
| RequestFingerprint | hash ? |
| ContractVersion | int ? |
| RouteKind | varchar(16) ? (`selected|direct`) |
| PricingPolicy | varchar(24) ? |
| RunnerAcknowledgedAt | UTC ? |
| RowVersion | rowversion ! |

v2: CommandId=Id, ContractVersion=2, owner/fingerprint/route/policy bắt buộc; batch bắt buộc trừ legacy recovery chưa nhóm có bằng chứng. Giữ Status/Total/count/time. Unique filtered `(UserId,CommandId)` khi có CommandId; nonclustered index key `(ProjectId,RunnerAcknowledgedAt)` INCLUDE `(Status)` hỗ trợ query active job. `Status` hiện là `nvarchar(max)`: chỉ là included non-key column, không phải index key; không đề xuất thu hẹp kiểu/migration Status. Predicate active đầy đủ bên dưới (gồm EXISTS trạng thái item và xử lý legacy) vẫn được đánh giá dưới lock đúng thứ tự; index hỗ trợ này không tự bảo đảm một job active. FK `(ProjectId,UserId)`->FormProjects `(Id,UserId)`, GenerationBatchId->GenerationBatches.Id. Alternate key `(Id,ProjectId)` cho item. Transaction account/project buộc một job active; không bịa filtered Status index không diễn tả đủ điều kiện legacy/control. Paused vẫn active đến cancelled/acknowledged; không thêm resume endpoint.

### SubmissionJobItems (một item = một attempt không lặp)

| Field | SQL type/nullability |
|---|---|
| Id (PK), JobId, ProjectId, ResponseId | Guid ! |
| GenerationBatchId | Guid ? cho legacy chưa nhóm |
| Ordinal | int !; thứ tự chạy0..99 |
| PayloadJson, ObservedMetadataJson, CompatibilityEvidenceJson | nvarchar(max) ! mỗi field; payload, observation lúc tạo và evidence trước gửi đầy đủ bất biến |
| CompatibilityCheckedAt | UTC ! |
| FormActionUrl | nvarchar(2048) !; target immutable đã kiểm |
| PayloadSha256, ObservedMetadataSha256, CompatibilityEvidenceSha256 | hash ! each |
| PricingPolicy | varchar(24) ! |
| MaximumSendCredits | int !; 0 (prepaid) hoặc1 (paid) |
| AttemptState | varchar(24) !; enum exact ở CONTRACTS |
| SettlementState | varchar(24) !; enum exact ở CONTRACTS |
| CreatedAt | UTC ! |
| PossibleDispatchAt, OutcomeAt | UTC ? |
| SettlementCreditTransactionId | Guid ? |
| RowVersion | rowversion ! |

FK `(JobId,ProjectId)`->SubmissionJobs `(Id,ProjectId)`, `(ResponseId,ProjectId)`->GeneratedResponses `(Id,ProjectId)`, GenerationBatchId->GenerationBatches.Id, SettlementCreditTransactionId->CreditTransactions.Id. Unique `(JobId,Ordinal)`, `(JobId,ResponseId)`; unique filtered SettlementCreditTransactionId khác null; index `(ResponseId,AttemptState)` và JobId. Payload/target/source ID/ordinal/price không đổi. State/time/settlement link chỉ đổi bằng event append-only cùng local transaction. Kiểm owner, price, batch trước insert snapshot. Không tự tạo attempt thứ hai khi restart.

CHECK Ordinal0..99; MaximumSendCredits thuộc {0,1}; paid state Held/Settled/Released khi price1, prepaid state PrepaidHeld/PrepaidConsumed/PrepaidReleased khi price0. Ledger ID khác null iff Settled. PossibleDispatchAt có ở PossibleDispatch/Unknown/Succeeded/Rejected; không có ở Planned/NotDispatched. Unknown giữ Held/PrepaidHeld. Succeeded iff Settled/PrepaidConsumed; Rejected/NotDispatched iff Released/PrepaidReleased. Các CHECK xuyên field phải ở migration, không chỉ DTO.

### CreditReservations

| Field | SQL type/nullability |
|---|---|
| Id (PK), UserId, JobId | Guid ! |
| InitialAmount, OutstandingAmount, SettledAmount, ReleasedAmount | money ! |
| CreatedAt | UTC ! |
| ClosedAt | UTC ?; null khi item còn held, kể cả prepaid claim |
| RowVersion | rowversion ! |

FK UserId->Users.Id, JobId->SubmissionJobs.Id; unique JobId; index `(UserId,ClosedAt)` INCLUDE OutstandingAmount. Reservation zero-credit vẫn tồn tại để nối evidence job all-prepaid. CHECK amount>=0 và InitialAmount=Outstanding+Settled+Released; số nguyên theo policy gửi. Service kiểm Initial=sum(item.Maximum), Outstanding=sum item held, cùng owner/job, ClosedAt chỉ khi không còn Held/PrepaidHeld. CHECK thường không query row khác nên invariant cross-table cần test transaction.

### CreditReservationEvents (evidence append-only)

| Field | SQL type/nullability |
|---|---|
| Id (PK), ReservationId | Guid ! |
| ItemId, EvidenceId, CreditTransactionId, ActorUserId | Guid ? |
| Sequence | int !, tăng trong reservation |
| Kind | varchar(32) ! (`Reserved|PrepaidClaimed|PossibleDispatch|OutcomeUnknown|Settled|Released|PrepaidConsumed|PrepaidReleased`) |
| OutstandingDelta, SettledDelta, ReleasedDelta | money ! |
| AttemptStateAfter, SettlementStateAfter | varchar(24) ?; bắt buộc khi có ItemId |
| EvidenceCode | varchar(64) ? |
| ClassifierVersion | varchar(32) ? |
| ArtifactReference | nvarchar(512) ?; opaque, không raw HTML/bí mật |
| ArtifactSha256 | hash ? |
| ObservedAt | UTC ? |
| Reason | nvarchar(1000) ? |
| CreatedAt | UTC ! |

FK ReservationId->CreditReservations.Id, ItemId->SubmissionJobItems.Id, CreditTransactionId->CreditTransactions.Id, ActorUserId->Users.Id. Unique `(ReservationId,Sequence)`; unique `(ItemId,EvidenceId)` filtered khi có cả hai; unique filtered `(ItemId)` cho Kind terminal `Settled|Released|PrepaidConsumed|PrepaidReleased` để một item chỉ một event tài chính. Index ItemId/EvidenceId; service kiểm owner/job và state nối tiếp. Reservation phát một event Reserved(+1) hoặc PrepaidClaimed(0)/item. Settlement=(-1,+1,0); release=(-1,0,+1); unknown/dispatch delta0. Terminal evidence bắt buộc EvidenceId/code/classifier/reference/hash/ObservedAt; operator resolution thêm ActorUserId+Reason. Service không UPDATE/DELETE; mâu thuẫn cần điều tra, không ghi đè.

### Integrity ledger/log/account

- CreditTransactions: unique filtered `(ReferenceId)` WHERE Type='CreditUsed' AND ReferenceType='SubmissionJobItem' AND ReferenceId IS NOT NULL; paid settlement ReferenceId=item.Id, Amount=-1. Link ngược item và uniqueness chặn hai ledger/một attempt hoặc một ledger/hai item. Generation/reference cũ giữ nguyên. Prepaid success không gọi DeductUsageCreditsAsync(0), không tạo ledger zero.
- SubmissionLogs: thêm ItemId Guid ? FK NO ACTION; unique filtered ItemId nonnull (một log aggregate/item). Status Success/Failed cũ giữ; Item.AttemptState/events mới quyết định certainty, không dựa Failed/ErrorMessage. Reconciliation chỉ đổi projection cùng event bất biến.
- UsageLogs: mỗi item paid thành công có một row settlement CreditsUsed=1; prepaid success=0. Thêm SubmissionItemId Guid ? FK NO ACTION và unique filtered. Generation usage chỉ 0/1/2; usage aggregate completion CreditsUsed=0 không cộng tiền hai lần.
- UserCreditAccounts: unique UserId sau preflight trùng; RowVersion/decimal(18,2) giữ. Không merge tự động balance trùng; mâu thuẫn chặn migration. FormProjects alternate key `(Id,UserId)` và keys ghép trên giữ owner; kiểm orphan trước FK, không xóa/sửa âm thầm.

## Projection job, predicate active và invariant vòng đời

`SubmissionJobItems` là nguồn certainty từng attempt; `SubmissionJobs` là projection cập nhật cùng transaction local với event terminal. V2: `SuccessCount=count(Succeeded với Settled|PrepaidConsumed)`, `FailedCount=count(Rejected với Released|PrepaidReleased)`, thêm projection `UnknownCount`, `NotDispatchedCount`, `HeldCount`. Job legacy không item giữ counter/status hiển thị cũ và không thành evidence v2.

- Matrix status/time/active chính xác ở [CONTRACTS](CONTRACTS.md#vòng-đời-job-và-ánh-xạ-active-project) là quy tắc chung. FinishedAt là kết thúc vận hành Completed/Failed/Cancelled sau runner ack, kể cả Unknown đã dừng; Paused giữ null. Reservation.ClosedAt vẫn null khi còn hold/claim. Reconciliation cập nhật counter/tài chính nhưng giữ status/FinishedAt vận hành.
- Active v2: cùng owner/project AND (Status Pending/Running/Paused OR RunnerAcknowledgedAt NULL OR item AttemptState PossibleDispatch/Unknown OR SettlementState Held/PrepaidHeld). Unknown sau runner dừng chặn project dù Failed/Cancelled+FinishedAt; project khác chỉ tiêu Available. Paused cần cancel rõ. Predicate/counter legacy giữ nguyên đến drain, không bịa certainty v2.
- Thêm projection v2 `UnknownCount int?`, `NotDispatchedCount int?`, `HeldCount int?` vào SubmissionJobs (legacy null); v2 nonnull>=0, derive từ item dưới parent lock. Success/Failed/Unknown/NotDispatched cộng bằng Total khi không Planned/PossibleDispatch; HeldCount là overlay tài chính, không đếm thêm response. Event item/counter/ack commit atomically; status enum không cho phép release.

## Lock order, transaction và retry

Mọi path đổi Balance, reservation, entitlement, batch eligibility hoặc job control dùng thứ tự: **Users(UserId) -> UserCreditAccounts(UserId) -> FormProjects(ProjectId) -> GenerationBatches(Id) -> GeneratedResponses/SubmissionJobItems(Id)**. Khóa nhiều ID theo ascending SQL. Đọc ID parent trước không write lock, sau đó lấy lock theo thứ tự và revalidate. Không giữ project lock rồi mới lấy account. Bao gồm AI, rules/direct, send/settlement, topup/manual grant chạm account, cancel và eviction; PayOS semantics giữ nguyên.

Users `UPDLOCK,HOLDLOCK` serialize cả account thiếu và retention. Unique account chặn create trùng. Available fractional giữ nguyên; affordable count=floor(Available/unit), rules free không chia zero. SemaphoreSlim không phải correctness SQL.

- Generation: cấp response ID/AIRunId ngoài retry; gọi AI ngoài transaction/retry. Revalidate Available khi commit; batch+response+generation ledger+usage+retention atomically. Quỹ thiếu=>audit fail, không batch/debit/eviction, không replay AI. Idempotent batch identity đề xuất=first response ID trong order cố định (đã cấp một lần); Append re-read ID và kiểm membership/fee exact. Batch tồn tại khác dữ kiện=>conflict; input zero loại trước derive.
- Admission: compatibility chỉ đọc trước transaction; lock đủ thứ tự, recheck fingerprint/eligibility/active/Available, insert job+items+reservation/events và claim legacy. Direct generation/batch/retention cùng transaction. Retry/lost commit trả durable status read-only, không runner takeover.
- Trước gọi: lưu PossibleDispatch+event và SubmissionLog trong transaction ngắn. Chỉ transition đã ack mới được gọi. Commit ack mất=>không gọi, giữ state cho reconciliation. Google I/O ngoài SQL/EF retry. Unknown dừng; item chưa gọi chỉ release sau acknowledgement.
- Settlement: lock parent/item theo thứ tự, đọc fresh outcome/ledger/evidence key. Atomically terminal+debit unique qua dedicated credit service+Balance/TotalUsed+reservation delta+event+submission/usage. Rejected hoặc NotDispatched release không debit/refund; Unknown không đổi tiền. Save bằng token diagnostic không hủy sau cancel. Ack mất=>fresh context tìm item/ledger/event; replay chỉ SQL local.
- Retention: account lock serialize append/admission; ghi completion một lần, giữ mới nhất20, loại phần còn lại cùng transaction. Admission thắng thì snapshot/hold sống sau eviction; eviction thắng thì admission mới fail. Không physical delete/cascade. Append fail rollback eviction.
- EF execution strategy chỉ bọc transaction SQL local và đọc lại khi retry (`ChangeTracker.Clear`/context mới). Stable IDs/unique facts nhận diện lost commit; RowVersion một mình không idempotency. InMemory không kiểm thiết kế này.

## Matrix chuyển trạng thái exact

| Trước | Trigger/evidence | Sau + accounting |
|---|---|---|
| none | command mới admission | Planned/Held hoặc Planned/PrepaidHeld; snapshot/event bất biến; reserve1 hoặc claim prepaid0 |
| Planned | transaction trước gọi đã ack | PossibleDispatch; giữ hold/claim; chỉ runner gốc được gọi một lần |
| Planned | runner dừng, chứng minh chưa gọi | NotDispatched/Released hoặc PrepaidReleased; release1/restore entitlement |
| PossibleDispatch | confirmation kiểm được | Succeeded/Settled (debit1) hoặc PrepaidConsumed (debit0), cùng atomically |
| PossibleDispatch | rejection kiểm được | Rejected/Released hoặc PrepaidReleased; release, không debit |
| PossibleDispatch | transport/body/cancel/crash không rõ | Unknown/Held hoặc PrepaidHeld; không release, fence |
| Unknown/Possible bỏ dở | reconciliation có success/non-success đáng tin được duyệt | terminal tương ứng; key evidence + actor/reason; không gọi provider |
| terminal | replay cùng fact | đọc terminal+ledger; không charge/event/provider |
| terminal | fact mâu thuẫn | conflict/điều tra; không overwrite/compensation tự động |

Pause/cancel trước runner acknowledgement chỉ đổi control job. Sau ack, Planned release; PossibleDispatch/Unknown giữ hold/claim. Job Paused active đến cancel/ack; item released không resume dưới command cũ. Failed cũ không release unknown. ClosedAt chỉ khi item terminal; RunnerAcknowledgedAt vẫn có thể còn unknown hold.

Legacy Available->Claimed lúc admission; Claimed->Consumed cùng Succeeded transaction. Rejected/NotDispatched chắc chắn restore Available nếu chưa từng success. Unknown giữ claim/fence. Consumed không mở lại; resend paid thất bại không restore quyền đầu. Legacy unknown không claim=>ReconciliationRequired chặn gửi đến evidence được duyệt. L1 vẫn chưa duyệt.

## Rủi ro và bằng chứng SQL bắt buộc trước hoàn tất implementation

**Cao:** bằng chứng parser/success hiện không đủ settlement; gate CUTOVER. **Cao:** account-first phải phủ mọi writer, nếu không còn deadlock/overspend. **Cao:** certainty/grouping legacy và claim prepaid không thể đoán từ timestamp/status. **Vừa:** không purge vật lý khiến storage vượt quota20; Deferred riêng.

Test bắt buộc: balance10 reserve7=>10/7/3; success1=>9/6/3, reject1=>9/5/4, unknown giữ; chọn10 với7 success/2 reject/1 unknown=>debit7/hold1. Replay cùng command/conflict command khác; hai project và AI/send đồng thời; account zero/fractional/missing; claim prepaid race và replay success/reject/unknown; lost commit admission/pre-call/settlement; append21/concurrency/eviction race; pause/cancel in-flight. Áp migration vào DB SQL Server sạch và baseline có dữ liệu được sở hữu, xác nhận ledger/log không đổi, orphan/trùng bị chặn, FK/unique/check/audit sống. Kiểm call count receiver độc lập DB; không cần Google live. Task1 chỉ ghi gate; chưa chạy.

## Persistence reconciliation legacy không hold

Attempt trước cutover không có item/reservation dùng `LegacyAttemptEvidence` append-only (bảng đề xuất thứ năm, không phải hold): `Id Guid! PK`, `UserId Guid!`, `ProjectId Guid!`, `ResponseId Guid!`, `LegacySubmissionLogId Guid?`, `LegacyEvidenceHash char(64)!`, `OutcomeKind varchar(24)!` (ConfirmedSuccess|ConfirmedRejected|Unknown), `EntitlementState varchar(24)!`, `EvidenceId Guid!`, `EvidenceCode varchar(64)!`, `ClassifierVersion varchar(32)!`, `ArtifactReference nvarchar(512)!`, `ArtifactSha256 char(64)!`, `ObservedAt datetimeoffset(7)!`, `ActorUserId Guid!`, `Reason nvarchar(1000)!`, `CreatedAt datetimeoffset(7)!`. Hash chữ thường/collation nhị phân như trên; reason không rỗng. FK exact NO ACTION: UserId/ActorUserId->Users.Id, `(ProjectId,UserId)`->FormProjects `(Id,UserId)`, `(ResponseId,ProjectId)`->GeneratedResponses `(Id,ProjectId)`, LegacySubmissionLogId->SubmissionLogs.Id. Index `(ResponseId,CreatedAt,Id)`; unique `(ResponseId,EvidenceId)` cho replay; unique filtered `(ResponseId,LegacyEvidenceHash)` WHERE OutcomeKind IN('ConfirmedSuccess','ConfirmedRejected') cho một phân loại terminal/identity attempt legacy bất biến. Evidence Unknown append trước terminal, không chiếm terminal unique key.

`LegacyEvidenceHash` hash identity response/log trước cutover và manifest source cố định (không phải evidence outcome mới). Cùng identity+EvidenceId/fact trả row/result cũ; tái dùng EvidenceId với fact đổi hoặc terminal mâu thuẫn=>conflict. Identity đã terminal chỉ đọc kết quả, không append Unknown về sau. Thiếu log identity cần manifest proof review độc lập của attempt response; thiếu log không tự chứng minh chưa gửi. Kiểm target attempt không có item/hold v2, nếu có dùng settlement thông thường. Không tạo item/reservation giả.

Dưới lock Users/account->project->batch/response chung, append evidence+AuditLog(actor/action/reference/reason) và đổi entitlement/fence atomically, ID ổn định ngoài retry SQL. Success trước đáng tin consume prepaid. Non-success chắc chắn chỉ restore Available sau duyệt L1, không success trước và mọi legacy attempt đã phân loại; còn lại giữ ReconciliationRequired. Attempt legacy còn chưa rõ luôn fence response dù success khác đã consume entitlement. Không đổi SubmissionLogs cũ, counter/status legacy job, balance/TotalUsed/UsageLogs/CreditTransactions. Quyền tool/operator Deferred; không provider call/hold/debit/refund hồi tố.

## Tách observation và compatibility evidence

`ObservedMetadataJson` là snapshot trung thực lúc tạo, có thể ghi rõ `Required=null`, constraint thiếu, question type không hỗ trợ, provenance parser hoặc receipt capability incomplete. Nó dùng hiển thị lịch sử/điều kiện reuse; không phải receipt hay proof form đầy đủ. `CompatibilityEvidenceJson` là refresh read-only, versioned riêng trước admission, chỉ chứa facts thực sự quan sát được (không điền giả required/constraint/receipt). Thiếu facts khiến compatibility false và send409; không làm batch đã tạo invalid hoặc ẩn khỏi history.
