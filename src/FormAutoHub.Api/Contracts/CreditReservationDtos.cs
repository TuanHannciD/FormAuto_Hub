namespace FormAutoHub.Api.Contracts;

public sealed record CreditAvailabilityResponse(decimal Balance, decimal Reserved, decimal Available);
public enum SubmissionOutcomeKind { ConfirmedSuccess, ConfirmedRejected, Unknown }
public enum SubmissionAttemptState { Planned, PossibleDispatch, Unknown, Succeeded, Rejected, NotDispatched }
public enum SubmissionSettlementState { Held, Settled, Released, PrepaidHeld, PrepaidConsumed, PrepaidReleased }
public sealed record SubmissionEvidence(Guid EvidenceId, string Code, string ClassifierVersion,
    string ArtifactReference, string ArtifactSha256, DateTimeOffset ObservedAt, Guid? ActorUserId, string? Reason);
public sealed record VerifiedSubmissionOutcome(SubmissionOutcomeKind Kind, SubmissionEvidence Evidence);
public sealed record CreditReservationResult(Guid ReservationId, decimal InitialAmount, decimal OutstandingAmount, CreditAvailabilityResponse Credits);
public sealed record SubmissionSettlementResult(Guid ItemId, SubmissionAttemptState AttemptState,
    SubmissionSettlementState SettlementState, Guid? CreditTransactionId, int SettledCredits, CreditAvailabilityResponse Credits);
