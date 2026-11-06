using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Integrations.GoogleForms;
using FormAutoHub.Api.Services;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace FormAutoHub.Tests;

[CollectionDefinition("Owned direct SQL", DisableParallelization = true)]
public sealed class DirectRuleSqlCollection;

[Collection("Owned direct SQL")]
public sealed class DirectRuleSubmissionSqlServerTests
{
    internal const string Database = "FormAutoHub_DirectRule_Safety_20261101";

    [DirectSqlTheory]
    [InlineData("missing-rule")]
    [InlineData("no-credit")]
    [InlineData("invalid-rule")]
    [InlineData("zero-count")]
    [InlineData("excess-count")]
    [InlineData("empty-command")]
    [InlineData("active-conflict")]
    [InlineData("rejected-reservation")]
    public async Task RejectedAdmission_RollsBackGenerationHoldDebitAndUsageTogether(string failure)
    {
        var options = await Options();
        var (user, project, _) = await Seed(options, failure == "no-credit" ? 0 : 2);
        await using (var setup = new FormAutoHubDbContext(options))
        {
            var rule = await setup.AnswerRules.SingleAsync(x => x.ProjectId == project);
            if (failure == "missing-rule") setup.AnswerRules.Remove(rule);
            if (failure == "invalid-rule") rule.ConfigJson = "{";
            if (failure == "active-conflict")
                setup.SubmissionJobs.Add(new SubmissionJob { Id = Guid.NewGuid(), ProjectId = project, Status = SubmissionJobStatuses.Running, CreatedAt = DateTimeOffset.UtcNow });
            await setup.SaveChangesAsync();
        }
        var fault = new RejectReservationOnce();
        var rejectedOptions = failure == "rejected-reservation"
            ? new DbContextOptionsBuilder<FormAutoHubDbContext>(options).AddInterceptors(fault).Options : options;
        await using var db = new FormAutoHubDbContext(rejectedOptions);
        var client = new GateClient();
        var command = failure == "empty-command" ? Guid.Empty : Guid.NewGuid();
        var count = failure == "zero-count" ? 0 : failure == "excess-count" ? 101 : 1;

        await Assert.ThrowsAnyAsync<InvalidOperationException>(() => Direct(db, user, client).SendAsync(project, new(2, command, count), default));

        await using var verify = new FormAutoHubDbContext(options);
        Assert.Empty(await verify.UsageLogs.Where(x => x.ProjectId == project).ToListAsync());
        Assert.Empty(await verify.CreditReservations.Where(x => x.JobId == command).ToListAsync());
        Assert.Equal(failure == "no-credit" ? 0 : 2, (await verify.UserCreditAccounts.SingleAsync(x => x.UserId == user.UserId)).Balance);
        Assert.Empty(await verify.CreditTransactions.Where(x => x.UserId == user.UserId).ToListAsync());
        Assert.Equal(failure == "active-conflict" ? 1 : 0, await verify.SubmissionJobs.CountAsync(x => x.ProjectId == project));
        Assert.False(await verify.SubmissionJobs.AnyAsync(x => x.Id == command));
        Assert.Single(await verify.GeneratedResponses.Where(x => x.ProjectId == project).ToListAsync()); // Only seeded preview.
        Assert.Equal(0, client.Calls);
    }

    [DirectSqlTheory]
    [InlineData("valid")]
    [InlineData("zero-count")]
    [InlineData("empty-command")]
    public async Task UnownedProject_DoesNotLogOrRevealAdmissionValidation(string request)
    {
        var options = await Options();
        var (owner, project, _) = await Seed(options, 2);
        var (stranger, _, _) = await Seed(options, 2);
        await using var db = new FormAutoHubDbContext(options);
        var client = new GateClient();

        var result = await Direct(db, stranger, client).SendAsync(project,
            new(2, request == "empty-command" ? Guid.Empty : Guid.NewGuid(), request == "zero-count" ? 0 : 1), default);

        Assert.Null(result);
        await using var verify = new FormAutoHubDbContext(options);
        Assert.Empty(await verify.UsageLogs.Where(x => x.ProjectId == project).ToListAsync());
        Assert.Empty(await verify.SubmissionJobs.Where(x => x.ProjectId == project).ToListAsync());
        Assert.Empty(await verify.CreditTransactions.Where(x => x.UserId == owner.UserId || x.UserId == stranger.UserId).ToListAsync());
        Assert.Single(await verify.GeneratedResponses.Where(x => x.ProjectId == project).ToListAsync());
        Assert.Equal(0, client.Calls);
    }

