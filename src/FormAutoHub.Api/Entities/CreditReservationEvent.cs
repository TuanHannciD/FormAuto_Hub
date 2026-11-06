namespace FormAutoHub.Api.Entities;

public sealed class CreditReservationEvent
{
    public Guid Id { get; set; }
    public Guid ReservationId { get; set; }
    public Guid? ItemId { get; set; }
    public Guid? EvidenceId { get; set; }
    public Guid? CreditTransactionId { get; set; }
    public Guid? ActorUserId { get; set; }
    public int Sequence { get; set; }
    public string Kind { get; set; } = string.Empty;
    public decimal OutstandingDelta { get; set; }
    public decimal SettledDelta { get; set; }
    public decimal ReleasedDelta { get; set; }
    public string? AttemptStateAfter { get; set; }
    public string? SettlementStateAfter { get; set; }
    public string? EvidenceCode { get; set; }
    public string? ClassifierVersion { get; set; }
    public string? ArtifactReference { get; set; }
    public string? ArtifactSha256 { get; set; }
    public DateTimeOffset? ObservedAt { get; set; }
    public string? Reason { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
