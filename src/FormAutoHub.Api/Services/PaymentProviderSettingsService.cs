using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface IPaymentProviderSettingsService
{
    Task<PayosProviderSettingsResponse> GetPayosAsync(CancellationToken cancellationToken);
    Task<PayosProviderSettingsResponse> UpdatePayosAsync(
        UpdatePayosProviderSettingsRequest request,
        CancellationToken cancellationToken);
    Task<CheckPayosProviderSettingsResponse> CheckPayosAsync(CancellationToken cancellationToken);
    Task<(PaymentProviderSetting Setting, PayosCredentials Credentials)?> GetEnabledPayosCredentialsAsync(CancellationToken cancellationToken);
}

public sealed class PaymentProviderSettingsService(
    FormAutoHubDbContext dbContext,
    IPaymentSecretProtector secretProtector,
    ICurrentUserContext currentUser)
    : IPaymentProviderSettingsService
{
    public async Task<PayosProviderSettingsResponse> GetPayosAsync(CancellationToken cancellationToken)
    {
        var setting = await QueryPayos().SingleOrDefaultAsync(cancellationToken);
        return setting is null ? EmptyResponse() : ToResponse(setting);
    }

    public async Task<PayosProviderSettingsResponse> UpdatePayosAsync(
        UpdatePayosProviderSettingsRequest request,
        CancellationToken cancellationToken)
    {
        var setting = await QueryPayos().SingleOrDefaultAsync(cancellationToken);
        var now = DateTimeOffset.UtcNow;

        if (setting is null)
        {
            setting = new PaymentProviderSetting
            {
                Id = Guid.NewGuid(),
                Provider = PaymentProviders.PayOS,
                CreatedAt = now
            };
            dbContext.PaymentProviderSettings.Add(setting);
        }

        setting.ClientId = request.ClientId.Trim();
        setting.ReturnUrl = request.ReturnUrl.Trim();
        setting.CancelUrl = request.CancelUrl.Trim();
        setting.IsEnabled = request.IsEnabled;
        setting.UpdatedAt = now;
        setting.UpdatedByUserId = currentUser.UserId;

        if (!string.IsNullOrWhiteSpace(request.ApiKey))
        {
            setting.EncryptedApiKey = secretProtector.Protect(request.ApiKey.Trim());
        }

        if (!string.IsNullOrWhiteSpace(request.ChecksumKey))
        {
            setting.EncryptedChecksumKey = secretProtector.Protect(request.ChecksumKey.Trim());
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return ToResponse(setting);
    }

    public async Task<CheckPayosProviderSettingsResponse> CheckPayosAsync(CancellationToken cancellationToken)
    {
        var setting = await QueryPayos().SingleOrDefaultAsync(cancellationToken);
        var now = DateTimeOffset.UtcNow;
        var missing = new List<string>();

        if (setting is null || string.IsNullOrWhiteSpace(setting.ClientId))
        {
            missing.Add("Client ID");
        }

        if (setting is null || string.IsNullOrWhiteSpace(setting.EncryptedApiKey))
        {
            missing.Add("API key");
        }

        if (setting is null || string.IsNullOrWhiteSpace(setting.EncryptedChecksumKey))
        {
            missing.Add("Checksum key");
        }

        if (setting is null || string.IsNullOrWhiteSpace(setting.ReturnUrl))
        {
            missing.Add("Return URL");
        }

        if (setting is null || string.IsNullOrWhiteSpace(setting.CancelUrl))
        {
            missing.Add("Cancel URL");
        }

        if (setting is null)
        {
            setting = new PaymentProviderSetting
            {
                Id = Guid.NewGuid(),
                Provider = PaymentProviders.PayOS,
                CreatedAt = now
            };
            dbContext.PaymentProviderSettings.Add(setting);
        }

        setting.LastCheckedAt = now;
        setting.LastCheckStatus = missing.Count == 0
            ? PaymentProviderCheckStatuses.Ready
            : PaymentProviderCheckStatuses.MissingConfiguration;
        setting.LastCheckMessage = missing.Count == 0
            ? "Cấu hình PayOS đã đủ thông tin bắt buộc."
            : $"Thiếu cấu hình: {string.Join(", ", missing)}.";
        setting.UpdatedAt = now;
        setting.UpdatedByUserId = currentUser.UserId;

        await dbContext.SaveChangesAsync(cancellationToken);
        return new CheckPayosProviderSettingsResponse(setting.LastCheckStatus, setting.LastCheckMessage, now);
    }

    public async Task<(PaymentProviderSetting Setting, PayosCredentials Credentials)?> GetEnabledPayosCredentialsAsync(CancellationToken cancellationToken)
    {
        var setting = await QueryPayos()
            .AsNoTracking()
            .SingleOrDefaultAsync(cancellationToken);
        if (setting is null ||
            !setting.IsEnabled ||
            string.IsNullOrWhiteSpace(setting.ClientId) ||
            string.IsNullOrWhiteSpace(setting.EncryptedApiKey) ||
            string.IsNullOrWhiteSpace(setting.EncryptedChecksumKey) ||
            string.IsNullOrWhiteSpace(setting.ReturnUrl) ||
            string.IsNullOrWhiteSpace(setting.CancelUrl))
        {
            return null;
        }

        return (setting, new PayosCredentials(
            setting.ClientId,
            secretProtector.Unprotect(setting.EncryptedApiKey),
            secretProtector.Unprotect(setting.EncryptedChecksumKey)));
    }

    private IQueryable<PaymentProviderSetting> QueryPayos() =>
        dbContext.PaymentProviderSettings.Where(item => item.Provider == PaymentProviders.PayOS);

    private PayosProviderSettingsResponse ToResponse(PaymentProviderSetting setting) =>
        new(
            setting.Provider,
            setting.ClientId,
            !string.IsNullOrWhiteSpace(setting.EncryptedApiKey),
            !string.IsNullOrWhiteSpace(setting.EncryptedChecksumKey),
            secretProtector.Preview(setting.EncryptedApiKey),
            secretProtector.Preview(setting.EncryptedChecksumKey),
            setting.ReturnUrl,
            setting.CancelUrl,
            setting.IsEnabled,
            setting.LastCheckedAt,
            setting.LastCheckStatus,
            setting.LastCheckMessage,
            setting.UpdatedAt);

    private static PayosProviderSettingsResponse EmptyResponse() =>
        new(
            PaymentProviders.PayOS,
            string.Empty,
            false,
            false,
            string.Empty,
            string.Empty,
            string.Empty,
            string.Empty,
            false,
            null,
            PaymentProviderCheckStatuses.NotChecked,
            "Chưa có cấu hình PayOS.",
            null);
}
