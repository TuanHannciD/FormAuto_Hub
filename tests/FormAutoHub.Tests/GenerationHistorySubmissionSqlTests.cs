using System.Data.Common;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace FormAutoHub.Tests;

[Collection("Generation history SQL")]
public sealed class GenerationHistorySubmissionSqlTests(Xunit.Abstractions.ITestOutputHelper output)
{
    [HistorySubmissionSqlTheory]
    [InlineData(false, "query-fault")]
    [InlineData(false, "query-cancel")]
    [InlineData(false, "after-ack-cancel")]
    [InlineData(true, "query-fault")]
    [InlineData(true, "query-cancel")]
    [InlineData(true, "after-ack-cancel")]
    public async Task AcknowledgedAdmissionInitialRunnerReadFaultOrCancellationReleasesOnlyUnattemptedForSelectedAndDirect(bool direct, string failure)
    {
            await using var seed = await GenerationHistorySqlFixture.OpenAsync();
            var f = await SubmissionV2Fixture.SeedAsync(seed, 2, 2);
            var command = Guid.NewGuid(); using var cancellation = new CancellationTokenSource();
            var fault = new InitialRunnerLoadFault(command, failure, cancellation);
            await using var db = await GenerationHistorySqlFixture.OpenAsync(fault);
            var receiver = new SubmissionV2Fixture.Receiver(); var service = SubmissionV2Fixture.Service(db, f.User, receiver);
            var request = new SendSubmissionRequest(2, command, f.Batch, f.Ids, true, false);
            Task<SubmissionJobResponse?> SendAsync() => direct
                ? new DirectRuleSubmissionService(db, new SubmissionV2Fixture.UserContext(f.User), new CreditService(db), service)
                    .SendAsync(f.Project, new(2, command, 2), cancellation.Token)
                : service.SendAsync(f.Project, request, cancellation.Token);
            if (failure == "query-fault") await Assert.ThrowsAsync<IOException>(SendAsync);
            else await Assert.ThrowsAnyAsync<OperationCanceledException>(SendAsync);
            Assert.True(fault.Triggered, $"direct={direct}; failure={failure}");
            Assert.Equal(0, receiver.Calls);
            await using var read = await GenerationHistorySqlFixture.OpenAsync();
            var job = await read.SubmissionJobs.AsNoTracking().SingleAsync(x => x.Id == command);
            var items = await read.SubmissionJobItems.AsNoTracking().Where(x => x.JobId == command).ToListAsync();
            var reservation = await read.CreditReservations.AsNoTracking().SingleAsync(x => x.JobId == command);
            Assert.Equal("Failed", job.Status); Assert.NotNull(job.RunnerAcknowledgedAt); Assert.NotNull(job.FinishedAt);
            Assert.Equal(2, job.NotDispatchedCount); Assert.Equal(0, job.HeldCount); Assert.Equal(0, job.UnknownCount);
            Assert.Equal(2, items.Count); Assert.All(items, item => { Assert.Equal("NotDispatched", item.AttemptState); Assert.Equal("Released", item.SettlementState); Assert.Null(item.PossibleDispatchAt); });
            Assert.Equal(0, reservation.OutstandingAmount); Assert.Equal(2, reservation.ReleasedAmount); Assert.NotNull(reservation.ClosedAt);
            Assert.Equal(2, (await read.UserCreditAccounts.AsNoTracking().SingleAsync(x => x.UserId == f.User)).Balance);
            Assert.Empty(await read.CreditTransactions.Where(x => x.UserId == f.User).ToListAsync());
            Assert.Empty(await read.SubmissionLogs.Where(x => x.JobId == command).ToListAsync());
            Assert.Equal(2, await read.CreditReservationEvents.CountAsync(x => x.ReservationId == reservation.Id && x.Kind == "Released"));
            Assert.False(job.Status is "Pending" or "Running" or "Paused" || job.RunnerAcknowledgedAt is null || items.Any(x => x.AttemptState is "PossibleDispatch" or "Unknown" || x.SettlementState is "Held" or "PrepaidHeld"));
            await ReportAsync(read, command);
            // Durable replay observes the result and never creates a new runner after request failure.
            var replayService = SubmissionV2Fixture.Service(read, f.User, receiver);
            var replay = direct
                ? await new DirectRuleSubmissionService(read, new SubmissionV2Fixture.UserContext(f.User), new CreditService(read), replayService).SendAsync(f.Project, new(2, command, 2), default)
                : await replayService.SendAsync(f.Project, request, default);
            Assert.Equal(command, replay!.Id); Assert.Equal(0, receiver.Calls); Assert.Equal(0, replay.Fees!.HeldCredits);
    }

