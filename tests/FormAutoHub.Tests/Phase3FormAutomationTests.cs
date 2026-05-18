using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Integrations.GoogleForms;
using FormAutoHub.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Tests;

public sealed class Phase3FormAutomationTests
{
    [Fact]
    public async Task GoogleFormsClient_AnalyzesSentinelEntryNames()
    {
        const string html = """
            <html>
              <head><title>Survey</title></head>
              <body>
                <form action="https://docs.google.com/forms/d/e/test/formResponse">
                  <input type="hidden" name="entry.1522586598_sentinel">
                </form>
              </body>
            </html>
            """;

        using var httpClient = new HttpClient(new StubHttpMessageHandler(html));
        var client = new GoogleFormsClient(httpClient);

        var result = await client.AnalyzeAsync(
            "https://docs.google.com/forms/d/e/test/viewform",
            CancellationToken.None);

        Assert.Equal("Survey", result.Title);
        Assert.Equal("https://docs.google.com/forms/d/e/test/formResponse", result.ActionUrl);
        var question = Assert.Single(result.Questions);
        Assert.Equal("entry.1522586598", question.EntryId);
    }

    [Fact]
    public async Task GoogleFormsClient_AnalyzesPublicLoadDataQuestionsAndOptions()
    {
        const string html = """
            <html>
              <head><title>Fallback title</title></head>
              <body>
                <form action="https://docs.google.com/forms/d/e/test/formResponse"></form>
                <input type="hidden" name="entry.1522586598_sentinel">
                <script>
                FB_PUBLIC_LOAD_DATA_ = [null,["Test Khảo sát",[[453752011,"Bạn có đọc được không",null,2,[[1522586598,[["Có",null,null,null,0],["Không",null,null,null,0]],0]]],[97552392,"Số 1 là số mấy",null,0,[[1744027738,null,0]]]],null,null,null,null,null,null,null,73,[null,null,null,2,null,null,1],null,null,null,null,[2],null,null,null,null,null,null,null,null,[null,"Test Khảo sát"]],"/forms","Mẫu không có tiêu đề"];
                </script>
              </body>
            </html>
            """;

        using var httpClient = new HttpClient(new StubHttpMessageHandler(html));
        var client = new GoogleFormsClient(httpClient);

        var result = await client.AnalyzeAsync(
            "https://docs.google.com/forms/d/e/test/viewform",
            CancellationToken.None);

        Assert.Collection(
            result.Questions,
            question =>
            {
                Assert.Equal("Bạn có đọc được không", question.Label);
                Assert.Equal("entry.1522586598", question.EntryId);
                Assert.Equal(FormQuestionTypes.MultipleChoice, question.QuestionType);
                Assert.Equal(["Có", "Không"], question.Options);
            },
            question =>
            {
                Assert.Equal("Số 1 là số mấy", question.Label);
                Assert.Equal("entry.1744027738", question.EntryId);
                Assert.Equal(FormQuestionTypes.ShortText, question.QuestionType);
                Assert.Empty(question.Options);
            });
    }

