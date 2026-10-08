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
        if (!string.IsNullOrWhiteSpace(request.PaymentMethod) && !string.Equals(request.PaymentMethod, "Manual", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Đơn đối soát phải dùng phương thức Manual. Tạo đơn PayOS qua API thanh toán.");
        if (string.IsNullOrWhiteSpace(request.PaymentNote) || request.PaymentNote.Length > 1000)
            throw new ArgumentException("Ghi chú chuyển khoản là bắt buộc, tối đa 1000 ký tự.");
        if (request.FileId.HasValue && !await dbContext.TopupEvidence.AnyAsync(x => x.Id == request.FileId && x.UserId == currentUser.UserId, cancellationToken))
            throw new ArgumentException("Ảnh minh chứng không tồn tại hoặc không thuộc tài khoản của bạn.");
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
            PaymentMethod = "Manual",
            PaymentNote = request.PaymentNote.Trim(),
            EvidenceFileId = request.FileId,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.TopupOrders.Add(order);
        if (request.FileId.HasValue)
        {
            var evidence = await dbContext.TopupEvidence.SingleAsync(x => x.Id == request.FileId, cancellationToken);
            if (evidence.TopupOrderId.HasValue)
                throw new ArgumentException("Ảnh minh chứng đã được gắn với một đơn khác. Hãy tải ảnh cho đơn mới.");
            evidence.TopupOrderId = order.Id;
        }
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
