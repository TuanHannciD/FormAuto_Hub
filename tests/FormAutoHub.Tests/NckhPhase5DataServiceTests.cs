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

public sealed class NckhPhase5DataServiceTests
{
    [Fact]
    public async Task CollectResponsesAsync_PersistsResponsesAndCollectionLog()
    {
        await using var context = CreateContext();
        var seed = await SeedReadyModelAsync(context);
        var formsApi = new FakeGoogleFormsApiService();
        formsApi.Responses.Add(new GoogleFormResponseItem(
            "response-1",
            DateTimeOffset.Parse("2026-06-05T10:00:00Z"),
            new Dictionary<string, IReadOnlyList<string>>(StringComparer.OrdinalIgnoreCase)
            {
                ["q1"] = ["5"],
                ["q2"] = ["4"]
            }));
        var service = CreateDataService(context, formsApi);

        var result = await service.CollectResponsesAsync(TestUserId, seed.ModelId, CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, result.Status);
        Assert.NotNull(result.Value);
        Assert.Equal("Success", result.Value.Status);
        Assert.Equal(1, result.Value.ResponsesCollected);
        Assert.Equal(0, result.Value.ResponsesSkipped);

        var response = await context.SurveyResponses.SingleAsync();
        Assert.Equal(seed.ModelId, response.ModelId);
        Assert.Equal("response-1", response.GoogleResponseId);
        Assert.Contains("q1", response.RawDataJson);

        var log = await context.DataCollectionLogs.SingleAsync();
        Assert.Equal("Success", log.Status);
        Assert.Equal(1, log.ResponsesCollected);
        Assert.NotNull(log.CompletedAt);
    }

    [Fact]
    public async Task CollectResponsesAsync_RequiresResponseReadScope()
    {
        await using var context = CreateContext();
        var seed = await SeedReadyModelAsync(context, scopes: "https://www.googleapis.com/auth/forms.body.readonly");
        var service = CreateDataService(context, new FakeGoogleFormsApiService());

        var result = await service.CollectResponsesAsync(TestUserId, seed.ModelId, CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Forbidden, result.Status);
        Assert.Contains("response read scope", result.Message, StringComparison.OrdinalIgnoreCase);

        var log = await context.DataCollectionLogs.SingleAsync();
        Assert.Equal("Failed", log.Status);
        Assert.NotNull(log.CompletedAt);
    }

