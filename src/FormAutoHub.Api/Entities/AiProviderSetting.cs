namespace FormAutoHub.Api.Entities;

public sealed class AiProviderSetting
{
    public Guid Id { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string EncryptedApiKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = string.Empty;
    public string DefaultModel { get; set; } = string.Empty;
    public string AllowedModelsJson { get; set; } = "[]";
    public bool IsEnabled { get; set; }
    public DateTimeOffset? LastCheckedAt { get; set; }
    public string LastCheckStatus { get; set; } = string.Empty;
    public string LastCheckMessage { get; set; } = string.Empty;
    public Guid? UpdatedByUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
