namespace FormAutoHub.Api.Contracts;

public sealed record AiProviderSettingsResponse(
    string Provider,
    string DisplayName,
    bool HasApiKey,
    string ApiKeyPreview,
    string BaseUrl,
    string DefaultModel,
    IReadOnlyList<string> AllowedModels,
    bool IsEnabled,
    DateTimeOffset? LastCheckedAt,
    string LastCheckStatus,
    string LastCheckMessage,
    DateTimeOffset? UpdatedAt);

public sealed record UpdateAiProviderSettingsRequest(
    string Provider,
    string? ApiKey,
    string DefaultModel,
    bool IsEnabled,
    string? BaseUrl = null);

public sealed record CheckAiProviderSettingsResponse(
    string Status,
    string Message,
    DateTimeOffset CheckedAt);
