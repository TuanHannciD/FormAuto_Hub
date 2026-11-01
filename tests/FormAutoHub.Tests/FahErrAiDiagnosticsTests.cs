using System.Collections.Concurrent;
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
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FormAutoHub.Tests;

public sealed class FahErrAiDiagnosticsTests
{
    [Theory]
    [InlineData(HttpStatusCode.OK)]
    [InlineData(HttpStatusCode.ServiceUnavailable)]
    public async Task ProviderLogs_ExcludePayloadsAndSecretsWhilePreservingBoundedContext(HttpStatusCode status)
    {
        const string marker = "synthetic-person@example.invalid bearer-secret-marker";
        var content = JsonSerializer.Serialize(new { answers = new[] { new { questionId = Guid.NewGuid(), values = new[] { marker + new string('x', 50000) } } } });
        var body = Envelope(content);
        var capture = new CaptureProvider();
        using var factory = LoggerFactory.Create(builder => builder.AddProvider(capture));
        var adapter = new OpenAiCompatibleProviderAdapter(new HttpClient(new Handler(_ => (status, body))), factory.CreateLogger<OpenAiCompatibleProviderAdapter>());
        var request = new AiProviderGenerateRequest(Guid.NewGuid(), marker, 1, marker, marker,
            JsonSerializer.Serialize(new { prompt = marker }), JsonSerializer.Serialize(new[] { new { label = marker } }),
            "https://example.invalid/v1?private=" + marker.Replace(" ", "-"), "secret-api-key-marker");

        await Record.ExceptionAsync(() => adapter.GenerateAsync(request, CancellationToken.None));

        Assert.NotEmpty(capture.Entries);
        var logs = string.Join("\n", capture.Entries.Select(entry => entry.Text));
        Assert.DoesNotContain("synthetic-person", logs, StringComparison.Ordinal);
        Assert.DoesNotContain("secret-marker", logs, StringComparison.Ordinal);
        Assert.DoesNotContain("secret-api-key", logs, StringComparison.Ordinal);
        Assert.All(capture.Entries, entry => Assert.True(entry.Text.Length < 1500));
        Assert.Contains(capture.Entries, entry => entry.Fields.TryGetValue("ProjectId", out var id) && Equals(id, request.ProjectId));
        Assert.Contains(capture.Entries, entry => entry.Fields.TryGetValue("HttpStatusCode", out var code) && Equals(code, (int)status));
        Assert.All(capture.Entries, entry => Assert.Null(entry.Exception));
    }

    [Theory]
    [InlineData("")]
    [InlineData("not json synthetic-private-content")]
    [InlineData("{\"answers\":[")]
    [InlineData("{\"unrelated\":true}")]
    public async Task MalformedAssistantContent_ThrowsSafeFailureInsteadOfReturningZeroOutputs(string content)
    {
        var adapter = new OpenAiCompatibleProviderAdapter(new HttpClient(new Handler(_ => (HttpStatusCode.OK, Envelope(content)))),
            Microsoft.Extensions.Logging.Abstractions.NullLogger<OpenAiCompatibleProviderAdapter>.Instance);

        var exception = await Assert.ThrowsAsync<FormatException>(() => adapter.GenerateAsync(Request(), CancellationToken.None));

        Assert.DoesNotContain("synthetic-private-content", exception.Message, StringComparison.Ordinal);
    }

