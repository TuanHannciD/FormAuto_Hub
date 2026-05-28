using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface ICreditTransactionService
{
    Task<CreditTransactionPageResponse> GetMineAsync(CreditTransactionQuery query, CancellationToken cancellationToken);
}

public sealed class CreditTransactionService(FormAutoHubDbContext dbContext, ICurrentUserContext currentUser)
    : ICreditTransactionService
{
    private const int MaxPageSize = 100;

    public async Task<CreditTransactionPageResponse> GetMineAsync(
        CreditTransactionQuery query,
        CancellationToken cancellationToken)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, MaxPageSize);
        var transactions = ApplyFilters(QueryMine(), query);
        var totalItems = await transactions.CountAsync(cancellationToken);
        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);
        var items = await transactions
            .OrderByDescending(transaction => transaction.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(transaction => transaction.ToResponse())
            .ToListAsync(cancellationToken);

        return new CreditTransactionPageResponse(items, page, pageSize, totalItems, totalPages);
    }

    private IQueryable<Entities.CreditTransaction> QueryMine() =>
        dbContext.CreditTransactions.AsNoTracking().Where(transaction => transaction.UserId == currentUser.UserId);

    private static IQueryable<Entities.CreditTransaction> ApplyFilters(
        IQueryable<Entities.CreditTransaction> transactions,
        CreditTransactionQuery query)
    {
        var type = query.Type?.Trim();
        if (!string.IsNullOrWhiteSpace(type))
        {
            transactions = transactions.Where(transaction => transaction.Type == type);
        }

        var search = query.Search?.Trim();
        if (!string.IsNullOrWhiteSpace(search))
        {
            transactions = transactions.Where(transaction =>
                transaction.Type.Contains(search) ||
                transaction.Description.Contains(search) ||
                transaction.ReferenceType.Contains(search));
        }

        return transactions;
    }
}
