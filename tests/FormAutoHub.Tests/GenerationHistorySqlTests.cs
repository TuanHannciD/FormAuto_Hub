using System.Data.Common;
using System.Text.Json;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Integrations.AI;
using FormAutoHub.Api.Integrations.GoogleForms;
using FormAutoHub.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;

namespace FormAutoHub.Tests;

[Collection("Generation history SQL")]
public sealed class GenerationHistorySqlTests(Xunit.Abstractions.ITestOutputHelper output)
{
    [HistorySqlFact]
    public async Task Rules100_ZeroBalanceAndNoAccount_CreateWithoutLedger()
    {
        await using var db = await GenerationHistorySqlFixture.OpenAsync();
        var (user, project) = await SeedAsync(db, null);
        var result = await Rules(db, user).GenerateAsync(project, new(100), default);
        Assert.Equal(100, result!.GeneratedCount); Assert.Equal(0, result.CreditsUsed); Assert.Equal(new CreditAvailabilityResponse(0, 0, 0), result.Credits);
        await using var read = await GenerationHistorySqlFixture.OpenAsync();
        Assert.Equal(100, await read.GeneratedResponses.CountAsync(x => x.ProjectId == project));
        Assert.Equal(0, await read.CreditTransactions.CountAsync(x => x.UserId == user));
        var counter = new HistoryReadCounter();
        await using var measured = await GenerationHistorySqlFixture.OpenAsync(counter);
        var detail = await new GenerationHistoryService(measured, new GenerationHistoryServiceTests.UserContext(user)).GetDetailAsync(result.GenerationBatchId!.Value, default);
        Assert.Equal(100, detail!.Responses.Count); Assert.All(detail.Responses, x => Assert.True(x.SendBlocked));
        output.WriteLine($"History detail100 reader commands: {counter.Reads}");
        Assert.True(counter.Reads <= 20, $"History detail100 executed {counter.Reads} reader commands; expected a bounded batched read.");
    }

    private sealed class HistoryReadCounter : DbCommandInterceptor
    {
        public int Reads { get; private set; }
        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(DbCommand command,
            CommandEventData eventData, InterceptionResult<DbDataReader> result, CancellationToken cancellationToken = default)
        { Reads++; return ValueTask.FromResult(result); }
    }

    [HistorySqlFact]
    public async Task TwentyOneTiedCompletions_UseSqlGuidOrderingAcrossProjects()
    {
        await using var db = await GenerationHistorySqlFixture.OpenAsync(); var (user, p1) = await SeedAsync(db, 0);
        var p2 = GenerationHistoryServiceTests.Seed(db, user); await db.SaveChangesAsync();
        // Retain fixtures between runs: random common middle preserves hand-derived SQL ordering without global PK reuse.
        var prefix = Guid.NewGuid().ToString("N");
        var middle = $"{prefix[..4]}-{prefix[4..8]}-{prefix[8..12]}";
        var oldest = Guid.Parse($"ffffffff-{middle}-000000000000");
        var ids = new[] { oldest }.Concat(Enumerable.Range(1, 20).Select(n => Guid.Parse($"00000000-{middle}-{n:000000000000}"))).ToArray();
        var time = new DateTimeOffset(2026, 11, 1, 0, 0, 0, TimeSpan.Zero);
        for (var i = 0; i < ids.Length; i++)
        {
            var project = i % 2 == 0 ? p1 : p2;
            var response = new GeneratedResponse { Id = ids[i], ProjectId = project, CreatedAt = time, PayloadJson = "[]", Source = GeneratedResponseSources.Rule };
            await GenerationHistorySqlFixture.WriteAsync(db, async () =>
            {
                var id = await new GenerationBatchWriter(db, new GenerationHistoryServiceTests.UserContext(user)).AppendBatchAsync(project, "rules", [response], 1, 0, default);
                await db.SaveChangesAsync(); return id;
            });
        }
        await using var read = await GenerationHistorySqlFixture.OpenAsync();
        var expired = Assert.Single(await read.GenerationBatches.Where(x => x.UserId == user && x.EvictedAt != null).ToListAsync()); Assert.Equal(oldest, expired.Id);
        Assert.Equal(21, await read.GeneratedResponses.CountAsync(x => x.ProjectId == p1 || x.ProjectId == p2));
        var history = new GenerationHistoryService(read, new GenerationHistoryServiceTests.UserContext(user));
        var page = await history.GetMineAsync(1, 10, default); Assert.Equal(20, page.TotalItems); Assert.Equal(ids[20], page.Items[0].BatchId);
        Assert.Null(await history.GetDetailAsync(oldest, default));
        Assert.Null(await Rules(read, user).GetProjectResponsesAsync(p1, [oldest], default));
    }

