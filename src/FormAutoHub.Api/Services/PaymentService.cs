using System.Globalization;
using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface IPaymentService
{
    Task<PayosTopupOrderResult> CreatePayosTopupOrderAsync(
        CreatePayosTopupOrderRequest request,
        CancellationToken cancellationToken);
    Task<PayosWebhookResponse> HandlePayosWebhookAsync(PayosWebhookRequest request, CancellationToken cancellationToken);
}

public sealed class PaymentService(
    FormAutoHubDbContext dbContext,
    ICurrentUserContext currentUser,
    IPaymentProviderSettingsService settingsService,
    IPayosSignatureService signatureService,
    IPayosClient payosClient,
    ICreditService creditService)
    : IPaymentService
{
    public async Task<PayosTopupOrderResult> CreatePayosTopupOrderAsync(
        CreatePayosTopupOrderRequest request,
        CancellationToken cancellationToken)
    {
        var package = await dbContext.CreditPackages
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == request.PackageId && item.IsActive, cancellationToken);
        if (package is null)
        {
            return new PayosTopupOrderResult(false, null, "Gói credit không tồn tại hoặc đã tắt.");
        }

        var settings = await settingsService.GetEnabledPayosCredentialsAsync(cancellationToken);
        if (settings is null)
        {
            return new PayosTopupOrderResult(false, null, "PayOS chưa được bật hoặc thiếu cấu hình bắt buộc.");
        }

        if (package.Price <= 0 || package.Price != decimal.Truncate(package.Price))
        {
            return new PayosTopupOrderResult(false, null, "PayOS chỉ hỗ trợ số tiền VND nguyên cho gói credit.");
        }

        var now = DateTimeOffset.UtcNow;
        var orderCode = GenerateOrderCode();
        var description = $"Nap credit {package.Credits}";
        var payosAmount = decimal.ToInt64(package.Price);
        var linkRequestWithoutSignature = new PayosPaymentLinkRequest(
            orderCode,
            payosAmount,
            description,
            settings.Value.Setting.ReturnUrl,
            settings.Value.Setting.CancelUrl,
            string.Empty);
        var signature = signatureService.SignPaymentRequest(linkRequestWithoutSignature, settings.Value.Credentials.ChecksumKey);
        var linkRequest = linkRequestWithoutSignature with { Signature = signature };
        var link = await payosClient.CreatePaymentLinkAsync(linkRequest, settings.Value.Credentials, cancellationToken);
        if (!link.Success)
        {
            return new PayosTopupOrderResult(false, null, link.ErrorMessage);
        }

        var order = new TopupOrder
        {
            Id = Guid.NewGuid(),
            UserId = currentUser.UserId,
            PackageId = package.Id,
            Credits = package.Credits,
            Amount = package.Price,
            Status = TopupOrderStatuses.Pending,
            PaymentMethod = PaymentProviders.PayOS,
            PaymentNote = "Đang chờ PayOS xác minh thanh toán.",
            CreatedAt = now
        };
        var payment = new PaymentRecord
        {
            Id = Guid.NewGuid(),
            TopupOrderId = order.Id,
            Provider = PaymentProviders.PayOS,
            ProviderOrderCode = orderCode.ToString(),
            ProviderPaymentLinkId = link.PaymentLinkId,
            CheckoutUrl = link.CheckoutUrl,
            Amount = package.Price,
            Currency = "VND",
            ProviderStatus = PaymentRecordStatuses.Created,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.TopupOrders.Add(order);
        dbContext.PaymentRecords.Add(payment);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new PayosTopupOrderResult(
            true,
            new CreatePayosTopupOrderResponse(
                order.Id,
                order.PackageId,
                order.Credits,
                order.Amount,
                PaymentProviders.PayOS,
                payment.CheckoutUrl,
                payment.ProviderPaymentLinkId,
                order.Status,
                order.CreatedAt),
            string.Empty);
    }

    public async Task<PayosWebhookResponse> HandlePayosWebhookAsync(PayosWebhookRequest request, CancellationToken cancellationToken)
    {
        var settings = await settingsService.GetEnabledPayosCredentialsAsync(cancellationToken);
        if (settings is null)
        {
            return new PayosWebhookResponse(false, "PayOS chưa được cấu hình.");
        }

        if (!signatureService.VerifyWebhook(request, settings.Value.Credentials.ChecksumKey))
        {
            return new PayosWebhookResponse(false, "Chữ ký PayOS không hợp lệ.");
        }

        var webhookData = PayosWebhookDataSnapshot.From(request.Data);
        if (webhookData is null)
        {
            return new PayosWebhookResponse(false, "Dữ liệu PayOS không hợp lệ.");
        }

        var orderCode = webhookData.OrderCode.ToString();
        var payment = await dbContext.PaymentRecords
            .Include(item => item.TopupOrder)
            .SingleOrDefaultAsync(item => item.Provider == PaymentProviders.PayOS && item.ProviderOrderCode == orderCode, cancellationToken);
        if (payment?.TopupOrder is null)
        {
            return new PayosWebhookResponse(false, "Không tìm thấy giao dịch PayOS tương ứng.");
        }

        payment.SignatureVerifiedAt = DateTimeOffset.UtcNow;
        payment.LastWebhookAt = DateTimeOffset.UtcNow;
        payment.RawPayloadJson = JsonSerializer.Serialize(request);
        payment.UpdatedAt = DateTimeOffset.UtcNow;

        if (payment.Amount != webhookData.Amount ||
            !string.Equals(payment.ProviderPaymentLinkId, webhookData.PaymentLinkId, StringComparison.Ordinal))
        {
            payment.ProviderStatus = PaymentRecordStatuses.Failed;
            await dbContext.SaveChangesAsync(cancellationToken);
            return new PayosWebhookResponse(false, "Thông tin thanh toán không khớp.");
        }

        if (payment.TopupOrder.Status == TopupOrderStatuses.Approved)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return new PayosWebhookResponse(false, "Webhook đã được xử lý trước đó.");
        }

        if (payment.TopupOrder.Status != TopupOrderStatuses.Pending || !request.Success)
        {
            payment.ProviderStatus = PaymentRecordStatuses.Failed;
            await dbContext.SaveChangesAsync(cancellationToken);
            return new PayosWebhookResponse(false, "Thanh toán chưa đủ điều kiện cộng credit.");
        }

        payment.ProviderStatus = PaymentRecordStatuses.Paid;
        payment.CompletedAt = DateTimeOffset.UtcNow;
        payment.TopupOrder.Status = TopupOrderStatuses.Approved;
        payment.TopupOrder.PaidAt = payment.CompletedAt;
        payment.TopupOrder.ApprovedAt = payment.CompletedAt;
        payment.TopupOrder.PaymentNote = "PayOS đã xác minh thanh toán.";

        await creditService.AddTopupCreditsAsync(payment.TopupOrder, "PayOS đã xác minh thanh toán.", cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new PayosWebhookResponse(true, TopupOrderStatuses.Approved);
    }

    private static long GenerateOrderCode()
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        return timestamp % 9_000_000_000;
    }

    private sealed record PayosWebhookDataSnapshot(long OrderCode, decimal Amount, string PaymentLinkId)
    {
        public static PayosWebhookDataSnapshot? From(JsonElement data)
        {
            if (data.ValueKind != JsonValueKind.Object ||
                !data.TryGetProperty("orderCode", out var orderCodeElement) ||
                !data.TryGetProperty("amount", out var amountElement) ||
                !data.TryGetProperty("paymentLinkId", out var paymentLinkIdElement))
            {
                return null;
            }

            if (!TryReadInt64(orderCodeElement, out var orderCode) ||
                !TryReadDecimal(amountElement, out var amount))
            {
                return null;
            }

            var paymentLinkId = paymentLinkIdElement.GetString();
            if (string.IsNullOrWhiteSpace(paymentLinkId))
            {
                return null;
            }

            return new PayosWebhookDataSnapshot(orderCode, amount, paymentLinkId);
        }

        private static bool TryReadInt64(JsonElement element, out long value)
        {
            if (element.ValueKind == JsonValueKind.Number)
            {
                return element.TryGetInt64(out value);
            }

            if (element.ValueKind == JsonValueKind.String)
            {
                return long.TryParse(element.GetString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out value);
            }

            value = default;
            return false;
        }

        private static bool TryReadDecimal(JsonElement element, out decimal value)
        {
            if (element.ValueKind == JsonValueKind.Number)
            {
                return element.TryGetDecimal(out value);
            }

            if (element.ValueKind == JsonValueKind.String)
            {
                return decimal.TryParse(element.GetString(), NumberStyles.Number, CultureInfo.InvariantCulture, out value);
            }

            value = default;
            return false;
        }
    }
}
