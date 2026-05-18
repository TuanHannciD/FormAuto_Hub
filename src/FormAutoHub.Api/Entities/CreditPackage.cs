namespace FormAutoHub.Api.Entities;

public sealed class CreditPackage
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Credits { get; set; }
    public decimal Price { get; set; }
    public bool IsActive { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
