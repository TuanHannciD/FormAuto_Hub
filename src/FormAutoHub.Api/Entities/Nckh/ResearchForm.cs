namespace FormAutoHub.Api.Entities.Nckh;

public sealed class ResearchForm
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string GoogleFormId { get; set; } = string.Empty;
    public string FormUrl { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = "Draft";
    public DateTimeOffset ImportedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<ResearchFormQuestion> Questions { get; set; } = new List<ResearchFormQuestion>();
}
