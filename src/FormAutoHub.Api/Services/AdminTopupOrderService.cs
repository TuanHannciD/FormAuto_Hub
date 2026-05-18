using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface IAdminTopupOrderService
{
    Task<IReadOnlyList<AdminTopupOrderResponse>> GetAllAsync(CancellationToken cancellationToken);
    Task<ApproveTopupOrderResponse?> ApproveAsync(Guid id, ApproveTopupOrderRequest request, CancellationToken cancellationToken);
    Task<RejectTopupOrderResponse?> RejectAsync(Guid id, RejectTopupOrderRequest request, CancellationToken cancellationToken);
}

public sealed class AdminTopupOrderService(FormAutoHubDbContext dbContext, ICreditService creditService)
    : IAdminTopupOrderService
{
    public async Task<IReadOnlyList<AdminTopupOrderResponse>> GetAllAsync(CancellationToken cancellationToken) =>
        await dbContext.TopupOrders
            .AsNoTracking()
            .OrderByDescending(order => order.CreatedAt)
            .Select(order => order.ToAdminResponse())
            .ToListAsync(cancellationToken);

    public async Task<ApproveTopupOrderResponse?> ApproveAsync(
        Guid id,
        ApproveTopupOrderRequest request,
        CancellationToken cancellationToken)
    {
        var order = await dbContext.TopupOrders.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (order is null || order.Status != TopupOrderStatuses.Pending)
        {
            return null;
        }

        order.Status = TopupOrderStatuses.Approved;
        order.ApprovedAt = DateTimeOffset.UtcNow;
        order.PaymentNote = request.PaymentNote;

        var (transaction, account) = await creditService.AddTopupCreditsAsync(
            order,
            "Top-up order approved.",
            cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);
        return new ApproveTopupOrderResponse(order.Id, order.Status, transaction.Id, account.Balance);
    }

    public async Task<RejectTopupOrderResponse?> RejectAsync(
        Guid id,
        RejectTopupOrderRequest request,
        CancellationToken cancellationToken)
    {
        var order = await dbContext.TopupOrders.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (order is null || order.Status != TopupOrderStatuses.Pending)
        {
            return null;
        }

        order.Status = TopupOrderStatuses.Rejected;
        order.PaymentNote = request.PaymentNote;
        await dbContext.SaveChangesAsync(cancellationToken);
        return new RejectTopupOrderResponse(order.Id, order.Status);
    }
}
