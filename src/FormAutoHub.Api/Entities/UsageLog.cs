namespace FormAutoHub.Api.Entities;

public sealed class UsageLog
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string ToolName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public int CreditsUsed { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid? ProjectId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
