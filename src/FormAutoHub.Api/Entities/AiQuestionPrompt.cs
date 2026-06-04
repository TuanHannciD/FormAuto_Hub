namespace FormAutoHub.Api.Entities;

public sealed class AiQuestionPrompt
{
    public Guid Id { get; set; }
    public Guid ProfileId { get; set; }
    public Guid QuestionId { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public bool UseAi { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public AiPromptProfile? Profile { get; set; }
    public FormQuestion? Question { get; set; }
}
