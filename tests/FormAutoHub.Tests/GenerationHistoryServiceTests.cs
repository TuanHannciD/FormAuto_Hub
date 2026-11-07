using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Tests;

public sealed class GenerationHistoryServiceTests
{
    [Fact]
    public async Task TwentyFirstRun_EvictsAccountOldestAcrossProjectsWithoutDeletingPayloads()
    {
        await using var db = CreateContext();
        var user = Guid.NewGuid();
        var p1 = Seed(db, user); var p2 = Seed(db, user);
        db.UserCreditAccounts.Add(new() { Id = Guid.NewGuid(), UserId = user, Balance = 100 });
        await db.SaveChangesAsync();
        var service = new ResponseGenerationService(db, new UserContext(user), new CreditService(db));
        for (var i = 0; i < 21; i++)
            await service.GenerateAsync(i % 2 == 0 ? p1 : p2, new(1), default);
        Assert.Equal(21, await db.GenerationBatches.CountAsync());
        Assert.Equal(20, await db.GenerationBatches.CountAsync(x => x.EvictedAt == null));
        Assert.Equal(21, await db.GeneratedResponses.CountAsync());
        Assert.Empty(db.CreditTransactions);
    }

    [Fact]
    public async Task History_IsOwnerScopedPaginatedAndKeepsHonestImmutableObservation()
    {
        await using var db = CreateContext();
        var user = Guid.NewGuid(); var project = Seed(db, user); var other = Guid.NewGuid(); var otherProject = Seed(db, other);
        await db.SaveChangesAsync();
        var generation = new ResponseGenerationService(db, new UserContext(user), new CreditService(db));
        for (var i = 0; i < 21; i++) await generation.GenerateAsync(project, new(1), default);
        await new ResponseGenerationService(db, new UserContext(other), new CreditService(db)).GenerateAsync(otherProject, new(1), default);
        db.FormProjects.Single(x => x.Id == project).Name = "Changed";
        db.FormQuestions.Single(x => x.ProjectId == project).EntryId = "entry.changed";
        await db.SaveChangesAsync();
        var service = new GenerationHistoryService(db, new UserContext(user));
        var page = await service.GetMineAsync(1, 10, default);
        Assert.Equal(20, page.TotalItems); Assert.Equal(2, page.TotalPages); Assert.Equal(10, page.Items.Count);
        Assert.All(page.Items, x => { Assert.Equal(project, x.ProjectId); Assert.Equal("Original", x.FormName); Assert.Equal(0, x.GenerationCredits); });
        Assert.Equal(10, (await service.GetMineAsync(2, 10, default)).Items.Count);
        Assert.Empty((await service.GetMineAsync(int.MaxValue, 20, default)).Items);
        var detail = await service.GetDetailAsync(page.Items[0].BatchId, default);
        Assert.NotNull(detail); Assert.Equal("Partial", detail.Observation.Completeness); Assert.Equal("Unknown", detail.Observation.ReceiptCapability);
        var observed = Assert.Single(detail.Observation.Questions);
        Assert.Null(observed.Required); Assert.Null(observed.Options); Assert.Null(observed.ConstraintsJson); Assert.Equal("entry.1", observed.EntryId);
        var response = Assert.Single(detail.Responses); Assert.True(response.SendBlocked); Assert.False(response.PrepaidFirstSuccessAvailable);
        Assert.Equal(1, response.Outcomes.NeverAttemptedResponses);
        Assert.Null(await new GenerationHistoryService(db, new UserContext(other)).GetDetailAsync(page.Items[0].BatchId, default));
        var expired = await db.GenerationBatches.SingleAsync(x => x.UserId == user && x.EvictedAt != null);
        Assert.Null(await service.GetDetailAsync(expired.Id, default));
        Assert.DoesNotContain("RawProvider", System.Text.Json.JsonSerializer.Serialize(detail));
    }

    [Fact]
    public async Task SupportedHistoryIsSelectableButObservationRemainsPartial()
    {
        await using var db = CreateContext(); var f = await SubmissionV2Fixture.SeedAsync(db, 1);
        var service = new GenerationHistoryService(db, new UserContext(f.User), new SubmissionV2Fixture.Compatibility());
        var detail = await service.GetDetailAsync(f.Batch, default);
        Assert.NotNull(detail); Assert.False(Assert.Single(detail.Responses).SendBlocked);
        Assert.Null(detail.Responses[0].BlockReason); Assert.Equal("Partial", detail.Observation.Completeness);
    }

