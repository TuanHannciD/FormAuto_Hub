using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Tests;

public sealed class ManualCreditFlowTests
{
    [Fact]
    public async Task History_PaginatesFiltersAndUsesLatestAuditWithoutDuplicatingLedger()
    {
        await using var db = CreateDb();
        var recipient = User(Guid.NewGuid()); var admin = User(Guid.NewGuid()); admin.Email = "admin-history@example.test";
        db.Users.AddRange(recipient, admin);
        var first = new CreditTransaction { Id = Guid.NewGuid(), UserId = recipient.Id, Type = "ManualGrant", Amount = 5, BalanceAfter = 5, Description = "Hỗ trợ học tập", CreatedAt = DateTimeOffset.UtcNow };
        var old = new CreditTransaction { Id = Guid.NewGuid(), UserId = recipient.Id, Type = "ManualGrant", Amount = 3, BalanceAfter = 3, Description = "Giao dịch cũ", CreatedAt = first.CreatedAt.AddDays(-1) };
        db.CreditTransactions.AddRange(first, old, new CreditTransaction { Id = Guid.NewGuid(), UserId = recipient.Id, Type = "TopupApproved", Amount = 100 });
        db.AuditLogs.AddRange(
            new AuditLog { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), Action = "ManualGrant", TargetType = "CreditTransaction", TargetId = first.Id, CreatedAt = first.CreatedAt.AddSeconds(-1) },
            new AuditLog { Id = Guid.NewGuid(), UserId = admin.Id, Action = "ManualGrant", TargetType = "CreditTransaction", TargetId = first.Id, CreatedAt = first.CreatedAt });
        await db.SaveChangesAsync();
        var service = new AdminCreditOperationsService(db, new CreditService(db), new Actor(admin.Id, true));
        var result = await service.HistoryAsync(null, 1, 1, default);
        Assert.Equal(2, result.TotalItems); Assert.Equal(2, result.TotalPages);
        Assert.Equal(admin.Email, Assert.Single(result.Items).AdminEmail);
        result = await service.HistoryAsync("admin-history", 1, 10, default);
        Assert.Equal(first.Id, Assert.Single(result.Items).Id);
        result = await service.HistoryAsync("Giao dịch cũ", 99, 10, default);
        Assert.Equal(1, result.Page); Assert.Null(Assert.Single(result.Items).AdminId);
        Assert.Empty((await service.HistoryAsync("no-match", 1, 10, default)).Items);
        var userService = new AdminCreditOperationsService(db, new CreditService(db), new Actor(recipient.Id));
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => userService.HistoryAsync(null, 1, 10, default));
    }

    private sealed record Actor(Guid UserId, bool IsAdmin = false) : ICurrentUserContext;
    private static FormAutoHubDbContext CreateDb() => new(new DbContextOptionsBuilder<FormAutoHubDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    private static User User(Guid id) => new() { Id = id, Email = $"{id}@example.test", FullName = "Test", Role = "User" };

    [Fact]
    public async Task Grant_WritesBalanceLedgerAndAdminAuditTogether()
    {
        await using var db = CreateDb();
        var user = User(Guid.NewGuid()); var admin = new Actor(Guid.NewGuid(), true);
        db.Users.Add(user); await db.SaveChangesAsync();
        var service = new AdminCreditOperationsService(db, new CreditService(db), admin);
        var result = await service.GrantAsync(new(user.Id, 7, " hỗ trợ "), default);
        Assert.Equal(7, result!.BalanceAfter);
        var ledger = await db.CreditTransactions.SingleAsync();
        Assert.Equal("ManualGrant", ledger.Type); Assert.Equal("hỗ trợ", ledger.Description);
        Assert.Equal(ledger.Id, (await db.AuditLogs.SingleAsync()).TargetId);
        Assert.Equal(admin.UserId, (await db.AuditLogs.SingleAsync()).UserId);
        Assert.Equal(7, (await db.UserCreditAccounts.SingleAsync()).TotalDeposited);
    }

    [Theory]
    [InlineData(0, "reason")]
    [InlineData(-1, "reason")]
    [InlineData(1, " ")]
    public async Task InvalidGrant_DoesNotWrite(int credits, string reason)
    {
        await using var db = CreateDb(); var user = User(Guid.NewGuid()); db.Users.Add(user); await db.SaveChangesAsync();
        var service = new AdminCreditOperationsService(db, new CreditService(db), new Actor(Guid.NewGuid(), true));
        await Assert.ThrowsAsync<ArgumentException>(() => service.GrantAsync(new(user.Id, credits, reason), default));
        Assert.Empty(db.CreditTransactions); Assert.Empty(db.UserCreditAccounts); Assert.Empty(db.AuditLogs);
    }

    [Fact]
    public async Task MissingUserAndNormalUser_CannotGrant()
    {
        await using var db = CreateDb(); var user = Guid.NewGuid();
        var service = new AdminCreditOperationsService(db, new CreditService(db), new Actor(Guid.NewGuid(), true));
        Assert.Null(await service.GrantAsync(new(user, 5, "reason"), default));
        service = new(db, new CreditService(db), new Actor(user));
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.GrantAsync(new(user, 5, "reason"), default));
        Assert.Empty(db.CreditTransactions);
    }

    [Fact]
    public async Task ManualList_EnrichesIdentityAndExcludesPayos_ApproveOnlyOnce()
    {
        await using var db = CreateDb(); var user = User(Guid.NewGuid()); var package = new CreditPackage { Id = Guid.NewGuid(), Name = "Gói thử", Credits = 10, Price = 10000 };
        db.Users.Add(user); db.CreditPackages.Add(package);
        var manual = new TopupOrder { Id = Guid.NewGuid(), UserId = user.Id, PackageId = package.Id, PaymentMethod = "Manual", Status = "Pending", Credits = 10 };
        var payos = new TopupOrder { Id = Guid.NewGuid(), UserId = user.Id, PackageId = package.Id, PaymentMethod = "PayOS", Status = "Pending", Credits = 10 };
        db.TopupOrders.AddRange(manual, payos); await db.SaveChangesAsync();
        var service = new AdminTopupOrderService(db, new CreditService(db), new Actor(Guid.NewGuid(), true));
        var item = Assert.Single(await service.GetManualAsync(default)); Assert.Equal(user.Email, item.UserEmail); Assert.Equal(package.Name, item.PackageName);
        Assert.NotNull(await service.ApproveAsync(manual.Id, new("ok"), default));
        Assert.Null(await service.ApproveAsync(manual.Id, new("again"), default));
        Assert.Null(await service.ApproveAsync(payos.Id, new("invalid"), default));
        Assert.Single(db.CreditTransactions); Assert.Equal(10, (await db.UserCreditAccounts.SingleAsync()).Balance);
    }

    [Fact]
    public async Task Evidence_IsPrivateAndCannotBeAttachedByAnotherUser()
    {
        await using var db = CreateDb(); var owner = new Actor(Guid.NewGuid()); var other = new Actor(Guid.NewGuid());
        var evidence = new TopupEvidenceService(db, owner);
        var upload = await evidence.UploadAsync("proof.png", [137,80,78,71,13,10,26,10,0], default);
        Assert.NotNull(await evidence.GetMineAsync(upload.FileId, default));
        Assert.Null(await new TopupEvidenceService(db, other).GetMineAsync(upload.FileId, default));
        Assert.Null(await evidence.GetAttachedAsync(upload.FileId, default));
        var orders = new TopupOrderService(db, other);
        await Assert.ThrowsAsync<ArgumentException>(() => orders.CreateAsync(new(Guid.NewGuid(), "Manual", "note", upload.FileId), default));
        await Assert.ThrowsAsync<ArgumentException>(() => evidence.UploadAsync("bad.svg", "<svg/>"u8.ToArray(), default));
        await Assert.ThrowsAsync<ArgumentException>(() => evidence.UploadAsync("big.png", new byte[TopupEvidenceService.MaxBytes + 1], default));
    }
}
