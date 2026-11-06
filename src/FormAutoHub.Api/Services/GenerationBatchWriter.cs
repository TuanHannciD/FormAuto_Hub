using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface IGenerationBatchWriter
{
    Task<Guid> AppendBatchAsync(Guid projectId, string mode, IReadOnlyList<GeneratedResponse> responses,
        int requestedCount, int generationCredits, CancellationToken ct);
}

// Only stages local SQL work in the caller's account-first transaction. No provider I/O.
public sealed class GenerationBatchWriter(FormAutoHubDbContext db, ICurrentUserContext currentUser) : IGenerationBatchWriter
{
    private GenerationBatch? prepared;
    private (string Name, string Url, string Action, string Json)? observation;

    internal void CaptureObservation(FormProject project, IReadOnlyList<FormQuestion> questions)
    {
        var value = new FormObservationResponse(questions.Select(x => new ObservedQuestionResponse(x.Id,
            x.EntryId, x.QuestionType, null, ReadOptions(x.OptionsJson), null, "StoredProjectQuestion")).ToArray(), "Partial", "Unknown");
        observation = (project.Name, project.FormUrl, project.FormActionUrl, JsonSerializer.Serialize(value));
    }

    public async Task<Guid> AppendBatchAsync(Guid projectId, string mode, IReadOnlyList<GeneratedResponse> responses,
        int requestedCount, int generationCredits, CancellationToken ct)
    {
        var fee = mode switch { "rules" => 0, "ai-default" => 1, "ai-custom" => 2, _ => throw new ArgumentException("Unsupported generation mode.") };
        if (responses.Count is < 1 or > 100 || requestedCount < responses.Count || requestedCount > 100 ||
            generationCredits != responses.Count * fee || responses.Any(x => x.Id == Guid.Empty || x.ProjectId != projectId) ||
            responses.Select(x => x.Id).Distinct().Count() != responses.Count)
            throw new ArgumentException("Invalid generation batch membership or pricing.");
        if (db.Database.IsRelational() && db.Database.CurrentTransaction is null)
            throw new InvalidOperationException("Batch append requires the caller's local transaction.");
        await CreditAccountLock.AcquireAsync(db, currentUser.UserId, ct);
        // Retention can touch runs from other projects; lock every affected parent in SQL order.
        if (db.Database.IsSqlServer())
            _ = await db.FormProjects.FromSqlInterpolated($"SELECT p.* FROM [FormProjects] p WITH (UPDLOCK,HOLDLOCK) WHERE p.[UserId]={currentUser.UserId} AND (p.[Id]={projectId} OR EXISTS (SELECT 1 FROM [GenerationBatches] b WHERE b.[ProjectId]=p.[Id] AND b.[EvictedAt] IS NULL)) ORDER BY p.[Id]").ToListAsync(ct);
        await CreditAccountLock.LockProjectAsync(db, currentUser.UserId, projectId, ct);
        if (db.Database.IsSqlServer())
            _ = await db.GenerationBatches.FromSqlInterpolated($"SELECT * FROM [GenerationBatches] WITH (UPDLOCK,HOLDLOCK) WHERE [UserId]={currentUser.UserId} AND [EvictedAt] IS NULL ORDER BY [Id]").ToListAsync(ct);
        var id = responses[0].Id;
        var existing = await db.GenerationBatches.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, ct);
        if (existing is not null)
        {
            var members = await db.GeneratedResponses.AsNoTracking().Where(x => x.GenerationBatchId == id).OrderBy(x => x.BatchOrdinal).ToListAsync(ct);
            if (existing.UserId != currentUser.UserId || existing.ProjectId != projectId || existing.Mode != mode ||
                existing.PricingPolicy != "SeparatedV1" || existing.RequestedCount != requestedCount ||
                existing.GeneratedCount != responses.Count || existing.GenerationCredits != generationCredits ||
                members.Count != responses.Count || members.Where((x, i) => x.Id != responses[i].Id || x.BatchOrdinal != i ||
                    x.CreatedAt != responses[i].CreatedAt || x.PayloadJson != responses[i].PayloadJson || x.PreviewText != responses[i].PreviewText ||
                    x.Source != responses[i].Source || x.IsReadOnly != responses[i].IsReadOnly ||
                    x.PricingPolicy != "SeparatedV1" || x.LegacyEntitlementState != "NotApplicable").Any())
                throw new InvalidOperationException("Generation batch replay changed immutable membership or pricing.");
            return id; // Read-only replay, including after logical eviction.
        }
        if (await db.GeneratedResponses.AnyAsync(x => responses.Select(r => r.Id).Contains(x.Id), ct))
            throw new InvalidOperationException("Response identity already exists outside this batch.");
        if (prepared is null)
        {
            if (observation is null)
            {
                var project = await db.FormProjects.SingleAsync(x => x.Id == projectId && x.UserId == currentUser.UserId, ct);
                var questions = await db.FormQuestions.Where(x => x.ProjectId == projectId).OrderBy(x => x.OrderIndex).ToListAsync(ct);
                CaptureObservation(project, questions);
            }
            var snapshot = observation!.Value;
            var json = snapshot.Json;
            var responseIds = responses.Select(x => x.Id).ToArray();
            var runId = mode == "rules" ? null : db.AiGenerationRunItems.Local
                .Where(x => x.GeneratedResponseId.HasValue && responseIds.Contains(x.GeneratedResponseId.Value))
                .Select(x => (Guid?)x.RunId).Distinct().Single();
            prepared = new GenerationBatch { Id = id, UserId = currentUser.UserId, ProjectId = projectId, Mode = mode,
                PricingPolicy = "SeparatedV1", RequestedCount = requestedCount, GeneratedCount = responses.Count,
                GenerationCredits = generationCredits, CreatedAt = responses.Max(x => x.CreatedAt), FormName = snapshot.Name,
                FormUrl = snapshot.Url, FormActionUrl = snapshot.Action, ObservedMetadataJson = json,
                ObservedMetadataSha256 = Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(json))), AiGenerationRunId = runId };
        }
        if (prepared.Id != id) throw new InvalidOperationException("Use a separate writer for each prepared batch.");
        db.GenerationBatches.Add(prepared);
        for (var i = 0; i < responses.Count; i++)
        {
            var response = responses[i];
            response.GenerationBatchId = id; response.BatchOrdinal = i;
            response.PricingPolicy = "SeparatedV1"; response.LegacyEntitlementState = "NotApplicable";
            db.GeneratedResponses.Add(response);
        }
        // Save remains inside the caller's transaction, enabling exact SQL uniqueidentifier ordering.
        await db.SaveChangesAsync(ct);
        var expired = await db.GenerationBatches.Where(x => x.UserId == currentUser.UserId && x.EvictedAt == null)
            .OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id).Skip(20).ToListAsync(ct);
        foreach (var batch in expired) batch.EvictedAt = prepared.CreatedAt;
        return id;
    }

    private static IReadOnlyList<string>? ReadOptions(string json)
    {
        try { var options = JsonSerializer.Deserialize<string[]>(json); return options is { Length: > 0 } ? options : null; }
        catch (JsonException) { return null; }
    }
}
