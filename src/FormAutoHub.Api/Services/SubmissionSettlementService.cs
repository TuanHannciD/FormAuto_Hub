using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace FormAutoHub.Api.Services;

public interface ISubmissionSettlementService
{
    Task<SubmissionSettlementResult> SettleAttemptAsync(Guid itemId, VerifiedSubmissionOutcome outcome, CancellationToken ct);
    Task<bool> MarkPossibleDispatchAsync(Guid itemId, CancellationToken ct);
    Task<CreditReservationResult> ReleaseUnattemptedAsync(Guid jobId, CancellationToken ct);
}

public sealed class SubmissionSettlementService(FormAutoHubDbContext db, ICreditService credits) : ISubmissionSettlementService
{
    public Task<CreditReservationResult> ReleaseUnattemptedAsync(Guid jobId, CancellationToken ct) => new CreditReservationService(db).ReleaseUnattemptedAsync(jobId, ct);
    public Task<bool> MarkPossibleDispatchAsync(Guid itemId, CancellationToken ct) => new CreditReservationService(db).MarkPossibleDispatchAsync(itemId, ct);
    public async Task<SubmissionSettlementResult> SettleAttemptAsync(Guid itemId, VerifiedSubmissionOutcome outcome, CancellationToken ct)
    {
        if (db.Database.CurrentTransaction is not null) throw new InvalidOperationException("Settlement must own its local transaction.");
        // Finish bounded diagnostics even after the HTTP request was cancelled. No external I/O here.
        using var diagnostic = new CancellationTokenSource(TimeSpan.FromSeconds(30));
        ValidateEvidence(outcome);
        var item = await db.SubmissionJobItems.AsNoTracking().SingleOrDefaultAsync(x => x.Id == itemId, diagnostic.Token) ?? throw new InvalidOperationException("Submission item not found.");
        var identity = await db.SubmissionJobs.AsNoTracking().SingleAsync(x => x.Id == item.JobId, diagnostic.Token);
        try
        {
            return await CreditWriteTransaction.RunAsync(db, () => SettleCoreAsync(itemId, identity, outcome, diagnostic.Token), diagnostic.Token);
        }
        catch (Exception) when (db.Database.IsRelational())
        {
            // A failed acknowledgement is not a reason to resend or debit. Observe durable facts in a fresh context.
            var options = (DbContextOptions<FormAutoHubDbContext>)db.GetService<IDbContextOptions>();
            await using var fresh = new FormAutoHubDbContext(options);
            var evidence = await fresh.CreditReservationEvents.AsNoTracking().SingleOrDefaultAsync(x => x.ItemId == itemId && x.EvidenceId == outcome.Evidence.EvidenceId, diagnostic.Token);
            if (evidence is null || !Matches(evidence, outcome)) throw;
            var persisted = await fresh.SubmissionJobItems.AsNoTracking().SingleAsync(x => x.Id == itemId, diagnostic.Token);
            var result = await new SubmissionSettlementService(fresh, new CreditService(fresh)).ResultAsync(persisted, diagnostic.Token);
            db.ChangeTracker.Clear();
            return result;
        }
    }

