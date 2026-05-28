namespace FormAutoHub.Api.Entities;

public sealed class AiPromptProfile
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid UserId { get; set; }
    public string Mode { get; set; } = string.Empty;
    public string AudienceJson { get; set; } = string.Empty;
    public string GlobalPrompt { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public FormProject? Project { get; set; }
}
