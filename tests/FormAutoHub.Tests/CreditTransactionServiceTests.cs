using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Tests;

public sealed class CreditTransactionServiceTests
{
    [Fact]
    public async Task GetMineAsync_FiltersBySearchAndPaginates()
    {
        var userId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedCreditTransaction(context, userId, CreditTransactionTypes.TopupApproved, "Alpha top-up", 10, minutesAgo: 1);
        SeedCreditTransaction(context, userId, CreditTransactionTypes.TopupApproved, "Beta top-up", 20, minutesAgo: 2);
        SeedCreditTransaction(context, userId, CreditTransactionTypes.TopupApproved, "Alpha older top-up", 30, minutesAgo: 3);
        SeedCreditTransaction(context, userId, CreditTransactionTypes.CreditUsed, "Alpha usage", -1, minutesAgo: 4);
        SeedCreditTransaction(context, Guid.NewGuid(), CreditTransactionTypes.TopupApproved, "Alpha other user", 50, minutesAgo: 5);
        await context.SaveChangesAsync();
        var service = new CreditTransactionService(context, new TestCurrentUserContext(userId));

        var page = await service.GetMineAsync(
            new CreditTransactionQuery(null, "Alpha", Page: 1, PageSize: 2),
            CancellationToken.None);

        Assert.Equal(3, page.TotalItems);
        Assert.Equal(2, page.TotalPages);
        Assert.Equal(1, page.Page);
        Assert.Equal(2, page.PageSize);
        Assert.Equal([10m, 30m], page.Items.Select(item => item.Amount));
    }

    [Fact]
    public async Task GetMineAsync_FiltersByType()
    {
        var userId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedCreditTransaction(context, userId, CreditTransactionTypes.TopupApproved, "Top-up", 10, minutesAgo: 1);
        SeedCreditTransaction(context, userId, CreditTransactionTypes.CreditUsed, "Usage", -1, minutesAgo: 2);
        SeedCreditTransaction(context, userId, CreditTransactionTypes.InitialGrant, "Initial credits", 5, minutesAgo: 3);
        await context.SaveChangesAsync();
        var service = new CreditTransactionService(context, new TestCurrentUserContext(userId));

        var page = await service.GetMineAsync(
            new CreditTransactionQuery(CreditTransactionTypes.CreditUsed, null, Page: 1, PageSize: 20),
            CancellationToken.None);

        Assert.Equal(1, page.TotalItems);
        var item = Assert.Single(page.Items);
        Assert.Equal(CreditTransactionTypes.CreditUsed, item.Type);
        Assert.Equal(-1, item.Amount);
    }

    [Fact]
    public async Task GetMineAsync_ClampsInvalidPageAndPageSize()
    {
        var userId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedCreditTransaction(context, userId, CreditTransactionTypes.InitialGrant, "Initial credits", 5, minutesAgo: 1);
        await context.SaveChangesAsync();
        var service = new CreditTransactionService(context, new TestCurrentUserContext(userId));

        var page = await service.GetMineAsync(
            new CreditTransactionQuery(null, null, Page: 0, PageSize: 0),
            CancellationToken.None);

        Assert.Equal(1, page.Page);
        Assert.Equal(1, page.PageSize);
        Assert.Single(page.Items);
    }

    private static void SeedCreditTransaction(
        FormAutoHubDbContext context,
        Guid userId,
        string type,
        string description,
        decimal amount,
        int minutesAgo)
    {
        context.CreditTransactions.Add(new CreditTransaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Amount = amount,
            BalanceAfter = 100 + amount,
            Type = type,
            Description = description,
            ReferenceType = "TopupOrder",
            ReferenceId = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-minutesAgo)
        });
    }

    private static FormAutoHubDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new FormAutoHubDbContext(options);
    }

    private sealed class TestCurrentUserContext(Guid userId) : ICurrentUserContext
    {
        public Guid UserId { get; } = userId;
        public bool IsAdmin => false;
    }
}
