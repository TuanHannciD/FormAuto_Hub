using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface ITopupOrderService
{
    Task<TopupOrderResponse?> CreateAsync(CreateTopupOrderRequest request, CancellationToken cancellationToken);
    Task<TopupOrderListResponse> GetMineAsync(CancellationToken cancellationToken);
    Task<TopupOrderListResponse> GetRecentMineAsync(CancellationToken cancellationToken);
    Task<TopupOrderResponse?> GetMineByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<CancelTopupOrderResponse?> CancelAsync(Guid id, CancellationToken cancellationToken);
}

public sealed class TopupOrderService(FormAutoHubDbContext dbContext, ICurrentUserContext currentUser)
    : ITopupOrderService
{
    public async Task<TopupOrderResponse?> CreateAsync(CreateTopupOrderRequest request, CancellationToken cancellationToken)
    {
        var package = await dbContext.CreditPackages
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == request.PackageId && item.IsActive, cancellationToken);

        if (package is null)
        {
            return null;
        }

        var order = new TopupOrder
        {
            Id = Guid.NewGuid(),
            UserId = currentUser.UserId,
            PackageId = package.Id,
            Credits = package.Credits,
            Amount = package.Price,
            Status = TopupOrderStatuses.Pending,
            PaymentMethod = request.PaymentMethod,
            PaymentNote = request.PaymentNote,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.TopupOrders.Add(order);
        await dbContext.SaveChangesAsync(cancellationToken);
        return order.ToResponse();
    }

    public async Task<TopupOrderListResponse> GetMineAsync(CancellationToken cancellationToken) =>
        new(await QueryMine()
            .OrderByDescending(order => order.CreatedAt)
            .Select(order => order.ToResponse())
            .ToListAsync(cancellationToken));

    public async Task<TopupOrderListResponse> GetRecentMineAsync(CancellationToken cancellationToken) =>
        new(await QueryMine()
            .OrderByDescending(order => order.CreatedAt)
            .Take(5)
            .Select(order => order.ToResponse())
            .ToListAsync(cancellationToken));

    public async Task<TopupOrderResponse?> GetMineByIdAsync(Guid id, CancellationToken cancellationToken) =>
        await QueryMine()
            .Where(order => order.Id == id)
            .Select(order => order.ToResponse())
            .SingleOrDefaultAsync(cancellationToken);

    public async Task<CancelTopupOrderResponse?> CancelAsync(Guid id, CancellationToken cancellationToken)
    {
        var order = await dbContext.TopupOrders
            .SingleOrDefaultAsync(item => item.Id == id && item.UserId == currentUser.UserId, cancellationToken);

        if (order is null || order.Status != TopupOrderStatuses.Pending)
        {
            return null;
        }

        order.Status = TopupOrderStatuses.Cancelled;
        await dbContext.SaveChangesAsync(cancellationToken);
        return new CancelTopupOrderResponse(order.Id, order.Status);
    }

    private IQueryable<TopupOrder> QueryMine() =>
        dbContext.TopupOrders
            .AsNoTracking()
            .Where(order => order.UserId == currentUser.UserId);
}
