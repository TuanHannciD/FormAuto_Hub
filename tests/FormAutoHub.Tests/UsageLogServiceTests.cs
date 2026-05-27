using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Tests;

public sealed class UsageLogServiceTests
{
    private const string GeneratedAnswersAction = "Xem lại câu trả lời được tạo";

    [Fact]
    public async Task GetMineAsync_FiltersByActionAndSearchAndPaginates()
    {
        var userId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedUsageLog(context, userId, GeneratedAnswersAction, "Alpha preview", 3, minutesAgo: 1);
        SeedUsageLog(context, userId, GeneratedAnswersAction, "Beta preview", 2, minutesAgo: 2);
        SeedUsageLog(context, userId, GeneratedAnswersAction, "Alpha older preview", 1, minutesAgo: 3);
        SeedUsageLog(context, userId, "AnalyzeForm", "Alpha analysis", 0, minutesAgo: 4);
        SeedUsageLog(context, Guid.NewGuid(), GeneratedAnswersAction, "Alpha other user", 5, minutesAgo: 5);
        await context.SaveChangesAsync();
        var service = new UsageLogService(context, new TestCurrentUserContext(userId));

        var page = await service.GetMineAsync(
            new UsageLogQuery(GeneratedAnswersAction, "Alpha", Page: 1, PageSize: 2),
            CancellationToken.None);

        Assert.Equal(2, page.TotalItems);
        Assert.Equal(1, page.TotalPages);
        Assert.Equal(1, page.Page);
        Assert.Equal(2, page.PageSize);
        Assert.Equal([3, 1], page.Items.Select(item => item.CreditsUsed));
        Assert.All(page.Items, item => Assert.Equal(GeneratedAnswersAction, item.Action));
    }

    [Fact]
    public async Task GetMineAsync_ClampsInvalidPageAndPageSize()
    {
        var userId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedUsageLog(context, userId, GeneratedAnswersAction, "Preview", 1, minutesAgo: 1);
        await context.SaveChangesAsync();
        var service = new UsageLogService(context, new TestCurrentUserContext(userId));

        var page = await service.GetMineAsync(
            new UsageLogQuery(null, null, Page: 0, PageSize: 0),
            CancellationToken.None);

        Assert.Equal(1, page.Page);
        Assert.Equal(1, page.PageSize);
        Assert.Single(page.Items);
    }

    private static void SeedUsageLog(
        FormAutoHubDbContext context,
        Guid userId,
        string action,
        string description,
        int creditsUsed,
        int minutesAgo)
    {
        context.UsageLogs.Add(new UsageLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ToolName = "FormAutomation",
            Action = action,
            CreditsUsed = creditsUsed,
            Status = UsageLogStatuses.Success,
            Description = description,
            ProjectId = Guid.NewGuid(),
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