    [DirectSqlFact]
    public async Task ExistingCommandReplay_DoesNotCreateFreshFailureUsage()
    {
        var options = await Options();
        var (user, project, _) = await Seed(options, 2);
        var command = Guid.NewGuid();
        await using var db = new FormAutoHubDbContext(options);
        db.SubmissionJobs.Add(new SubmissionJob { Id = command, ProjectId = project, Total = 1, Status = SubmissionJobStatuses.Running, CreatedAt = DateTimeOffset.UtcNow });
        await db.SaveChangesAsync();
        var client = new GateClient();

        var upgrade = await Assert.ThrowsAsync<SubmissionContractException>(() => Direct(db, user, client).SendAsync(project, new(2, command, 100), default));
        Assert.Equal("ClientUpgradeRequired", upgrade.Code);
        var result = await new SubmissionService(db, user, client).GetJobAsync(project, command, default);

        Assert.Equal(command, result!.Id);
        Assert.Equal(1, result.Total);
        await using var verify = new FormAutoHubDbContext(options);
        Assert.Empty(await verify.UsageLogs.Where(x => x.ProjectId == project).ToListAsync());
        Assert.Empty(await verify.CreditTransactions.Where(x => x.UserId == user.UserId).ToListAsync());
        Assert.Equal(0, client.Calls);
    }

    [DirectSqlTheory]
    [InlineData("same")]
    [InlineData("different")]
    [InlineData("common")]
    public async Task ConcurrentAdmissions_AreSerializedBeforeReservationAndOnlyOneRunnerSends(string contender)
    {
        var options = await Options();
        var (user, project, preview) = await Seed(options, 10);
        var command = Guid.NewGuid();
        var admissionGate = new AdmissionGate();
        var heldOptions = new DbContextOptionsBuilder<FormAutoHubDbContext>(options).AddInterceptors(admissionGate).Options;
        await using var firstDb = new FormAutoHubDbContext(heldOptions);
        await using var secondDb = new FormAutoHubDbContext(options);
        var client = new GateClient();
        var first = Direct(firstDb, user, client).SendAsync(project, new(2, command, 1), default);
        await admissionGate.Entered.Task.WaitAsync(TimeSpan.FromSeconds(15));

        var second = contender == "common"
            ? new SubmissionService(secondDb, user, client, new SubmissionV2Fixture.Compatibility()).SendAsync(project, new(2, Guid.NewGuid(), null, [preview], true, false), default)
            : Direct(secondDb, user, client).SendAsync(project, new(2, contender == "same" ? command : Guid.NewGuid(), 1), default);
        try
        {
            // The first transaction owns the project lock, but its reservation has not been inserted yet.
            await Task.Delay(200);
            Assert.False(second.IsCompleted);
            Assert.Equal(0, client.Calls);
            admissionGate.Release.TrySetResult();
            await client.Entered.Task.WaitAsync(TimeSpan.FromSeconds(15));

            if (contender == "same")
            {
                var replay = await second.WaitAsync(TimeSpan.FromSeconds(15));
                Assert.Equal(command, replay!.Id);
                Assert.Equal(SubmissionJobStatuses.Running, replay.Status);
            }
            else
                await Assert.ThrowsAnyAsync<InvalidOperationException>(() => second.WaitAsync(TimeSpan.FromSeconds(15)));
        }
        finally
        {
            admissionGate.Release.TrySetResult();
            client.Release.TrySetResult();
            await first.WaitAsync(TimeSpan.FromSeconds(15));
        }
        await using var verify = new FormAutoHubDbContext(options);
        Assert.Single(await verify.SubmissionJobs.Where(x => x.ProjectId == project).ToListAsync());
        Assert.Single(await verify.CreditTransactions.Where(x => x.UserId == user.UserId).ToListAsync());
        Assert.Single(await verify.SubmissionLogs.Where(x => x.JobId == command).ToListAsync());
        Assert.Equal(9, (await verify.UserCreditAccounts.SingleAsync(x => x.UserId == user.UserId)).Balance);
        Assert.Equal(1, client.Calls);
    }

