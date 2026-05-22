namespace FormAutoHub.Api.Contracts;

public sealed record AnalyzeFormRequest(string FormUrl, string Name);

public sealed record AnalyzeFormResponse(
    Guid ProjectId,
    string Name,
    string FormUrl,
    string FormTitle,
    string Status,
    IReadOnlyList<FormQuestionResponse> Questions,
    DateTimeOffset CreatedAt);

public sealed record FormQuestionResponse(
    Guid Id,
    Guid ProjectId,
    string Label,
    string EntryId,
    string QuestionType,
    IReadOnlyList<string> Options,
    bool Required,
    int OrderIndex);

public sealed record FormQuestionListResponse(IReadOnlyList<FormQuestionResponse> Items);

public sealed record UpsertAnswerRuleRequest(
    Guid QuestionId,
    string Mode,
    string ConfigJson);

public sealed record AnswerRuleResponse(
    Guid Id,
    Guid ProjectId,
    Guid QuestionId,
    string Mode,
    string ConfigJson,
    DateTimeOffset CreatedAt);

public sealed record GenerateResponsesRequest(int Count);

public sealed record GeneratedAnswerResponse(
    Guid QuestionId,
    string EntryId,
    string Label,
    string QuestionType,
    IReadOnlyList<string> Values);

public sealed record GeneratedResponseResponse(
    Guid Id,
    Guid ProjectId,
    string Status,
    string PreviewText,
    IReadOnlyList<GeneratedAnswerResponse> Answers,
    DateTimeOffset CreatedAt);

public sealed record GeneratedResponseListResponse(IReadOnlyList<GeneratedResponseResponse> Items);

public sealed record GenerateResponsesResponse(
    IReadOnlyList<GeneratedResponseResponse> Items,
    int CreditsUsed,
    decimal BalanceAfter,
    int RequestedCount,
    int GeneratedCount,
    int MissingCredits);

public sealed record SendSubmissionRequest(
    IReadOnlyList<Guid> ResponseIds,
    bool Confirmed);

public sealed record SubmissionLogResponse(
    Guid Id,
    Guid ResponseId,
    string Status,
    string ErrorMessage,
    DateTimeOffset? SubmittedAt);

public sealed record SubmissionJobResponse(
    Guid Id,
    Guid ProjectId,
    int Total,
    int SuccessCount,
    int FailedCount,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? StartedAt,
    DateTimeOffset? FinishedAt,
    IReadOnlyList<SubmissionLogResponse> Logs);
