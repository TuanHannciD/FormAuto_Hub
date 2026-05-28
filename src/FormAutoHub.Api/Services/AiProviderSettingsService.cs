using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface IAiProviderSettingsService
{
    Task<AiProviderSettingsResponse?> GetAsync(CancellationToken cancellationToken);
    Task<AiProviderSettingsResponse?> UpdateAsync(
        UpdateAiProviderSettingsRequest request,
        CancellationToken cancellationToken);
    Task<CheckAiProviderSettingsResponse?> CheckAsync(CancellationToken cancellationToken);
}

public sealed class AiProviderSettingsService(
    FormAutoHubDbContext dbContext,
    IAiProviderSecretProtector secretProtector,
    ICurrentUserContext currentUser)
    : IAiProviderSettingsService
{
    public async Task<AiProviderSettingsResponse?> GetAsync(CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return null;
        }

        var setting = await QuerySettings().SingleOrDefaultAsync(cancellationToken);
        return setting is null ? EmptyResponse() : ToResponse(setting);
    }

    public async Task<AiProviderSettingsResponse?> UpdateAsync(
        UpdateAiProviderSettingsRequest request,
        CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return null;
        }

        var provider = NormalizeRequiredText(request.Provider, "Provider is required.");
        var defaultModel = request.DefaultModel.Trim();
        var baseUrl = NormalizeOptionalBaseUrl(request.BaseUrl);
        ValidateDefaultModel(defaultModel);

        var setting = await QuerySettings().SingleOrDefaultAsync(cancellationToken);
        var now = DateTimeOffset.UtcNow;

        if (setting is null)
        {
            setting = new AiProviderSetting
            {
                Id = Guid.NewGuid(),
                CreatedAt = now
            };
            dbContext.AiProviderSettings.Add(setting);
        }

        var encryptedApiKey = string.IsNullOrWhiteSpace(request.ApiKey)
            ? setting.EncryptedApiKey
            : secretProtector.Protect(request.ApiKey.Trim());

        if (request.IsEnabled && string.IsNullOrWhiteSpace(encryptedApiKey))
        {
            throw new ArgumentException("API key is required before enabling AI provider settings.", nameof(request));
        }

        setting.Provider = provider;
        setting.DisplayName = provider;
        setting.EncryptedApiKey = encryptedApiKey;
        setting.BaseUrl = baseUrl;
        setting.DefaultModel = defaultModel;
        setting.AllowedModelsJson = JsonSerializer.Serialize(new[] { defaultModel });
        setting.IsEnabled = request.IsEnabled;
        setting.UpdatedAt = now;
        setting.UpdatedByUserId = currentUser.UserId;

        await dbContext.SaveChangesAsync(cancellationToken);
        return ToResponse(setting);
    }

    public async Task<CheckAiProviderSettingsResponse?> CheckAsync(CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return null;
        }

        var setting = await QuerySettings().SingleOrDefaultAsync(cancellationToken);
        var now = DateTimeOffset.UtcNow;

        if (setting is null)
        {
            setting = new AiProviderSetting
            {
                Id = Guid.NewGuid(),
                LastCheckStatus = AiProviderCheckStatuses.MissingConfiguration,
                LastCheckMessage = "Missing configuration: provider, API key, and default model.",
                LastCheckedAt = now,
                CreatedAt = now,
                UpdatedAt = now,
                UpdatedByUserId = currentUser.UserId
            };
            dbContext.AiProviderSettings.Add(setting);
            await dbContext.SaveChangesAsync(cancellationToken);
            return new CheckAiProviderSettingsResponse(setting.LastCheckStatus, setting.LastCheckMessage, now);
        }

        var result = EvaluateConfiguration(setting);
        setting.LastCheckedAt = now;
        setting.LastCheckStatus = result.Status;
        setting.LastCheckMessage = result.Message;
        setting.UpdatedAt = now;
        setting.UpdatedByUserId = currentUser.UserId;

        await dbContext.SaveChangesAsync(cancellationToken);
        return new CheckAiProviderSettingsResponse(setting.LastCheckStatus, setting.LastCheckMessage, now);
    }

    private IQueryable<AiProviderSetting> QuerySettings() =>
        dbContext.AiProviderSettings;

    private (string Status, string Message) EvaluateConfiguration(AiProviderSetting setting)
    {
        var missing = new List<string>();
        if (string.IsNullOrWhiteSpace(setting.Provider))
        {
            missing.Add("provider");
        }

        if (string.IsNullOrWhiteSpace(setting.EncryptedApiKey))
        {
            missing.Add("API key");
        }

        if (string.IsNullOrWhiteSpace(setting.DefaultModel))
        {
            missing.Add("default model");
        }

        if (missing.Count > 0)
        {
            return (AiProviderCheckStatuses.MissingConfiguration, $"Missing configuration: {string.Join(", ", missing)}.");
        }

        try
        {
            NormalizeRequiredText(setting.Provider, "Provider is required.");
            ValidateDefaultModel(setting.DefaultModel.Trim());
        }
        catch (ArgumentException exception)
        {
            return (AiProviderCheckStatuses.InvalidConfiguration, exception.Message);
        }

        return (AiProviderCheckStatuses.Ready, "AI provider configuration has the required local settings.");
    }

    private AiProviderSettingsResponse ToResponse(AiProviderSetting setting) =>
        new(
            setting.Provider,
            setting.DisplayName,
            !string.IsNullOrWhiteSpace(setting.EncryptedApiKey),
            secretProtector.Preview(setting.EncryptedApiKey),
            setting.BaseUrl,
            setting.DefaultModel,
            DeserializeAllowedModels(setting.AllowedModelsJson),
            setting.IsEnabled,
            setting.LastCheckedAt,
            string.IsNullOrWhiteSpace(setting.LastCheckStatus)
                ? AiProviderCheckStatuses.NotChecked
                : setting.LastCheckStatus,
            setting.LastCheckMessage,
            setting.UpdatedAt);

    private static AiProviderSettingsResponse EmptyResponse() =>
        new(
            string.Empty,
            string.Empty,
            false,
            string.Empty,
            string.Empty,
            string.Empty,
            [],
            false,
            null,
            AiProviderCheckStatuses.NotChecked,
            "AI provider settings have not been configured.",
            null);

    private static string NormalizeRequiredText(string value, string message)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException(message, nameof(value));
        }

        return value.Trim();
    }

    private static string NormalizeOptionalBaseUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var normalized = value.Trim().TrimEnd('/');
        if (!Uri.TryCreate(normalized, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new ArgumentException("Base URL must be an absolute http or https URL.", nameof(value));
        }

        return uri.ToString().TrimEnd('/');
    }

    private static void ValidateDefaultModel(string defaultModel)
    {
        if (string.IsNullOrWhiteSpace(defaultModel))
        {
            throw new ArgumentException("Default model is required.", nameof(defaultModel));
        }
    }

    private static IReadOnlyList<string> DeserializeAllowedModels(string allowedModelsJson)
    {
        if (string.IsNullOrWhiteSpace(allowedModelsJson))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<IReadOnlyList<string>>(allowedModelsJson) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
