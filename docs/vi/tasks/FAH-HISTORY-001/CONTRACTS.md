# Task 1 — Đề xuất contract

> Thẩm quyền hiện tại (2026-11-05): Review độc lập Task 1 qua R1–R3 và việc người dùng duyệt L1/L2/P1/O1 cùng contract/schema đã review được ghi tại [PROGRESS](PROGRESS.md). Tasks 2–6 được phép triển khai và kiểm thử cục bộ trong worktree riêng. Các nhãn đề xuất/chờ duyệt bên dưới lưu lịch sử thiết kế, không mở lại quyết định đã duyệt. Không suy ra quyền kích hoạt production, gọi provider thật, commit hay deploy.

Trạng thái: **Đề xuất để review; không cấp quyền production.** Đọc [đặc tả đã duyệt](INDEX.md), [đề xuất DB](DB_REVIEW.md), [gate chuyển đổi](CUTOVER.md). Mọi tên mới bên dưới đều là đề xuất, kể cả trạng thái nội bộ; giữ các trạng thái job/log công khai hiện hữu. Tasks 2–5 chỉ dùng bản đã review sau khi giải quyết quyết định tài chính và review độc lập.

## Source và bất biến đã duyệt

Đã đọc baseline: `Contracts/Phase3Dtos.cs`, `Phase6AiGenerateDtos.cs`; `Controllers/SubmissionsController.cs`, `GeneratedResponsesController.cs`; các service `SubmissionService`, `SubmissionAdmission`, `DirectRuleSubmissionService`, `ResponseGenerationService`, `AiGenerationService`, `CreditService`; integration `GoogleFormsClient.cs`, `GoogleFormModels.cs`, cùng dưới `src/FormAutoHub.Api`.

- 20 lượt tái sử dụng/tài khoản; 1–100 bản/lượt; gửi tuần tự theo batch10, một job hoạt động/project.
- Phí tạo rules0, AI mặc định1, AI tùy chỉnh2 credit/bản hợp lệ được lưu. Mỗi lần gửi/gửi lại thành công thu1, trừ quyền thành công đầu tiên đã trả trước của legacy bên dưới.
- Rules giữ một nút **Tạo và gửi ngay**, không preview/xác nhận thứ hai. AI có preview và xác nhận rõ. Mỗi lần gửi lại từ lịch sử phải xác nhận mới và cảnh báo dữ liệu trùng.
- Balance là số dư đã hạch toán; Available=Balance-Reserved. Giữ/giải phóng credit không phải chi tiêu/hoàn tiền. Giữ chủ sở hữu riêng của sổ credit, nhật ký công cụ và nhật ký gửi.

## Route và ranh giới lỗi đề xuất chính xác

Mọi route yêu cầu xác thực và SQL lọc owner. Admin không mặc nhiên đọc dữ liệu user khác. Kiểm owner trước validation/audit gắn với project. Cùng trả404 cho tài nguyên thiếu/không được truy cập. Không nhận UserId hay giá từ client. Response có `Cache-Control: no-store`.

| Route | Contract |
|---|---|
| `GET /api/generation-history?page=1&pageSize=10` | Chỉ batch còn đủ điều kiện trên toàn tài khoản; page nguyên >=1, pageSize nguyên1..20; bỏ qua thì mặc định1/10, sai trả400. Page vượt cuối trả items rỗng và giữ page yêu cầu. TotalItems<=20, TotalPages=ceil(TotalItems/PageSize), bằng0 khi rỗng. |
| `GET /api/generation-history/{batchId:guid}` | Batch còn đủ điều kiện của owner, <=100 bản bất biến theo Ordinal ASC; thiếu/sai owner/đã loại=>404. |
| `POST /api/projects/{projectId:guid}/submissions/send` | Mở rộng request gửi hiện có bằng command/batch/version bên dưới. Trả SubmissionJobResponse mở rộng, HTTP200 khi admission/replay. |
| `POST /api/projects/{projectId:guid}/submissions/send-rules-direct` | Route một thao tác hiện hữu; thêm ContractVersion=2 vào CommandId/Count. Tạo số bản đủ khả năng giữ phí gửi, thêm batch/snapshot/reservation/job trong một transaction nội bộ. Count1..100; không đủ một bản=>409. Không thêm trường xác nhận/thao tác thứ hai. |
| `GET /api/projects/{projectId:guid}/submissions/jobs/{jobId:guid}` | Owner polling chỉ đọc hiện hữu; Job.Id=CommandId cho job mới, giữ cách tra direct command. Có quyết toán; không resume runner. |
| POST `/pause`, `/cancel` hiện hữu của job | Chỉ yêu cầu điều khiển; chưa giải phóng khi runner chưa xác nhận dừng. Unknown vẫn giữ. Thiếu/sai owner=>404, chuyển trạng thái sai=>409. |

