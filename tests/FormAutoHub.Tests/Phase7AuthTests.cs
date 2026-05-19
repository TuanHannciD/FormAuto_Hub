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
