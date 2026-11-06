using System.Data.Common;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Data.SqlClient;

namespace FormAutoHub.Tests;

[Collection("Generation history SQL")]
public sealed class GenerationCreditReservationSqlTests
{
    [HistorySqlFact]
    public async Task CleanMigration_ReservationSettlementReplayAndUnknown_AreDurable()
    {
        await using var db = await GenerationHistorySqlFixture.OpenAsync();
        await db.Database.MigrateAsync();
        var (user, job, items) = await GenerationCreditReservationTests.SeedAsync(db, 10m, 7);
        await GenerationHistorySqlFixture.WriteAsync(db, async () =>
        {
            var result = await new CreditReservationService(db).ReserveSubmissionAsync(user, job, items.Select(x => x.Id).ToArray(), default);
            await db.SaveChangesAsync(); return result;
        });
        var service = new SubmissionSettlementService(db, new CreditService(db));
        var outcome = GenerationCreditReservationTests.Outcome(SubmissionOutcomeKind.ConfirmedSuccess);
        await service.MarkPossibleDispatchAsync(items[0].Id, default);
        await service.SettleAttemptAsync(items[0].Id, outcome, default);
        await service.SettleAttemptAsync(items[0].Id, outcome, default);
        await service.MarkPossibleDispatchAsync(items[1].Id, default);
        await service.SettleAttemptAsync(items[1].Id, GenerationCreditReservationTests.Outcome(SubmissionOutcomeKind.ConfirmedRejected), default);
        await service.MarkPossibleDispatchAsync(items[2].Id, default);
        await service.SettleAttemptAsync(items[2].Id, GenerationCreditReservationTests.Outcome(SubmissionOutcomeKind.Unknown), default);
        await using var read = await GenerationHistorySqlFixture.OpenAsync();
        Assert.Equal(new CreditAvailabilityResponse(9, 5, 4), await new CreditReservationService(read).GetCreditAvailabilityAsync(user, default));
        var ledger = Assert.Single(await read.CreditTransactions.Where(x => x.UserId == user).ToListAsync());
        Assert.Equal(-1, ledger.Amount);
        Assert.Equal(items[0].Id, ledger.ReferenceId);
        Assert.Equal(1, await read.UsageLogs.CountAsync(x => x.SubmissionItemId == items[0].Id && x.CreditsUsed == 1));
        var reservation = await read.CreditReservations.SingleAsync(x => x.JobId == job);
        Assert.Equal(7, reservation.InitialAmount);
        Assert.Equal(1, reservation.SettledAmount);
        Assert.Equal(1, reservation.ReleasedAmount);
        Assert.Null(reservation.ClosedAt);
    }

    [HistorySqlFact]
    public async Task TwoProjects_SendVersusGeneration_AndTopup_DoNotOverspendOrLoseUpdates()
    {
        await using var seed = await GenerationHistorySqlFixture.OpenAsync();
        await seed.Database.MigrateAsync();
        var (user, job, items) = await GenerationCreditReservationTests.SeedAsync(seed, 10m, 7);
        await GenerationHistorySqlFixture.WriteAsync(seed, async () =>
        {
            await new CreditReservationService(seed).ReserveSubmissionAsync(user, job, items.Select(x => x.Id).ToArray(), default);
            await seed.SaveChangesAsync(); return 0;
        });
        var start = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        async Task<bool> SpendAsync()
        {
            await using var db = await GenerationHistorySqlFixture.OpenAsync();
            await start.Task;
            return await GenerationHistorySqlFixture.WriteAsync(db, async () =>
            {
                var result = await new CreditService(db).DeductUsageCreditsAsync(user, 2, "synthetic AI generation", "AiGenerationRun", Guid.NewGuid(), default);
                await db.SaveChangesAsync(); return result is not null;
            });
        }
        var a = SpendAsync(); var b = SpendAsync(); start.SetResult();
        var results = await Task.WhenAll(a, b);
        Assert.Single(results, x => x);
        await using var grant = await GenerationHistorySqlFixture.OpenAsync();
        await GenerationHistorySqlFixture.WriteAsync(grant, async () =>
        {
            await new CreditService(grant).AddManualCreditsAsync(user, 5, "synthetic topup race", default);
            await grant.SaveChangesAsync(); return 0;
        });
        var settlement = new SubmissionSettlementService(seed, new CreditService(seed));
        await settlement.MarkPossibleDispatchAsync(items[0].Id, default);
        await settlement.SettleAttemptAsync(items[0].Id, GenerationCreditReservationTests.Outcome(SubmissionOutcomeKind.ConfirmedSuccess), default);
        await using var read = await GenerationHistorySqlFixture.OpenAsync();
        var account = await read.UserCreditAccounts.SingleAsync(x => x.UserId == user);
        Assert.Equal(12m, account.Balance); Assert.Equal(3m, account.TotalUsed); Assert.Equal(5m, account.TotalDeposited);
        Assert.Equal(new CreditAvailabilityResponse(12, 6, 6), await new CreditReservationService(read).GetCreditAvailabilityAsync(user, default));
    }

