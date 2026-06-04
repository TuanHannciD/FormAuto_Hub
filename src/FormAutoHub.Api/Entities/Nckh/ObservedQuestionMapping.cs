namespace FormAutoHub.Api.Entities.Nckh;

public sealed class ObservedQuestionMapping
{
    public Guid Id { get; set; }
    public Guid VariableId { get; set; }
    public Guid FormQuestionId { get; set; }
    public string ObservedCode { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public ResearchVariable Variable { get; set; } = null!;
    public ResearchFormQuestion FormQuestion { get; set; } = null!;
}
