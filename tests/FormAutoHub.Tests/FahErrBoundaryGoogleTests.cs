using System.Net;
using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Controllers.Nckh;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Entities.Nckh;
using FormAutoHub.Api.Integrations.Google;
using FormAutoHub.Api.Services;
using FormAutoHub.Api.Services.Nckh;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Tests;

public sealed class FahErrBoundaryGoogleTests
{
    [Fact]
    public async Task NestedShape_ImportNullItemMapsSafeExternalFailureWithoutWrites()
    {
        await using var db = Context();
        using var http = new HttpClient(new Reply(HttpStatusCode.OK, "{\"formId\":\"form\",\"items\":[null],\"private\":\"provider-marker\"}"));
        var result = await new ResearchFormService(db, new LinkedOAuth(), new GoogleFormsApiService(http))
            .ImportFormAsync(Guid.NewGuid(), new("https://docs.google.com/forms/d/form/edit"), default);
        Assert.Equal(ResearchFormServiceStatus.ExternalError, result.Status);
        Assert.Contains("dữ liệu không hợp lệ", result.Message!);
        Assert.DoesNotContain("provider-marker", result.Message!);
        Assert.DoesNotContain("liên kết lại", result.Message!);
        Assert.Empty(db.ResearchForms);
        Assert.Empty(db.ResearchFormQuestions);
    }

    [Theory]
    [InlineData("{\"responses\":[null]}")]
    [InlineData("{\"responses\":[{\"responseId\":\"r1\",\"answers\":{\"q1\":null}}]}")]
    [InlineData("{\"responses\":[{\"responseId\":\"r1\",\"answers\":{\"q1\":{\"textAnswers\":{\"answers\":[null]}}}}]}")]
    public async Task NestedShape_CollectMaps502AndPersistsFailedLogWithoutResponseWrites(string body)
    {
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var db = new FormAutoHubDbContext(options);
        var user = new UserContext();
        var modelId = await SeedResearch(db, user.UserId);
        using var http = new HttpClient(new Reply(HttpStatusCode.OK, body));
        var service = new ResearchDataService(db, new LinkedOAuth(), new GoogleFormsApiService(http));
        var result = await new ResearchDataController(service, null!, user).CollectResponses(modelId, default);
        var failure = Assert.IsAssignableFrom<ObjectResult>(result.Result);
        Assert.Equal(502, failure.StatusCode);
        using var publicBody = JsonDocument.Parse(JsonSerializer.Serialize(failure.Value));
        var detail = publicBody.RootElement.GetProperty("detail").GetString()!;
        Assert.Contains("dữ liệu không hợp lệ", detail);
        Assert.DoesNotContain("liên kết lại", detail);
        Assert.DoesNotContain(body, detail);
        await using var fresh = new FormAutoHubDbContext(options);
        var log = await fresh.DataCollectionLogs.SingleAsync();
        Assert.Equal("Failed", log.Status);
        Assert.Equal(detail, log.ErrorMessage);
        Assert.NotNull(log.CompletedAt);
        Assert.Empty(fresh.SurveyResponses);
    }

    [Fact]
    public async Task NestedShape_CollectPreservesTypedFailureAndDiagnosticIdAfterSaving()
    {
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var db = new FormAutoHubDbContext(options);
        var user = new UserContext();
        var modelId = await SeedResearch(db, user.UserId);
        using var http = new HttpClient(new Reply(HttpStatusCode.OK, "{\"responses\":[null]}"));
        var error = await Assert.ThrowsAnyAsync<HttpRequestException>(() => new ResearchDataService(db, new LinkedOAuth(), new GoogleFormsApiService(http))
            .CollectResponsesAsync(user.UserId, modelId, default));
        Assert.Equal(HttpStatusCode.OK, error.StatusCode);
        Assert.Contains("dữ liệu không hợp lệ", error.Message);
        await using var fresh = new FormAutoHubDbContext(options);
        var log = await fresh.DataCollectionLogs.SingleAsync();
        Assert.Equal(log.Id, error.Data["DataCollectionLogId"]);
        Assert.Equal(modelId, error.Data["ModelId"]);
        Assert.Equal("Failed", log.Status);
        Assert.Empty(fresh.SurveyResponses);
    }

    [Fact]
    public async Task NestedShape_ValidNonQuestionItemAndEmptyResponsesRemainSupported()
    {
        using var formHttp = new HttpClient(new Reply(HttpStatusCode.OK, "{\"formId\":\"form\",\"items\":[{\"title\":\"Section\"}]}"));
        var structure = await new GoogleFormsApiService(formHttp).GetFormStructureAsync("synthetic", "form", default);
        Assert.Equal("form", structure!.FormId);
        Assert.Empty(structure.Questions);
        using var responseHttp = new HttpClient(new Reply(HttpStatusCode.OK, "{}"));
        Assert.Empty((await new GoogleFormsApiService(responseHttp).ListResponsesAsync("synthetic", "form", default))!);
    }