    [HistorySqlFact]
    public async Task SettlementRollbackThenLostCommitAcknowledgement_ReplayCreatesOneDebit()
    {
        await using var seed = await GenerationHistorySqlFixture.OpenAsync();
        await seed.Database.MigrateAsync();
        var (user, job, items) = await GenerationCreditReservationTests.SeedAsync(seed, 1, 1);
        await GenerationHistorySqlFixture.WriteAsync(seed, async () =>
        {
            await new CreditReservationService(seed).ReserveSubmissionAsync(user, job, [items[0].Id], default);
            await seed.SaveChangesAsync(); return 0;
        });
        await new SubmissionSettlementService(seed, new CreditService(seed)).MarkPossibleDispatchAsync(items[0].Id, default);
        var outcome = GenerationCreditReservationTests.Outcome(SubmissionOutcomeKind.ConfirmedSuccess);
        var failure = new BeforeSaveFailure();
        await using (var db = await GenerationHistorySqlFixture.OpenAsync(failure))
            await Assert.ThrowsAsync<IOException>(() => new SubmissionSettlementService(db, new CreditService(db)).SettleAttemptAsync(items[0].Id, outcome, default));
        await using (var read = await GenerationHistorySqlFixture.OpenAsync())
        {
            Assert.Equal(0, await read.CreditTransactions.CountAsync(x => x.UserId == user));
            Assert.Equal(new CreditAvailabilityResponse(1, 1, 0), await new CreditReservationService(read).GetCreditAvailabilityAsync(user, default));
        }
        await using (var db = await GenerationHistorySqlFixture.OpenAsync(new LostCommitAcknowledgement()))
        {
            var recovered = await new SubmissionSettlementService(db, new CreditService(db)).SettleAttemptAsync(items[0].Id, outcome, default);
            Assert.Equal(SubmissionSettlementState.Settled, recovered.SettlementState);
            Assert.Equal(1, recovered.SettledCredits);
        }
        await using var replay = await GenerationHistorySqlFixture.OpenAsync();
        await new SubmissionSettlementService(replay, new CreditService(replay)).SettleAttemptAsync(items[0].Id, outcome, default);
        Assert.Equal(1, await replay.CreditTransactions.CountAsync(x => x.UserId == user));
        Assert.Equal(new CreditAvailabilityResponse(0, 0, 0), await new CreditReservationService(replay).GetCreditAvailabilityAsync(user, default));
    }

