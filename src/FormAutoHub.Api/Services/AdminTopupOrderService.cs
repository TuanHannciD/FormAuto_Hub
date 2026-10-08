using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using Microsoft.EntityFrameworkCore;
using FormAutoHub.Api.Auth;

namespace FormAutoHub.Api.Services;

public interface IAdminTopupOrderService
{
    Task<IReadOnlyList<AdminTopupOrderResponse>> GetAllAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<AdminTopupOrderResponse>> GetManualAsync(CancellationToken cancellationToken);
    Task<ApproveTopupOrderResponse?> ApproveAsync(Guid id, ApproveTopupOrderRequest request, CancellationToken cancellationToken);
    Task<RejectTopupOrderResponse?> RejectAsync(Guid id, RejectTopupOrderRequest request, CancellationToken cancellationToken);
}

public sealed class AdminTopupOrderService(FormAutoHubDbContext dbContext, ICreditService creditService, ICurrentUserContext currentUser)
    : IAdminTopupOrderService
{
    public async Task<IReadOnlyList<AdminTopupOrderResponse>> GetAllAsync(CancellationToken cancellationToken) =>
        await QueryOrders(false).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<AdminTopupOrderResponse>> GetManualAsync(CancellationToken cancellationToken) =>
        await QueryOrders(true).ToListAsync(cancellationToken);

    private IQueryable<AdminTopupOrderResponse> QueryOrders(bool manualOnly) =>
        from order in dbContext.TopupOrders.AsNoTracking()
        join user in dbContext.Users on order.UserId equals user.Id into users
        from user in users.DefaultIfEmpty()
        join package in dbContext.CreditPackages on order.PackageId equals package.Id into packages
        from package in packages.DefaultIfEmpty()
        where !manualOnly || order.PaymentMethod == "Manual"
        orderby order.CreatedAt descending
        select new AdminTopupOrderResponse(order.Id, order.UserId, order.PackageId, order.Credits, order.Amount,
            order.Status, order.PaymentMethod, order.PaymentNote, order.CreatedAt, order.PaidAt, order.ApprovedAt,
            user == null ? "" : user.Email, package == null ? "" : package.Name, order.EvidenceFileId);

    public async Task<ApproveTopupOrderResponse?> ApproveAsync(
        Guid id,
        ApproveTopupOrderRequest request,
        CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin) throw new UnauthorizedAccessException();
        var transactionId = Guid.NewGuid();
        return await CreditWriteTransaction.RunAsync<ApproveTopupOrderResponse?>(dbContext, async () =>
        {
            var committed = await dbContext.CreditTransactions.AsNoTracking().SingleOrDefaultAsync(x => x.Id == transactionId, cancellationToken);
            if (committed is not null) return new(id, TopupOrderStatuses.Approved, committed.Id, committed.BalanceAfter);
            var order = await dbContext.TopupOrders.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
            if (order is null || order.Status != TopupOrderStatuses.Pending || order.PaymentMethod != "Manual")
            {
                return null;
            }

            order.Status = TopupOrderStatuses.Approved;
            order.ApprovedAt = DateTimeOffset.UtcNow;
            order.PaymentNote = request.PaymentNote;

            var (transaction, account) = await creditService.AddTopupCreditsAsync(
                order,
                "Top-up order approved.",
                cancellationToken, transactionId);

            AuditLogWriter.Add(dbContext, GetAdminId(), "TopupApproved", "TopupOrder", order.Id,
                new { order.UserId, order.Credits, creditTransactionId = transaction.Id });

            await dbContext.SaveChangesAsync(cancellationToken);
            return new ApproveTopupOrderResponse(order.Id, order.Status, transaction.Id, account.Balance);
        }, cancellationToken);
    }

    public async Task<RejectTopupOrderResponse?> RejectAsync(
        Guid id,
        RejectTopupOrderRequest request,
        CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin) throw new UnauthorizedAccessException();
        if (string.IsNullOrWhiteSpace(request.PaymentNote) || request.PaymentNote.Length > 1000)
            throw new ArgumentException("Lý do từ chối là bắt buộc, tối đa 1000 ký tự.");
        var order = await dbContext.TopupOrders.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (order is null || order.Status != TopupOrderStatuses.Pending || order.PaymentMethod != "Manual")
        {
            return null;
        }

        order.Status = TopupOrderStatuses.Rejected;
        order.PaymentNote = request.PaymentNote;
        AuditLogWriter.Add(dbContext, GetAdminId(), "TopupRejected", "TopupOrder", order.Id, new { reason = request.PaymentNote });
        await dbContext.SaveChangesAsync(cancellationToken);
        return new RejectTopupOrderResponse(order.Id, order.Status);
    }

    private Guid GetAdminId() => currentUser.UserId;
}