    [HistorySqlFact]
    public async Task ConcurrentAppends_KeepExactlyTwentyAndOrderedParentLocks()
    {
        await using var seed = await GenerationHistorySqlFixture.OpenAsync(); var (user, p1) = await SeedAsync(seed, 0);
        var p2 = GenerationHistoryServiceTests.Seed(seed, user); await seed.SaveChangesAsync();
        for (var i = 0; i < 19; i++) await Rules(seed, user).GenerateAsync(p1, new(1), default);
        var start = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        async Task AppendAsync(Guid project)
        {
            var order = new LockOrder(); await using var db = await GenerationHistorySqlFixture.OpenAsync(order); await start.Task;
            await Rules(db, user).GenerateAsync(project, new(1), default); order.AssertOrdered();
        }
        var first = AppendAsync(p1); var second = AppendAsync(p2); var third = AppendAsync(p1); start.SetResult(); await Task.WhenAll(first, second, third);
        await using var read = await GenerationHistorySqlFixture.OpenAsync();
        Assert.Equal(22, await read.GenerationBatches.CountAsync(x => x.UserId == user));
        Assert.Equal(20, await read.GenerationBatches.CountAsync(x => x.UserId == user && x.EvictedAt == null));
        Assert.Equal(22, await read.GeneratedResponses.CountAsync(x => x.ProjectId == p1 || x.ProjectId == p2));
    }

    [HistorySqlFact]
    public async Task AppendRollback_DoesNotEvictOrPersistDebitAuditOrPayload()
    {
        await using var seed = await GenerationHistorySqlFixture.OpenAsync(); var (user, project) = await SeedAsync(seed, 100);
        for (var i = 0; i < 20; i++) await Rules(seed, user).GenerateAsync(project, new(1), default);
        var before = await seed.GenerationBatches.Where(x => x.UserId == user).Select(x => x.Id).ToArrayAsync();
        var failure = new FailBeforeCommit(); await using var db = await GenerationHistorySqlFixture.OpenAsync(failure);
        var provider = await AiAsync(db, user, project, 10);
        await Assert.ThrowsAsync<IOException>(() => provider.Service.GenerateAsync(project, new(AiPromptProfileModes.Option2, 10), default));
        Assert.Equal(1, provider.Provider.Calls);
        await using var read = await GenerationHistorySqlFixture.OpenAsync();
        Assert.Equal(20, await read.GenerationBatches.CountAsync(x => x.UserId == user && x.EvictedAt == null));
        Assert.Equal(before.Order(), (await read.GenerationBatches.Where(x => x.UserId == user).Select(x => x.Id).ToArrayAsync()).Order());
        Assert.Equal(20, await read.GeneratedResponses.CountAsync(x => x.ProjectId == project));
        Assert.Equal(20, await read.UsageLogs.CountAsync(x => x.ProjectId == project));
        Assert.Equal(0, await read.CreditTransactions.CountAsync(x => x.UserId == user)); Assert.Equal(0, await read.AiGenerationRuns.CountAsync(x => x.ProjectId == project));
        Assert.Equal(100, (await read.UserCreditAccounts.SingleAsync(x => x.UserId == user)).Balance);
    }

