using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace FormAutoHub.Api.Services;

public interface ICreditReservationService
{
    Task<CreditAvailabilityResponse> GetCreditAvailabilityAsync(Guid userId, CancellationToken ct);
    Task<CreditReservationResult> ReserveSubmissionAsync(Guid userId, Guid jobId, IReadOnlyList<Guid> itemIds, CancellationToken ct);
}

public sealed class CreditReservationService(FormAutoHubDbContext db) : ICreditReservationService
{
    public async Task<CreditAvailabilityResponse> GetCreditAvailabilityAsync(Guid userId, CancellationToken ct)
    {
        if (db.Database.IsRelational() && db.Database.CurrentTransaction is null)
        {
            // A read retry must not detach the caller's pending AI run or other staged writes.
            var options = (DbContextOptions<FormAutoHubDbContext>)db.GetService<IDbContextOptions>();
            await using var read = new FormAutoHubDbContext(options);
            return await CreditWriteTransaction.RunAsync(read, () => ReadAvailabilityAsync(read, userId, ct), ct);
        }
        return await CreditWriteTransaction.RunAsync(db, () => ReadAvailabilityAsync(db, userId, ct), ct);
    }

    private static async Task<CreditAvailabilityResponse> ReadAvailabilityAsync(FormAutoHubDbContext read, Guid userId, CancellationToken ct)
    {
        if (read.Database.IsSqlServer()) await CreditAccountLock.AcquireAsync(read, userId, ct);
        var account = await read.UserCreditAccounts.AsNoTracking().SingleOrDefaultAsync(x => x.UserId == userId, ct);
        var reserved = await read.CreditReservations.AsNoTracking().Where(x => x.UserId == userId && x.ClosedAt == null)
            .SumAsync(x => (decimal?)x.OutstandingAmount, ct) ?? 0m;
        return new(account?.Balance ?? 0m, reserved, (account?.Balance ?? 0m) - reserved);
    }

    public async Task<CreditReservationResult> ReserveSubmissionAsync(Guid userId, Guid jobId, IReadOnlyList<Guid> itemIds, CancellationToken ct)
    {
        if (itemIds.Count == 0 || itemIds.Distinct().Count() != itemIds.Count) throw new ArgumentException("At least one distinct item is required.");
        await CreditAccountLock.AcquireAsync(db, userId, ct);
        var job = await db.SubmissionJobs.SingleOrDefaultAsync(x => x.Id == jobId && x.UserId == userId, ct)
            ?? throw new InvalidOperationException("Submission job is not owned by the account.");
        await CreditAccountLock.LockProjectAsync(db, userId, job.ProjectId, ct);
        var items = await db.SubmissionJobItems.Where(x => x.JobId == jobId && itemIds.Contains(x.Id)).OrderBy(x => x.Id).ToListAsync(ct);
        if (items.Count != itemIds.Count || items.Count != await db.SubmissionJobItems.CountAsync(x => x.JobId == jobId, ct)) throw new InvalidOperationException("Submission item membership is incomplete.");
        var existing = await db.CreditReservations.SingleOrDefaultAsync(x => x.JobId == jobId, ct);
        if (existing is not null)
        {
            var reservedIds = await db.CreditReservationEvents.Where(x => x.ReservationId == existing.Id && (x.Kind == "Reserved" || x.Kind == "PrepaidClaimed")).Select(x => x.ItemId).ToListAsync(ct);
            if (!reservedIds.Order().SequenceEqual(itemIds.Select(x => (Guid?)x).Order())) throw new InvalidOperationException("Reservation replay changed membership.");
            return await ResultAsync(existing, userId, ct);
        }
        if (items.Any(x => x.AttemptState != "Planned" || x.MaximumSendCredits is < 0 or > 1 || x.ProjectId != job.ProjectId)) throw new InvalidOperationException("Items must be new planned attempts.");
        var account = await db.UserCreditAccounts.SingleOrDefaultAsync(x => x.UserId == userId, ct)
            ?? throw new InvalidOperationException("Credit account does not exist.");
        var amount = items.Sum(x => x.MaximumSendCredits);
        var reserved = await db.CreditReservations.Where(x => x.UserId == userId && x.ClosedAt == null).SumAsync(x => (decimal?)x.OutstandingAmount, ct) ?? 0m;
        if (account.Balance - reserved < amount) throw new InvalidOperationException("Insufficient available credit.");
        var now = DateTimeOffset.UtcNow;
        var reservation = new CreditReservation { Id = Guid.NewGuid(), UserId = userId, JobId = job.Id,
            InitialAmount = amount, OutstandingAmount = amount, CreatedAt = now };
        db.CreditReservations.Add(reservation);
        var sequence = 0;
        foreach (var item in items)
        {
            if (item.MaximumSendCredits == 0)
            {
                var response = await db.GeneratedResponses.SingleAsync(x => x.Id == item.ResponseId, ct);
                if (item.PricingPolicy != "LegacyBundledV1" || response.LegacyEntitlementState != "Available" || response.LegacyClaimItemId is not null) throw new InvalidOperationException("Prepaid entitlement is unavailable.");
                response.LegacyEntitlementState = "Claimed"; response.LegacyClaimItemId = item.Id;
            }
            item.SettlementState = item.MaximumSendCredits == 0 ? "PrepaidHeld" : "Held";
            db.CreditReservationEvents.Add(new CreditReservationEvent { Id = Guid.NewGuid(), ReservationId = reservation.Id, ItemId = item.Id,
                Sequence = sequence++, Kind = item.MaximumSendCredits == 0 ? "PrepaidClaimed" : "Reserved",
                OutstandingDelta = item.MaximumSendCredits, AttemptStateAfter = item.AttemptState, SettlementStateAfter = item.SettlementState, CreatedAt = now });
        }
        return new(reservation.Id, amount, amount, new(account.Balance, reserved + amount, account.Balance - reserved - amount));
    }

