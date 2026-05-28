using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Integrations.AI;
using FormAutoHub.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Tests;

public sealed class AiGenerationServiceTests
{
    [Fact]
    public async Task GenerateAsync_Option2WritesPreviewsCreditUsageAndAudit()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var textQuestionId = Guid.NewGuid();
        var choiceQuestionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedProject(context, userId, projectId, textQuestionId, choiceQuestionId, 10);
        SeedProvider(context);
        SeedPromptProfile(context, userId, projectId, AiPromptProfileModes.Option2);
        await context.SaveChangesAsync();

        var adapter = new TestAiProviderAdapter(request =>
            ValidOutputs(request.Count, textQuestionId, choiceQuestionId, "Có"));
        var service = CreateService(context, userId, adapter);

        var response = await service.GenerateAsync(
            projectId,
            new AiGenerateResponsesRequest(AiPromptProfileModes.Option2, 2),
            CancellationToken.None);

        Assert.NotNull(response);
        Assert.Equal(AiGenerationRunStatuses.Succeeded, response.Status);
        Assert.Equal(2, response.GeneratedCount);
        Assert.Equal(2, response.Multiplier);
        Assert.Equal(4, response.CreditsUsed);
        Assert.Equal(0, response.MissingCredits);
        Assert.Equal(6, response.BalanceAfter);
        Assert.Equal(2, response.GeneratedPreviewIds.Count);

        Assert.Equal(2, await context.GeneratedResponses.CountAsync());
        Assert.All(await context.GeneratedResponses.ToListAsync(), item =>
        {
            Assert.Equal(GeneratedResponseSources.AI, item.Source);
            Assert.True(item.IsReadOnly);
        });

        var transaction = await context.CreditTransactions.SingleAsync();
        Assert.Equal(CreditTransactionTypes.CreditUsed, transaction.Type);
        Assert.Equal(-4, transaction.Amount);
        Assert.Equal(nameof(AiGenerationRun), transaction.ReferenceType);
        Assert.Equal(response.RunId, transaction.ReferenceId);

        var usageLog = await context.UsageLogs.SingleAsync();
        Assert.Equal(UsageLogStatuses.Success, usageLog.Status);
        Assert.Equal(4, usageLog.CreditsUsed);
        Assert.Equal("AiGenerateResponses", usageLog.Action);

        var run = await context.AiGenerationRuns.SingleAsync();
        Assert.Equal(response.RunId, run.Id);
        Assert.Equal(AiGenerationRunStatuses.Succeeded, run.Status);
        Assert.Equal(2, run.GeneratedCount);
        Assert.Equal(4, run.CreditsUsed);
        Assert.Contains("raw-request", run.RawProviderRequestJson, StringComparison.Ordinal);
        Assert.Contains("raw-response", run.RawProviderResponseJson, StringComparison.Ordinal);
        Assert.NotNull(run.StartedAt);
        Assert.NotNull(run.CompletedAt);

        Assert.Equal(4, await context.AiGenerationRunItems.CountAsync());
        Assert.DoesNotContain(
            typeof(AiGenerateResponsesResponse).GetProperties().Select(property => property.Name),
            name => name.Contains("Raw", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task GenerateAsync_Option3UsesMultiplierThree()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var textQuestionId = Guid.NewGuid();
        var choiceQuestionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedProject(context, userId, projectId, textQuestionId, choiceQuestionId, 10);
        SeedProvider(context);
        SeedPromptProfile(context, userId, projectId, AiPromptProfileModes.Option3);
        await context.SaveChangesAsync();

        var adapter = new TestAiProviderAdapter(request =>
            ValidOutputs(request.Count, textQuestionId, choiceQuestionId, "Có"));
        var service = CreateService(context, userId, adapter);

        var response = await service.GenerateAsync(
            projectId,
            new AiGenerateResponsesRequest(AiPromptProfileModes.Option3, 1),
            CancellationToken.None);

        Assert.NotNull(response);
        Assert.Equal(AiGenerationRunStatuses.Succeeded, response.Status);
        Assert.Equal(3, response.Multiplier);
        Assert.Equal(3, response.CreditsUsed);
        Assert.Equal(7, response.BalanceAfter);
    }

    [Fact]
    public async Task GenerateAsync_PartialGenerationRespectsLimitedCredits()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var textQuestionId = Guid.NewGuid();
        var choiceQuestionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedProject(context, userId, projectId, textQuestionId, choiceQuestionId, 18);
        SeedProvider(context);
        SeedPromptProfile(context, userId, projectId, AiPromptProfileModes.Option3);
        await context.SaveChangesAsync();

        var adapter = new TestAiProviderAdapter(request =>
        {
            Assert.Equal(6, request.Count);
            return ValidOutputs(request.Count, textQuestionId, choiceQuestionId, "Có");
        });
        var service = CreateService(context, userId, adapter);

        var response = await service.GenerateAsync(
            projectId,
            new AiGenerateResponsesRequest(AiPromptProfileModes.Option3, 10),
            CancellationToken.None);

        Assert.NotNull(response);
        Assert.Equal(AiGenerationRunStatuses.Partial, response.Status);
        Assert.Equal(6, response.GeneratedCount);
        Assert.Equal(18, response.CreditsUsed);
        Assert.Equal(12, response.MissingCredits);
        Assert.Equal(0, response.BalanceAfter);
        Assert.Equal(6, await context.GeneratedResponses.CountAsync());
        Assert.Single(context.CreditTransactions);
    }

