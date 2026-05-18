using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
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

public sealed class SubmissionService(
    FormAutoHubDbContext dbContext,
    ICurrentUserContext currentUser,
    IGoogleFormsClient googleFormsClient) : ISubmissionService
{
    public async Task<SubmissionJobResponse?> SendAsync(
        Guid projectId,
        SendSubmissionRequest request,
        CancellationToken cancellationToken)
    {
        if (!request.Confirmed)
        {
            await WriteUsageLogAsync(projectId, UsageLogStatuses.Failed, "Submission requires explicit confirmation.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Submission requires explicit confirmation.");
        }

        if (request.ResponseIds.Count == 0)
        {
            await WriteUsageLogAsync(projectId, UsageLogStatuses.Failed, "Submission requires at least one preview response.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Submission requires at least one preview response.");
        }

        if (request.ResponseIds.Count > Phase4SafetyLimits.MaxSubmissionResponsesPerRequest)
        {
            await WriteUsageLogAsync(projectId, UsageLogStatuses.Failed, "Submission response count must not exceed 100.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Submission response count must not exceed 100.");
        }

        if (request.ResponseIds.Count != request.ResponseIds.Distinct().Count())
        {
            await WriteUsageLogAsync(projectId, UsageLogStatuses.Failed, "Duplicate response IDs are not allowed.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Duplicate response IDs are not allowed.");
        }

        var project = await dbContext.FormProjects
            .SingleOrDefaultAsync(item => item.Id == projectId && item.UserId == currentUser.UserId, cancellationToken);

        if (project is null)
        {
            return null;
        }

        var hasActiveJob = await dbContext.SubmissionJobs.AnyAsync(
            job => job.ProjectId == projectId &&
                (job.Status == SubmissionJobStatuses.Pending ||
                 job.Status == SubmissionJobStatuses.Running ||
                 job.Status == SubmissionJobStatuses.Paused),
            cancellationToken);

        if (hasActiveJob)
        {
            await WriteUsageLogAsync(projectId, UsageLogStatuses.Failed, "Project already has an active submission job.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Project already has an active submission job.");
        }

        var responses = await dbContext.GeneratedResponses
            .Where(response => response.ProjectId == projectId && request.ResponseIds.Contains(response.Id))
            .ToListAsync(cancellationToken);

        if (responses.Count != request.ResponseIds.Distinct().Count())
        {
            await WriteUsageLogAsync(projectId, UsageLogStatuses.Failed, "All submitted responses must belong to the project.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("All submitted responses must belong to the project.");
        }

        if (responses.Any(response => response.Status != GeneratedResponseStatuses.Previewed))
        {
            await WriteUsageLogAsync(projectId, UsageLogStatuses.Failed, "Only previewed responses can be submitted.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Only previewed responses can be submitted.");
        }

        var job = new SubmissionJob
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            Total = responses.Count,
            SuccessCount = 0,
            FailedCount = 0,
            Status = SubmissionJobStatuses.Running,
            RateLimitPerMinute = Phase4SafetyLimits.MaxSubmissionBatchSize,
            CreatedAt = DateTimeOffset.UtcNow,
            StartedAt = DateTimeOffset.UtcNow
        };
        dbContext.SubmissionJobs.Add(job);
        await dbContext.SaveChangesAsync(cancellationToken);

        var logs = new List<SubmissionLog>();
        foreach (var batch in responses.Chunk(Phase4SafetyLimits.MaxSubmissionBatchSize))
        {
            foreach (var response in batch)
            {
                IReadOnlyList<GeneratedAnswerResponse> answers;
                try
                {
                    answers = JsonSerializer.Deserialize<IReadOnlyList<GeneratedAnswerResponse>>(response.PayloadJson)
                        ?? Array.Empty<GeneratedAnswerResponse>();
                }
                catch (JsonException)
                {
                    await WriteUsageLogAsync(projectId, UsageLogStatuses.Failed, "Generated response payload is invalid.", cancellationToken);
                    await dbContext.SaveChangesAsync(cancellationToken);
                    throw new InvalidOperationException("Generated response payload is invalid.");
                }

                if (answers.Count == 0 || answers.Any(answer => string.IsNullOrWhiteSpace(answer.EntryId)))
                {
                    await WriteUsageLogAsync(projectId, UsageLogStatuses.Failed, "Generated response payload is missing required entry IDs.", cancellationToken);
                    await dbContext.SaveChangesAsync(cancellationToken);
                    throw new InvalidOperationException("Generated response payload is missing required entry IDs.");
                }

                var payload = answers.ToDictionary(answer => answer.EntryId, answer => answer.Values);
                var submitResult = await googleFormsClient.SubmitAsync(project.FormActionUrl, payload, cancellationToken);

                var log = new SubmissionLog
                {
                    Id = Guid.NewGuid(),
                    JobId = job.Id,
                    ResponseId = response.Id,
                    PayloadJson = response.PayloadJson,
                    Status = submitResult.Success ? SubmissionLogStatuses.Success : SubmissionLogStatuses.Failed,
                    ErrorMessage = submitResult.ErrorMessage,
                    SubmittedAt = DateTimeOffset.UtcNow
                };

                if (submitResult.Success)
                {
                    response.Status = GeneratedResponseStatuses.Submitted;
                    job.SuccessCount++;
                }
                else
                {
                    response.Status = GeneratedResponseStatuses.Failed;
                    job.FailedCount++;
                }

                logs.Add(log);
                dbContext.SubmissionLogs.Add(log);
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            await dbContext.Entry(job).ReloadAsync(cancellationToken);
            if (job.Status is SubmissionJobStatuses.Paused or SubmissionJobStatuses.Cancelled)
            {
                break;
            }
        }

        if (job.Status == SubmissionJobStatuses.Running)
        {
            job.Status = job.FailedCount == 0 ? SubmissionJobStatuses.Completed : SubmissionJobStatuses.Failed;
            job.FinishedAt = DateTimeOffset.UtcNow;
        }

        await WriteUsageLogAsync(
            projectId,
            job.Status == SubmissionJobStatuses.Completed ? UsageLogStatuses.Success : UsageLogStatuses.Failed,
            "Confirmed preview responses submitted.",
            cancellationToken);
        AuditLogWriter.Add(dbContext, currentUser.UserId, "SubmitResponses", nameof(SubmissionJob), job.Id, new
        {
            projectId,
            total = job.Total,
            successCount = job.SuccessCount,
            failedCount = job.FailedCount
        });
        await dbContext.SaveChangesAsync(cancellationToken);

        return job.ToResponse(logs);
    }

    public async Task<SubmissionJobResponse?> GetJobAsync(Guid projectId, Guid jobId, CancellationToken cancellationToken)
    {
        var ownsProject = await dbContext.FormProjects
            .AnyAsync(project => project.Id == projectId && project.UserId == currentUser.UserId, cancellationToken);

        if (!ownsProject)
        {
            return null;
        }

        var job = await dbContext.SubmissionJobs
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == jobId && item.ProjectId == projectId, cancellationToken);

        if (job is null)
        {
            return null;
        }

        var logs = await dbContext.SubmissionLogs
            .AsNoTracking()
            .Where(log => log.JobId == jobId)
            .ToListAsync(cancellationToken);

        return job.ToResponse(logs);
    }

    public async Task<SubmissionJobResponse?> PauseAsync(Guid projectId, Guid jobId, CancellationToken cancellationToken)
    {
        var ownsProject = await dbContext.FormProjects
            .AnyAsync(project => project.Id == projectId && project.UserId == currentUser.UserId, cancellationToken);

        if (!ownsProject)
        {
            return null;
        }

        var job = await dbContext.SubmissionJobs
            .SingleOrDefaultAsync(item => item.Id == jobId && item.ProjectId == projectId, cancellationToken);

        if (job is null || job.Status is not (SubmissionJobStatuses.Pending or SubmissionJobStatuses.Running))
        {
            return null;
        }

        job.Status = SubmissionJobStatuses.Paused;
        await dbContext.SaveChangesAsync(cancellationToken);

        var logs = await dbContext.SubmissionLogs
            .AsNoTracking()
            .Where(log => log.JobId == jobId)
            .ToListAsync(cancellationToken);

        return job.ToResponse(logs);
    }

    public async Task<SubmissionJobResponse?> CancelAsync(Guid projectId, Guid jobId, CancellationToken cancellationToken)
    {
        var ownsProject = await dbContext.FormProjects
            .AnyAsync(project => project.Id == projectId && project.UserId == currentUser.UserId, cancellationToken);

        if (!ownsProject)
        {
            return null;
        }

        var job = await dbContext.SubmissionJobs
            .SingleOrDefaultAsync(item => item.Id == jobId && item.ProjectId == projectId, cancellationToken);

        if (job is null || job.Status is SubmissionJobStatuses.Completed or SubmissionJobStatuses.Failed or SubmissionJobStatuses.Cancelled)
        {
            return null;
        }

        job.Status = SubmissionJobStatuses.Cancelled;
        job.FinishedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        var logs = await dbContext.SubmissionLogs
            .AsNoTracking()
            .Where(log => log.JobId == jobId)
            .ToListAsync(cancellationToken);

        return job.ToResponse(logs);
    }

    private Task WriteUsageLogAsync(Guid projectId, string status, string description, CancellationToken cancellationToken)
    {
        dbContext.UsageLogs.Add(new UsageLog
        {
            Id = Guid.NewGuid(),
            UserId = currentUser.UserId,
            ToolName = "FormAutomation",
            Action = "SubmitResponses",
            CreditsUsed = 0,
            Status = status,
            Description = description,
            ProjectId = projectId,
            CreatedAt = DateTimeOffset.UtcNow
        });

        return Task.CompletedTask;
    }
}
