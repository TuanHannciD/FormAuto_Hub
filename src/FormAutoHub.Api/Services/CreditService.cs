using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface ICreditService
{
    Task<(CreditTransaction Transaction, UserCreditAccount Account)> AddManualCreditsAsync(
        Guid userId, int credits, string reason, CancellationToken cancellationToken, Guid? transactionId = null);
    Task<(CreditTransaction Transaction, UserCreditAccount Account)> GrantInitialCreditsAsync(
        Guid userId,
        int credits,
        string description,
        CancellationToken cancellationToken);

    Task<(CreditTransaction Transaction, UserCreditAccount Account)> AddTopupCreditsAsync(
        TopupOrder order,
        string description,
        CancellationToken cancellationToken,
        Guid? transactionId = null);

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
    public async Task<(CreditTransaction Transaction, UserCreditAccount Account)> AddManualCreditsAsync(
        Guid userId, int credits, string reason, CancellationToken cancellationToken, Guid? transactionId = null)
    {
        if (credits <= 0 || string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Số credit phải lớn hơn 0 và phải có lý do cộng credit.");
        var account = await CreditAccountLock.AcquireAsync(dbContext, userId, cancellationToken);
        if (account is null)
        {
            account = new UserCreditAccount { Id = Guid.NewGuid(), UserId = userId };
            dbContext.UserCreditAccounts.Add(account);
        }
        account.Balance += credits;
        account.TotalDeposited += credits;
        account.UpdatedAt = DateTimeOffset.UtcNow;
        var transaction = new CreditTransaction
        {
            Id = transactionId ?? Guid.NewGuid(), UserId = userId, Amount = credits, BalanceAfter = account.Balance,
            Type = CreditTransactionTypes.ManualGrant, Description = reason.Trim(),
            ReferenceType = nameof(User), ReferenceId = userId, CreatedAt = DateTimeOffset.UtcNow
        };
        dbContext.CreditTransactions.Add(transaction);
        return (transaction, account);
    }

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

        var account = await CreditAccountLock.AcquireAsync(dbContext, userId, cancellationToken);

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
        CancellationToken cancellationToken,
        Guid? transactionId = null)
    {
        var account = await CreditAccountLock.AcquireAsync(dbContext, order.UserId, cancellationToken);

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
        if (transactionId.HasValue) transaction.Id = transactionId.Value;
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

        var account = await CreditAccountLock.AcquireAsync(dbContext, userId, cancellationToken);
        var reserved = await dbContext.CreditReservations.Where(x => x.UserId == userId && x.ClosedAt == null)
            .SumAsync(x => (decimal?)x.OutstandingAmount, cancellationToken) ?? 0m;
        // Only settlement of this durable paid item may consume its own held unit.
        if (referenceType == nameof(SubmissionJobItem))
        {
            var item = await dbContext.SubmissionJobItems.SingleOrDefaultAsync(x => x.Id == referenceId, cancellationToken);
            if (credits != 1 || item is null || item.MaximumSendCredits != 1 || item.SettlementState != "Held" ||
                item.AttemptState is not ("PossibleDispatch" or "Unknown") ||
                !await dbContext.CreditReservations.AnyAsync(x => x.UserId == userId && x.JobId == item.JobId && x.OutstandingAmount >= 1, cancellationToken))
                throw new InvalidOperationException("A matching durable paid hold is required.");
            reserved -= 1;
        }

        if (account is null || account.Balance - reserved < credits)
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
