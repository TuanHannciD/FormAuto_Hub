namespace FormAutoHub.Api.Contracts;

// ── User-facing analytics ──────────────────────────────────────────

public sealed record AiUsageStatsResponse(
    int TotalRuns,
    int SuccessfulRuns,
    int FailedRuns,
    int TotalCreditsUsed,
    int TotalPreviewsGenerated,
    IReadOnlyList<AiModeStats> ModeBreakdown,
    IReadOnlyList<AiRecentRunResponse> RecentRuns,
    IReadOnlyList<AiDailyUsageResponse> UsageByDay);

public sealed record AiModeStats(
    string Mode,
    int Runs,
    int CreditsUsed);

public sealed record AiRecentRunResponse(
    Guid Id,
    string Mode,
    string Status,
    string Provider,
    string Model,
    int RequestedCount,
    int GeneratedCount,
    int CreditsUsed,
    long? DurationMs,
    DateTimeOffset CreatedAt,
    string? ProjectName);

public sealed record AiDailyUsageResponse(
    string Date,
    int Runs,
    int CreditsUsed);

// ── Admin-facing analytics (extends user data) ─────────────────────

public sealed record AdminAiUsageStatsResponse(
    int TotalRuns,
    int SuccessfulRuns,
    int FailedRuns,
    int TotalCreditsUsed,
    int TotalPreviewsGenerated,
    int TotalUsers,
    IReadOnlyList<AiModeStats> ModeBreakdown,
    IReadOnlyList<AiProviderPerformanceResponse> ProviderPerformance,
    IReadOnlyList<AiTopUserResponse> TopUsers,
    IReadOnlyList<AiRecentRunResponse> RecentRuns,
    IReadOnlyList<AiDailyUsageResponse> UsageByDay);

public sealed record AiProviderPerformanceResponse(
    string Provider,
    string Model,
    int SuccessfulRuns,
    int FailedRuns,
    double AvgDurationMs);

public sealed record AiTopUserResponse(
    Guid UserId,
    string Email,
    int Runs,
    int CreditsUsed);

// ── Paged runs ─────────────────────────────────────────────────────

public sealed record PagedAiRunResponse(
    IReadOnlyList<AiRecentRunResponse> Items,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages);
