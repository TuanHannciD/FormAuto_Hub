using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Tests;

public sealed class GenerationCreditReservationTests
{
    [Fact]
    public async Task ReserveThenSuccessRejectUnknownAndReplay_PreservePostedBalanceAndExactlyOneDebit()
    {
        await using var db = CreateContext();
        var (user, job, items) = await SeedAsync(db, 10m, 7);
        var reservations = new CreditReservationService(db);
        await reservations.ReserveSubmissionAsync(user, job, items.Select(x => x.Id).ToArray(), default);
        await db.SaveChangesAsync();
        Assert.Equal(new CreditAvailabilityResponse(10, 7, 3), await reservations.GetCreditAvailabilityAsync(user, default));
        Assert.Empty(db.CreditTransactions);
        Assert.Equal(0, (await db.UserCreditAccounts.SingleAsync()).TotalUsed);
        var service = new SubmissionSettlementService(db, new CreditService(db));
        Assert.True(await service.MarkPossibleDispatchAsync(items[0].Id, default));
        Assert.False(await service.MarkPossibleDispatchAsync(items[0].Id, default));
        var success = Outcome(SubmissionOutcomeKind.ConfirmedSuccess);
        await service.SettleAttemptAsync(items[0].Id, success, default);
        Assert.Equal(new CreditAvailabilityResponse(9, 6, 3), await reservations.GetCreditAvailabilityAsync(user, default));
        await service.MarkPossibleDispatchAsync(items[1].Id, default);
        await service.SettleAttemptAsync(items[1].Id, Outcome(SubmissionOutcomeKind.ConfirmedRejected), default);
        Assert.Equal(new CreditAvailabilityResponse(9, 5, 4), await reservations.GetCreditAvailabilityAsync(user, default));
        await service.MarkPossibleDispatchAsync(items[2].Id, default);
        await service.SettleAttemptAsync(items[2].Id, Outcome(SubmissionOutcomeKind.Unknown), default);
        await service.SettleAttemptAsync(items[0].Id, success, default);
        Assert.Equal(new CreditAvailabilityResponse(9, 5, 4), await reservations.GetCreditAvailabilityAsync(user, default));
        Assert.Single(db.CreditTransactions);
        Assert.Single(db.UsageLogs.Where(x => x.SubmissionItemId == items[0].Id));
        Assert.Equal(1, (await db.UserCreditAccounts.SingleAsync()).TotalUsed);
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.SettleAttemptAsync(items[0].Id,
            Outcome(SubmissionOutcomeKind.ConfirmedRejected), default));
    }

    [Theory]
    [InlineData(0, 0)]
    [InlineData(0.75, 0)]
    [InlineData(4.75, 3)]
    public async Task Deduction_CannotSpendHeldFunds(decimal balance, int held)
    {
        await using var db = CreateContext();
        var (user, job, items) = await SeedAsync(db, balance, held);
        if (held > 0)
        {
            await new CreditReservationService(db).ReserveSubmissionAsync(user, job, items.Select(x => x.Id).ToArray(), default);
            await db.SaveChangesAsync();
        }
        var result = await new CreditService(db).DeductUsageCreditsAsync(user, 2, "generation", "AiGenerationRun", Guid.NewGuid(), default);
        Assert.Null(result);
        Assert.Empty(db.CreditTransactions);
    }

    [Fact]
    public async Task MissingAccount_HasZeroAvailableAndCannotReserve()
    {
        await using var db = CreateContext();
        var (user, job, items) = await SeedAsync(db, 0, 1);
        db.UserCreditAccounts.RemoveRange(db.UserCreditAccounts);
        await db.SaveChangesAsync();
        var service = new CreditReservationService(db);
        Assert.Equal(new CreditAvailabilityResponse(0, 0, 0), await service.GetCreditAvailabilityAsync(user, default));
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.ReserveSubmissionAsync(user, job, items.Select(x => x.Id).ToArray(), default));
    }

    internal static FormAutoHubDbContext CreateContext() => new(new DbContextOptionsBuilder<FormAutoHubDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    [Fact]
    public async Task Settlement_ConsumesOwnHoldEvenWhenAvailableIsZero_AndUpdatesProjections()
    {
        await using var db = CreateContext();
        var (user, job, items) = await SeedAsync(db, 1, 1);
        await new CreditReservationService(db).ReserveSubmissionAsync(user, job, [items[0].Id], default);
        await db.SaveChangesAsync();
        var service = new SubmissionSettlementService(db, new CreditService(db));
        await service.MarkPossibleDispatchAsync(items[0].Id, default);
        await service.SettleAttemptAsync(items[0].Id, Outcome(SubmissionOutcomeKind.ConfirmedSuccess), default);
        Assert.Equal(new CreditAvailabilityResponse(0, 0, 0), await new CreditReservationService(db).GetCreditAvailabilityAsync(user, default));
        Assert.Equal(1, (await db.SubmissionJobs.SingleAsync()).SuccessCount);
        Assert.Equal(0, (await db.SubmissionJobs.SingleAsync()).HeldCount);
        Assert.Single(db.SubmissionLogs.Where(x => x.ItemId == items[0].Id && x.Status == "Success"));
    }

    [Fact]
    public async Task EvidenceReplay_ChangedFactsAndPredispatchOutcomesAreRejected()
    {
        await using var db = CreateContext();
        var (user, job, items) = await SeedAsync(db, 2, 1);
        await new CreditReservationService(db).ReserveSubmissionAsync(user, job, [items[0].Id], default);
        await db.SaveChangesAsync();
        var service = new SubmissionSettlementService(db, new CreditService(db));
        var outcome = Outcome(SubmissionOutcomeKind.ConfirmedSuccess);
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.SettleAttemptAsync(items[0].Id, outcome, default));
        await service.MarkPossibleDispatchAsync(items[0].Id, default);
        await service.SettleAttemptAsync(items[0].Id, outcome, default);
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.SettleAttemptAsync(items[0].Id,
            outcome with { Evidence = outcome.Evidence with { ArtifactReference = "fixture:changed" } }, default));
    }

    [Fact]
    public async Task RunnerAcknowledgement_ReleasesOnlyUnattempted_UnknownKeepsHold()
    {
        await using var db = CreateContext();
        var (user, job, items) = await SeedAsync(db, 3, 3);
        var reservations = new CreditReservationService(db);
        await reservations.ReserveSubmissionAsync(user, job, items.Select(x => x.Id).ToArray(), default);
        await db.SaveChangesAsync();
        var service = new SubmissionSettlementService(db, new CreditService(db));
        await service.MarkPossibleDispatchAsync(items[0].Id, default);
        await service.SettleAttemptAsync(items[0].Id, Outcome(SubmissionOutcomeKind.Unknown), default);
        await Assert.ThrowsAsync<InvalidOperationException>(() => reservations.ReleaseUnattemptedAsync(job, default));
        (await db.SubmissionJobs.SingleAsync()).RunnerAcknowledgedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        await reservations.ReleaseUnattemptedAsync(job, default);
        await reservations.ReleaseUnattemptedAsync(job, default);
        Assert.Equal(new CreditAvailabilityResponse(3, 1, 2), await reservations.GetCreditAvailabilityAsync(user, default));
        Assert.Null((await db.CreditReservations.SingleAsync()).ClosedAt);
        Assert.Equal(2, await db.CreditReservationEvents.CountAsync(x => x.Kind == "Released"));
        Assert.Empty(db.CreditTransactions);
    }

    [Theory]
    [InlineData(SubmissionOutcomeKind.ConfirmedSuccess, "Consumed", "PrepaidConsumed")]
    [InlineData(SubmissionOutcomeKind.ConfirmedRejected, "Available", "PrepaidReleased")]
    [InlineData(SubmissionOutcomeKind.Unknown, "Claimed", "PrepaidHeld")]
    public async Task PrepaidFirstSuccess_ClaimsAndSettlesWithoutMoneyMovement(SubmissionOutcomeKind outcome, string entitlement, string settlement)
    {
        await using var db = CreateContext();
        var (user, job, items) = await SeedAsync(db, 0, 1, prepaid: true);
        var item = items[0];
        var response = await db.GeneratedResponses.SingleAsync();
        var reservations = new CreditReservationService(db);
        await reservations.ReserveSubmissionAsync(user, job, [item.Id], default);
        await db.SaveChangesAsync();
        Assert.Equal("Claimed", response.LegacyEntitlementState);
        var service = new SubmissionSettlementService(db, new CreditService(db));
        await service.MarkPossibleDispatchAsync(item.Id, default);
        var evidence = Outcome(outcome);
        await service.SettleAttemptAsync(item.Id, evidence, default);
        await service.SettleAttemptAsync(item.Id, evidence, default);
        Assert.Equal(entitlement, response.LegacyEntitlementState);
        Assert.Equal(settlement, (await db.SubmissionJobItems.SingleAsync()).SettlementState);
        Assert.Empty(db.CreditTransactions);
        Assert.Equal(0, (await db.UserCreditAccounts.SingleAsync()).TotalUsed);
        if (outcome == SubmissionOutcomeKind.Unknown) Assert.Null((await db.CreditReservations.SingleAsync()).ClosedAt);
        else Assert.NotNull((await db.CreditReservations.SingleAsync()).ClosedAt);
    }

    [Fact]
    public async Task PersistedAttemptSnapshotAndReservationEvidence_CannotBeRewritten()
    {
        await using var db = CreateContext();
        var (user, job, items) = await SeedAsync(db, 1, 1);
        await new CreditReservationService(db).ReserveSubmissionAsync(user, job, [items[0].Id], default);
        await db.SaveChangesAsync();
        items[0].PayloadJson = "rewritten";
        await Assert.ThrowsAsync<InvalidOperationException>(() => db.SaveChangesAsync());
        db.ChangeTracker.Clear();
        var change = await db.CreditReservationEvents.SingleAsync();
        change.Kind = "Released";
        await Assert.ThrowsAsync<InvalidOperationException>(() => db.SaveChangesAsync());
    }

    internal static VerifiedSubmissionOutcome Outcome(SubmissionOutcomeKind kind) => new(kind,
        new(Guid.NewGuid(), "SyntheticFixture", "test-v1", "fixture:synthetic", new string('a', 64), DateTimeOffset.UtcNow, null, null));

    internal static async Task<(Guid User, Guid Job, List<SubmissionJobItem> Items)> SeedAsync(FormAutoHubDbContext db, decimal balance, int count, bool prepaid = false)
    {
        var user = Guid.NewGuid(); var project = Guid.NewGuid(); var job = Guid.NewGuid();
        db.Users.Add(new User { Id = user, Email = $"{user}@fixture.invalid" });
        db.FormProjects.Add(new FormProject { Id = project, UserId = user });
        db.UserCreditAccounts.Add(new UserCreditAccount { Id = Guid.NewGuid(), UserId = user, Balance = balance });
        db.SubmissionJobs.Add(new SubmissionJob { Id = job, ProjectId = project, UserId = user,
            CommandId = job, ContractVersion = 2, RouteKind = "selected", RequestFingerprint = new string('a', 64),
            PricingPolicy = "SeparatedV1", Status = "Running", Total = count, UnknownCount = 0, NotDispatchedCount = 0, HeldCount = count });
        var items = new List<SubmissionJobItem>();
        for (var n = 0; n < count; n++)
        {
            var response = new GeneratedResponse { Id = Guid.NewGuid(), ProjectId = project, PricingPolicy = prepaid ? "LegacyBundledV1" : null,
                LegacyEntitlementState = prepaid ? "Available" : null };
            db.GeneratedResponses.Add(response);
            items.Add(new SubmissionJobItem { Id = Guid.NewGuid(), JobId = job, ProjectId = project,
                ResponseId = response.Id, Ordinal = n, MaximumSendCredits = prepaid ? 0 : 1, PricingPolicy = prepaid ? "LegacyBundledV1" : "SeparatedV1",
                PayloadSha256 = new string('a',64), ObservedMetadataSha256 = new string('a',64),
                CompatibilityEvidenceSha256 = new string('a',64), AttemptState = "Planned", SettlementState = prepaid ? "PrepaidHeld" : "Held" });
        }
        db.SubmissionJobItems.AddRange(items);
        await db.SaveChangesAsync();
        return (user, job, items);
    }
}
