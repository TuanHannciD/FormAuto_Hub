namespace FormAutoHub.Api.Entities;

public sealed class FormProject
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FormUrl { get; set; } = string.Empty;
    public string FormTitle { get; set; } = string.Empty;
    public string FormActionUrl { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}
