namespace FormAutoHub.Api.Entities.Nckh;

public sealed class NormalizedDataset
{
    public Guid Id { get; set; }
    public Guid ModelId { get; set; }
    public Guid SurveyResponseId { get; set; }
    public string? RespondentId { get; set; }
    public string NormalizedDataJson { get; set; } = string.Empty;
    public bool IsStale { get; set; }
    public DateTimeOffset NormalizedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public ResearchModel Model { get; set; } = null!;
    public SurveyResponse SurveyResponse { get; set; } = null!;
}
