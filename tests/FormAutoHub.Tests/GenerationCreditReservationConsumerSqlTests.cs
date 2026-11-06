using System.Data.Common;
using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Integrations.AI;
using FormAutoHub.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;

namespace FormAutoHub.Tests;

[Collection("Generation history SQL")]
public sealed class GenerationCreditReservationConsumerSqlTests
{
    [HistorySqlFact]
    public Task AiAvailabilityRetry_PersistsOneSuccessfulRunAndCallsProviderOnce() => AiRetryAsync(providerFails: false);

    [HistorySqlFact]
    public Task AiAvailabilityRetry_PersistsFailedRunAndCallsProviderOnce() => AiRetryAsync(providerFails: true);

    private static async Task AiRetryAsync(bool providerFails)
    {
        await using var seed = await GenerationHistorySqlFixture.OpenAsync();
        await seed.Database.MigrateAsync();
        var (user, project, question) = await SeedAsync(seed, 10);
        var retry = new AvailabilityTimeoutOnce();
        await using var db = await GenerationHistorySqlFixture.OpenAsync(retry);
        var provider = new SyntheticProvider(question, providerFails);
        var service = new AiGenerationService(db, new UserContext(user), new AiPromptGuardService(), new AiOutputValidator(),
            provider, new SecretProtector(), new ConfigurationBuilder().Build(), new CreditService(db));
        var response = await service.GenerateAsync(project, new AiGenerateResponsesRequest(AiPromptProfileModes.Option2, 1), default);
        Assert.True(retry.ReadAttempts >= 2);
        Assert.Equal(1, provider.Calls);
        Assert.NotNull(response);
        await using var read = await GenerationHistorySqlFixture.OpenAsync();
        var run = Assert.Single(await read.AiGenerationRuns.Where(x => x.ProjectId == project).ToListAsync());
        Assert.Equal(response.RunId, run.Id);
        Assert.NotNull(run.CompletedAt);
        Assert.Equal(providerFails ? AiGenerationRunStatuses.Failed : AiGenerationRunStatuses.Succeeded, run.Status);
        Assert.Equal(providerFails ? 0 : 1, run.CreditsUsed);
        Assert.Equal(providerFails ? 0 : 1, await read.AiGenerationRunItems.CountAsync(x => x.RunId == run.Id));
        Assert.Equal(providerFails ? 0 : 1, await read.GeneratedResponses.CountAsync(x => x.ProjectId == project));
        Assert.Equal(providerFails ? 0 : 1, await read.CreditTransactions.CountAsync(x => x.UserId == user));
        Assert.Equal(providerFails ? 10 : 9, (await read.UserCreditAccounts.SingleAsync(x => x.UserId == user)).Balance);
        var usage = Assert.Single(await read.UsageLogs.Where(x => x.ProjectId == project).ToListAsync());
        Assert.Equal(providerFails ? UsageLogStatuses.Failed : UsageLogStatuses.Success, usage.Status);
        Assert.Equal(providerFails ? 0 : 1, usage.CreditsUsed);
    }

    [HistorySqlFact]
    public Task AiGeneration_AvailabilityLostBeforeCommit_PreservesFailedUsageWithoutDebitOrPreview() => AiAvailabilityLostAsync(false);

    [HistorySqlFact]
    public Task AiGeneration_FailedAuditCommitRetry_PreservesExactlyOneFailedUsage() => AiAvailabilityLostAsync(true);

    private static async Task AiAvailabilityLostAsync(bool loseFailureAcknowledgement)
    {
        await using var seed = await GenerationHistorySqlFixture.OpenAsync();
        await seed.Database.MigrateAsync();
        var (user, project, _) = await SeedAsync(seed, 2);
        var loss = new SpendAfterAvailability(user, loseFailureAcknowledgement);
        await using var db = await GenerationHistorySqlFixture.OpenAsync(loss);
        var question = await db.FormQuestions.Where(x => x.ProjectId == project).Select(x => x.Id).SingleAsync();
        var provider = new SyntheticProvider(question, false);
        var service = new AiGenerationService(db, new UserContext(user), new AiPromptGuardService(), new AiOutputValidator(),
            provider, new SecretProtector(), new ConfigurationBuilder().Build(), new CreditService(db));
        var response = await service.GenerateAsync(project, new AiGenerateResponsesRequest(AiPromptProfileModes.Option2, 2), default);
        Assert.Equal(AiGenerationRunStatuses.Failed, response!.Status); Assert.Null(response.GenerationBatchId);
        Assert.Equal(2, response.MissingCredits); Assert.Equal(new CreditAvailabilityResponse(0, 0, 0), response.Credits);
        Assert.Equal(1, provider.Calls);
        Assert.True(loss.Spent);
        Assert.Equal(loseFailureAcknowledgement ? 1 : 0, loss.AcknowledgementsLost);
        await using var read = await GenerationHistorySqlFixture.OpenAsync();
        Assert.Equal(0, await read.GeneratedResponses.CountAsync(x => x.ProjectId == project));
        Assert.Equal(0, await read.GenerationBatches.CountAsync(x => x.ProjectId == project));
        Assert.Equal(0, await read.CreditTransactions.CountAsync(x => x.UserId == user && x.ReferenceType == nameof(GeneratedResponse)));
        var usage = Assert.Single(await read.UsageLogs.Where(x => x.ProjectId == project).ToListAsync());
        Assert.Equal(UsageLogStatuses.Failed, usage.Status);
        Assert.Equal(0, usage.CreditsUsed);
        Assert.Equal(0, (await read.UserCreditAccounts.SingleAsync(x => x.UserId == user)).Balance);
        Assert.Equal(1, await read.CreditTransactions.CountAsync(x => x.UserId == user));
    }

