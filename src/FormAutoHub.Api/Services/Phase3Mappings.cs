using System.Text.Json;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Entities;

namespace FormAutoHub.Api.Services;

public static class Phase3Mappings
{
    public static FormQuestionResponse ToResponse(this FormQuestion question) =>
        new(
            question.Id,
            question.ProjectId,
            question.Label,
            question.EntryId,
            question.QuestionType,
            DeserializeStringList(question.OptionsJson),
            question.Required,
            question.OrderIndex);

    public static AnswerRuleResponse ToResponse(this AnswerRule rule) =>
        new(rule.Id, rule.ProjectId, rule.QuestionId, rule.Mode, rule.ConfigJson, rule.CreatedAt);

    public static GeneratedResponseResponse ToResponse(this GeneratedResponse response) =>
        new(
            response.Id,
            response.ProjectId,
            response.Status,
            response.PreviewText,
            DeserializeAnswers(response.PayloadJson),
            response.CreatedAt);

    public static SubmissionJobResponse ToResponse(this SubmissionJob job, IReadOnlyList<SubmissionLog> logs) =>
        new(
            job.Id,
            job.ProjectId,
            job.Total,
            job.SuccessCount,
            job.FailedCount,
            job.Status,
            job.CreatedAt,
            job.StartedAt,
            job.FinishedAt,
            logs.Select(log => new SubmissionLogResponse(
                    log.Id,
                    log.ResponseId,
                    log.Status,
                    log.ErrorMessage,
                    log.SubmittedAt))
                .ToList());

    private static IReadOnlyList<string> DeserializeStringList(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return Array.Empty<string>();
        }

        return JsonSerializer.Deserialize<IReadOnlyList<string>>(json) ?? Array.Empty<string>();
    }

    private static IReadOnlyList<GeneratedAnswerResponse> DeserializeAnswers(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return Array.Empty<GeneratedAnswerResponse>();
        }

        return JsonSerializer.Deserialize<IReadOnlyList<GeneratedAnswerResponse>>(json) ?? Array.Empty<GeneratedAnswerResponse>();
    }
}
