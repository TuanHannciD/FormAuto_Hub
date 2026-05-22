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
    Task<GenerateResponsesResponse?> GenerateAsync(Guid projectId, GenerateResponsesRequest request, CancellationToken cancellationToken);
    Task<GeneratedResponseListResponse?> GetProjectResponsesAsync(Guid projectId, CancellationToken cancellationToken);
}

public sealed class ResponseGenerationService(
    FormAutoHubDbContext dbContext,
    ICurrentUserContext currentUser,
    ICreditService creditService) : IResponseGenerationService
{
    public async Task<GenerateResponsesResponse?> GenerateAsync(
        Guid projectId,
        GenerateResponsesRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Count is < 1 or > Phase4SafetyLimits.MaxPreviewResponsesPerRequest)
        {
            await WriteUsageLogAsync(projectId, 0, UsageLogStatuses.Failed, "Preview response count must be between 1 and 100.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Preview response count must be between 1 and 100.");
        }

        var project = await dbContext.FormProjects
            .SingleOrDefaultAsync(item => item.Id == projectId && item.UserId == currentUser.UserId, cancellationToken);

        if (project is null)
        {
            return null;
        }

        var questions = await dbContext.FormQuestions
            .Where(question => question.ProjectId == projectId)
            .OrderBy(question => question.OrderIndex)
            .ToListAsync(cancellationToken);

        var rules = await dbContext.AnswerRules
            .Where(rule => rule.ProjectId == projectId)
            .ToListAsync(cancellationToken);

        if (questions.Count == 0 || rules.Count == 0 || questions.Any(question => rules.All(rule => rule.QuestionId != question.Id)))
        {
            await WriteUsageLogAsync(projectId, 0, UsageLogStatuses.Failed, "Every detected question requires an answer rule before preview generation.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Every detected question requires an answer rule before preview generation.");
        }

        var account = await dbContext.UserCreditAccounts
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.UserId == currentUser.UserId, cancellationToken);
        var availableCredits = Math.Max(0, (int)Math.Floor(account?.Balance ?? 0));
        var generationCount = Math.Min(request.Count, availableCredits);
        var missingCredits = request.Count - generationCount;

        if (generationCount == 0)
        {
            await WriteUsageLogAsync(projectId, 0, UsageLogStatuses.Failed, "Không đủ credit để tạo bản xem trước.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Không đủ credit để tạo bản xem trước.");
        }

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
                CreatedAt = DateTimeOffset.UtcNow
            });
        }

        var creditResult = await creditService.DeductUsageCreditsAsync(
            currentUser.UserId,
            generated.Count,
            $"Generated {generated.Count} preview response(s).",
            nameof(GeneratedResponse),
            generated.First().Id,
            cancellationToken);

        if (creditResult is null)
        {
            await WriteUsageLogAsync(projectId, 0, UsageLogStatuses.Failed, "Không đủ credit để tạo bản xem trước.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Không đủ credit để tạo bản xem trước.");
        }

        dbContext.GeneratedResponses.AddRange(generated);
        await WriteUsageLogAsync(projectId, generated.Count, UsageLogStatuses.Success, "Xem các câu trả lời đã tạo.", cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new GenerateResponsesResponse(
            generated.Select(item => item.ToResponse()).ToList(),
            generated.Count,
            creditResult.Value.Account.Balance,
            request.Count,
            generated.Count,
            missingCredits);
    }

    public async Task<GeneratedResponseListResponse?> GetProjectResponsesAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var ownsProject = await dbContext.FormProjects
            .AnyAsync(project => project.Id == projectId && project.UserId == currentUser.UserId, cancellationToken);

        if (!ownsProject)
        {
            return null;
        }

        var responses = await dbContext.GeneratedResponses
            .AsNoTracking()
            .Where(response => response.ProjectId == projectId)
            .OrderByDescending(response => response.CreatedAt)
            .ToListAsync(cancellationToken);

        return new GeneratedResponseListResponse(responses.Select(response => response.ToResponse()).ToList());
    }

    private Task WriteUsageLogAsync(
        Guid projectId,
        int creditsUsed,
        string status,
        string description,
        CancellationToken cancellationToken)
    {
        dbContext.UsageLogs.Add(new UsageLog
        {
            Id = Guid.NewGuid(),
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
