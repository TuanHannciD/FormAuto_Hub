using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface IAnswerRuleService
{
    Task<AnswerRuleResponse?> CreateAsync(Guid projectId, UpsertAnswerRuleRequest request, CancellationToken cancellationToken);
    Task<AnswerRuleResponse?> UpdateAsync(Guid projectId, Guid ruleId, UpsertAnswerRuleRequest request, CancellationToken cancellationToken);
}

public sealed class AnswerRuleService(FormAutoHubDbContext dbContext, ICurrentUserContext currentUser)
    : IAnswerRuleService
{
    public async Task<AnswerRuleResponse?> CreateAsync(
        Guid projectId,
        UpsertAnswerRuleRequest request,
        CancellationToken cancellationToken)
    {
        var question = await GetOwnedQuestionAsync(projectId, request.QuestionId, cancellationToken);
        if (question is null)
        {
            return null;
        }

        ValidateRequest(request, question);

        var rule = await dbContext.AnswerRules
            .SingleOrDefaultAsync(
                item => item.ProjectId == projectId && item.QuestionId == request.QuestionId,
                cancellationToken);

        if (rule is null)
        {
            rule = new AnswerRule
            {
                Id = Guid.NewGuid(),
                ProjectId = projectId,
                QuestionId = request.QuestionId,
                CreatedAt = DateTimeOffset.UtcNow
            };

            dbContext.AnswerRules.Add(rule);
        }

        rule.Mode = request.Mode;
        rule.ConfigJson = request.ConfigJson;

        await dbContext.SaveChangesAsync(cancellationToken);
        return rule.ToResponse();
    }

    public async Task<AnswerRuleResponse?> UpdateAsync(
        Guid projectId,
        Guid ruleId,
        UpsertAnswerRuleRequest request,
        CancellationToken cancellationToken)
    {
        var question = await GetOwnedQuestionAsync(projectId, request.QuestionId, cancellationToken);
        if (question is null)
        {
            return null;
        }

        var rule = await dbContext.AnswerRules
            .SingleOrDefaultAsync(item => item.Id == ruleId && item.ProjectId == projectId, cancellationToken);

        if (rule is null)
        {
            return null;
        }

        ValidateRequest(request, question);

        rule.QuestionId = request.QuestionId;
        rule.Mode = request.Mode;
        rule.ConfigJson = request.ConfigJson;
        await dbContext.SaveChangesAsync(cancellationToken);
        return rule.ToResponse();
    }

    private async Task<FormQuestion?> GetOwnedQuestionAsync(Guid projectId, Guid questionId, CancellationToken cancellationToken)
    {
        var ownsProject = await dbContext.FormProjects
            .AnyAsync(project => project.Id == projectId && project.UserId == currentUser.UserId, cancellationToken);

        if (!ownsProject)
        {
            return null;
        }

        return await dbContext.FormQuestions
            .SingleOrDefaultAsync(question => question.Id == questionId && question.ProjectId == projectId, cancellationToken);
    }

    private static void ValidateRequest(UpsertAnswerRuleRequest request, FormQuestion question)
    {
        if (string.IsNullOrWhiteSpace(request.Mode))
        {
            throw new InvalidOperationException("Answer rule mode is required.");
        }

        if (string.IsNullOrWhiteSpace(request.ConfigJson))
        {
            throw new InvalidOperationException("ConfigJson is required.");
        }

        if (request.ConfigJson.Length > Phase4SafetyLimits.MaxAnswerRuleConfigLength)
        {
            throw new InvalidOperationException("ConfigJson is too large.");
        }

        if (!Phase3RuleHelpers.IsSupportedMode(request.Mode))
        {
            throw new InvalidOperationException("Unsupported answer rule mode.");
        }

        if (!Phase3RuleHelpers.IsSupportedQuestionType(question.QuestionType))
        {
            throw new InvalidOperationException("Unsupported question type.");
        }

        try
        {
            using var _ = JsonDocument.Parse(request.ConfigJson);
        }
        catch (JsonException exception)
        {
            throw new InvalidOperationException("ConfigJson must be valid JSON.", exception);
        }

        var candidate = new AnswerRule
        {
            Id = Guid.Empty,
            ProjectId = question.ProjectId,
            QuestionId = question.Id,
            Mode = request.Mode,
            ConfigJson = request.ConfigJson,
            CreatedAt = DateTimeOffset.UtcNow
        };

        if (!Phase3RuleHelpers.HasValidConfig(candidate, question))
        {
            throw new InvalidOperationException("Answer rule config does not match the selected mode and question.");
        }
    }
}
