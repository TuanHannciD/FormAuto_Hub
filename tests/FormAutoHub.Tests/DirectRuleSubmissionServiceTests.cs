using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Integrations.GoogleForms;
using FormAutoHub.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Tests;

public sealed class DirectRuleSubmissionServiceTests
{
    private readonly Guid userId = Guid.NewGuid();
    private readonly DbContextOptions<FormAutoHubDbContext> options = new DbContextOptionsBuilder<FormAutoHubDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;

    [Theory]
    [InlineData(1, 100, 1, 99)]
    [InlineData(100, 100, 100, 0)]
    [InlineData(5, 2, 2, 0)]
    public async Task Direct_PersistsAffordableRulesAndChargesJobOnce(int count, int balance, int total, int remaining)
    {
        await using var db = new FormAutoHubDbContext(options);
        var project = await Seed(db, balance);
        var command = Guid.NewGuid();
        var client = new Client
        {
            OnSubmit = async () =>
            {
                await using var persisted = new FormAutoHubDbContext(options);
                Assert.Equal(total, await persisted.GeneratedResponses.CountAsync());
                Assert.Equal(command, (await persisted.CreditTransactions.SingleAsync()).ReferenceId);
                Assert.True(await persisted.SubmissionLogs.AnyAsync(x => x.SubmittedAt == null));
                return new(true, "");
            }
        };

        var result = await SendDirect(db, client, project, command, count);

        Assert.NotNull(result);
        Assert.Equal(command, result.Id);
        Assert.Equal(total, result.Total);
        Assert.Equal(total, result.SuccessCount);
        Assert.Equal(SubmissionJobStatuses.Completed, result.Status);
        Assert.Equal(total, client.Calls);
        Assert.Equal(remaining, (await db.UserCreditAccounts.SingleAsync()).Balance);
        var debit = await db.CreditTransactions.SingleAsync();
        Assert.Equal(-total, debit.Amount);
        Assert.Equal(nameof(SubmissionJob), debit.ReferenceType);
        Assert.All(await db.GeneratedResponses.ToListAsync(), x => Assert.Equal(GeneratedResponseSources.Rule, x.Source));
        Assert.Equal(total, (await db.UsageLogs.ToListAsync()).Sum(x => x.CreditsUsed));
    }

    [Fact]
    public async Task Direct_ReplayIgnoresChangedCountAndDoesNotGenerateDebitOrSendAgain()
    {
        await using var db = new FormAutoHubDbContext(options);
        var project = await Seed(db);
        var command = Guid.NewGuid();
        var client = new Client();
        var first = await SendDirect(db, client, project, command, 1);
        var usageCount = await db.UsageLogs.CountAsync();
        await using var retry = new FormAutoHubDbContext(options);

        var replay = await SendDirect(retry, client, project, command, 100);

        Assert.Equal(first!.Id, replay!.Id);
        Assert.Equal(1, replay.Total);
        Assert.Equal(1, client.Calls);
        Assert.Single(await retry.GeneratedResponses.ToListAsync());
        Assert.Single(await retry.CreditTransactions.ToListAsync());
        Assert.Equal(usageCount, await retry.UsageLogs.CountAsync());
    }

    [Theory]
    [InlineData(0)]
    [InlineData(101)]
    [InlineData(-1)]
    public async Task Direct_InvalidCountDoesNotReserveChargeOrSend(int count)
    {
        await using var db = new FormAutoHubDbContext(options);
        var project = await Seed(db);
        var client = new Client();
        await Assert.ThrowsAsync<InvalidOperationException>(() => SendDirect(db, client, project, Guid.NewGuid(), count));
        await AssertNoAdmission(db, client);
        var failure = Assert.Single(await db.UsageLogs.ToListAsync());
        Assert.Equal(UsageLogStatuses.Failed, failure.Status);
        Assert.Equal(0, failure.CreditsUsed);
    }

    [Theory]
    [InlineData("empty-command")]
    [InlineData("no-credit")]
    [InlineData("missing-rule")]
    [InlineData("invalid-rule")]
    [InlineData("unsupported-question")]
    public async Task Direct_InvalidAdmissionDoesNotLeaveAnOrphanCommand(string failure)
    {
        await using var db = new FormAutoHubDbContext(options);
        var project = await Seed(db, failure == "no-credit" ? 0 : 100);
        if (failure == "missing-rule") db.AnswerRules.Remove(await db.AnswerRules.SingleAsync());
        if (failure == "invalid-rule") (await db.AnswerRules.SingleAsync()).ConfigJson = "{";
        if (failure == "unsupported-question") (await db.FormQuestions.SingleAsync()).QuestionType = "Unsupported";
        await db.SaveChangesAsync();
        var client = new Client();
        await Assert.ThrowsAsync<InvalidOperationException>(() => SendDirect(db, client, project,
            failure == "empty-command" ? Guid.Empty : Guid.NewGuid(), 1));
        await AssertNoAdmission(db, client);
        Assert.Contains(await db.UsageLogs.ToListAsync(), x => x.Status == UsageLogStatuses.Failed && x.CreditsUsed == 0);
    }

