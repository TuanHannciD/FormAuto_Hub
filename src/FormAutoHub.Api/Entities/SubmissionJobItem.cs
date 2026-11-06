namespace FormAutoHub.Api.Entities;

public sealed class SubmissionJobItem
{
    public Guid Id { get; set; }
    public Guid JobId { get; set; }
    public Guid ProjectId { get; set; }
    public Guid ResponseId { get; set; }
    public Guid? GenerationBatchId { get; set; }
    public int Ordinal { get; set; }
    public string PayloadJson { get; set; } = string.Empty;
    public string ObservedMetadataJson { get; set; } = string.Empty;
    public string CompatibilityEvidenceJson { get; set; } = string.Empty;
    public DateTimeOffset CompatibilityCheckedAt { get; set; }
    public string FormActionUrl { get; set; } = string.Empty;
    public string PayloadSha256 { get; set; } = string.Empty;
    public string ObservedMetadataSha256 { get; set; } = string.Empty;
    public string CompatibilityEvidenceSha256 { get; set; } = string.Empty;
    public string PricingPolicy { get; set; } = string.Empty;
    public int MaximumSendCredits { get; set; }
    public string AttemptState { get; set; } = string.Empty;
    public string SettlementState { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? PossibleDispatchAt { get; set; }
    public DateTimeOffset? OutcomeAt { get; set; }
    public Guid? SettlementCreditTransactionId { get; set; }
    public byte[] RowVersion { get; set; } = [];
}
