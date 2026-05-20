using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Services;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace FormAutoHub.Tests;

public sealed class Phase8PayosPaymentTests
{
    [Fact]
    public async Task CreatePayosTopupOrderAsync_CreatesPaymentRecordWithoutGrantingCredit()
    {
        var userId = Guid.NewGuid();
        var packageId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedUserAndPackage(context, userId, packageId);
        await SeedPayosSettingsAsync(context, userId);

        var service = CreatePaymentService(context, userId);

        var result = await service.CreatePayosTopupOrderAsync(new CreatePayosTopupOrderRequest(packageId), CancellationToken.None);

        Assert.True(result.Success);
        Assert.NotNull(result.Value);
        Assert.Equal(TopupOrderStatuses.Pending, result.Value.Status);
        Assert.Equal("https://checkout.payos.test", result.Value.CheckoutUrl);
        Assert.Empty(await context.CreditTransactions.ToListAsync());
        Assert.Equal(0, await context.UserCreditAccounts.CountAsync());
        Assert.Single(await context.PaymentRecords.ToListAsync());
    }

    [Fact]
    public async Task HandlePayosWebhookAsync_InvalidSignature_DoesNotGrantCredit()
    {
        var userId = Guid.NewGuid();
        var packageId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedUserAndPackage(context, userId, packageId);
        await SeedPayosSettingsAsync(context, userId);
        var service = CreatePaymentService(context, userId);
        await service.CreatePayosTopupOrderAsync(new CreatePayosTopupOrderRequest(packageId), CancellationToken.None);
        var payment = await context.PaymentRecords.SingleAsync();

        var webhook = CreateWebhook(payment, "invalid");

        var result = await service.HandlePayosWebhookAsync(webhook, CancellationToken.None);

        Assert.False(result.Applied);
        Assert.Empty(await context.CreditTransactions.ToListAsync());
        Assert.Equal(TopupOrderStatuses.Pending, (await context.TopupOrders.SingleAsync()).Status);
    }

    [Fact]
    public async Task HandlePayosWebhookAsync_ValidPaidWebhook_GrantsCreditOnce()
    {
        var userId = Guid.NewGuid();
        var packageId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedUserAndPackage(context, userId, packageId);
        await SeedPayosSettingsAsync(context, userId);
        var service = CreatePaymentService(context, userId);
        await service.CreatePayosTopupOrderAsync(new CreatePayosTopupOrderRequest(packageId), CancellationToken.None);
        var payment = await context.PaymentRecords.SingleAsync();
        var signatureService = new PayosSignatureService();
        var webhook = CreateWebhook(payment, string.Empty);
        webhook = webhook with { Signature = SignWebhook(signatureService, webhook) };

        var first = await service.HandlePayosWebhookAsync(webhook, CancellationToken.None);
        var second = await service.HandlePayosWebhookAsync(webhook, CancellationToken.None);

        Assert.True(first.Applied);
        Assert.False(second.Applied);
        var order = await context.TopupOrders.SingleAsync();
        Assert.Equal(TopupOrderStatuses.Approved, order.Status);
        var account = await context.UserCreditAccounts.SingleAsync(item => item.UserId == userId);
        Assert.Equal(100, account.Balance);
        var transaction = await context.CreditTransactions.SingleAsync();
        Assert.Equal(CreditTransactionTypes.TopupApproved, transaction.Type);
        Assert.Equal(order.Id, transaction.ReferenceId);
    }

    private static PaymentService CreatePaymentService(FormAutoHubDbContext context, Guid userId)
    {
        var currentUser = new TestCurrentUserContext(userId, true);
        var secretProtector = new TestSecretProtector();
        var settingsService = new PaymentProviderSettingsService(context, secretProtector, currentUser);
        return new PaymentService(
            context,
            currentUser,
            settingsService,
            new PayosSignatureService(),
            new TestPayosClient(),
            new CreditService(context));
    }

    private static async Task SeedPayosSettingsAsync(FormAutoHubDbContext context, Guid userId)
    {
        var settingsService = new PaymentProviderSettingsService(
            context,
            new TestSecretProtector(),
            new TestCurrentUserContext(userId, true));
        await settingsService.UpdatePayosAsync(
            new UpdatePayosProviderSettingsRequest(
                "client",
                "api-key",
                "checksum",
                "https://app.test/payment/return",
                "https://app.test/payment/cancel",
                true),
            CancellationToken.None);
    }

    private static PayosWebhookRequest CreateWebhook(PaymentRecord payment, string signature) =>
        new(
            "00",
            "success",
            true,
            CreateWebhookData(payment),
            signature);

    private static JsonElement CreateWebhookData(PaymentRecord payment)
    {
        var json = JsonSerializer.Serialize(new
        {
            orderCode = long.Parse(payment.ProviderOrderCode),
            amount = payment.Amount,
            description = "Nap credit 100",
            accountNumber = "12345678",
            reference = "ref",
            transactionDateTime = "2026-05-20 10:00:00",
            currency = payment.Currency,
            paymentLinkId = payment.ProviderPaymentLinkId,
            code = "00",
            desc = "Thành công",
            counterAccountBankId = "",
            counterAccountBankName = "",
            counterAccountName = "",
            counterAccountNumber = "",
            virtualAccountName = "",
            virtualAccountNumber = ""
        });
        using var document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }

    private static string SignWebhook(PayosSignatureService signatureService, PayosWebhookRequest webhook)
    {
        var fields = new SortedDictionary<string, string>(StringComparer.Ordinal);
        foreach (var property in webhook.Data.EnumerateObject())
        {
            fields[property.Name] = property.Value.ValueKind == JsonValueKind.String
                ? property.Value.GetString() ?? string.Empty
                : property.Value.GetRawText();
        }

        var data = string.Join("&", fields.Select(item => $"{item.Key}={item.Value}"));
        using var hmac = new System.Security.Cryptography.HMACSHA256(System.Text.Encoding.UTF8.GetBytes("checksum"));
        return Convert.ToHexString(hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(data))).ToLowerInvariant();
    }

    private static void SeedUserAndPackage(FormAutoHubDbContext context, Guid userId, Guid packageId)
    {
        context.Users.Add(new User
        {
            Id = userId,
            Email = "user@example.test",
            PasswordHash = "hash",
            FullName = "Test User",
            Role = UserRoles.User,
            CreatedAt = DateTimeOffset.UtcNow
        });
        context.CreditPackages.Add(new CreditPackage
        {
            Id = packageId,
            Name = "Starter",
            Credits = 100,
            Price = 100000,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow
        });
        context.SaveChanges();
    }

    private static FormAutoHubDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new FormAutoHubDbContext(options);
    }

    private sealed class TestCurrentUserContext(Guid userId, bool isAdmin) : ICurrentUserContext
    {
        public Guid UserId => userId;
        public bool IsAdmin => isAdmin;
    }

    private sealed class TestSecretProtector : IPaymentSecretProtector
    {
        public string Protect(string value) => value;
        public string Unprotect(string value) => value;
        public string Preview(string encryptedValue) => string.IsNullOrWhiteSpace(encryptedValue) ? string.Empty : "****test";
    }

    private sealed class TestPayosClient : IPayosClient
    {
        public Task<PayosPaymentLinkResult> CreatePaymentLinkAsync(
            PayosPaymentLinkRequest request,
            PayosCredentials credentials,
            CancellationToken cancellationToken) =>
            Task.FromResult(PayosPaymentLinkResult.Succeeded("payos-link-1", "https://checkout.payos.test"));
    }
}
