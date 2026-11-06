using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface IResponseGenerationService
{
    Task<bool> OwnsProjectAsync(Guid projectId, CancellationToken ct);
    Task<GenerateResponsesResponse?> GenerateAsync(Guid projectId, GenerateResponsesRequest request, CancellationToken cancellationToken);
    Task<GeneratedResponseListResponse?> GetProjectResponsesAsync(
        Guid projectId,
        IReadOnlyList<Guid> responseIds,
        CancellationToken cancellationToken);
}

public sealed class ResponseGenerationService(
    FormAutoHubDbContext dbContext,
    ICurrentUserContext currentUser,
    ICreditService creditService) : IResponseGenerationService
{
    public Task<bool> OwnsProjectAsync(Guid projectId, CancellationToken ct) => dbContext.FormProjects.AsNoTracking().AnyAsync(x => x.Id == projectId && x.UserId == currentUser.UserId, ct);
    public Task<GenerateResponsesResponse?> GenerateAsync(
        Guid projectId,
        GenerateResponsesRequest request,
        CancellationToken cancellationToken) => GenerateCoreAsync(projectId, request, request.Count, cancellationToken);

    internal Task<GenerateResponsesResponse?> GenerateForDirectSubmissionAsync(
        Guid projectId, int count, int requestedCount, CancellationToken cancellationToken) =>
        GenerateCoreAsync(projectId, new(count), requestedCount, cancellationToken);

    private async Task<GenerateResponsesResponse?> GenerateCoreAsync(
        Guid projectId, GenerateResponsesRequest request, int requestedCount, CancellationToken cancellationToken)
    {
        _ = creditService; // Constructor compatibility; rules generation is free under SeparatedV1.
        var project = await dbContext.FormProjects
            .SingleOrDefaultAsync(item => item.Id == projectId && item.UserId == currentUser.UserId, cancellationToken);

        if (project is null)
        {
            return null;
        }

        if (request.Count is < 1 or > Phase4SafetyLimits.MaxPreviewResponsesPerRequest)
        {
            await WriteUsageLogAsync(projectId, 0, UsageLogStatuses.Failed, "Preview response count must be between 1 and 100.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Preview response count must be between 1 and 100.");
        }

        var questions = await dbContext.FormQuestions
            .Where(question => question.ProjectId == projectId)
            .OrderBy(question => question.OrderIndex)
            .ToListAsync(cancellationToken);

        var batchWriter = new GenerationBatchWriter(dbContext, currentUser);
        batchWriter.CaptureObservation(project, questions);

        var rules = await dbContext.AnswerRules
            .Where(rule => rule.ProjectId == projectId)
            .ToListAsync(cancellationToken);

        if (questions.Count == 0 || rules.Count == 0 || questions.Any(question => rules.All(rule => rule.QuestionId != question.Id)))
        {
            await WriteUsageLogAsync(projectId, 0, UsageLogStatuses.Failed, "Every detected question requires an answer rule before preview generation.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Every detected question requires an answer rule before preview generation.");
        }

        if (questions.Any(question => string.IsNullOrWhiteSpace(question.EntryId)) ||
            questions.Select(question => question.EntryId).Distinct().Count() != questions.Count)
            throw new InvalidOperationException("Generated response payload is missing or duplicates required entry IDs.");
        foreach (var question in questions)
        {
            var rule = rules.Single(item => item.QuestionId == question.Id);
            AnswerRuleService.ValidateRequest(new(question.Id, rule.Mode, rule.ConfigJson), question);
        }
        var generationCount = request.Count;
        var missingCredits = requestedCount - generationCount;

        var generated = new List<GeneratedResponse>();
        for (var responseIndex = 0; responseIndex < generationCount; responseIndex++)
        {
            var answers = new List<GeneratedAnswerResponse>();
            foreach (var question in questions)
            {
                var rule = rules.Single(item => item.QuestionId == question.Id);
                var values = Phase3RuleHelpers.GetValues(rule, question, responseIndex);
                answers.Add(new GeneratedAnswerResponse(
                    question.Id,
                    question.EntryId,
                    question.Label,
                    question.QuestionType,
                    values));
            }

            var previewText = string.Join("; ", answers.Select(answer => $"{answer.Label}: {string.Join(", ", answer.Values)}"));
            generated.Add(new GeneratedResponse
            {
                Id = Guid.NewGuid(),
                ProjectId = projectId,
                PayloadJson = JsonSerializer.Serialize(answers),
                PreviewText = previewText,
                Status = GeneratedResponseStatuses.Previewed,
                Source = GeneratedResponseSources.Rule,
                IsReadOnly = false,
                CreatedAt = DateTimeOffset.UtcNow
            });
        }

        return await CreditWriteTransaction.RunStagedAsync<GenerateResponsesResponse?>(dbContext, currentUser.UserId, async (read, readCt) =>
        {
            if (!await read.GenerationBatches.AsNoTracking().AnyAsync(x => x.Id == generated[0].Id, readCt)) return (false, null);
            var batchId = await new GenerationBatchWriter(read, currentUser).AppendBatchAsync(projectId, "rules", generated, requestedCount, 0, readCt);
            var currentCredits = await new CreditReservationService(read).GetCreditAvailabilityAsync(currentUser.UserId, readCt);
            return (true, new GenerateResponsesResponse(generated.Select(x => x.ToResponse()).ToList(), 0, currentCredits.Balance,
                requestedCount, generated.Count, missingCredits, batchId, 0, currentCredits));
        }, async () =>
        {
            await WriteUsageLogAsync(projectId, 0, UsageLogStatuses.Success, "Xem các câu trả lời đã tạo.", cancellationToken);
            var batchId = await batchWriter.AppendBatchAsync(projectId, "rules", generated, requestedCount, 0, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            var currentCredits = await new CreditReservationService(dbContext).GetCreditAvailabilityAsync(currentUser.UserId, cancellationToken);
            return new GenerateResponsesResponse(generated.Select(item => item.ToResponse()).ToList(), 0, currentCredits.Balance,
                requestedCount, generated.Count, missingCredits, batchId, 0, currentCredits);
        }, cancellationToken);
    }

    public async Task<GeneratedResponseListResponse?> GetProjectResponsesAsync(
        Guid projectId,
        IReadOnlyList<Guid> responseIds,
        CancellationToken cancellationToken)
    {
        var ownsProject = await dbContext.FormProjects
            .AnyAsync(project => project.Id == projectId && project.UserId == currentUser.UserId, cancellationToken);

        if (!ownsProject)
        {
            return null;
        }

        var query = dbContext.GeneratedResponses
            .AsNoTracking()
            .Where(response => response.ProjectId == projectId &&
                (dbContext.GenerationBatches.Any(batch => batch.Id == response.GenerationBatchId && batch.UserId == currentUser.UserId && batch.EvictedAt == null) ||
                 (response.GenerationBatchId == null && response.PricingPolicy == "LegacyBundledV1" && response.LegacyEvidenceReference != null && response.LegacyEvidenceReference.Trim() != "" &&
                  response.LegacyEntitlementState != null)));

        if (responseIds.Count > 0)
        {
            query = query.Where(response => responseIds.Contains(response.Id));
        }

        // Materialize once so eligibility and explicit membership come from the same SELECT.
        // An eviction between a separate count and payload query must never return a silent subset.
        var responses = await query
            .OrderByDescending(response => response.CreatedAt)
            .ToListAsync(cancellationToken);

        if (responseIds.Count > 0 && responses.Count != responseIds.Distinct().Count()) return null;

        return new GeneratedResponseListResponse(responses.Select(response => response.ToResponse()).ToList());
    }

    private Task WriteUsageLogAsync(
        Guid projectId,
        int creditsUsed,
        string status,
        string description,
        CancellationToken cancellationToken,
        Guid? logId = null)
    {
        dbContext.UsageLogs.Add(new UsageLog
        {
            Id = logId ?? Guid.NewGuid(),
            UserId = currentUser.UserId,
            ToolName = "FormAutomation",
            Action = "Xem lại câu trả lời được tạo",
            CreditsUsed = creditsUsed,
            Status = status,
            Description = description,
            ProjectId = projectId,
            CreatedAt = DateTimeOffset.UtcNow
        });

        return Task.CompletedTask;
    }
}