    [DirectSqlFact]
    public async Task CommonAdmissionAlsoBlocksDirectAdmissionUntilItsReservationCommits()
    {
        var options = await Options();
        var (user, project, preview) = await Seed(options, 10);
        var admissionGate = new AdmissionGate();
        await using var firstDb = new FormAutoHubDbContext(new DbContextOptionsBuilder<FormAutoHubDbContext>(options).AddInterceptors(admissionGate).Options);
        await using var secondDb = new FormAutoHubDbContext(options);
        var client = new GateClient();
        var first = new SubmissionService(firstDb, user, client, new SubmissionV2Fixture.Compatibility()).SendAsync(project, new(2, Guid.NewGuid(), null, [preview], true, false), default);
        await admissionGate.Entered.Task.WaitAsync(TimeSpan.FromSeconds(15));
        var second = Direct(secondDb, user, client).SendAsync(project, new(2, Guid.NewGuid(), 1), default);
        try
        {
            await Task.Delay(200);
            Assert.False(second.IsCompleted);
            Assert.Equal(0, client.Calls);
            admissionGate.Release.TrySetResult();
            await client.Entered.Task.WaitAsync(TimeSpan.FromSeconds(15));
            await Assert.ThrowsAnyAsync<InvalidOperationException>(() => second.WaitAsync(TimeSpan.FromSeconds(15)));
        }
        finally
        {
            admissionGate.Release.TrySetResult();
            client.Release.TrySetResult();
            await first.WaitAsync(TimeSpan.FromSeconds(15));
        }
        await using var verify = new FormAutoHubDbContext(options);
        Assert.Empty(await verify.CreditTransactions.Where(x => x.UserId == user.UserId).ToListAsync());
        Assert.Single(await verify.SubmissionJobs.Where(x => x.ProjectId == project).ToListAsync());
        Assert.Equal("Consumed", (await verify.GeneratedResponses.SingleAsync(x => x.Id == preview)).LegacyEntitlementState);
    }

    [DirectSqlFact]
    public async Task DifferentProjectsSharingAccount_RollBackStaleDebitAndRecheckAffordableCount()
    {
        var options = await Options();
        var (user, project, _) = await Seed(options, 1);
        var (_, secondProject, _) = await Seed(options, 1, user);
        await using var one = new FormAutoHubDbContext(options);
        await using var two = new FormAutoHubDbContext(options);
        var client = new GateClient();
        // Account-first admission serializes spending before the debit; a post-debit two-reader barrier
        // would prevent the lock owner from committing and manufacture a test-only deadlock.
        var first = Direct(one, user, client)
            .SendAsync(project, new(2, Guid.NewGuid(), 1), default);
        var second = Direct(two, user, client)
            .SendAsync(secondProject, new(2, Guid.NewGuid(), 1), default);
        client.Release.TrySetResult();
        var outcomes = await Task.WhenAll(Capture(first), Capture(second)).WaitAsync(TimeSpan.FromSeconds(30));
        Assert.Single(outcomes, x => x is null);
        Assert.Single(outcomes, x => x is SubmissionContractException { Code: "InsufficientAvailableCredit" });
        await using var verify = new FormAutoHubDbContext(options);
        Assert.Equal(0, (await verify.UserCreditAccounts.SingleAsync(x => x.UserId == user.UserId)).Balance);
        Assert.Single(await verify.CreditTransactions.Where(x => x.UserId == user.UserId).ToListAsync());
        Assert.Single(await verify.SubmissionJobs.Where(x => x.ProjectId == project || x.ProjectId == secondProject).ToListAsync());
        Assert.Equal(1, client.Calls);
    }

    [DirectSqlFact]
    public async Task CancellationAtFinalBoundaryCannotBeOverwrittenByCompletedStatus()
    {
        var options = await Options();
        var (user, project, _) = await Seed(options, 1);
        var command = Guid.NewGuid();
        await using var db = new FormAutoHubDbContext(options);
        var invoked = false;
        var client = new GateClient { OnReturned = async () => {
            await using var control = new FormAutoHubDbContext(options);
            await new SubmissionService(control, user, new GateClient()).CancelAsync(project, command, default);
            invoked = true;
        } };
        client.Release.TrySetResult();

        var result = await Direct(db, user, client).SendAsync(project, new(2, command, 1), default);

        Assert.True(invoked);
        Assert.Equal(SubmissionJobStatuses.Cancelled, result!.Status);
        Assert.NotNull(result.FinishedAt);
        Assert.Equal(1, result.SuccessCount);
    }

