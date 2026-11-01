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
            throw new InvalidOperationException("Vui lòng chọn chế độ tạo câu trả lời.");
        }

        if (string.IsNullOrWhiteSpace(request.ConfigJson))
        {
            throw new InvalidOperationException("Vui lòng nhập cấu hình quy tắc trả lời.");
        }

        if (request.ConfigJson.Length > Phase4SafetyLimits.MaxAnswerRuleConfigLength)
        {
            throw new InvalidOperationException("Cấu hình quy tắc trả lời vượt độ dài cho phép.");
        }

        if (!Phase3RuleHelpers.IsSupportedMode(request.Mode))
        {
            throw new InvalidOperationException("Chế độ tạo câu trả lời chưa được hỗ trợ.");
        }

        if (!Phase3RuleHelpers.IsSupportedQuestionType(question.QuestionType))
        {
            throw new InvalidOperationException("Loại câu hỏi này chưa được hỗ trợ.");
        }

        try
        {
            using var _ = JsonDocument.Parse(request.ConfigJson);
        }
        catch (JsonException exception)
        {
            throw new InvalidOperationException("Cấu hình quy tắc trả lời phải đúng định dạng JSON.", exception);
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

        _ = Phase3RuleHelpers.GetValues(candidate, question, 0);
    }
}