    [Theory]
    [InlineData(SubmissionJobStatuses.Running)]
    [InlineData(SubmissionJobStatuses.Pending)]
    [InlineData(SubmissionJobStatuses.Paused)]
    [InlineData(SubmissionJobStatuses.Cancelled)]
    public async Task Direct_ExistingCommandOnlyReadsEvenWhenRunnerMayHaveCrashed(string status)
    {
        await using var db = new FormAutoHubDbContext(options);
        var project = await Seed(db);
        var command = Guid.NewGuid();
        db.SubmissionJobs.Add(new SubmissionJob { Id = command, ProjectId = project, Total = 2, Status = status });
        await db.SaveChangesAsync();
        var client = new Client();

        var replay = await SendDirect(db, client, project, command, 1);

        Assert.Equal(status, replay!.Status);
        Assert.Equal(2, replay.Total);
        Assert.Equal(0, client.Calls);
        Assert.Empty(await db.GeneratedResponses.ToListAsync());
        Assert.Empty(await db.CreditTransactions.ToListAsync());
        await Assert.ThrowsAsync<InvalidOperationException>(() => SendDirect(db, client, project, Guid.NewGuid(), 1));
        var failure = Assert.Single(await db.UsageLogs.ToListAsync());
        Assert.Equal(UsageLogStatuses.Failed, failure.Status);
        Assert.Equal(0, failure.CreditsUsed);
    }

    [Fact]
    public async Task Direct_OwnerAndProjectAreCheckedBeforeReplay()
    {
        await using var db = new FormAutoHubDbContext(options);
        var project = await Seed(db);
        var otherProject = await Seed(db);
        var command = Guid.NewGuid();
        var client = new Client();
        await SendDirect(db, client, project, command, 1);
        Assert.Null(await SendDirect(db, client, otherProject, command, 1));
        Assert.Null(await SendDirect(db, client, project, command, 1, Guid.NewGuid()));
        Assert.Equal(1, client.Calls);
        Assert.Single(await db.SubmissionJobs.ToListAsync());
    }

    [Fact]
    public async Task Direct_UnknownProviderResultIsNeverRetriedByCommandOrCommonSend()
    {
        await using var db = new FormAutoHubDbContext(options);
        var project = await Seed(db);
        var command = Guid.NewGuid();
        var client = new Client { OnSubmit = () => throw new HttpRequestException("Synthetic unknown result") };
        await Assert.ThrowsAsync<HttpRequestException>(() => SendDirect(db, client, project, command, 2));
        await using var retry = new FormAutoHubDbContext(options);

        var replay = await SendDirect(retry, client, project, command, 2);

        Assert.Equal(SubmissionJobStatuses.Failed, replay!.Status);
        Assert.Equal(0, replay.FailedCount);
        var log = Assert.Single(replay.Logs);
        Assert.Null(log.SubmittedAt);
        await Assert.ThrowsAsync<InvalidOperationException>(() => new SubmissionService(retry, new UserContext(userId), client)
            .SendAsync(project, new([log.ResponseId], true), default));
        Assert.Equal(1, client.Calls);
        Assert.Single(await retry.CreditTransactions.ToListAsync());
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Direct_CancelDuringBatchKeepsAdmissionClosedUntilBoundary(bool pauseFirst)
    {
        await using var db = new FormAutoHubDbContext(options);
        var project = await Seed(db);
        var command = Guid.NewGuid();
        var calls = 0;
        var client = new Client
        {
            OnSubmit = async () =>
            {
                if (++calls == 1)
                {
                    await using var control = new FormAutoHubDbContext(options);
                    var service = new SubmissionService(control, new UserContext(userId), new Client());
                    if (pauseFirst) await service.PauseAsync(project, command, default);
                    var cancelled = await service.CancelAsync(project, command, default);
                    Assert.Null(cancelled!.FinishedAt);
                    await Assert.ThrowsAsync<InvalidOperationException>(() => SendDirect(control, new Client(), project, Guid.NewGuid(), 1));
                }
                return new(true, "");
            }
        };

        var result = await SendDirect(db, client, project, command, 11);

        Assert.Equal(10, calls);
        Assert.Equal(SubmissionJobStatuses.Cancelled, result!.Status);
        Assert.NotNull(result.FinishedAt);
        Assert.Equal(10, result.SuccessCount);
    }

    [Fact]
    public async Task Direct_CancelThenProviderFaultAcknowledgesCancellationWithoutOverwritingIt()
    {
        await using var db = new FormAutoHubDbContext(options);
        var project = await Seed(db);
        var command = Guid.NewGuid();
        var client = new Client { OnSubmit = async () =>
        {
            await using var control = new FormAutoHubDbContext(options);
            await new SubmissionService(control, new UserContext(userId), new Client()).CancelAsync(project, command, default);
            throw new HttpRequestException("Synthetic unknown result");
        } };

        await Assert.ThrowsAsync<HttpRequestException>(() => SendDirect(db, client, project, command, 2));

        await using var fresh = new FormAutoHubDbContext(options);
        var job = await fresh.SubmissionJobs.SingleAsync();
        Assert.Equal(SubmissionJobStatuses.Cancelled, job.Status);
        Assert.NotNull(job.FinishedAt);
        Assert.Equal(0, job.SuccessCount);
        Assert.Equal(0, job.FailedCount);
    }

    private async Task<SubmissionJobResponse?> SendDirect(FormAutoHubDbContext db, Client client, Guid project, Guid command, int count, Guid? actor = null)
    {
        var user = new UserContext(actor ?? userId);
        return await new DirectRuleSubmissionService(db, user, new CreditService(db), new SubmissionService(db, user, client))
            .SendAsync(project, new(command, count), CancellationToken.None);
    }

    private static async Task AssertNoAdmission(FormAutoHubDbContext db, Client client)
    {
        Assert.Equal(0, client.Calls);
        Assert.Empty(await db.SubmissionJobs.ToListAsync());
        Assert.Empty(await db.GeneratedResponses.ToListAsync());
        Assert.Empty(await db.CreditTransactions.ToListAsync());
    }

    [Theory]
    [InlineData(SubmissionLogStatuses.Failed)]
    [InlineData(SubmissionLogStatuses.Success)]
    public async Task CommonSend_RejectsAnyPreviouslyLoggedResponseEvenWhenPreviewed(string status)
    {
        await using var db = new FormAutoHubDbContext(options);
        var project = await Seed(db);
        var response = Preview(project);
        db.GeneratedResponses.Add(response);
        db.SubmissionLogs.Add(new SubmissionLog { Id = Guid.NewGuid(), JobId = Guid.NewGuid(), ResponseId = response.Id, Status = status });
        await db.SaveChangesAsync();
        var client = new Client();

        await Assert.ThrowsAsync<InvalidOperationException>(() => new SubmissionService(db, new UserContext(userId), client)
            .SendAsync(project, new([response.Id], true), default));

        Assert.Equal(0, client.Calls);
        Assert.Empty(await db.SubmissionJobs.ToListAsync());
    }

    [Fact]
    public async Task Cancel_RunningJobDoesNotReleaseProjectUntilRunnerAcknowledges()
    {
        await using var db = new FormAutoHubDbContext(options);
        var project = await Seed(db);
        var response = Preview(project);
        var running = new SubmissionJob { Id = Guid.NewGuid(), ProjectId = project, Status = SubmissionJobStatuses.Running };
        db.GeneratedResponses.Add(response);
        db.SubmissionJobs.Add(running);
        await db.SaveChangesAsync();
        var service = new SubmissionService(db, new UserContext(userId), new Client());

        var cancelled = await service.CancelAsync(project, running.Id, default);

        Assert.Equal(SubmissionJobStatuses.Cancelled, cancelled!.Status);
        Assert.Null(cancelled.FinishedAt);
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.SendAsync(project, new([response.Id], true), default));
        Assert.Single(await db.SubmissionJobs.ToListAsync());
    }