    [Theory]
    [InlineData(401)]
    [InlineData(403)]
    [InlineData(404)]
    [InlineData(429)]
    [InlineData(503)]
    public async Task Forms_NonSuccessRetainsStatusWithoutProviderPayload(int status)
    {
        using var http = new HttpClient(new Reply((HttpStatusCode)status, "secret token=private"));
        var service = new GoogleFormsApiService(http);
        var error = await Assert.ThrowsAnyAsync<HttpRequestException>(() => service.GetFormStructureAsync("synthetic", "form", default));
        Assert.Equal((HttpStatusCode)status, error.StatusCode);
        Assert.DoesNotContain("private", error.Message);
    }

    [Theory]
    [InlineData("not-json")]
    [InlineData("{}")]
    public async Task Forms_InvalidEnvelopeIsProviderFailureRatherThanMissingForm(string body)
    {
        using var http = new HttpClient(new Reply(HttpStatusCode.OK, body));
        var error = await Assert.ThrowsAnyAsync<HttpRequestException>(() => new GoogleFormsApiService(http).GetFormStructureAsync("synthetic", "form", default));
        Assert.Contains("Google", error.Message);
    }

    [Theory]
    [InlineData(400, "{\"error\":\"invalid_grant\",\"error_description\":\"private\"}")]
    [InlineData(401, "{\"error\":\"invalid_client\",\"error_description\":\"private\"}")]
    [InlineData(429, "private")]
    [InlineData(503, "private")]
    public async Task OAuth_FailuresRetainStatusAndDoNotReturnUnlinked(int status, string body)
    {
        await using var db = Context();
        using var http = new HttpClient(new Reply((HttpStatusCode)status, body));
        var service = OAuth(http, db);
        var error = await Assert.ThrowsAnyAsync<HttpRequestException>(() => service.RefreshAccessTokenAsync("synthetic", default));
        Assert.Equal((HttpStatusCode)status, error.StatusCode);
        Assert.DoesNotContain("private", error.Message);
    }

    [Theory]
    [InlineData("{}")]
    [InlineData("not-json")]
    public async Task OAuth_MissingOrMalformedTokenIsNotAnUnlinkedAccount(string body)
    {
        await using var db = Context();
        using var http = new HttpClient(new Reply(HttpStatusCode.OK, body));
        await Assert.ThrowsAnyAsync<HttpRequestException>(() => OAuth(http, db).ExchangeCodeAsync("synthetic", "https://example.org/callback", default));
    }

    [Fact]
    public async Task OAuth_MissingConfigurationIsNotAnUnlinkedAccount()
    {
        await using var db = Context();
        using var http = new HttpClient(new Reply(HttpStatusCode.OK, "{}"));
        var service = new GoogleOAuthService(http, db, new Protector(), Options.Create(new AuthOptions()));
        var error = await Assert.ThrowsAnyAsync<HttpRequestException>(() => service.ExchangeCodeAsync("synthetic", "https://example.org/callback", default));
        Assert.Contains("cấu hình", error.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData(401, ResearchFormServiceStatus.Unauthorized)]
    [InlineData(403, ResearchFormServiceStatus.Forbidden)]
    [InlineData(404, ResearchFormServiceStatus.NotFound)]
    [InlineData(429, ResearchFormServiceStatus.ExternalError)]
    [InlineData(503, ResearchFormServiceStatus.ExternalError)]
    public async Task Import_MapsProviderStatusToExistingOperationResult(int status, ResearchFormServiceStatus expected)
    {
        await using var db = Context();
        using var http = new HttpClient(new Reply((HttpStatusCode)status, "private"));
        var service = new ResearchFormService(db, new LinkedOAuth(), new GoogleFormsApiService(http));
        var result = await service.ImportFormAsync(Guid.NewGuid(), new("https://docs.google.com/forms/d/form/edit"), default);
        Assert.Equal(expected, result.Status);
        Assert.DoesNotContain("private", result.Message ?? "");
        if (expected == ResearchFormServiceStatus.ExternalError)
            Assert.DoesNotContain("liên kết lại", result.Message ?? "", StringComparison.OrdinalIgnoreCase);
        Assert.Empty(db.ResearchForms);
    }

    [Fact]
    public async Task Link_MissingServerConfigurationMapsExternalErrorRatherThanBadAuthorizationCode()
    {
        await using var db = Context();
        using var http = new HttpClient(new Reply(HttpStatusCode.OK, "{}"));
        var oauth = new GoogleOAuthService(http, db, new Protector(), Options.Create(new AuthOptions()));
        var service = new ResearchFormService(db, oauth, new GoogleFormsApiService(http));
        var result = await service.LinkGoogleAsync(Guid.NewGuid(), new("synthetic", "https://example.org/callback"), default);
        Assert.Equal(ResearchFormServiceStatus.ExternalError, result.Status);
        Assert.Empty(db.UserExternalLogins);
    }

    [Fact]
    public async Task Forms_CallerCancellationRemainsCancellation()
    {
        using var canceled = new CancellationTokenSource();
        canceled.Cancel();
        using var http = new HttpClient(new Reply(HttpStatusCode.OK, "{}"));
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => new GoogleFormsApiService(http).GetFormStructureAsync("synthetic", "form", canceled.Token));
    }

