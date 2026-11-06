namespace FormAutoHub.Api.Contracts;

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