    [Fact]
    public async Task NormalizeResponsesAsync_ComputesObservedValuesAndLikertMean()
    {
        await using var context = CreateContext();
        var seed = await SeedReadyModelAsync(context);
        context.SurveyResponses.Add(new SurveyResponse
        {
            Id = Guid.NewGuid(),
            ModelId = seed.ModelId,
            GoogleResponseId = "response-1",
            RawDataJson = "{\"responseId\":\"response-1\",\"answers\":{\"q1\":[\"5\"],\"q2\":[\"4\"]}}",
            ResponseTimestamp = DateTimeOffset.Parse("2026-06-05T10:00:00Z"),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        await context.SaveChangesAsync();
        var service = CreateDataService(context, new FakeGoogleFormsApiService());

        var result = await service.NormalizeResponsesAsync(TestUserId, seed.ModelId, CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, result.Status);
        Assert.Equal(1, result.Value!.RespondentsProcessed);
        Assert.Equal(1, result.Value.VariablesComputed);
        Assert.Equal(0, result.Value.MissingDataCount);

        var dataset = await service.ListDatasetAsync(TestUserId, seed.ModelId, 1, 20, CancellationToken.None);
        Assert.Equal(ResearchFormServiceStatus.Success, dataset.Status);
        Assert.Contains("TH1", dataset.Value!.Columns);
        Assert.Contains("TH2", dataset.Value.Columns);
        Assert.Contains("TH_mean", dataset.Value.Columns);
        Assert.False(dataset.Value.HasStaleData);
        var values = dataset.Value.Items.Single().Values;
        Assert.Equal(5m, values["TH1"]);
        Assert.Equal(4m, values["TH2"]);
        Assert.Equal(4.5m, values["TH_mean"]);
    }

    [Fact]
    public async Task MappingUpdate_MarksExistingDatasetStale()
    {
        await using var context = CreateContext();
        var seed = await SeedReadyModelAsync(context);
        var surveyResponseId = Guid.NewGuid();
        context.SurveyResponses.Add(new SurveyResponse
        {
            Id = surveyResponseId,
            ModelId = seed.ModelId,
            GoogleResponseId = "response-1",
            RawDataJson = "{\"responseId\":\"response-1\",\"answers\":{\"q1\":[\"5\"]}}",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        context.NormalizedDatasets.Add(new NormalizedDataset
        {
            Id = Guid.NewGuid(),
            ModelId = seed.ModelId,
            SurveyResponseId = surveyResponseId,
            NormalizedDataJson = "{\"TH1\":5}",
            IsStale = false,
            NormalizedAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        await context.SaveChangesAsync();
        var formService = CreateFormService(context);

        var result = await formService.UpdateMappingAsync(
            TestUserId,
            seed.Mapping1Id,
            new NckhUpdateMappingRequest(seed.Question1Id, "TH1A", 1),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, result.Status);
        Assert.True(await context.NormalizedDatasets.AnyAsync(item => item.ModelId == seed.ModelId && item.IsStale));
    }

    private static readonly Guid TestUserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private static async Task<SeedIds> SeedReadyModelAsync(
        FormAutoHubDbContext context,
        string scopes = "https://www.googleapis.com/auth/forms.responses.readonly https://www.googleapis.com/auth/userinfo.email")
    {
        var now = DateTimeOffset.UtcNow;
        var formId = Guid.NewGuid();
        var modelId = Guid.NewGuid();
        var variableId = Guid.NewGuid();
        var question1Id = Guid.NewGuid();
        var question2Id = Guid.NewGuid();
        var mapping1Id = Guid.NewGuid();

        context.UserExternalLogins.Add(new UserExternalLogin
        {
            Id = Guid.NewGuid(),
            UserId = TestUserId,
            Provider = "Google",
            ProviderUserId = "google-user-1",
            Email = "researcher@example.com",
            EmailVerified = true,
            EncryptedRefreshToken = "fake-refresh-token",
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

        context.ResearchFormQuestions.AddRange(
            new ResearchFormQuestion
            {
                Id = question1Id,
                FormId = formId,
                GoogleQuestionId = "q1",
                QuestionText = "Question 1",
                QuestionType = "linearScale",
                IsRequired = true,
                OrderIndex = 0,
                CreatedAt = now
            },
            new ResearchFormQuestion
            {
                Id = question2Id,
                FormId = formId,
                GoogleQuestionId = "q2",
                QuestionText = "Question 2",
                QuestionType = "linearScale",
                IsRequired = true,
                OrderIndex = 1,
                CreatedAt = now
            });

        context.ResearchModels.Add(new ResearchModel
        {
            Id = modelId,
            UserId = TestUserId,
            FormId = formId,
            Name = "Data survey",
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

        context.ObservedQuestionMappings.AddRange(
            new ObservedQuestionMapping
            {
                Id = mapping1Id,
                VariableId = variableId,
                FormQuestionId = question1Id,
                ObservedCode = "TH1",
                SortOrder = 1,
                CreatedAt = now
            },
            new ObservedQuestionMapping
            {
                Id = Guid.NewGuid(),
                VariableId = variableId,
                FormQuestionId = question2Id,
                ObservedCode = "TH2",
                SortOrder = 2,
                CreatedAt = now
            });

        await context.SaveChangesAsync();
        return new SeedIds(modelId, question1Id, mapping1Id);
    }

    private static ResearchDataService CreateDataService(
        FormAutoHubDbContext context,
        FakeGoogleFormsApiService formsApi)
    {
        return new ResearchDataService(context, new FakeGoogleOAuthService(), formsApi);
    }

    private static ResearchFormService CreateFormService(FormAutoHubDbContext context)
    {
        return new ResearchFormService(context, new FakeGoogleOAuthService(), new FakeGoogleFormsApiService());
    }

    private static FormAutoHubDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new FormAutoHubDbContext(options);
    }

    private sealed record SeedIds(Guid ModelId, Guid Question1Id, Guid Mapping1Id);

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
        public List<GoogleFormResponseItem> Responses { get; } = [];

        public Task<GoogleFormStructure?> GetFormStructureAsync(string accessToken, string formId, CancellationToken cancellationToken)
        {
            return Task.FromResult<GoogleFormStructure?>(null);
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
            return Task.FromResult<IReadOnlyList<GoogleFormResponseItem>?>(Responses);
        }
    }
}
