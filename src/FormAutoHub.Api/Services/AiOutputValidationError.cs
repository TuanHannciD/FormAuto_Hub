namespace FormAutoHub.Api.Services;

public sealed record AiOutputValidationError(Guid? QuestionId, string Message);