    [Theory]
    [InlineData(400, "invalid_grant", ResearchFormServiceStatus.InvalidRequest)]
    [InlineData(401, "invalid_client", ResearchFormServiceStatus.ExternalError)]
    public async Task Link_DistinguishesRejectedGrantFromServerClientConfiguration(int status, string code, ResearchFormServiceStatus expected)
    {
        await using var db = Context();
        using var http = new HttpClient(new Reply((HttpStatusCode)status, JsonSerializer.Serialize(new { error = code, error_description = "private" })));
        var result = await new ResearchFormService(db, OAuth(http, db), new GoogleFormsApiService(http))
            .LinkGoogleAsync(Guid.NewGuid(), new("synthetic", "https://example.org/callback"), default);
        Assert.Equal(expected, result.Status);
        Assert.DoesNotContain("private", result.Message!);
        Assert.Empty(db.UserExternalLogins);
    }

    [Fact]
    public async Task OAuth_SuccessUsesInjectedTransportForTokenAndUserInfo()
    {
        await using var db = Context();
        var calls = 0;
        using var http = new HttpClient(new CallbackReply(request =>
        {
            calls++;
            var body = request.RequestUri!.Host == "oauth2.googleapis.com"
                ? "{\"access_token\":\"synthetic\",\"refresh_token\":\"refresh\",\"expires_in\":3600,\"scope\":\"forms\"}"
                : "{\"id\":\"google-sub\",\"email\":\"TEST@example.invalid\"}";
            return Response(HttpStatusCode.OK, body);
        }));
        var result = await OAuth(http, db).ExchangeCodeAsync("code", "https://example.org/callback", default);
        Assert.Equal("google-sub", result!.ProviderUserId);
        Assert.Equal("test@example.invalid", result.Email);
        Assert.Equal("refresh", result.RefreshToken);
        Assert.Equal(2, calls);
    }

    [Theory]
    [InlineData(401, 401)]
    [InlineData(403, 403)]
    [InlineData(404, 404)]
    [InlineData(429, 502)]
    [InlineData(503, 502)]
    public async Task Collect_ControllerMapsTypedFailureAfterFreshContextSeesFailedLog(int providerStatus, int expectedStatus)
    {
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var db = new FormAutoHubDbContext(options);
        var user = new UserContext();
        var modelId = await SeedResearch(db, user.UserId);
        using var http = new HttpClient(new Reply((HttpStatusCode)providerStatus, "private"));
        var service = new ResearchDataService(db, new LinkedOAuth(), new GoogleFormsApiService(http));
        var result = await new ResearchDataController(service, null!, user).CollectResponses(modelId, default);
        var failure = Assert.IsAssignableFrom<ObjectResult>(result.Result);
        Assert.Equal(expectedStatus, failure.StatusCode);
        var body = JsonSerializer.Serialize(failure.Value);
        Assert.DoesNotContain("private", body);
        if (providerStatus == 401)
            Assert.Contains("Google account not linked or token expired. Please re-link your Google account.", body);
        await using var fresh = new FormAutoHubDbContext(options);
        var log = await fresh.DataCollectionLogs.SingleAsync();
        Assert.Equal("Failed", log.Status);
        Assert.NotNull(log.CompletedAt);
        Assert.DoesNotContain("private", log.ErrorMessage!);
        Assert.Empty(fresh.SurveyResponses);
    }

    [Fact]
    public async Task Collect_TransportFailureRetainsOriginalInnerAndDurableLog()
    {
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var db = new FormAutoHubDbContext(options);
        var user = new UserContext();
        var modelId = await SeedResearch(db, user.UserId);
        var original = new HttpRequestException("private transport cause");
        using var http = new HttpClient(new CallbackReply(_ => throw original));
        var error = await Assert.ThrowsAnyAsync<HttpRequestException>(() => new ResearchDataService(db, new LinkedOAuth(), new GoogleFormsApiService(http)).CollectResponsesAsync(user.UserId, modelId, default));
        Assert.Same(original, error.InnerException);
        Assert.DoesNotContain("private", error.Message);
        Assert.NotNull(error.Data["DataCollectionLogId"]);
        await using var fresh = new FormAutoHubDbContext(options);
        Assert.Equal("Failed", (await fresh.DataCollectionLogs.SingleAsync()).Status);
    }

