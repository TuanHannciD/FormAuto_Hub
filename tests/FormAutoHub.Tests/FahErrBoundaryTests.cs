using System.Net;
using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Controllers;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Integrations.GoogleForms;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Tests;

public sealed class FahErrBoundaryTests
{
    [Theory]
    [InlineData("not-a-url", "", "đường dẫn")]
    [InlineData("https://example.org/forms/test", "", "Google Forms")]
    [InlineData("https://docs.google.com/forms/d/test/viewform", "no entries", "câu hỏi")]
    [InlineData("https://docs.google.com/forms/d/test/viewform", "<input name='entry.1'>", "địa chỉ gửi")]
    public async Task Analyze_ExplainsKnownFailuresAndPersistsSafeFailedUsage(string url, string html, string guidance)
    {
        await using var db = Context();
        using var http = new HttpClient(new Reply(HttpStatusCode.OK, html));
        var service = new FormProjectService(db, new UserContext(), new GoogleFormsClient(http));
        var error = await Assert.ThrowsAsync<InvalidOperationException>(() => service.AnalyzeAsync(new(url, ""), default));
        Assert.Contains(guidance, error.Message, StringComparison.OrdinalIgnoreCase);
        Assert.NotNull(error.InnerException);
        var usage = await db.UsageLogs.SingleAsync();
        Assert.Equal(error.Message, usage.Description);
        Assert.Equal(UsageLogStatuses.Failed, usage.Status);
        Assert.Equal("AnalyzeForm", usage.Action);
        Assert.Equal(0, usage.CreditsUsed);
        Assert.Empty(db.FormProjects);
    }

