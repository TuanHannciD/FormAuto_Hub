namespace FormAutoHub.Api.Integrations.AI;

public sealed class DisabledAiProviderAdapter : IAiProviderAdapter
{
    public Task<AiProviderGenerateResult> GenerateAsync(
        AiProviderGenerateRequest request,
        CancellationToken cancellationToken)
    {
        throw new InvalidOperationException("AI provider adapter is not configured for runtime generation.");
    }
}
