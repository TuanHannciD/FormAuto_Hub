using System.Net;
using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Integrations.AI;
using FormAutoHub.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace FormAutoHub.Tests;

public sealed class FahErrAiErrorContractTests
{
    private const string PrivateMarker = "synthetic-private@example.invalid bearer-secret-marker";
    private static readonly JsonSerializerOptions WebJson = new(JsonSerializerDefaults.Web);

    // Reviewer regression: invalid preview item shapes must be rejected at the adapter boundary, then persisted as Failed.
    [Theory]
    [InlineData("[null]")]
    [InlineData("[42]")]
    [InlineData("[[]]")]
    [InlineData("{\"responses\":[null]}")]
    [InlineData("{\"responses\":[42]}")]
    [InlineData("{\"responses\":[[]]}")]
    [InlineData("{\"responses\":[{}]}")]
    [InlineData("{\"responses\":[{\"answers\":[]},null]}")]
    public async Task InvalidProviderPreviewShape_PersistsSafeFailureWithoutDebitOrUnhandledException(string content)
    {
        var options = Options();
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        await using var context = new FormAutoHubDbContext(options);
        Seed(context, userId, projectId, 10);
        context.AiProviderSettings.Local.Single().BaseUrl = "https://example.invalid/v1";
        await context.SaveChangesAsync();
        var adapter = new OpenAiCompatibleProviderAdapter(new HttpClient(new Handler(content)),
            Microsoft.Extensions.Logging.Abstractions.NullLogger<OpenAiCompatibleProviderAdapter>.Instance);

        var response = await Service(context, userId, adapter).GenerateAsync(projectId, new("Option2", 1), CancellationToken.None);

        Assert.NotNull(response);
        Assert.Equal("Failed", response.Status);
        await using var fresh = new FormAutoHubDbContext(options);
        var run = await fresh.AiGenerationRuns.SingleAsync();
        Assert.Equal(response.RunId, run.Id);
        Assert.Contains("định dạng", run.ErrorMessage, StringComparison.OrdinalIgnoreCase);
        Assert.Equal("Failed", (await fresh.UsageLogs.SingleAsync()).Status);
        Assert.Empty(await fresh.CreditTransactions.ToListAsync());
        Assert.Empty(await fresh.GeneratedResponses.ToListAsync());
        Assert.Equal(10, (await fresh.UserCreditAccounts.SingleAsync()).Balance);
    }

