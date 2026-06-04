namespace FormAutoHub.Api.Entities;

public sealed class GeneratedResponse
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string PayloadJson { get; set; } = string.Empty;
    public string PreviewText { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public bool IsReadOnly { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
