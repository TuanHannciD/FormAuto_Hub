namespace FormAutoHub.Api.Contracts;

public sealed record AuthTokenResponse(
    Guid UserId,
    string Email,
    string FullName,
    string Role,
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAt,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAt);

public sealed record RegisterRequest(
    string Email,
    string Password,
    string FullName);

public sealed record LoginRequest(
    string Email,
    string Password);

public sealed record GoogleLoginRequest(
    string IdToken);

public sealed record LinkGoogleRequest(
    string IdToken);

public sealed record RefreshTokenRequest(
    string RefreshToken);

public sealed record LogoutRequest(
    string RefreshToken);

public sealed record LogoutResponse(bool Revoked);

public sealed record LinkGoogleResponse(bool Linked);
