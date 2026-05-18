using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Tests;

public sealed class Phase2TopupApprovalTests
{
    [Fact]
    public async Task ApproveAsync_IncreasesCreditBalanceAndWritesCreditTransaction()
    {
        var userId = Guid.NewGuid();
        var packageId = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        await using var context = CreateContext();

        context.Users.Add(new User
        {
            Id = userId,
            Email = "user@example.test",
            PasswordHash = "hash",
            FullName = "Test User",
            Role = UserRoles.User,
            CreatedAt = DateTimeOffset.UtcNow
        });
        context.CreditPackages.Add(new CreditPackage
        {
            Id = packageId,
            Name = "Starter",
            Credits = 100,
            Price = 100000,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow
        });
        context.TopupOrders.Add(new TopupOrder
        {
            Id = orderId,
            UserId = userId,
            PackageId = packageId,
            Credits = 100,
            Amount = 100000,
            Status = TopupOrderStatuses.Pending,
            PaymentMethod = "Manual",
            PaymentNote = "Initial note",
            CreatedAt = DateTimeOffset.UtcNow
        });
        await context.SaveChangesAsync();

        var creditService = new CreditService(context);
        var adminService = new AdminTopupOrderService(context, creditService);

        var result = await adminService.ApproveAsync(orderId, new ApproveTopupOrderRequest("Approved"), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(TopupOrderStatuses.Approved, result.Status);
        Assert.Equal(100, result.BalanceAfter);

        var account = await context.UserCreditAccounts.SingleAsync(item => item.UserId == userId);
        Assert.Equal(100, account.Balance);
        Assert.Equal(100, account.TotalDeposited);

        var transaction = await context.CreditTransactions.SingleAsync(item => item.UserId == userId);
        Assert.Equal(CreditTransactionTypes.TopupApproved, transaction.Type);
        Assert.Equal(100, transaction.Amount);
        Assert.Equal(100, transaction.BalanceAfter);
        Assert.Equal(nameof(TopupOrder), transaction.ReferenceType);
        Assert.Equal(orderId, transaction.ReferenceId);
    }

    private static FormAutoHubDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new FormAutoHubDbContext(options);
    }
}
