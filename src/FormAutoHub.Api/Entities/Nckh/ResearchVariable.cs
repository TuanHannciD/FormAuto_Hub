namespace FormAutoHub.Api.Entities.Nckh;

public sealed class ResearchVariable
{
    public Guid Id { get; set; }
    public Guid ModelId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string VariableType { get; set; } = string.Empty;
    public string ScaleType { get; set; } = string.Empty;
    public int? ScalePoint { get; set; }
    public decimal? MinValue { get; set; }
    public decimal? MaxValue { get; set; }
    public int SortOrder { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public ResearchModel Model { get; set; } = null!;
    public ICollection<ObservedQuestionMapping> ObservedQuestionMappings { get; set; } = new List<ObservedQuestionMapping>();
}