`GET /api/projects/{projectId}/responses` tiếp tục là route phục hồi của owner: chỉ batch đủ điều kiện và từng bản legacy đã được chứng minh đủ điều kiện phục hồi. IDs thuộc batch đã loại trả404, không lộ lại qua query toàn project. Đọc legacy chưa nhóm không tạo slot lịch sử. Snapshot job được đọc qua trạng thái job của owner, không trở thành bản đã loại có thể tái sử dụng.

Danh sách/loại cũ dùng cùng SQL Server `(CreatedAt DESC, Id DESC)`, UTC thời điểm hoàn tất lưu bền và thứ tự SQL uniqueidentifier (không dùng phép so Guid của .NET). Transaction đọc nhất quán cho count/page. Giữa các request có thể xuất hiện lượt mới; thứ tự ổn định không hứa snapshot xuyên request.

## DTO đề xuất chính xác

Record C# dưới đây mô tả JSON camelCase, DateTimeOffset UTC và decimal credit dạng số JSON. GeneratedResponseResponse, GeneratedAnswerResponse, FormQuestionResponse hiện hữu vẫn do Phase3Dtos.cs định nghĩa.

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

Mở rộng SubmissionJobResponse bằng `CommandId: Guid?`, `ContractVersion: int?`, `BatchId: Guid?`, `Fees: SubmissionFeeResponse?`, `Items: IReadOnlyList<SubmissionItemResponse>`, `UnknownCount: int?`, `NotDispatchedCount: int?`, `HeldCount: int?`, `RunnerAcknowledgedAt: DateTimeOffset?`. Trường nullable nhận diện job legacy chưa có bằng chứng giữ credit, không bịa ra hold. Giữ Total/SuccessCount/FailedCount/Status/Logs; FailedCount chỉ đếm từ chối đã xác nhận. Tách UnknownCount/NotDispatchedCount nên Total có thể khác SuccessCount+FailedCount. Không DTO nào chứa HTML provider thô, bí mật hay raw AI audit. Outcomes lịch sử đếm attempt nên gửi lại có thể khiến số thành công vượt GeneratedCount.

Response tạo giữ trường hiện có. Thêm `GenerationBatchId: Guid?`, `GenerationFeePerResponse: int`, `Credits: CreditAvailabilityResponse` vào GenerateResponsesResponse và AiGenerateResponsesResponse. AI RunId vẫn là AiGenerationRun ID (không phải batch ID); CreditsUsed/Multiplier chỉ phản ánh phí tạo thực tế0/1/2, BalanceAfter vẫn là số dư đã hạch toán. Không có output hợp lệ=>batch null, debit0, không loại cũ. Output một phần chỉ thu bản hợp lệ được commit. DashboardSummary `CurrentCreditBalance` giữ nghĩa đã hạch toán; thêm `ReservedCreditBalance`, `AvailableCreditBalance` dạng decimal. AI analytics tiếp tục cộng AiGenerationRuns.CreditsUsed, không cộng phí gửi/hold.

Mode lịch sử/batch: `rules|ai-default|ai-custom`; ánh xạ Source Rule/AI và AI Option2/Option3 mà không đổi giá trị enum hiện hữu. PricingPolicy: `SeparatedV1|LegacyBundledV1`.

## Command và admission

Command mới bắt buộc ContractVersion=2, CommandId không rỗng. `/send` bắt buộc Confirmed=true; DuplicateWarningAccepted=true khi bất kỳ bản chọn đã có attempt (và tại UI gửi lại từ lịch sử). Client không gửi fingerprint hay phí.

