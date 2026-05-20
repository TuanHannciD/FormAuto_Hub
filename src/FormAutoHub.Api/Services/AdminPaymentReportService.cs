using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface IAdminPaymentReportService
{
    Task<AdminRevenueSummaryResponse> GetRevenueSummaryAsync(CancellationToken cancellationToken);
    Task<AdminPaymentListResponse> GetPaymentsAsync(CancellationToken cancellationToken);
    Task<AdminPaymentResponse?> GetPaymentByIdAsync(Guid id, CancellationToken cancellationToken);
}

public sealed class AdminPaymentReportService(FormAutoHubDbContext dbContext) : IAdminPaymentReportService
{
    public async Task<AdminRevenueSummaryResponse> GetRevenueSummaryAsync(CancellationToken cancellationToken)
    {
        var approvedOrders = dbContext.TopupOrders.Where(order => order.Status == TopupOrderStatuses.Approved);
        var totalRevenue = await approvedOrders.SumAsync(order => (decimal?)order.Amount, cancellationToken) ?? 0;
        var creditSold = await approvedOrders.SumAsync(order => (decimal?)order.Credits, cancellationToken) ?? 0;
        var creditUsed = await dbContext.CreditTransactions
            .Where(item => item.Type == CreditTransactionTypes.CreditUsed)
            .SumAsync(item => (decimal?)-item.Amount, cancellationToken) ?? 0;
        var successfulTopupOrders = await approvedOrders.CountAsync(cancellationToken);
        var pendingTopupOrders = await dbContext.TopupOrders.CountAsync(order => order.Status == TopupOrderStatuses.Pending, cancellationToken);
        var failedPayments = await dbContext.PaymentRecords.CountAsync(item => item.ProviderStatus == PaymentRecordStatuses.Failed, cancellationToken);
        var recentPayments = await QueryPaymentsOrderedByNewest()
            .Take(5)
            .ToListAsync(cancellationToken);

        return new AdminRevenueSummaryResponse(
            totalRevenue,
            creditSold,
            creditUsed,
            successfulTopupOrders,
            pendingTopupOrders,
            failedPayments,
            recentPayments);
    }

    public async Task<AdminPaymentListResponse> GetPaymentsAsync(CancellationToken cancellationToken) =>
        new(await QueryPaymentsOrderedByNewest().ToListAsync(cancellationToken));

    public async Task<AdminPaymentResponse?> GetPaymentByIdAsync(Guid id, CancellationToken cancellationToken) =>
        await QueryPaymentsById(id)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

    private IQueryable<AdminPaymentResponse> QueryPaymentsOrderedByNewest() =>
        from payment in dbContext.PaymentRecords.AsNoTracking()
        join order in dbContext.TopupOrders.AsNoTracking() on payment.TopupOrderId equals order.Id
        orderby payment.CreatedAt descending
        select new AdminPaymentResponse(
            payment.Id,
            payment.TopupOrderId,
            order.UserId,
            payment.Provider,
            payment.ProviderOrderCode,
            payment.ProviderPaymentLinkId,
            payment.Amount,
            order.Credits,
            payment.Currency,
            payment.ProviderStatus,
            order.Status,
            payment.CreatedAt,
            payment.CompletedAt,
            payment.LastWebhookAt);

    private IQueryable<AdminPaymentResponse> QueryPaymentsById(Guid id) =>
        from payment in dbContext.PaymentRecords.AsNoTracking()
        join order in dbContext.TopupOrders.AsNoTracking() on payment.TopupOrderId equals order.Id
        where payment.Id == id
        select new AdminPaymentResponse(
            payment.Id,
            payment.TopupOrderId,
            order.UserId,
            payment.Provider,
            payment.ProviderOrderCode,
            payment.ProviderPaymentLinkId,
            payment.Amount,
            order.Credits,
            payment.Currency,
            payment.ProviderStatus,
            order.Status,
            payment.CreatedAt,
            payment.CompletedAt,
            payment.LastWebhookAt);
}
