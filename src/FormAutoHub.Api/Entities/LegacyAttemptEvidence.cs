namespace FormAutoHub.Api.Entities;

public sealed class LegacyAttemptEvidence
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid ProjectId { get; set; }
    public Guid ResponseId { get; set; }
    public Guid? LegacySubmissionLogId { get; set; }
    public string LegacyEvidenceHash { get; set; } = string.Empty;
    public string OutcomeKind { get; set; } = string.Empty;
    public string EntitlementState { get; set; } = string.Empty;
    public Guid EvidenceId { get; set; }
    public string EvidenceCode { get; set; } = string.Empty;
    public string ClassifierVersion { get; set; } = string.Empty;
    public string ArtifactReference { get; set; } = string.Empty;
    public string ArtifactSha256 { get; set; } = string.Empty;
    public DateTimeOffset ObservedAt { get; set; }
    public Guid ActorUserId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}
