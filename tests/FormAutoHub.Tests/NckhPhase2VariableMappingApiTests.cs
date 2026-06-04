using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities.Nckh;
using FormAutoHub.Api.Integrations.Google;
using FormAutoHub.Api.Services;
using FormAutoHub.Api.Services.Nckh;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace FormAutoHub.Tests;

public sealed class NckhPhase2VariableMappingApiTests
{
    [Fact]
    public async Task CreateVariableAsync_CreatesAndListsVariableForOwnedModel()
    {
        await using var context = CreateContext();
        var seed = await SeedModelAsync(context);
        var service = CreateService(context);

        var create = await service.CreateVariableAsync(
            TestUserId,
            seed.ModelId,
            ValidVariableRequest("Tu hoc", "TH", sortOrder: 2),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, create.Status);
        Assert.NotNull(create.Value);
        Assert.Equal("TH", create.Value.Code);

        var list = await service.ListVariablesAsync(TestUserId, seed.ModelId, 1, 20, CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, list.Status);
        Assert.NotNull(list.Value);
        Assert.Single(list.Value.Items);
    }

    [Fact]
    public async Task CreateVariableAsync_RejectsDuplicateCodeWithinModel()
    {
        await using var context = CreateContext();
        var seed = await SeedModelAsync(context);
        var service = CreateService(context);

        await service.CreateVariableAsync(TestUserId, seed.ModelId, ValidVariableRequest("Tu hoc", "TH"), CancellationToken.None);
        var duplicate = await service.CreateVariableAsync(TestUserId, seed.ModelId, ValidVariableRequest("Tu hoc 2", "th"), CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Conflict, duplicate.Status);
    }

    [Fact]
    public async Task CreateVariableAsync_RejectsInvalidScalePayload()
    {
        await using var context = CreateContext();
        var seed = await SeedModelAsync(context);
        var service = CreateService(context);

        var result = await service.CreateVariableAsync(
            TestUserId,
            seed.ModelId,
            new NckhCreateVariableRequest("Gioi tinh", "GT", "Control", "Nominal", 5, null, null, 0),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.InvalidRequest, result.Status);
    }

    [Fact]
    public async Task UpdateVariableAsync_RejectsCrossUserOwnership()
    {
        await using var context = CreateContext();
        var seed = await SeedModelAsync(context);
        var service = CreateService(context);
        var created = await service.CreateVariableAsync(TestUserId, seed.ModelId, ValidVariableRequest("Tu hoc", "TH"), CancellationToken.None);

        var result = await service.UpdateVariableAsync(
            OtherUserId,
            created.Value!.Id,
            ValidUpdateVariableRequest("Tu hoc", "TH2"),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.NotFound, result.Status);
    }

    [Fact]
    public async Task CreateMappingAsync_CreatesAndListsMappingThroughSeparateEndpointModel()
    {
        await using var context = CreateContext();
        var seed = await SeedModelAsync(context);
        var service = CreateService(context);
        var variable = await service.CreateVariableAsync(TestUserId, seed.ModelId, ValidVariableRequest("Tu hoc", "TH"), CancellationToken.None);

        var create = await service.CreateMappingAsync(
            TestUserId,
            variable.Value!.Id,
            new NckhCreateMappingRequest(seed.QuestionId, "TH1", 1),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, create.Status);
        Assert.NotNull(create.Value);
        Assert.Equal(seed.ModelId, create.Value.ModelId);

        var byVariable = await service.ListVariableMappingsAsync(TestUserId, variable.Value.Id, 1, 20, CancellationToken.None);
        var byModel = await service.ListModelMappingsAsync(TestUserId, seed.ModelId, 1, 20, CancellationToken.None);

        Assert.Single(byVariable.Value!.Items);
        Assert.Single(byModel.Value!.Items);
    }

    [Fact]
    public async Task CreateMappingAsync_RejectsDuplicateObservedCodeWithinVariable()
    {
        await using var context = CreateContext();
        var seed = await SeedModelAsync(context);
        var service = CreateService(context);
        var variable = await service.CreateVariableAsync(TestUserId, seed.ModelId, ValidVariableRequest("Tu hoc", "TH"), CancellationToken.None);

        await service.CreateMappingAsync(TestUserId, variable.Value!.Id, new NckhCreateMappingRequest(seed.QuestionId, "TH1", 1), CancellationToken.None);
        var duplicate = await service.CreateMappingAsync(TestUserId, variable.Value.Id, new NckhCreateMappingRequest(seed.SecondQuestionId, "th1", 2), CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Conflict, duplicate.Status);
    }

