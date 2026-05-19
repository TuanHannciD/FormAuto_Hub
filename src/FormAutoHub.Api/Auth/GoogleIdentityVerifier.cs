using Google.Apis.Auth;
using Microsoft.Extensions.Options;

namespace FormAutoHub.Api.Auth;

public sealed record GoogleIdentity(
    string ProviderUserId,
    string Email,
    bool EmailVerified,
    string FullName);

public interface IGoogleIdentityVerifier
{
    Task<GoogleIdentity?> VerifyAsync(string idToken, CancellationToken cancellationToken);
}

public sealed class GoogleIdentityVerifier(IOptions<AuthOptions> options) : IGoogleIdentityVerifier
{
    public async Task<GoogleIdentity?> VerifyAsync(string idToken, CancellationToken cancellationToken)
    {
        var googleClientId = options.Value.GoogleClientId;
        if (string.IsNullOrWhiteSpace(googleClientId))
        {
            return null;
        }

        var settings = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = [googleClientId]
        };

        var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
        return new GoogleIdentity(
            payload.Subject,
            payload.Email,
            payload.EmailVerified,
            payload.Name ?? payload.Email);
    }
}
