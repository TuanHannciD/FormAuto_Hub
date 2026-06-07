namespace FormAutoHub.Api.Entities.Nckh;

public sealed class ResearchForm
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string GoogleFormId { get; set; } = string.Empty;
    public string FormUrl { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = "Draft";
    public Guid? GeneratedFromModelId { get; set; }
    public string GenerationSource { get; set; } = "Imported";
    public DateTimeOffset ImportedAt { get; set; }
    public DateTimeOffset? LastGeneratedAt { get; set; }
    public DateTimeOffset? LastSyncedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<ResearchFormQuestion> Questions { get; set; } = new List<ResearchFormQuestion>();
    public ICollection<ResearchModel> Models { get; set; } = new List<ResearchModel>();
    public ResearchModel? GeneratedFromModel { get; set; }
}
