namespace FormAutoHub.Api.Entities;

public sealed class PaymentProviderSetting
{
    public Guid Id { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string EncryptedApiKey { get; set; } = string.Empty;
    public string EncryptedChecksumKey { get; set; } = string.Empty;
    public string ReturnUrl { get; set; } = string.Empty;
    public string CancelUrl { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public DateTimeOffset? LastCheckedAt { get; set; }
    public string LastCheckStatus { get; set; } = string.Empty;
    public string LastCheckMessage { get; set; } = string.Empty;
    public Guid? UpdatedByUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
