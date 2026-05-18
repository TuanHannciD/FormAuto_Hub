namespace FormAutoHub.Api.Entities;

public sealed class AnswerRule
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid QuestionId { get; set; }
    public string Mode { get; set; } = string.Empty;
    public string ConfigJson { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}
