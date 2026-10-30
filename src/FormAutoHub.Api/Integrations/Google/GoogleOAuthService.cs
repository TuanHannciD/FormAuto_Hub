using FormAutoHub.Api.Integrations.Google;
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
    Microsoft.Extensions.Options.IOptions<Auth.AuthOptions> authOptions,
    ILogger<GoogleOAuthService>? logger = null)
    : IGoogleOAuthService
{
    private const string TokenEndpoint = "https://oauth2.googleapis.com/token";
    private const string UserInfoEndpoint = "https://www.googleapis.com/oauth2/v2/userinfo";
    private const string GoogleProvider = "Google";

    public Task<GoogleOAuthTokens?> ExchangeCodeAsync(string authorizationCode, string redirectUri, CancellationToken cancellationToken) =>
        RequestTokensAsync("ExchangeCode", new Dictionary<string, string>
        {
            ["code"] = authorizationCode,
            ["redirect_uri"] = redirectUri,
            ["grant_type"] = "authorization_code"
        }, null, cancellationToken);

    public Task<GoogleOAuthTokens?> RefreshAccessTokenAsync(string refreshToken, CancellationToken cancellationToken) =>
        RequestTokensAsync("RefreshToken", new Dictionary<string, string>
        {
            ["refresh_token"] = refreshToken,
            ["grant_type"] = "refresh_token"
        }, refreshToken, cancellationToken);

    private async Task<GoogleOAuthTokens?> RequestTokensAsync(
        string operation, Dictionary<string, string> fields, string? existingRefreshToken, CancellationToken cancellationToken)
    {
        var clientId = authOptions.Value.GoogleOAuthClientId;
        var clientSecret = authOptions.Value.GoogleOAuthClientSecret;
        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
        {
            throw Failure(operation, GoogleIntegrationFailureKind.Configuration);
        }
        fields["client_id"] = clientId;
        fields["client_secret"] = clientSecret;
        using var request = new HttpRequestMessage(HttpMethod.Post, TokenEndpoint)
        {
            Content = new FormUrlEncodedContent(fields)
        };
        using var response = await SendAsync(request, operation, cancellationToken);
        var tokens = await ReadBodyAsync<GoogleTokenResponse>(response, operation, cancellationToken);
        if (string.IsNullOrWhiteSpace(tokens.AccessToken))
        {
            throw Failure(operation, GoogleIntegrationFailureKind.InvalidResponse, response.StatusCode);
        }
        var (email, providerUserId) = await FetchUserInfoAsync(tokens.AccessToken, cancellationToken);
        return new GoogleOAuthTokens(
            tokens.AccessToken,
            existingRefreshToken ?? tokens.RefreshToken ?? string.Empty,
            tokens.ExpiresInSeconds,
            tokens.Scope ?? string.Empty,
            tokens.TokenType ?? "Bearer",
            email,
            providerUserId);
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
        if (!string.IsNullOrWhiteSpace(tokens.Scope))
        {
            login.Scopes = tokens.Scope;
        }

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

    private async Task<(string Email, string ProviderUserId)> FetchUserInfoAsync(string accessToken, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, UserInfoEndpoint);
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
        using var response = await SendAsync(request, "ReadUserInfo", cancellationToken);
        var body = await ReadBodyAsync<GoogleUserInfoResponse>(response, "ReadUserInfo", cancellationToken);
        if (string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Id))
        {
            throw Failure("ReadUserInfo", GoogleIntegrationFailureKind.InvalidResponse, response.StatusCode);
        }
        return (body.Email.Trim().ToLowerInvariant(), body.Id);
    }

    private async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, string operation, CancellationToken cancellationToken)
    {
        HttpResponseMessage response;
        try
        {
            response = await httpClient.SendAsync(request, cancellationToken);
        }
        catch (HttpRequestException exception)
        {
            throw Failure(operation, GoogleIntegrationFailureKind.Transport, exception.StatusCode, exception);
        }
        catch (OperationCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            throw Failure(operation, GoogleIntegrationFailureKind.Transport, inner: exception);
        }
        if (response.IsSuccessStatusCode) return response;

        var failure = GoogleIntegrationException.FromStatus(operation, response.StatusCode);
        try
        {
            // Only known OAuth error codes influence classification; descriptions/bodies are never forwarded or logged.
            var text = await response.Content.ReadAsStringAsync(cancellationToken);
            if ((operation is "ExchangeCode" or "RefreshToken") && text.Length <= 4096)
            {
                try
                {
                    using var document = JsonDocument.Parse(text);
                    if (document.RootElement.ValueKind == JsonValueKind.Object &&
                        document.RootElement.TryGetProperty("error", out var error) && error.ValueKind == JsonValueKind.String)
                    {
                        var kind = error.GetString() switch
                        {
                            "invalid_grant" => GoogleIntegrationFailureKind.Authorization,
                            "invalid_client" or "unauthorized_client" => GoogleIntegrationFailureKind.Configuration,
                            _ => failure.Kind
                        };
                        failure = new GoogleIntegrationException(operation, kind, response.StatusCode);
                    }
                }
                catch (JsonException) { /* HTTP classification remains valid without a usable error envelope. */ }
            }
        }
        catch (HttpRequestException exception)
        {
            throw Failure(operation, GoogleIntegrationFailureKind.Transport, response.StatusCode, exception);
        }
        catch (OperationCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            throw Failure(operation, GoogleIntegrationFailureKind.Transport, response.StatusCode, exception);
        }
        finally
        {
            response.Dispose();
        }
        LogFailure(failure);
        throw failure;
    }

    private async Task<T> ReadBodyAsync<T>(HttpResponseMessage response, string operation, CancellationToken cancellationToken)
    {
        try
        {
            var body = await response.Content.ReadFromJsonAsync<T>(cancellationToken: cancellationToken);
            if (body is null) throw Failure(operation, GoogleIntegrationFailureKind.InvalidResponse, response.StatusCode);
            return body;
        }
        catch (JsonException exception)
        {
            throw Failure(operation, GoogleIntegrationFailureKind.InvalidResponse, response.StatusCode, exception);
        }
        catch (HttpRequestException exception) when (exception is not GoogleIntegrationException)
        {
            throw Failure(operation, GoogleIntegrationFailureKind.Transport, response.StatusCode, exception);
        }
        catch (OperationCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            throw Failure(operation, GoogleIntegrationFailureKind.Transport, response.StatusCode, exception);
        }
    }

    private GoogleIntegrationException Failure(string operation, GoogleIntegrationFailureKind kind, System.Net.HttpStatusCode? status = null, Exception? inner = null)
    {
        var failure = new GoogleIntegrationException(operation, kind, status, inner);
        LogFailure(failure);
        return failure;
    }

    private void LogFailure(GoogleIntegrationException failure) =>
        logger?.LogWarning("Google OAuth {Operation} failed with {FailureKind}, HTTP {StatusCode}, cause {CauseType}",
            failure.Operation, failure.Kind, (int?)failure.StatusCode, failure.InnerException?.GetType().Name);

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