    [Theory]
    [InlineData(0, 10)] [InlineData(1, 0)] [InlineData(1, 21)]
    public async Task History_RejectsInvalidPagination(int page, int size)
    {
        await using var db = CreateContext();
        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => new GenerationHistoryService(db, new UserContext(Guid.NewGuid())).GetMineAsync(page, size, default));
    }

    [Fact]
    public async Task Recovery_OnlyReturnsEligibleOrProvenLegacyAndNeverExpiredBatchIds()
    {
        await using var db = CreateContext(); var user = Guid.NewGuid(); var project = Seed(db, user); await db.SaveChangesAsync();
        var generation = new ResponseGenerationService(db, new UserContext(user), new CreditService(db));
        var first = await generation.GenerateAsync(project, new(1), default);
        for (var i = 0; i < 20; i++) await generation.GenerateAsync(project, new(1), default);
        var unknownLegacy = new GeneratedResponse { Id = Guid.NewGuid(), ProjectId = project, PayloadJson = "[]" };
        var provenLegacy = new GeneratedResponse { Id = Guid.NewGuid(), ProjectId = project, PayloadJson = "[]", PricingPolicy = "LegacyBundledV1", LegacyEntitlementState = "Available", LegacyEvidenceReference = "approved-manifest/synthetic" };
        db.GeneratedResponses.AddRange(unknownLegacy, provenLegacy); await db.SaveChangesAsync();
        var all = await generation.GetProjectResponsesAsync(project, [], default);
        Assert.Equal(21, all!.Items.Count); Assert.Contains(all.Items, x => x.Id == provenLegacy.Id);
        Assert.DoesNotContain(all.Items, x => x.Id == unknownLegacy.Id || x.Id == first!.Items[0].Id);
        Assert.Null(await generation.GetProjectResponsesAsync(project, [first!.Items[0].Id], default));
        Assert.Null(await new ResponseGenerationService(db, new UserContext(Guid.NewGuid()), new CreditService(db)).GetProjectResponsesAsync(project, [], default));
    }

    [Theory]
    [InlineData("batch")] [InlineData("payload")] [InlineData("membership")] [InlineData("delete")]
    public async Task PersistedBatchAndMembership_RejectRewrites(string mutation)
    {
        await using var db = CreateContext(); var user = Guid.NewGuid(); var project = Seed(db, user); await db.SaveChangesAsync();
        await new ResponseGenerationService(db, new UserContext(user), new CreditService(db)).GenerateAsync(project, new(1), default);
        var batch = await db.GenerationBatches.SingleAsync(); var response = await db.GeneratedResponses.SingleAsync();
        if (mutation == "batch") batch.FormName = "Rewrite";
        if (mutation == "payload") response.PayloadJson = "[]";
        if (mutation == "membership") response.BatchOrdinal = 99;
        if (mutation == "delete") db.GeneratedResponses.Remove(response);
        await Assert.ThrowsAsync<InvalidOperationException>(() => db.SaveChangesAsync());
    }

    [Fact]
    public async Task BatchReplay_IsReadOnlyAndRejectsChangedExactMembership()
    {
        await using var db = CreateContext(); var user = Guid.NewGuid(); var project = Seed(db, user); await db.SaveChangesAsync();
        await new ResponseGenerationService(db, new UserContext(user), new CreditService(db)).GenerateAsync(project, new(2), default);
        var responses = await db.GeneratedResponses.AsNoTracking().OrderBy(x => x.BatchOrdinal).ToListAsync();
        var writer = new GenerationBatchWriter(db, new UserContext(user));
        var id = await writer.AppendBatchAsync(project, "rules", responses, 2, 0, default);
        Assert.Equal(responses[0].Id, id); Assert.Single(db.GenerationBatches); Assert.Single(db.UsageLogs);
        responses[1].PayloadJson = "[]";
        await Assert.ThrowsAsync<InvalidOperationException>(() => writer.AppendBatchAsync(project, "rules", responses, 2, 0, default));
    }

    [Fact]
    public async Task UnownedInvalidRules_DoesNotWriteProjectAudit()
    {
        await using var db = CreateContext(); var project = Seed(db, Guid.NewGuid()); await db.SaveChangesAsync();
        var result = await new ResponseGenerationService(db, new UserContext(Guid.NewGuid()), new CreditService(db)).GenerateAsync(project, new(101), default);
        Assert.Null(result); Assert.Empty(db.UsageLogs);
    }

    [Fact]
    public async Task HistoryOutcomes_CountAttemptsAndTreatLegacyBoolAsUnknown()
    {
        await using var db = CreateContext(); var user = Guid.NewGuid(); var project = Seed(db, user); await db.SaveChangesAsync();
        var created = await new ResponseGenerationService(db, new UserContext(user), new CreditService(db)).GenerateAsync(project, new(3), default);
        var ids = created!.Items.Select(x => x.Id).ToArray();
        foreach (var state in new[] { "Succeeded", "Succeeded", "Rejected", "Unknown" })
            db.SubmissionJobItems.Add(new() { Id = Guid.NewGuid(), JobId = Guid.NewGuid(), ProjectId = project,
                ResponseId = state == "Unknown" ? ids[1] : ids[0], GenerationBatchId = created.GenerationBatchId,
                AttemptState = state, SettlementState = state == "Succeeded" ? "Settled" : state == "Rejected" ? "Released" : "Held",
                PossibleDispatchAt = DateTimeOffset.UtcNow });
        db.SubmissionLogs.Add(new() { Id = Guid.NewGuid(), JobId = Guid.NewGuid(), ResponseId = ids[2], Status = "Success" });
        await db.SaveChangesAsync();
        var history = await new GenerationHistoryService(db, new UserContext(user)).GetDetailAsync(created.GenerationBatchId!.Value, default);
        Assert.Equal(new HistoryOutcomes(2, 1, 2, 0), history!.Run.Outcomes);
        Assert.Equal(new HistoryOutcomes(2, 1, 0, 0), history.Responses[0].Outcomes);
        Assert.Equal("OutcomeUnresolved", history.Responses[1].BlockReason);
        Assert.Equal(new HistoryOutcomes(0, 0, 1, 0), history.Responses[2].Outcomes);
    }

    [Fact]
    public async Task RulesFree_DoesNotConvertLargePostedBalancesToInt()
    {
        await using var db = CreateContext(); var user = Guid.NewGuid(); var project = Seed(db, user);
        db.UserCreditAccounts.Add(new() { Id = Guid.NewGuid(), UserId = user, Balance = 3000000000m }); await db.SaveChangesAsync();
        var result = await new ResponseGenerationService(db, new UserContext(user), new CreditService(db)).GenerateAsync(project, new(100), default);
        Assert.Equal(100, result!.GeneratedCount); Assert.Equal(3000000000m, result.BalanceAfter); Assert.Empty(db.CreditTransactions);
    }

    internal static FormAutoHubDbContext CreateContext() => new(new DbContextOptionsBuilder<FormAutoHubDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    internal static Guid Seed(FormAutoHubDbContext db, Guid user)
    {
        var project = Guid.NewGuid(); var question = Guid.NewGuid();
        db.FormProjects.Add(new() { Id = project, UserId = user, Name = "Original", FormUrl = "https://docs.google.com/forms/d/e/synthetic/viewform", FormActionUrl = "https://docs.google.com/forms/d/e/synthetic/formResponse" });
        db.FormQuestions.Add(new() { Id = question, ProjectId = project, Label = "Name", EntryId = "entry.1", QuestionType = FormQuestionTypes.ShortText, OptionsJson = "[]" });
        db.AnswerRules.Add(new() { Id = Guid.NewGuid(), ProjectId = project, QuestionId = question, Mode = AnswerRuleModes.SampleTextLines, ConfigJson = "{\"samples\":[\"Synthetic\"]}" });
        return project;
    }
    internal sealed class UserContext(Guid user) : ICurrentUserContext { public Guid UserId => user; public bool IsAdmin => false; }
}
