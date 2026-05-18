using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface IDashboardService
{
    Task<DashboardSummaryResponse> GetSummaryAsync(CancellationToken cancellationToken);
}

public sealed class DashboardService(FormAutoHubDbContext dbContext, ICurrentUserContext currentUser)
    : IDashboardService
{
    public async Task<DashboardSummaryResponse> GetSummaryAsync(CancellationToken cancellationToken)
    {
        var account = await dbContext.UserCreditAccounts
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.UserId == currentUser.UserId, cancellationToken);

        var pendingTopupOrders = await dbContext.TopupOrders
            .AsNoTracking()
            .CountAsync(order => order.UserId == currentUser.UserId && order.Status == TopupOrderStatuses.Pending,
                cancellationToken);

        var recentOrders = await dbContext.TopupOrders
            .AsNoTracking()
            .Where(order => order.UserId == currentUser.UserId)
            .OrderByDescending(order => order.CreatedAt)
            .Take(5)
            .Select(order => order.ToResponse())
            .ToListAsync(cancellationToken);

        var recentUsageLogs = await dbContext.UsageLogs
            .AsNoTracking()
            .Where(log => log.UserId == currentUser.UserId)
            .OrderByDescending(log => log.CreatedAt)
            .Take(5)
            .Select(log => log.ToResponse())
            .ToListAsync(cancellationToken);

        return new DashboardSummaryResponse(
            account?.Balance ?? 0,
            account?.TotalDeposited ?? 0,
            account?.TotalUsed ?? 0,
            pendingTopupOrders,
            recentOrders,
            recentUsageLogs);
    }
}
