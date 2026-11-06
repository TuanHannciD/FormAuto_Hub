namespace FormAutoHub.Api.Contracts;

public sealed record SubmissionCompatibilityResult(bool Compatible, string? RejectionCode,
    string ObservedMetadataJson, string CompatibilityEvidenceJson, string CompatibilityEvidenceSha256,
    DateTimeOffset CheckedAt);
