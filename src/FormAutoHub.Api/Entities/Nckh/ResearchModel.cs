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
}
