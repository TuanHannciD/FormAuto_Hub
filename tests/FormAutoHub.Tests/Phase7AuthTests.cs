using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Options;

namespace FormAutoHub.Tests;

public sealed class Phase7AuthTests
{
    [Fact]
    public async Task RegisterAsync_ReturnsTokensAndWritesInitialGrantCreditTransaction()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var result = await service.RegisterAsync(
            new RegisterRequest("User@Example.Test", "password1", "Test User"),
            CancellationToken.None);

        Assert.Equal(AuthResultStatus.Success, result.Status);
        Assert.NotNull(result.Value);
        Assert.False(string.IsNullOrWhiteSpace(result.Value.AccessToken));
        Assert.False(string.IsNullOrWhiteSpace(result.Value.RefreshToken));

        var user = await context.Users.SingleAsync();
        Assert.Equal("user@example.test", user.Email);
        Assert.NotEqual("password1", user.PasswordHash);

        var account = await context.UserCreditAccounts.SingleAsync(item => item.UserId == user.Id);
        Assert.Equal(5, account.Balance);
        Assert.Equal(5, account.TotalDeposited);

        var transaction = await context.CreditTransactions.SingleAsync(item => item.UserId == user.Id);
        Assert.Equal(CreditTransactionTypes.InitialGrant, transaction.Type);
        Assert.Equal(5, transaction.Amount);
        Assert.Equal(5, transaction.BalanceAfter);

