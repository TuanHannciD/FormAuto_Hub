using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public enum AuthResultStatus
{
    Success,
    InvalidRequest,
    InvalidCredentials,
    Locked,
    Conflict,
    LinkRequired,
    NotFound
}

public sealed record AuthServiceResult<T>(AuthResultStatus Status, T? Value = default, string? Message = null);

public interface IAuthService
{
    Task<AuthServiceResult<AuthTokenResponse>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);
    Task<AuthServiceResult<AuthTokenResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken);
    Task<AuthServiceResult<AuthTokenResponse>> GoogleLoginAsync(GoogleLoginRequest request, CancellationToken cancellationToken);
    Task<AuthServiceResult<AuthTokenResponse>> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken);
    Task<AuthServiceResult<LogoutResponse>> LogoutAsync(LogoutRequest request, CancellationToken cancellationToken);
    Task<AuthServiceResult<LinkGoogleResponse>> LinkGoogleAsync(LinkGoogleRequest request, CancellationToken cancellationToken);
    Task<AuthServiceResult<UnlinkGoogleResponse>> UnlinkGoogleAsync(CancellationToken cancellationToken);
}

public sealed class AuthService(
    FormAutoHubDbContext dbContext,
    IPasswordHasher passwordHasher,
    ITokenService tokenService,
    IGoogleIdentityVerifier googleIdentityVerifier,
    ICreditService creditService,
    ICurrentUserContext currentUser)
    : IAuthService
{
    private const int StartingCredits = 5;
    private const int LockoutThreshold = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);
    private const string GoogleProvider = "Google";

    public async Task<AuthServiceResult<AuthTokenResponse>> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(request.Email);
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.FullName) || request.Password.Length < 8)
        {
            return new AuthServiceResult<AuthTokenResponse>(AuthResultStatus.InvalidRequest);
        }

        var exists = await dbContext.Users.AnyAsync(user => user.Email == email, cancellationToken);
        if (exists)
        {
            return new AuthServiceResult<AuthTokenResponse>(AuthResultStatus.Conflict, Message: "Email already exists.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            PasswordHash = passwordHasher.Hash(request.Password),
            FullName = request.FullName,
            Role = UserRoles.User,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Users.Add(user);
        await creditService.GrantInitialCreditsAsync(user.Id, StartingCredits, "Initial registration credit grant.", cancellationToken);
        var response = CreateSession(user);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new AuthServiceResult<AuthTokenResponse>(AuthResultStatus.Success, response);
    }

    public async Task<AuthServiceResult<AuthTokenResponse>> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(request.Email);
        var user = await dbContext.Users.SingleOrDefaultAsync(item => item.Email == email, cancellationToken);
        if (user is null || string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            return new AuthServiceResult<AuthTokenResponse>(AuthResultStatus.InvalidCredentials);
        }

        if (user.LockoutUntil is not null && user.LockoutUntil > DateTimeOffset.UtcNow)
        {
            return new AuthServiceResult<AuthTokenResponse>(AuthResultStatus.Locked);
        }

        if (!passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            user.FailedLoginCount += 1;
            if (user.FailedLoginCount >= LockoutThreshold)
            {
                user.LockoutUntil = DateTimeOffset.UtcNow.Add(LockoutDuration);
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return new AuthServiceResult<AuthTokenResponse>(
                user.LockoutUntil is not null ? AuthResultStatus.Locked : AuthResultStatus.InvalidCredentials);
        }

        user.FailedLoginCount = 0;
        user.LockoutUntil = null;
        var response = CreateSession(user);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new AuthServiceResult<AuthTokenResponse>(AuthResultStatus.Success, response);
    }

    public async Task<AuthServiceResult<AuthTokenResponse>> GoogleLoginAsync(
        GoogleLoginRequest request,
        CancellationToken cancellationToken)
    {
        var identity = await googleIdentityVerifier.VerifyAsync(request.IdToken, cancellationToken);
        if (identity is null)
        {
            return new AuthServiceResult<AuthTokenResponse>(AuthResultStatus.InvalidCredentials);
        }

        if (!identity.EmailVerified)
        {
            return new AuthServiceResult<AuthTokenResponse>(AuthResultStatus.InvalidCredentials);
        }

        var existingLogin = await dbContext.UserExternalLogins
            .SingleOrDefaultAsync(
                item => item.Provider == GoogleProvider && item.ProviderUserId == identity.ProviderUserId,
                cancellationToken);

        if (existingLogin is not null)
        {
            var linkedUser = await dbContext.Users.SingleAsync(item => item.Id == existingLogin.UserId, cancellationToken);
            var linkedResponse = CreateSession(linkedUser);
            await dbContext.SaveChangesAsync(cancellationToken);
            return new AuthServiceResult<AuthTokenResponse>(AuthResultStatus.Success, linkedResponse);
        }

        var email = NormalizeEmail(identity.Email);
        var existingUser = await dbContext.Users.SingleOrDefaultAsync(item => item.Email == email, cancellationToken);
        if (existingUser is not null)
        {
            return new AuthServiceResult<AuthTokenResponse>(
                AuthResultStatus.LinkRequired,
                Message: "Login with password first, then link Google.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            PasswordHash = null,
            FullName = string.IsNullOrWhiteSpace(identity.FullName) ? email : identity.FullName,
            Role = UserRoles.User,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Users.Add(user);
        dbContext.UserExternalLogins.Add(CreateGoogleLogin(user.Id, identity));
        await creditService.GrantInitialCreditsAsync(user.Id, StartingCredits, "Initial registration credit grant.", cancellationToken);
        var response = CreateSession(user);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new AuthServiceResult<AuthTokenResponse>(AuthResultStatus.Success, response);
    }

    public async Task<AuthServiceResult<AuthTokenResponse>> RefreshAsync(
        RefreshTokenRequest request,
        CancellationToken cancellationToken)
    {
        var tokenHash = tokenService.HashRefreshToken(request.RefreshToken);
        var refreshToken = await dbContext.RefreshTokens
            .SingleOrDefaultAsync(
                item => item.TokenHash == tokenHash && item.RevokedAt == null && item.ExpiresAt > DateTimeOffset.UtcNow,
                cancellationToken);

        if (refreshToken is null)
        {
            return new AuthServiceResult<AuthTokenResponse>(AuthResultStatus.InvalidCredentials);
        }

        var user = await dbContext.Users.SingleOrDefaultAsync(item => item.Id == refreshToken.UserId, cancellationToken);
        if (user is null)
        {
            return new AuthServiceResult<AuthTokenResponse>(AuthResultStatus.InvalidCredentials);
        }

        refreshToken.RevokedAt = DateTimeOffset.UtcNow;
        var response = CreateSession(user);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new AuthServiceResult<AuthTokenResponse>(AuthResultStatus.Success, response);
    }

    public async Task<AuthServiceResult<LogoutResponse>> LogoutAsync(
        LogoutRequest request,
        CancellationToken cancellationToken)
    {
        var tokenHash = tokenService.HashRefreshToken(request.RefreshToken);
        var refreshToken = await dbContext.RefreshTokens
            .SingleOrDefaultAsync(item => item.TokenHash == tokenHash && item.RevokedAt == null, cancellationToken);

        if (refreshToken is null)
        {
            return new AuthServiceResult<LogoutResponse>(AuthResultStatus.Success, new LogoutResponse(false));
        }

        refreshToken.RevokedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return new AuthServiceResult<LogoutResponse>(AuthResultStatus.Success, new LogoutResponse(true));
    }

    public async Task<AuthServiceResult<LinkGoogleResponse>> LinkGoogleAsync(
        LinkGoogleRequest request,
        CancellationToken cancellationToken)
    {
        var identity = await googleIdentityVerifier.VerifyAsync(request.IdToken, cancellationToken);
        if (identity is null || !identity.EmailVerified)
        {
            return new AuthServiceResult<LinkGoogleResponse>(AuthResultStatus.InvalidCredentials);
        }

        var user = await dbContext.Users.SingleOrDefaultAsync(item => item.Id == currentUser.UserId, cancellationToken);
        if (user is null)
        {
            return new AuthServiceResult<LinkGoogleResponse>(AuthResultStatus.NotFound);
        }

        if (!string.Equals(user.Email, NormalizeEmail(identity.Email), StringComparison.OrdinalIgnoreCase))
        {
            return new AuthServiceResult<LinkGoogleResponse>(AuthResultStatus.Conflict, Message: "Google email must match the current account email.");
        }

        var userAlreadyLinked = await dbContext.UserExternalLogins
            .AnyAsync(item => item.Provider == GoogleProvider && item.UserId == user.Id, cancellationToken);

        if (userAlreadyLinked)
        {
            return new AuthServiceResult<LinkGoogleResponse>(AuthResultStatus.Conflict, Message: "This account already has a linked Google account.");
        }

        var existingLogin = await dbContext.UserExternalLogins
            .SingleOrDefaultAsync(
                item => item.Provider == GoogleProvider && item.ProviderUserId == identity.ProviderUserId,
                cancellationToken);

        if (existingLogin is not null && existingLogin.UserId != user.Id)
        {
            return new AuthServiceResult<LinkGoogleResponse>(AuthResultStatus.Conflict);
        }

        if (existingLogin is null)
        {
            dbContext.UserExternalLogins.Add(CreateGoogleLogin(user.Id, identity));
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return new AuthServiceResult<LinkGoogleResponse>(AuthResultStatus.Success, new LinkGoogleResponse(true));
    }

    public async Task<AuthServiceResult<UnlinkGoogleResponse>> UnlinkGoogleAsync(CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.SingleOrDefaultAsync(item => item.Id == currentUser.UserId, cancellationToken);
        if (user is null)
        {
            return new AuthServiceResult<UnlinkGoogleResponse>(AuthResultStatus.NotFound);
        }

        if (string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            return new AuthServiceResult<UnlinkGoogleResponse>(
                AuthResultStatus.Conflict,
                Message: "Set a password before unlinking Google to avoid losing account access.");
        }

        var existingLogin = await dbContext.UserExternalLogins
            .SingleOrDefaultAsync(item => item.Provider == GoogleProvider && item.UserId == user.Id, cancellationToken);

        if (existingLogin is null)
        {
            return new AuthServiceResult<UnlinkGoogleResponse>(AuthResultStatus.Success, new UnlinkGoogleResponse(false));
        }

        dbContext.UserExternalLogins.Remove(existingLogin);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new AuthServiceResult<UnlinkGoogleResponse>(AuthResultStatus.Success, new UnlinkGoogleResponse(true));
    }

    private AuthTokenResponse CreateSession(User user)
    {
        var accessToken = tokenService.CreateAccessToken(user);
        var refreshToken = tokenService.CreateRefreshToken();
        dbContext.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = refreshToken.TokenHash,
            ExpiresAt = refreshToken.ExpiresAt,
            CreatedAt = DateTimeOffset.UtcNow
        });

        return new AuthTokenResponse(
            user.Id,
            user.Email,
            user.FullName,
            user.Role,
            accessToken.Token,
            accessToken.ExpiresAt,
            refreshToken.Token,
            refreshToken.ExpiresAt);
    }

    private static UserExternalLogin CreateGoogleLogin(Guid userId, GoogleIdentity identity) =>
        new()
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Provider = GoogleProvider,
            ProviderUserId = identity.ProviderUserId,
            Email = NormalizeEmail(identity.Email),
            EmailVerified = identity.EmailVerified,
            CreatedAt = DateTimeOffset.UtcNow
        };

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
