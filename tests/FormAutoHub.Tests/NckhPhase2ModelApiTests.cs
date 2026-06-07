using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities.Nckh;
using FormAutoHub.Api.Services.Nckh;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Tests;

public sealed class NckhPhase2ModelApiTests
{
    [Fact]
    public async Task CreateModelAsync_CreatesDraftAndAllowsMultipleModelsPerForm()
    {
        await using var context = CreateContext();
        var formId = SeedForm(context, TestUserId);
        var service = new ResearchModelService(context);

        var first = await service.CreateModelAsync(
            TestUserId,
            new NckhCreateResearchModelRequest(formId, " Model A ", " First model "),
            CancellationToken.None);
        var second = await service.CreateModelAsync(
            TestUserId,
            new NckhCreateResearchModelRequest(formId, "Model B", null),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, first.Status);
        Assert.Equal(ResearchFormServiceStatus.Success, second.Status);
        Assert.Equal("Draft", first.Value!.Status);
        Assert.Equal("Model A", first.Value.Name);
        Assert.Equal(2, await context.ResearchModels.CountAsync());
    }

    [Fact]
    public async Task CreateModelAsync_EnforcesFormOwnership()
    {
        await using var context = CreateContext();
        var formId = SeedForm(context, OtherUserId);
        var service = new ResearchModelService(context);

        var result = await service.CreateModelAsync(
            TestUserId,
            new NckhCreateResearchModelRequest(formId, "Model", null),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.NotFound, result.Status);
        Assert.Empty(context.ResearchModels);
    }

    [Fact]
    public async Task ListModelsAsync_ReturnsOnlyOwnedModelsAndSupportsStatusFilter()
    {
        await using var context = CreateContext();
        var ownedFormId = SeedForm(context, TestUserId);
        var otherFormId = SeedForm(context, OtherUserId);
        SeedModel(context, TestUserId, ownedFormId, "Draft model", "Draft");
        SeedModel(context, TestUserId, ownedFormId, "Active model", "Active");
        SeedModel(context, OtherUserId, otherFormId, "Other user model", "Draft");
        await context.SaveChangesAsync();
        var service = new ResearchModelService(context);

        var result = await service.ListModelsAsync(TestUserId, "Active", 1, 20, CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, result.Status);
        Assert.NotNull(result.Value);
        Assert.Equal(1, result.Value.TotalItems);
        Assert.Equal("Active model", result.Value.Items.Single().Name);
    }

