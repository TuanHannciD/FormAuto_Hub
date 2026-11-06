using System.Net;
using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Integrations.GoogleForms;
using FormAutoHub.Api.Services;
using Microsoft.EntityFrameworkCore;
using FormAutoHub.Api.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Tests;

public sealed class SubmissionV2Tests
{
    [Fact]
    public async Task GenerationWrongOwnerReturnsNotFoundBeforeVersionValidation()
    {
        await using var db = CreateDb(); var f = await SubmissionV2Fixture.SeedAsync(db, 1);
        var controller = new GeneratedResponsesController(new ResponseGenerationService(db, new User(Guid.NewGuid()), new CreditService(db)))
        { ControllerContext = new() { HttpContext = new DefaultHttpContext() } };
        var result = await controller.Generate(f.Project, new(1), default);
        Assert.IsType<NotFoundResult>(result.Result); Assert.Single(db.GenerationBatches);
    }

    [Fact]
    public async Task MissingSelectionReturnsNotFoundBeforeUnprovenCompatibility()
    {
        await using var db = CreateDb(); var f = await SubmissionV2Fixture.SeedAsync(db, 1);
        var error = await Assert.ThrowsAsync<SubmissionContractException>(() => new SubmissionService(db, new User(f.User), new NoProvider())
            .SendAsync(f.Project, new(2, Guid.NewGuid(), f.Batch, [Guid.NewGuid()], true, false), default));
        Assert.Equal("NotFound", error.Code); Assert.Equal(404, error.StatusCode); Assert.Empty(db.SubmissionJobs);
    }
    [Fact]
    public async Task GenerationOldClientIsFencedBeforeGeneration()
    {
        await using var db = CreateDb(); var f = await SubmissionV2Fixture.SeedAsync(db, 1);
        var controller = new GeneratedResponsesController(new ResponseGenerationService(db, new User(f.User), new CreditService(db)))
        { ControllerContext = new() { HttpContext = new DefaultHttpContext() } };
        var result = await controller.Generate(f.Project, new(1), default);
        var problem = Assert.IsType<ProblemDetails>(Assert.IsType<ObjectResult>(result.Result).Value);
        Assert.Equal(409, problem.Status); Assert.Equal("ClientUpgradeRequired", problem.Extensions["code"]);
        Assert.Single(db.GenerationBatches);
    }

    [Fact]
    public async Task InvalidControlTransitionMapsToConflictProblemDetails()
    {
        await using var db = CreateDb(); var f = await SubmissionV2Fixture.SeedAsync(db, 1);
        var service = SubmissionV2Fixture.Service(db, f.User, new());
        var completed = await service.SendAsync(f.Project, new(2, Guid.NewGuid(), f.Batch, f.Ids, true, false), default);
        var direct = new DirectRuleSubmissionService(db, new User(f.User), new CreditService(db), service);
        var controller = new SubmissionsController(service, direct) { ControllerContext = new() { HttpContext = new DefaultHttpContext() } };
        var result = await controller.Pause(f.Project, completed!.Id, default);
        var response = Assert.IsType<ObjectResult>(result.Result); Assert.Equal(409, response.StatusCode);
        Assert.Equal("InvalidControlTransition", Assert.IsType<ProblemDetails>(response.Value).Extensions["code"]);
    }


