using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace FormAutoHub.Api.Services;

// SQL-only admission; provider calls and compatibility refreshes never enter retry callbacks.
internal static class SubmissionAdmission
{
    internal sealed record Result(SubmissionJob Job, bool Run);
    internal static string Hash(string value) => Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
    internal static string Fingerprint(Guid user, Guid project, string route, Guid? batch, IReadOnlyList<Guid> ids, int? count, bool confirmed, bool warning) =>
        Hash(JsonSerializer.Serialize(new object?[] { 2, user.ToString("D"), project.ToString("D"), route, batch?.ToString("D"),
            ids.Select(x => x.ToString("D")).Order(StringComparer.Ordinal).ToArray(), count, confirmed, warning }));

    internal static async Task<SubmissionJob?> ReplayAsync(FormAutoHubDbContext db, Guid user, Guid project, Guid command, string fingerprint, CancellationToken ct)
    {
        var job = await db.SubmissionJobs.AsNoTracking().SingleOrDefaultAsync(x => x.Id == command, ct);
        if (job is null) return null;
        var owner = job.UserId ?? await db.FormProjects.Where(x => x.Id == job.ProjectId).Select(x => x.UserId).SingleAsync(ct);
        if (owner != user) throw new SubmissionContractException("NotFound", 404);
        if (job.ContractVersion != 2 || job.RequestFingerprint is null) throw new SubmissionContractException("ClientUpgradeRequired", 409);
        if (job.ProjectId != project || job.RequestFingerprint != fingerprint) throw new SubmissionContractException("CommandConflict", 409);
        return job;
    }

    internal static Task<bool> HasActiveAsync(FormAutoHubDbContext db, Guid project, CancellationToken ct) => db.SubmissionJobs.AnyAsync(x => x.ProjectId == project &&
        (x.ContractVersion == 2
            ? x.Status == "Pending" || x.Status == "Running" || x.Status == "Paused" || x.RunnerAcknowledgedAt == null ||
                db.SubmissionJobItems.Any(i => i.JobId == x.Id && (i.AttemptState == "PossibleDispatch" || i.AttemptState == "Unknown" || i.SettlementState == "Held" || i.SettlementState == "PrepaidHeld"))
            : x.Status == "Pending" || x.Status == "Running" || x.Status == "Paused" || x.Status == "Cancelled" && x.FinishedAt == null), ct);

    internal static async Task<Result> RunAsync(FormAutoHubDbContext db, Guid user, Guid project, Guid command, string fingerprint,
        string route, SubmissionCompatibilityResult compatibility, Func<CancellationToken, Task<IReadOnlyList<GeneratedResponse>>> prepare, CancellationToken ct)
    {
        try
        {
            return await CreditWriteTransaction.RunAsync(db, async () =>
            {
                await CreditAccountLock.AcquireAsync(db, user, ct);
                // Direct generation retention can affect any retained run for this account.
                if (db.Database.IsSqlServer())
                    _ = await db.FormProjects.FromSqlInterpolated($"SELECT * FROM [FormProjects] WITH (UPDLOCK,HOLDLOCK) WHERE [UserId]={user} ORDER BY [Id]").ToListAsync(ct);
                await CreditAccountLock.LockProjectAsync(db, user, project, ct);
                if (await ReplayAsync(db, user, project, command, fingerprint, ct) is { } replay) return new Result(replay, false);
                if (await HasActiveAsync(db, project, ct)) throw new SubmissionContractException("ActiveSubmissionJob", 409);
                var responses = await prepare(ct);
                var maximumCredits = responses.Count(x => x.PricingPolicy != "LegacyBundledV1" || x.LegacyEntitlementState != "Available");
                var available = await new CreditReservationService(db).GetCreditAvailabilityAsync(user, ct);
                if (available.Available < maximumCredits) throw new SubmissionContractException("InsufficientAvailableCredit", 409);
                var projectRow = await db.FormProjects.SingleAsync(x => x.Id == project && x.UserId == user, ct);
                var batchId = responses[0].GenerationBatchId;
                var batch = batchId.HasValue ? await db.GenerationBatches.SingleAsync(x => x.Id == batchId, ct) : null;
                var now = DateTimeOffset.UtcNow;
                var job = new SubmissionJob { Id = command, CommandId = command, UserId = user, ProjectId = project,
                    ContractVersion = 2, RouteKind = route, RequestFingerprint = fingerprint, GenerationBatchId = batchId,
                    PricingPolicy = responses[0].PricingPolicy, Total = responses.Count, Status = "Running", RateLimitPerMinute = 10,
                    CreatedAt = now, StartedAt = now, UnknownCount = 0, NotDispatchedCount = 0, HeldCount = responses.Count };
                db.SubmissionJobs.Add(job);
                var items = responses.Select((r, i) => new SubmissionJobItem { Id = Guid.NewGuid(), JobId = command, ProjectId = project,
                    ResponseId = r.Id, GenerationBatchId = batchId, Ordinal = i, PayloadJson = r.PayloadJson,
                    PayloadSha256 = Hash(r.PayloadJson), FormActionUrl = batch?.FormActionUrl ?? projectRow.FormActionUrl,
                    ObservedMetadataJson = batch?.ObservedMetadataJson ?? compatibility.ObservedMetadataJson,
                    ObservedMetadataSha256 = batch?.ObservedMetadataSha256 ?? Hash(compatibility.ObservedMetadataJson),
                    CompatibilityEvidenceJson = compatibility.CompatibilityEvidenceJson, CompatibilityEvidenceSha256 = compatibility.CompatibilityEvidenceSha256,
                    CompatibilityCheckedAt = compatibility.CheckedAt, PricingPolicy = r.PricingPolicy!,
                    MaximumSendCredits = r.PricingPolicy == "LegacyBundledV1" && r.LegacyEntitlementState == "Available" ? 0 : 1,
                    AttemptState = "Planned", SettlementState = r.PricingPolicy == "LegacyBundledV1" && r.LegacyEntitlementState == "Available" ? "PrepaidHeld" : "Held", CreatedAt = now }).ToArray();
                db.SubmissionJobItems.AddRange(items);
                await db.SaveChangesAsync(ct);
                try { await new CreditReservationService(db).ReserveSubmissionAsync(user, command, items.Select(x => x.Id).ToArray(), ct); }
                catch (InvalidOperationException e) when (e.Message is "Insufficient available credit." or "Credit account does not exist.")
                { throw new SubmissionContractException("InsufficientAvailableCredit", 409); }
                await db.SaveChangesAsync(ct);
                return new Result(job, true);
            }, ct);
        }
        catch (Exception) when (db.Database.IsRelational())
        {
            // Lost acknowledgement never grants a runner lease, even when admission committed.
            db.ChangeTracker.Clear();
            using var diagnostic = new CancellationTokenSource(TimeSpan.FromSeconds(10));
            await using var fresh = new FormAutoHubDbContext((DbContextOptions<FormAutoHubDbContext>)db.GetService<IDbContextOptions>());
            if (await ReplayAsync(fresh, user, project, command, fingerprint, diagnostic.Token) is { } committed) return new(committed, false);
            throw;
        }
    }
}