    [HistorySqlFact]
    public async Task AiSqlRetryAndLostCommitAck_CallProviderOnceAndAppendOneRun()
    {
        foreach (var loseAck in new[] { false, true })
        {
            await using var seed = await GenerationHistorySqlFixture.OpenAsync(); var (user, project) = await SeedAsync(seed, 100);
            var fault = new RetryOnce(loseAck); await using var db = await GenerationHistorySqlFixture.OpenAsync(fault);
            var provider = await AiAsync(db, user, project, 3);
            var result = await provider.Service.GenerateAsync(project, new(AiPromptProfileModes.Option2, 10), default);
            Assert.True(fault.Triggered); Assert.Equal(1, provider.Provider.Calls); Assert.Equal(3, result!.CreditsUsed);
            await using var read = await GenerationHistorySqlFixture.OpenAsync();
            var batch = Assert.Single(await read.GenerationBatches.Where(x => x.UserId == user).ToListAsync());
            Assert.Equal(result.GenerationBatchId, batch.Id); Assert.Equal(result.RunId, batch.AiGenerationRunId);
            Assert.Equal(3, await read.GeneratedResponses.CountAsync(x => x.ProjectId == project));
            Assert.Equal(1, await read.CreditTransactions.CountAsync(x => x.UserId == user));
            Assert.Equal(1, await read.UsageLogs.CountAsync(x => x.ProjectId == project));
            Assert.Equal(97, (await read.UserCreditAccounts.SingleAsync(x => x.UserId == user)).Balance);
        }
    }

    [HistorySqlFact]
    public async Task RulesLostCommitAck_ReplaysBatchWithoutSecondUsageOrEviction()
    {
        await using var seed = await GenerationHistorySqlFixture.OpenAsync(); var (user, project) = await SeedAsync(seed, 0);
        var fault = new RetryOnce(true); await using var db = await GenerationHistorySqlFixture.OpenAsync(fault);
        var result = await Rules(db, user).GenerateAsync(project, new(100), default);
        Assert.True(fault.Triggered); Assert.Equal(100, result!.GeneratedCount);
        await using var read = await GenerationHistorySqlFixture.OpenAsync();
        Assert.Equal(1, await read.GenerationBatches.CountAsync(x => x.UserId == user));
        Assert.Equal(1, await read.UsageLogs.CountAsync(x => x.ProjectId == project)); Assert.Equal(0, await read.CreditTransactions.CountAsync(x => x.UserId == user));
    }

    [HistorySqlFact]
    public async Task NonTransientLostCommitAck_ObservesFreshDurableGenerationWithoutRepeatingProvider()
    {
        await using var seed = await GenerationHistorySqlFixture.OpenAsync(); var (user, project) = await SeedAsync(seed, 100);
        var fault = new NonTransientAckOnce(); await using var db = await GenerationHistorySqlFixture.OpenAsync(fault);
        var ai = await AiAsync(db, user, project, 3);
        var result = await ai.Service.GenerateAsync(project, new(AiPromptProfileModes.Option2, 10), default);
        Assert.True(fault.Triggered); Assert.Equal(1, ai.Provider.Calls); Assert.Equal(3, result!.CreditsUsed);
        await using var read = await GenerationHistorySqlFixture.OpenAsync();
        Assert.Equal(1, await read.GenerationBatches.CountAsync(x => x.UserId == user));
        Assert.Equal(1, await read.CreditTransactions.CountAsync(x => x.UserId == user));
        Assert.Equal(1, await read.UsageLogs.CountAsync(x => x.ProjectId == project));
    }

    [HistorySqlFact]
    public async Task HeldCredits_ActualAiConsumersOnlySpendAvailableAndRulesRemainFree()
    {
        await using var seed = await GenerationHistorySqlFixture.OpenAsync();
        var (user, job, held) = await GenerationCreditReservationTests.SeedAsync(seed, 10, 7);
        await GenerationHistorySqlFixture.WriteAsync(seed, async () =>
        {
            await new CreditReservationService(seed).ReserveSubmissionAsync(user, job, held.Select(x => x.Id).ToArray(), default); await seed.SaveChangesAsync(); return 0;
        });
        var project = GenerationHistoryServiceTests.Seed(seed, user); await seed.SaveChangesAsync();
        var ai = await AiAsync(seed, user, project, 3);
        var result = await ai.Service.GenerateAsync(project, new(AiPromptProfileModes.Option2, 10), default);
        Assert.Equal(3, result!.GeneratedCount); Assert.Equal(new CreditAvailabilityResponse(7, 7, 0), result.Credits);
        var blocked = await ai.Service.GenerateAsync(project, new(AiPromptProfileModes.Option2, 1), default);
        Assert.Equal(1, ai.Provider.Calls); Assert.Equal(0, blocked!.GeneratedCount); Assert.Null(blocked.GenerationBatchId);
        var free = await Rules(seed, user).GenerateAsync(project, new(100), default); Assert.Equal(100, free!.GeneratedCount); Assert.Equal(0, free.CreditsUsed);
        await using var read = await GenerationHistorySqlFixture.OpenAsync();
        Assert.Equal(7, (await read.CreditReservations.SingleAsync(x => x.JobId == job)).OutstandingAmount);
        Assert.Equal(1, await read.CreditTransactions.CountAsync(x => x.UserId == user)); Assert.Equal(2, await read.GenerationBatches.CountAsync(x => x.UserId == user));
    }