Server fingerprint=SHA-256 chữ thường trên mảng JSON UTF-8 không khoảng trắng, đúng thứ tự `[2, userIdD, projectIdD, routeKind, batchIdDOrNull, sortedResponseIdDArray, requestedCountOrNull, confirmed, duplicateWarningAccepted]`. GUID lowercase D; chỉ sắp IDs theo ordinal text để tính fingerprint; routeKind=`selected|direct`. Direct dùng IDs rỗng, Count yêu cầu, false/false. Direct lưu hash rules/form khi admission, không tạo lại khi replay. Thứ tự thực thi là ordinal đã lưu, không phụ thuộc thứ tự IDs request.

Kiểm owner project rồi tìm CommandId. Cùng owner/project/route/fingerprint=>chỉ đọc job cũ (dù đã loại lịch sử, unknown, hủy, số dư hiện tại thiếu hay form đổi); không refresh tương thích, log, hold, tạo dữ liệu, gọi provider hoặc takeover runner. Cùng command thuộc owner nhưng khác fingerprint/project=>409 CommandConflict. Trùng job ID toàn cục của owner khác=>404; không ghi đè. Command legacy không fingerprint chỉ được GET phục hồi sau cutover (xem CUTOVER).

Admission mới yêu cầu1..100 IDs khác nhau/không rỗng, cùng batch còn đủ điều kiện/project; không tự giảm tập chọn. BatchId=null chỉ cho legacy chưa nhóm đã chứng minh đủ điều kiện phục hồi cùng owner/project/policy. Trộn batch/policy legacy=>400; IDs không thể truy cập=>404; batch đã loại thuộc owner=>409 HistoryExpired trước tra membership. Giữ tổng MaximumSendCredits sau tương thích, dưới account lock. Available thiếu=>409 InsufficientAvailableCredit; UI cho chọn ít hơn một cách chủ động. Bất kỳ bản chọn có PossibleDispatch/Unknown chưa xử lý=>409 OutcomeUnresolved dù command mới hoặc trạng thái project/job khác.

400: body/version sai cấu trúc, count/IDs/xác nhận/phân trang sai. 404: ownership/tài nguyên thiếu. 409: client cũ (`ClientUpgradeRequired`), job hoạt động (`ActiveSubmissionJob`), lịch sử hết hạn, form không tương thích/không chứng minh hỗ trợ (`FormIncompatible|FormEvidenceUnavailable`), thiếu Available, command xung đột, kết quả chưa rõ hoặc admission đồng thời cũ. Dùng ProblemDetails với extension `code` nêu trên, không chứa ID riêng tư. Lỗi auth giữ401/403. Service trả kết quả/lỗi domain có kiểu; controller ánh xạ HTTP.

## Vòng đời job và ánh xạ active-project

Mỗi item v2 thuộc đúng một `SubmissionJob`; job là projection tổng hợp item. `SubmissionJob.Status` giữ vocabulary hiện có `Pending|Running|Paused|Cancelled|Completed|Failed`. `FinishedAt` là thời điểm kết thúc vận hành (Completed/Failed/Cancelled), set cùng runner acknowledgement dù Unknown còn; Paused giữ FinishedAt null; `RunnerAcknowledgedAt` ghi runner đã dừng/bàn giao và có thể có trước `FinishedAt` khi Paused; nó không giải quyết item Unknown đang hold. Counter v2 tách riêng: `SuccessCount` đếm item `Succeeded` với `Settled|PrepaidConsumed`, `FailedCount` chỉ đếm `Rejected` với `Released|PrepaidReleased`, còn `UnknownCount`, `NotDispatchedCount`, `HeldCount` là projection lưu/đọc. Job legacy không có item giữ counter/status cũ chỉ để hiển thị; không chuyển thành certainty v2.

| Tình huống item/settlement v2 | SubmissionJob.Status | RunnerAcknowledgedAt / FinishedAt | Project active? |
|---|---|---|---|
| Admission đã commit, chưa ack runner dừng | Pending rồi Running | null / null | Có |
| Runner dừng; mọi item Succeeded + Settled/PrepaidConsumed | Completed | thời điểm dừng / dừng | Không |
| Runner dừng; có Rejected/Released hoặc NotDispatched/Released, không hold chưa rõ | Failed | thời điểm dừng / dừng | Không |
| Runner dừng; còn PossibleDispatch/Unknown với Held/PrepaidHeld | Failed (trừ control đã Cancelled) | thời điểm dừng / dừng | Có; giữ hold/fence response và project |
| Yêu cầu pause, runner chưa ack | Paused | null / null | Có |
| Pause đã ack; Planned release, possible/unknown held | Paused | thời điểm dừng / null | Có đến khi cancel rõ; không thêm resume |
| Yêu cầu cancel, runner chưa ack | Cancelled | null / null | Có |
| Cancel đã ack, unattempted release, unknown held | Cancelled | thời điểm dừng / dừng | Có iff còn item chưa giải quyết |
| Đối soát được phép đóng Unknown cuối | Giữ Failed/Cancelled (lịch sử vận hành); cập nhật counter/fee | không đổi / không đổi | Không trừ Paused/job active khác |