    private async Task<SubmissionSettlementResult> SettleCoreAsync(Guid itemId, SubmissionJob identity, VerifiedSubmissionOutcome outcome, CancellationToken ct)
    {
        var (job, items, reservation) = await SubmissionItemMutation.LockAsync(db, identity, ct);
        var item = items.Single(x => x.Id == itemId);
        var prior = await db.CreditReservationEvents.SingleOrDefaultAsync(x => x.ItemId == itemId && x.EvidenceId == outcome.Evidence.EvidenceId, ct);
        if (prior is not null)
        {
            if (!Matches(prior, outcome))
                throw new InvalidOperationException("Evidence identity was reused with different facts.");
            return await ResultAsync(item, ct);
        }
        if (item.AttemptState is "Succeeded" or "Rejected" or "NotDispatched")
        {
            throw new InvalidOperationException("Contradictory terminal outcome.");
        }
        if (item.AttemptState is not ("PossibleDispatch" or "Unknown")) throw new InvalidOperationException("No possible dispatch was recorded.");
        var now = DateTimeOffset.UtcNow;
        CreditTransaction? ledger = null;
        var settled = 0;
        switch (outcome.Kind)
        {
            case SubmissionOutcomeKind.ConfirmedSuccess:
                if (item.MaximumSendCredits == 1)
                {
                    var existing = await db.CreditTransactions.SingleOrDefaultAsync(x => x.Type == CreditTransactionTypes.CreditUsed && x.ReferenceType == nameof(SubmissionJobItem) && x.ReferenceId == item.Id, ct);
                    if (existing is not null) throw new InvalidOperationException("Ledger exists without terminal item evidence.");
                    {
                        var result = await credits.DeductUsageCreditsAsync(reservation.UserId, 1, "Successful form submission.", nameof(SubmissionJobItem), item.Id, ct)
                            ?? throw new InvalidOperationException("Held credit is unavailable.");
                        ledger = result.Transaction; settled = 1;
                    }
                    item.SettlementState = "Settled"; reservation.SettledAmount += 1; reservation.OutstandingAmount -= 1;
                }
                else { item.SettlementState = "PrepaidConsumed"; }
                item.AttemptState = "Succeeded";
                break;
            case SubmissionOutcomeKind.ConfirmedRejected:
                item.AttemptState = "Rejected"; item.SettlementState = item.MaximumSendCredits == 0 ? "PrepaidReleased" : "Released";
                reservation.ReleasedAmount += item.MaximumSendCredits; reservation.OutstandingAmount -= item.MaximumSendCredits; break;
            default:
                item.AttemptState = "Unknown"; item.SettlementState = item.MaximumSendCredits == 0 ? "PrepaidHeld" : "Held"; break;
        }
        item.OutcomeAt = now; item.SettlementCreditTransactionId = ledger?.Id;
        var sequence = await db.CreditReservationEvents.Where(x => x.ReservationId == reservation.Id).Select(x => (int?)x.Sequence).MaxAsync(ct) ?? -1;
        var kind = outcome.Kind switch { SubmissionOutcomeKind.ConfirmedSuccess when item.MaximumSendCredits == 1 => "Settled", SubmissionOutcomeKind.ConfirmedSuccess => "PrepaidConsumed", SubmissionOutcomeKind.ConfirmedRejected when item.MaximumSendCredits == 1 => "Released", SubmissionOutcomeKind.ConfirmedRejected => "PrepaidReleased", _ => "OutcomeUnknown" };
        db.CreditReservationEvents.Add(new CreditReservationEvent { Id = Guid.NewGuid(), ReservationId = reservation.Id, ItemId = item.Id, EvidenceId = outcome.Evidence.EvidenceId,
            CreditTransactionId = ledger?.Id, Sequence = sequence + 1, Kind = kind, OutstandingDelta = outcome.Kind == SubmissionOutcomeKind.ConfirmedSuccess || outcome.Kind == SubmissionOutcomeKind.ConfirmedRejected ? -item.MaximumSendCredits : 0,
            SettledDelta = settled, ReleasedDelta = outcome.Kind == SubmissionOutcomeKind.ConfirmedRejected ? item.MaximumSendCredits : 0,
            AttemptStateAfter = item.AttemptState, SettlementStateAfter = item.SettlementState, EvidenceCode = outcome.Evidence.Code,
            ClassifierVersion = outcome.Evidence.ClassifierVersion, ArtifactReference = outcome.Evidence.ArtifactReference, ArtifactSha256 = outcome.Evidence.ArtifactSha256,
            ObservedAt = outcome.Evidence.ObservedAt, ActorUserId = outcome.Evidence.ActorUserId, Reason = outcome.Evidence.Reason, CreatedAt = now });
        if (outcome.Kind == SubmissionOutcomeKind.ConfirmedSuccess)
            db.UsageLogs.Add(new UsageLog { Id = Guid.NewGuid(), UserId = reservation.UserId, ToolName = "FormAutomation", Action = "SubmitResponses", CreditsUsed = item.MaximumSendCredits,
                Status = "Success", Description = "Successful form submission.", SubmissionItemId = item.Id, CreatedAt = now });
        var log = await db.SubmissionLogs.SingleOrDefaultAsync(x => x.ItemId == item.Id, ct);
        if (log is null)
        {
            log = new SubmissionLog { Id = Guid.NewGuid(), ItemId = item.Id, JobId = item.JobId, ResponseId = item.ResponseId, PayloadJson = item.PayloadJson };
            db.SubmissionLogs.Add(log);
        }
        log.Status = outcome.Kind == SubmissionOutcomeKind.ConfirmedSuccess ? "Success" : "Failed";
        log.ErrorMessage = outcome.Kind == SubmissionOutcomeKind.ConfirmedSuccess ? "" : outcome.Evidence.Code;
        log.SubmittedAt = outcome.Kind == SubmissionOutcomeKind.ConfirmedSuccess ? now : null;
        if (outcome.Kind != SubmissionOutcomeKind.Unknown)
        {
            var responseProjection = await db.GeneratedResponses.SingleAsync(x => x.Id == item.ResponseId, ct);
            responseProjection.Status = outcome.Kind == SubmissionOutcomeKind.ConfirmedSuccess ? "Submitted" : "Failed";
        }
        if (item.MaximumSendCredits == 0 && outcome.Kind != SubmissionOutcomeKind.Unknown)
        {
            var response = await db.GeneratedResponses.SingleAsync(x => x.Id == item.ResponseId, ct);
            if (response.LegacyClaimItemId != item.Id || response.LegacyEntitlementState != "Claimed") throw new InvalidOperationException("Prepaid claim does not match.");
            response.LegacyEntitlementState = outcome.Kind == SubmissionOutcomeKind.ConfirmedSuccess ? "Consumed" : "Available";
            response.LegacyClaimItemId = null;
        }
        SubmissionItemMutation.Project(job, items, reservation);
        await db.SaveChangesAsync(ct);
        return await ResultAsync(item, ct);
    }

