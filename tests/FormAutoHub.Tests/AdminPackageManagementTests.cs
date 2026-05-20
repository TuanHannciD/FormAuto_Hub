using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Tests;

public sealed class AdminPackageManagementTests
{
    [Fact]
    public async Task CreateAdminPackageAsync_CreatesPackageWithApprovedFields()
    {
        await using var context = CreateContext();
        var service = new PackageService(context, new TestCurrentUserContext(true));

        var response = await service.CreateAdminPackageAsync(
            new CreateCreditPackageRequest("Gói chuẩn", 500, 225000, true),
            CancellationToken.None);

        Assert.NotNull(response);
        Assert.Equal("Gói chuẩn", response.Name);
        Assert.Equal(500, response.Credits);
        Assert.Equal(225000, response.Price);
        Assert.True(response.IsActive);
        Assert.Single(await context.CreditPackages.ToListAsync());
    }

    [Fact]
    public async Task UpdateAdminPackageAsync_UpdatesExistingPackageWithoutChangingOrders()
    {
        var packageId = Guid.NewGuid();
        await using var context = CreateContext();
        context.CreditPackages.Add(new CreditPackage
        {
            Id = packageId,
            Name = "Gói cũ",
            Credits = 100,
            Price = 50000,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow
        });
        context.TopupOrders.Add(new TopupOrder
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            PackageId = packageId,
            Credits = 100,
            Amount = 50000,
            Status = "Pending",
            PaymentMethod = "PayOS",
            PaymentNote = "Snapshot",
            CreatedAt = DateTimeOffset.UtcNow
        });
        await context.SaveChangesAsync();
        var service = new PackageService(context, new TestCurrentUserContext(true));

        var response = await service.UpdateAdminPackageAsync(
            packageId,
            new UpdateCreditPackageRequest("Gói mới", 200, 90000, false),
            CancellationToken.None);

        Assert.NotNull(response);
        Assert.Equal("Gói mới", response.Name);
        Assert.False(response.IsActive);
        var order = await context.TopupOrders.SingleAsync();
        Assert.Equal(100, order.Credits);
        Assert.Equal(50000, order.Amount);
    }

    [Fact]
    public async Task CreateAdminPackageAsync_RejectsFractionalVndPrice()
    {
        await using var context = CreateContext();
        var service = new PackageService(context, new TestCurrentUserContext(true));

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAdminPackageAsync(
            new CreateCreditPackageRequest("Gói lỗi", 100, 1000.5m, true),
            CancellationToken.None));
    }

    [Fact]
    public async Task GetAdminPackagesAsync_ReturnsNullForNonAdmin()
    {
        await using var context = CreateContext();
        var service = new PackageService(context, new TestCurrentUserContext(false));

        var response = await service.GetAdminPackagesAsync(CancellationToken.None);

        Assert.Null(response);
    }

    private static FormAutoHubDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new FormAutoHubDbContext(options);
    }

    private sealed class TestCurrentUserContext(bool isAdmin) : ICurrentUserContext
    {
        public Guid UserId { get; } = Guid.NewGuid();
        public bool IsAdmin { get; } = isAdmin;
    }
}
