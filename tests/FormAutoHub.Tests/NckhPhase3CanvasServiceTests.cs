using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities.Nckh;
using FormAutoHub.Api.Integrations.Google;
using FormAutoHub.Api.Services;
using FormAutoHub.Api.Services.Nckh;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace FormAutoHub.Tests;

public sealed class NckhPhase3CanvasServiceTests
{
    [Fact]
    public async Task CreateRelationAsync_CreatesDeterministicHypothesisAndAllowsInverseRelation()
    {
        await using var context = CreateContext();
        var seed = await SeedDraftModelAsync(context);
        var service = new ResearchCanvasService(context);

        var first = await service.CreateRelationAsync(
            TestUserId,
            seed.ModelId,
            new NckhCreateRelationRequest(seed.FromVariableId, seed.ToVariableId, "Positive", 1),
            CancellationToken.None);
        var inverse = await service.CreateRelationAsync(
            TestUserId,
            seed.ModelId,
            new NckhCreateRelationRequest(seed.ToVariableId, seed.FromVariableId, "Negative", 2),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, first.Status);
        Assert.Equal("H1", first.Value!.HypothesisCode);
        Assert.Equal("Self-study skill has a positive influence on Academic result", first.Value.HypothesisText);
        Assert.Equal(ResearchFormServiceStatus.Success, inverse.Status);
        Assert.Equal("H2", inverse.Value!.HypothesisCode);
        Assert.Equal("Academic result has a negative influence on Self-study skill", inverse.Value.HypothesisText);
    }

