using Microsoft.EntityFrameworkCore;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace FormAutoHub.Api.Services;

public sealed record GoogleOAuthTokens(
    string AccessToken,
    string RefreshToken,
    int ExpiresInSeconds,
    string Scope,
    string TokenType,
    string Email,
    string ProviderUserId);

public interface IGoogleOAuthService
{
    Task<GoogleOAuthTokens?> ExchangeCodeAsync(string authorizationCode, string redirectUri, CancellationToken cancellationToken);
    Task<GoogleOAuthTokens?> RefreshAccessTokenAsync(string refreshToken, CancellationToken cancellationToken);
    Task StoreTokensAsync(Guid userExternalLoginId, GoogleOAuthTokens tokens, CancellationToken cancellationToken);
    Task<string?> GetValidAccessTokenAsync(Guid userId, CancellationToken cancellationToken);
}

public sealed class GoogleOAuthService(
    HttpClient httpClient,
    FormAutoHub.Api.Data.FormAutoHubDbContext dbContext,
    IGoogleTokenProtector tokenProtector,
    Microsoft.Extensions.Options.IOptions<Auth.AuthOptions> authOptions)
    : IGoogleOAuthService
{
    private const string TokenEndpoint = "https://oauth2.googleapis.com/token";
    private const string UserInfoEndpoint = "https://www.googleapis.com/oauth2/v2/userinfo";
    private const string GoogleProvider = "Google";

    public async Task<GoogleOAuthTokens?> ExchangeCodeAsync(string authorizationCode, string redirectUri, CancellationToken cancellationToken)
    {
        var clientId = authOptions.Value.GoogleOAuthClientId;
        var clientSecret = authOptions.Value.GoogleOAuthClientSecret;

        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
        {
            return null;
        }

        var requestBody = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["code"] = authorizationCode,
            ["client_id"] = clientId,
            ["client_secret"] = clientSecret,
            ["redirect_uri"] = redirectUri,
            ["grant_type"] = "authorization_code"
        });

        using var response = await httpClient.PostAsync(TokenEndpoint, requestBody, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        var tokenResponse = await response.Content.ReadFromJsonAsync<GoogleTokenResponse>(cancellationToken: cancellationToken);
        if (tokenResponse?.AccessToken is null)
        {
            return null;
        }

        var (email, providerUserId) = await FetchUserInfoAsync(tokenResponse.AccessToken, cancellationToken);

        return new GoogleOAuthTokens(
            tokenResponse.AccessToken,
            tokenResponse.RefreshToken ?? string.Empty,
            tokenResponse.ExpiresInSeconds,
            tokenResponse.Scope ?? string.Empty,
            tokenResponse.TokenType ?? "Bearer",
            email ?? string.Empty,
            providerUserId ?? string.Empty);
    }

    public async Task<GoogleOAuthTokens?> RefreshAccessTokenAsync(
        string refreshToken,
        CancellationToken cancellationToken)
    {
        var clientId = authOptions.Value.GoogleOAuthClientId;
        var clientSecret = authOptions.Value.GoogleOAuthClientSecret;

        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
        {
            return null;
        }

        var requestBody = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["refresh_token"] = refreshToken,
            ["client_id"] = clientId,
            ["client_secret"] = clientSecret,
            ["grant_type"] = "refresh_token"
        });

        using var response = await httpClient.PostAsync(TokenEndpoint, requestBody, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        var tokenResponse = await response.Content.ReadFromJsonAsync<GoogleTokenResponse>(cancellationToken: cancellationToken);
        if (tokenResponse?.AccessToken is null)
        {
            return null;
        }

        var (email, providerUserId) = await FetchUserInfoAsync(tokenResponse.AccessToken, cancellationToken);

        return new GoogleOAuthTokens(
            tokenResponse.AccessToken,
            refreshToken,
            tokenResponse.ExpiresInSeconds,
            tokenResponse.Scope ?? string.Empty,
            tokenResponse.TokenType ?? "Bearer",
            email ?? string.Empty,
            providerUserId ?? string.Empty);
    }

    public async Task StoreTokensAsync(
        Guid userExternalLoginId,
        GoogleOAuthTokens tokens,
        CancellationToken cancellationToken)
    {
        var login = await dbContext.UserExternalLogins
            .SingleOrDefaultAsync(item => item.Id == userExternalLoginId, cancellationToken);

        if (login is null)
        {
            return;
        }

        login.EncryptedAccessToken = tokenProtector.Protect(tokens.AccessToken);
        if (!string.IsNullOrWhiteSpace(tokens.RefreshToken))
        {
            login.EncryptedRefreshToken = tokenProtector.Protect(tokens.RefreshToken);
        }

        login.TokenExpiresAt = DateTimeOffset.UtcNow.AddSeconds(tokens.ExpiresInSeconds);
        login.Scopes = tokens.Scope;
        login.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<string?> GetValidAccessTokenAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var login = await dbContext.UserExternalLogins
            .SingleOrDefaultAsync(
                item => item.UserId == userId && item.Provider == GoogleProvider && item.EncryptedRefreshToken != null,
                cancellationToken);

        if (login is null)
        {
            return null;
        }

        if (login.EncryptedAccessToken is not null && login.TokenExpiresAt > DateTimeOffset.UtcNow.AddMinutes(1))
        {
            return tokenProtector.Unprotect(login.EncryptedAccessToken);
        }

        if (login.EncryptedRefreshToken is null)
        {
            return null;
        }

        var refreshToken = tokenProtector.Unprotect(login.EncryptedRefreshToken);
        var newTokens = await RefreshAccessTokenAsync(refreshToken, cancellationToken);
        if (newTokens is null)
        {
            return null;
        }

        await StoreTokensAsync(login.Id, newTokens, cancellationToken);
        return newTokens.AccessToken;
    }

    private static async Task<(string? Email, string? ProviderUserId)> FetchUserInfoAsync(
        string accessToken,
        CancellationToken cancellationToken)
    {
        using var client = new HttpClient();
        var request = new HttpRequestMessage(HttpMethod.Get, UserInfoEndpoint);
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await client.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return (null, null);
        }

        var body = await response.Content.ReadFromJsonAsync<GoogleUserInfoResponse>(cancellationToken: cancellationToken);
        return (body?.Email?.Trim().ToLowerInvariant(), body?.Id);
    }

    private sealed class GoogleTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string? AccessToken { get; set; }

        [JsonPropertyName("refresh_token")]
        public string? RefreshToken { get; set; }

        [JsonPropertyName("expires_in")]
        public int ExpiresInSeconds { get; set; }

        [JsonPropertyName("scope")]
        public string? Scope { get; set; }

        [JsonPropertyName("token_type")]
        public string? TokenType { get; set; }
    }

    private sealed class GoogleUserInfoResponse
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }
    }
}
