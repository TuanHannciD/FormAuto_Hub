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

public sealed class GoogleIdentityVerifier(IOptions<AuthOptions> options, ILogger<GoogleIdentityVerifier>? logger = null) : IGoogleIdentityVerifier
{
    public async Task<GoogleIdentity?> VerifyAsync(string idToken, CancellationToken cancellationToken)
    {
        var authOptions = options.Value;
        var googleClientId = string.IsNullOrWhiteSpace(authOptions.GoogleClientId)
            ? authOptions.GoogleOAuthClientId
            : authOptions.GoogleClientId;

        if (string.IsNullOrWhiteSpace(googleClientId))
        {
            logger?.LogWarning("Google identity verification is unavailable: missing client configuration");
            return null;
        }

        if (string.IsNullOrWhiteSpace(idToken))
        {
            return null;
        }

        var settings = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = [googleClientId]
        };

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
        }
        catch (InvalidJwtException)
        {
            logger?.LogInformation("Google identity verification rejected an invalid identity token");
            return null;
        }

        return new GoogleIdentity(
            payload.Subject,
            payload.Email,
            payload.EmailVerified,
            payload.Name ?? payload.Email);
    }
}
