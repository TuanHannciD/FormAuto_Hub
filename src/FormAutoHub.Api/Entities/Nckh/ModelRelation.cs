namespace FormAutoHub.Api.Entities.Nckh;

public sealed class ModelRelation
{
    public Guid Id { get; set; }
    public Guid ModelId { get; set; }
    public Guid FromVariableId { get; set; }
    public Guid ToVariableId { get; set; }
    public string Direction { get; set; } = string.Empty;
    public string HypothesisCode { get; set; } = string.Empty;
    public string HypothesisText { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public ResearchModel Model { get; set; } = null!;
    public ResearchVariable FromVariable { get; set; } = null!;
    public ResearchVariable ToVariable { get; set; } = null!;
    public ICollection<NodePosition> NodePositions { get; set; } = new List<NodePosition>();
}
