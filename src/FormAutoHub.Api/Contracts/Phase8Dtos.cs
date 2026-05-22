using System.Text.Json;

namespace FormAutoHub.Api.Contracts;

public sealed record CreatePayosTopupOrderRequest(Guid PackageId);

public sealed record CreatePayosTopupOrderResponse(
    Guid TopupOrderId,
    Guid PackageId,
    int Credits,
    decimal Amount,
    string PaymentProvider,
    string CheckoutUrl,
    string PaymentLinkId,
    string Status,
    DateTimeOffset CreatedAt);

public sealed record PayosTopupOrderResult(
    bool Success,
    CreatePayosTopupOrderResponse? Value,
    string ErrorMessage);

public sealed record PayosProviderSettingsResponse(
    string Provider,
    string ClientId,
    bool HasApiKey,
    bool HasChecksumKey,
    string ApiKeyPreview,
    string ChecksumKeyPreview,
    string ReturnUrl,
    string CancelUrl,
    bool IsEnabled,
    DateTimeOffset? LastCheckedAt,
    string LastCheckStatus,
    string LastCheckMessage,
    DateTimeOffset? UpdatedAt);

public sealed record UpdatePayosProviderSettingsRequest(
    string ClientId,
    string? ApiKey,
    string? ChecksumKey,
    string ReturnUrl,
    string CancelUrl,
    bool IsEnabled);

public sealed record CheckPayosProviderSettingsResponse(
    string Status,
    string Message,
    DateTimeOffset CheckedAt);

public sealed record AdminRevenueSummaryResponse(
    decimal TotalRevenue,
    decimal CreditSold,
    decimal CreditUsed,
    int SuccessfulTopupOrders,
    int PendingTopupOrders,
    int FailedPayments,
    IReadOnlyList<AdminPaymentResponse> RecentPayments);

public sealed record AdminPaymentResponse(
    Guid Id,
    Guid TopupOrderId,
    Guid UserId,
    string UserEmail,
    string Provider,
    string ProviderOrderCode,
    string ProviderPaymentLinkId,
    decimal Amount,
    int Credits,
    string Currency,
    string ProviderStatus,
    string TopupOrderStatus,
    DateTimeOffset CreatedAt,
    DateTimeOffset? CompletedAt,
    DateTimeOffset? LastWebhookAt);

public sealed record AdminPaymentListResponse(IReadOnlyList<AdminPaymentResponse> Items);

public sealed record PayosWebhookRequest(
    string Code,
    string Desc,
    bool Success,
    JsonElement Data,
    string Signature);

public sealed record PayosWebhookResponse(bool Applied, string Status);
