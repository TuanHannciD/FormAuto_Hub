namespace FormAutoHub.Api.Contracts;

public sealed record UpsertAiPromptProfileRequest(
    string Mode,
    string AudienceJson,
    string GlobalPrompt);

public sealed record UpsertAiQuestionPromptRequest(
    string Mode,
    string Prompt,
    bool UseAi);

public sealed record AiPromptAutoFillRequest(
    string Mode,
    string Context);

public sealed record AiQuestionPromptResponse(
    Guid Id,
    Guid ProfileId,
    Guid QuestionId,
    string Prompt,
    bool UseAi,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record AiPromptProfileResponse(
    Guid Id,
    Guid ProjectId,
    Guid UserId,
    string Mode,
    string AudienceJson,
    string GlobalPrompt,
    IReadOnlyList<AiQuestionPromptResponse> Questions,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record AiPromptAutoFillQuestionResponse(
    Guid QuestionId,
    string Prompt,
    bool UseAi);

public sealed record AiPromptAutoFillResponse(
    string Mode,
    string AudienceJson,
    string GlobalPrompt,
    IReadOnlyList<AiPromptAutoFillQuestionResponse> Questions);
