namespace FormAutoHub.Api.Entities;

public sealed class AiGenerationRun
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid ProjectId { get; set; }
    public Guid? PromptProfileId { get; set; }
    public string Mode { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int RequestedCount { get; set; }
    public int GeneratedCount { get; set; }
    public int Multiplier { get; set; }
    public int CreditsUsed { get; set; }
    public string RawProviderRequestJson { get; set; } = string.Empty;
    public string RawProviderResponseJson { get; set; } = string.Empty;
    public string PromptSnapshotJson { get; set; } = string.Empty;
    public string QuestionSnapshotJson { get; set; } = string.Empty;
    public string ValidationSummaryJson { get; set; } = string.Empty;
    public string ErrorMessage { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }

    public FormProject? Project { get; set; }
    public AiPromptProfile? PromptProfile { get; set; }
}