    private static async Task<(Guid User, Guid Project, Guid Question)> SeedAsync(FormAutoHubDbContext db, decimal balance)
    {
        var user = Guid.NewGuid(); var project = Guid.NewGuid(); var question = Guid.NewGuid();
        db.Users.Add(new User { Id = user, Email = $"{user}@fixture.invalid" });
        db.FormProjects.Add(new FormProject { Id = project, UserId = user, Name = "Synthetic consumer test" });
        db.UserCreditAccounts.Add(new UserCreditAccount { Id = Guid.NewGuid(), UserId = user, Balance = balance });
        db.FormQuestions.Add(new FormQuestion { Id = question, ProjectId = project, EntryId = "entry.1", Label = "Name",
            QuestionType = FormQuestionTypes.ShortText, OptionsJson = "[]", Required = true });
        db.AnswerRules.Add(new AnswerRule { Id = Guid.NewGuid(), ProjectId = project, QuestionId = question,
            Mode = AnswerRuleModes.SampleTextLines, ConfigJson = "{\"samples\":[\"Synthetic\"]}" });
        db.AiPromptProfiles.Add(new AiPromptProfile { Id = Guid.NewGuid(), ProjectId = project, UserId = user,
            Mode = AiPromptProfileModes.Option2, GlobalPrompt = "Create a short synthetic answer.", AudienceJson = "{}" });
        if (!await db.AiProviderSettings.AnyAsync())
            db.AiProviderSettings.Add(new AiProviderSetting { Id = Guid.NewGuid(), Provider = AiProviders.OpenAI,
                EncryptedApiKey = "fixture-only", DefaultModel = "fixture-model", IsEnabled = true });
        await db.SaveChangesAsync();
        return (user, project, question);
    }

    private sealed class UserContext(Guid user) : ICurrentUserContext
    {
        public Guid UserId => user;
        public bool IsAdmin => false;
    }

    private sealed class SecretProtector : IAiProviderSecretProtector
    {
        public string Protect(string value) => value;
        public string Unprotect(string value) => value;
        public string Preview(string value) => value;
    }

    private sealed class SyntheticProvider(Guid question, bool fail) : IAiProviderAdapter
    {
        public int Calls { get; private set; }
        public Task<AiProviderGenerateResult> GenerateAsync(AiProviderGenerateRequest request, CancellationToken ct)
        {
            Calls++;
            if (fail) throw new InvalidOperationException("Synthetic provider failure; no external call.");
            return Task.FromResult(new AiProviderGenerateResult("synthetic-request", "synthetic-response",
                [JsonSerializer.Serialize(new { answers = new[] { new { questionId = question, values = new[] { "Synthetic" } } } })]));
        }
    }

    private sealed class AvailabilityTimeoutOnce : DbCommandInterceptor
    {
        public int ReadAttempts { get; private set; }
        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(DbCommand command, CommandEventData data,
            InterceptionResult<DbDataReader> result, CancellationToken ct = default)
        {
            if (command.CommandText.Contains("[CreditReservations]", StringComparison.Ordinal) && command.CommandText.Contains("SUM(", StringComparison.Ordinal))
            {
                ReadAttempts++;
                if (ReadAttempts == 1) throw new TimeoutException("Synthetic transient availability read failure.");
            }
            return ValueTask.FromResult(result);
        }
    }

    private sealed class SpendAfterAvailability(Guid user, bool loseFailureAcknowledgement) : DbTransactionInterceptor
    {
        public bool Spent { get; private set; }
        public int AcknowledgementsLost { get; private set; }
        public override async Task TransactionCommittedAsync(DbTransaction transaction, TransactionEndEventData data, CancellationToken ct = default)
        {
            if (Spent)
            {
                if (loseFailureAcknowledgement && AcknowledgementsLost == 0 && data.Context!.ChangeTracker.Entries<UsageLog>().Any(x => x.Entity.Status == UsageLogStatuses.Failed))
                {
                    AcknowledgementsLost++;
                    throw new TimeoutException("Synthetic transient failed-audit commit acknowledgement loss.");
                }
                return;
            }
            Spent = true;
            await using var competing = await GenerationHistorySqlFixture.OpenAsync();
            await GenerationHistorySqlFixture.WriteAsync(competing, async () =>
            {
                var debit = await new CreditService(competing).DeductUsageCreditsAsync(user, 2, "Synthetic competing generation", nameof(AiGenerationRun), Guid.NewGuid(), default);
                Assert.NotNull(debit);
                await competing.SaveChangesAsync(); return 0;
            });
        }
    }
}