    [HistorySqlFact]
    public async Task DirectRulesBatchAndSendHoldCommitAtomicallyOrRollbackTogether()
    {
        await using var seed = await GenerationHistorySqlFixture.OpenAsync(); var f = await SubmissionV2Fixture.SeedAsync(seed, 1, 2.5m);
        var receiver = new SubmissionV2Fixture.Receiver(); var command = Guid.NewGuid();
        await using (var failed = await GenerationHistorySqlFixture.OpenAsync(new Fault("admission-save")))
        {
            var actor = new SubmissionV2Fixture.UserContext(f.User);
            await Assert.ThrowsAsync<IOException>(() => new DirectRuleSubmissionService(failed, actor, new CreditService(failed), SubmissionV2Fixture.Service(failed, f.User, receiver))
                .SendAsync(f.Project, new(2, command, 5), default));
        }
        await using var read = await GenerationHistorySqlFixture.OpenAsync();
        Assert.Equal(1, await read.GenerationBatches.CountAsync(x => x.UserId == f.User)); Assert.False(await read.SubmissionJobs.AnyAsync(x => x.Id == command));
        Assert.Empty(await read.CreditTransactions.Where(x => x.UserId == f.User).ToListAsync()); Assert.Equal(0, receiver.Calls);
        var result = await new DirectRuleSubmissionService(read, new SubmissionV2Fixture.UserContext(f.User), new CreditService(read), SubmissionV2Fixture.Service(read, f.User, receiver))
            .SendAsync(f.Project, new(2, command, 5), default);
        Assert.Equal(2, result!.Total); Assert.Equal(.5m, result.Fees!.Credits.Balance); Assert.Equal(2, receiver.Calls);
        var batch = await read.GenerationBatches.SingleAsync(x => x.Id == result.BatchId); Assert.Equal(5, batch.RequestedCount); Assert.Equal(2, batch.GeneratedCount); Assert.Equal(0, batch.GenerationCredits);
        Assert.Equal(2, await read.CreditTransactions.CountAsync(x => x.UserId == f.User && x.ReferenceType == nameof(SubmissionJobItem)));
    }

    [HistorySqlFact]
    public async Task LegacyPrepaidSqlSuccessRejectUnknownAndReplayNeverDoubleChargeOrReopenConsumed()
    {
        foreach (var kind in new[] { SubmissionOutcomeKind.ConfirmedSuccess, SubmissionOutcomeKind.ConfirmedRejected, SubmissionOutcomeKind.Unknown })
        {
            await using var db = await GenerationHistorySqlFixture.OpenAsync(); var f = await SubmissionV2Tests.LegacyAsync(db);
            var receiver = new SubmissionV2Fixture.Receiver { Outcome = _ => Task.FromResult(kind) }; var service = SubmissionV2Fixture.Service(db, f.User, receiver);
            var request = new SendSubmissionRequest(2, Guid.NewGuid(), null, [f.Response], true, true);
            var result = await service.SendAsync(f.Project, request, default); await service.SendAsync(f.Project, request, default);
            Assert.Equal(1, receiver.Calls); Assert.Equal(0, result!.Fees!.SettledCredits);
            await using var read = await GenerationHistorySqlFixture.OpenAsync();
            var response = await read.GeneratedResponses.SingleAsync(x => x.Id == f.Response);
            Assert.Equal(kind == SubmissionOutcomeKind.ConfirmedSuccess ? "Consumed" : kind == SubmissionOutcomeKind.ConfirmedRejected ? "Available" : "Claimed", response.LegacyEntitlementState);
            Assert.Empty(await read.CreditTransactions.Where(x => x.UserId == f.User).ToListAsync());
            if (kind == SubmissionOutcomeKind.ConfirmedSuccess)
            {
                await service.SendAsync(f.Project, request with { CommandId = Guid.NewGuid() }, default);
                Assert.Equal(2, receiver.Calls); Assert.Equal(1, await read.CreditTransactions.CountAsync(x => x.UserId == f.User));
            }
            await ReportAsync(read, result.Id);
        }
    }

