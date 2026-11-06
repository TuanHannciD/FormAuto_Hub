namespace FormAutoHub.Api.Entities;

public sealed class GenerationBatch
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid ProjectId { get; set; }
    public string Mode { get; set; } = string.Empty;
    public string PricingPolicy { get; set; } = string.Empty;
    public int RequestedCount { get; set; }
    public int GeneratedCount { get; set; }
    public int GenerationCredits { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? EvictedAt { get; set; }
    public string FormName { get; set; } = string.Empty;
    public string FormUrl { get; set; } = string.Empty;
    public string FormActionUrl { get; set; } = string.Empty;
    public string ObservedMetadataJson { get; set; } = string.Empty;
    public string ObservedMetadataSha256 { get; set; } = string.Empty;
    public Guid? AiGenerationRunId { get; set; }
    public string? LegacyGroupingEvidence { get; set; }
}
