namespace FormAutoHub.Api.Entities;

public sealed class SubmissionJob
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid? UserId { get; set; }
    public Guid? CommandId { get; set; }
    public Guid? GenerationBatchId { get; set; }
    public string? RequestFingerprint { get; set; }
    public int? ContractVersion { get; set; }
    public string? RouteKind { get; set; }
    public string? PricingPolicy { get; set; }
    public DateTimeOffset? RunnerAcknowledgedAt { get; set; }
    public byte[] RowVersion { get; set; } = [];
    public int? UnknownCount { get; set; }
    public int? NotDispatchedCount { get; set; }
    public int? HeldCount { get; set; }
    public int Total { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public string Status { get; set; } = string.Empty;
    public int RateLimitPerMinute { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? FinishedAt { get; set; }
}
