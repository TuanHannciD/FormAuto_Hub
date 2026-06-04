using FormAutoHub.Api.Contracts;

namespace FormAutoHub.Api.Services;

public sealed record AiOutputValidationResult(
    IReadOnlyList<GeneratedAnswerResponse> ValidAnswers,
    IReadOnlyList<AiOutputValidationError> Errors)
{
    public bool HasValidAnswers => ValidAnswers.Count > 0;

    public bool HasErrors => Errors.Count > 0;

    public bool IsFullyValid => HasValidAnswers && !HasErrors;

    public static AiOutputValidationResult Invalid(string error) =>
        new(Array.Empty<GeneratedAnswerResponse>(), [new AiOutputValidationError(null, error)]);
}