    [DirectSqlFact]
    public async Task LostCommitAcknowledgementReturnsDurableJobWithoutStartingOrRetryingRunner()
    {
        var options = await Options();
        var (user, project, _) = await Seed(options, 2);
        var command = Guid.NewGuid();
        var fault = new LostCommitAcknowledgement();
        await using var db = new FormAutoHubDbContext(new DbContextOptionsBuilder<FormAutoHubDbContext>(options).AddInterceptors(fault).Options);
        var client = new GateClient();
        client.Release.TrySetResult();

        var result = await Direct(db, user, client).SendAsync(project, new(2, command, 1), default);

        Assert.True(fault.Invoked);
        Assert.Equal(command, result!.Id);
        Assert.Equal(SubmissionJobStatuses.Running, result.Status);
        Assert.Equal(0, client.Calls);
        Assert.Empty(result.Logs);
        await using var verify = new FormAutoHubDbContext(options);
        Assert.Empty(await verify.CreditTransactions.Where(x => x.UserId == user.UserId).ToListAsync());
        Assert.Equal(2, (await verify.UserCreditAccounts.SingleAsync(x => x.UserId == user.UserId)).Balance);
        Assert.Equal(1, (await verify.CreditReservations.SingleAsync(x => x.JobId == command)).OutstandingAmount);
        Assert.Equal(2, await verify.GeneratedResponses.CountAsync(x => x.ProjectId == project)); // Seed preview + direct response.
    }

    [DirectSqlFact]
    public async Task ReservationPersistenceFailureRollsBackGeneratedResponsesDebitAndUsageTogether()
    {
        var options = await Options();
        var (user, project, _) = await Seed(options, 2);
        await using var db = new FormAutoHubDbContext(new DbContextOptionsBuilder<FormAutoHubDbContext>(options).AddInterceptors(new FailReservation()).Options);
        var client = new GateClient();

        await Assert.ThrowsAsync<DbUpdateException>(() => Direct(db, user, client).SendAsync(project, new(2, Guid.NewGuid(), 1), default));

        await using var verify = new FormAutoHubDbContext(options);
        Assert.Equal(2, (await verify.UserCreditAccounts.SingleAsync(x => x.UserId == user.UserId)).Balance);
        Assert.Empty(await verify.CreditTransactions.Where(x => x.UserId == user.UserId).ToListAsync());
        Assert.Empty(await verify.SubmissionJobs.Where(x => x.ProjectId == project).ToListAsync());
        Assert.Empty(await verify.UsageLogs.Where(x => x.ProjectId == project).ToListAsync());
        Assert.Single(await verify.GeneratedResponses.Where(x => x.ProjectId == project).ToListAsync());
        Assert.Equal(0, client.Calls);
    }

    private static async Task<Exception?> Capture(Task<SubmissionJobResponse?> task)
    {
        try { await task; return null; } catch (Exception exception) { return exception; }
    }

    private static DirectRuleSubmissionService Direct(FormAutoHubDbContext db, UserContext user, GateClient client, ICreditService? credits = null) =>
        new(db, user, credits ?? new CreditService(db), new SubmissionService(db, user, client, new SubmissionV2Fixture.Compatibility()));

