using FormAutoHub.Api.Entities;

namespace FormAutoHub.Api.Services;

public interface IAiOutputValidator
{
    AiOutputValidationResult Validate(string outputJson, IReadOnlyList<FormQuestion> projectQuestions);
}
