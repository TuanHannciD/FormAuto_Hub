namespace FormAutoHub.Api.Contracts;

public sealed record AiGenerateResponsesRequest(
    string Mode,
    int Count);

public sealed record AiGenerateResponsesResponse(
    Guid RunId,
    string Status,
    int RequestedCount,
    int GeneratedCount,
    int Multiplier,
    int CreditsUsed,
    int MissingCredits,
    decimal BalanceAfter,
    IReadOnlyList<Guid> GeneratedPreviewIds);
