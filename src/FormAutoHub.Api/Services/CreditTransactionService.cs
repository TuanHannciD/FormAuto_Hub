using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface ICreditTransactionService
{
    Task<CreditTransactionListResponse> GetMineAsync(CancellationToken cancellationToken);
}

public sealed class CreditTransactionService(FormAutoHubDbContext dbContext, ICurrentUserContext currentUser)
    : ICreditTransactionService
{
    public async Task<CreditTransactionListResponse> GetMineAsync(CancellationToken cancellationToken) =>
        new(await dbContext.CreditTransactions
            .AsNoTracking()
            .Where(transaction => transaction.UserId == currentUser.UserId)
            .OrderByDescending(transaction => transaction.CreatedAt)
            .Select(transaction => transaction.ToResponse())
            .ToListAsync(cancellationToken));
}
