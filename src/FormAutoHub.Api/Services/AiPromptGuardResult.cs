namespace FormAutoHub.Api.Services;

public sealed record AiPromptGuardResult(bool IsAllowed, string? RejectionReason)
{
    public static AiPromptGuardResult Allowed() => new(true, null);

    public static AiPromptGuardResult Rejected(string reason) => new(false, reason);
}