    [Fact]
    public async Task CreateMappingAsync_RejectsQuestionFromDifferentModelForm()
    {
        await using var context = CreateContext();
        var seed = await SeedModelAsync(context);
        var otherSeed = await SeedModelAsync(context, modelId: Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), formId: Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"));
        var service = CreateService(context);
        var variable = await service.CreateVariableAsync(TestUserId, seed.ModelId, ValidVariableRequest("Tu hoc", "TH"), CancellationToken.None);

        var result = await service.CreateMappingAsync(
            TestUserId,
            variable.Value!.Id,
            new NckhCreateMappingRequest(otherSeed.QuestionId, "TH1", 1),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.InvalidRequest, result.Status);
    }

    [Fact]
    public async Task UpdateAndDeleteMappingAsync_UpdatesThenDeletesOwnedMapping()
    {
        await using var context = CreateContext();
        var seed = await SeedModelAsync(context);
        var service = CreateService(context);
        var variable = await service.CreateVariableAsync(TestUserId, seed.ModelId, ValidVariableRequest("Tu hoc", "TH"), CancellationToken.None);
        var mapping = await service.CreateMappingAsync(TestUserId, variable.Value!.Id, new NckhCreateMappingRequest(seed.QuestionId, "TH1", 1), CancellationToken.None);

        var update = await service.UpdateMappingAsync(
            TestUserId,
            mapping.Value!.Id,
            new NckhUpdateMappingRequest(seed.SecondQuestionId, "TH2", 2),
            CancellationToken.None);

        var delete = await service.DeleteMappingAsync(TestUserId, mapping.Value.Id, CancellationToken.None);
        var list = await service.ListVariableMappingsAsync(TestUserId, variable.Value.Id, 1, 20, CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, update.Status);
        Assert.Equal("TH2", update.Value!.ObservedCode);
        Assert.Equal(ResearchFormServiceStatus.Success, delete.Status);
        Assert.Empty(list.Value!.Items);
    }

    private static readonly Guid TestUserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid OtherUserId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private static NckhCreateVariableRequest ValidVariableRequest(string name, string code, int sortOrder = 0)
    {
        return new NckhCreateVariableRequest(name, code, "Independent", "Likert", 5, 1, 5, sortOrder);
    }

    private static NckhUpdateVariableRequest ValidUpdateVariableRequest(string name, string code, int sortOrder = 0)
    {
        return new NckhUpdateVariableRequest(name, code, "Independent", "Likert", 5, 1, 5, sortOrder);
    }

    private static async Task<SeedIds> SeedModelAsync(
        FormAutoHubDbContext context,
        Guid? modelId = null,
        Guid? formId = null)
    {
        var actualFormId = formId ?? Guid.Parse("11111111-1111-1111-1111-111111111111");
        var actualModelId = modelId ?? Guid.Parse("22222222-2222-2222-2222-222222222222");
        var questionId = Guid.NewGuid();
        var secondQuestionId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;

        context.ResearchForms.Add(new ResearchForm
        {
            Id = actualFormId,
            UserId = TestUserId,
            GoogleFormId = $"google-{actualFormId:N}",
            FormUrl = "https://docs.google.com/forms/d/test/edit",
            Title = "Test form",
            Status = "Draft",
            ImportedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        });

        context.ResearchFormQuestions.AddRange(
            new ResearchFormQuestion
            {
                Id = questionId,
                FormId = actualFormId,
                GoogleQuestionId = $"q-{questionId:N}",
                QuestionText = "Question 1",
                QuestionType = "linearScale",
                IsRequired = true,
                OrderIndex = 1,
                CreatedAt = now
            },
            new ResearchFormQuestion
            {
                Id = secondQuestionId,
                FormId = actualFormId,
                GoogleQuestionId = $"q-{secondQuestionId:N}",
                QuestionText = "Question 2",
                QuestionType = "linearScale",
                IsRequired = true,
                OrderIndex = 2,
                CreatedAt = now
            });

        context.ResearchModels.Add(new ResearchModel
        {
            Id = actualModelId,
            UserId = TestUserId,
            FormId = actualFormId,
            Name = "Test model",
            Status = "Draft",
            CreatedAt = now,
            UpdatedAt = now
        });

        await context.SaveChangesAsync();
        return new SeedIds(actualFormId, actualModelId, questionId, secondQuestionId);
    }

    private static ResearchFormService CreateService(FormAutoHubDbContext context)
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

    private sealed record SeedIds(Guid FormId, Guid ModelId, Guid QuestionId, Guid SecondQuestionId);

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
            return Task.FromResult<string?>(null);
        }
    }

    private sealed class FakeGoogleFormsApiService : IGoogleFormsApiService
    {
        public Task<GoogleFormStructure?> GetFormStructureAsync(string accessToken, string formId, CancellationToken cancellationToken)
        {
            return Task.FromResult<GoogleFormStructure?>(null);
        }
    }
}
