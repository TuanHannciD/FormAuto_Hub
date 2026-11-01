using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Entities.Nckh;
using FormAutoHub.Api.Integrations.Google;
using FormAutoHub.Api.Integrations.GoogleForms;
using FormAutoHub.Api.Services;
using FormAutoHub.Api.Services.Nckh;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Xunit;

namespace FormAutoHub.Tests;

public sealed class FahErrSubmissionPersistenceTests
{
    private readonly Guid userId = Guid.NewGuid();
    private readonly DbContextOptions<FormAutoHubDbContext> options =
        new DbContextOptionsBuilder<FormAutoHubDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Send_PersistenceFault_DoesNotDuplicateUsageOrMisstateUnsentAttempt(bool failFinalSave)
    {
        var fault = new DbUpdateException("synthetic persistence failure");
        var interceptor = new SaveFault(fault, failFinalSave);
        var faultOptions = new DbContextOptionsBuilder<FormAutoHubDbContext>(options).AddInterceptors(interceptor).Options;
        await using var db = new FormAutoHubDbContext(faultOptions);
        var (projectId, ids) = await SeedSubmission(db, 1);
        var calls = 0;
        var client = new SubmitClient(() =>
        {
            calls++;
            return Task.FromResult(new GoogleFormSubmitResult(true, ""));
        });

        var thrown = await Assert.ThrowsAsync<DbUpdateException>(() => new SubmissionService(db, new UserContext(userId), client)
            .SendAsync(projectId, new SendSubmissionRequest(ids, true), CancellationToken.None));

        Assert.Same(fault, thrown);
        Assert.Equal(failFinalSave ? 1 : 0, calls);
        await using var fresh = new FormAutoHubDbContext(options);
        var usage = await fresh.UsageLogs.SingleAsync();
        Assert.Equal(UsageLogStatuses.Failed, usage.Status);
        var log = await fresh.SubmissionLogs.SingleAsync();
        if (failFinalSave)
        {
            Assert.Equal(SubmissionLogStatuses.Success, log.Status);
            Assert.Equal(1, (await fresh.SubmissionJobs.SingleAsync()).SuccessCount);
        }
        else
        {
            Assert.Contains("chưa thực hiện", log.ErrorMessage, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("chưa xác định", log.ErrorMessage, StringComparison.OrdinalIgnoreCase);
        }
    }

    [Fact]
    public async Task Send_TransportFaultAfterSuccess_PreservesKnownResultAndUnknownAttempt()
    {
        await using var db = new FormAutoHubDbContext(options);
        var (projectId, ids) = await SeedSubmission(db, 3);
        var fault = new HttpRequestException("synthetic private provider detail");
        var calls = 0;
        var client = new SubmitClient(async () =>
        {
            calls++;
            if (calls == 1) return new GoogleFormSubmitResult(true, "");
            await using var persisted = new FormAutoHubDbContext(options);
            Assert.Equal(1, await persisted.SubmissionLogs.CountAsync(x => x.Status == SubmissionLogStatuses.Success));
            throw fault;
        });

        var thrown = await Assert.ThrowsAsync<HttpRequestException>(() => new SubmissionService(db, new UserContext(userId), client)
            .SendAsync(projectId, new SendSubmissionRequest(ids, true), CancellationToken.None));

        Assert.Same(fault, thrown);
        Assert.Equal(2, calls);
        await using var fresh = new FormAutoHubDbContext(options);
        var job = await fresh.SubmissionJobs.SingleAsync();
        Assert.Equal(SubmissionJobStatuses.Failed, job.Status);
        Assert.Equal(1, job.SuccessCount);
        Assert.Equal(0, job.FailedCount); // A transport fault is not proof Google rejected the response.
        Assert.NotNull(job.FinishedAt);
        var logs = await fresh.SubmissionLogs.ToListAsync();
        Assert.Equal(2, logs.Count);
        Assert.Contains(logs, x => x.Status == SubmissionLogStatuses.Success);
        Assert.Contains(logs, x => x.ErrorMessage!.Contains("chưa xác định", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(logs, x => x.ErrorMessage!.Contains("private provider"));
        Assert.Equal(1, await fresh.GeneratedResponses.CountAsync(x => x.Status == GeneratedResponseStatuses.Submitted));
        Assert.Equal(2, await fresh.GeneratedResponses.CountAsync(x => x.Status == GeneratedResponseStatuses.Previewed));
        var usage = await fresh.UsageLogs.SingleAsync();
        Assert.Equal(UsageLogStatuses.Failed, usage.Status);
        Assert.Contains("chưa xác định", usage.Description!, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Send_InvalidPayload_PreservesInnerCauseAndTerminatesJob()
    {
        await using var db = new FormAutoHubDbContext(options);
        var (projectId, ids) = await SeedSubmission(db, 1);
        (await db.GeneratedResponses.SingleAsync()).PayloadJson = "{";
        await db.SaveChangesAsync();
        var client = new SubmitClient(() => throw new Xunit.Sdk.XunitException("Must not send malformed payload"));

        var thrown = await Assert.ThrowsAsync<InvalidOperationException>(() => new SubmissionService(db, new UserContext(userId), client)
            .SendAsync(projectId, new SendSubmissionRequest(ids, true), CancellationToken.None));

        Assert.IsAssignableFrom<JsonException>(thrown.InnerException);
        await using var fresh = new FormAutoHubDbContext(options);
        Assert.Equal(SubmissionJobStatuses.Failed, (await fresh.SubmissionJobs.SingleAsync()).Status);
        Assert.Equal(UsageLogStatuses.Failed, (await fresh.UsageLogs.SingleAsync()).Status);
        Assert.Empty(await fresh.SubmissionLogs.ToListAsync());
    }

    [Theory]
    [InlineData(false, "Failed", "Gửi form thất bại", 0)]
    [InlineData(true, "Failed", "Gửi form hoàn tất một phần", 1)]
    [InlineData(true, "Paused", "Đã tạm dừng gửi form", 10)]
    [InlineData(true, "Cancelled", "Đã hủy gửi form", 10)]
    public async Task Send_UsageDescribesActualOutcome(bool firstSuccess, string targetStatus, string text, int successes)
    {
        await using var db = new FormAutoHubDbContext(options);
        var boundaryStop = targetStatus is "Paused" or "Cancelled";
        var (projectId, ids) = await SeedSubmission(db, boundaryStop ? 11 : 2);
        var calls = 0;
        var client = new SubmitClient(async () =>
        {
            calls++;
            if (boundaryStop && calls == 10)
            {
                await using var control = new FormAutoHubDbContext(options);
                var job = await control.SubmissionJobs.SingleAsync();
                job.Status = targetStatus;
                await control.SaveChangesAsync();
            }
            return new GoogleFormSubmitResult(boundaryStop || firstSuccess && calls == 1, "Synthetic rejection");
        });

        var result = await new SubmissionService(db, new UserContext(userId), client)
            .SendAsync(projectId, new SendSubmissionRequest(ids, true), CancellationToken.None);

        Assert.Equal(targetStatus, result!.Status);
        Assert.Equal(successes, result.SuccessCount);
        Assert.Equal(boundaryStop ? 10 : 2, calls);
        await using var fresh = new FormAutoHubDbContext(options);
        var usage = await fresh.UsageLogs.SingleAsync();
        Assert.Equal(UsageLogStatuses.Failed, usage.Status);
        Assert.Contains(text, usage.Description!);
        Assert.Contains($"{successes}", usage.Description!);
        Assert.DoesNotContain("Gửi form thành công", usage.Description!);
    }

    [Fact]
    public async Task Send_CancelledRequest_PersistsUnknownAttemptWithoutResending()
    {
        await using var db = new FormAutoHubDbContext(options);
        var (projectId, ids) = await SeedSubmission(db, 2);
        using var cancellation = new CancellationTokenSource();
        var calls = 0;
        var fault = new OperationCanceledException(cancellation.Token);
        var client = new SubmitClient(() =>
        {
            calls++;
            cancellation.Cancel();
            throw fault;
        });
        await Assert.ThrowsAsync<OperationCanceledException>(() => new SubmissionService(db, new UserContext(userId), client)
            .SendAsync(projectId, new SendSubmissionRequest(ids, true), cancellation.Token));
        await using var fresh = new FormAutoHubDbContext(options);
        Assert.Equal(1, calls);
        Assert.Single(await fresh.SubmissionLogs.ToListAsync());
        Assert.Equal(SubmissionJobStatuses.Failed, (await fresh.SubmissionJobs.SingleAsync()).Status);
        Assert.Single(await fresh.UsageLogs.ToListAsync());
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Collect_ThrownProviderFault_PersistsFailedCollectionWithOriginalCause(bool cancel)
    {
        await using var db = new FormAutoHubDbContext(options);
        var modelId = await SeedResearch(db);
        using var cancellation = new CancellationTokenSource();
        Exception fault = cancel ? new OperationCanceledException(cancellation.Token) : new HttpRequestException("private synthetic response");
        var api = new FormsApi
        {
            Collect = async () =>
            {
                await using var persisted = new FormAutoHubDbContext(options);
                Assert.Single(await persisted.DataCollectionLogs.ToListAsync());
                if (cancel) cancellation.Cancel();
                throw fault;
            }
        };

        var thrown = await Record.ExceptionAsync(() => new ResearchDataService(db, new OAuth(), api)
            .CollectResponsesAsync(userId, modelId, cancellation.Token));

        Assert.Same(fault, thrown);
        await using var fresh = new FormAutoHubDbContext(options);
        var log = await fresh.DataCollectionLogs.SingleAsync();
        Assert.Equal("Failed", log.Status);
        Assert.NotNull(log.CompletedAt);
        Assert.DoesNotContain("private synthetic", log.ErrorMessage!);
        Assert.Empty(await fresh.SurveyResponses.ToListAsync());
    }

    [Theory]
    [InlineData("questions-false")]
    [InlineData("questions-throw")]
    [InlineData("import-null")]
    public async Task Generate_AfterRemoteCreateFailure_PreservesRemoteIdentityWithoutFakeLocalForm(string failure)
    {
        await using var db = new FormAutoHubDbContext(options);
        var modelId = await SeedResearch(db);
        var api = new FormsApi
        {
            Questions = async () =>
            {
                await using var persisted = new FormAutoHubDbContext(options);
                var audit = await persisted.AuditLogs.SingleAsync();
                Assert.Contains("remote-created-id", audit.MetadataJson);
                Assert.DoesNotContain("synthetic-access-token", audit.MetadataJson);
                if (failure == "questions-throw") throw new HttpRequestException("private provider details");
                return failure != "questions-false";
            }
        };
        var service = new ResearchFormService(db, new OAuth(), api);
        if (failure == "questions-throw")
            await Assert.ThrowsAsync<HttpRequestException>(() => service.GenerateFormAsync(userId, modelId, new NckhGenerateFormRequest("create"), CancellationToken.None));
        else
        {
            var result = await service.GenerateFormAsync(userId, modelId, new NckhGenerateFormRequest("create"), CancellationToken.None);
            Assert.Equal(ResearchFormServiceStatus.ExternalError, result.Status);
            Assert.Contains("đã được tạo", result.Message!, StringComparison.OrdinalIgnoreCase);
        }
        await using var fresh = new FormAutoHubDbContext(options);
        Assert.Single(await fresh.ResearchForms.ToListAsync()); // Only the original imported form.
        var metadata = JsonDocument.Parse((await fresh.AuditLogs.SingleAsync()).MetadataJson);
        Assert.Equal("remote-created-id", metadata.RootElement.GetProperty("remoteFormId").GetString());
        Assert.Equal(modelId, metadata.RootElement.GetProperty("modelId").GetGuid());
    }

    private async Task<(Guid ProjectId, Guid[] ResponseIds)> SeedSubmission(FormAutoHubDbContext db, int count)
    {
        var project = new FormProject { Id = Guid.NewGuid(), UserId = userId, Name = "Synthetic", FormUrl = "https://example.invalid/form", FormActionUrl = "https://example.invalid/send" };
        db.FormProjects.Add(project);
        var ids = Enumerable.Range(0, count).Select(_ => Guid.NewGuid()).ToArray();
        foreach (var id in ids)
            db.GeneratedResponses.Add(new GeneratedResponse
            {
                Id = id, ProjectId = project.Id, Status = GeneratedResponseStatuses.Previewed,
                PayloadJson = JsonSerializer.Serialize(new[] { new GeneratedAnswerResponse(Guid.NewGuid(), "entry.1", "Synthetic", "ShortText", new[] { "synthetic answer" }) })
            });
        await db.SaveChangesAsync();
        return (project.Id, ids);
    }

    private async Task<Guid> SeedResearch(FormAutoHubDbContext db)
    {
        var form = new ResearchForm { Id = Guid.NewGuid(), UserId = userId, GoogleFormId = "source-form", Title = "Synthetic", Status = "Draft" };
        var model = new ResearchModel { Id = Guid.NewGuid(), UserId = userId, FormId = form.Id, Name = "Synthetic model", Status = "Active" };
        var question = new ResearchFormQuestion { Id = Guid.NewGuid(), FormId = form.Id, GoogleQuestionId = "q1", QuestionText = "Synthetic question", QuestionType = "shortText" };
        var variable = new ResearchVariable { Id = Guid.NewGuid(), ModelId = model.Id, Name = "Synthetic", Code = "A", VariableType = "Independent", ScaleType = "Nominal" };
        db.ResearchForms.Add(form);
        db.ResearchModels.Add(model);
        db.ResearchFormQuestions.Add(question);
        db.ResearchVariables.Add(variable);
        db.ObservedQuestionMappings.Add(new ObservedQuestionMapping { Id = Guid.NewGuid(), VariableId = variable.Id, FormQuestionId = question.Id, ObservedCode = "A1" });
        db.UserExternalLogins.Add(new UserExternalLogin { Id = Guid.NewGuid(), UserId = userId, Provider = "Google", ProviderUserId = "synthetic", Email = "synthetic@example.invalid", Scopes = "https://www.googleapis.com/auth/forms.body https://www.googleapis.com/auth/forms.responses.readonly" });
        await db.SaveChangesAsync();
        return model.Id;
    }

    private sealed record UserContext(Guid UserId) : ICurrentUserContext { public bool IsAdmin => false; }
    private sealed class SaveFault(Exception fault, bool finalSave) : SaveChangesInterceptor
    {
        private bool thrown;
        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            var db = eventData.Context!;
            var matches = finalSave
                ? db.ChangeTracker.Entries<UsageLog>().Any(x => x.State == EntityState.Added)
                : db.ChangeTracker.Entries<SubmissionLog>().Any(x => x.State == EntityState.Added);
            if (!thrown && matches)
            {
                thrown = true;
                throw fault;
            }
            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }
    }
    private sealed class SubmitClient(Func<Task<GoogleFormSubmitResult>> submit) : IGoogleFormsClient
    {
        public Task<GoogleFormAnalysis> AnalyzeAsync(string formUrl, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<GoogleFormSubmitResult> SubmitAsync(string actionUrl, IReadOnlyDictionary<string, IReadOnlyList<string>> answers, CancellationToken cancellationToken) => submit();
    }
    private sealed class OAuth : IGoogleOAuthService
    {
        public Task<GoogleOAuthTokens?> ExchangeCodeAsync(string authorizationCode, string redirectUri, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<GoogleOAuthTokens?> RefreshAccessTokenAsync(string refreshToken, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task StoreTokensAsync(Guid userExternalLoginId, GoogleOAuthTokens tokens, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<string?> GetValidAccessTokenAsync(Guid userId, CancellationToken cancellationToken) => Task.FromResult<string?>("synthetic-access-token");
    }
    private sealed class FormsApi : IGoogleFormsApiService
    {
        public Func<Task<IReadOnlyList<GoogleFormResponseItem>?>> Collect { get; init; } = () => Task.FromResult<IReadOnlyList<GoogleFormResponseItem>?>([]);
        public Func<Task<bool>> Questions { get; init; } = () => Task.FromResult(true);
        public Task<GoogleFormStructure?> GetFormStructureAsync(string accessToken, string formId, CancellationToken cancellationToken) => Task.FromResult<GoogleFormStructure?>(null);
        public Task<GoogleFormCreateResult?> CreateFormAsync(string accessToken, string title, CancellationToken cancellationToken) => Task.FromResult<GoogleFormCreateResult?>(new("remote-created-id", "https://example.invalid/remote-created-id"));
        public Task<bool> CreateQuestionsAsync(string accessToken, string formId, IReadOnlyList<GoogleFormQuestionDraft> questions, CancellationToken cancellationToken) => Questions();
        public Task<IReadOnlyList<GoogleFormResponseItem>?> ListResponsesAsync(string accessToken, string formId, CancellationToken cancellationToken) => Collect();
    }
}
