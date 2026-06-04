using Microsoft.AspNetCore.DataProtection;

namespace FormAutoHub.Api.Services;

public interface IGoogleTokenProtector
{
    string Protect(string value);
    string Unprotect(string value);
}

public sealed class GoogleTokenProtector(IDataProtectionProvider dataProtectionProvider) : IGoogleTokenProtector
{
    private readonly IDataProtector _protector = dataProtectionProvider.CreateProtector("FormAutoHub.GoogleOAuth");

    public string Protect(string value) => _protector.Protect(value);

    public string Unprotect(string value) => _protector.Unprotect(value);
}
