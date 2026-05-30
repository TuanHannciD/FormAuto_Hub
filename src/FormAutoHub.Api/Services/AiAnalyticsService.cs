using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface IAiAnalyticsService
{
    Task<AiUsageStatsResponse> GetMyStatsAsync(CancellationToken cancellationToken);
    Task<AdminAiUsageStatsResponse> GetAdminStatsAsync(CancellationToken cancellationToken);
    Task<PagedAiRunResponse> GetAdminRunsAsync(
        int page, int pageSize,
        string? status, string? mode,
        string? provider, string? model,
        DateTimeOffset? fromDate, DateTimeOffset? toDate,
        CancellationToken cancellationToken);
}

public sealed class AiAnalyticsService(
    FormAutoHubDbContext dbContext,
    ICurrentUserContext currentUser) : IAiAnalyticsService
{
    private const int RecentRunCount = 10;
    private const int UsageDays = 30;
    private const int TopUserCount = 5;

    private const int MaxPageSize = 100;
    private const int DefaultPageSize = 20;

    // ── User-scoped ────────────────────────────────────────────────

    public async Task<AiUsageStatsResponse> GetMyStatsAsync(CancellationToken cancellationToken)
    {
        var thirtyDaysAgo = DateTimeOffset.UtcNow.AddDays(-UsageDays);

        var userRuns = dbContext.AiGenerationRuns
            .AsNoTracking()
            .Where(r => r.UserId == currentUser.UserId);

        var totalRuns = await userRuns.CountAsync(cancellationToken);
        var successfulRuns = await userRuns.CountAsync(r => r.Status == "Succeeded" || r.Status == "Completed", cancellationToken);
        var failedRuns = await userRuns.CountAsync(r => r.Status == "Failed", cancellationToken);
        var totalCreditsUsed = (await userRuns.SumAsync(r => (int?)r.CreditsUsed, cancellationToken)) ?? 0;
        var totalPreviewsGenerated = (await userRuns.SumAsync(r => (int?)r.GeneratedCount, cancellationToken)) ?? 0;

        var modeBreakdown = await userRuns
            .GroupBy(r => r.Mode)
            .Select(g => new AiModeStats(g.Key, g.Count(), g.Sum(r => r.CreditsUsed)))
            .ToListAsync(cancellationToken);

        // Recent runs
        var recentRunsRaw = await userRuns
            .OrderByDescending(r => r.CreatedAt)
            .Take(RecentRunCount)
            .Select(r => new
            {
                r.Id, r.Mode, r.Status, r.Provider, r.Model,
                r.RequestedCount, r.GeneratedCount, r.CreditsUsed,
                r.StartedAt, r.CompletedAt, r.CreatedAt,
                ProjectName = r.Project != null ? r.Project.Name : null
            })
            .ToListAsync(cancellationToken);

        var recentRuns = recentRunsRaw
            .Select(r => new AiRecentRunResponse(
                r.Id, r.Mode, r.Status, r.Provider, r.Model,
                r.RequestedCount, r.GeneratedCount, r.CreditsUsed,
                r.StartedAt != null && r.CompletedAt != null
                    ? (long?)(r.CompletedAt.Value - r.StartedAt.Value).TotalMilliseconds
                    : null,
                r.CreatedAt,
                r.ProjectName))
            .ToList();

        // Daily usage: materialize raw data first, group in memory
        var dailyRaw = await userRuns
            .Where(r => r.CreatedAt >= thirtyDaysAgo)
            .Select(r => new { r.CreatedAt, CreditsUsed = (int?)r.CreditsUsed })
            .ToListAsync(cancellationToken);

        var dailyUsage = dailyRaw
            .GroupBy(r => r.CreatedAt.Date)
            .Select(g => new AiDailyUsageResponse(
                g.Key.ToString("yyyy-MM-dd"),
                g.Count(),
                g.Sum(r => r.CreditsUsed ?? 0)))
            .OrderBy(d => d.Date)
            .ToList();

        return new AiUsageStatsResponse(
            totalRuns, successfulRuns, failedRuns,
            totalCreditsUsed, totalPreviewsGenerated,
            modeBreakdown, recentRuns, dailyUsage);
    }

    // ── Admin-scoped ───────────────────────────────────────────────

    public async Task<AdminAiUsageStatsResponse> GetAdminStatsAsync(CancellationToken cancellationToken)
    {
        var thirtyDaysAgo = DateTimeOffset.UtcNow.AddDays(-UsageDays);

        var allRuns = dbContext.AiGenerationRuns.AsNoTracking();

        var totalRuns = await allRuns.CountAsync(cancellationToken);
        var successfulRuns = await allRuns.CountAsync(r => r.Status == "Succeeded" || r.Status == "Completed", cancellationToken);
        var failedRuns = await allRuns.CountAsync(r => r.Status == "Failed", cancellationToken);
        var totalCreditsUsed = (await allRuns.SumAsync(r => (int?)r.CreditsUsed, cancellationToken)) ?? 0;
        var totalPreviewsGenerated = (await allRuns.SumAsync(r => (int?)r.GeneratedCount, cancellationToken)) ?? 0;
        var totalUsers = await allRuns.Select(r => r.UserId).Distinct().CountAsync(cancellationToken);

        // Mode breakdown
        var modeBreakdown = await allRuns
            .GroupBy(r => r.Mode)
            .Select(g => new AiModeStats(g.Key, g.Count(), g.Sum(r => r.CreditsUsed)))
            .ToListAsync(cancellationToken);

        // Provider performance
        var providerStats = await allRuns
            .GroupBy(r => new { r.Provider, r.Model })
            .Select(g => new
            {
                Provider = g.Key.Provider,
                Model = g.Key.Model,
                SuccessfulRuns = g.Count(r => r.Status == "Succeeded" || r.Status == "Completed"),
                FailedRuns = g.Count(r => r.Status == "Failed")
            })
            .ToListAsync(cancellationToken);

        var durationRaw = await allRuns
            .Where(r => r.StartedAt != null && r.CompletedAt != null)
            .Select(r => new { r.Provider, r.Model, r.StartedAt, r.CompletedAt })
            .ToListAsync(cancellationToken);

        var avgDurations = durationRaw
            .GroupBy(d => new { d.Provider, d.Model })
            .ToDictionary(
                g => $"{g.Key.Provider}|{g.Key.Model}",
                g => g.Average(d => (d.CompletedAt!.Value - d.StartedAt!.Value).TotalMilliseconds));

        var providerPerformance = providerStats
            .Select(g => new AiProviderPerformanceResponse(
                g.Provider, g.Model,
                g.SuccessfulRuns, g.FailedRuns,
                avgDurations.GetValueOrDefault($"{g.Provider}|{g.Model}", 0)))
            .ToList();

        // Top users
        var topUserGroups = await allRuns
            .GroupBy(r => r.UserId)
            .Select(g => new { UserId = g.Key, Runs = g.Count(), CreditsUsed = g.Sum(r => r.CreditsUsed) })
            .OrderByDescending(x => x.CreditsUsed)
            .Take(TopUserCount)
            .ToListAsync(cancellationToken);

        var topUserIds = topUserGroups.Select(x => x.UserId).ToList();

        var userEmails = await dbContext.Users
            .AsNoTracking()
            .Where(u => topUserIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Email, cancellationToken);

        var topUsers = topUserGroups
            .Select(g => new AiTopUserResponse(
                g.UserId,
                userEmails.GetValueOrDefault(g.UserId, ""),
                g.Runs,
                g.CreditsUsed))
            .ToList();

        // Recent runs
        var recentRunsRaw = await allRuns
            .OrderByDescending(r => r.CreatedAt)
            .Take(RecentRunCount)
            .Select(r => new
            {
                r.Id, r.Mode, r.Status, r.Provider, r.Model,
                r.RequestedCount, r.GeneratedCount, r.CreditsUsed,
                r.StartedAt, r.CompletedAt, r.CreatedAt,
                ProjectName = r.Project != null ? r.Project.Name : null
            })
            .ToListAsync(cancellationToken);

        var recentRuns = recentRunsRaw
            .Select(r => new AiRecentRunResponse(
                r.Id, r.Mode, r.Status, r.Provider, r.Model,
                r.RequestedCount, r.GeneratedCount, r.CreditsUsed,
                r.StartedAt != null && r.CompletedAt != null
                    ? (long?)(r.CompletedAt.Value - r.StartedAt.Value).TotalMilliseconds
                    : null,
                r.CreatedAt,
                r.ProjectName))
            .ToList();

        // Daily usage: materialize raw data first, group in memory
        var dailyRaw = await allRuns
            .Where(r => r.CreatedAt >= thirtyDaysAgo)
            .Select(r => new { r.CreatedAt, CreditsUsed = (int?)r.CreditsUsed })
            .ToListAsync(cancellationToken);

        var dailyUsage = dailyRaw
            .GroupBy(r => r.CreatedAt.Date)
            .Select(g => new AiDailyUsageResponse(
                g.Key.ToString("yyyy-MM-dd"),
                g.Count(),
                g.Sum(r => r.CreditsUsed ?? 0)))
            .OrderBy(d => d.Date)
            .ToList();

        return new AdminAiUsageStatsResponse(
            totalRuns, successfulRuns, failedRuns,
            totalCreditsUsed, totalPreviewsGenerated, totalUsers,
            modeBreakdown, providerPerformance, topUsers,
            recentRuns, dailyUsage);
    }

    // ── Admin paged runs ──────────────────────────────────────────────

    public async Task<PagedAiRunResponse> GetAdminRunsAsync(
        int page, int pageSize,
        string? status, string? mode,
        string? provider, string? model,
        DateTimeOffset? fromDate, DateTimeOffset? toDate,
        CancellationToken cancellationToken)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var query = dbContext.AiGenerationRuns.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(r => r.Status == status);
        if (!string.IsNullOrWhiteSpace(mode))
            query = query.Where(r => r.Mode == mode);
        if (!string.IsNullOrWhiteSpace(provider))
            query = query.Where(r => r.Provider == provider);
        if (!string.IsNullOrWhiteSpace(model))
            query = query.Where(r => r.Model == model);
        if (fromDate.HasValue)
            query = query.Where(r => r.CreatedAt >= fromDate.Value);
        if (toDate.HasValue)
            query = query.Where(r => r.CreatedAt <= toDate.Value);

        var totalItems = await query.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

        var rawItems = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new
            {
                r.Id, r.Mode, r.Status, r.Provider, r.Model,
                r.RequestedCount, r.GeneratedCount, r.CreditsUsed,
                r.StartedAt, r.CompletedAt, r.CreatedAt,
                ProjectName = r.Project != null ? r.Project.Name : null
            })
            .ToListAsync(cancellationToken);

        var items = rawItems
            .Select(r => new AiRecentRunResponse(
                r.Id, r.Mode, r.Status, r.Provider, r.Model,
                r.RequestedCount, r.GeneratedCount, r.CreditsUsed,
                r.StartedAt != null && r.CompletedAt != null
                    ? (long?)(r.CompletedAt.Value - r.StartedAt.Value).TotalMilliseconds
                    : null,
                r.CreatedAt,
                r.ProjectName))
            .ToList();

        return new PagedAiRunResponse(items, page, pageSize, totalItems, totalPages);
    }
}
