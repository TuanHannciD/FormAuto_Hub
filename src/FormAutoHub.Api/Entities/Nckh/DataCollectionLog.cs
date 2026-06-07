namespace FormAutoHub.Api.Entities.Nckh;

public sealed class DataCollectionLog
{
    public Guid Id { get; set; }
    public Guid ModelId { get; set; }
    public string Status { get; set; } = string.Empty;
    public int ResponsesCollected { get; set; }
    public int ResponsesSkipped { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public ResearchModel Model { get; set; } = null!;
}
