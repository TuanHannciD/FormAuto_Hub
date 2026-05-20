using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace FormAutoHub.Api.Services;

public interface IPayosClient
{
    Task<PayosPaymentLinkResult> CreatePaymentLinkAsync(
        PayosPaymentLinkRequest request,
        PayosCredentials credentials,
        CancellationToken cancellationToken);
}

public sealed class PayosClient(HttpClient httpClient) : IPayosClient
{
    public async Task<PayosPaymentLinkResult> CreatePaymentLinkAsync(
        PayosPaymentLinkRequest request,
        PayosCredentials credentials,
        CancellationToken cancellationToken)
    {
        using var message = new HttpRequestMessage(HttpMethod.Post, "https://api-merchant.payos.vn/v2/payment-requests");
        message.Headers.Add("x-client-id", credentials.ClientId);
        message.Headers.Add("x-api-key", credentials.ApiKey);
        message.Content = JsonContent.Create(new
        {
            orderCode = request.OrderCode,
            amount = request.Amount,
            description = request.Description,
            returnUrl = request.ReturnUrl,
            cancelUrl = request.CancelUrl,
            signature = request.Signature
        });

        var response = await httpClient.SendAsync(message, cancellationToken);
        var responseText = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return PayosPaymentLinkResult.Failed($"PayOS trả HTTP {(int)response.StatusCode}: {responseText}");
        }

        var body = await response.Content.ReadFromJsonAsync<PayosPaymentLinkApiResponse>(cancellationToken);
        var data = body?.Data;
        if (data is null || string.IsNullOrWhiteSpace(data.CheckoutUrl))
        {
            return PayosPaymentLinkResult.Failed($"PayOS không trả checkout URL. Response: {responseText}");
        }

        return PayosPaymentLinkResult.Succeeded(data.PaymentLinkId ?? string.Empty, data.CheckoutUrl);
    }
}

public sealed record PayosCredentials(string ClientId, string ApiKey, string ChecksumKey);

public sealed record PayosPaymentLinkResult(bool Success, string PaymentLinkId, string CheckoutUrl, string ErrorMessage)
{
    public static PayosPaymentLinkResult Succeeded(string paymentLinkId, string checkoutUrl) =>
        new(true, paymentLinkId, checkoutUrl, string.Empty);

    public static PayosPaymentLinkResult Failed(string errorMessage) =>
        new(false, string.Empty, string.Empty, errorMessage);
}

internal sealed record PayosPaymentLinkApiResponse(
    [property: JsonPropertyName("code")] string Code,
    [property: JsonPropertyName("desc")] string Desc,
    [property: JsonPropertyName("data")] PayosPaymentLinkData? Data);

internal sealed record PayosPaymentLinkData(
    [property: JsonPropertyName("paymentLinkId")] string? PaymentLinkId,
    [property: JsonPropertyName("checkoutUrl")] string CheckoutUrl);
