namespace FormAutoHub.Api.Entities;

public sealed class GeneratedResponse
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string PayloadJson { get; set; } = string.Empty;
    public string PreviewText { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}
