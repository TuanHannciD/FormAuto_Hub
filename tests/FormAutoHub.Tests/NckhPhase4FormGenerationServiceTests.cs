using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Entities.Nckh;
using FormAutoHub.Api.Integrations.Google;
using FormAutoHub.Api.Services;
using FormAutoHub.Api.Services.Nckh;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace FormAutoHub.Tests;

public sealed class NckhPhase4FormGenerationServiceTests
{
    [Fact]
    public async Task GenerateFormAsync_Create_CreatesGeneratedFormAndReimportsQuestions()
    {
        await using var context = CreateContext();
        var seed = await SeedReadyModelAsync(context);
        var formsApi = new FakeGoogleFormsApiService();
        var service = CreateService(context, formsApi: formsApi);

        var result = await service.GenerateFormAsync(
            TestUserId,
            seed.ModelId,
            new NckhGenerateFormRequest("create"),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, result.Status);
        Assert.NotNull(result.Value);
        Assert.Equal("generated-form-1", result.Value.GoogleFormId);
        Assert.Equal(1, result.Value.QuestionsCreated);
        Assert.True(result.Value.Reimported);

        var generatedForm = await context.ResearchForms
            .Include(item => item.Questions)
            .SingleAsync(item => item.GoogleFormId == "generated-form-1");
        Assert.Equal(seed.ModelId, generatedForm.GeneratedFromModelId);
        Assert.Equal("Generated", generatedForm.GenerationSource);
        Assert.NotNull(generatedForm.LastGeneratedAt);
        Assert.NotNull(generatedForm.LastSyncedAt);
        Assert.Single(generatedForm.Questions);
        Assert.Equal("Question 1", generatedForm.Questions.Single().QuestionText);
        Assert.Single(formsApi.CreatedQuestionBatches);
    }

    [Fact]
    public async Task GenerateFormAsync_Update_AppendsMappedQuestionsAndReimportsWithoutDeletingExistingQuestions()
    {
        await using var context = CreateContext();
        var seed = await SeedReadyModelAsync(context);
        var formsApi = new FakeGoogleFormsApiService();
        var service = CreateService(context, formsApi: formsApi);

        var result = await service.GenerateFormAsync(
            TestUserId,
            seed.ModelId,
            new NckhGenerateFormRequest("update"),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, result.Status);
        Assert.Equal(seed.FormId, result.Value!.FormId);
        Assert.Equal("google-source-form", result.Value.GoogleFormId);
        Assert.Equal(1, result.Value.QuestionsCreated);
        Assert.Equal(0, result.Value.QuestionsDeleted);

        var sourceForm = await context.ResearchForms
            .Include(item => item.Questions)
            .SingleAsync(item => item.Id == seed.FormId);
        Assert.NotNull(sourceForm.LastSyncedAt);
        Assert.Equal(2, sourceForm.Questions.Count);
        Assert.Contains(sourceForm.Questions, item => item.GoogleQuestionId == "existing-q1");
        Assert.Contains(sourceForm.Questions, item => item.GoogleQuestionId.StartsWith("created-q-"));
    }

    [Fact]
    public async Task GenerateFormAsync_Update_CleansDuplicateGoogleQuestionIdsBeforeReimport()
    {
        await using var context = CreateContext();
        var seed = await SeedReadyModelAsync(context);
        var duplicateId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        context.ResearchFormQuestions.Add(new ResearchFormQuestion
        {
            Id = duplicateId,
            FormId = seed.FormId,
            GoogleQuestionId = "existing-q1",
            QuestionText = "Duplicate question",
            QuestionType = "shortText",
            IsRequired = false,
            OrderIndex = -1,
            CreatedAt = now.AddMinutes(-5)
        });
        await context.SaveChangesAsync();
        var formsApi = new FakeGoogleFormsApiService();
        var service = CreateService(context, formsApi: formsApi);

        var result = await service.GenerateFormAsync(
            TestUserId,
            seed.ModelId,
            new NckhGenerateFormRequest("update"),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, result.Status);

        var questions = await context.ResearchFormQuestions
            .Where(item => item.FormId == seed.FormId)
            .OrderBy(item => item.GoogleQuestionId)
            .ToListAsync();
        Assert.Equal(2, questions.Count);
        Assert.Single(questions, item => item.GoogleQuestionId == "existing-q1");
        Assert.DoesNotContain(questions, item => item.Id == duplicateId);

        var mapping = await context.ObservedQuestionMappings.SingleAsync();
        Assert.Equal(questions.Single(item => item.GoogleQuestionId == "existing-q1").Id, mapping.FormQuestionId);
    }

