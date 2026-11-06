using System.Text.Json;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Tests;

// Controlled synthetic integration only. No production provider or operational mutation endpoint.
[Collection("Generation history SQL")]
public sealed class HistoryCutoverRehearsalSqlTests(Xunit.Abstractions.ITestOutputHelper output)
{
    [HistorySqlFact]
    public async Task SyntheticUnknownReconciliationPreservesAcknowledgedDrainAndIdempotentActorEvidence()
    {
        foreach (var kind in new[] { SubmissionOutcomeKind.ConfirmedSuccess, SubmissionOutcomeKind.ConfirmedRejected, SubmissionOutcomeKind.Unknown })
        {
            await using var seed = await GenerationHistorySqlFixture.OpenAsync();
            var f = await SubmissionV2Fixture.SeedAsync(seed, 1, 2);
            var actor = Guid.NewGuid();
            seed.Users.Add(new User { Id = actor, Email = $"task6-reviewer-{actor:N}@example.invalid", Role = "Admin", FullName = "Synthetic evidence reviewer" });
            await seed.SaveChangesAsync();
            var receiver = new SubmissionV2Fixture.Receiver { Outcome = _ => Task.FromResult(SubmissionOutcomeKind.Unknown) };
            var command = Guid.NewGuid();
            var request = new SendSubmissionRequest(2, command, f.Batch, f.Ids, true, true);
            var job = await SubmissionV2Fixture.Service(seed, f.User, receiver).SendAsync(f.Project, request, default);
            Assert.Equal("Failed", job!.Status); Assert.NotNull(job.RunnerAcknowledgedAt); Assert.NotNull(job.FinishedAt);
            Assert.Equal(1, job.Fees!.HeldCredits); Assert.Equal(1, receiver.Calls);
            await using var read = await GenerationHistorySqlFixture.OpenAsync();
            var item = await read.SubmissionJobItems.AsNoTracking().SingleAsync(x => x.JobId == command);
            var snapshot = new { item.PayloadJson, item.PayloadSha256, item.ObservedMetadataJson, item.CompatibilityEvidenceJson };
            var before = await read.SubmissionJobs.AsNoTracking().SingleAsync(x => x.Id == command);
            Assert.True(await ActiveAsync(read, command));
            var evidence = new SubmissionEvidence(Guid.NewGuid(), "Task6SyntheticReviewed", "task6-synthetic-v1", $"test:task6:reconcile:{command:D}", new string('a', 64), DateTimeOffset.UtcNow, actor, "Synthetic reviewed evidence; not Google delivery proof.");
            var service = new SubmissionSettlementService(read, new CreditService(read));
            await Assert.ThrowsAsync<ArgumentException>(() => service.SettleAttemptAsync(item.Id, new(kind, evidence with { Reason = "" }), default));
            var outcome = new VerifiedSubmissionOutcome(kind, evidence);
            var result = await service.SettleAttemptAsync(item.Id, outcome, default);
            await service.SettleAttemptAsync(item.Id, outcome, default);
            await Assert.ThrowsAsync<InvalidOperationException>(() => service.SettleAttemptAsync(item.Id, outcome with { Evidence = evidence with { Reason = "Changed facts" } }, default));
            await using var independent = await GenerationHistorySqlFixture.OpenAsync();
            var after = await independent.SubmissionJobs.AsNoTracking().SingleAsync(x => x.Id == command);
            var stored = await independent.SubmissionJobItems.AsNoTracking().SingleAsync(x => x.Id == item.Id);
            Assert.Equal(before.RunnerAcknowledgedAt, after.RunnerAcknowledgedAt); Assert.Equal(before.FinishedAt, after.FinishedAt); Assert.Equal("Failed", after.Status);
            Assert.Equal(JsonSerializer.Serialize(snapshot), JsonSerializer.Serialize(new { stored.PayloadJson, stored.PayloadSha256, stored.ObservedMetadataJson, stored.CompatibilityEvidenceJson }));
            var audit = Assert.Single(await independent.CreditReservationEvents.Where(x => x.ItemId == item.Id && x.EvidenceId == evidence.EvidenceId).ToListAsync());
            Assert.Equal(actor, audit.ActorUserId); Assert.Equal(evidence.Reason, audit.Reason); Assert.Equal(evidence.ArtifactSha256, audit.ArtifactSha256);
            Assert.Equal(kind == SubmissionOutcomeKind.ConfirmedSuccess ? 1 : 0, await independent.CreditTransactions.CountAsync(x => x.UserId == f.User));
            Assert.Equal(kind == SubmissionOutcomeKind.Unknown, await ActiveAsync(independent, command));
            var replay = await SubmissionV2Fixture.Service(independent, f.User, receiver).SendAsync(f.Project, request, default);
            Assert.Equal(command, replay!.Id); Assert.Equal(1, receiver.Calls);
            output.WriteLine(JsonSerializer.Serialize(new { Provenance = "SYNTHETIC interfaces; no Google network", command, item.Id, kind, ReceiverCalls = receiver.Calls, after.Status, after.RunnerAcknowledgedAt, after.FinishedAt, Active = await ActiveAsync(independent, command), result.Credits, result.SettledCredits, EvidenceId = evidence.EvidenceId, Actor = actor }));
        }
    }

