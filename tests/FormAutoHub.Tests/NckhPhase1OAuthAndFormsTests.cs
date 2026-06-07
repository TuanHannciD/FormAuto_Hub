using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities.Nckh;
using FormAutoHub.Api.Integrations.Google;
using FormAutoHub.Api.Services;
using FormAutoHub.Api.Services.Nckh;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Options;
using FormAutoHub.Api.Auth;

namespace FormAutoHub.Tests;

public sealed class NckhPhase1OAuthAndFormsTests
{
    [Fact]
    public async Task ImportFormAsync_CreatesResearchFormAndQuestions()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var result = await service.ImportFormAsync(
            TestUserId,
            new NckhImportFormRequest("https://docs.google.com/forms/d/test-form-123/edit"),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, result.Status);
        Assert.NotNull(result.Value);
        Assert.Equal("test-form-123", result.Value.GoogleFormId);
        Assert.Equal("Test Survey Form", result.Value.Title);
        Assert.Equal("Draft", result.Value.Status);
        Assert.Equal(2, result.Value.QuestionCount);

        var form = await context.ResearchForms
            .Include(item => item.Questions)
            .SingleAsync();
        Assert.Equal("test-form-123", form.GoogleFormId);
        Assert.Equal(2, form.Questions.Count);
        Assert.Equal("Age Question", form.Questions.First().QuestionText);
    }

    [Fact]
    public async Task ImportFormAsync_RejectsDuplicateImport()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await service.ImportFormAsync(
            TestUserId,
            new NckhImportFormRequest("https://docs.google.com/forms/d/test-form-123/edit"),
            CancellationToken.None);

        var result = await service.ImportFormAsync(
            TestUserId,
            new NckhImportFormRequest("https://docs.google.com/forms/d/test-form-123/edit"),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Conflict, result.Status);
    }

    [Fact]
    public async Task ImportFormAsync_RejectsInvalidUrl()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var result = await service.ImportFormAsync(
            TestUserId,
            new NckhImportFormRequest("https://notgoogle.com/form"),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.InvalidRequest, result.Status);
    }

    [Fact]
    public async Task ImportFormAsync_RequiresGoogleLink()
    {
        await using var context = CreateContext();
        var oauthService = new FakeGoogleOAuthService(hasValidToken: false);
        var service = CreateService(context, oauthService: oauthService);

        var result = await service.ImportFormAsync(
            TestUserId,
            new NckhImportFormRequest("https://docs.google.com/forms/d/test-form-123/edit"),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Unauthorized, result.Status);
    }

    [Fact]
    public async Task ListFormsAsync_ReturnsPagedResults()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        // Setup Google link so ListFormsAsync doesn't return Unauthorized
        context.UserExternalLogins.Add(new global::FormAutoHub.Api.Entities.UserExternalLogin
        {
            Id = Guid.NewGuid(),
            UserId = TestUserId,
            Provider = "Google",
            ProviderUserId = "google-sub-123",
            Email = "test@example.com",
            EmailVerified = true,
            EncryptedRefreshToken = "fake-refresh-token",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        await context.SaveChangesAsync();

        await service.ImportFormAsync(
            TestUserId,
            new NckhImportFormRequest("https://docs.google.com/forms/d/form-a/edit"),
            CancellationToken.None);
        await service.ImportFormAsync(
            TestUserId,
            new NckhImportFormRequest("https://docs.google.com/forms/d/form-b/edit"),
            CancellationToken.None);

        var result = await service.ListFormsAsync(TestUserId, null, 1, 20, CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, result.Status);
        Assert.NotNull(result.Value);
        Assert.Equal(2, result.Value.TotalItems);
        Assert.Equal(2, result.Value.Items.Count);
    }

    [Fact]
    public async Task ListFormsAsync_FiltersByStatus()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        // Setup Google link so ListFormsAsync doesn't return Unauthorized
        context.UserExternalLogins.Add(new global::FormAutoHub.Api.Entities.UserExternalLogin
        {
            Id = Guid.NewGuid(),
            UserId = TestUserId,
            Provider = "Google",
            ProviderUserId = "google-sub-123",
            Email = "test@example.com",
            EmailVerified = true,
            EncryptedRefreshToken = "fake-refresh-token",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        await context.SaveChangesAsync();

        await service.ImportFormAsync(
            TestUserId,
            new NckhImportFormRequest("https://docs.google.com/forms/d/form-a/edit"),
            CancellationToken.None);

        var result = await service.ListFormsAsync(TestUserId, "Active", 1, 20, CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, result.Status);
        Assert.NotNull(result.Value);
        Assert.Equal(0, result.Value.TotalItems);
    }

    [Fact]
    public async Task GetFormDetailAsync_ReturnsFormWithQuestions()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var importResult = await service.ImportFormAsync(
            TestUserId,
            new NckhImportFormRequest("https://docs.google.com/forms/d/test-form-123/edit"),
            CancellationToken.None);

        var formId = importResult.Value!.Id;
        var result = await service.GetFormDetailAsync(TestUserId, formId, CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, result.Status);
        Assert.NotNull(result.Value);
        Assert.Equal("Test Survey Form", result.Value.Title);
        Assert.Equal(2, result.Value.Questions.Count);
    }

    [Fact]
    public async Task GetFormDetailAsync_ReturnsNotFoundForOtherUser()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var importResult = await service.ImportFormAsync(
            TestUserId,
            new NckhImportFormRequest("https://docs.google.com/forms/d/test-form-123/edit"),
            CancellationToken.None);

        var otherUserId = Guid.NewGuid();
        var result = await service.GetFormDetailAsync(otherUserId, importResult.Value!.Id, CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.NotFound, result.Status);
    }

    [Fact]
    public async Task ListFormsAsync_RequiresNckhGoogleTokenNotOnlyGoogleIdentityLink()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        context.UserExternalLogins.Add(new global::FormAutoHub.Api.Entities.UserExternalLogin
        {
            Id = Guid.NewGuid(),
            UserId = TestUserId,
            Provider = "Google",
            ProviderUserId = "google-sub-123",
            Email = "test@example.com",
            EmailVerified = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        await context.SaveChangesAsync();

        var result = await service.ListFormsAsync(TestUserId, null, 1, 20, CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Unauthorized, result.Status);
    }

    [Fact]
    public async Task LinkGoogleAsync_StoresTokensAndReturnsEmail()
    {
        await using var context = CreateContext();
        var user = new global::FormAutoHub.Api.Entities.User
        {
            Id = TestUserId,
            Email = "test@example.com",
            FullName = "Test User",
            PasswordHash = "hash",
            Role = FormAutoHub.Api.Domain.UserRoles.User,
            CreatedAt = DateTimeOffset.UtcNow
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var oauthService = new FakeGoogleOAuthService();
        var service = CreateService(context, oauthService: oauthService);

        var result = await service.LinkGoogleAsync(
            TestUserId,
            new NckhGoogleLinkRequest("valid-auth-code", "http://localhost:3000/dashboard/nckh/callback"),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, result.Status);
        Assert.NotNull(result.Value);
        Assert.True(result.Value.Linked);
        Assert.Equal("test-user@gmail.com", result.Value.Email);

        Assert.NotNull(oauthService.StoredAccessToken);
        Assert.NotNull(oauthService.StoredRefreshToken);

        var login = await context.UserExternalLogins.SingleAsync();
        Assert.Equal("test-user@gmail.com", login.Email);
        Assert.Equal("google-sub-123", login.ProviderUserId);
    }

    [Fact]
    public async Task LinkGoogleAsync_RejectsMissingScopes()
    {
        await using var context = CreateContext();
        var user = new global::FormAutoHub.Api.Entities.User
        {
            Id = TestUserId,
            Email = "test@example.com",
            FullName = "Test User",
            PasswordHash = "hash",
            Role = FormAutoHub.Api.Domain.UserRoles.User,
            CreatedAt = DateTimeOffset.UtcNow
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var oauthService = new FakeGoogleOAuthService(includeFormsScope: false);
        var service = CreateService(context, oauthService: oauthService);

        var result = await service.LinkGoogleAsync(
            TestUserId,
            new NckhGoogleLinkRequest("valid-auth-code", "http://localhost:3000/dashboard/nckh/callback"),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.InvalidRequest, result.Status);
        Assert.Contains("Forms read or write permission", result.Message);
    }

    private static readonly Guid TestUserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private static ResearchFormService CreateService(
        FormAutoHubDbContext context,
        IGoogleOAuthService? oauthService = null,
        IGoogleFormsApiService? formsApiService = null)
    {
        return new ResearchFormService(
            context,
            oauthService ?? new FakeGoogleOAuthService(),
            formsApiService ?? new FakeGoogleFormsApiService());
    }

    private static FormAutoHubDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new FormAutoHubDbContext(options);
    }

    private sealed class FakeGoogleOAuthService : IGoogleOAuthService
    {
        private readonly bool _includeFormsScope;
        private readonly bool _hasValidToken;
        private int _callCount;

        public FakeGoogleOAuthService(bool includeFormsScope = true, bool hasValidToken = true)
        {
            _includeFormsScope = includeFormsScope;
            _hasValidToken = hasValidToken;
        }

        public Task<GoogleOAuthTokens?> ExchangeCodeAsync(string authorizationCode, string redirectUri, CancellationToken cancellationToken)
        {
            if (authorizationCode == "valid-auth-code")
            {
                var scope = _includeFormsScope
                    ? "https://www.googleapis.com/auth/forms.body.readonly https://www.googleapis.com/auth/userinfo.email"
                    : "https://www.googleapis.com/auth/userinfo.email";
                return Task.FromResult<GoogleOAuthTokens?>(new GoogleOAuthTokens(
                    "fake-access-token",
                    "fake-refresh-token",
                    3600,
                    scope,
                    "Bearer",
                    "test-user@gmail.com",
                    "google-sub-123"));
            }

            return Task.FromResult<GoogleOAuthTokens?>(null);
        }

        public Task<GoogleOAuthTokens?> RefreshAccessTokenAsync(string refreshToken, CancellationToken cancellationToken)
        {
            _callCount++;
            return Task.FromResult<GoogleOAuthTokens?>(new GoogleOAuthTokens(
                $"refreshed-token-{_callCount}",
                refreshToken,
                3600,
                "https://www.googleapis.com/auth/forms.body.readonly",
                "Bearer",
                "test-user@gmail.com",
                "google-sub-123"));
        }

        public Task StoreTokensAsync(Guid userExternalLoginId, GoogleOAuthTokens tokens, CancellationToken cancellationToken)
        {
            StoredAccessToken = tokens.AccessToken;
            StoredRefreshToken = tokens.RefreshToken;
            return Task.CompletedTask;
        }

        public string? StoredAccessToken { get; private set; }
        public string? StoredRefreshToken { get; private set; }

        public Task<string?> GetValidAccessTokenAsync(Guid userId, CancellationToken cancellationToken)
        {
            return Task.FromResult<string?>(_hasValidToken ? "fake-access-token" : null);
        }
    }

    private sealed class FakeGoogleFormsApiService : IGoogleFormsApiService
    {
        public Task<GoogleFormStructure?> GetFormStructureAsync(
            string accessToken,
            string formId,
            CancellationToken cancellationToken)
        {
            return Task.FromResult<GoogleFormStructure?>(new GoogleFormStructure(
                formId,
                "Test Survey Form",
                new List<GoogleFormQuestionItem>
                {
                    new("q1", "Age Question", "shortText", true, 0),
                    new("q2", "Name Question", "shortText", false, 1)
                }));
        }

        public Task<GoogleFormCreateResult?> CreateFormAsync(string accessToken, string title, CancellationToken cancellationToken)
        {
            return Task.FromResult<GoogleFormCreateResult?>(null);
        }

        public Task<bool> CreateQuestionsAsync(
            string accessToken,
            string formId,
            IReadOnlyList<GoogleFormQuestionDraft> questions,
            CancellationToken cancellationToken)
        {
            return Task.FromResult(false);
        }

        public Task<IReadOnlyList<GoogleFormResponseItem>?> ListResponsesAsync(
            string accessToken,
            string formId,
            CancellationToken cancellationToken)
        {
            return Task.FromResult<IReadOnlyList<GoogleFormResponseItem>?>([]);
        }
    }
}
