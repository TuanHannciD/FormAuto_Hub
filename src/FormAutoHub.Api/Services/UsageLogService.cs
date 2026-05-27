using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface IUsageLogService
{
    Task<UsageLogPageResponse> GetMineAsync(UsageLogQuery query, CancellationToken cancellationToken);
    Task<UsageLogListResponse> GetRecentMineAsync(CancellationToken cancellationToken);
}

public sealed class UsageLogService(FormAutoHubDbContext dbContext, ICurrentUserContext currentUser)
    : IUsageLogService
{
    private const int MaxPageSize = 100;

    public async Task<UsageLogPageResponse> GetMineAsync(UsageLogQuery query, CancellationToken cancellationToken)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, MaxPageSize);
        var logs = ApplyFilters(QueryMine(), query);
        var totalItems = await logs.CountAsync(cancellationToken);
        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);
        var items = await logs
            .OrderByDescending(log => log.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(log => log.ToResponse())
            .ToListAsync(cancellationToken);

        return new UsageLogPageResponse(items, page, pageSize, totalItems, totalPages);
    }

    public async Task<UsageLogListResponse> GetRecentMineAsync(CancellationToken cancellationToken) =>
        new(await QueryMine()
            .OrderByDescending(log => log.CreatedAt)
            .Take(5)
            .Select(log => log.ToResponse())
            .ToListAsync(cancellationToken));

    private IQueryable<Entities.UsageLog> QueryMine() =>
        dbContext.UsageLogs.AsNoTracking().Where(log => log.UserId == currentUser.UserId);

    private static IQueryable<Entities.UsageLog> ApplyFilters(
        IQueryable<Entities.UsageLog> logs,
        UsageLogQuery query)
    {
        var action = query.Action?.Trim();
        if (!string.IsNullOrWhiteSpace(action))
        {
            logs = logs.Where(log => log.Action == action);
        }

        var search = query.Search?.Trim();
        if (!string.IsNullOrWhiteSpace(search))
        {
            logs = logs.Where(log =>
                log.Action.Contains(search) ||
                log.ToolName.Contains(search) ||
                log.Description.Contains(search) ||
                log.Status.Contains(search));
        }

        return logs;
    }
}
