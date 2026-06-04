namespace FormAutoHub.Api.Integrations.AI;

public interface IAiProviderAdapter
{
    Task<AiProviderGenerateResult> GenerateAsync(
        AiProviderGenerateRequest request,
        CancellationToken cancellationToken);
}