    [Fact]
    public async Task Analyze_TransportCauseDoesNotBecomePublicHistoryText()
    {
        await using var db = Context();
        var cause = new HttpRequestException("secret-provider-body token=private", null, HttpStatusCode.ServiceUnavailable);
        var service = new FormProjectService(db, new UserContext(), new FailingAnalysis(cause));
        var error = await Assert.ThrowsAsync<InvalidOperationException>(() => service.AnalyzeAsync(new("https://docs.google.com/forms/d/test/viewform", ""), default));
        Assert.Same(cause, error.InnerException);
        Assert.DoesNotContain("private", error.Message);
        Assert.Contains("thử lại", error.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(error.Message, (await db.UsageLogs.SingleAsync()).Description);
    }

    [Theory]
    [InlineData(503, "secret-provider-body token=private")]
    [InlineData(200, "{\"data\":null,\"desc\":\"secret-provider-body token=private\"}")]
    [InlineData(200, "{\"data\":{\"checkoutUrl\":\"\"},\"desc\":\"secret-provider-body token=private\"}")]
    [InlineData(200, "secret-provider-body token=private")]
    public async Task Payos_InvalidProviderResponseReturnsSafeFailure(int status, string body)
    {
        using var http = new HttpClient(new Reply((HttpStatusCode)status, body));
        var client = new PayosClient(http);
        var result = await client.CreatePaymentLinkAsync(new(123, 1000, "test", "https://example.org/return", "https://example.org/cancel", "signature"), new("client", "key", "checksum"), default);
        Assert.False(result.Success);
        Assert.Empty(result.CheckoutUrl);
        Assert.DoesNotContain("secret-provider-body", result.ErrorMessage);
        Assert.DoesNotContain("private", result.ErrorMessage);
        Assert.Contains("PayOS", result.ErrorMessage);
    }

    [Theory]
    [InlineData("", 1, 1000, "Tên")]
    [InlineData("test", 0, 1000, "credit")]
    [InlineData("test", 1, 0, "Giá")]
    [InlineData("test", 1, -1, "Giá")]
    [InlineData("test", 1, 1.5, "nguyên")]
    public async Task Package_CreateAndUpdateMapKnownValidationTo400WithoutWrites(string name, int credits, double price, string guidance)
    {
        await using var db = Context();
        var user = new UserContext(true);
        var controller = new AdminPackagesController(new PackageService(db, user), user);
        var created = await controller.CreatePackage(new(name, credits, (decimal)price, true), default);
        var updated = await controller.UpdatePackage(Guid.NewGuid(), new(name, credits, (decimal)price, true), default);
        foreach (var result in new IActionResult?[] { created.Result, updated.Result })
        {
            var bad = Assert.IsType<BadRequestObjectResult>(result);
            var problem = Assert.IsType<ProblemDetails>(bad.Value);
            Assert.Contains(guidance, problem.Detail);
            Assert.DoesNotContain("Parameter", problem.Detail);
        }
        Assert.Empty(db.CreditPackages);
    }

    [Theory]
    [InlineData(AnswerRuleModes.RandomByPercentage, FormQuestionTypes.MultipleChoice, "{\"weights\":{\"A\":-1}}", "âm")]
    [InlineData(AnswerRuleModes.RandomByPercentage, FormQuestionTypes.MultipleChoice, "{\"weights\":{\"A\":101}}", "100")]
    [InlineData(AnswerRuleModes.RandomByPercentage, FormQuestionTypes.MultipleChoice, "{\"weights\":{\"A\":\"bad\"}}", "số nguyên")]
    [InlineData(AnswerRuleModes.RandomByQuantity, FormQuestionTypes.MultipleChoice, "{\"quantities\":{\"A\":-1}}", "âm")]
    [InlineData(AnswerRuleModes.SampleTextLines, FormQuestionTypes.ShortText, "{}", "mẫu")]
    [InlineData(AnswerRuleModes.DateRangeSequential, FormQuestionTypes.Date, "{\"fromDate\":\"2026-02-02\",\"toDate\":\"2026-01-01\"}", "bắt đầu")]
    [InlineData(AnswerRuleModes.TimeRangeSequential, FormQuestionTypes.Time, "{\"fromTime\":\"09:00\",\"toTime\":\"10:00\",\"stepMinutes\":4}", "5 đến 120")]
    [InlineData(AnswerRuleModes.TimeRangeSequential, FormQuestionTypes.Time, "{\"fromTime\":\"\",\"toTime\":\"10:00\",\"stepMinutes\":5}", "HH:mm")]
    [InlineData(AnswerRuleModes.SampleTextLines, FormQuestionTypes.ShortText, "[]", "đối tượng")]
    public async Task Rules_ReturnExistingConstraintGuidanceWithoutSaving(string mode, string type, string config, string guidance)
    {
        await using var db = Context();
        var user = new UserContext();
        var (project, question) = SeedQuestion(db, user.UserId, type);
        await db.SaveChangesAsync();
        var service = new AnswerRuleService(db, user);
        var error = await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(project, new(question, mode, config), default));
        Assert.Contains(guidance, error.Message, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(config, error.Message);
        Assert.Empty(db.AnswerRules);
    }

    [Fact]
    public async Task Rules_MalformedJsonRetainsOriginalCause()
    {
        await using var db = Context();
        var user = new UserContext();
        var (project, question) = SeedQuestion(db, user.UserId, FormQuestionTypes.ShortText);
        await db.SaveChangesAsync();
        var error = await Assert.ThrowsAsync<InvalidOperationException>(() => new AnswerRuleService(db, user).CreateAsync(project, new(question, AnswerRuleModes.SampleTextLines, "{"), default));
        Assert.IsAssignableFrom<JsonException>(error.InnerException);
        Assert.DoesNotContain("ConfigJson", error.Message);
    }

    [Fact]
    public async Task ProviderCheck_ExplainsLocalCheckAndDoesNotPromiseConnectivity()
    {
        await using var db = Context();
        var service = new AiProviderSettingsService(db, new Protector(), new UserContext(true));
        var missing = await service.CheckAsync(default);
        Assert.Contains("cấu hình", missing!.Message, StringComparison.OrdinalIgnoreCase);
        await service.UpdateAsync(new("OpenAI", "synthetic-key", "test-model", true), default);
        var ready = await service.CheckAsync(default);
        Assert.Equal(AiProviderCheckStatuses.Ready, ready!.Status);
        Assert.Contains("chưa kiểm tra kết nối", ready.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task PromptAudienceValidationNamesUserContextAndKeepsSyntaxCause()
    {
        await using var db = Context();
        var user = new UserContext();
        var (project, _) = SeedQuestion(db, user.UserId, FormQuestionTypes.ShortText);
        await db.SaveChangesAsync();
        var service = new AiPromptProfileService(db, user, new AiPromptGuardService());
        var error = await Assert.ThrowsAsync<InvalidOperationException>(() => service.UpsertProfileAsync(project, new(AiPromptProfileModes.Option2, "{", ""), default));
        Assert.Contains("bối cảnh", error.Message, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("AudienceJson", error.Message);
        Assert.IsAssignableFrom<JsonException>(error.InnerException);
        Assert.Empty(db.AiPromptProfiles);
    }

    private static FormAutoHubDbContext Context() => new(new DbContextOptionsBuilder<FormAutoHubDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    private static (Guid Project, Guid Question) SeedQuestion(FormAutoHubDbContext db, Guid userId, string type)
    {
        var project = Guid.NewGuid();
        var question = Guid.NewGuid();
        db.FormProjects.Add(new() { Id = project, UserId = userId, Name = "test", FormUrl = "test", FormTitle = "test", FormActionUrl = "test", Status = FormProjectStatuses.Analyzed, CreatedAt = DateTimeOffset.UtcNow });
        db.FormQuestions.Add(new() { Id = question, ProjectId = project, Label = "test", EntryId = "entry.1", QuestionType = type, OptionsJson = "[\"A\",\"B\"]" });
        return (project, question);
    }
    private sealed class UserContext(bool admin = false) : ICurrentUserContext
    {
        public Guid UserId { get; } = Guid.NewGuid();
        public bool IsAdmin => admin;
    }
    private sealed class Reply(HttpStatusCode status, string body) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) => Task.FromResult(new HttpResponseMessage(status) { Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json") });
    }
    private sealed class FailingAnalysis(Exception cause) : IGoogleFormsClient
    {
        public Task<GoogleFormAnalysis> AnalyzeAsync(string formUrl, CancellationToken cancellationToken) => Task.FromException<GoogleFormAnalysis>(cause);
        public Task<GoogleFormSubmitResult> SubmitAsync(string actionUrl, IReadOnlyDictionary<string, IReadOnlyList<string>> answers, CancellationToken cancellationToken) => throw new NotSupportedException();
    }
    private sealed class Protector : IAiProviderSecretProtector
    {
        public string Protect(string value) => value;
        public string Unprotect(string value) => value;
        public string Preview(string encryptedValue) => "****";
    }
}