    [Fact]
    public async Task ParallelBatchFailure_PreservesRunBatchDiagnosticsAndSafePersistedCauseWithoutDebit()
    {
        var capture = new CaptureProvider();
        using var factory = LoggerFactory.Create(builder => builder.AddProvider(capture));
        var call = 0;
        var adapter = new OpenAiCompatibleProviderAdapter(new HttpClient(new Handler(_ =>
            Interlocked.Increment(ref call) == 1
                ? (HttpStatusCode.OK, Envelope("{\"answers\":[]}"))
                : (HttpStatusCode.OK, Envelope("synthetic-private-content")))), factory.CreateLogger<OpenAiCompatibleProviderAdapter>());
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        await using var context = new FormAutoHubDbContext(options);
        Seed(context, userId, projectId);
        await context.SaveChangesAsync();
        using var services = new ServiceCollection().AddSingleton(factory.CreateLogger<AiGenerationService>()).BuildServiceProvider();
        var service = ActivatorUtilities.CreateInstance<AiGenerationService>(services, context, new CurrentUser(userId),
            new AiPromptGuardService(), new AiOutputValidator(), adapter, new Protector(),
            new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["AI:BatchSize"] = "1", ["AI:MaxParallelBatches"] = "2" }).Build(),
            new CreditService(context));

        var response = await service.GenerateAsync(projectId, new AiGenerateResponsesRequest("Option2", 2), CancellationToken.None);

        Assert.NotNull(response);
        Assert.Equal("Failed", response.Status);
        await using var fresh = new FormAutoHubDbContext(options);
        var run = await fresh.AiGenerationRuns.SingleAsync();
        Assert.Equal(response.RunId, run.Id);
        Assert.Contains("định dạng", run.ErrorMessage, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("synthetic-private-content", run.ErrorMessage, StringComparison.Ordinal);
        Assert.Empty(await fresh.CreditTransactions.ToListAsync());
        Assert.Empty(await fresh.GeneratedResponses.ToListAsync());
        Assert.Equal(10, (await fresh.UserCreditAccounts.SingleAsync()).Balance);
        Assert.Equal("Failed", (await fresh.UsageLogs.SingleAsync()).Status);
        Assert.Contains(capture.Entries, entry => entry.Fields.TryGetValue("Cause", out var cause) && Equals(cause, "FormatException"));
        Assert.Contains(capture.Entries, entry => entry.Fields.TryGetValue("BatchIndex", out var batch) && Equals(batch, 1) && entry.Fields.TryGetValue("RunId", out var id) && Equals(id, run.Id));
        Assert.Contains(capture.Entries, entry => entry.Fields.TryGetValue("BatchIndex", out var batch) && Equals(batch, 2) && entry.Fields.TryGetValue("RunId", out var id) && Equals(id, run.Id));
        Assert.DoesNotContain(capture.Entries, entry => entry.Text.Contains("synthetic-private-content", StringComparison.Ordinal));
    }

    private static AiProviderGenerateRequest Request() => new(Guid.NewGuid(), "Option2", 1, "OpenAI", "test", "{}", "[]", "https://example.invalid/v1", "test-key");
    private static string Envelope(string content) => JsonSerializer.Serialize(new { choices = new[] { new { message = new { content } } } });

    private static void Seed(FormAutoHubDbContext context, Guid userId, Guid projectId)
    {
        context.FormProjects.Add(new FormProject { Id = projectId, UserId = userId, Name = "Synthetic", Status = FormProjectStatuses.Analyzed });
        context.FormQuestions.Add(new FormQuestion { Id = Guid.NewGuid(), ProjectId = projectId, Label = "Synthetic", EntryId = "entry.1", QuestionType = FormQuestionTypes.ShortText });
        context.UserCreditAccounts.Add(new UserCreditAccount { Id = Guid.NewGuid(), UserId = userId, Balance = 10 });
        context.AiPromptProfiles.Add(new AiPromptProfile { Id = Guid.NewGuid(), ProjectId = projectId, UserId = userId, Mode = "Option2", GlobalPrompt = "Create a short answer.", AudienceJson = "{}" });
        context.AiProviderSettings.Add(new AiProviderSetting { Id = Guid.NewGuid(), Provider = "OpenAI", DefaultModel = "test", EncryptedApiKey = "test-key", BaseUrl = "https://example.invalid/v1", IsEnabled = true });
    }

    private sealed class CurrentUser(Guid id) : ICurrentUserContext { public Guid UserId => id; public bool IsAdmin => false; }
    private sealed class Protector : IAiProviderSecretProtector
    {
        public string Protect(string value) => value;
        public string Unprotect(string value) => value;
        public string Preview(string value) => "***";
    }
    private sealed class Handler(Func<HttpRequestMessage, (HttpStatusCode Status, string Body)> handle) : HttpMessageHandler
    {
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            await Task.Yield();
            var result = handle(request);
            return new HttpResponseMessage(result.Status) { Content = new StringContent(result.Body) };
        }
    }
    private sealed record Entry(string Text, Dictionary<string, object?> Fields, Exception? Exception);
    private sealed class CaptureProvider : ILoggerProvider, ISupportExternalScope
    {
        public ConcurrentQueue<Entry> Entries { get; } = new();
        private IExternalScopeProvider scopes = new LoggerExternalScopeProvider();
        public void SetScopeProvider(IExternalScopeProvider scopeProvider) => scopes = scopeProvider;
        public ILogger CreateLogger(string categoryName) => new CaptureLogger(this);
        public void Dispose() { }
        private sealed class CaptureLogger(CaptureProvider owner) : ILogger
        {
            public IDisposable? BeginScope<TState>(TState state) where TState : notnull => owner.scopes.Push(state);
            public bool IsEnabled(LogLevel logLevel) => true;
            public void Log<TState>(LogLevel level, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
            {
                var fields = new Dictionary<string, object?>();
                owner.scopes.ForEachScope((scope, data) => Add(scope, data), fields);
                Add(state, fields);
                var text = formatter(state, exception) + JsonSerializer.Serialize(fields) + exception?.ToString();
                owner.Entries.Enqueue(new Entry(text, fields, exception));
            }
            private static void Add(object? state, Dictionary<string, object?> fields)
            {
                if (state is IEnumerable<KeyValuePair<string, object?>> values)
                    foreach (var value in values) fields[value.Key] = value.Value;
            }
        }
    }
}