    public async Task<bool> MarkPossibleDispatchAsync(Guid itemId, CancellationToken ct)
    {
        if (db.Database.CurrentTransaction is not null) throw new InvalidOperationException("Dispatch marking must own its local transaction.");
        var itemIdentity = await db.SubmissionJobItems.AsNoTracking().SingleAsync(x => x.Id == itemId, ct);
        var identity = await db.SubmissionJobs.AsNoTracking().SingleAsync(x => x.Id == itemIdentity.JobId, ct);
        return await CreditWriteTransaction.RunAsync(db, async () =>
        {
            var (_, items, reservation) = await SubmissionItemMutation.LockAsync(db, identity, ct);
            var item = items.Single(x => x.Id == itemId);
            if (item.AttemptState != "Planned") return false;
            item.AttemptState = "PossibleDispatch"; item.PossibleDispatchAt = DateTimeOffset.UtcNow;
            var seq = await SubmissionItemMutation.NextSequenceAsync(db, reservation.Id, ct);
            db.CreditReservationEvents.Add(new CreditReservationEvent { Id = Guid.NewGuid(), ReservationId = reservation.Id, ItemId = item.Id, Sequence = seq,
                Kind = "PossibleDispatch", AttemptStateAfter = item.AttemptState, SettlementStateAfter = item.SettlementState, CreatedAt = DateTimeOffset.UtcNow });
            db.SubmissionLogs.Add(new SubmissionLog { Id = Guid.NewGuid(), ItemId = item.Id, JobId = item.JobId, ResponseId = item.ResponseId,
                PayloadJson = item.PayloadJson, Status = "Failed", ErrorMessage = "OutcomeUnresolved" });
            await db.SaveChangesAsync(ct);
            return true;
        }, ct);
    }

