using System.Net;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Integrations.GoogleForms;
using FormAutoHub.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Tests;

public sealed class GoogleFormsCompatibilityTests
{
    [Fact]
    public async Task SupportedPublicFormAllowsOwnedBatchAndRejectsImmutableTargetOrPayloadDrift()
    {
        await using var db = new FormAutoHubDbContext(new DbContextOptionsBuilder<FormAutoHubDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var f = await SubmissionV2Fixture.SeedAsync(db, 1);
        using var http = new HttpClient(new Handler());
        var checker = new SubmissionCompatibilityService(db, new SubmissionV2Fixture.UserContext(f.User), new GoogleFormsClient(http));
        var result = await checker.CheckAsync(f.Project, f.Batch, f.Ids, default);
        Assert.True(result.Compatible);
        var project = await db.FormProjects.SingleAsync();
        project.FormUrl = "https://docs.google.com/forms/d/e/other/viewform";
        project.FormActionUrl = "https://docs.google.com/forms/d/e/other/formResponse";
        await db.SaveChangesAsync();
        Assert.False((await checker.CheckAsync(f.Project, f.Batch, f.Ids, default)).Compatible);
        project.FormUrl = GoogleFormsSubmissionParserTests.Form; project.FormActionUrl = GoogleFormsSubmissionParserTests.Action;
        var question = await db.FormQuestions.SingleAsync(); question.EntryId = "entry.2"; await db.SaveChangesAsync();
        Assert.False((await checker.CheckAsync(f.Project, f.Batch, f.Ids, default)).Compatible);
    }
    [Fact]
    public async Task ChangingKnownBatchOptionsBlocksEvenIfSelectedValueStillExists()
    {
        await using var db = new FormAutoHubDbContext(new DbContextOptionsBuilder<FormAutoHubDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var user = Guid.NewGuid(); var project = Guid.NewGuid(); var question = Guid.NewGuid();
        db.FormProjects.Add(new() { Id = project, UserId = user, Name = "Fixture", FormUrl = GoogleFormsSubmissionParserTests.Form, FormActionUrl = GoogleFormsSubmissionParserTests.Action });
        db.FormQuestions.Add(new() { Id = question, ProjectId = project, EntryId = "entry.1", QuestionType = "MultipleChoice", OptionsJson = "[\"A\",\"B\"]" });
        db.AnswerRules.Add(new() { Id = Guid.NewGuid(), ProjectId = project, QuestionId = question, Mode = "RandomEqually", ConfigJson = "{}" }); await db.SaveChangesAsync();
        var generated = await new ResponseGenerationService(db, new SubmissionV2Fixture.UserContext(user), new CreditService(db)).GenerateAsync(project, new(1), default);
        db.FormQuestions.Single().OptionsJson = "[\"A\",\"C\"]"; await db.SaveChangesAsync();
        var google = new MetadataClient(new(GoogleFormsSubmissionParserTests.Form, GoogleFormsSubmissionParserTests.Action,
            [new("Synthetic", "entry.1", "MultipleChoice", ["A", "C"], false, 0)], 1));
        var checker = new SubmissionCompatibilityService(db, new SubmissionV2Fixture.UserContext(user), google);
        Assert.False((await checker.CheckAsync(project, generated!.GenerationBatchId, [], default)).Compatible);
    }
    [Fact]
    public async Task PreflightFailureReleasesUnattemptedHoldWithoutPossibleDispatch()
    {
        await using var db = new FormAutoHubDbContext(new DbContextOptionsBuilder<FormAutoHubDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var f = await SubmissionV2Fixture.SeedAsync(db, 1);
        var handler = new PreflightFailure(); using var http = new HttpClient(handler);
        var service = new SubmissionService(db, new SubmissionV2Fixture.UserContext(f.User), new GoogleFormsClient(http), new SubmissionV2Fixture.Compatibility());
        var result = await service.SendAsync(f.Project, new(2, Guid.NewGuid(), f.Batch, f.Ids, true, false), default);
        Assert.NotNull(result); Assert.Equal(0, result.UnknownCount); Assert.Equal(0, result.Fees!.HeldCredits);
        var item = await db.SubmissionJobItems.SingleAsync(); Assert.Equal("NotDispatched", item.AttemptState); Assert.Null(item.PossibleDispatchAt);
        Assert.Equal(0, handler.Posts); Assert.Empty(db.CreditTransactions);
    }
    private sealed class PreflightFailure : HttpMessageHandler
    {
        public int Posts;
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        { if (request.Method == HttpMethod.Post) Posts++; return Task.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)); }
    }

    private sealed class MetadataClient(GoogleFormsSubmissionMetadata value) : IGoogleFormsClient
    {
        public Task<GoogleFormsSubmissionMetadata?> GetSubmissionMetadataAsync(string url, CancellationToken ct) => Task.FromResult<GoogleFormsSubmissionMetadata?>(value);
        public Task<GoogleFormAnalysis> AnalyzeAsync(string url, CancellationToken ct) => throw new NotSupportedException();
        public Task<GoogleFormSubmitResult> SubmitAsync(string url, IReadOnlyDictionary<string, IReadOnlyList<string>> answers, CancellationToken ct) => throw new NotSupportedException();
    }

    private sealed class Handler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(GoogleFormsSubmissionParserTests.Document()) });
    }
}
