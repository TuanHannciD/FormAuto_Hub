using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Integrations.GoogleForms;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface ISubmissionService
{
    Task<SubmissionJobResponse?> SendAsync(Guid projectId, SendSubmissionRequest request, CancellationToken cancellationToken);
    Task<SubmissionJobResponse?> GetJobAsync(Guid projectId, Guid jobId, CancellationToken cancellationToken);
    Task<SubmissionJobResponse?> PauseAsync(Guid projectId, Guid jobId, CancellationToken cancellationToken);
    Task<SubmissionJobResponse?> CancelAsync(Guid projectId, Guid jobId, CancellationToken cancellationToken);
}

public sealed class SubmissionService(FormAutoHubDbContext dbContext, ICurrentUserContext currentUser,
    IGoogleFormsClient googleFormsClient, ISubmissionCompatibilityService? compatibilityService = null) : ISubmissionService
{
    private ISubmissionCompatibilityService Compatibility => compatibilityService ?? new SubmissionCompatibilityService(dbContext, currentUser, googleFormsClient);
    private Task<bool> OwnedAsync(Guid project, CancellationToken ct) => dbContext.FormProjects.AsNoTracking().AnyAsync(x => x.Id == project && x.UserId == currentUser.UserId, ct);
    private static void Version(int version) { if (version != 2) throw new SubmissionContractException("ClientUpgradeRequired", 409); }
    private static void Require(bool condition, string code, int status = 400) { if (!condition) throw new SubmissionContractException(code, status); }

    public async Task<SubmissionJobResponse?> SendAsync(Guid projectId, SendSubmissionRequest request, CancellationToken ct)
    {
        if (!await OwnedAsync(projectId, ct)) return null;
        Version(request.ContractVersion);
        Require(request.CommandId != Guid.Empty, "InvalidCommand");
        var ids = request.ResponseIds ?? [];
        var fingerprint = SubmissionAdmission.Fingerprint(currentUser.UserId, projectId, "selected", request.BatchId, ids, null, request.Confirmed, request.DuplicateWarningAccepted);
        if (await SubmissionAdmission.ReplayAsync(dbContext, currentUser.UserId, projectId, request.CommandId, fingerprint, ct) is { } replay)
            return await ReadAsync(replay, ct);
        Require(ids.Count is >= 1 and <= 100 && ids.All(x => x != Guid.Empty) && ids.Distinct().Count() == ids.Count, "InvalidResponseSelection");
        Require(request.Confirmed, "ConfirmationRequired");
        if (request.BatchId is Guid requestedBatch)
        {
            var selectedBatch = await dbContext.GenerationBatches.AsNoTracking().SingleOrDefaultAsync(x => x.Id == requestedBatch && x.UserId == currentUser.UserId, ct);
            Require(selectedBatch is not null && selectedBatch.ProjectId == projectId, "NotFound", 404);
            Require(selectedBatch!.EvictedAt is null, "HistoryExpired", 409);
        }
        Require(await dbContext.GeneratedResponses.AsNoTracking().CountAsync(x => x.ProjectId == projectId && ids.Contains(x.Id), ct) == ids.Count, "NotFound", 404);
        // Metadata cannot be manufactured from generation observations. This refresh stays outside SQL retries.
        var compatibility = await Compatibility.CheckAsync(projectId, request.BatchId, ids, ct);
        RequireCompatibility(compatibility);
        var admission = await SubmissionAdmission.RunAsync(dbContext, currentUser.UserId, projectId, request.CommandId, fingerprint,
            "selected", compatibility, token => SelectAsync(projectId, request, token), ct);
        if (admission.Run) await RunAsync(admission.Job, ct);
        return await ReadAsync(admission.Job, CancellationToken.None);
    }

    internal async Task<SubmissionJobResponse?> SendDirectAsync(Guid projectId, DirectRuleSubmissionRequest request, ICreditService credits, CancellationToken ct)
    {
        if (!await OwnedAsync(projectId, ct)) return null;
        Version(request.ContractVersion);
        Require(request.CommandId != Guid.Empty, "InvalidCommand");
        var fingerprint = SubmissionAdmission.Fingerprint(currentUser.UserId, projectId, "direct", null, [], request.Count, false, false);
        if (await SubmissionAdmission.ReplayAsync(dbContext, currentUser.UserId, projectId, request.CommandId, fingerprint, ct) is { } replay)
            return await ReadAsync(replay, ct);
        Require(request.Count is >= 1 and <= 100, "InvalidCount");
        var compatibility = await Compatibility.CheckAsync(projectId, null, [], ct);
        RequireCompatibility(compatibility);
        var admission = await SubmissionAdmission.RunAsync(dbContext, currentUser.UserId, projectId, request.CommandId, fingerprint,
            "direct", compatibility, async token =>
            {
                var available = await new CreditReservationService(dbContext).GetCreditAvailabilityAsync(currentUser.UserId, token);
                var count = (int)Math.Min(request.Count, Math.Max(0m, Math.Floor(available.Available)));
                Require(count > 0, "InsufficientAvailableCredit", 409);
                var generated = await new ResponseGenerationService(dbContext, currentUser, credits).GenerateForDirectSubmissionAsync(projectId, count, request.Count, token);
                var ids = generated!.Items.Select(x => x.Id).ToArray();
                return await dbContext.GeneratedResponses.Where(x => ids.Contains(x.Id)).OrderBy(x => x.BatchOrdinal).ToListAsync(token);
            }, ct);
        if (admission.Run) await RunAsync(admission.Job, ct);
        return await ReadAsync(admission.Job, CancellationToken.None);
    }

    private async Task<IReadOnlyList<GeneratedResponse>> SelectAsync(Guid project, SendSubmissionRequest request, CancellationToken ct)
    {
        GenerationBatch? batch = null;
        if (request.BatchId is Guid batchId)
        {
            batch = dbContext.Database.IsSqlServer()
                ? await dbContext.GenerationBatches.FromSqlInterpolated($"SELECT * FROM [GenerationBatches] WITH (UPDLOCK,HOLDLOCK) WHERE [Id]={batchId} AND [UserId]={currentUser.UserId}").SingleOrDefaultAsync(ct)
                : await dbContext.GenerationBatches.SingleOrDefaultAsync(x => x.Id == batchId && x.UserId == currentUser.UserId, ct);
            Require(batch is not null && batch.ProjectId == project, "NotFound", 404);
            if (dbContext.Database.IsSqlServer()) await dbContext.Entry(batch!).ReloadAsync(ct);
            Require(batch!.EvictedAt is null, "HistoryExpired", 409);
        }
        var ids = request.ResponseIds;
        var responses = await dbContext.GeneratedResponses.Where(x => x.ProjectId == project && ids.Contains(x.Id)).OrderBy(x => x.BatchOrdinal).ThenBy(x => x.Id).ToListAsync(ct);
        Require(responses.Count == ids.Count, "NotFound", 404);
        foreach (var response in responses)
        {
            if (dbContext.Database.IsSqlServer()) await dbContext.Entry(response).ReloadAsync(ct);
            Require(response.GenerationBatchId == request.BatchId, "MixedBatchSelection");
            Require(response.PricingPolicy is "SeparatedV1" or "LegacyBundledV1", "OutcomeUnresolved", 409);
            if (response.PricingPolicy == "LegacyBundledV1")
            {
                Require(!string.IsNullOrWhiteSpace(response.LegacyEvidenceReference) && response.LegacyEntitlementState is "Available" or "Consumed" && response.LegacyClaimItemId == null, "OutcomeUnresolved", 409);
                Require(!await dbContext.SubmissionLogs.AnyAsync(log => log.ResponseId == response.Id && log.ItemId == null &&
                    !dbContext.LegacyAttemptEvidence.Any(e => e.ResponseId == response.Id && e.LegacySubmissionLogId == log.Id &&
                        (e.OutcomeKind == "ConfirmedSuccess" || e.OutcomeKind == "ConfirmedRejected")), ct), "OutcomeUnresolved", 409);
            }
            else Require(batch is not null && batch.PricingPolicy == "SeparatedV1", "InvalidResponseSelection");
            _ = Payload(response.PayloadJson);
        }
        Require(responses.Select(x => x.PricingPolicy).Distinct().Count() == 1, "MixedPricingSelection");
        Require(!await dbContext.SubmissionJobItems.AnyAsync(x => ids.Contains(x.ResponseId) &&
            (x.AttemptState == "PossibleDispatch" || x.AttemptState == "Unknown" || x.SettlementState == "Held" || x.SettlementState == "PrepaidHeld"), ct), "OutcomeUnresolved", 409);
        var hasAttempt = await dbContext.SubmissionLogs.AnyAsync(x => ids.Contains(x.ResponseId), ct) ||
            await dbContext.SubmissionJobItems.AnyAsync(x => ids.Contains(x.ResponseId) && x.PossibleDispatchAt != null, ct);
        Require(!hasAttempt || request.DuplicateWarningAccepted, "DuplicateWarningRequired");
        return responses;
    }

    private static void RequireCompatibility(SubmissionCompatibilityResult value)
    {
        Require(value.Compatible, value.RejectionCode is "FormIncompatible" ? "FormIncompatible" : "FormEvidenceUnavailable", 409);
        Require(value.CheckedAt != default && !string.IsNullOrWhiteSpace(value.CompatibilityEvidenceJson) &&
            SubmissionAdmission.Hash(value.CompatibilityEvidenceJson) == value.CompatibilityEvidenceSha256, "FormEvidenceUnavailable", 409);
    }

    private static IReadOnlyDictionary<string, IReadOnlyList<string>> Payload(string json)
    {
        try
        {
            var answers = JsonSerializer.Deserialize<GeneratedAnswerResponse[]>(json) ?? [];
            Require(answers.Length > 0 && answers.All(x => !string.IsNullOrWhiteSpace(x.EntryId) && x.Values != null) &&
                answers.Select(x => x.EntryId).Distinct().Count() == answers.Length, "InvalidPayload");
            return answers.ToDictionary(x => x.EntryId, x => x.Values);
        }
        catch (JsonException exception) { throw new SubmissionContractException("InvalidPayload", 400, exception); }
    }

    private async Task RunAsync(SubmissionJob job, CancellationToken ct)
    {
        var settlement = new SubmissionSettlementService(dbContext, new CreditService(dbContext));
        var interrupted = false;
        try
        {
            // Admission has acknowledged this runner; even its initial read/cancellation must
            // reach bounded finalization so durable Planned holds can be safely released.
            var items = await dbContext.SubmissionJobItems.AsNoTracking().Where(x => x.JobId == job.Id).OrderBy(x => x.Ordinal).ToListAsync(ct);
            foreach (var batch in items.Chunk(10))
            {
                ct.ThrowIfCancellationRequested();
                var fresh = await Compatibility.CheckAsync(job.ProjectId, job.GenerationBatchId, items.Select(x => x.ResponseId).ToArray(), ct);
                if (!fresh.Compatible || fresh.CompatibilityEvidenceSha256 != batch[0].CompatibilityEvidenceSha256) { interrupted = true; break; }
                foreach (var item in batch)
                {
                    ct.ThrowIfCancellationRequested();
                    var payload = Payload(item.PayloadJson);
                    if (!SubmissionCompatibilityService.Accepts(fresh.CompatibilityEvidenceJson, item.PayloadJson)) { interrupted = true; break; }
                    var prepared = await googleFormsClient.PrepareSubmissionAsync(item.FormActionUrl, payload, ct, fresh.CompatibilityEvidenceJson);
                    if (prepared is null) { interrupted = true; break; }
                    // Only an acknowledged FIRST transition grants this runner one outbound invocation.
                    if (!await settlement.MarkPossibleDispatchAsync(item.Id, ct)) { interrupted = true; break; }
                    VerifiedSubmissionOutcome outcome;
                    try { outcome = await prepared(ct); }
                    catch (Exception e) when (e is HttpRequestException or IOException or OperationCanceledException)
                    { outcome = GoogleSubmissionEvidence.Unknown("TransportUncertain", e.GetType().Name); }
                    await settlement.SettleAttemptAsync(item.Id, outcome, CancellationToken.None);
                    if (outcome.Kind == SubmissionOutcomeKind.Unknown) { interrupted = true; break; }
                }
                if (interrupted) break;
                var control = await dbContext.SubmissionJobs.AsNoTracking().SingleAsync(x => x.Id == job.Id, CancellationToken.None);
                if (control.Status is "Paused" or "Cancelled") break;
            }
        }
        catch (Exception)
        {
            // Persistence/pre-call uncertainty never authorizes provider replay. Stop and retain any possible attempt.
            dbContext.ChangeTracker.Clear();
            interrupted = true;
            throw;
        }
        finally
        {
            using var diagnostic = new CancellationTokenSource(TimeSpan.FromSeconds(30));
            await new CreditReservationService(dbContext).AcknowledgeRunnerAsync(job.Id, interrupted, diagnostic.Token);
        }
    }

    public async Task<SubmissionJobResponse?> GetJobAsync(Guid projectId, Guid jobId, CancellationToken ct)
    {
        if (!await OwnedAsync(projectId, ct)) return null;
        var job = await dbContext.SubmissionJobs.AsNoTracking().SingleOrDefaultAsync(x => x.Id == jobId && x.ProjectId == projectId, ct);
        return job is null ? null : await ReadAsync(job, ct);
    }

    private async Task<SubmissionJobResponse> ReadAsync(SubmissionJob identity, CancellationToken ct)
    {
        var job = await dbContext.SubmissionJobs.AsNoTracking().SingleAsync(x => x.Id == identity.Id, ct);
        var logs = await dbContext.SubmissionLogs.AsNoTracking().Where(x => x.JobId == job.Id).ToListAsync(ct);
        var result = job.ToResponse(logs);
        if (job.ContractVersion != 2) return result;
        var items = await dbContext.SubmissionJobItems.AsNoTracking().Where(x => x.JobId == job.Id).OrderBy(x => x.Ordinal).ToListAsync(ct);
        var reservation = await dbContext.CreditReservations.AsNoTracking().SingleAsync(x => x.JobId == job.Id, ct);
        var evidence = await dbContext.CreditReservationEvents.AsNoTracking().Where(x => x.ReservationId == reservation.Id && x.EvidenceCode != null).OrderByDescending(x => x.Sequence).ToListAsync(ct);
        return result with { CommandId = job.CommandId, ContractVersion = job.ContractVersion, BatchId = job.GenerationBatchId,
            UnknownCount = job.UnknownCount, NotDispatchedCount = job.NotDispatchedCount, HeldCount = job.HeldCount, RunnerAcknowledgedAt = job.RunnerAcknowledgedAt,
            Items = items.Select(x => new SubmissionItemResponse(x.Id, x.ResponseId, x.AttemptState, x.SettlementState, x.MaximumSendCredits,
                x.SettlementState == "Settled" ? 1 : 0, evidence.FirstOrDefault(e => e.ItemId == x.Id)?.EvidenceCode)).ToArray(),
            Fees = new(reservation.Id, (int)reservation.InitialAmount, reservation.OutstandingAmount, (int)reservation.SettledAmount,
                reservation.ReleasedAmount, job.UnknownCount ?? 0, job.NotDispatchedCount ?? 0, job.RunnerAcknowledgedAt != null,
                await new CreditReservationService(dbContext).GetCreditAvailabilityAsync(currentUser.UserId, ct)) };
    }

    public Task<SubmissionJobResponse?> PauseAsync(Guid projectId, Guid jobId, CancellationToken ct) => ControlAsync(projectId, jobId, false, ct);
    public Task<SubmissionJobResponse?> CancelAsync(Guid projectId, Guid jobId, CancellationToken ct) => ControlAsync(projectId, jobId, true, ct);
    private async Task<SubmissionJobResponse?> ControlAsync(Guid projectId, Guid jobId, bool cancel, CancellationToken ct)
    {
        if (!await OwnedAsync(projectId, ct)) return null;
        var found = await dbContext.SubmissionJobs.AsNoTracking().SingleOrDefaultAsync(x => x.Id == jobId && x.ProjectId == projectId, ct);
        if (found is null) return null;
        await CreditWriteTransaction.RunAsync(dbContext, async () =>
        {
            await CreditAccountLock.AcquireAsync(dbContext, currentUser.UserId, ct);
            await CreditAccountLock.LockProjectAsync(dbContext, currentUser.UserId, projectId, ct);
            var job = await dbContext.SubmissionJobs.SingleAsync(x => x.Id == jobId, ct);
            if (dbContext.Database.IsSqlServer()) await dbContext.Entry(job).ReloadAsync(ct);
            Require(job.Status is "Pending" or "Running" || cancel && job.Status == "Paused", "InvalidControlTransition", 409);
            job.Status = cancel ? "Cancelled" : "Paused";
            // If an already acknowledged paused runner is cancelled, no new runner/lease is created.
            if (cancel && job.RunnerAcknowledgedAt != null) job.FinishedAt = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(ct);
            return true;
        }, ct);
        return await ReadAsync(found, ct);
    }
}