    [Fact]
    public async Task GoogleFormsClient_AnalyzesExtendedPublicLoadDataQuestionTypesExceptFileUpload()
    {
        const string html = """
            <html>
              <head><title>Extended form</title></head>
              <body>
                <form action="https://docs.google.com/forms/d/e/test/formResponse"></form>
                <input type="hidden" name="entry.1603595449_sentinel">
                <script>
                FB_PUBLIC_LOAD_DATA_ = [null,["Extended",[
                  [228246973,"Checkbox",null,4,[[1603595449,[["A",null,null,null,0],["B",null,null,null,0]],0]]],
                  [1999659186,"Dropdown",null,3,[[1086376467,[["A",null,null,null,0],["B",null,null,null,0]],0]]],
                  [821660241,"Paragraph",null,1,[[1462427393,null,0]]],
                  [1387966305,"Linear",null,5,[[529796842,[["1"],["2"],["3"]],0,["",""]]]],
                  [1577299555,"Rating",null,18,[[2137273408,[["1"],["2"],["3"]],0,null,null,null,null,null,null,null,null,null,null,null,[1]]]],
                  [204946008,"Grid",null,7,[[917637213,[["C1"],["C2"]],0,["R1"],null,null,null,null,null,null,null,[0]],[234342573,[["C1"],["C2"]],0,["R2"],null,null,null,null,null,null,null,[0]]]],
                  [532902957,"Checkbox grid",null,7,[[1764138387,[["C1"],["C2"]],0,["R1"],null,null,null,null,null,null,null,[1]]]],
                  [1260040159,"Date",null,9,[[1091267568,null,0,null,null,null,null,[0,1]]]],
                  [1983411122,"Time",null,10,[[1009219426,null,0,null,null,null,[0]]]]
                ]],"/forms","Extended title"];
                </script>
              </body>
            </html>
            """;

        using var httpClient = new HttpClient(new StubHttpMessageHandler(html));
        var client = new GoogleFormsClient(httpClient);

        var result = await client.AnalyzeAsync(
            "https://docs.google.com/forms/d/e/test/viewform",
            CancellationToken.None);

        Assert.Equal(
            [
                FormQuestionTypes.Checkbox,
                FormQuestionTypes.Dropdown,
                FormQuestionTypes.ParagraphText,
                FormQuestionTypes.LinearScale,
                FormQuestionTypes.Rating,
                FormQuestionTypes.MultipleChoiceGrid,
                FormQuestionTypes.MultipleChoiceGrid,
                FormQuestionTypes.CheckboxGrid,
                FormQuestionTypes.Date,
                FormQuestionTypes.Time
            ],
            result.Questions.Select(question => question.QuestionType));
        Assert.Contains(result.Questions, question => question.Label == "Grid - R1" && question.EntryId == "entry.917637213");
        Assert.Contains(result.Questions, question => question.Label == "Grid - R2" && question.EntryId == "entry.234342573");
    }

    [Fact]
    public async Task GenerateAsync_DeductsCreditsAndWritesUsageAndCreditTransaction()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedPreviewData(context, userId, projectId, questionId, 5);
        await context.SaveChangesAsync();

        var service = new ResponseGenerationService(
            context,
            new TestCurrentUserContext(userId),
            new CreditService(context));

        var result = await service.GenerateAsync(projectId, new GenerateResponsesRequest(2), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(2, result.CreditsUsed);
        Assert.Equal(3, result.BalanceAfter);
        Assert.Equal(2, await context.GeneratedResponses.CountAsync());

        var account = await context.UserCreditAccounts.SingleAsync(item => item.UserId == userId);
        Assert.Equal(3, account.Balance);
        Assert.Equal(2, account.TotalUsed);

        var transaction = await context.CreditTransactions.SingleAsync(item => item.UserId == userId);
        Assert.Equal(CreditTransactionTypes.CreditUsed, transaction.Type);
        Assert.Equal(-2, transaction.Amount);

        var usageLog = await context.UsageLogs.SingleAsync(item => item.UserId == userId);
        Assert.Equal(UsageLogStatuses.Success, usageLog.Status);
        Assert.Equal(2, usageLog.CreditsUsed);
    }

    [Fact]
    public async Task GenerateAsync_UsesUpToOneHundredSampleTextLines()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedPreviewData(context, userId, projectId, questionId, 100);
        await context.SaveChangesAsync();
        var samples = Enumerable.Range(1, 100).Select(index => $"Sample {index}").ToArray();
        var rule = context.AnswerRules.Single(item => item.QuestionId == questionId);
        rule.ConfigJson = JsonSerializer.Serialize(new { samples });
        await context.SaveChangesAsync();

        var service = new ResponseGenerationService(
            context,
            new TestCurrentUserContext(userId),
            new CreditService(context));

        var result = await service.GenerateAsync(projectId, new GenerateResponsesRequest(100), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(100, result.Items.Count);
        Assert.Equal("Sample 1", result.Items[0].Answers.Single().Values.Single());
        Assert.Equal("Sample 100", result.Items[99].Answers.Single().Values.Single());
    }

