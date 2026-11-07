using System.Security.Cryptography;
using System.Text;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Integrations.GoogleForms;
using FormAutoHub.Api.Services;

namespace FormAutoHub.Tests;

internal static class SubmissionV2Fixture
{
    public static async Task<(Guid User, Guid Project, Guid Batch, Guid[] Ids)> SeedAsync(FormAutoHubDbContext db, int count = 10, decimal balance = 10, Guid? owner = null)
    {
        var user = owner ?? Guid.NewGuid(); var project = Guid.NewGuid(); var question = Guid.NewGuid();
        if (owner is null)
        {
            db.Users.Add(new() { Id = user, Email = $"synthetic-{user:N}@example.invalid", FullName = "Synthetic" });
            db.UserCreditAccounts.Add(new() { Id = Guid.NewGuid(), UserId = user, Balance = balance });
        }
        db.FormProjects.Add(new() { Id = project, UserId = user, Name = "Synthetic receiver fixture", FormUrl = "https://docs.google.com/forms/d/e/synthetic/viewform", FormActionUrl = "https://docs.google.com/forms/d/e/synthetic/formResponse" });
        db.FormQuestions.Add(new() { Id = question, ProjectId = project, EntryId = "entry.1", Label = "Synthetic", QuestionType = FormQuestionTypes.ShortText, OptionsJson = "[]" });
        db.AnswerRules.Add(new() { Id = Guid.NewGuid(), ProjectId = project, QuestionId = question, Mode = AnswerRuleModes.SampleTextLines, ConfigJson = "{\"samples\":[\"one\",\"two\"]}" });
        await db.SaveChangesAsync();
        var generated = await new ResponseGenerationService(db, new UserContext(user), new CreditService(db)).GenerateAsync(project, new(count), default);
        return (user, project, generated!.GenerationBatchId!.Value, generated.Items.Select(x => x.Id).ToArray());
    }

    public static SubmissionService Service(FormAutoHubDbContext db, Guid user, Receiver receiver, Compatibility? compatibility = null) =>
        new(db, new UserContext(user), receiver, compatibility ?? new());
    public sealed record UserContext(Guid UserId) : ICurrentUserContext { public bool IsAdmin => false; }
    // Provenance is explicitly synthetic; not registered by production DI and never real Google proof.
    public sealed class Compatibility : ISubmissionCompatibilityService
    {
        public int Calls { get; private set; }
        public bool Compatible { get; set; } = true;
        public string Evidence { get; set; } = GoogleFormsSubmissionParser.Parse(GoogleFormsSubmissionParserTests.Form, GoogleFormsSubmissionParserTests.Document())!.SemanticJson;
        public Task<SubmissionCompatibilityResult> CheckAsync(Guid projectId, Guid? batchId, IReadOnlyList<Guid> ids, CancellationToken ct)
        {
            Calls++;
            return Task.FromResult(new SubmissionCompatibilityResult(Compatible, Compatible ? null : "FormIncompatible", "{}", Evidence,
                Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(Evidence))), DateTimeOffset.UtcNow));
        }
    }
    public sealed class Receiver : IGoogleFormsClient
    {
        public int Calls { get; private set; }
        public Func<int, Task<SubmissionOutcomeKind>> Outcome { get; set; } = _ => Task.FromResult(SubmissionOutcomeKind.ConfirmedSuccess);
        public Task<GoogleFormAnalysis> AnalyzeAsync(string url, CancellationToken ct) => throw new NotSupportedException();
        public Task<GoogleFormSubmitResult> SubmitAsync(string url, IReadOnlyDictionary<string, IReadOnlyList<string>> answers, CancellationToken ct) => throw new InvalidOperationException("Bool must never be used");
        public async Task<VerifiedSubmissionOutcome> SubmitVerifiedAsync(string url, IReadOnlyDictionary<string, IReadOnlyList<string>> answers, CancellationToken ct)
        {
            Assert.Equal("https://docs.google.com/forms/d/e/synthetic/formResponse", url);
            Assert.Single(answers); Assert.Contains("entry.1", answers.Keys);
            var result = await Outcome(++Calls);
            return new(result, new(Guid.NewGuid(), "SyntheticReceiver" + result, "synthetic-v1", $"test:receiver:{Calls}", new string('a', 64), DateTimeOffset.UtcNow, null, null));
        }
    }
}
