namespace FormAutoHub.Api.Entities;

public sealed class AuditLog
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string TargetType { get; set; } = string.Empty;
    public Guid? TargetId { get; set; }
    public string MetadataJson { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}