    [HistorySqlFact]
    public async Task CompetingProjectReservations_AndConcurrentGrants_SerializeSharedAccount()
    {
        await using var seed = await GenerationHistorySqlFixture.OpenAsync();
        await seed.Database.MigrateAsync();
        var (user, firstJob, firstItems) = await GenerationCreditReservationTests.SeedAsync(seed, 10, 7);
        var project = Guid.NewGuid(); var secondJob = Guid.NewGuid();
        seed.FormProjects.Add(new FormProject { Id = project, UserId = user });
        seed.SubmissionJobs.Add(new SubmissionJob { Id = secondJob, ProjectId = project, UserId = user, Status = "Running", Total = 7 });
        var secondItems = new List<Guid>();
        for (var n = 0; n < 7; n++)
        {
            var response = Guid.NewGuid(); var item = Guid.NewGuid(); secondItems.Add(item);
            seed.GeneratedResponses.Add(new GeneratedResponse { Id = response, ProjectId = project });
            seed.SubmissionJobItems.Add(new SubmissionJobItem { Id = item, JobId = secondJob, ProjectId = project, ResponseId = response,
                Ordinal = n, PricingPolicy = "SeparatedV1", MaximumSendCredits = 1, AttemptState = "Planned", SettlementState = "Held",
                PayloadSha256 = new string('a',64), ObservedMetadataSha256 = new string('a',64), CompatibilityEvidenceSha256 = new string('a',64) });
        }
        await seed.SaveChangesAsync();
        var start = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        async Task<bool> ReserveAsync(Guid job, Guid[] ids)
        {
            await using var db = await GenerationHistorySqlFixture.OpenAsync();
            await start.Task;
            try
            {
                return await GenerationHistorySqlFixture.WriteAsync(db, async () =>
                {
                    await new CreditReservationService(db).ReserveSubmissionAsync(user, job, ids, default);
                    await db.SaveChangesAsync(); return true;
                });
            }
            catch (InvalidOperationException error) when (error.Message.Contains("Insufficient available")) { return false; }
        }
        var first = ReserveAsync(firstJob, firstItems.Select(x => x.Id).ToArray()); var second = ReserveAsync(secondJob, secondItems.ToArray());
        start.SetResult(); Assert.Single(await Task.WhenAll(first, second), x => x);
        async Task GrantAsync()
        {
            await using var db = await GenerationHistorySqlFixture.OpenAsync();
            await GenerationHistorySqlFixture.WriteAsync(db, async () =>
            {
                await new CreditService(db).AddTopupCreditsAsync(new TopupOrder { Id = Guid.NewGuid(), UserId = user, Credits = 5 }, "Synthetic confirmed topup", default);
                await db.SaveChangesAsync(); return 0;
            });
        }
        await Task.WhenAll(GrantAsync(), GrantAsync());
        await using var read = await GenerationHistorySqlFixture.OpenAsync();
        Assert.Equal(new CreditAvailabilityResponse(20, 7, 13), await new CreditReservationService(read).GetCreditAvailabilityAsync(user, default));
        Assert.Equal(10, (await read.UserCreditAccounts.SingleAsync(x => x.UserId == user)).TotalDeposited);
        Assert.Equal(2, await read.CreditTransactions.CountAsync(x => x.UserId == user && x.Amount == 5));
    }