    [HistorySqlFact]
    public async Task CompetingAiConsumers_ReserveAwareCommitNeverOverspendsAndNeverRepeatsProvider()
    {
        await using var seed = await GenerationHistorySqlFixture.OpenAsync();
        var (user, job, held) = await GenerationCreditReservationTests.SeedAsync(seed, 10, 7);
        await GenerationHistorySqlFixture.WriteAsync(seed, async () =>
        {
            await new CreditReservationService(seed).ReserveSubmissionAsync(user, job, held.Select(x => x.Id).ToArray(), default); await seed.SaveChangesAsync(); return 0;
        });
        var p1 = GenerationHistoryServiceTests.Seed(seed, user); var p2 = GenerationHistoryServiceTests.Seed(seed, user); await seed.SaveChangesAsync();
        // Finish both external calls before either local SQL commit.
        var arrived = 0; var barrier = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        async Task<AiGenerateResponsesResponse?> GenerateAsync(Guid project)
        {
            await using var db = await GenerationHistorySqlFixture.OpenAsync(); var configured = await AiAsync(db, user, project, 2);
            var provider = new BarrierProvider(configured.Provider, async () =>
            {
                if (Interlocked.Increment(ref arrived) == 2) barrier.SetResult();
                await barrier.Task.WaitAsync(TimeSpan.FromSeconds(15));
            });
            var service = new AiGenerationService(db, new GenerationHistoryServiceTests.UserContext(user), new AiPromptGuardService(), new AiOutputValidator(),
                provider, new SecretProtector(), new ConfigurationBuilder().Build(), new CreditService(db));
            var result = await service.GenerateAsync(project, new(AiPromptProfileModes.Option2, 2), default); Assert.Equal(1, configured.Provider.Calls); return result;
        }
        var results = await Task.WhenAll(GenerateAsync(p1), GenerateAsync(p2));
        Assert.Single(results, x => x!.GeneratedCount == 2); Assert.Single(results, x => x!.GeneratedCount == 0 && x.GenerationBatchId == null);
        await using var read = await GenerationHistorySqlFixture.OpenAsync();
        Assert.Equal(new CreditAvailabilityResponse(8, 7, 1), await new CreditReservationService(read).GetCreditAvailabilityAsync(user, default));
        Assert.Equal(1, await read.GenerationBatches.CountAsync(x => x.UserId == user)); Assert.Equal(1, await read.CreditTransactions.CountAsync(x => x.UserId == user));
        Assert.Equal(2, await read.UsageLogs.CountAsync(x => x.ProjectId == p1 || x.ProjectId == p2));
    }