Predicate active v2 chính xác cho cùng owner/project: Status thuộc Pending/Running/Paused OR RunnerAcknowledgedAt null OR EXISTS item AttemptState thuộc PossibleDispatch/Unknown OR SettlementState thuộc Held/PrepaidHeld. Đánh giá dưới account->project lock chung. Legacy giữ predicate hiện tại Pending/Running/Paused OR (Cancelled AND FinishedAt NULL) đến khi drain chứng minh không còn runner cũ; không backfill counter/ack v2 giả. Paused phải cancel rõ để bỏ control fence. Unknown chặn gửi mới trên project/response dù runner dừng; project khác chỉ bị ảnh hưởng Reserved account. Replay cùng command chỉ đọc. Counter/status/ack/finish ghi trong transaction item/runner-finalization tương ứng; reconciliation không viết lại FinishedAt vận hành hay giả run gốc hoàn tất bình thường.

Legacy no-hold là path riêng: có thể không có `SubmissionJobItem`, reservation hay hold. Không bao giờ truyền nó vào `SettleAttemptAsync(itemId, ...)`.

## Kiểu/interface nội bộ cho Tasks 2–5 (đề xuất đóng băng)

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

Chỉ boundary integration/reconciliation đã review tạo evidence, không nhận từ JSON gửi công khai. ArtifactReference là tham chiếu nội bộ không trong suốt, không phải URL để fetch. Cùng EvidenceId khác fact=>conflict; kết quả terminal trái nhau=>conflict/điều tra. Replay cùng fact chỉ đọc terminal; reconciliation không gọi Google.

```csharp
// ICreditReservationService; workflow gọi kiểm owner availability
Task<CreditAvailabilityResponse> GetCreditAvailabilityAsync(Guid userId, CancellationToken ct);
Task<CreditReservationResult> ReserveSubmissionAsync(Guid userId, Guid jobId,
    IReadOnlyList<Guid> itemIds, CancellationToken ct);
// ISubmissionSettlementService
Task<SubmissionSettlementResult> SettleAttemptAsync(Guid itemId, VerifiedSubmissionOutcome outcome, CancellationToken ct);
Task<bool> MarkPossibleDispatchAsync(Guid itemId, CancellationToken ct);
Task<CreditReservationResult> ReleaseUnattemptedAsync(Guid jobId, CancellationToken ct);
// ILegacyAttemptReconciliationService; không reservation/ledger với legacy no-hold
Task<LegacyReconciliationResult> ReconcileLegacyAttemptAsync(LegacyAttemptIdentity identity,
    VerifiedSubmissionOutcome outcome, CancellationToken ct);
public sealed record LegacyReconciliationResult(Guid ResponseId, string EntitlementState,
    bool SendBlocked, Guid EvidenceId, bool AlreadyApplied);
// IGenerationBatchWriter
Task<Guid> AppendBatchAsync(Guid projectId, string mode, IReadOnlyList<GeneratedResponse> responses,
    int requestedCount, int generationCredits, CancellationToken ct);
// IGenerationHistoryService; owner từ ICurrentUserContext
Task<GenerationHistoryPageResponse> GetMineAsync(int page, int pageSize, CancellationToken ct);
Task<GenerationHistoryDetailResponse?> GetDetailAsync(Guid batchId, CancellationToken ct);
// ISubmissionCompatibilityService; phân tích provider chỉ đọc trước admission
Task<SubmissionCompatibilityResult> CheckAsync(Guid projectId, Guid? batchId,
    IReadOnlyList<Guid> responseIds, CancellationToken ct);
public sealed record SubmissionCompatibilityResult(bool Compatible, string? RejectionCode,
    string ObservedMetadataJson, string CompatibilityEvidenceJson, string CompatibilityEvidenceSha256,
    DateTimeOffset CheckedAt);
public sealed record LegacyAttemptIdentity(Guid UserId, Guid ProjectId, Guid ResponseId,
    Guid? LegacySubmissionLogId, string LegacyEvidenceHash);
```

