using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface IDirectRuleSubmissionService
{
    Task<SubmissionJobResponse?> SendAsync(Guid projectId, DirectRuleSubmissionRequest request, CancellationToken cancellationToken);
}

public sealed class DirectRuleSubmissionService(
    FormAutoHubDbContext dbContext,
    ICurrentUserContext currentUser,
    ICreditService creditService,
    SubmissionService submissionService) : IDirectRuleSubmissionService
{
    public async Task<SubmissionJobResponse?> SendAsync(
        Guid projectId, DirectRuleSubmissionRequest request, CancellationToken cancellationToken)
    {
        // Authorize before validation/audit so an unowned project never produces activity for its owner.
        if (!await dbContext.FormProjects.AsNoTracking().AnyAsync(
                project => project.Id == projectId && project.UserId == currentUser.UserId, cancellationToken))
            return null;

        SubmissionAdmission.Result? admission;
        try
        {
            if (request.CommandId == Guid.Empty)
                throw new InvalidOperationException("CommandId must not be empty.");
            if (request.Count is < 1 or > Phase4SafetyLimits.MaxSubmissionResponsesPerRequest)
                throw new InvalidOperationException("Submission response count must be between 1 and 100.");

            admission = await SubmissionAdmission.RunAsync(dbContext, currentUser.UserId, projectId, request.CommandId, async _ =>
            {
                // Uses existing rule validation, generation, partial-credit and dedicated credit-service semantics.
                // All its saves are enclosed by the admission transaction; the job and debit commit together.
                var generated = await new ResponseGenerationService(dbContext, currentUser, creditService)
                    .GenerateForSubmissionAsync(projectId, request.Count, request.CommandId, cancellationToken);
                var ids = generated!.Items.Select(x => x.Id).ToArray();
                return await dbContext.GeneratedResponses.Where(x => ids.Contains(x.Id)).OrderBy(x => x.CreatedAt).ToListAsync(cancellationToken);
            }, cancellationToken);
        }
        catch (InvalidOperationException exception)
        {
            // Admission has disposed its transaction. Discard every rolled-back tracked change before auditing.
            dbContext.ChangeTracker.Clear();
            if (!await dbContext.FormProjects.AsNoTracking().AnyAsync(
                    project => project.Id == projectId && project.UserId == currentUser.UserId, cancellationToken))
                return null;

            dbContext.UsageLogs.Add(new UsageLog
            {
                Id = Guid.NewGuid(), UserId = currentUser.UserId, ProjectId = projectId,
                ToolName = "FormAutomation", Action = "SubmitResponses", CreditsUsed = 0,
                Status = UsageLogStatuses.Failed, Description = exception.Message, CreatedAt = DateTimeOffset.UtcNow
            });
            await dbContext.SaveChangesAsync(cancellationToken);
            throw;
        }

        if (admission is null) return null;
        if (!admission.Run) return await SubmissionAdmission.ReadAsync(dbContext, admission, cancellationToken);
        // Deliberately outside EF's execution strategy and the database transaction.
        return await submissionService.RunAsync(admission.Project, admission.Job, admission.Responses, cancellationToken);
    }
}
