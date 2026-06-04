namespace FormAutoHub.Api.Entities.Nckh;

public sealed class ResearchFormQuestion
{
    public Guid Id { get; set; }
    public Guid FormId { get; set; }
    public string GoogleQuestionId { get; set; } = string.Empty;
    public string QuestionText { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
    public int OrderIndex { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public ResearchForm Form { get; set; } = null!;
    public ICollection<ObservedQuestionMapping> ObservedQuestionMappings { get; set; } = new List<ObservedQuestionMapping>();
}