    [Fact]
    public async Task GenerateFormAsync_RequiresWriteScope()
    {
        await using var context = CreateContext();
        var seed = await SeedReadyModelAsync(context, scopes: "https://www.googleapis.com/auth/forms.body.readonly");
        var service = CreateService(context);

        var result = await service.GenerateFormAsync(
            TestUserId,
            seed.ModelId,
            new NckhGenerateFormRequest("create"),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Forbidden, result.Status);
        Assert.Contains("write scope", result.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GenerateFormAsync_RejectsChoiceQuestionWithoutOptionMetadata()
    {
        await using var context = CreateContext();
        var seed = await SeedReadyModelAsync(context, questionType: "multipleChoice");
        var formsApi = new FakeGoogleFormsApiService();
        var service = CreateService(context, formsApi: formsApi);

        var result = await service.GenerateFormAsync(
            TestUserId,
            seed.ModelId,
            new NckhGenerateFormRequest("create"),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.InvalidRequest, result.Status);
        Assert.Contains("cannot be generated", result.Message);
        Assert.Empty(formsApi.CreatedQuestionBatches);
    }

    private static readonly Guid TestUserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private static async Task<SeedIds> SeedReadyModelAsync(
        FormAutoHubDbContext context,
        string scopes = "https://www.googleapis.com/auth/forms.body https://www.googleapis.com/auth/userinfo.email",
        string questionType = "shortText")
    {
        var now = DateTimeOffset.UtcNow;
        var formId = Guid.NewGuid();
        var modelId = Guid.NewGuid();
        var variableId = Guid.NewGuid();
        var questionId = Guid.NewGuid();

        context.UserExternalLogins.Add(new UserExternalLogin
        {
            Id = Guid.NewGuid(),
            UserId = TestUserId,
            Provider = "Google",
            ProviderUserId = "google-user-1",
            Email = "researcher@example.com",
            EmailVerified = true,
            Scopes = scopes,
            CreatedAt = now,
            UpdatedAt = now
        });

        context.ResearchForms.Add(new ResearchForm
        {
            Id = formId,
            UserId = TestUserId,
            GoogleFormId = "google-source-form",
            FormUrl = "https://docs.google.com/forms/d/google-source-form/edit",
            Title = "Source form",
            Status = "Draft",
            ImportedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        });

        context.ResearchFormQuestions.Add(new ResearchFormQuestion
        {
            Id = questionId,
            FormId = formId,
            GoogleQuestionId = "existing-q1",
            QuestionText = "Question 1",
            QuestionType = questionType,
            IsRequired = true,
            OrderIndex = 0,
            CreatedAt = now
        });

        context.ResearchModels.Add(new ResearchModel
        {
            Id = modelId,
            UserId = TestUserId,
            FormId = formId,
            Name = "Generated survey",
            Status = "Active",
            CreatedAt = now,
            UpdatedAt = now
        });

        context.ResearchVariables.Add(new ResearchVariable
        {
            Id = variableId,
            ModelId = modelId,
            Name = "Self-study skill",
            Code = "TH",
            VariableType = "Independent",
            ScaleType = "Likert",
            ScalePoint = 5,
            SortOrder = 1,
            CreatedAt = now,
            UpdatedAt = now
        });

        context.ObservedQuestionMappings.Add(new ObservedQuestionMapping
        {
            Id = Guid.NewGuid(),
            VariableId = variableId,
            FormQuestionId = questionId,
            ObservedCode = "TH1",
            SortOrder = 1,
            CreatedAt = now
        });

        await context.SaveChangesAsync();
        return new SeedIds(formId, modelId);
    }

    private static ResearchFormService CreateService(
        FormAutoHubDbContext context,
        FakeGoogleFormsApiService? formsApi = null)
    {
        return new ResearchFormService(
            context,
            new FakeGoogleOAuthService(),
            formsApi ?? new FakeGoogleFormsApiService());
    }

    private static FormAutoHubDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new FormAutoHubDbContext(options);
    }

    private sealed record SeedIds(Guid FormId, Guid ModelId);

    private sealed class FakeGoogleOAuthService : IGoogleOAuthService
    {
        public Task<GoogleOAuthTokens?> ExchangeCodeAsync(string authorizationCode, string redirectUri, CancellationToken cancellationToken)
        {
            return Task.FromResult<GoogleOAuthTokens?>(null);
        }

        public Task<GoogleOAuthTokens?> RefreshAccessTokenAsync(string refreshToken, CancellationToken cancellationToken)
        {
            return Task.FromResult<GoogleOAuthTokens?>(null);
        }

        public Task StoreTokensAsync(Guid userExternalLoginId, GoogleOAuthTokens tokens, CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }

        public Task<string?> GetValidAccessTokenAsync(Guid userId, CancellationToken cancellationToken)
        {
            return Task.FromResult<string?>("fake-access-token");
        }
    }

    private sealed class FakeGoogleFormsApiService : IGoogleFormsApiService
    {
        private readonly Dictionary<string, List<GoogleFormQuestionItem>> _questions = new(StringComparer.OrdinalIgnoreCase)
        {
            ["google-source-form"] =
            [
                new("existing-q1", "Question 1", "shortText", true, 0)
            ]
        };

        public List<IReadOnlyList<GoogleFormQuestionDraft>> CreatedQuestionBatches { get; } = [];

        public Task<GoogleFormStructure?> GetFormStructureAsync(string accessToken, string formId, CancellationToken cancellationToken)
        {
            if (!_questions.TryGetValue(formId, out var questions))
            {
                return Task.FromResult<GoogleFormStructure?>(null);
            }

            return Task.FromResult<GoogleFormStructure?>(new GoogleFormStructure(
                formId,
                formId == "generated-form-1" ? "Generated survey" : "Source form",
                questions));
        }

        public Task<GoogleFormCreateResult?> CreateFormAsync(string accessToken, string title, CancellationToken cancellationToken)
        {
            _questions["generated-form-1"] = [];
            return Task.FromResult<GoogleFormCreateResult?>(new GoogleFormCreateResult(
                "generated-form-1",
                "https://docs.google.com/forms/d/generated-form-1/edit"));
        }

        public Task<bool> CreateQuestionsAsync(
            string accessToken,
            string formId,
            IReadOnlyList<GoogleFormQuestionDraft> questions,
            CancellationToken cancellationToken)
        {
            CreatedQuestionBatches.Add(questions);
            if (!_questions.TryGetValue(formId, out var existing))
            {
                return Task.FromResult(false);
            }

            foreach (var question in questions)
            {
                existing.Add(new GoogleFormQuestionItem(
                    $"created-q-{existing.Count + 1}",
                    question.QuestionText,
                    question.QuestionType,
                    question.IsRequired,
                    existing.Count));
            }

            return Task.FromResult(true);
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