    [Fact]
    public async Task GenerateAsync_FailedProviderCallChargesZero()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var textQuestionId = Guid.NewGuid();
        var choiceQuestionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedProject(context, userId, projectId, textQuestionId, choiceQuestionId, 10);
        SeedProvider(context);
        SeedPromptProfile(context, userId, projectId, AiPromptProfileModes.Option2);
        await context.SaveChangesAsync();

        var adapter = new TestAiProviderAdapter(_ => throw new InvalidOperationException("provider unavailable"));
        var service = CreateService(context, userId, adapter);

        var response = await service.GenerateAsync(
            projectId,
            new AiGenerateResponsesRequest(AiPromptProfileModes.Option2, 2),
            CancellationToken.None);

        Assert.NotNull(response);
        Assert.Equal(AiGenerationRunStatuses.Failed, response.Status);
        Assert.Equal(0, response.GeneratedCount);
        Assert.Equal(0, response.CreditsUsed);
        Assert.Empty(context.GeneratedResponses);
        Assert.Empty(context.CreditTransactions);
        Assert.Equal(10, (await context.UserCreditAccounts.SingleAsync()).Balance);
    }

    [Fact]
    public async Task GenerateAsync_AllInvalidOutputChargesZeroAndStoresNoPreviews()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var textQuestionId = Guid.NewGuid();
        var choiceQuestionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedProject(context, userId, projectId, textQuestionId, choiceQuestionId, 10);
        SeedProvider(context);
        SeedPromptProfile(context, userId, projectId, AiPromptProfileModes.Option2);
        await context.SaveChangesAsync();

        var adapter = new TestAiProviderAdapter(_ =>
            OutputResult([BuildOutput((textQuestionId, ["Alice"]), (choiceQuestionId, ["Co"]))]));
        var service = CreateService(context, userId, adapter);

        var response = await service.GenerateAsync(
            projectId,
            new AiGenerateResponsesRequest(AiPromptProfileModes.Option2, 1),
            CancellationToken.None);

        Assert.NotNull(response);
        Assert.Equal(AiGenerationRunStatuses.Failed, response.Status);
        Assert.Equal(0, response.CreditsUsed);
        Assert.Empty(context.GeneratedResponses);
        Assert.Empty(context.CreditTransactions);
        var item = await context.AiGenerationRunItems.SingleAsync(item => item.QuestionId == choiceQuestionId);
        Assert.Equal(AiGenerationRunItemStatuses.Invalid, item.Status);
        Assert.Contains("match stored options", item.ValidationMessage, StringComparison.Ordinal);
    }

    [Fact]
    public async Task GenerateAsync_ChoiceAnswerOutsideStoredOptionsIsRejected()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var textQuestionId = Guid.NewGuid();
        var choiceQuestionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedProject(context, userId, projectId, textQuestionId, choiceQuestionId, 10);
        SeedProvider(context);
        SeedPromptProfile(context, userId, projectId, AiPromptProfileModes.Option2);
        await context.SaveChangesAsync();

        var adapter = new TestAiProviderAdapter(_ =>
            OutputResult([BuildOutput((textQuestionId, ["Alice"]), (choiceQuestionId, ["Maybe"]))]));
        var service = CreateService(context, userId, adapter);

        var response = await service.GenerateAsync(
            projectId,
            new AiGenerateResponsesRequest(AiPromptProfileModes.Option2, 1),
            CancellationToken.None);

        Assert.NotNull(response);
        Assert.Equal(AiGenerationRunStatuses.Failed, response.Status);
        Assert.Empty(context.GeneratedResponses);
        Assert.Empty(context.CreditTransactions);
    }

    [Fact]
    public async Task GenerateAsync_GridOutputFailsSafely()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var gridQuestionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedGridProject(context, userId, projectId, gridQuestionId, 10);
        SeedProvider(context);
        SeedPromptProfile(context, userId, projectId, AiPromptProfileModes.Option2);
        await context.SaveChangesAsync();

        var adapter = new TestAiProviderAdapter(_ =>
            OutputResult([BuildOutput((gridQuestionId, ["Column A"]))]));
        var service = CreateService(context, userId, adapter);

        var response = await service.GenerateAsync(
            projectId,
            new AiGenerateResponsesRequest(AiPromptProfileModes.Option2, 1),
            CancellationToken.None);

        Assert.NotNull(response);
        Assert.Equal(AiGenerationRunStatuses.Succeeded, response.Status);
        Assert.Single(context.GeneratedResponses);
        Assert.Single(context.CreditTransactions);
        var item = await context.AiGenerationRunItems.SingleAsync();
        Assert.Equal(AiGenerationRunItemStatuses.Valid, item.Status);
    }

    [Fact]
    public async Task GenerateAsync_PromptGuardBlocksBeforeProviderCallAndCreditDeduction()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var textQuestionId = Guid.NewGuid();
        var choiceQuestionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedProject(context, userId, projectId, textQuestionId, choiceQuestionId, 10);
        SeedProvider(context);
        SeedPromptProfile(
            context,
            userId,
            projectId,
            AiPromptProfileModes.Option2,
            "Create fake responses and bypass Google restrictions.");
        await context.SaveChangesAsync();

        var adapter = new TestAiProviderAdapter(request =>
            ValidOutputs(request.Count, textQuestionId, choiceQuestionId, "Có"));
        var service = CreateService(context, userId, adapter);

        var response = await service.GenerateAsync(
            projectId,
            new AiGenerateResponsesRequest(AiPromptProfileModes.Option2, 1),
            CancellationToken.None);

        Assert.NotNull(response);
        Assert.Equal(AiGenerationRunStatuses.Failed, response.Status);
        Assert.Equal(0, adapter.CallCount);
        Assert.Empty(context.GeneratedResponses);
        Assert.Empty(context.CreditTransactions);
        Assert.Equal(10, (await context.UserCreditAccounts.SingleAsync()).Balance);
    }

    [Fact]
    public void GenerateRequest_DoesNotAcceptProviderModelOrApiKeyAuthority()
    {
        var propertyNames = typeof(AiGenerateResponsesRequest)
            .GetProperties()
            .Select(property => property.Name)
            .ToArray();

        Assert.Equal(["Mode", "Count"], propertyNames);
        Assert.DoesNotContain(propertyNames, name => name.Contains("Provider", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(propertyNames, name => name.Contains("Model", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(propertyNames, name => name.Contains("BaseUrl", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(propertyNames, name => name.Contains("Key", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task DisabledAiProviderAdapter_FailsSafeBeforeReturningFakeOutput()
    {
        var adapter = new DisabledAiProviderAdapter();
        var request = new AiProviderGenerateRequest(
            Guid.NewGuid(),
            AiPromptProfileModes.Option2,
            1,
            AiProviders.OpenAI,
            "gpt-4o-mini",
            "{}",
            "[]");

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            adapter.GenerateAsync(request, CancellationToken.None));
        Assert.Contains("not configured", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    private static AiGenerationService CreateService(
        FormAutoHubDbContext context,
        Guid userId,
        IAiProviderAdapter adapter) =>
        new(
            context,
            new TestCurrentUserContext(userId),
            new AiPromptGuardService(),
            new AiOutputValidator(),
            adapter,
            new TestSecretProtector(),
            new CreditService(context));

    private static FormAutoHubDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new FormAutoHubDbContext(options);
    }

    private static void SeedProject(
        FormAutoHubDbContext context,
        Guid userId,
        Guid projectId,
        Guid textQuestionId,
        Guid choiceQuestionId,
        decimal balance)
    {
        SeedProjectBase(context, userId, projectId, balance);
        context.FormQuestions.AddRange(
            new FormQuestion
            {
                Id = textQuestionId,
                ProjectId = projectId,
                Label = "Name",
                EntryId = "entry.1",
                QuestionType = FormQuestionTypes.ShortText,
                OptionsJson = "[]",
                Required = true,
                OrderIndex = 0
            },
            new FormQuestion
            {
                Id = choiceQuestionId,
                ProjectId = projectId,
                Label = "Bạn có đọc được không",
                EntryId = "entry.2",
                QuestionType = FormQuestionTypes.MultipleChoice,
                OptionsJson = JsonSerializer.Serialize(new[] { "Có", "Không" }),
                Required = true,
                OrderIndex = 1
            });
    }

    private static void SeedGridProject(
        FormAutoHubDbContext context,
        Guid userId,
        Guid projectId,
        Guid gridQuestionId,
        decimal balance)
    {
        SeedProjectBase(context, userId, projectId, balance);
        context.FormQuestions.Add(new FormQuestion
        {
            Id = gridQuestionId,
            ProjectId = projectId,
            Label = "Grid - Row 1",
            EntryId = "entry.1",
            QuestionType = FormQuestionTypes.MultipleChoiceGrid,
            OptionsJson = JsonSerializer.Serialize(new[] { "Column A", "Column B" }),
            Required = true,
            OrderIndex = 0
        });
    }

    private static void SeedProjectBase(FormAutoHubDbContext context, Guid userId, Guid projectId, decimal balance)
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
        context.UserCreditAccounts.Add(new UserCreditAccount
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Balance = balance,
            TotalDeposited = balance,
            TotalUsed = 0,
            UpdatedAt = DateTimeOffset.UtcNow
        });
    }

    private static void SeedProvider(FormAutoHubDbContext context)
    {
        context.AiProviderSettings.Add(new AiProviderSetting
        {
            Id = Guid.NewGuid(),
            Provider = AiProviders.OpenAI,
            DisplayName = "OpenAI",
            EncryptedApiKey = "protected:test-key",
            DefaultModel = "gpt-4o-mini",
            AllowedModelsJson = JsonSerializer.Serialize(new[] { "gpt-4o-mini" }),
            IsEnabled = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
    }

    private static void SeedPromptProfile(
        FormAutoHubDbContext context,
        Guid userId,
        Guid projectId,
        string mode,
        string globalPrompt = "Create natural short answers.")
    {
        context.AiPromptProfiles.Add(new AiPromptProfile
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            UserId = userId,
            Mode = mode,
            AudienceJson = JsonSerializer.Serialize(new { context = "Vietnamese students" }),
            GlobalPrompt = globalPrompt,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
    }

    private static AiProviderGenerateResult ValidOutputs(
        int count,
        Guid textQuestionId,
        Guid choiceQuestionId,
        string choiceValue) =>
        OutputResult(Enumerable.Range(1, count)
            .Select(index => BuildOutput(
                (textQuestionId, [$"Alice {index}"]),
                (choiceQuestionId, [choiceValue])))
            .ToArray());

    private static AiProviderGenerateResult OutputResult(IReadOnlyList<string> outputs) =>
        new("raw-request", "raw-response", outputs);

    private static string BuildOutput(params (Guid QuestionId, IReadOnlyList<string> Values)[] answers) =>
        JsonSerializer.Serialize(new
        {
            answers = answers.Select(answer => new
            {
                questionId = answer.QuestionId,
                values = answer.Values
            })
        });

    private sealed class TestCurrentUserContext(Guid userId) : ICurrentUserContext
    {
        public Guid UserId { get; } = userId;
        public bool IsAdmin => false;
    }

    private sealed class TestAiProviderAdapter(Func<AiProviderGenerateRequest, AiProviderGenerateResult> handler)
        : IAiProviderAdapter
    {
        public int CallCount { get; private set; }

        public Task<AiProviderGenerateResult> GenerateAsync(
            AiProviderGenerateRequest request,
            CancellationToken cancellationToken)
        {
            CallCount++;
            return Task.FromResult(handler(request));
        }
    }

    private sealed class TestSecretProtector : IAiProviderSecretProtector
    {
        public string Protect(string value) => $"protected:{value}";
        public string Unprotect(string value) => value.Replace("protected:", string.Empty, StringComparison.Ordinal);
        public string Preview(string encryptedValue) => encryptedValue;
    }
}