    [Fact]
    public async Task OwnedExpiredHistoryIsRejectedBeforeCompatibilityRefresh()
    {
        await using var db = CreateDb(); var f = await SubmissionV2Fixture.SeedAsync(db, 1);
        (await db.GenerationBatches.SingleAsync()).EvictedAt = DateTimeOffset.UtcNow; await db.SaveChangesAsync();
        var compatibility = new SubmissionV2Fixture.Compatibility { Compatible = false };
        var service = SubmissionV2Fixture.Service(db, f.User, new(), compatibility);
        var error = await Assert.ThrowsAsync<SubmissionContractException>(() => service.SendAsync(f.Project, new(2, Guid.NewGuid(), f.Batch, f.Ids, true, true), default));
        Assert.Equal("HistoryExpired", error.Code); Assert.Equal(0, compatibility.Calls); Assert.Empty(db.SubmissionJobs);
    }
    [Fact]
    public async Task TenHoldsSevenSuccessTwoRejectedOneUnknownAndReplayPreserveExactAccounting()
    {
        await using var db = CreateDb(); var f = await SubmissionV2Fixture.SeedAsync(db);
        var receiver = new SubmissionV2Fixture.Receiver { Outcome = n => Task.FromResult(n <= 7 ? SubmissionOutcomeKind.ConfirmedSuccess : n <= 9 ? SubmissionOutcomeKind.ConfirmedRejected : SubmissionOutcomeKind.Unknown) };
        var compatibility = new SubmissionV2Fixture.Compatibility();
        var service = SubmissionV2Fixture.Service(db, f.User, receiver, compatibility);
        var command = Guid.NewGuid(); var request = new SendSubmissionRequest(2, command, f.Batch, f.Ids, true, false);
        var result = await service.SendAsync(f.Project, request, default);
        Assert.Equal(7, result!.SuccessCount); Assert.Equal(2, result.FailedCount); Assert.Equal(1, result.UnknownCount);
        Assert.Equal("Failed", result.Status); Assert.NotNull(result.RunnerAcknowledgedAt); Assert.NotNull(result.FinishedAt);
        Assert.Equal(3, result.Fees!.Credits.Balance); Assert.Equal(1, result.Fees.HeldCredits); Assert.Equal(2, result.Fees.Credits.Available);
        Assert.Equal(7, await db.CreditTransactions.CountAsync()); Assert.Equal(7, await db.UsageLogs.CountAsync(x => x.SubmissionItemId != null));
        Assert.Equal(10, await db.SubmissionLogs.CountAsync()); Assert.Equal(30, await db.CreditReservationEvents.CountAsync()); Assert.Equal(10, receiver.Calls);
        var checks = compatibility.Calls; compatibility.Compatible = false;
        var replay = await service.SendAsync(f.Project, request with { ResponseIds = f.Ids.Reverse().ToArray() }, default);
        Assert.Equal(result.Id, replay!.Id); Assert.Equal(checks, compatibility.Calls); Assert.Equal(10, receiver.Calls);
        var conflict = await Assert.ThrowsAsync<SubmissionContractException>(() => service.SendAsync(f.Project, request with { DuplicateWarningAccepted = true }, default));
        Assert.Equal("CommandConflict", conflict.Code);
    }

    [Fact]
    public async Task ExplicitConfirmedResendCreatesNewItemAndCostsOneAgain()
    {
        await using var db = CreateDb(); var f = await SubmissionV2Fixture.SeedAsync(db, 1, 2);
        var receiver = new SubmissionV2Fixture.Receiver(); var service = SubmissionV2Fixture.Service(db, f.User, receiver);
        var request = new SendSubmissionRequest(2, Guid.NewGuid(), f.Batch, f.Ids, true, false);
        await service.SendAsync(f.Project, request, default);
        var noWarning = await Assert.ThrowsAsync<SubmissionContractException>(() => service.SendAsync(f.Project, request with { CommandId = Guid.NewGuid() }, default));
        Assert.Equal("DuplicateWarningRequired", noWarning.Code);
        var resend = await service.SendAsync(f.Project, request with { CommandId = Guid.NewGuid(), DuplicateWarningAccepted = true }, default);
        Assert.Equal(0, resend!.Fees!.Credits.Balance); Assert.Equal(2, receiver.Calls); Assert.Equal(2, await db.CreditTransactions.CountAsync());
    }

    [Fact]
    public async Task DirectRulesUsesAffordableSubsetFreeGenerationBatchAndPerSuccessSettlement()
    {
        await using var db = CreateDb(); var f = await SubmissionV2Fixture.SeedAsync(db, 1, 2.5m);
        var receiver = new SubmissionV2Fixture.Receiver(); var service = SubmissionV2Fixture.Service(db, f.User, receiver);
        var direct = new DirectRuleSubmissionService(db, new SubmissionV2Fixture.UserContext(f.User), new CreditService(db), service);
        var command = Guid.NewGuid(); var result = await direct.SendAsync(f.Project, new(2, command, 5), default);
        Assert.Equal(2, result!.Total); Assert.Equal(2, result.SuccessCount); Assert.Equal(.5m, result.Fees!.Credits.Balance);
        Assert.Equal(2, receiver.Calls); Assert.Equal(2, await db.GenerationBatches.CountAsync());
        Assert.All(await db.CreditTransactions.ToListAsync(), x => { Assert.Equal(-1, x.Amount); Assert.Equal("SubmissionJobItem", x.ReferenceType); });
        Assert.All(await db.GenerationBatches.ToListAsync(), x => Assert.Equal(0, x.GenerationCredits));
        var conflict = await Assert.ThrowsAsync<SubmissionContractException>(() => direct.SendAsync(f.Project, new(2, command, 1), default));
        Assert.Equal("CommandConflict", conflict.Code);
    }