    [Fact]
    public async Task Generate_TypedFailureAfterCreateRetainsRemoteAuditAndWarnsBeforeRepeat()
    {
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var db = new FormAutoHubDbContext(options);
        var user = new UserContext();
        var modelId = await SeedResearch(db, user.UserId);
        var creates = 0;
        var updates = 0;
        using var http = new HttpClient(new CallbackReply(request =>
        {
            if (request.RequestUri!.AbsolutePath.EndsWith(":batchUpdate"))
            {
                updates++;
                return Response(HttpStatusCode.ServiceUnavailable, "private");
            }
            creates++;
            return Response(HttpStatusCode.OK, "{\"formId\":\"remote-created\"}");
        }));
        var result = await new ResearchFormService(db, new LinkedOAuth(), new GoogleFormsApiService(http))
            .GenerateFormAsync(user.UserId, modelId, new("create"), default);
        Assert.Equal(ResearchFormServiceStatus.ExternalError, result.Status);
        Assert.Contains("kiểm tra kết quả", result.Message!);
        Assert.DoesNotContain("private", result.Message!);
        Assert.Equal(1, creates);
        Assert.Equal(1, updates);
        await using var fresh = new FormAutoHubDbContext(options);
        var audit = await fresh.AuditLogs.SingleAsync();
        Assert.Contains("remote-created", audit.MetadataJson);
        Assert.Single(fresh.ResearchForms); // Only the original imported form.
    }

    private static async Task<Guid> SeedResearch(FormAutoHubDbContext db, Guid userId)
    {
        var form = new ResearchForm { Id = Guid.NewGuid(), UserId = userId, GoogleFormId = "source-form", Title = "Synthetic", Status = "Draft" };
        var model = new ResearchModel { Id = Guid.NewGuid(), UserId = userId, FormId = form.Id, Name = "Synthetic model", Status = "Active" };
        var question = new ResearchFormQuestion { Id = Guid.NewGuid(), FormId = form.Id, GoogleQuestionId = "q1", QuestionText = "Synthetic question", QuestionType = "shortText" };
        var variable = new ResearchVariable { Id = Guid.NewGuid(), ModelId = model.Id, Name = "Synthetic", Code = "A", VariableType = "Independent", ScaleType = "Nominal" };
        db.ResearchForms.Add(form);
        db.ResearchModels.Add(model);
        db.ResearchFormQuestions.Add(question);
        db.ResearchVariables.Add(variable);
        db.ObservedQuestionMappings.Add(new ObservedQuestionMapping { Id = Guid.NewGuid(), VariableId = variable.Id, FormQuestionId = question.Id, ObservedCode = "A1" });
        db.UserExternalLogins.Add(new UserExternalLogin { Id = Guid.NewGuid(), UserId = userId, Provider = "Google", ProviderUserId = "synthetic", Email = "synthetic@example.invalid", Scopes = "https://www.googleapis.com/auth/forms.body https://www.googleapis.com/auth/forms.responses.readonly" });
        await db.SaveChangesAsync();
        return model.Id;
    }

    private static HttpResponseMessage Response(HttpStatusCode status, string body) => new(status) { Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json") };
    private sealed class CallbackReply(Func<HttpRequestMessage, HttpResponseMessage> reply) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) => Task.FromResult(reply(request));
    }
    private sealed class UserContext : ICurrentUserContext
    {
        public Guid UserId { get; } = Guid.NewGuid();
        public bool IsAdmin => false;
    }

    private static GoogleOAuthService OAuth(HttpClient http, FormAutoHubDbContext db) => new(http, db, new Protector(), Options.Create(new AuthOptions { GoogleOAuthClientId = "test-client", GoogleOAuthClientSecret = "test-secret" }));
    private static FormAutoHubDbContext Context() => new(new DbContextOptionsBuilder<FormAutoHubDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    private sealed class Reply(HttpStatusCode status, string body) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            return Task.FromResult(new HttpResponseMessage(status) { Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json") });
        }
    }
    private sealed class Protector : IGoogleTokenProtector
    {
        public string Protect(string value) => value;
        public string Unprotect(string value) => value;
    }
    private sealed class LinkedOAuth : IGoogleOAuthService
    {
        public Task<string?> GetValidAccessTokenAsync(Guid userId, CancellationToken cancellationToken) => Task.FromResult<string?>("synthetic");
        public Task<GoogleOAuthTokens?> ExchangeCodeAsync(string authorizationCode, string redirectUri, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<GoogleOAuthTokens?> RefreshAccessTokenAsync(string refreshToken, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task StoreTokensAsync(Guid userExternalLoginId, GoogleOAuthTokens tokens, CancellationToken cancellationToken) => throw new NotSupportedException();
    }
}