    [HistorySqlFact]
    public async Task AdmittedSnapshotsAndHolds_SurviveConcurrentAppendEviction()
    {
        await using var seed = await GenerationHistorySqlFixture.OpenAsync(); var (user, project) = await SeedAsync(seed, 10);
        var first = await Rules(seed, user).GenerateAsync(project, new(1), default);
        for (var i = 0; i < 19; i++) await Rules(seed, user).GenerateAsync(project, new(1), default);
        var response = await seed.GeneratedResponses.SingleAsync(x => x.Id == first!.Items[0].Id);
        var batch = await seed.GenerationBatches.SingleAsync(x => x.Id == first!.GenerationBatchId);
        var job = Guid.NewGuid(); var item = Guid.NewGuid();
        seed.SubmissionJobs.Add(new() { Id = job, ProjectId = project, UserId = user, Total = 1, Status = "Running" });
        seed.SubmissionJobItems.Add(new() { Id = item, JobId = job, ProjectId = project, ResponseId = response.Id, GenerationBatchId = batch.Id,
            Ordinal = 0, PayloadJson = response.PayloadJson, ObservedMetadataJson = batch.ObservedMetadataJson, FormActionUrl = batch.FormActionUrl,
            PayloadSha256 = new string('a', 64), ObservedMetadataSha256 = batch.ObservedMetadataSha256, CompatibilityEvidenceSha256 = new string('b', 64),
            PricingPolicy = "SeparatedV1", MaximumSendCredits = 1, AttemptState = "Planned", SettlementState = "Held" });
        await seed.SaveChangesAsync();
        var start = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        async Task ReserveAsync()
        {
            var order = new LockOrder(); await using var db = await GenerationHistorySqlFixture.OpenAsync(order); await start.Task;
            await GenerationHistorySqlFixture.WriteAsync(db, async () =>
            {
                await new CreditReservationService(db).ReserveSubmissionAsync(user, job, [item], default); await db.SaveChangesAsync(); return 0;
            }); order.AssertOrdered(requireBatch: false);
        }
        async Task AppendAsync() { await using var db = await GenerationHistorySqlFixture.OpenAsync(); await start.Task; await Rules(db, user).GenerateAsync(project, new(1), default); }
        var reserve = ReserveAsync(); var append = AppendAsync(); start.SetResult(); await Task.WhenAll(reserve, append);
        await using var read = await GenerationHistorySqlFixture.OpenAsync();
        Assert.NotNull((await read.GenerationBatches.SingleAsync(x => x.Id == batch.Id)).EvictedAt);
        var snapshot = await read.SubmissionJobItems.SingleAsync(x => x.Id == item); Assert.Equal(response.PayloadJson, snapshot.PayloadJson);
        Assert.Equal(batch.ObservedMetadataJson, snapshot.ObservedMetadataJson); Assert.Equal(1, (await read.CreditReservations.SingleAsync(x => x.JobId == job)).OutstandingAmount);
        Assert.Null(await new GenerationHistoryService(read, new GenerationHistoryServiceTests.UserContext(user)).GetDetailAsync(batch.Id, default));
    }

    [HistorySqlFact]
    public async Task DirectAdmission_UnversionedClientDoesNotEnableFreeSending()
    {
        await using var seed = await GenerationHistorySqlFixture.OpenAsync(); var (user, project) = await SeedAsync(seed, 0);
        var order = new LockOrder(); await using var db = await GenerationHistorySqlFixture.OpenAsync(order);
        var actor = new GenerationHistoryServiceTests.UserContext(user); var provider = new NoSendClient();
        var direct = new DirectRuleSubmissionService(db, actor, new CreditService(db), new SubmissionService(db, actor, provider));
        var upgrade = await Assert.ThrowsAsync<SubmissionContractException>(() => direct.SendAsync(project, new(0, Guid.NewGuid(), 1), default));
        Assert.Equal("ClientUpgradeRequired", upgrade.Code); Assert.Equal(0, provider.Calls);
        await using var read = await GenerationHistorySqlFixture.OpenAsync();
        Assert.Equal(0, await read.GeneratedResponses.CountAsync(x => x.ProjectId == project)); Assert.Equal(0, await read.GenerationBatches.CountAsync(x => x.UserId == user));
        Assert.Equal(0, await read.SubmissionJobs.CountAsync(x => x.ProjectId == project));
        Assert.Equal(0, await read.CreditTransactions.CountAsync(x => x.UserId == user));
        Assert.Equal(0, await read.UsageLogs.CountAsync(x => x.ProjectId == project));
    }

