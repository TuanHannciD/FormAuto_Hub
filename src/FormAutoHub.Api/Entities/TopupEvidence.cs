namespace FormAutoHub.Api.Entities;

public sealed class TopupEvidence
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? TopupOrderId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public byte[] Content { get; set; } = [];
    public long Length { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
