namespace FormAutoHub.Api.Services;

public sealed class AiPromptGuardService : IAiPromptGuardService
{
    public AiPromptGuardResult Validate(string? prompt)
    {
        if (string.IsNullOrWhiteSpace(prompt))
        {
            return AiPromptGuardResult.Rejected("Prompt is required.");
        }

        if (AiSafetyTextRules.ContainsUnsafeContent(prompt))
        {
            return AiPromptGuardResult.Rejected("Prompt requests unsafe or forbidden AI behavior.");
        }

        return AiPromptGuardResult.Allowed();
    }
}
