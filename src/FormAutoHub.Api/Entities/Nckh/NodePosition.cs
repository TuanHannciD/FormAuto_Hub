namespace FormAutoHub.Api.Entities.Nckh;

public sealed class NodePosition
{
    public Guid Id { get; set; }
    public Guid ModelId { get; set; }
    public string NodeType { get; set; } = string.Empty;
    public Guid? VariableId { get; set; }
    public Guid? RelationId { get; set; }
    public decimal PositionX { get; set; }
    public decimal PositionY { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public ResearchModel Model { get; set; } = null!;
    public ResearchVariable? Variable { get; set; }
    public ModelRelation? Relation { get; set; }
}