    [Fact]
    public async Task SelectedInsufficientFundsLeavesNoJobHoldOrAttempt()
    {
        await using var db = CreateDb(); var f = await SubmissionV2Fixture.SeedAsync(db, 2, 1);
        var receiver = new SubmissionV2Fixture.Receiver();
        var error = await Assert.ThrowsAsync<SubmissionContractException>(() => SubmissionV2Fixture.Service(db, f.User, receiver)
            .SendAsync(f.Project, new(2, Guid.NewGuid(), f.Batch, f.Ids, true, false), default));
        Assert.Equal("InsufficientAvailableCredit", error.Code); Assert.Empty(db.SubmissionJobs); Assert.Empty(db.CreditReservations);
        Assert.Empty(db.SubmissionJobItems); Assert.Equal(0, receiver.Calls);
    }

    [Theory]
    [InlineData("Success")]
    [InlineData("Failed")]
    public async Task LegacyBoolAttemptWithoutClassificationCannotReuseEntitlement(string oldStatus)
    {
        await using var db = CreateDb(); var f = await LegacyAsync(db);
        db.SubmissionLogs.Add(new() { Id = Guid.NewGuid(), JobId = Guid.NewGuid(), ResponseId = f.Response, Status = oldStatus }); await db.SaveChangesAsync();
        var receiver = new SubmissionV2Fixture.Receiver();
        var error = await Assert.ThrowsAsync<SubmissionContractException>(() => SubmissionV2Fixture.Service(db, f.User, receiver)
            .SendAsync(f.Project, new(2, Guid.NewGuid(), null, [f.Response], true, true), default));
        Assert.Equal("OutcomeUnresolved", error.Code); Assert.Empty(db.CreditReservations); Assert.Equal(0, receiver.Calls);
    }

    [Theory]
    [InlineData(SubmissionOutcomeKind.ConfirmedSuccess, "Consumed", "PrepaidConsumed")]
    [InlineData(SubmissionOutcomeKind.ConfirmedRejected, "Available", "PrepaidReleased")]
    [InlineData(SubmissionOutcomeKind.Unknown, "Claimed", "PrepaidHeld")]
    public async Task ClassifiedLegacyAdmissionClaimsPrepaidOnlyOnce(SubmissionOutcomeKind outcome, string entitlement, string settlement)
    {
        await using var db = CreateDb(); var f = await LegacyAsync(db); var receiver = new SubmissionV2Fixture.Receiver { Outcome = _ => Task.FromResult(outcome) };
        var service = SubmissionV2Fixture.Service(db, f.User, receiver); var request = new SendSubmissionRequest(2, Guid.NewGuid(), null, [f.Response], true, true);
        var result = await service.SendAsync(f.Project, request, default); await service.SendAsync(f.Project, request, default);
        Assert.Equal(1, receiver.Calls); Assert.Empty(db.CreditTransactions); Assert.Equal(entitlement, (await db.GeneratedResponses.SingleAsync()).LegacyEntitlementState);
        Assert.Equal(settlement, result!.Items.Single().SettlementState);
        if (outcome == SubmissionOutcomeKind.ConfirmedSuccess)
        {
            receiver.Outcome = _ => Task.FromResult(SubmissionOutcomeKind.ConfirmedSuccess);
            await service.SendAsync(f.Project, request with { CommandId = Guid.NewGuid() }, default);
            Assert.Single(db.CreditTransactions); Assert.Equal("Consumed", (await db.GeneratedResponses.SingleAsync()).LegacyEntitlementState);
        }
    }

    internal static async Task<(Guid User, Guid Project, Guid Response)> LegacyAsync(FormAutoHubDbContext db)
    {
        var user = Guid.NewGuid(); var project = Guid.NewGuid(); var response = Guid.NewGuid();
        db.Users.Add(new() { Id = user, Email = $"legacy-{user:N}@example.invalid" });
        db.UserCreditAccounts.Add(new() { Id = Guid.NewGuid(), UserId = user, Balance = 1 });
        db.FormProjects.Add(new() { Id = project, UserId = user, FormUrl = "https://docs.google.com/forms/d/e/synthetic/viewform", FormActionUrl = "https://docs.google.com/forms/d/e/synthetic/formResponse" });
        db.GeneratedResponses.Add(new() { Id = response, ProjectId = project, Status = "Previewed", PricingPolicy = "LegacyBundledV1", LegacyEntitlementState = "Available",
            LegacyEvidenceReference = "test:reviewed-unattempted-pricing-manifest", PayloadJson = JsonSerializer.Serialize(new[] { new GeneratedAnswerResponse(Guid.NewGuid(), "entry.1", "Synthetic", "ShortText", ["one"]) }) });
        await db.SaveChangesAsync(); return (user, project, response);
    }
    [Theory]
    [InlineData(200, "<html><body>Sign in</body></html>")]
    [InlineData(200, "Your response has been recorded")]
    [InlineData(302, "")]
    public async Task HttpStatusAndUnprovenBodyNeverAuthorizeSuccessfulSubmission(int status, string body)
    {
        using var http = new HttpClient(new Receiver(status, body));
        var result = await new GoogleFormsClient(http).SubmitAsync("https://docs.google.com/forms/d/e/test/formResponse",
            new Dictionary<string, IReadOnlyList<string>> { ["entry.1"] = ["one"] }, default);
        Assert.False(result.Success);
    }

