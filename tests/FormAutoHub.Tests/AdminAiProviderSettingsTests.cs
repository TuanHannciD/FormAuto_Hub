using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Controllers;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Tests;

public sealed class AdminAiProviderSettingsTests
{
    [Fact]
    public async Task UpdateAsync_EncryptsApiKeyAndReturnsOnlyMaskedPreview()
    {
        await using var context = CreateContext();
        var service = CreateService(context, isAdmin: true);

        var response = await service.UpdateAsync(
            new UpdateAiProviderSettingsRequest(AiProviders.OpenAI, "sk-test-secret", "gpt-4o-mini", true),
            CancellationToken.None);

        Assert.NotNull(response);
        Assert.True(response.HasApiKey);
        Assert.Equal("****cret", response.ApiKeyPreview);
        Assert.DoesNotContain("sk-test-secret", response.ApiKeyPreview, StringComparison.Ordinal);

        var setting = await context.AiProviderSettings.SingleAsync();
        Assert.Equal("protected:sk-test-secret", setting.EncryptedApiKey);
        Assert.DoesNotContain("sk-test-secret", response.ToString(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task UpdateAsync_PreservesExistingApiKeyWhenRequestKeyIsBlank()
    {
        await using var context = CreateContext();
        var service = CreateService(context, isAdmin: true);
        await service.UpdateAsync(
            new UpdateAiProviderSettingsRequest(AiProviders.OpenAI, "first-secret", "gpt-4o-mini", false),
            CancellationToken.None);

        var response = await service.UpdateAsync(
            new UpdateAiProviderSettingsRequest(AiProviders.OpenAI, " ", "gpt-4o", true),
            CancellationToken.None);

        Assert.NotNull(response);
        Assert.Equal("gpt-4o", response.DefaultModel);
        var setting = await context.AiProviderSettings.SingleAsync();
        Assert.Equal("protected:first-secret", setting.EncryptedApiKey);
    }

    [Fact]
    public async Task UpdateAsync_AcceptsAdminProvidedProviderAndModel()
    {
        await using var context = CreateContext();
        var service = CreateService(context, isAdmin: true);

        var response = await service.UpdateAsync(
            new UpdateAiProviderSettingsRequest("Anthropic", "provider-secret", "claude-3-5-sonnet-latest", true, "https://gateway.example.com/v1/"),
            CancellationToken.None);

        Assert.NotNull(response);
        Assert.Equal("Anthropic", response.Provider);
        Assert.Equal("claude-3-5-sonnet-latest", response.DefaultModel);
        Assert.Equal("https://gateway.example.com/v1", response.BaseUrl);
        Assert.Contains("claude-3-5-sonnet-latest", response.AllowedModels);
    }

    [Fact]
    public async Task UpdateAsync_RejectsInvalidBaseUrl()
    {
        await using var context = CreateContext();
        var service = CreateService(context, isAdmin: true);

        var exception = await Assert.ThrowsAsync<ArgumentException>(() => service.UpdateAsync(
            new UpdateAiProviderSettingsRequest(AiProviders.OpenAI, "provider-secret", "gpt-4o-mini", true, "ftp://example.com/v1"),
            CancellationToken.None));

        Assert.Contains("Base URL", exception.Message, StringComparison.Ordinal);
    }

    [Fact]
    public async Task UpdateAsync_RejectsEnabledSettingWithoutApiKey()
    {
        await using var context = CreateContext();
        var service = CreateService(context, isAdmin: true);

        await Assert.ThrowsAsync<ArgumentException>(() => service.UpdateAsync(
            new UpdateAiProviderSettingsRequest(AiProviders.OpenAI, null, "gpt-4o-mini", true),
            CancellationToken.None));
    }

    [Fact]
    public async Task ControllerUpdate_ReturnsBadRequestForBlankProvider()
    {
        await using var context = CreateContext();
        var currentUser = new TestCurrentUserContext(isAdmin: true);
        var service = new AiProviderSettingsService(context, new TestSecretProtector(), currentUser);
        var controller = new AdminAiProviderSettingsController(service, currentUser);

        var result = await controller.Update(
            new UpdateAiProviderSettingsRequest(" ", "provider-secret", "gpt-4o-mini", true),
            CancellationToken.None);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        var problem = Assert.IsType<ProblemDetails>(badRequest.Value);
        Assert.Equal("AI provider settings rejected", problem.Title);
        Assert.Contains("Provider is required", problem.Detail, StringComparison.Ordinal);
        Assert.DoesNotContain("provider-secret", problem.Detail, StringComparison.Ordinal);
    }

    [Fact]
    public async Task ControllerUpdate_ReturnsBadRequestForBlankModel()
    {
        await using var context = CreateContext();
        var currentUser = new TestCurrentUserContext(isAdmin: true);
        var service = new AiProviderSettingsService(context, new TestSecretProtector(), currentUser);
        var controller = new AdminAiProviderSettingsController(service, currentUser);

        var result = await controller.Update(
            new UpdateAiProviderSettingsRequest(AiProviders.GoogleAI, "google-secret", " ", true),
            CancellationToken.None);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        var problem = Assert.IsType<ProblemDetails>(badRequest.Value);
        Assert.Equal("AI provider settings rejected", problem.Title);
        Assert.Contains("Default model is required", problem.Detail, StringComparison.Ordinal);
        Assert.DoesNotContain("google-secret", problem.Detail, StringComparison.Ordinal);
    }

    [Fact]
    public async Task CheckAsync_StoresReadyStatusWithoutCallingProvider()
    {
        await using var context = CreateContext();
        var service = CreateService(context, isAdmin: true);
        await service.UpdateAsync(
            new UpdateAiProviderSettingsRequest(AiProviders.GoogleAI, "google-secret", "gemini-1.5-flash", true),
            CancellationToken.None);

        var response = await service.CheckAsync(CancellationToken.None);

        Assert.NotNull(response);
        Assert.Equal(AiProviderCheckStatuses.Ready, response.Status);
        var setting = await context.AiProviderSettings.SingleAsync();
        Assert.Equal(AiProviderCheckStatuses.Ready, setting.LastCheckStatus);
    }

    [Fact]
    public async Task GetAsync_ReturnsNullForNonAdmin()
    {
        await using var context = CreateContext();
        var service = CreateService(context, isAdmin: false);

        var response = await service.GetAsync(CancellationToken.None);

        Assert.Null(response);
    }

    private static AiProviderSettingsService CreateService(FormAutoHubDbContext context, bool isAdmin) =>
        new(context, new TestSecretProtector(), new TestCurrentUserContext(isAdmin));

    private static FormAutoHubDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new FormAutoHubDbContext(options);
    }

    private sealed class TestCurrentUserContext(bool isAdmin) : ICurrentUserContext
    {
        public Guid UserId { get; } = Guid.NewGuid();
        public bool IsAdmin { get; } = isAdmin;
    }

    private sealed class TestSecretProtector : IAiProviderSecretProtector
    {
        public string Protect(string value) => $"protected:{value}";
        public string Unprotect(string value) => value.Replace("protected:", string.Empty, StringComparison.Ordinal);
        public string Preview(string encryptedValue)
        {
            if (string.IsNullOrWhiteSpace(encryptedValue))
            {
                return string.Empty;
            }

            var value = Unprotect(encryptedValue);
            return value.Length <= 4 ? "****" : $"****{value[^4..]}";
        }
    }
}