        var refreshToken = await context.RefreshTokens.SingleAsync(item => item.UserId == user.Id);
        Assert.Null(refreshToken.RevokedAt);
        Assert.True(refreshToken.ExpiresAt > DateTimeOffset.UtcNow);
    }

    [Fact]
    public async Task LoginAsync_LocksAccountAfterFiveFailedAttempts()
    {
        await using var context = CreateContext();
        var service = CreateService(context);
        await service.RegisterAsync(new RegisterRequest("user@example.test", "password1", "Test User"), CancellationToken.None);

        AuthServiceResult<AuthTokenResponse>? result = null;
        for (var index = 0; index < 5; index += 1)
        {
            result = await service.LoginAsync(new LoginRequest("user@example.test", "wrongpass"), CancellationToken.None);
        }

        Assert.NotNull(result);
        Assert.Equal(AuthResultStatus.Locked, result.Status);

        var user = await context.Users.SingleAsync();
        Assert.Equal(5, user.FailedLoginCount);
        Assert.NotNull(user.LockoutUntil);
        Assert.True(user.LockoutUntil > DateTimeOffset.UtcNow);
    }

    [Fact]
    public async Task GoogleLoginAsync_ReturnsLinkRequiredWhenVerifiedEmailMatchesPasswordAccount()
    {
        await using var context = CreateContext();
        var googleVerifier = new FakeGoogleIdentityVerifier(
            new GoogleIdentity("google-sub-1", "user@example.test", true, "Google User"));
        var service = CreateService(context, googleVerifier);
        await service.RegisterAsync(new RegisterRequest("user@example.test", "password1", "Test User"), CancellationToken.None);

        var result = await service.GoogleLoginAsync(new GoogleLoginRequest("token"), CancellationToken.None);

        Assert.Equal(AuthResultStatus.LinkRequired, result.Status);
        Assert.Empty(context.UserExternalLogins);
    }

    [Fact]
    public async Task GoogleLoginAsync_AutoRegistersWhenEmailIsUnused()
    {
        await using var context = CreateContext();
        var googleVerifier = new FakeGoogleIdentityVerifier(
            new GoogleIdentity("google-sub-1", "new@example.test", true, "Google User"));
        var service = CreateService(context, googleVerifier);

        var result = await service.GoogleLoginAsync(new GoogleLoginRequest("token"), CancellationToken.None);

        Assert.Equal(AuthResultStatus.Success, result.Status);
        Assert.NotNull(result.Value);
        Assert.Equal("new@example.test", result.Value.Email);
        Assert.Single(context.UserExternalLogins);
    }

    [Fact]
    public async Task GoogleLoginAsync_RejectsUnverifiedEmail()
    {
        await using var context = CreateContext();
        var googleVerifier = new FakeGoogleIdentityVerifier(
            new GoogleIdentity("google-sub-1", "new@example.test", false, "Google User"));
        var service = CreateService(context, googleVerifier);

        var result = await service.GoogleLoginAsync(new GoogleLoginRequest("token"), CancellationToken.None);

        Assert.Equal(AuthResultStatus.InvalidCredentials, result.Status);
        Assert.Empty(context.Users);
        Assert.Empty(context.UserExternalLogins);
    }

    [Fact]
    public async Task LinkGoogleAsync_RejectsWhenCurrentUserAlreadyLinked()
    {
        await using var context = CreateContext();
        var googleVerifier = new FakeGoogleIdentityVerifier(
            new GoogleIdentity("google-sub-2", "user@example.test", true, "Google User"));
        var service = CreateService(context, googleVerifier);
        var register = await service.RegisterAsync(new RegisterRequest("user@example.test", "password1", "Test User"), CancellationToken.None);

        context.UserExternalLogins.Add(new UserExternalLogin
        {
            Id = Guid.NewGuid(),
            UserId = register.Value!.UserId,
            Provider = "Google",
            ProviderUserId = "google-sub-1",
            Email = "user@example.test",
            EmailVerified = true,
            CreatedAt = DateTimeOffset.UtcNow
        });
        await context.SaveChangesAsync();

        var linkService = CreateService(context, googleVerifier, register.Value.UserId);

        var result = await linkService.LinkGoogleAsync(new LinkGoogleRequest("token"), CancellationToken.None);

        Assert.Equal(AuthResultStatus.Conflict, result.Status);
        Assert.Single(context.UserExternalLogins);
    }

    [Fact]
    public async Task LinkGoogleAsync_RejectsWhenEmailDoesNotMatchCurrentUser()
    {
        await using var context = CreateContext();
        var googleVerifier = new FakeGoogleIdentityVerifier(
            new GoogleIdentity("google-sub-1", "other@example.test", true, "Google User"));
        var service = CreateService(context, googleVerifier);
        var register = await service.RegisterAsync(new RegisterRequest("user@example.test", "password1", "Test User"), CancellationToken.None);
        var linkService = CreateService(context, googleVerifier, register.Value!.UserId);

        var result = await linkService.LinkGoogleAsync(new LinkGoogleRequest("token"), CancellationToken.None);

        Assert.Equal(AuthResultStatus.Conflict, result.Status);
        Assert.Empty(context.UserExternalLogins);
    }

    [Fact]
    public async Task UnlinkGoogleAsync_RemovesGoogleLoginWhenPasswordExists()
    {
        await using var context = CreateContext();
        var service = CreateService(context);
        var register = await service.RegisterAsync(new RegisterRequest("user@example.test", "password1", "Test User"), CancellationToken.None);

        context.UserExternalLogins.Add(new UserExternalLogin
        {
            Id = Guid.NewGuid(),
            UserId = register.Value!.UserId,
            Provider = "Google",
            ProviderUserId = "google-sub-1",
            Email = "user@example.test",
            EmailVerified = true,
            CreatedAt = DateTimeOffset.UtcNow
        });
        await context.SaveChangesAsync();

        var unlinkService = CreateService(context, currentUserId: register.Value.UserId);

        var result = await unlinkService.UnlinkGoogleAsync(CancellationToken.None);

        Assert.Equal(AuthResultStatus.Success, result.Status);
        Assert.True(result.Value!.Unlinked);
        Assert.Empty(context.UserExternalLogins);
    }

    [Fact]
    public async Task UnlinkGoogleAsync_RejectsGoogleOnlyAccount()
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        context.Users.Add(new User
        {
            Id = userId,
            Email = "google@example.test",
            PasswordHash = null,
            FullName = "Google User",
            Role = UserRoles.User,
            CreatedAt = DateTimeOffset.UtcNow
        });
        context.UserExternalLogins.Add(new UserExternalLogin
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Provider = "Google",
            ProviderUserId = "google-sub-1",
            Email = "google@example.test",
            EmailVerified = true,
            CreatedAt = DateTimeOffset.UtcNow
        });
        await context.SaveChangesAsync();

        var unlinkService = CreateService(context, currentUserId: userId);

        var result = await unlinkService.UnlinkGoogleAsync(CancellationToken.None);

        Assert.Equal(AuthResultStatus.Conflict, result.Status);
        Assert.Single(context.UserExternalLogins);
    }

    [Fact]
    public async Task RefreshAsync_RotatesCurrentRefreshToken()
    {
        await using var context = CreateContext();
        var service = CreateService(context);
        var register = await service.RegisterAsync(
            new RegisterRequest("user@example.test", "password1", "Test User"),
            CancellationToken.None);

        var result = await service.RefreshAsync(new RefreshTokenRequest(register.Value!.RefreshToken), CancellationToken.None);

        Assert.Equal(AuthResultStatus.Success, result.Status);
        Assert.NotEqual(register.Value.RefreshToken, result.Value!.RefreshToken);
        Assert.Equal(2, await context.RefreshTokens.CountAsync());
        Assert.Equal(1, await context.RefreshTokens.CountAsync(item => item.RevokedAt != null));
        Assert.Equal(1, await context.RefreshTokens.CountAsync(item => item.RevokedAt == null));
    }

    private static AuthService CreateService(
        FormAutoHubDbContext context,
        IGoogleIdentityVerifier? googleIdentityVerifier = null,
        Guid? currentUserId = null)
    {
        var passwordHasher = new PasswordHasher();
        var tokenService = new TokenService(Options.Create(new AuthOptions
        {
            Issuer = "FormAutoHub.Tests",
            Audience = "FormAutoHub.Tests",
            SigningKey = "test-signing-key-that-is-long-enough-123"
        }));

        return new AuthService(
            context,
            passwordHasher,
            tokenService,
            googleIdentityVerifier ?? new FakeGoogleIdentityVerifier(null),
            new CreditService(context),
            new FakeCurrentUserContext(currentUserId ?? Guid.Empty));
    }

    private static FormAutoHubDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new FormAutoHubDbContext(options);
    }

    private sealed class FakeGoogleIdentityVerifier(GoogleIdentity? identity) : IGoogleIdentityVerifier
    {
        public Task<GoogleIdentity?> VerifyAsync(string idToken, CancellationToken cancellationToken) =>
            Task.FromResult(identity);
    }

    private sealed class FakeCurrentUserContext(Guid userId) : ICurrentUserContext
    {
        public Guid UserId { get; } = userId;
        public bool IsAdmin => false;
    }
}