    [Fact]
    public async Task ListModelsAsync_ExposesGeneratedFormState()
    {
        await using var context = CreateContext();
        var ownedFormId = SeedForm(context, TestUserId);
        var modelId = SeedModel(context, TestUserId, ownedFormId, "Generated model", "Active");
        context.ResearchForms.Add(new ResearchForm
        {
            Id = Guid.NewGuid(),
            UserId = TestUserId,
            GoogleFormId = "generated-google-form",
            FormUrl = "https://docs.google.com/forms/d/generated-google-form/edit",
            Title = "Generated Survey",
            Status = "Draft",
            GeneratedFromModelId = modelId,
            GenerationSource = "Generated",
            ImportedAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        await context.SaveChangesAsync();
        var service = new ResearchModelService(context);

        var result = await service.ListModelsAsync(TestUserId, null, 1, 20, CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, result.Status);
        Assert.True(result.Value!.Items.Single(item => item.Id == modelId).HasGeneratedForm);
    }

    [Fact]
    public async Task GetAndUpdateModelAsync_RequireOwnership()
    {
        await using var context = CreateContext();
        var formId = SeedForm(context, TestUserId);
        var modelId = SeedModel(context, TestUserId, formId, "Before", "Draft");
        await context.SaveChangesAsync();
        var service = new ResearchModelService(context);

        var otherUserResult = await service.GetModelAsync(OtherUserId, modelId, CancellationToken.None);
        var updateResult = await service.UpdateModelAsync(
            TestUserId,
            modelId,
            new NckhUpdateResearchModelRequest("After", "Updated"),
            CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.NotFound, otherUserResult.Status);
        Assert.Equal(ResearchFormServiceStatus.Success, updateResult.Status);
        Assert.Equal("After", updateResult.Value!.Name);
        Assert.Equal("Updated", updateResult.Value.Description);
    }

    [Fact]
    public async Task ActivateModelAsync_EnforcesSingleActiveModelPerForm()
    {
        await using var context = CreateContext();
        var formId = SeedForm(context, TestUserId);
        var activeModelId = SeedModel(context, TestUserId, formId, "Active", "Active");
        var draftModelId = SeedModel(context, TestUserId, formId, "Draft", "Draft");
        await context.SaveChangesAsync();
        var service = new ResearchModelService(context);

        var activeAgain = await service.ActivateModelAsync(TestUserId, activeModelId, CancellationToken.None);
        var conflict = await service.ActivateModelAsync(TestUserId, draftModelId, CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, activeAgain.Status);
        Assert.Equal(ResearchFormServiceStatus.Conflict, conflict.Status);
        Assert.Equal("Draft", (await context.ResearchModels.FindAsync(draftModelId))!.Status);
    }

    [Fact]
    public async Task ActivateModelAsync_MovesDraftToActiveWhenNoActiveModelExists()
    {
        await using var context = CreateContext();
        var formId = SeedForm(context, TestUserId);
        var modelId = SeedModel(context, TestUserId, formId, "Draft", "Draft");
        await context.SaveChangesAsync();
        var service = new ResearchModelService(context);

        var result = await service.ActivateModelAsync(TestUserId, modelId, CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, result.Status);
        Assert.Equal("Active", result.Value!.Status);
        Assert.Equal("Active", (await context.ResearchModels.FindAsync(modelId))!.Status);
    }

    [Fact]
    public async Task DeleteModelAsync_RemovesOnlyOwnedCascadePath()
    {
        await using var context = CreateContext();
        var formId = SeedForm(context, TestUserId);
        var questionId = SeedQuestion(context, formId);
        var modelId = SeedModel(context, TestUserId, formId, "Draft", "Draft");
        var variableId = SeedVariable(context, modelId);
        SeedMapping(context, variableId, questionId);
        await context.SaveChangesAsync();
        var service = new ResearchModelService(context);

        var result = await service.DeleteModelAsync(TestUserId, modelId, CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, result.Status);
        Assert.Empty(context.ResearchModels);
        Assert.Empty(context.ResearchVariables);
        Assert.Empty(context.ObservedQuestionMappings);
        Assert.Single(context.ResearchForms);
        Assert.Single(context.ResearchFormQuestions);
    }

    private static readonly Guid TestUserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid OtherUserId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private static FormAutoHubDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new FormAutoHubDbContext(options);
    }

    private static Guid SeedForm(FormAutoHubDbContext context, Guid userId)
    {
        var formId = Guid.NewGuid();
        context.ResearchForms.Add(new ResearchForm
        {
            Id = formId,
            UserId = userId,
            GoogleFormId = $"google-{formId:N}",
            FormUrl = $"https://docs.google.com/forms/d/google-{formId:N}/edit",
            Title = "Survey Form",
            Status = "Draft",
            ImportedAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        context.SaveChanges();
        return formId;
    }

    private static Guid SeedQuestion(FormAutoHubDbContext context, Guid formId)
    {
        var questionId = Guid.NewGuid();
        context.ResearchFormQuestions.Add(new ResearchFormQuestion
        {
            Id = questionId,
            FormId = formId,
            GoogleQuestionId = "q1",
            QuestionText = "Question 1",
            QuestionType = "shortText",
            IsRequired = false,
            OrderIndex = 0,
            CreatedAt = DateTimeOffset.UtcNow
        });
        return questionId;
    }

    private static Guid SeedModel(FormAutoHubDbContext context, Guid userId, Guid formId, string name, string status)
    {
        var modelId = Guid.NewGuid();
        context.ResearchModels.Add(new ResearchModel
        {
            Id = modelId,
            UserId = userId,
            FormId = formId,
            Name = name,
            Status = status,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        return modelId;
    }

    private static Guid SeedVariable(FormAutoHubDbContext context, Guid modelId)
    {
        var variableId = Guid.NewGuid();
        context.ResearchVariables.Add(new ResearchVariable
        {
            Id = variableId,
            ModelId = modelId,
            Name = "Variable",
            Code = "VAR",
            VariableType = "Independent",
            ScaleType = "Likert",
            ScalePoint = 5,
            SortOrder = 1,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        return variableId;
    }

    private static void SeedMapping(FormAutoHubDbContext context, Guid variableId, Guid questionId)
    {
        context.ObservedQuestionMappings.Add(new ObservedQuestionMapping
        {
            Id = Guid.NewGuid(),
            VariableId = variableId,
            FormQuestionId = questionId,
            ObservedCode = "VAR1",
            SortOrder = 1,
            CreatedAt = DateTimeOffset.UtcNow
        });
    }
}
