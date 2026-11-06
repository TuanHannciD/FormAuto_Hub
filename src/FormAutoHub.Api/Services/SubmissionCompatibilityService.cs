using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Integrations.GoogleForms;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface ISubmissionCompatibilityService
{
    Task<SubmissionCompatibilityResult> CheckAsync(Guid projectId, Guid? batchId, IReadOnlyList<Guid> responseIds, CancellationToken ct);
}

// The current public parser has no complete required/validation/receipt provenance.
// Fail closed without network I/O rather than representing inferred facts as evidence.
public sealed class SubmissionCompatibilityService(FormAutoHubDbContext db, ICurrentUserContext user) : ISubmissionCompatibilityService
{
    public async Task<SubmissionCompatibilityResult> CheckAsync(Guid projectId, Guid? batchId, IReadOnlyList<Guid> responseIds, CancellationToken ct)
    {
        var project = await db.FormProjects.AsNoTracking().SingleOrDefaultAsync(x => x.Id == projectId && x.UserId == user.UserId, ct);
        var validIdentity = project is not null && GoogleFormIdentity.TryNormalize(project.FormUrl, "viewform", out var form)
            && GoogleFormIdentity.TryNormalize(project.FormActionUrl, "formResponse", out var action)
            && action == form.Replace("/viewform", "/formResponse", StringComparison.Ordinal);
        return new(false, validIdentity ? "FormEvidenceUnavailable" : "FormIncompatible", "", "", "", DateTimeOffset.UtcNow);
    }
}
