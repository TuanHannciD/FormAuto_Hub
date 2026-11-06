using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Controllers;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Tests;

public sealed class GenerationHistoryApiTests
{
    [Fact]
    public async Task OwnerBinding_DefaultsPagination_AndNoStore()
    {
        var service = new Stub(); var controller = Create(service);
        var result = await controller.GetMine(1, 10, default);
        Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal((1, 10), service.Pagination);
        Assert.Equal("no-store", controller.Response.Headers.CacheControl);
    }

    [Theory]
    [InlineData(0, 10)] [InlineData(1, 0)] [InlineData(1, 21)]
    public async Task InvalidPaginationIs400WithoutServiceCall(int page, int size)
    {
        var service = new Stub(); var controller = Create(service);
        Assert.IsType<BadRequestObjectResult>((await controller.GetMine(page, size, default)).Result);
        Assert.Null(service.Pagination);
    }

    [Fact]
    public async Task MissingUnownedExpiredAreSame404WithoutCache()
    {
        var controller = Create(new Stub());
        Assert.IsType<NotFoundResult>((await controller.GetDetail(Guid.NewGuid(), default)).Result);
        Assert.Equal("no-store", controller.Response.Headers.CacheControl);
    }

    [Fact]
    public async Task DashboardKeepsPostedAndSeparatelyProjectsOutstandingReservations()
    {
        await using var db = GenerationHistoryServiceTests.CreateContext();
        var user = Guid.NewGuid();
        db.UserCreditAccounts.Add(new() { Id = Guid.NewGuid(), UserId = user, Balance = 10.5m, TotalUsed = 3, TotalDeposited = 13.5m });
        db.CreditReservations.Add(new() { Id = Guid.NewGuid(), UserId = user, JobId = Guid.NewGuid(), InitialAmount = 7, OutstandingAmount = 4 });
        db.CreditReservations.Add(new() { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), JobId = Guid.NewGuid(), InitialAmount = 8, OutstandingAmount = 8 });
        await db.SaveChangesAsync();
        var result = await new DashboardService(db, new GenerationHistoryServiceTests.UserContext(user)).GetSummaryAsync(default);
        Assert.Equal(10.5m, result.CurrentCreditBalance);
        Assert.Equal(4, result.ReservedCreditBalance);
        Assert.Equal(6.5m, result.AvailableCreditBalance);
        Assert.Equal(3, result.TotalCreditsUsed);
    }

    private static GenerationHistoryController Create(Stub service) => new(service)
    { ControllerContext = new() { HttpContext = new DefaultHttpContext() } };
    private sealed class Stub : IGenerationHistoryService
    {
        public (int, int)? Pagination;
        public Task<GenerationHistoryPageResponse> GetMineAsync(int page, int pageSize, CancellationToken ct)
        { Pagination = (page, pageSize); return Task.FromResult(new GenerationHistoryPageResponse([], page, pageSize, 0, 0)); }
        public Task<GenerationHistoryDetailResponse?> GetDetailAsync(Guid id, CancellationToken ct) => Task.FromResult<GenerationHistoryDetailResponse?>(null);
    }
}