    public async Task<CreditReservationResult> ReleaseUnattemptedAsync(Guid jobId, CancellationToken ct)
    {
        if (db.Database.CurrentTransaction is not null) throw new InvalidOperationException("Release must own its local transaction.");
        var identity = await db.SubmissionJobs.AsNoTracking().SingleAsync(x => x.Id == jobId, ct);
        return await CreditWriteTransaction.RunAsync(db, async () =>
        {
            var (job, items, reservation) = await SubmissionItemMutation.LockAsync(db, identity, ct);
            if (job.RunnerAcknowledgedAt is null) throw new InvalidOperationException("Runner acknowledgement is required before release.");
            return await ReleaseCoreAsync(job, items, reservation, ct);
        }, ct);
    }

    internal async Task AcknowledgeRunnerAsync(Guid jobId, bool interrupted, CancellationToken ct)
    {
        var identity = await db.SubmissionJobs.AsNoTracking().SingleAsync(x => x.Id == jobId, ct);
        await CreditWriteTransaction.RunAsync(db, async () =>
        {
            var (job, items, reservation) = await SubmissionItemMutation.LockAsync(db, identity, ct);
            if (job.RunnerAcknowledgedAt is not null) return true;
            var now = DateTimeOffset.UtcNow;
            job.RunnerAcknowledgedAt = now;
            // Cancellation/pause are control facts; never replace them with financial outcomes.
            if (job.Status is not ("Paused" or "Cancelled"))
                job.Status = !interrupted && items.All(x => x.AttemptState == "Succeeded" && x.SettlementState is "Settled" or "PrepaidConsumed") ? "Completed" : "Failed";
            job.FinishedAt = job.Status == "Paused" ? null : now;
            AuditLogWriter.Add(db, identity.UserId!.Value, "SubmitResponses", nameof(SubmissionJob), job.Id,
                new { projectId = job.ProjectId, total = job.Total, status = job.Status });
            await ReleaseCoreAsync(job, items, reservation, ct);
            return true;
        }, ct);
    }

    private async Task<CreditReservationResult> ReleaseCoreAsync(SubmissionJob job, List<SubmissionJobItem> items, CreditReservation reservation, CancellationToken ct)
    {
            var seq = await SubmissionItemMutation.NextSequenceAsync(db, reservation.Id, ct);
            foreach (var item in items.Where(x => x.AttemptState == "Planned"))
            {
                item.AttemptState = "NotDispatched"; item.SettlementState = item.MaximumSendCredits == 0 ? "PrepaidReleased" : "Released";
                item.OutcomeAt = DateTimeOffset.UtcNow;
                if (item.MaximumSendCredits == 0)
                {
                    var response = await db.GeneratedResponses.SingleAsync(x => x.Id == item.ResponseId, ct);
                    if (response.LegacyClaimItemId != item.Id) throw new InvalidOperationException("Prepaid claim does not match.");
                    response.LegacyClaimItemId = null; response.LegacyEntitlementState = "Available";
                }
                reservation.OutstandingAmount -= item.MaximumSendCredits; reservation.ReleasedAmount += item.MaximumSendCredits;
                db.CreditReservationEvents.Add(new CreditReservationEvent { Id = Guid.NewGuid(), ReservationId = reservation.Id, ItemId = item.Id, Sequence = seq++,
                    Kind = item.MaximumSendCredits == 0 ? "PrepaidReleased" : "Released", OutstandingDelta = -item.MaximumSendCredits, ReleasedDelta = item.MaximumSendCredits,
                    AttemptStateAfter = item.AttemptState, SettlementStateAfter = item.SettlementState, CreatedAt = DateTimeOffset.UtcNow });
            }
            SubmissionItemMutation.Project(job, items, reservation);
            await db.SaveChangesAsync(ct);
            return await ResultAsync(reservation, reservation.UserId, ct);
    }

    private async Task<CreditReservationResult> ResultAsync(CreditReservation reservation, Guid userId, CancellationToken ct)
        => new(reservation.Id, reservation.InitialAmount, reservation.OutstandingAmount, await GetCreditAvailabilityAsync(userId, ct));
}
