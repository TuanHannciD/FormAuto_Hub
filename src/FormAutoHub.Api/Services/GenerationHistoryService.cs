using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace FormAutoHub.Api.Services;

public interface IGenerationHistoryService
{
    Task<GenerationHistoryPageResponse> GetMineAsync(int page, int pageSize, CancellationToken ct);
    Task<GenerationHistoryDetailResponse?> GetDetailAsync(Guid batchId, CancellationToken ct);
}

public sealed class GenerationHistoryService(FormAutoHubDbContext db, ICurrentUserContext currentUser) : IGenerationHistoryService
{
    public async Task<GenerationHistoryPageResponse> GetMineAsync(int page = 1, int pageSize = 10, CancellationToken ct = default)
    {
        if (page < 1 || pageSize is < 1 or > 20) throw new ArgumentOutOfRangeException(nameof(page));
        return await ReadAsync(async read =>
        {
            var eligible = read.GenerationBatches.AsNoTracking().Where(x => x.UserId == currentUser.UserId && x.EvictedAt == null);
            var total = await eligible.CountAsync(ct);
            // Avoid integer overflow for a valid very distant page.
            var offset = ((long)page - 1) * pageSize;
            var batches = offset >= total ? [] : await eligible.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id)
                .Skip((int)offset).Take(pageSize).ToListAsync(ct);
            var result = new List<GenerationHistoryListItem>();
            foreach (var batch in batches) result.Add(await ListItemAsync(read, batch, ct));
            return new GenerationHistoryPageResponse(result, page, pageSize, total, (total + pageSize - 1) / pageSize);
        }, ct);
    }

    public Task<GenerationHistoryDetailResponse?> GetDetailAsync(Guid batchId, CancellationToken ct) =>
        ReadAsync<GenerationHistoryDetailResponse?>(async read =>
        {
            var batch = await read.GenerationBatches.AsNoTracking().SingleOrDefaultAsync(x => x.Id == batchId && x.UserId == currentUser.UserId && x.EvictedAt == null, ct);
            if (batch is null) return null;
            var observation = JsonSerializer.Deserialize<FormObservationResponse>(batch.ObservedMetadataJson)
                ?? new FormObservationResponse([], "Partial", "Unknown");
            var responses = await read.GeneratedResponses.AsNoTracking().Where(x => x.GenerationBatchId == batch.Id && x.ProjectId == batch.ProjectId)
                .OrderBy(x => x.BatchOrdinal).Take(100).ToListAsync(ct);
            var ids = responses.Select(x => x.Id).ToArray();
            // Load attempt facts once for the complete run, retaining the same classification per response.
            var facts = await LoadFactsAsync(read, ids, ct);
            var items = new List<HistoryResponseItem>();
            foreach (var response in responses)
            {
                var outcomes = Outcomes([response.Id], facts);
                // Observation is never an admission approval; Task4 refreshes complete evidence.
                var unresolved = facts.Attempts.Any(x => x.ResponseId == response.Id &&
                    (x.AttemptState is "PossibleDispatch" or "Unknown" || x.SettlementState is "Held" or "PrepaidHeld"));
                var reason = unresolved || response.LegacyEntitlementState == "ReconciliationRequired" ? "OutcomeUnresolved" : "FormEvidenceUnavailable";
                items.Add(new HistoryResponseItem(response.BatchOrdinal!.Value, response.ToResponse(),
                    response.PricingPolicy == "LegacyBundledV1" && response.LegacyEntitlementState == "Available", true, reason, outcomes));
            }
            var run = new GenerationHistoryListItem(batch.Id, batch.ProjectId, batch.FormName, batch.Mode, batch.CreatedAt,
                batch.RequestedCount, batch.GeneratedCount, batch.GenerationCredits, batch.PricingPolicy, Outcomes(ids, facts));
            return new GenerationHistoryDetailResponse(run, batch.FormUrl, observation, items,
                await new CreditReservationService(read).GetCreditAvailabilityAsync(currentUser.UserId, ct));
        }, ct);

    private static async Task<GenerationHistoryListItem> ListItemAsync(FormAutoHubDbContext read, GenerationBatch batch, CancellationToken ct)
    {
        var ids = await read.GeneratedResponses.Where(x => x.GenerationBatchId == batch.Id).Select(x => x.Id).ToArrayAsync(ct);
        return new(batch.Id, batch.ProjectId, batch.FormName, batch.Mode, batch.CreatedAt, batch.RequestedCount,
            batch.GeneratedCount, batch.GenerationCredits, batch.PricingPolicy, await OutcomesAsync(read, ids, ct));
    }

    private static async Task<HistoryOutcomes> OutcomesAsync(FormAutoHubDbContext read, Guid[] ids, CancellationToken ct)
    {
        return Outcomes(ids, await LoadFactsAsync(read, ids, ct));
    }

    private sealed record HistoryFacts(IReadOnlyList<SubmissionJobItem> Attempts,
        IReadOnlyList<SubmissionLog> Logs, IReadOnlyList<LegacyAttemptEvidence> Evidence);

    private static async Task<HistoryFacts> LoadFactsAsync(FormAutoHubDbContext read, Guid[] ids, CancellationToken ct)
    {
        var attempts = await read.SubmissionJobItems.AsNoTracking().Where(x => ids.Contains(x.ResponseId)).ToListAsync(ct);
        // Legacy bool Success/Failed is not receiver evidence. Count it as unknown until reconciled.
        var logs = await read.SubmissionLogs.AsNoTracking().Where(x => ids.Contains(x.ResponseId) && x.ItemId == null).ToListAsync(ct);
        var evidence = await read.LegacyAttemptEvidence.AsNoTracking().Where(x => ids.Contains(x.ResponseId)).ToListAsync(ct);
        return new(attempts, logs, evidence);
    }

    private static HistoryOutcomes Outcomes(Guid[] ids, HistoryFacts facts)
    {
        var selected = ids.ToHashSet();
        var attempts = facts.Attempts.Where(x => selected.Contains(x.ResponseId)).ToList();
        var logs = facts.Logs.Where(x => selected.Contains(x.ResponseId)).ToList();
        var evidence = facts.Evidence;
        var successful = attempts.Count(x => x.AttemptState == "Succeeded" && x.SettlementState is "Settled" or "PrepaidConsumed");
        var rejected = attempts.Count(x => x.AttemptState == "Rejected" && x.SettlementState is "Released" or "PrepaidReleased");
        var unknown = attempts.Count(x => x.AttemptState is "Unknown" or "PossibleDispatch");
        foreach (var log in logs)
        {
            var proof = evidence.Where(x => x.LegacySubmissionLogId == log.Id).OrderByDescending(x => x.CreatedAt).FirstOrDefault();
            if (proof?.OutcomeKind == "ConfirmedSuccess") successful++;
            else if (proof?.OutcomeKind == "ConfirmedRejected") rejected++;
            else unknown++;
        }
        var dispatched = attempts.Where(x => x.PossibleDispatchAt != null).Select(x => x.ResponseId).Concat(logs.Select(x => x.ResponseId)).ToHashSet();
        return new(successful, rejected, unknown, ids.Count(x => !dispatched.Contains(x)));
    }

    private async Task<T> ReadAsync<T>(Func<FormAutoHubDbContext, Task<T>> read, CancellationToken ct)
    {
        if (!db.Database.IsRelational() || db.Database.CurrentTransaction is not null) return await read(db);
        // Isolate retries from the caller's tracker, and serialize count/page/detail with appends.
        var options = (DbContextOptions<FormAutoHubDbContext>)db.GetService<IDbContextOptions>();
        await using var fresh = new FormAutoHubDbContext(options);
        return await CreditWriteTransaction.RunAsync(fresh, async () =>
        {
            await CreditAccountLock.AcquireAsync(fresh, currentUser.UserId, ct);
            return await read(fresh);
        }, ct);
    }
}