    [Fact]
    public async Task WrongOwnerIsCheckedBeforeConfirmationAndDoesNotWriteVictimActivity()
    {
        await using var db = CreateDb();
        var project = Guid.NewGuid();
        db.FormProjects.Add(new() { Id = project, UserId = Guid.NewGuid() });
        await db.SaveChangesAsync();
        var result = await new SubmissionService(db, new User(Guid.NewGuid()), new NoProvider())
            .SendAsync(project, new(0, Guid.Empty, null, [], false, false), default);
        Assert.Null(result); Assert.Empty(db.UsageLogs); Assert.Empty(db.SubmissionJobs);
    }

    internal static FormAutoHubDbContext CreateDb() => new(new DbContextOptionsBuilder<FormAutoHubDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    [Fact]
    public async Task NewSendWithIncompleteMetadataDoesNotCreateHoldJobOrProviderInvocation()
    {
        await using var db = CreateDb();
        var user = Guid.NewGuid(); var project = Guid.NewGuid(); var response = Guid.NewGuid();
        db.FormProjects.Add(new() { Id = project, UserId = user, FormUrl = "https://docs.google.com/forms/d/e/test/viewform",
            FormActionUrl = "https://docs.google.com/forms/d/e/test/formResponse" });
        db.GeneratedResponses.Add(new() { Id = response, ProjectId = project, Status = "Previewed",
            PayloadJson = JsonSerializer.Serialize(new[] { new GeneratedAnswerResponse(Guid.NewGuid(), "entry.1", "Question", "ShortText", ["one"]) }) });
        await db.SaveChangesAsync();
        var failure = await Assert.ThrowsAsync<SubmissionContractException>(() => new SubmissionService(db, new User(user), new NoProvider())
            .SendAsync(project, new(2, Guid.NewGuid(), null, [response], true, false), default));
        Assert.Equal("FormEvidenceUnavailable", failure.Code); Assert.Equal(409, failure.StatusCode);
        Assert.Empty(db.SubmissionJobs); Assert.Empty(db.CreditReservations); Assert.Empty(db.SubmissionLogs); Assert.Empty(db.CreditTransactions);
    }

    [Fact]
    public async Task LegacyNewDirectCommandIsFencedBeforeAnyGenerationOrActivity()
    {
        await using var db = CreateDb(); var user = new User(Guid.NewGuid()); var project = Guid.NewGuid();
        db.FormProjects.Add(new() { Id = project, UserId = user.UserId }); await db.SaveChangesAsync();
        var service = new DirectRuleSubmissionService(db, user, new CreditService(db), new SubmissionService(db, user, new NoProvider()));
        var failure = await Assert.ThrowsAsync<SubmissionContractException>(() => service.SendAsync(project, new(0, Guid.NewGuid(), 1), default));
        Assert.Equal("ClientUpgradeRequired", failure.Code); Assert.Empty(db.UsageLogs); Assert.Empty(db.GeneratedResponses);
    }
    internal sealed record User(Guid UserId) : ICurrentUserContext { public bool IsAdmin => false; }
    internal sealed class NoProvider : IGoogleFormsClient
    {
        public Task<GoogleFormAnalysis> AnalyzeAsync(string url, CancellationToken ct) => throw new InvalidOperationException("Unexpected analysis");
        public Task<GoogleFormSubmitResult> SubmitAsync(string url, IReadOnlyDictionary<string, IReadOnlyList<string>> answers, CancellationToken ct) => throw new InvalidOperationException("Unexpected provider call");
    }
    private sealed class Receiver(int status, string body) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) =>
            Task.FromResult(new HttpResponseMessage((HttpStatusCode)status) { Content = new StringContent(body) });
    }
}
