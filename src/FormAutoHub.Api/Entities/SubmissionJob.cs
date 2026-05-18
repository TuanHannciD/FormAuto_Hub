namespace FormAutoHub.Api.Entities;

public sealed class SubmissionJob
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public int Total { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public string Status { get; set; } = string.Empty;
    public int RateLimitPerMinute { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? FinishedAt { get; set; }
}