ReserveSubmissionAsync/AppendBatchAsync yêu cầu transaction/lock đúng thứ tự của caller; chỉ stage, không commit/lồng transaction. Append kiểm/tính lại generationCredits phía server; response/count/debit/retention commit cùng nhau. SettleAttemptAsync sở hữu transaction nội bộ có retry sau provider I/O, không lồng transaction. Mọi debit kiểm Available; settlement tiêu thụ chính đơn vị đang giữ, không kiểm Available lần nữa. Một item là một attempt; gửi lại tạo item/job khác. [DB_REVIEW](DB_REVIEW.md) mô tả chuyển trạng thái bền vững/idempotency.

## Tương thích chỉ đọc và bằng chứng kiểm thử được

`GoogleFormsClient` hiện fallback entry-regex thành ShortText, gán Required=false cả trong parser public-data và bỏ qua type không hỗ trợ. Vì vậy batch lúc tạo chỉ lưu **ObservedMetadata**; không được gắn nhãn đầy đủ/tương thích gửi khi required/constraint còn unknown. `SubmitAsync` không đọc body, coi2xx/302 là Success. Kết quả thật là GoogleFormSubmitResult(bool Success, string ErrorMessage) trong `GoogleFormModels.cs`; boolean này không đủ cho phép debit.

Tạo và lịch sử vẫn được phép với ObservedMetadata thiếu (UI đánh dấu required/constraint/receipt unknown và `SendBlocked=true`). Tiêu chí hỗ trợ gửi đề xuất: Google Form công khai HTTPS docs.google.com được phép sử dụng; identity form chuẩn hóa/action formResponse đúng identity; inventory đầy đủ với entry ID/type/required/options/validation constraints đã chứng minh; không suy diễn fallback, bỏ câu không hỗ trợ, upload file, auth/captcha/giới hạn một lần trả lời, phân nhánh nhiều trang hoặc constraint chưa parse. Đây là giới hạn gửi được hỗ trợ, không cấp quyền viết lại parser tổng quát hay vượt hạn chế. Parser hiện tại không chứng minh được=>FormEvidenceUnavailable, không admission/hold/send.

Refresh trước admission mới; so metadata quan sát với đầy đủ entry/type/options/required/constraint và tính hợp lệ câu trả lời. Lưu CompatibilityEvidence riêng với ObservedMetadata; thiếu evidence chỉ chặn admission send, không chặn tạo/lịch sử. ID thiếu/trùng/đổi, type/options/required/constraint đổi hoặc metadata không hỗ trợ=>409. Có thể bỏ qua đổi label/title thuần hiển thị; order dùng hiển thị, không ánh xạ lại đáp án. Không âm thầm đổi snapshot/câu hỏi project. Kiểm identity/hash lại trước mỗi batch10 bằng refresh chỉ đọc ngoài transaction DB; mismatch dừng phần còn lại, chỉ giải phóng bản chắc chắn chưa gửi sau runner acknowledgement. Google có thể đổi giữa kiểm tra và POST; race này không có bảo đảm exactly-once.

| Fixture bằng chứng | Phân loại/hành động |
|---|---|
| Tài liệu confirmation cuối đầy đủ đúng form; marker cấu trúc và redirect chain khớp classifier có version đã review; không marker auth/error/challenge | Chỉ là ứng viên ConfirmedSuccess sau reviewer duyệt nguồn fixture đã làm sạch; settlement một lần. Task1 chưa thiết lập fixture này. |
| Tài liệu từ chối validation đúng form, ngữ nghĩa đã review chứng minh không chấp nhận | ConfirmedRejected; giải phóng một lần. Chỉ status/thông báo chung không đủ. |
| HTTP200 login/error,302 accounts/login/đích không rõ, text trông thành công nhưng chưa nhận diện, body lỗi/cắt, timeout/mất kết nối/hủy,4xx/5xx chưa chứng minh từ chối | Unknown sau possible dispatch; giữ/fence bản, dừng runner. |
| Lỗi tương thích/payload trước gọi, bằng chứng bền vững chưa chuyển dispatch | NotDispatched; không gọi provider; giải phóng sau acknowledgement. |
| Provider trả thành công nhưng commit/ack kết quả không chắc | Context mới đọc item/ledger; chưa chứng minh terminal=>giữ PossibleDispatch/Unknown; không gửi lại. |