    private async Task<Guid> Seed(FormAutoHubDbContext db, int credits = 100)
    {
        var project = Guid.NewGuid();
        var question = Guid.NewGuid();
        db.FormProjects.Add(new FormProject { Id = project, UserId = userId, Name = "Synthetic", FormActionUrl = "https://example.invalid/send" });
        db.FormQuestions.Add(new FormQuestion { Id = question, ProjectId = project, EntryId = "entry.1", Label = "Synthetic", QuestionType = FormQuestionTypes.ShortText });
        db.AnswerRules.Add(new AnswerRule { Id = Guid.NewGuid(), ProjectId = project, QuestionId = question, Mode = AnswerRuleModes.SampleTextLines, ConfigJson = "{\"samples\":[\"one\",\"two\"]}" });
        if (!await db.UserCreditAccounts.AnyAsync())
            db.UserCreditAccounts.Add(new UserCreditAccount { Id = Guid.NewGuid(), UserId = userId, Balance = credits });
        await db.SaveChangesAsync();
        return project;
    }

    private static GeneratedResponse Preview(Guid project) => new()
    {
        Id = Guid.NewGuid(), ProjectId = project, Status = GeneratedResponseStatuses.Previewed,
        PayloadJson = JsonSerializer.Serialize(new[] { new GeneratedAnswerResponse(Guid.NewGuid(), "entry.1", "Synthetic", FormQuestionTypes.ShortText, ["one"]) })
    };

    private sealed record UserContext(Guid UserId) : ICurrentUserContext { public bool IsAdmin => false; }
    private sealed class Client : IGoogleFormsClient
    {
        public int Calls { get; private set; }
        public Func<Task<GoogleFormSubmitResult>>? OnSubmit { get; init; }
        public Task<GoogleFormAnalysis> AnalyzeAsync(string formUrl, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<GoogleFormSubmitResult> SubmitAsync(string actionUrl, IReadOnlyDictionary<string, IReadOnlyList<string>> answers, CancellationToken cancellationToken)
        {
            Calls++;
            return OnSubmit?.Invoke() ?? Task.FromResult(new GoogleFormSubmitResult(true, ""));
        }
    }
}
