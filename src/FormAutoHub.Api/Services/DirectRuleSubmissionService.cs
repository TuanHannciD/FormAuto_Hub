using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;

namespace FormAutoHub.Api.Services;

public interface IDirectRuleSubmissionService
{
    Task<SubmissionJobResponse?> SendAsync(Guid projectId, DirectRuleSubmissionRequest request, CancellationToken cancellationToken);
}

public sealed class DirectRuleSubmissionService(FormAutoHubDbContext dbContext, ICurrentUserContext currentUser,
    ICreditService creditService, SubmissionService submissionService) : IDirectRuleSubmissionService
{
    public async Task<SubmissionJobResponse?> SendAsync(Guid projectId, DirectRuleSubmissionRequest request, CancellationToken cancellationToken)
    {
        if (!await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.AnyAsync(dbContext.FormProjects, x => x.Id == projectId && x.UserId == currentUser.UserId, cancellationToken)) return null;
        return await submissionService.SendDirectAsync(projectId, request, creditService, cancellationToken);
    }
}