    [HistorySqlFact]
    public async Task Recovery_EvictionBeforePayloadRead_ReturnsWholeRequestedMembershipOrNotFound()
    {
        foreach (var includeStillEligible in new[] { false, true })
        {
            await using var seed = await GenerationHistorySqlFixture.OpenAsync(); var (user, project) = await SeedAsync(seed, 0);
            var rules = Rules(seed, user);
            var oldest = await rules.GenerateAsync(project, new(1), default);
            var kept = await rules.GenerateAsync(project, new(1), default);
            for (var i = 0; i < 18; i++) await rules.GenerateAsync(project, new(1), default);
            Guid[] requested = includeStillEligible ? [oldest!.Items[0].Id, kept!.Items[0].Id] : [oldest!.Items[0].Id];
            var before = await rules.GetProjectResponsesAsync(project, requested, default);
            Assert.NotNull(before); Assert.Equal(requested.Order(), before.Items.Select(x => x.Id).Order());
            var interleaving = new EvictBeforeResponseRead(async () =>
            {
                await using var append = await GenerationHistorySqlFixture.OpenAsync();
                await Rules(append, user).GenerateAsync(project, new(1), default);
            });
            await using var db = await GenerationHistorySqlFixture.OpenAsync(interleaving);
            var result = await Rules(db, user).GetProjectResponsesAsync(project, requested, default);
            Assert.True(interleaving.Triggered);
            // The same materialized result must establish membership: neither empty200 nor a silent subset200.
            Assert.Null(result);
            await using var read = await GenerationHistorySqlFixture.OpenAsync();
            Assert.NotNull((await read.GenerationBatches.SingleAsync(x => x.Id == oldest.GenerationBatchId)).EvictedAt);
            var unfiltered = await Rules(read, user).GetProjectResponsesAsync(project, [], default);
            Assert.Equal(20, unfiltered!.Items.Count); Assert.DoesNotContain(unfiltered.Items, x => x.Id == oldest.Items[0].Id);
            Assert.Equal(21, await read.GeneratedResponses.CountAsync(x => x.ProjectId == project));
        }
    }