    [Fact]
    public async Task CreateRelationAsync_RejectsSelfDuplicateCrossModelAndCrossUserRules()
    {
        await using var context = CreateContext();
        var seed = await SeedDraftModelAsync(context);
        var otherSeed = await SeedDraftModelAsync(context, OtherUserId, Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"));
        var service = new ResearchCanvasService(context);

        var self = await service.CreateRelationAsync(
            TestUserId,
            seed.ModelId,
            new NckhCreateRelationRequest(seed.FromVariableId, seed.FromVariableId, "Positive", 1),
            CancellationToken.None);
        var crossModel = await service.CreateRelationAsync(
            TestUserId,
            seed.ModelId,
            new NckhCreateRelationRequest(seed.FromVariableId, otherSeed.FromVariableId, "Positive", 1),
            CancellationToken.None);
        await service.CreateRelationAsync(
            TestUserId,
            seed.ModelId,
            new NckhCreateRelationRequest(seed.FromVariableId, seed.ToVariableId, "Positive", 1),
            CancellationToken.None);
        var duplicate = await service.CreateRelationAsync(
            TestUserId,
            seed.ModelId,
            new NckhCreateRelationRequest(seed.FromVariableId, seed.ToVariableId, "Negative", 2),
            CancellationToken.None);
        var crossUser = await service.CreateRelationAsync(
            OtherUserId,
            seed.ModelId,
            new NckhCreateRelationRequest(seed.FromVariableId, seed.ToVariableId, "Positive", 1),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.InvalidRequest, self.Status);
        Assert.Equal(ResearchFormServiceStatus.InvalidRequest, crossModel.Status);
        Assert.Equal(ResearchFormServiceStatus.Conflict, duplicate.Status);
        Assert.Equal(ResearchFormServiceStatus.NotFound, crossUser.Status);
    }

    [Fact]
    public async Task RelationAndPositionEdits_AreDraftOnly()
    {
        await using var context = CreateContext();
        var seed = await SeedDraftModelAsync(context, status: "Active");
        var service = new ResearchCanvasService(context);

        var relation = await service.CreateRelationAsync(
            TestUserId,
            seed.ModelId,
            new NckhCreateRelationRequest(seed.FromVariableId, seed.ToVariableId, "Positive", 1),
            CancellationToken.None);
        var positions = await service.SavePositionsAsync(
            TestUserId,
            seed.ModelId,
            new NckhSavePositionsRequest([
                new NckhSavePositionItem("Variable", seed.FromVariableId, null, 1, 2)
            ]),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.InvalidRequest, relation.Status);
        Assert.Equal(ResearchFormServiceStatus.InvalidRequest, positions.Status);
    }

    [Fact]
    public async Task SavePositionsAsync_UpsertsVariableAndRelationPositionsWithRoundedCoordinates()
    {
        await using var context = CreateContext();
        var seed = await SeedDraftModelAsync(context);
        var service = new ResearchCanvasService(context);
        var relation = await service.CreateRelationAsync(
            TestUserId,
            seed.ModelId,
            new NckhCreateRelationRequest(seed.FromVariableId, seed.ToVariableId, "Positive", 1),
            CancellationToken.None);

        var save = await service.SavePositionsAsync(
            TestUserId,
            seed.ModelId,
            new NckhSavePositionsRequest([
                new NckhSavePositionItem("Variable", seed.FromVariableId, null, 150.129m, 200.125m),
                new NckhSavePositionItem("Relation", null, relation.Value!.Id, 275.1m, 200.999m)
            ]),
            CancellationToken.None);
        var update = await service.SavePositionsAsync(
            TestUserId,
            seed.ModelId,
            new NckhSavePositionsRequest([
                new NckhSavePositionItem("Variable", seed.FromVariableId, null, 151.444m, 201.445m)
            ]),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, save.Status);
        Assert.Equal(2, save.Value!.Items.Count);
        Assert.Equal(ResearchFormServiceStatus.Success, update.Status);
        Assert.Equal(2, update.Value!.Items.Count);
        var variablePosition = update.Value.Items.Single(item => item.VariableId == seed.FromVariableId);
        Assert.Equal(151.44m, variablePosition.PositionX);
        Assert.Equal(201.45m, variablePosition.PositionY);
    }

    [Fact]
    public async Task DeleteVariableAsync_ReturnsConflictWhenRelationReferencesVariable()
    {
        await using var context = CreateContext();
        var seed = await SeedDraftModelAsync(context);
        var canvasService = new ResearchCanvasService(context);
        var formService = CreateResearchFormService(context);
        await canvasService.CreateRelationAsync(
            TestUserId,
            seed.ModelId,
            new NckhCreateRelationRequest(seed.FromVariableId, seed.ToVariableId, "Positive", 1),
            CancellationToken.None);

        var result = await formService.DeleteVariableAsync(TestUserId, seed.FromVariableId, CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Conflict, result.Status);
        Assert.Equal(2, await context.ResearchVariables.CountAsync());
    }

    private static readonly Guid TestUserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid OtherUserId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private static async Task<SeedIds> SeedDraftModelAsync(
        FormAutoHubDbContext context,
        Guid? userId = null,
        Guid? modelId = null,
        string status = "Draft")
    {
        var actualUserId = userId ?? TestUserId;
        var actualModelId = modelId ?? Guid.NewGuid();
        var formId = Guid.NewGuid();
        var fromVariableId = Guid.NewGuid();
        var toVariableId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;

        context.ResearchForms.Add(new ResearchForm
        {
            Id = formId,
            UserId = actualUserId,
            GoogleFormId = $"google-{formId:N}",
            FormUrl = "https://docs.google.com/forms/d/test/edit",
            Title = "Test form",
            Status = "Draft",
            ImportedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        });
        context.ResearchModels.Add(new ResearchModel
        {
            Id = actualModelId,
            UserId = actualUserId,
            FormId = formId,
            Name = "Test model",
            Status = status,
            CreatedAt = now,
            UpdatedAt = now
        });
        context.ResearchVariables.AddRange(
            new ResearchVariable
            {
                Id = fromVariableId,
                ModelId = actualModelId,
                Name = "Self-study skill",
                Code = "TH",
                VariableType = "Independent",
                ScaleType = "Likert",
                ScalePoint = 5,
                SortOrder = 1,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ResearchVariable
            {
                Id = toVariableId,
                ModelId = actualModelId,
                Name = "Academic result",
                Code = "KQ",
                VariableType = "Dependent",
                ScaleType = "Likert",
                ScalePoint = 5,
                SortOrder = 2,
                CreatedAt = now,
                UpdatedAt = now
            });

        await context.SaveChangesAsync();
        return new SeedIds(actualModelId, fromVariableId, toVariableId);
    }

    private static ResearchFormService CreateResearchFormService(FormAutoHubDbContext context)
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

    private sealed record SeedIds(Guid ModelId, Guid FromVariableId, Guid ToVariableId);

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