    [Fact]
    public async Task AnswerRuleService_RejectsMoreThanOneHundredSampleTextLines()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedPreviewData(context, userId, projectId, questionId, 5);
        await context.SaveChangesAsync();

        var service = new AnswerRuleService(context, new TestCurrentUserContext(userId));
        var samples = Enumerable.Range(1, 101).Select(index => $"Sample {index}").ToArray();

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateAsync(
                projectId,
                new UpsertAnswerRuleRequest(
                    questionId,
                    AnswerRuleModes.SampleTextLines,
                    JsonSerializer.Serialize(new { samples })),
                CancellationToken.None));
    }

    [Fact]
    public async Task GenerateAsync_UsesSequentialDateRangeForDateQuestion()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedPreviewData(context, userId, projectId, questionId, 5);
        await context.SaveChangesAsync();
        SetQuestionRule(
            context,
            questionId,
            FormQuestionTypes.Date,
            AnswerRuleModes.DateRangeSequential,
            JsonSerializer.Serialize(new { fromDate = "2026-05-18", toDate = "2026-05-20" }));
        await context.SaveChangesAsync();

        var service = new ResponseGenerationService(
            context,
            new TestCurrentUserContext(userId),
            new CreditService(context));

        var result = await service.GenerateAsync(projectId, new GenerateResponsesRequest(3), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(["2026-05-18", "2026-05-19", "2026-05-20"], result.Items.Select(item => item.Answers.Single().Values.Single()));
    }

    [Fact]
    public async Task GenerateAsync_UsesSequentialTimeRangeForTimeQuestion()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedPreviewData(context, userId, projectId, questionId, 5);
        await context.SaveChangesAsync();
        SetQuestionRule(
            context,
            questionId,
            FormQuestionTypes.Time,
            AnswerRuleModes.TimeRangeSequential,
            JsonSerializer.Serialize(new { fromTime = "09:00", toTime = "11:00", stepMinutes = 60 }));
        await context.SaveChangesAsync();

        var service = new ResponseGenerationService(
            context,
            new TestCurrentUserContext(userId),
            new CreditService(context));

        var result = await service.GenerateAsync(projectId, new GenerateResponsesRequest(3), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(["09:00", "10:00", "11:00"], result.Items.Select(item => item.Answers.Single().Values.Single()));
    }

    [Fact]
    public async Task AnswerRuleService_RejectsInvalidDateRange()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedPreviewData(context, userId, projectId, questionId, 5);
        await context.SaveChangesAsync();
        context.FormQuestions.Single(item => item.Id == questionId).QuestionType = FormQuestionTypes.Date;
        await context.SaveChangesAsync();

        var service = new AnswerRuleService(context, new TestCurrentUserContext(userId));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateAsync(
                projectId,
                new UpsertAnswerRuleRequest(
                    questionId,
                    AnswerRuleModes.DateRangeSequential,
                    JsonSerializer.Serialize(new { fromDate = "2026-05-20", toDate = "2026-05-18" })),
                CancellationToken.None));
    }

    [Fact]
    public async Task AnswerRuleService_RejectsInvalidTimeStep()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedPreviewData(context, userId, projectId, questionId, 5);
        await context.SaveChangesAsync();
        context.FormQuestions.Single(item => item.Id == questionId).QuestionType = FormQuestionTypes.Time;
        await context.SaveChangesAsync();

        var service = new AnswerRuleService(context, new TestCurrentUserContext(userId));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateAsync(
                projectId,
                new UpsertAnswerRuleRequest(
                    questionId,
                    AnswerRuleModes.TimeRangeSequential,
                    JsonSerializer.Serialize(new { fromTime = "09:00", toTime = "11:00", stepMinutes = 1 })),
                CancellationToken.None));
    }

    [Fact]
    public async Task GenerateAsync_RejectsCountAboveOneHundredWithoutDeductingCredits()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedPreviewData(context, userId, projectId, questionId, 5);
        await context.SaveChangesAsync();

        var service = new ResponseGenerationService(
            context,
            new TestCurrentUserContext(userId),
            new CreditService(context));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.GenerateAsync(projectId, new GenerateResponsesRequest(101), CancellationToken.None));

        var account = await context.UserCreditAccounts.SingleAsync(item => item.UserId == userId);
        Assert.Equal(5, account.Balance);
        Assert.Empty(context.CreditTransactions);

        var usageLog = await context.UsageLogs.SingleAsync(item => item.UserId == userId);
        Assert.Equal(UsageLogStatuses.Failed, usageLog.Status);
        Assert.Equal(0, usageLog.CreditsUsed);
    }

    [Fact]
    public async Task GenerateAsync_RejectsWeightedRuleAboveSafeValueLimitWithoutDeductingCredits()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedPreviewData(context, userId, projectId, questionId, 5);
        await context.SaveChangesAsync();
        SeedChoiceRule(
            context,
            questionId,
            AnswerRuleModes.RandomByPercentage,
            JsonSerializer.Serialize(new { weights = new Dictionary<string, int> { ["A"] = 10, ["B"] = 1 } }));
        await context.SaveChangesAsync();

        var service = new ResponseGenerationService(
            context,
            new TestCurrentUserContext(userId),
            new CreditService(context));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.GenerateAsync(projectId, new GenerateResponsesRequest(1), CancellationToken.None));

        var account = await context.UserCreditAccounts.SingleAsync(item => item.UserId == userId);
        Assert.Equal(5, account.Balance);
        Assert.Empty(context.GeneratedResponses);
        Assert.Empty(context.CreditTransactions);
    }

    [Fact]
    public async Task GenerateAsync_RejectsQuantityRuleAboveSafeValueLimitWithoutDeductingCredits()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedPreviewData(context, userId, projectId, questionId, 5);
        await context.SaveChangesAsync();
        SeedChoiceRule(
            context,
            questionId,
            AnswerRuleModes.RandomByQuantity,
            JsonSerializer.Serialize(new { quantities = new Dictionary<string, int> { ["A"] = 6, ["B"] = 5 } }));
        await context.SaveChangesAsync();

        var service = new ResponseGenerationService(
            context,
            new TestCurrentUserContext(userId),
            new CreditService(context));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.GenerateAsync(projectId, new GenerateResponsesRequest(1), CancellationToken.None));

        var account = await context.UserCreditAccounts.SingleAsync(item => item.UserId == userId);
        Assert.Equal(5, account.Balance);
        Assert.Empty(context.GeneratedResponses);
        Assert.Empty(context.CreditTransactions);
    }

    [Fact]
    public async Task GenerateAsync_DoesNotStoreGeneratedResponsesWhenCreditsAreInsufficient()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedPreviewData(context, userId, projectId, questionId, 1);
        await context.SaveChangesAsync();

        var service = new ResponseGenerationService(
            context,
            new TestCurrentUserContext(userId),
            new CreditService(context));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.GenerateAsync(projectId, new GenerateResponsesRequest(2), CancellationToken.None));

        Assert.Empty(context.GeneratedResponses);
        Assert.Empty(context.CreditTransactions);

        var account = await context.UserCreditAccounts.SingleAsync(item => item.UserId == userId);
        Assert.Equal(1, account.Balance);

        var usageLog = await context.UsageLogs.SingleAsync(item => item.UserId == userId);
        Assert.Equal(UsageLogStatuses.Failed, usageLog.Status);
        Assert.Equal(0, usageLog.CreditsUsed);
    }

    [Fact]
    public async Task SendAsync_RejectsSubmissionWithoutConfirmation()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var responseId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedSubmittedPreview(context, userId, projectId, responseId);
        await context.SaveChangesAsync();

        var service = new SubmissionService(
            context,
            new TestCurrentUserContext(userId),
            new TestGoogleFormsClient());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.SendAsync(projectId, new SendSubmissionRequest(new[] { responseId }, false), CancellationToken.None));

        Assert.Empty(context.SubmissionJobs);
        Assert.Empty(context.SubmissionLogs);
        Assert.Equal(GeneratedResponseStatuses.Previewed, (await context.GeneratedResponses.SingleAsync()).Status);
    }

    [Fact]
    public async Task SendAsync_RejectsDuplicateResponseIds()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var responseId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedSubmittedPreview(context, userId, projectId, responseId);
        await context.SaveChangesAsync();

        var service = new SubmissionService(
            context,
            new TestCurrentUserContext(userId),
            new TestGoogleFormsClient());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.SendAsync(projectId, new SendSubmissionRequest(new[] { responseId, responseId }, true), CancellationToken.None));

        Assert.Empty(context.SubmissionJobs);
        Assert.Empty(context.SubmissionLogs);
        Assert.Equal(UsageLogStatuses.Failed, (await context.UsageLogs.SingleAsync()).Status);
    }

    [Fact]
    public async Task SendAsync_RejectsAlreadySubmittedResponse()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var responseId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedSubmittedPreview(context, userId, projectId, responseId, GeneratedResponseStatuses.Submitted);
        await context.SaveChangesAsync();

        var service = new SubmissionService(
            context,
            new TestCurrentUserContext(userId),
            new TestGoogleFormsClient());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.SendAsync(projectId, new SendSubmissionRequest(new[] { responseId }, true), CancellationToken.None));

        Assert.Empty(context.SubmissionJobs);
        Assert.Empty(context.SubmissionLogs);
        Assert.Equal(UsageLogStatuses.Failed, (await context.UsageLogs.SingleAsync()).Status);
    }

    [Fact]
    public async Task SendAsync_SubmitsConfirmedPreviewAndWritesSubmissionLog()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var responseId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedSubmittedPreview(context, userId, projectId, responseId);
        await context.SaveChangesAsync();

        var service = new SubmissionService(
            context,
            new TestCurrentUserContext(userId),
            new TestGoogleFormsClient());

        var result = await service.SendAsync(
            projectId,
            new SendSubmissionRequest(new[] { responseId }, true),
            CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(SubmissionJobStatuses.Completed, result.Status);
        Assert.Equal(1, result.SuccessCount);
        Assert.Equal(0, result.FailedCount);
        Assert.Single(result.Logs);

        Assert.Equal(GeneratedResponseStatuses.Submitted, (await context.GeneratedResponses.SingleAsync()).Status);
        Assert.Equal(SubmissionLogStatuses.Success, (await context.SubmissionLogs.SingleAsync()).Status);
        Assert.Equal(UsageLogStatuses.Success, (await context.UsageLogs.SingleAsync()).Status);
        Assert.Equal("SubmitResponses", (await context.AuditLogs.SingleAsync()).Action);
    }

    [Fact]
    public async Task SendAsync_AllowsUpToOneHundredConfirmedPreviews()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        await using var context = CreateContext();
        var responseIds = SeedSubmittedPreviews(context, userId, projectId, 100);
        await context.SaveChangesAsync();
        var googleFormsClient = new CountingGoogleFormsClient();

        var service = new SubmissionService(
            context,
            new TestCurrentUserContext(userId),
            googleFormsClient);

        var result = await service.SendAsync(
            projectId,
            new SendSubmissionRequest(responseIds, true),
            CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(SubmissionJobStatuses.Completed, result.Status);
        Assert.Equal(100, result.Total);
        Assert.Equal(100, result.SuccessCount);
        Assert.Equal(100, googleFormsClient.SubmitCount);
        Assert.Equal(100, await context.SubmissionLogs.CountAsync());
        Assert.Equal(10, (await context.SubmissionJobs.SingleAsync()).RateLimitPerMinute);
    }

    [Fact]
    public async Task SendAsync_RejectsMoreThanOneHundredConfirmedPreviews()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        await using var context = CreateContext();
        var responseIds = SeedSubmittedPreviews(context, userId, projectId, 101);
        await context.SaveChangesAsync();

        var service = new SubmissionService(
            context,
            new TestCurrentUserContext(userId),
            new TestGoogleFormsClient());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.SendAsync(projectId, new SendSubmissionRequest(responseIds, true), CancellationToken.None));

        Assert.Empty(context.SubmissionJobs);
        Assert.Empty(context.SubmissionLogs);
        Assert.Equal(UsageLogStatuses.Failed, (await context.UsageLogs.SingleAsync()).Status);
    }

    [Fact]
    public async Task PauseAsync_MarksRunningJobAsPaused()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var jobId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedSubmittedPreview(context, userId, projectId, Guid.NewGuid());
        context.SubmissionJobs.Add(new SubmissionJob
        {
            Id = jobId,
            ProjectId = projectId,
            Total = 10,
            Status = SubmissionJobStatuses.Running,
            RateLimitPerMinute = 10,
            CreatedAt = DateTimeOffset.UtcNow,
            StartedAt = DateTimeOffset.UtcNow
        });
        await context.SaveChangesAsync();

        var service = new SubmissionService(
            context,
            new TestCurrentUserContext(userId),
            new TestGoogleFormsClient());

        var result = await service.PauseAsync(projectId, jobId, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(SubmissionJobStatuses.Paused, result.Status);
        Assert.Equal(SubmissionJobStatuses.Paused, (await context.SubmissionJobs.SingleAsync(item => item.Id == jobId)).Status);
    }

    [Fact]
    public async Task AnswerRuleService_RejectsOversizedConfigJson()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedPreviewData(context, userId, projectId, questionId, 5);
        await context.SaveChangesAsync();

        var service = new AnswerRuleService(context, new TestCurrentUserContext(userId));
        var oversizedConfig = new string('x', 8193);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateAsync(
                projectId,
                new UpsertAnswerRuleRequest(questionId, AnswerRuleModes.SampleTextLines, oversizedConfig),
                CancellationToken.None));
    }

    [Fact]
    public async Task AnswerRuleService_CreateAsync_UpsertsExistingQuestionRule()
    {
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        await using var context = CreateContext();
        SeedPreviewData(context, userId, projectId, questionId, 5);
        await context.SaveChangesAsync();

        var service = new AnswerRuleService(context, new TestCurrentUserContext(userId));
        var first = await service.CreateAsync(
            projectId,
            new UpsertAnswerRuleRequest(
                questionId,
                AnswerRuleModes.SampleTextLines,
                JsonSerializer.Serialize(new { samples = new[] { "First" } })),
            CancellationToken.None);
        var second = await service.CreateAsync(
            projectId,
            new UpsertAnswerRuleRequest(
                questionId,
                AnswerRuleModes.SampleTextLines,
                JsonSerializer.Serialize(new { samples = new[] { "Second" } })),
            CancellationToken.None);

        Assert.NotNull(first);
        Assert.NotNull(second);
        Assert.Equal(first.Id, second.Id);
        var rule = await context.AnswerRules.SingleAsync(item => item.QuestionId == questionId);
        Assert.Contains("Second", rule.ConfigJson, StringComparison.Ordinal);
    }

    [Fact]
    public async Task FormProjectService_RejectsOversizedFormUrlAndWritesFailedUsageLog()
    {
        var userId = Guid.NewGuid();
        await using var context = CreateContext();
        var service = new FormProjectService(
            context,
            new TestCurrentUserContext(userId),
            new TestGoogleFormsClient());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.AnalyzeAsync(new AnalyzeFormRequest(new string('a', 2049), "Survey"), CancellationToken.None));

        var usageLog = await context.UsageLogs.SingleAsync();
        Assert.Equal(UsageLogStatuses.Failed, usageLog.Status);
        Assert.Equal("AnalyzeForm", usageLog.Action);
    }

    private static FormAutoHubDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new FormAutoHubDbContext(options);
    }

    private static void SeedPreviewData(FormAutoHubDbContext context, Guid userId, Guid projectId, Guid questionId, decimal balance)
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
        context.AnswerRules.Add(new AnswerRule
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            QuestionId = questionId,
            Mode = AnswerRuleModes.SampleTextLines,
            ConfigJson = JsonSerializer.Serialize(new { samples = new[] { "Alice", "Bob" } }),
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

    private static void SeedChoiceRule(FormAutoHubDbContext context, Guid questionId, string mode, string configJson)
    {
        SetQuestionRule(context, questionId, FormQuestionTypes.MultipleChoice, mode, configJson, ["A", "B"]);
    }

    private static void SetQuestionRule(
        FormAutoHubDbContext context,
        Guid questionId,
        string questionType,
        string mode,
        string configJson,
        IReadOnlyList<string>? options = null)
    {
        var question = context.FormQuestions.Single(item => item.Id == questionId);
        question.QuestionType = questionType;
        question.OptionsJson = JsonSerializer.Serialize(options ?? Array.Empty<string>());

        var rule = context.AnswerRules.Single(item => item.QuestionId == questionId);
        rule.Mode = mode;
        rule.ConfigJson = configJson;
    }

    private static void SeedSubmittedPreview(
        FormAutoHubDbContext context,
        Guid userId,
        Guid projectId,
        Guid responseId,
        string status = GeneratedResponseStatuses.Previewed)
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
        context.GeneratedResponses.Add(new GeneratedResponse
        {
            Id = responseId,
            ProjectId = projectId,
            PayloadJson = JsonSerializer.Serialize(new[]
            {
                new GeneratedAnswerResponse(
                    Guid.NewGuid(),
                    "entry.1",
                    "Name",
                    FormQuestionTypes.ShortText,
                    new[] { "Alice" })
            }),
            PreviewText = "Name: Alice",
            Status = status,
            CreatedAt = DateTimeOffset.UtcNow
        });
    }

    private static IReadOnlyList<Guid> SeedSubmittedPreviews(
        FormAutoHubDbContext context,
        Guid userId,
        Guid projectId,
        int count)
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

        var responseIds = Enumerable.Range(0, count).Select(_ => Guid.NewGuid()).ToList();
        context.GeneratedResponses.AddRange(responseIds.Select((responseId, index) => new GeneratedResponse
        {
            Id = responseId,
            ProjectId = projectId,
            PayloadJson = JsonSerializer.Serialize(new[]
            {
                new GeneratedAnswerResponse(
                    Guid.NewGuid(),
                    "entry.1",
                    "Name",
                    FormQuestionTypes.ShortText,
                    new[] { $"Alice {index}" })
            }),
            PreviewText = $"Name: Alice {index}",
            Status = GeneratedResponseStatuses.Previewed,
            CreatedAt = DateTimeOffset.UtcNow
        }));

        return responseIds;
    }

    private sealed class TestCurrentUserContext(Guid userId) : ICurrentUserContext
    {
        public Guid UserId { get; } = userId;
        public bool IsAdmin => false;
    }

    private sealed class TestGoogleFormsClient : IGoogleFormsClient
    {
        public Task<GoogleFormAnalysis> AnalyzeAsync(string formUrl, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<GoogleFormSubmitResult> SubmitAsync(
            string actionUrl,
            IReadOnlyDictionary<string, IReadOnlyList<string>> answers,
            CancellationToken cancellationToken) =>
            Task.FromResult(new GoogleFormSubmitResult(true, string.Empty));
    }

    private sealed class CountingGoogleFormsClient : IGoogleFormsClient
    {
        public int SubmitCount { get; private set; }

        public Task<GoogleFormAnalysis> AnalyzeAsync(string formUrl, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<GoogleFormSubmitResult> SubmitAsync(
            string actionUrl,
            IReadOnlyDictionary<string, IReadOnlyList<string>> answers,
            CancellationToken cancellationToken)
        {
            SubmitCount++;
            return Task.FromResult(new GoogleFormSubmitResult(true, string.Empty));
        }
    }

    private sealed class StubHttpMessageHandler(string html) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.OK)
            {
                Content = new StringContent(html)
            });
    }
}
