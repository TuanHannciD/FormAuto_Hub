using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface IUsageLogService
{
    Task<UsageLogListResponse> GetMineAsync(CancellationToken cancellationToken);
    Task<UsageLogListResponse> GetRecentMineAsync(CancellationToken cancellationToken);
}

public sealed class UsageLogService(FormAutoHubDbContext dbContext, ICurrentUserContext currentUser)
    : IUsageLogService
{
    public async Task<UsageLogListResponse> GetMineAsync(CancellationToken cancellationToken) =>
        new(await QueryMine()
            .OrderByDescending(log => log.CreatedAt)
            .Select(log => log.ToResponse())
            .ToListAsync(cancellationToken));

    public async Task<UsageLogListResponse> GetRecentMineAsync(CancellationToken cancellationToken) =>
        new(await QueryMine()
            .OrderByDescending(log => log.CreatedAt)
            .Take(5)
            .Select(log => log.ToResponse())
            .ToListAsync(cancellationToken));

    private IQueryable<Entities.UsageLog> QueryMine() =>
        dbContext.UsageLogs.AsNoTracking().Where(log => log.UserId == currentUser.UserId);
}
