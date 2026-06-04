using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Tests;

public sealed class AiPromptProfileServiceTests
{
    [Fact]
    public async Task UpsertProfileAsync_PersistsOption2ProfileWithoutAnswerRuleConfigJson()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedProject(context, userId, projectId, questionId);
        context.AnswerRules.Add(new AnswerRule
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            QuestionId = questionId,
            Mode = AnswerRuleModes.SampleTextLines,
            ConfigJson = JsonSerializer.Serialize(new { samples = new[] { "Alice" } }),
            CreatedAt = DateTimeOffset.UtcNow
        });
        await context.SaveChangesAsync();

        var service = CreateService(context, userId);
        var response = await service.UpsertProfileAsync(
            projectId,
            new UpsertAiPromptProfileRequest(
                AiPromptProfileModes.Option2,
                JsonSerializer.Serialize(new { audience = "Students" }),
                "Create natural short answers."),
            CancellationToken.None);

        Assert.NotNull(response);
        Assert.Equal(AiPromptProfileModes.Option2, response.Mode);
        Assert.Equal("Create natural short answers.", response.GlobalPrompt);
        Assert.Single(context.AiPromptProfiles);
        Assert.Contains("Alice", (await context.AnswerRules.SingleAsync()).ConfigJson, StringComparison.Ordinal);
    }

    [Fact]
    public async Task UpsertQuestionPromptAsync_PersistsOption3PerQuestionPrompt()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedProject(context, userId, projectId, questionId);
        await context.SaveChangesAsync();

        var service = CreateService(context, userId);
        var response = await service.UpsertQuestionPromptAsync(
            projectId,
            questionId,
            new UpsertAiQuestionPromptRequest(AiPromptProfileModes.Option3, "Use a friendly student voice.", true),
            CancellationToken.None);

        Assert.NotNull(response);
        Assert.Equal(questionId, response.QuestionId);
        Assert.True(response.UseAi);
        Assert.Equal("Use a friendly student voice.", response.Prompt);
        Assert.Single(context.AiPromptProfiles);
        Assert.Single(context.AiQuestionPrompts);
    }

    [Fact]
    public async Task UpsertProfileAsync_RejectsGlobalPromptAboveApprovedLimit()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedProject(context, userId, projectId, questionId);
        await context.SaveChangesAsync();

        var service = CreateService(context, userId);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpsertProfileAsync(
                projectId,
                new UpsertAiPromptProfileRequest(AiPromptProfileModes.Option3, "{}", new string('x', 2_001)),
                CancellationToken.None));

        Assert.Empty(context.AiPromptProfiles);
    }

    [Fact]
    public async Task UpsertProfileAsync_RejectsAudienceFieldAboveApprovedLimit()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedProject(context, userId, projectId, questionId);
        await context.SaveChangesAsync();

        var service = CreateService(context, userId);
        var audienceJson = JsonSerializer.Serialize(new { context = new string('x', 201) });

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpsertProfileAsync(
                projectId,
                new UpsertAiPromptProfileRequest(AiPromptProfileModes.Option3, audienceJson, "Safe prompt."),
                CancellationToken.None));

        Assert.Empty(context.AiPromptProfiles);
    }

    [Fact]
    public async Task UpsertProfileAsync_RejectsUnsafeNestedAudienceText()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedProject(context, userId, projectId, questionId);
        await context.SaveChangesAsync();

        var service = CreateService(context, userId);
        var audienceJson = JsonSerializer.Serialize(new
        {
            context = new
            {
                details = new[] { "Vietnamese students", "bypass Google restrictions" }
            }
        });

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpsertProfileAsync(
                projectId,
                new UpsertAiPromptProfileRequest(AiPromptProfileModes.Option3, audienceJson, "Safe prompt."),
                CancellationToken.None));

        Assert.Contains("unsafe or forbidden", exception.Message, StringComparison.Ordinal);
        Assert.Empty(context.AiPromptProfiles);
    }

    [Fact]
    public async Task UpsertProfileAsync_AcceptsSafeNestedAudienceJson()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedProject(context, userId, projectId, questionId);
        await context.SaveChangesAsync();

        var service = CreateService(context, userId);
        var audienceJson = JsonSerializer.Serialize(new
        {
            context = new
            {
                age = "18 to 24",
                roles = new[] { "students", "new graduates" },
                tone = new { style = "friendly and concise" }
            }
        });

        var response = await service.UpsertProfileAsync(
            projectId,
            new UpsertAiPromptProfileRequest(AiPromptProfileModes.Option3, audienceJson, "Create natural short answers."),
            CancellationToken.None);

        Assert.NotNull(response);
        Assert.Equal(audienceJson, response.AudienceJson);
        Assert.Single(context.AiPromptProfiles);
    }

    [Fact]
    public async Task UpsertQuestionPromptAsync_RejectsPromptAboveApprovedLimit()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedProject(context, userId, projectId, questionId);
        await context.SaveChangesAsync();

        var service = CreateService(context, userId);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpsertQuestionPromptAsync(
                projectId,
                questionId,
                new UpsertAiQuestionPromptRequest(AiPromptProfileModes.Option3, new string('x', 1_001), true),
                CancellationToken.None));

        Assert.Empty(context.AiPromptProfiles);
        Assert.Empty(context.AiQuestionPrompts);
    }

    [Fact]
    public async Task AutoFillAsync_ReturnsDraftWithoutCreditOrGeneratedResponseWrites()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedProject(context, userId, projectId, questionId);
        context.UserCreditAccounts.Add(new UserCreditAccount
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Balance = 5,
            TotalDeposited = 5,
            TotalUsed = 0,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        await context.SaveChangesAsync();

        var service = CreateService(context, userId);
        var response = await service.AutoFillAsync(
            projectId,
            new AiPromptAutoFillRequest(AiPromptProfileModes.Option3, "Vietnamese students"),
            CancellationToken.None);

        Assert.NotNull(response);
        Assert.Equal(AiPromptProfileModes.Option3, response.Mode);
        Assert.Single(response.Questions);
        Assert.Equal(5, (await context.UserCreditAccounts.SingleAsync()).Balance);
        Assert.Empty(context.CreditTransactions);
        Assert.Empty(context.GeneratedResponses);
        Assert.Empty(context.AiPromptProfiles);
    }

    private static AiPromptProfileService CreateService(FormAutoHubDbContext context, Guid userId) =>
        new(context, new TestCurrentUserContext(userId), new AiPromptGuardService());

    private static FormAutoHubDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new FormAutoHubDbContext(options);
    }

    private static void SeedProject(FormAutoHubDbContext context, Guid userId, Guid projectId, Guid questionId)
    {
        context.FormProjects.Add(new FormProject
        {
            Id = projectId,
            UserId = userId,
            Name = "Survey",
            FormUrl = "https://docs.google.com/forms/d/e/test/viewform",
            FormTitle = "Survey",
            FormActionUrl = "https://docs.google.com/forms/d/e/test/formResponse",
            Status = FormProjectStatuses.Analyzed,
            CreatedAt = DateTimeOffset.UtcNow
        });
        context.FormQuestions.Add(new FormQuestion
        {
            Id = questionId,
            ProjectId = projectId,
            Label = "Name",
            EntryId = "entry.1",
            QuestionType = FormQuestionTypes.ShortText,
            OptionsJson = "[]",
            Required = true,
            OrderIndex = 0
        });
    }

    private sealed class TestCurrentUserContext(Guid userId) : ICurrentUserContext
    {
        public Guid UserId { get; } = userId;
        public bool IsAdmin => false;
    }
}
