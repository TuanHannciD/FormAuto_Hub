using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Integrations.GoogleForms;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface ISubmissionCompatibilityService
{
    Task<SubmissionCompatibilityResult> CheckAsync(Guid projectId, Guid? batchId, IReadOnlyList<Guid> responseIds, CancellationToken ct);
}

// Refreshes are outside credit transaction/retry callbacks. Stored observations remain partial.
public sealed class SubmissionCompatibilityService(FormAutoHubDbContext db, ICurrentUserContext user,
    IGoogleFormsClient? google = null) : ISubmissionCompatibilityService
{
    public async Task<SubmissionCompatibilityResult> CheckAsync(Guid projectId, Guid? batchId, IReadOnlyList<Guid> responseIds, CancellationToken ct)
    {
        SubmissionCompatibilityResult Block(string code) => new(false, code, "", "", "", DateTimeOffset.UtcNow);
        var project = await db.FormProjects.AsNoTracking().SingleOrDefaultAsync(x => x.Id == projectId && x.UserId == user.UserId, ct);
        if (project is null || !GoogleFormIdentity.TryNormalize(project.FormUrl, "viewform", out var form) ||
            !GoogleFormIdentity.TryNormalize(project.FormActionUrl, "formResponse", out var action) ||
            action != form.Replace("/viewform", "/formResponse", StringComparison.Ordinal)) return Block("FormIncompatible");
        FormObservationResponse? batchObservation = null;
        if (batchId is Guid id)
        {
            var batch = await db.GenerationBatches.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id && x.UserId == user.UserId && x.ProjectId == projectId, ct);
            if (batch is null || batch.EvictedAt is not null || !GoogleFormIdentity.TryNormalize(batch.FormUrl, "viewform", out var batchForm) || batchForm != form ||
                !GoogleFormIdentity.TryNormalize(batch.FormActionUrl, "formResponse", out var batchAction) || batchAction != action) return Block("FormIncompatible");
            try { batchObservation = System.Text.Json.JsonSerializer.Deserialize<FormObservationResponse>(batch.ObservedMetadataJson); }
            catch (System.Text.Json.JsonException) { return Block("FormEvidenceUnavailable"); }
            if (batchObservation is null) return Block("FormEvidenceUnavailable");
        }
        var metadata = google is null ? null : await google.GetSubmissionMetadataAsync(form, ct);
        if (metadata is null) return Block("FormEvidenceUnavailable");
        if (batchObservation is not null && (batchObservation.Questions.Count != metadata.Questions.Count ||
            batchObservation.Questions.Any(q => !metadata.Questions.Any(fresh => q.EntryId == fresh.EntryId && q.QuestionType == fresh.QuestionType &&
                (!q.Required.HasValue || q.Required == fresh.Required) && (q.Options is null || q.Options.SequenceEqual(fresh.Options, StringComparer.Ordinal)) &&
                (q.ConstraintsJson is null || q.ConstraintsJson == "{}"))))) return Block("FormIncompatible");
        var stored = await db.FormQuestions.AsNoTracking().Where(x => x.ProjectId == projectId).OrderBy(x => x.OrderIndex).ToListAsync(ct);
        if (stored.Count != metadata.Questions.Count || stored.Any(q => !metadata.Questions.Any(fresh => fresh.EntryId == q.EntryId && fresh.QuestionType == q.QuestionType && OptionsMatch(q.OptionsJson, fresh.Options))))
            return Block("FormIncompatible");
        if (responseIds.Count > 0)
        {
            var responses = await db.GeneratedResponses.AsNoTracking().Where(x => x.ProjectId == projectId && responseIds.Contains(x.Id)).ToListAsync(ct);
            if (responses.Count != responseIds.Count || responses.Any(r => r.GenerationBatchId != batchId || !Accepts(metadata.SemanticJson, r.PayloadJson))) return Block("FormIncompatible");
        }
        var observation = new FormObservationResponse(metadata.Questions.Select(q => new ObservedQuestionResponse(null, q.EntryId, q.QuestionType,
            q.Required, q.Options, "{}", "GooglePublicRefresh")).ToArray(), "Complete", "GoogleConfirmationDocument");
        return new(true, null, System.Text.Json.JsonSerializer.Serialize(observation), metadata.SemanticJson,
            SubmissionAdmission.Hash(metadata.SemanticJson), DateTimeOffset.UtcNow);
    }

    private static bool OptionsMatch(string json, IReadOnlyList<string> fresh)
    {
        try { return (System.Text.Json.JsonSerializer.Deserialize<string[]>(json) ?? []).SequenceEqual(fresh, StringComparer.Ordinal); }
        catch (System.Text.Json.JsonException) { return false; }
    }

    internal static bool Accepts(string evidenceJson, string payloadJson)
    {
        try
        {
            using var evidence = System.Text.Json.JsonDocument.Parse(evidenceJson);
            if (!evidence.RootElement.TryGetProperty("Version", out var version) || version.GetString() != "google-public-supported-v1")
                return false;
            var metadata = System.Text.Json.JsonSerializer.Deserialize<GoogleFormsSubmissionMetadata>(evidenceJson);
            var answers = System.Text.Json.JsonSerializer.Deserialize<GeneratedAnswerResponse[]>(payloadJson);
            return metadata is not null && answers is not null && answers.Select(a => a.EntryId).Distinct().Count() == answers.Length &&
                metadata.Accepts(answers.ToDictionary(a => a.EntryId, a => a.Values));
        }
        catch (Exception e) when (e is System.Text.Json.JsonException or ArgumentException or NullReferenceException) { return false; }
    }
}