Task4 phải ghi redirect chain, không theo đích tùy ý hay tự retry POST/phát lại307/308; kiểm rõ HTTPS host/path hỗ trợ trước từng hop. Test fixture có cả body/redirect âm tính/dương tính, metadata giữ nguyên/đổi và parser thiếu bằng chứng. Marker chỉ là bằng chứng flow nhận gửi, không phải receipt Google riêng từng response đáng tin cậy. Receiver giả chỉ chứng minh cơ chế phần mềm. **Kích hoạt gửi tính phí production là Blocked đến khi bằng chứng flow thật hỗ trợ và khả năng reconciliation được review; scope tạo/lịch sử vẫn được duyệt.** Official Forms API, live call, tự tra receipt ngoài task.

## Ranh giới quyền legacy

Legacy biết chắc chưa gửi giữ quyền thành công đầu miễn phí đã trả trước; biết chắc từng thành công thì lần gửi thành công tiếp theo thu1. Unknown phải đối soát trước gửi mới. Cờ Failed/Success hiện tại không tự chứng minh receiver vì classifier boolean hiện có; attempt mơ hồ tiếp tục bị chặn.

**Quyết định L1 cần user review:** giữ quyền thành công đầu đã trả trước cho legacy thất bại đã xác nhận, chưa từng thành công. Khuyến nghị có: giữ tổng phí lần dùng đầu đã trả(legacy1/2/3). Claim quyền khi admission, chỉ consume cùng transaction thành công đã xác nhận; trả quyền khi chắc chắn không thành công; unknown giữ claim/fence. Không hoàn tiền/viết lại ledger cũ. Đây là đề xuất mới cho trường hợp spec-Deferred, chưa trở thành quy tắc đã duyệt. [CUTOVER](CUTOVER.md) ghi các gate quyết định khác.

Guard generation compatibility (đề xuất): giữ URL/body tạo rules/AI hiện tại nhưng sau cutover bắt buộc header `X-FormAuto-Contract-Version: 2` cho generation write mới; thiếu/không hỗ trợ=>409 ClientUpgradeRequired trước provider/debit/tạo dữ liệu. Chặn client cũ chưa hiểu phí tạo0/1/2. MarkPossibleDispatchAsync sở hữu transaction ngắn lock đúng thứ tự, chỉ trả true cho runner gốc sau transition đầu đã ack; false không cho phép provider call. ReleaseUnattemptedAsync yêu cầu RunnerAcknowledgedAt bền vững, chỉ release Planned item/claim trong một transaction local lock đúng thứ tự, idempotent; không release PossibleDispatch/Unknown hay resume job paused.

Legacy no-hold reconciliation không phải settlement: `ReconcileLegacyAttemptAsync` nhận LegacyAttemptIdentity và immutable evidence, kiểm owner/project/response/log identity rồi append audit/evidence idempotent. Success consume prepaid entitlement đã duyệt, non-success chắc chắn chỉ restore sau duyệt L1 và mọi attempt trước đã phân loại không success (còn lại giữ fence), Unknown giữ `ReconciliationRequired`; không tạo reservation/CreditTransaction hay sửa ledger hồi tố. Cùng evidence replay chỉ đọc; evidence mâu thuẫn trả conflict. Operator tooling vẫn Deferred.

Quy tắc DTO observation: Completeness=`Partial|Complete` chỉ mô tả metadata lúc tạo đã biết, không duyệt admission; ReceiptCapability=`Unknown` đến khi được chứng minh độc lập. Required=null/ConstraintsJson=null nghĩa chưa quan sát, không phải false/không constraint. Options=null là unknown, rỗng là đã chứng minh không options. FormQuestion.Required=false hiện tại thiếu provenance đáng tin phải ánh xạ null. Tạo/lịch sử không yêu cầu receipt hay compatibility Complete.

Legacy reconciliation sở hữu transaction retry chỉ SQL local dưới cùng parent lock order; ActorUserId/Reason bắt buộc cho evidence operator dù SubmissionEvidence cho null ở integration tự động. Cấp evidence/audit ID ổn định trước retry. Hash nhận diện source fact legacy attempt bất biến, không phải receipt Google.
