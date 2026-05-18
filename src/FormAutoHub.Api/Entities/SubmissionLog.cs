namespace FormAutoHub.Api.Entities;

public sealed class SubmissionLog
{
    public Guid Id { get; set; }
    public Guid JobId { get; set; }
    public Guid ResponseId { get; set; }
    public string PayloadJson { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string ErrorMessage { get; set; } = string.Empty;
    public DateTimeOffset? SubmittedAt { get; set; }
}
