namespace FormAutoHub.Api.Entities.Nckh;

public sealed class ResearchModel
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid FormId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "Draft";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public ResearchForm Form { get; set; } = null!;
    public ICollection<ResearchVariable> Variables { get; set; } = new List<ResearchVariable>();
    public ICollection<ModelRelation> Relations { get; set; } = new List<ModelRelation>();
    public ICollection<NodePosition> NodePositions { get; set; } = new List<NodePosition>();
    public ICollection<SurveyResponse> SurveyResponses { get; set; } = new List<SurveyResponse>();
    public ICollection<NormalizedDataset> NormalizedDatasets { get; set; } = new List<NormalizedDataset>();
    public ICollection<DataCollectionLog> DataCollectionLogs { get; set; } = new List<DataCollectionLog>();
}
