using Microsoft.AspNetCore.DataProtection;

namespace FormAutoHub.Api.Services;

public interface IPaymentSecretProtector
{
    string Protect(string value);
    string Unprotect(string value);
    string Preview(string encryptedValue);
}

public sealed class PaymentSecretProtector(IDataProtectionProvider dataProtectionProvider) : IPaymentSecretProtector
{
    private readonly IDataProtector _protector = dataProtectionProvider.CreateProtector("FormAutoHub.Payments");

    public string Protect(string value) => _protector.Protect(value);

    public string Unprotect(string value) => _protector.Unprotect(value);

    public string Preview(string encryptedValue)
    {
        if (string.IsNullOrWhiteSpace(encryptedValue))
        {
            return string.Empty;
        }

        var value = Unprotect(encryptedValue);
        return value.Length <= 4 ? "****" : $"****{value[^4..]}";
    }
}