    private async Task<SubmissionSettlementResult> ResultAsync(SubmissionJobItem item, CancellationToken ct)
    {
        var reservation = await db.CreditReservations.SingleAsync(x => x.JobId == item.JobId, ct);
        var balance = await db.UserCreditAccounts.AsNoTracking().SingleOrDefaultAsync(x => x.UserId == reservation.UserId, ct);
        var reserved = await db.CreditReservations.AsNoTracking().Where(x => x.UserId == reservation.UserId && x.ClosedAt == null).SumAsync(x => (decimal?)x.OutstandingAmount, ct) ?? 0;
        var tx = await db.CreditTransactions.AsNoTracking().SingleOrDefaultAsync(x => x.Id == item.SettlementCreditTransactionId, ct);
        return new(item.Id, Enum.Parse<SubmissionAttemptState>(item.AttemptState), Enum.Parse<SubmissionSettlementState>(item.SettlementState), tx?.Id,
            tx is null ? 0 : 1, new(balance?.Balance ?? 0, reserved, (balance?.Balance ?? 0) - reserved));
    }

    private static void ValidateEvidence(VerifiedSubmissionOutcome outcome)
    {
        var e = outcome.Evidence;
        if (!Enum.IsDefined(outcome.Kind) || e.EvidenceId == Guid.Empty || string.IsNullOrWhiteSpace(e.Code) || e.Code.Length > 64 ||
            string.IsNullOrWhiteSpace(e.ClassifierVersion) || e.ClassifierVersion.Length > 32 || string.IsNullOrWhiteSpace(e.ArtifactReference) || e.ArtifactReference.Length > 512 ||
            e.ArtifactSha256.Length != 64 || e.ArtifactSha256.Any(c => c is not (>= '0' and <= '9') and not (>= 'a' and <= 'f')) ||
            e.ObservedAt == default || e.Reason?.Length > 1000 || (e.ActorUserId is not null && string.IsNullOrWhiteSpace(e.Reason)))
            throw new ArgumentException("Complete immutable submission evidence is required.");
    }

    private static bool Matches(CreditReservationEvent prior, VerifiedSubmissionOutcome outcome)
    {
        var e = outcome.Evidence;
        return prior.EvidenceCode == e.Code && prior.ClassifierVersion == e.ClassifierVersion && prior.ArtifactReference == e.ArtifactReference &&
            prior.ArtifactSha256 == e.ArtifactSha256 && prior.ObservedAt == e.ObservedAt && prior.ActorUserId == e.ActorUserId && prior.Reason == e.Reason &&
            prior.AttemptStateAfter == StateFor(outcome.Kind);
    }

    private static string StateFor(SubmissionOutcomeKind kind) => kind switch { SubmissionOutcomeKind.ConfirmedSuccess => "Succeeded", SubmissionOutcomeKind.ConfirmedRejected => "Rejected", _ => "Unknown" };
}