    private static ResponseGenerationService Rules(FormAutoHubDbContext db, Guid user) => new(db, new GenerationHistoryServiceTests.UserContext(user), new CreditService(db));
    private static async Task<(Guid User, Guid Project)> SeedAsync(FormAutoHubDbContext db, decimal? balance)
    {
        var user = Guid.NewGuid(); db.Users.Add(new() { Id = user, Email = $"{user}@fixture.invalid" });
        var project = GenerationHistoryServiceTests.Seed(db, user);
        if (balance.HasValue) db.UserCreditAccounts.Add(new() { Id = Guid.NewGuid(), UserId = user, Balance = balance.Value });
        await db.SaveChangesAsync(); return (user, project);
    }
    private static async Task<(AiGenerationService Service, SyntheticProvider Provider)> AiAsync(FormAutoHubDbContext db, Guid user, Guid project, int valid)
    {
        var question = await db.FormQuestions.Where(x => x.ProjectId == project).Select(x => x.Id).SingleAsync();
        db.AiPromptProfiles.Add(new() { Id = Guid.NewGuid(), ProjectId = project, UserId = user, Mode = AiPromptProfileModes.Option2, GlobalPrompt = "Synthetic short answer", AudienceJson = "{}" });
        if (!await db.AiProviderSettings.AnyAsync(x => x.IsEnabled)) db.AiProviderSettings.Add(new() { Id = Guid.NewGuid(), Provider = AiProviders.OpenAI, EncryptedApiKey = "fixture-only", DefaultModel = "fixture-model", IsEnabled = true });
        await db.SaveChangesAsync(); var provider = new SyntheticProvider(question, valid);
        return (new(db, new GenerationHistoryServiceTests.UserContext(user), new AiPromptGuardService(), new AiOutputValidator(), provider,
            new SecretProtector(), new ConfigurationBuilder().Build(), new CreditService(db)), provider);
    }
    private sealed class SyntheticProvider(Guid question, int valid) : IAiProviderAdapter
    {
        public int Calls { get; private set; }
        public Task<AiProviderGenerateResult> GenerateAsync(AiProviderGenerateRequest request, CancellationToken ct)
        {
            Calls++; return Task.FromResult(new AiProviderGenerateResult("synthetic", "synthetic", Enumerable.Range(0, Math.Min(valid, request.Count))
                .Select(_ => JsonSerializer.Serialize(new { answers = new[] { new { questionId = question, values = new[] { "Synthetic" } } } })).ToArray()));
        }
    }
    private sealed class BarrierProvider(SyntheticProvider inner, Func<Task> ready) : IAiProviderAdapter
    {
        public async Task<AiProviderGenerateResult> GenerateAsync(AiProviderGenerateRequest request, CancellationToken ct)
        {
            var output = await inner.GenerateAsync(request, ct); await ready(); return output;
        }
    }
    private sealed class NoSendClient : IGoogleFormsClient
    {
        public int Calls { get; private set; }
        public Task<GoogleFormAnalysis> AnalyzeAsync(string formUrl, CancellationToken ct) => throw new NotSupportedException();
        public Task<GoogleFormSubmitResult> SubmitAsync(string actionUrl, IReadOnlyDictionary<string, IReadOnlyList<string>> answers, CancellationToken ct)
        { Calls++; throw new InvalidOperationException("No provider dispatch authorized in admission rejection fixture."); }
    }
    private sealed class EvictBeforeResponseRead(Func<Task> evict) : DbCommandInterceptor
    {
        public bool Triggered { get; private set; }
        public override async ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(DbCommand command,
            CommandEventData data, InterceptionResult<DbDataReader> result, CancellationToken ct = default)
        {
            if (!Triggered && command.CommandText.Contains("[GeneratedResponses]", StringComparison.Ordinal) &&
                command.CommandText.Contains("[PayloadJson]", StringComparison.Ordinal))
            {
                Triggered = true;
                await evict();
            }
            return result;
        }
    }
    private sealed class SecretProtector : IAiProviderSecretProtector { public string Protect(string value) => value; public string Unprotect(string value) => value; public string Preview(string value) => value; }
    private sealed class FailBeforeCommit : DbTransactionInterceptor
    {
        public override ValueTask<InterceptionResult> TransactionCommittingAsync(DbTransaction transaction, TransactionEventData data, InterceptionResult result, CancellationToken ct = default)
        {
            if (data.Context!.ChangeTracker.Entries<GenerationBatch>().Any()) throw new IOException("Synthetic append rollback.");
            return ValueTask.FromResult(result);
        }
    }
    private sealed class RetryOnce(bool loseAck) : DbTransactionInterceptor
    {
        public bool Triggered { get; private set; }
        public override ValueTask<InterceptionResult> TransactionCommittingAsync(DbTransaction transaction, TransactionEventData data, InterceptionResult result, CancellationToken ct = default)
        {
            if (!loseAck && !Triggered && data.Context!.ChangeTracker.Entries<GenerationBatch>().Any()) { Triggered = true; throw new TimeoutException("Synthetic precommit retry."); }
            return ValueTask.FromResult(result);
        }
        public override Task TransactionCommittedAsync(DbTransaction transaction, TransactionEndEventData data, CancellationToken ct = default)
        {
            if (loseAck && !Triggered && data.Context!.ChangeTracker.Entries<GenerationBatch>().Any()) { Triggered = true; throw new TimeoutException("Synthetic lost acknowledgement."); }
            return Task.CompletedTask;
        }
    }
    private sealed class NonTransientAckOnce : DbTransactionInterceptor
    {
        public bool Triggered { get; private set; }
        public override Task TransactionCommittedAsync(DbTransaction transaction, TransactionEndEventData data, CancellationToken ct = default)
        {
            if (!Triggered && data.Context!.ChangeTracker.Entries<GenerationBatch>().Any()) { Triggered = true; throw new IOException("Synthetic nontransient lost acknowledgement."); }
            return Task.CompletedTask;
        }
    }
    private sealed class LockOrder : DbCommandInterceptor
    {
        private readonly List<string> locks = [];
        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(DbCommand command, CommandEventData data, InterceptionResult<DbDataReader> result, CancellationToken ct = default)
        {
            if (command.CommandText.Contains("UPDLOCK", StringComparison.OrdinalIgnoreCase)) locks.Add(command.CommandText);
            return ValueTask.FromResult(result);
        }
        public void AssertOrdered(bool requireBatch = true)
        {
            var users = locks.FindIndex(x => x.Contains("[Users]")); var account = locks.FindIndex(x => x.Contains("[UserCreditAccounts]"));
            var project = locks.FindIndex(x => x.Contains("[FormProjects]")); var batch = locks.FindIndex(x => x.Contains("SELECT * FROM [GenerationBatches]"));
            Assert.True(users >= 0 && account > users && project > account);
            if (requireBatch) Assert.True(batch > project);
        }
    }
}