    [HistorySqlFact]
    public async Task LegacyNoHoldUnknownRemainsFencedWithoutInventedGroupingHoldOrLedgerRewrite()
    {
        await using var seed = await GenerationHistorySqlFixture.OpenAsync();
        var f = await SubmissionV2Tests.LegacyAsync(seed);
        var legacyJob = Guid.NewGuid(); var log = Guid.NewGuid();
        seed.SubmissionJobs.Add(new SubmissionJob { Id = legacyJob, UserId = f.User, ProjectId = f.Project, Total = 1, Status = "Failed", FinishedAt = DateTimeOffset.UtcNow });
        seed.SubmissionLogs.Add(new SubmissionLog { Id = log, JobId = legacyJob, ResponseId = f.Response, PayloadJson = "[]", Status = "Failed", ErrorMessage = "Synthetic ambiguous old result" });
        var ledger = new CreditTransaction { Id = Guid.NewGuid(), UserId = f.User, Amount = -1, BalanceAfter = 1, Type = "CreditUsed", ReferenceType = "GeneratedResponse", ReferenceId = f.Response, Description = "Synthetic historical bundled creation", CreatedAt = DateTimeOffset.UtcNow };
        seed.CreditTransactions.Add(ledger); await seed.SaveChangesAsync();
        var historical = JsonSerializer.Serialize(await seed.CreditTransactions.AsNoTracking().SingleAsync(x => x.Id == ledger.Id));
        var receiver = new SubmissionV2Fixture.Receiver();
        var ex = await Assert.ThrowsAsync<SubmissionContractException>(() => SubmissionV2Fixture.Service(seed, f.User, receiver).SendAsync(f.Project, new(2, Guid.NewGuid(), null, [f.Response], true, true), default));
        Assert.Equal("OutcomeUnresolved", ex.Code); Assert.Equal(0, receiver.Calls);
        await using var read = await GenerationHistorySqlFixture.OpenAsync();
        Assert.Equal(historical, JsonSerializer.Serialize(await read.CreditTransactions.AsNoTracking().SingleAsync(x => x.Id == ledger.Id)));
        Assert.False(await read.GenerationBatches.AnyAsync(x => x.UserId == f.User));
        Assert.False(await read.CreditReservations.AnyAsync(x => x.UserId == f.User));
        Assert.False(await read.SubmissionJobItems.AnyAsync(x => x.ResponseId == f.Response));
        var old = await read.SubmissionJobs.AsNoTracking().SingleAsync(x => x.Id == legacyJob);
        Assert.Null(old.RunnerAcknowledgedAt); Assert.NotNull(old.FinishedAt);
        output.WriteLine(JsonSerializer.Serialize(new { Provenance = "SYNTHETIC no-hold legacy", legacyJob, old.Status, old.RunnerAcknowledgedAt, old.FinishedAt, LegacyActive = old.Status is "Pending" or "Running" or "Paused" || old.Status == "Cancelled" && old.FinishedAt is null, ResponseFence = ex.Code, ReceiverCalls = 0, NewHolds = 0, GuessedGroups = 0, HistoricalLedgerUnchanged = true, LegacyReconciliation = "Blocked: existing service/tooling absent and Deferred" }));
    }

    private static async Task<bool> ActiveAsync(FormAutoHub.Api.Data.FormAutoHubDbContext db, Guid id)
    {
        var job = await db.SubmissionJobs.AsNoTracking().SingleAsync(x => x.Id == id);
        return job.Status is "Pending" or "Running" or "Paused" || job.RunnerAcknowledgedAt is null || await db.SubmissionJobItems.AnyAsync(x => x.JobId == id && (x.AttemptState == "PossibleDispatch" || x.AttemptState == "Unknown" || x.SettlementState == "Held" || x.SettlementState == "PrepaidHeld"));
    }
}