    [HistorySqlFact]
    public async Task DatabaseConstraints_RejectCounterCorruptionDuplicateLedgerAndOrphanItem()
    {
        await using var db = await GenerationHistorySqlFixture.OpenAsync();
        await db.Database.MigrateAsync();
        var (user, job, items) = await GenerationCreditReservationTests.SeedAsync(db, 1, 1);
        await GenerationHistorySqlFixture.WriteAsync(db, async () =>
        {
            await new CreditReservationService(db).ReserveSubmissionAsync(user, job, [items[0].Id], default);
            await db.SaveChangesAsync(); return 0;
        });
        var check = await Assert.ThrowsAsync<SqlException>(() => db.Database.ExecuteSqlInterpolatedAsync($"UPDATE CreditReservations SET OutstandingAmount=2 WHERE JobId={job}"));
        Assert.Equal(547, check.Number);
        var orphan = await Assert.ThrowsAsync<SqlException>(() => db.Database.ExecuteSqlInterpolatedAsync($"UPDATE SubmissionJobItems SET ResponseId={Guid.NewGuid()} WHERE Id={items[0].Id}"));
        Assert.Equal(547, orphan.Number);
        var service = new SubmissionSettlementService(db, new CreditService(db));
        await service.MarkPossibleDispatchAsync(items[0].Id, default);
        await service.SettleAttemptAsync(items[0].Id, GenerationCreditReservationTests.Outcome(SubmissionOutcomeKind.ConfirmedSuccess), default);
        var duplicate = await Assert.ThrowsAsync<SqlException>(() => db.Database.ExecuteSqlInterpolatedAsync($"INSERT CreditTransactions (Id,UserId,Amount,BalanceAfter,Type,Description,ReferenceType,ReferenceId,CreatedAt) VALUES ({Guid.NewGuid()},{user},-1,0,'CreditUsed','duplicate','SubmissionJobItem',{items[0].Id},SYSUTCDATETIME())"));
        Assert.Contains(duplicate.Number, new[] { 2601, 2627 });
        Assert.Equal(1, await db.CreditTransactions.CountAsync(x => x.UserId == user));
    }

    [HistorySqlFact]
    public async Task NullableV2Fields_CannotBypassMandatorySchemaChecks()
    {
        await using var db = await GenerationHistorySqlFixture.OpenAsync();
        await db.Database.MigrateAsync();
        var (_, job, _) = await GenerationCreditReservationTests.SeedAsync(db, 1, 1);
        await db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync();
            try
            {
                var failure = await Assert.ThrowsAsync<SqlException>(() => db.Database.ExecuteSqlInterpolatedAsync($"UPDATE SubmissionJobs SET CommandId=NULL WHERE Id={job}"));
                Assert.Equal(547, failure.Number);
            }
            finally { await transaction.RollbackAsync(); }
        });
    }

    [HistorySqlFact]
    public async Task MissingAccount_ConcurrentTopupsCreateOneAccountWithoutLosingCredit()
    {
        await using var seed = await GenerationHistorySqlFixture.OpenAsync();
        await seed.Database.MigrateAsync();
        var user = Guid.NewGuid();
        seed.Users.Add(new User { Id = user, Email = $"{user}@fixture.invalid" });
        await seed.SaveChangesAsync();
        async Task AddAsync()
        {
            await using var db = await GenerationHistorySqlFixture.OpenAsync();
            await GenerationHistorySqlFixture.WriteAsync(db, async () =>
            {
                await new CreditService(db).AddTopupCreditsAsync(new TopupOrder { Id = Guid.NewGuid(), UserId = user, Credits = 5 }, "Synthetic account creation", default);
                await db.SaveChangesAsync(); return 0;
            });
        }
        await Task.WhenAll(AddAsync(), AddAsync());
        await using var read = await GenerationHistorySqlFixture.OpenAsync();
        var account = Assert.Single(await read.UserCreditAccounts.Where(x => x.UserId == user).ToListAsync());
        Assert.Equal(10, account.Balance); Assert.Equal(10, account.TotalDeposited); Assert.Equal(0, account.TotalUsed);
        Assert.Equal(2, await read.CreditTransactions.CountAsync(x => x.UserId == user && x.Amount == 5));
    }

    private sealed class BeforeSaveFailure : SaveChangesInterceptor
    {
        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData data, InterceptionResult<int> result, CancellationToken ct = default)
            => throw new IOException("Synthetic pre-save failure.");
    }
    private sealed class LostCommitAcknowledgement : DbTransactionInterceptor
    {
        public override Task TransactionCommittedAsync(DbTransaction transaction, TransactionEndEventData data, CancellationToken ct = default)
            => throw new IOException("Synthetic lost commit acknowledgement.");
    }
}