    private static async Task<DbContextOptions<FormAutoHubDbContext>> Options()
    {
        // Task6 may execute these existing cases only through the strict owned history fixture.
        // This path never opens, migrates or takes over the historical direct-rule database.
        if (Environment.GetEnvironmentVariable("FAH_HISTORY_SQL_SERVER") is not null)
        {
            await using var owned = await GenerationHistorySqlFixture.OpenAsync();
            return new DbContextOptionsBuilder<FormAutoHubDbContext>()
                .UseSqlServer(owned.Database.GetConnectionString()!, sql => sql.EnableRetryOnFailure()).Options;
        }
        var server = Environment.GetEnvironmentVariable("FORMAUTO_DIRECT_SQL_SERVER");
        if (server is not ("." or "localhost") || Environment.GetEnvironmentVariable("FORMAUTO_DIRECT_SQL_DATABASE") != Database)
            throw new InvalidOperationException("Runtime owner must opt in to the exact isolated local direct-rule SQL safety database.");
        var connectionString = new SqlConnectionStringBuilder
        {
            DataSource = server, InitialCatalog = Database, IntegratedSecurity = true,
            TrustServerCertificate = true, ConnectTimeout = 10, ApplicationName = "FormAutoHub.DirectRule.SafetyTests"
        }.ConnectionString;
        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();
        await using var identity = connection.CreateCommand();
        identity.CommandText = "SELECT CONCAT(DB_NAME(), '|', CONVERT(nvarchar(128), SERVERPROPERTY('MachineName')))";
        Assert.Equal($"{Database}|{Environment.MachineName}", (string)(await identity.ExecuteScalarAsync())!, ignoreCase: true);
        return new DbContextOptionsBuilder<FormAutoHubDbContext>().UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure()).Options;
    }

    private static async Task<(UserContext User, Guid Project, Guid Preview)> Seed(DbContextOptions<FormAutoHubDbContext> options, int balance, UserContext? existing = null)
    {
        await using var db = new FormAutoHubDbContext(options);
        var user = existing ?? new UserContext(Guid.NewGuid());
        var project = Guid.NewGuid();
        var question = Guid.NewGuid();
        var preview = Guid.NewGuid();
        if (existing is null)
        {
            db.Users.Add(new User { Id = user.UserId, Email = $"direct-{user.UserId:N}@example.invalid", FullName = "Synthetic safety test", Role = UserRoles.User, CreatedAt = DateTimeOffset.UtcNow });
            db.UserCreditAccounts.Add(new UserCreditAccount { Id = Guid.NewGuid(), UserId = user.UserId, Balance = balance, UpdatedAt = DateTimeOffset.UtcNow });
        }
        db.FormProjects.Add(new FormProject { Id = project, UserId = user.UserId, Name = "Direct SQL safety", FormUrl = "https://docs.google.com/forms/d/e/synthetic/viewform", FormActionUrl = "https://docs.google.com/forms/d/e/synthetic/formResponse", CreatedAt = DateTimeOffset.UtcNow });
        db.FormQuestions.Add(new FormQuestion { Id = question, ProjectId = project, EntryId = "entry.1", Label = "Synthetic", QuestionType = FormQuestionTypes.ShortText });
        db.AnswerRules.Add(new AnswerRule { Id = Guid.NewGuid(), ProjectId = project, QuestionId = question, Mode = AnswerRuleModes.SampleTextLines, ConfigJson = "{\"samples\":[\"synthetic\"]}", CreatedAt = DateTimeOffset.UtcNow });
        db.GeneratedResponses.Add(new GeneratedResponse { Id = preview, ProjectId = project, Source = GeneratedResponseSources.Rule,
            Status = GeneratedResponseStatuses.Previewed, CreatedAt = DateTimeOffset.UtcNow, PricingPolicy = "LegacyBundledV1", LegacyEntitlementState = "Available", LegacyEvidenceReference = "test:reviewed-legacy-unattempted",
            PayloadJson = JsonSerializer.Serialize(new[] { new GeneratedAnswerResponse(question, "entry.1", "Synthetic", FormQuestionTypes.ShortText, ["synthetic"]) }) });
        await db.SaveChangesAsync();
        return (user, project, preview);
    }

    private sealed record UserContext(Guid UserId) : ICurrentUserContext { public bool IsAdmin => false; }
    private sealed class GateClient : IGoogleFormsClient
    {
        private int calls;
        public int Calls => Volatile.Read(ref calls);
        public Func<Task>? OnReturned { get; init; }
        public TaskCompletionSource Entered { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public TaskCompletionSource Release { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public Task<GoogleFormAnalysis> AnalyzeAsync(string formUrl, CancellationToken ct) => throw new NotSupportedException();
        public async Task<VerifiedSubmissionOutcome> SubmitVerifiedAsync(string url, IReadOnlyDictionary<string, IReadOnlyList<string>> answers, CancellationToken ct)
        {
            await SubmitAsync(url, answers, ct);
            return GenerationCreditReservationTests.Outcome(SubmissionOutcomeKind.ConfirmedSuccess);
        }
        public async Task<GoogleFormSubmitResult> SubmitAsync(string url, IReadOnlyDictionary<string, IReadOnlyList<string>> answers, CancellationToken ct)
        {
            Interlocked.Increment(ref calls);
            Entered.TrySetResult();
            await Release.Task.WaitAsync(TimeSpan.FromSeconds(20), ct);
            if (OnReturned is not null) await OnReturned();
            return new(true, "");
        }
    }

    private sealed class AdmissionGate : SaveChangesInterceptor
    {
        public TaskCompletionSource Entered { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public TaskCompletionSource Release { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData data, InterceptionResult<int> result, CancellationToken ct = default)
        {
            if (data.Context!.ChangeTracker.Entries<SubmissionJob>().Any(x => x.State == EntityState.Added))
            {
                Entered.TrySetResult();
                await Release.Task.WaitAsync(TimeSpan.FromSeconds(20), ct);
            }
            return result;
        }
    }

    private sealed class LostCommitAcknowledgement : DbTransactionInterceptor
    {
        public bool Invoked { get; private set; }
        public override Task TransactionCommittedAsync(System.Data.Common.DbTransaction transaction, TransactionEndEventData eventData, CancellationToken ct = default)
        {
            if (!Invoked)
            {
                Invoked = true;
                throw new InvalidOperationException("Synthetic lost commit acknowledgement");
            }
            return Task.CompletedTask;
        }
    }

    private sealed class FailReservation : SaveChangesInterceptor
    {
        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData data, InterceptionResult<int> result, CancellationToken ct = default)
        {
            if (data.Context!.ChangeTracker.Entries<SubmissionJob>().Any(x => x.State == EntityState.Added))
                throw new DbUpdateException("Synthetic reservation persistence failure");
            return ValueTask.FromResult(result);
        }
    }

    private sealed class RejectReservationOnce : SaveChangesInterceptor
    {
        private bool rejected;
        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData data, InterceptionResult<int> result, CancellationToken ct = default)
        {
            if (!rejected && data.Context!.ChangeTracker.Entries<SubmissionJob>().Any(x => x.State == EntityState.Added))
            {
                rejected = true;
                throw new InvalidOperationException("Synthetic admission validation failure after generation");
            }
            return ValueTask.FromResult(result);
        }
    }

    private sealed class CreditReadBarrier
    {
        private int entered;
        private readonly TaskCompletionSource release = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public async Task WaitAsync()
        {
            if (Interlocked.Increment(ref entered) == 2) release.TrySetResult();
            await release.Task.WaitAsync(TimeSpan.FromSeconds(20));
        }
    }

    private sealed class BarrierCreditService(ICreditService inner, CreditReadBarrier barrier) : ICreditService
    {
        public async Task<(CreditTransaction Transaction, UserCreditAccount Account)?> DeductUsageCreditsAsync(Guid userId, int credits, string description, string referenceType, Guid referenceId, CancellationToken ct)
        {
            var result = await inner.DeductUsageCreditsAsync(userId, credits, description, referenceType, referenceId, ct);
            await barrier.WaitAsync();
            return result;
        }
        public Task<(CreditTransaction Transaction, UserCreditAccount Account)> AddManualCreditsAsync(Guid id, int credits, string reason, CancellationToken ct, Guid? transactionId = null) => throw new NotSupportedException();
        public Task<(CreditTransaction Transaction, UserCreditAccount Account)> GrantInitialCreditsAsync(Guid id, int credits, string description, CancellationToken ct) => throw new NotSupportedException();
        public Task<(CreditTransaction Transaction, UserCreditAccount Account)> AddTopupCreditsAsync(TopupOrder order, string description, CancellationToken ct, Guid? transactionId = null) => throw new NotSupportedException();
    }

    private sealed class CancelBeforeCompletion(DbContextOptions<FormAutoHubDbContext> options, UserContext user, Guid project, Guid command) : DbCommandInterceptor
    {
        public bool Invoked { get; private set; }
        public override async ValueTask<InterceptionResult<int>> NonQueryExecutingAsync(System.Data.Common.DbCommand dbCommand, CommandEventData eventData, InterceptionResult<int> result, CancellationToken ct = default)
        {
            if (!Invoked && dbCommand.CommandText.StartsWith("UPDATE", StringComparison.OrdinalIgnoreCase) &&
                dbCommand.CommandText.Contains("SubmissionJobs") && dbCommand.CommandText.Contains("FinishedAt"))
            {
                Invoked = true;
                await using var control = new FormAutoHubDbContext(options);
                await new SubmissionService(control, user, new GateClient()).CancelAsync(project, command, ct);
            }
            return result;
        }
    }
}

public sealed class DirectSqlFactAttribute : FactAttribute
{
    public DirectSqlFactAttribute()
    {
        if (Environment.GetEnvironmentVariable("FORMAUTO_DIRECT_SQL_SERVER") is null && Environment.GetEnvironmentVariable("FAH_HISTORY_SQL_SERVER") is null)
            Skip = "Not run: runtime owner must provision and opt in to isolated direct-rule SQL safety DB.";
    }
}

public sealed class DirectSqlTheoryAttribute : TheoryAttribute
{
    public DirectSqlTheoryAttribute()
    {
        if (Environment.GetEnvironmentVariable("FORMAUTO_DIRECT_SQL_SERVER") is null && Environment.GetEnvironmentVariable("FAH_HISTORY_SQL_SERVER") is null)
            Skip = "Not run: runtime owner must provision and opt in to isolated direct-rule SQL safety DB.";
    }
}
