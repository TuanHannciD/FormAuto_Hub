namespace FormAutoHub.Api.Services;

public interface IAiPromptGuardService
{
    AiPromptGuardResult Validate(string? prompt);
}