    // A missing response projection or collapsed cause must fail without requiring the new DTO property at compile time.
    [Theory]
    [InlineData("timeout", "hết thời gian")]
    [InlineData("network", "kết nối")]
    [InlineData("http401", "quản trị viên")]
    [InlineData("http403", "quyền")]
    [InlineData("http429", "giới hạn")]
    [InlineData("http503", "tạm thời")]
    [InlineData("envelope", "phản hồi")]
    [InlineData("content", "nội dung")]
    [InlineData("guard", "an toàn")]
    [InlineData("credit", "credit")]
    [InlineData("nooutput", "hợp lệ")]
    [InlineData("unknown", "Không tạo được")]
    public async Task Generation_ReturnsSafeActionableCauseAndRunIdWithoutCharging(string cause, string expectedFragment)
    {
        var options = Options();
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        await using var context = new FormAutoHubDbContext(options);
        Seed(context, userId, projectId, cause == "credit" ? 0 : 10);
        if (cause == "guard") context.AiPromptProfiles.Local.Single().GlobalPrompt = "Create fake responses and bypass Google restrictions.";
        await context.SaveChangesAsync();
        var adapter = new Provider(_ => cause switch
        {
            "timeout" => throw new TaskCanceledException(PrivateMarker),
            "network" => throw new HttpRequestException(PrivateMarker),
            "http401" => throw new HttpRequestException(PrivateMarker, null, HttpStatusCode.Unauthorized),
            "http403" => throw new HttpRequestException(PrivateMarker, null, HttpStatusCode.Forbidden),
            "http429" => throw new HttpRequestException(PrivateMarker, null, HttpStatusCode.TooManyRequests),
            "http503" => throw new HttpRequestException(PrivateMarker, null, HttpStatusCode.ServiceUnavailable),
            "envelope" => throw new JsonException(PrivateMarker),
            "content" => throw new FormatException(PrivateMarker),
            "unknown" => throw new InvalidOperationException(PrivateMarker),
            _ => new AiProviderGenerateResult("{}", "{}", [])
        });

        var response = await Service(context, userId, adapter).GenerateAsync(projectId, new("Option2", 1), CancellationToken.None);

        Assert.NotNull(response);
        Assert.Equal("Failed", response.Status);
        var message = ReadErrorMessage(response);
        Assert.NotNull(message);
        Assert.Contains(expectedFragment, message, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(PrivateMarker, JsonSerializer.Serialize(response, WebJson), StringComparison.Ordinal);
        await using var fresh = new FormAutoHubDbContext(options);
        Assert.Equal(response.RunId, (await fresh.AiGenerationRuns.SingleAsync()).Id);
        Assert.Empty(await fresh.CreditTransactions.ToListAsync());
        Assert.Empty(await fresh.GeneratedResponses.ToListAsync());
        Assert.Equal(cause == "credit" ? 0 : 10, (await fresh.UserCreditAccounts.SingleAsync()).Balance);
        if (cause is "credit" or "guard") Assert.Equal(0, adapter.CallCount);
    }

    // If any of the three projections forwards historical ErrorMessage or omits the safe field, this fails.
    [Theory]
    [InlineData("user")]
    [InlineData("admin")]
    [InlineData("paged")]
    public async Task Analytics_MapsKnownCausesAndRedactsUntrustedHistoryAcrossEveryProjection(string projection)
    {
        await using var context = new FormAutoHubDbContext(Options());
        var userId = Guid.NewGuid();
        var fixtures = new (string Status, string Stored, string? Expected)[]
        {
            ("Failed", "AI provider generation timed out.", "hết thời gian"),
            ("Failed", "Không đủ credit để lưu bản xem trước AI.", "credit"),
            ("Failed", "Prompt requests unsafe or forbidden AI behavior.", "an toàn"),
            ("Failed", "Dịch vụ AI trả về lỗi HTTP 429. Không trừ credit.", "giới hạn"),
            ("Failed", "Nội dung trả lời của AI không đúng định dạng. Không trừ credit.", "nội dung"),
            ("Failed", "AI provider generation failed: " + PrivateMarker, "Không tạo được"),
            ("Failed", "Nội dung trả lời của AI không đúng định dạng. Không trừ credit." + PrivateMarker, "Không tạo được"),
            ("Succeeded", PrivateMarker, null),
            ("Partial", PrivateMarker, null)
        };
        var expectedById = new Dictionary<Guid, string?>();
        for (var index = 0; index < fixtures.Length; index++)
        {
            var fixture = fixtures[index];
            var id = Guid.NewGuid();
            var projectId = Guid.NewGuid();
            expectedById[id] = fixture.Expected;
            context.FormProjects.Add(new FormProject { Id = projectId, UserId = userId, Name = "Synthetic history" });
            context.AiGenerationRuns.Add(new AiGenerationRun
            {
                Id = id, UserId = userId, ProjectId = projectId, Mode = "Option2", Provider = "test", Model = "test",
                Status = fixture.Status, ErrorMessage = fixture.Stored, RequestedCount = 1, CreatedAt = DateTimeOffset.UtcNow.AddSeconds(-index)
            });
        }
        var foreignId = Guid.NewGuid();
        var foreignUserId = Guid.NewGuid();
        var foreignProjectId = Guid.NewGuid();
        context.FormProjects.Add(new FormProject { Id = foreignProjectId, UserId = foreignUserId, Name = "Synthetic foreign history" });
        context.AiGenerationRuns.Add(new AiGenerationRun { Id = foreignId, UserId = foreignUserId, ProjectId = foreignProjectId, Status = "Failed", ErrorMessage = PrivateMarker, CreatedAt = DateTimeOffset.UtcNow });
        await context.SaveChangesAsync();
        var service = new AiAnalyticsService(context, new CurrentUser(userId));

        var runs = projection switch
        {
            "user" => (await service.GetMyStatsAsync(CancellationToken.None)).RecentRuns,
            "admin" => (await service.GetAdminStatsAsync(CancellationToken.None)).RecentRuns,
            _ => (await service.GetAdminRunsAsync(1, 100, null, null, null, null, null, null, CancellationToken.None)).Items
        };

        Assert.Equal(projection == "user" ? 9 : 10, runs.Count);
        foreach (var run in runs)
        {
            var message = ReadErrorMessage(run);
            if (run.Id == foreignId)
            {
                Assert.NotEqual("user", projection);
                Assert.Contains("Không tạo được", message);
                continue;
            }
            var expected = expectedById[run.Id];
            if (expected is null) Assert.Null(message);
            else Assert.Contains(expected, message, StringComparison.OrdinalIgnoreCase);
        }
        Assert.DoesNotContain(PrivateMarker, JsonSerializer.Serialize(runs, WebJson), StringComparison.Ordinal);
        Assert.Equal(PrivateMarker, (await context.AiGenerationRuns.FindAsync(foreignId))!.ErrorMessage);
    }

    [Theory]
    [InlineData(1, "Succeeded")]
    [InlineData(2, "Partial")]
    public async Task Generation_SuccessAndPartialKeepPreviewCreditContractWithNoFailureReason(int count, string status)
    {
        await using var context = new FormAutoHubDbContext(Options());
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        Seed(context, userId, projectId, 2);
        var questionId = context.FormQuestions.Local.Single().Id;
        await context.SaveChangesAsync();
        var adapter = new Provider(_ => new AiProviderGenerateResult("{}", "{}",
            [JsonSerializer.Serialize(new { answers = new[] { new { questionId, values = new[] { "Synthetic" } } } })]));

        var response = await Service(context, userId, adapter).GenerateAsync(projectId, new("Option2", count), CancellationToken.None);

        Assert.NotNull(response);
        Assert.Equal(status, response.Status);
        Assert.Null(ReadErrorMessage(response));
        Assert.Single(response.GeneratedPreviewIds);
        Assert.Equal(2, response.CreditsUsed);
        Assert.Equal(0, response.BalanceAfter);
        Assert.Equal(-2, (await context.CreditTransactions.SingleAsync()).Amount);
    }

    private static string? ReadErrorMessage<T>(T response)
    {
        using var document = JsonDocument.Parse(JsonSerializer.Serialize(response, WebJson));
        Assert.True(document.RootElement.TryGetProperty("errorMessage", out var message), "Expected optional safe errorMessage in the serialized response contract.");
        return message.ValueKind == JsonValueKind.Null ? null : message.GetString();
    }

    private static DbContextOptions<FormAutoHubDbContext> Options() => new DbContextOptionsBuilder<FormAutoHubDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
    private static AiGenerationService Service(FormAutoHubDbContext context, Guid userId, IAiProviderAdapter adapter) =>
        new(context, new CurrentUser(userId), new AiPromptGuardService(), new AiOutputValidator(), adapter, new Protector(), new ConfigurationBuilder().Build(), new CreditService(context));
    private static void Seed(FormAutoHubDbContext context, Guid userId, Guid projectId, decimal balance)
    {
        context.FormProjects.Add(new FormProject { Id = projectId, UserId = userId, Name = "Synthetic", Status = FormProjectStatuses.Analyzed });
        context.FormQuestions.Add(new FormQuestion { Id = Guid.NewGuid(), ProjectId = projectId, Label = "Synthetic", EntryId = "entry.1", QuestionType = FormQuestionTypes.ShortText });
        context.UserCreditAccounts.Add(new UserCreditAccount { Id = Guid.NewGuid(), UserId = userId, Balance = balance });
        context.AiPromptProfiles.Add(new AiPromptProfile { Id = Guid.NewGuid(), ProjectId = projectId, UserId = userId, Mode = "Option2", GlobalPrompt = "Create a short answer.", AudienceJson = "{}" });
        context.AiProviderSettings.Add(new AiProviderSetting { Id = Guid.NewGuid(), Provider = "OpenAI", DefaultModel = "test", EncryptedApiKey = "test-key", IsEnabled = true });
    }
    private sealed class CurrentUser(Guid id) : ICurrentUserContext { public Guid UserId => id; public bool IsAdmin => false; }
    private sealed class Protector : IAiProviderSecretProtector
    {
        public string Protect(string value) => value;
        public string Unprotect(string value) => value;
        public string Preview(string value) => "***";
    }
    private sealed class Provider(Func<AiProviderGenerateRequest, AiProviderGenerateResult> handle) : IAiProviderAdapter
    {
        public int CallCount { get; private set; }
        public Task<AiProviderGenerateResult> GenerateAsync(AiProviderGenerateRequest request, CancellationToken cancellationToken)
        {
            CallCount++;
            return Task.FromResult(handle(request));
        }
    }
    private sealed class Handler(string content) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonSerializer.Serialize(new { choices = new[] { new { message = new { content } } } }))
            });
    }
}
