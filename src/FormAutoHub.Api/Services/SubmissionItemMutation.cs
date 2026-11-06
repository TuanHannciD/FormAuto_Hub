using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

internal static class SubmissionItemMutation
{
    public static async Task<(SubmissionJob Job, List<SubmissionJobItem> Items, CreditReservation Reservation)> LockAsync(
        FormAutoHubDbContext db, SubmissionJob identity, CancellationToken ct)
    {
        var jobId = identity.Id;
        var user = identity.UserId ?? throw new InvalidOperationException("Legacy job has no durable reservation.");
        await CreditAccountLock.AcquireAsync(db, user, ct);
        await CreditAccountLock.LockProjectAsync(db, user, identity.ProjectId, ct);
        if (db.Database.IsSqlServer())
        {
            if (identity.GenerationBatchId is Guid batch)
                _ = await db.GenerationBatches.FromSqlInterpolated($"SELECT * FROM [GenerationBatches] WITH (UPDLOCK,HOLDLOCK) WHERE [Id]={batch}").ToListAsync(ct);
            var responses = await db.GeneratedResponses.FromSqlInterpolated($"SELECT r.* FROM [GeneratedResponses] r WITH (UPDLOCK,HOLDLOCK) WHERE r.Id IN (SELECT ResponseId FROM SubmissionJobItems WHERE JobId={jobId}) ORDER BY r.Id").ToListAsync(ct);
            foreach (var response in responses) await db.Entry(response).ReloadAsync(ct);
        }
        var items = db.Database.IsSqlServer()
            ? await db.SubmissionJobItems.FromSqlInterpolated($"SELECT * FROM [SubmissionJobItems] WITH (UPDLOCK,HOLDLOCK) WHERE [JobId]={jobId} ORDER BY [Id]").ToListAsync(ct)
            : await db.SubmissionJobItems.Where(x => x.JobId == jobId).ToListAsync(ct);
        var job = await db.SubmissionJobs.SingleAsync(x => x.Id == jobId, ct);
        var reservation = await db.CreditReservations.SingleAsync(x => x.JobId == jobId, ct);
        foreach (var item in items) await db.Entry(item).ReloadAsync(ct);
        await db.Entry(job).ReloadAsync(ct); await db.Entry(reservation).ReloadAsync(ct);
        return (job, items, reservation);
    }

    public static void Project(SubmissionJob job, IReadOnlyList<SubmissionJobItem> items, CreditReservation reservation)
    {
        job.SuccessCount = items.Count(x => x.AttemptState == "Succeeded");
        job.FailedCount = items.Count(x => x.AttemptState == "Rejected");
        job.UnknownCount = items.Count(x => x.AttemptState == "Unknown");
        job.NotDispatchedCount = items.Count(x => x.AttemptState == "NotDispatched");
        job.HeldCount = items.Count(x => x.SettlementState is "Held" or "PrepaidHeld");
        reservation.ClosedAt = job.HeldCount == 0 ? DateTimeOffset.UtcNow : null;
    }

    public static async Task<int> NextSequenceAsync(FormAutoHubDbContext db, Guid reservationId, CancellationToken ct) =>
        (await db.CreditReservationEvents.Where(x => x.ReservationId == reservationId).Select(x => (int?)x.Sequence).MaxAsync(ct) ?? -1) + 1;
}