    [HistorySqlFact]
    public async Task TwoProjectsShareAvailableWithoutSpendingTheFirstJobsOwnHold()
    {
        await using var seed = await GenerationHistorySqlFixture.OpenAsync(); var first = await SubmissionV2Fixture.SeedAsync(seed, 1, 1);
        var second = await SubmissionV2Fixture.SeedAsync(seed, 1, owner: first.User);
        var entered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously); var release = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var receiver = new SubmissionV2Fixture.Receiver { Outcome = async _ => { entered.SetResult(); await release.Task.WaitAsync(TimeSpan.FromSeconds(20)); return SubmissionOutcomeKind.ConfirmedSuccess; } };
        await using var db = await GenerationHistorySqlFixture.OpenAsync();
        var running = SubmissionV2Fixture.Service(db, first.User, receiver).SendAsync(first.Project, new(2, Guid.NewGuid(), first.Batch, first.Ids, true, false), default);
        try
        {
            await entered.Task.WaitAsync(TimeSpan.FromSeconds(20));
            await using var contender = await GenerationHistorySqlFixture.OpenAsync();
            var rejected = await Assert.ThrowsAsync<SubmissionContractException>(() => SubmissionV2Fixture.Service(contender, first.User, receiver)
                .SendAsync(second.Project, new(2, Guid.NewGuid(), second.Batch, second.Ids, true, false), default));
            Assert.Equal("InsufficientAvailableCredit", rejected.Code); Assert.Equal(1, receiver.Calls);
            await using var read = await GenerationHistorySqlFixture.OpenAsync();
            Assert.Equal(1, await read.SubmissionJobs.CountAsync(x => x.UserId == first.User)); Assert.Empty(await read.SubmissionJobs.Where(x => x.ProjectId == second.Project).ToListAsync());
        }
        finally { release.TrySetResult(); }
        var finished = await running; Assert.Equal(0, finished!.Fees!.Credits.Balance); Assert.Equal(1, finished.SuccessCount);
    }

    [HistorySqlFact]
    public async Task InFlightCancelAndEvictionPreserveSnapshotsUntilRunnerAcknowledgementReleasesOnlyPlanned()
    {
        foreach (var cancel in new[] { false, true })
        {
            await using var seed = await GenerationHistorySqlFixture.OpenAsync(); var f = await SubmissionV2Fixture.SeedAsync(seed, 11, 11);
            var command = Guid.NewGuid();
            var receiver = new SubmissionV2Fixture.Receiver { Outcome = async n =>
            {
                if (n == 1)
                {
                    await using var control = await GenerationHistorySqlFixture.OpenAsync();
                    var service = SubmissionV2Fixture.Service(control, f.User, new());
                    await service.PauseAsync(f.Project, command, default);
                    if (cancel) await service.CancelAsync(f.Project, command, default);
                    var pending = await service.GetJobAsync(f.Project, command, default);
                    Assert.Null(pending!.RunnerAcknowledgedAt); Assert.Null(pending.FinishedAt); Assert.Equal(11, pending.Fees!.HeldCredits);
                    for (var i = 0; i < 20; i++)
                        await new ResponseGenerationService(control, new SubmissionV2Fixture.UserContext(f.User), new CreditService(control)).GenerateAsync(f.Project, new(1), default);
                    Assert.NotNull((await control.GenerationBatches.AsNoTracking().SingleAsync(x => x.Id == f.Batch)).EvictedAt);
                }
                return SubmissionOutcomeKind.ConfirmedSuccess;
            } };
            await using var db = await GenerationHistorySqlFixture.OpenAsync();
            var request = new SendSubmissionRequest(2, command, f.Batch, f.Ids, true, false);
            var result = await SubmissionV2Fixture.Service(db, f.User, receiver).SendAsync(f.Project, request, default);
            Assert.Equal(10, receiver.Calls); Assert.Equal(10, result!.SuccessCount); Assert.Equal(1, result.NotDispatchedCount); Assert.Equal(0, result.HeldCount);
            Assert.Equal(cancel ? "Cancelled" : "Paused", result.Status); Assert.NotNull(result.RunnerAcknowledgedAt); Assert.Equal(!cancel, result.FinishedAt == null);
            Assert.Equal(1, result.Fees!.Credits.Balance); Assert.Equal(0, result.Fees.HeldCredits); Assert.Equal(1, result.Fees.ReleasedCredits);
            await using var read = await GenerationHistorySqlFixture.OpenAsync();
            var snapshots = await read.SubmissionJobItems.Where(x => x.JobId == command).OrderBy(x => x.Ordinal).ToListAsync();
            Assert.Equal(11, snapshots.Count); Assert.All(snapshots, x => Assert.False(string.IsNullOrWhiteSpace(x.PayloadJson)));
            Assert.Equal(10, await read.CreditTransactions.CountAsync(x => x.UserId == f.User));
            if (!cancel)
            {
                await ReportAsync(read, command);
                await SubmissionV2Fixture.Service(read, f.User, receiver).CancelAsync(f.Project, command, default);
                Assert.NotNull((await read.SubmissionJobs.AsNoTracking().SingleAsync(x => x.Id == command)).FinishedAt);
            }
            await ReportAsync(read, command);
        }
    }

    [HistorySqlFact]
    public async Task TenSevenTwoOne_DurableLedgerReceiverCountsAndReadOnlyReplay()
    {
        await using var db = await GenerationHistorySqlFixture.OpenAsync(); var f = await SubmissionV2Fixture.SeedAsync(db);
        var receiver = new SubmissionV2Fixture.Receiver { Outcome = n => Task.FromResult(n <= 7 ? SubmissionOutcomeKind.ConfirmedSuccess : n <= 9 ? SubmissionOutcomeKind.ConfirmedRejected : SubmissionOutcomeKind.Unknown) };
        var service = SubmissionV2Fixture.Service(db, f.User, receiver); var command = Guid.NewGuid();
        var request = new SendSubmissionRequest(2, command, f.Batch, f.Ids, true, false);
        var result = await service.SendAsync(f.Project, request, default);
        await service.SendAsync(f.Project, request, default);
        await using var read = await GenerationHistorySqlFixture.OpenAsync();
        Assert.Equal(10, receiver.Calls); Assert.Equal(7, await read.CreditTransactions.CountAsync(x => x.UserId == f.User));
        Assert.Equal(7, await read.UsageLogs.CountAsync(x => x.UserId == f.User && x.SubmissionItemId != null));
        Assert.Equal(10, await read.SubmissionLogs.CountAsync(x => x.JobId == command));
        var hold = await read.CreditReservations.SingleAsync(x => x.JobId == command);
        Assert.Equal(1, hold.OutstandingAmount); Assert.Equal(7, hold.SettledAmount); Assert.Equal(2, hold.ReleasedAmount);
        Assert.Equal(30, await read.CreditReservationEvents.CountAsync(x => x.ReservationId == hold.Id));
        Assert.Equal(3, (await read.UserCreditAccounts.SingleAsync(x => x.UserId == f.User)).Balance);
        Assert.Equal("Failed", result!.Status); Assert.NotNull(result.RunnerAcknowledgedAt); Assert.NotNull(result.FinishedAt);
        await ReportAsync(read, command);
    }

    [HistorySqlFact]
    public async Task SameCommandDuringProvider_ReadsHoldWithoutRunnerTakeover_DifferentCommandIsFenced()
    {
        await using var seed = await GenerationHistorySqlFixture.OpenAsync(); var f = await SubmissionV2Fixture.SeedAsync(seed, 1, 1);
        var entered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously); var release = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var receiver = new SubmissionV2Fixture.Receiver { Outcome = async _ => { entered.SetResult(); await release.Task.WaitAsync(TimeSpan.FromSeconds(20)); return SubmissionOutcomeKind.ConfirmedSuccess; } };
        await using var first = await GenerationHistorySqlFixture.OpenAsync(); await using var second = await GenerationHistorySqlFixture.OpenAsync();
        var request = new SendSubmissionRequest(2, Guid.NewGuid(), f.Batch, f.Ids, true, false);
        var run = SubmissionV2Fixture.Service(first, f.User, receiver).SendAsync(f.Project, request, default);
        try
        {
            await entered.Task.WaitAsync(TimeSpan.FromSeconds(20));
            var service = SubmissionV2Fixture.Service(second, f.User, receiver);
            var replay = await service.SendAsync(f.Project, request, default);
            Assert.Equal(1, replay!.HeldCount); Assert.Null(replay.RunnerAcknowledgedAt); Assert.Equal(1, receiver.Calls);
            var conflict = await Assert.ThrowsAsync<SubmissionContractException>(() => service.SendAsync(f.Project, request with { CommandId = Guid.NewGuid() }, default));
            Assert.Equal("ActiveSubmissionJob", conflict.Code);
        }
        finally { release.TrySetResult(); }
        await run;
        await using var read = await GenerationHistorySqlFixture.OpenAsync();
        Assert.Equal(1, await read.CreditTransactions.CountAsync(x => x.UserId == f.User)); Assert.Equal(1, receiver.Calls);
    }

    [HistorySqlFact]
    public async Task FaultsBeforeDispatchAfterReceiverAndCommitAcknowledgementNeverReplayProvider()
    {
        foreach (var phase in new[] { "admission-ack", "precall-save", "precall-ack", "outcome-save", "outcome-ack" })
        {
            await using var seed = await GenerationHistorySqlFixture.OpenAsync(); var f = await SubmissionV2Fixture.SeedAsync(seed, 1, 1);
            var fault = new Fault(phase); await using var db = await GenerationHistorySqlFixture.OpenAsync(fault);
            var receiver = new SubmissionV2Fixture.Receiver(); var service = SubmissionV2Fixture.Service(db, f.User, receiver);
            var request = new SendSubmissionRequest(2, Guid.NewGuid(), f.Batch, f.Ids, true, false);
            try { await service.SendAsync(f.Project, request, default); }
            catch (IOException) when (phase is "precall-save" or "precall-ack" or "outcome-save") { }
            Assert.True(fault.Triggered, phase);
            await using var read = await GenerationHistorySqlFixture.OpenAsync();
            var job = await read.SubmissionJobs.SingleAsync(x => x.Id == request.CommandId);
            var item = await read.SubmissionJobItems.SingleAsync(x => x.JobId == job.Id);
            var reservation = await read.CreditReservations.SingleAsync(x => x.JobId == job.Id);
            Assert.Equal(phase.StartsWith("outcome") ? 1 : 0, receiver.Calls);
            Assert.Equal(phase == "outcome-ack" ? 1 : 0, await read.CreditTransactions.CountAsync(x => x.UserId == f.User));
            Assert.Equal(phase is "precall-save" or "outcome-ack" ? 0 : 1, reservation.OutstandingAmount);
            if (phase is "precall-ack" or "outcome-save") Assert.Equal("PossibleDispatch", item.AttemptState);
            if (phase == "admission-ack") { Assert.Null(job.RunnerAcknowledgedAt); Assert.Equal("Planned", item.AttemptState); }
            await ReportAsync(read, job.Id);
            await SubmissionV2Fixture.Service(read, f.User, receiver).SendAsync(f.Project, request, default);
            Assert.Equal(phase.StartsWith("outcome") ? 1 : 0, receiver.Calls);
        }
    }

    private async Task ReportAsync(FormAutoHubDbContext read, Guid jobId)
    {
        var job = await read.SubmissionJobs.AsNoTracking().SingleAsync(x => x.Id == jobId);
        var unresolved = await read.SubmissionJobItems.AnyAsync(x => x.JobId == jobId && (x.AttemptState == "PossibleDispatch" || x.AttemptState == "Unknown" || x.SettlementState == "Held" || x.SettlementState == "PrepaidHeld"));
        var active = job.Status is "Pending" or "Running" or "Paused" || job.RunnerAcknowledgedAt is null || unresolved;
        output.WriteLine(System.Text.Json.JsonSerializer.Serialize(new { job.Id, job.Status, job.RunnerAcknowledgedAt, job.FinishedAt, job.SuccessCount, job.FailedCount, job.UnknownCount, job.NotDispatchedCount, job.HeldCount, ActiveProject = active }));
    }

    private sealed class Fault(string phase) : SaveChangesInterceptor, IDbTransactionInterceptor
    {
        public bool Triggered { get; private set; }
        private string? committing;
        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData data, InterceptionResult<int> result, CancellationToken ct = default)
        {
            var db = data.Context!;
            var events = db.ChangeTracker.Entries<CreditReservationEvent>().Where(x => x.State == EntityState.Added).Select(x => x.Entity.Kind).ToArray();
            if (events.Contains("Settled")) committing = "outcome";
            else if (events.Contains("PossibleDispatch")) committing = "precall";
            else if (events.Contains("Reserved")) committing = "admission";
            if (!Triggered && phase == committing + "-save") { Triggered = true; throw new IOException("Synthetic " + phase); }
            return ValueTask.FromResult(result);
        }
        public Task TransactionCommittedAsync(DbTransaction transaction, TransactionEndEventData data, CancellationToken ct = default)
        {
            if (!Triggered && phase == committing + "-ack") { Triggered = true; throw new IOException("Synthetic " + phase); }
            committing = null;
            return Task.CompletedTask;
        }
    }

    private sealed class InitialRunnerLoadFault(Guid commandId, string failure, CancellationTokenSource cancellation) : DbCommandInterceptor, IDbTransactionInterceptor
    {
        private bool armed;
        public bool Triggered { get; private set; }
        public Task TransactionCommittedAsync(DbTransaction transaction, TransactionEndEventData data, CancellationToken ct = default)
        {
            if (!Triggered && data.Context!.Set<CreditReservation>().Local.Any(x => x.JobId == commandId))
            {
                armed = true;
                if (failure == "after-ack-cancel") { Triggered = true; cancellation.Cancel(); }
            }
            return Task.CompletedTask;
        }
        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(DbCommand command, CommandEventData data, InterceptionResult<DbDataReader> result, CancellationToken ct = default)
        {
            if (armed && !Triggered && command.CommandText.Contains("FROM [SubmissionJobItems]", StringComparison.Ordinal) &&
                command.CommandText.Contains("ORDER BY", StringComparison.Ordinal) && !command.CommandText.Contains("UPDLOCK", StringComparison.Ordinal))
            {
                Triggered = true;
                if (failure == "query-cancel") { cancellation.Cancel(); throw new OperationCanceledException(cancellation.Token); }
                throw new IOException("Synthetic initial runner item-load query failure after acknowledged admission.");
            }
            return ValueTask.FromResult(result);
        }
    }
}

public sealed class HistorySubmissionSqlTheoryAttribute : TheoryAttribute
{
    public HistorySubmissionSqlTheoryAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("FAH_HISTORY_SQL_SERVER")))
            Skip = "Opt in with FAH_HISTORY_SQL_SERVER and exact owned FAH_HISTORY_SQL_DATABASE.";
    }
}
