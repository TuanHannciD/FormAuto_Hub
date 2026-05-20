using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FormAutoHub.Api.Contracts;

namespace FormAutoHub.Api.Services;

public interface IPayosSignatureService
{
    string SignPaymentRequest(PayosPaymentLinkRequest request, string checksumKey);
    bool VerifyWebhook(PayosWebhookRequest request, string checksumKey);
}

public sealed class PayosSignatureService : IPayosSignatureService
{
    public string SignPaymentRequest(PayosPaymentLinkRequest request, string checksumKey)
    {
        var data = string.Join("&",
            $"amount={request.Amount.ToString(CultureInfo.InvariantCulture)}",
            $"cancelUrl={request.CancelUrl}",
            $"description={request.Description}",
            $"orderCode={request.OrderCode}",
            $"returnUrl={request.ReturnUrl}");
        return ComputeHmac(data, checksumKey);
    }

    public bool VerifyWebhook(PayosWebhookRequest request, string checksumKey)
    {
        if (request.Data.ValueKind != JsonValueKind.Object)
        {
            return false;
        }

        var fields = new SortedDictionary<string, string>(StringComparer.Ordinal);
        foreach (var property in request.Data.EnumerateObject())
        {
            fields[property.Name] = ToPayosSignatureValue(property.Value);
        }

        var data = string.Join("&", fields.Select(item => $"{item.Key}={item.Value}"));
        var expected = ComputeHmac(data, checksumKey);
        return string.Equals(expected, request.Signature, StringComparison.OrdinalIgnoreCase);
    }

    private static string ToPayosSignatureValue(JsonElement value) =>
        value.ValueKind switch
        {
            JsonValueKind.String => value.GetString() ?? string.Empty,
            JsonValueKind.Number => value.GetRawText(),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            JsonValueKind.Null => string.Empty,
            _ => value.GetRawText()
        };

    private static string ComputeHmac(string data, string checksumKey)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(checksumKey));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}

public sealed record PayosPaymentLinkRequest(
    long OrderCode,
    long Amount,
    string Description,
    string ReturnUrl,
    string CancelUrl,
    string Signature);
