using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface ICreditService
{
    Task<(CreditTransaction Transaction, UserCreditAccount Account)> GrantInitialCreditsAsync(
        Guid userId,
        int credits,
        string description,
        CancellationToken cancellationToken);

    Task<(CreditTransaction Transaction, UserCreditAccount Account)> AddTopupCreditsAsync(
        TopupOrder order,
        string description,
        CancellationToken cancellationToken);

    Task<(CreditTransaction Transaction, UserCreditAccount Account)?> DeductUsageCreditsAsync(
        Guid userId,
        int credits,
        string description,
        string referenceType,
        Guid referenceId,
        CancellationToken cancellationToken);
}

public sealed class CreditService(FormAutoHubDbContext dbContext) : ICreditService
{
    public async Task<(CreditTransaction Transaction, UserCreditAccount Account)> GrantInitialCreditsAsync(
        Guid userId,
        int credits,
        string description,
        CancellationToken cancellationToken)
    {
        if (credits <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(credits), "Credits must be greater than zero.");
        }

        var account = await dbContext.UserCreditAccounts
            .SingleOrDefaultAsync(item => item.UserId == userId, cancellationToken);

        if (account is null)
        {
            account = new UserCreditAccount
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Balance = 0,
                TotalDeposited = 0,
                TotalUsed = 0,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            dbContext.UserCreditAccounts.Add(account);
        }

        account.Balance += credits;
        account.TotalDeposited += credits;
        account.UpdatedAt = DateTimeOffset.UtcNow;

        var transaction = new CreditTransaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Amount = credits,
            BalanceAfter = account.Balance,
            Type = CreditTransactionTypes.InitialGrant,
            Description = description,
            ReferenceType = nameof(User),
            ReferenceId = userId,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.CreditTransactions.Add(transaction);
        return (transaction, account);
    }

    public async Task<(CreditTransaction Transaction, UserCreditAccount Account)> AddTopupCreditsAsync(
        TopupOrder order,
        string description,
        CancellationToken cancellationToken)
    {
        var account = await dbContext.UserCreditAccounts
            .SingleOrDefaultAsync(item => item.UserId == order.UserId, cancellationToken);

        if (account is null)
        {
            account = new UserCreditAccount
            {
                Id = Guid.NewGuid(),
                UserId = order.UserId,
                Balance = 0,
                TotalDeposited = 0,
                TotalUsed = 0,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            dbContext.UserCreditAccounts.Add(account);
        }

        account.Balance += order.Credits;
        account.TotalDeposited += order.Credits;
        account.UpdatedAt = DateTimeOffset.UtcNow;

        var transaction = new CreditTransaction
        {
            Id = Guid.NewGuid(),
            UserId = order.UserId,
            Amount = order.Credits,
            BalanceAfter = account.Balance,
            Type = CreditTransactionTypes.TopupApproved,
            Description = description,
            ReferenceType = nameof(TopupOrder),
            ReferenceId = order.Id,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.CreditTransactions.Add(transaction);
        return (transaction, account);
    }

    public async Task<(CreditTransaction Transaction, UserCreditAccount Account)?> DeductUsageCreditsAsync(
        Guid userId,
        int credits,
        string description,
        string referenceType,
        Guid referenceId,
        CancellationToken cancellationToken)
    {
        if (credits <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(credits), "Credits must be greater than zero.");
        }

        var account = await dbContext.UserCreditAccounts
            .SingleOrDefaultAsync(item => item.UserId == userId, cancellationToken);

        if (account is null || account.Balance < credits)
        {
            return null;
        }

        account.Balance -= credits;
        account.TotalUsed += credits;
        account.UpdatedAt = DateTimeOffset.UtcNow;

        var transaction = new CreditTransaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Amount = -credits,
            BalanceAfter = account.Balance,
            Type = CreditTransactionTypes.CreditUsed,
            Description = description,
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.CreditTransactions.Add(transaction);
        return (transaction, account);
    }
}
