namespace FormAutoHub.Api.Entities;

public sealed class CreditReservation
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid JobId { get; set; }
    public decimal InitialAmount { get; set; }
    public decimal OutstandingAmount { get; set; }
    public decimal SettledAmount { get; set; }
    public decimal ReleasedAmount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ClosedAt { get; set; }
    public byte[] RowVersion { get; set; } = [];
    public ICollection<CreditReservationEvent> Events { get; set; } = new List<CreditReservationEvent>();
}
