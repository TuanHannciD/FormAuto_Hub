namespace FormAutoHub.Api.Entities;

public sealed class PaymentRecord
{
    public Guid Id { get; set; }
    public Guid TopupOrderId { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string ProviderOrderCode { get; set; } = string.Empty;
    public string ProviderPaymentLinkId { get; set; } = string.Empty;
    public string CheckoutUrl { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string ProviderStatus { get; set; } = string.Empty;
    public DateTimeOffset? SignatureVerifiedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset? LastWebhookAt { get; set; }
    public string RawPayloadJson { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public TopupOrder? TopupOrder { get; set; }
}
