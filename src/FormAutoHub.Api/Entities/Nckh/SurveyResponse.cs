namespace FormAutoHub.Api.Entities.Nckh;

public sealed class SurveyResponse
{
    public Guid Id { get; set; }
    public Guid ModelId { get; set; }
    public string GoogleResponseId { get; set; } = string.Empty;
    public string? RespondentId { get; set; }
    public string RawDataJson { get; set; } = string.Empty;
    public DateTimeOffset? ResponseTimestamp { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public ResearchModel Model { get; set; } = null!;
    public ICollection<NormalizedDataset> NormalizedDatasets { get; set; } = new List<NormalizedDataset>();
}
