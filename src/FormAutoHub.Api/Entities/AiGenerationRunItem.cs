namespace FormAutoHub.Api.Entities;

public sealed class AiGenerationRunItem
{
    public Guid Id { get; set; }
    public Guid RunId { get; set; }
    public Guid? QuestionId { get; set; }
    public Guid? GeneratedResponseId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string RawAnswerJson { get; set; } = string.Empty;
    public string ValidationMessage { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }

    public AiGenerationRun? Run { get; set; }
    public FormQuestion? Question { get; set; }
    public GeneratedResponse? GeneratedResponse { get; set; }
}
