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

        SubmissionAdmission.Result? admission;
        try
        {
            admission = await SubmissionAdmission.RunAsync(dbContext, currentUser.UserId, projectId, Guid.NewGuid(), async _ =>
            {
                var responses = await dbContext.GeneratedResponses
                    .Where(response => response.ProjectId == projectId && request.ResponseIds.Contains(response.Id))
                    .ToListAsync(cancellationToken);

                if (responses.Count != request.ResponseIds.Distinct().Count())
                {
                    throw new InvalidOperationException("All submitted responses must belong to the project.");
                }

                if (responses.Any(response => response.Status != GeneratedResponseStatuses.Previewed))
                {
                    throw new InvalidOperationException("Only previewed responses can be submitted.");
                }

                if (await dbContext.SubmissionLogs.AnyAsync(log => request.ResponseIds.Contains(log.ResponseId), cancellationToken))
                {
                    throw new InvalidOperationException("Responses with a recorded submission attempt cannot be sent again.");
                }

                return responses;
            }, cancellationToken);
        }
        catch (InvalidOperationException exception)
        {
            dbContext.ChangeTracker.Clear();
            await WriteUsageLogAsync(projectId, UsageLogStatuses.Failed, exception.Message, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            throw;
        }
        if (admission is null) return null;
        if (!admission.Run) return await SubmissionAdmission.ReadAsync(dbContext, admission, cancellationToken);
        return await RunAsync(admission.Project, admission.Job, admission.Responses, cancellationToken);
    }

    internal async Task<SubmissionJobResponse> RunAsync(
        FormProject project, SubmissionJob job, IReadOnlyList<GeneratedResponse> responses, CancellationToken cancellationToken)
    {
        var projectId = project.Id;
        var logs = new List<SubmissionLog>();
        SubmissionLog? pendingAttempt = null;
        UsageLog? completionUsage = null;
        var providerInvoked = false;
        try
        {
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
                    catch (JsonException exception)
                    {
                        throw new InvalidOperationException("Generated response payload is invalid.", exception);
                    }

                    if (answers.Count == 0 || answers.Any(answer => string.IsNullOrWhiteSpace(answer.EntryId)))
                    {
                        throw new InvalidOperationException("Generated response payload is missing required entry IDs.");
                    }

                    var payload = answers.ToDictionary(answer => answer.EntryId, answer => answer.Values);
                    cancellationToken.ThrowIfCancellationRequested();
                    var log = new SubmissionLog
                    {
                        Id = Guid.NewGuid(),
                        JobId = job.Id,
                        ResponseId = response.Id,
                        PayloadJson = response.PayloadJson,
                        // Failed describes an unfinished local attempt, not a confirmed remote rejection.
                        Status = SubmissionLogStatuses.Failed,
                        ErrorMessage = "Kết quả gửi chưa xác định. Không tự động gửi lại; hãy kiểm tra kết quả trên Google Forms."
                    };
                    logs.Add(log);
                    dbContext.SubmissionLogs.Add(log);
                    pendingAttempt = log;
                    providerInvoked = false;
                    await dbContext.SaveChangesAsync(cancellationToken);

                    providerInvoked = true;
                    var submitResult = await googleFormsClient.SubmitAsync(project.FormActionUrl, payload, cancellationToken);
                    log.Status = submitResult.Success ? SubmissionLogStatuses.Success : SubmissionLogStatuses.Failed;
                    log.ErrorMessage = submitResult.ErrorMessage;
                    log.SubmittedAt = DateTimeOffset.UtcNow;

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

                    // Preserve a returned result before attempting another external send, even after request cancellation.
                    await SaveOutcomeAsync();
                    pendingAttempt = null;
                }

                await dbContext.SaveChangesAsync(cancellationToken);
                await dbContext.Entry(job).ReloadAsync(cancellationToken);
                if (job.Status is SubmissionJobStatuses.Paused or SubmissionJobStatuses.Cancelled)
                {
                    break;
                }
            }

            await FinalizeJobAsync(job, interrupted: false, cancellationToken);

            completionUsage = await WriteUsageLogAsync(
                projectId,
                job.Status == SubmissionJobStatuses.Completed ? UsageLogStatuses.Success : UsageLogStatuses.Failed,
                DescribeOutcome(job),
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
        catch (Exception exception)
        {
            exception.Data["SubmissionJobId"] = job.Id;
            exception.Data["ProjectId"] = projectId;
            if (pendingAttempt is not null)
            {
                exception.Data["SubmissionLogId"] = pendingAttempt.Id;
                exception.Data["ResponseId"] = pendingAttempt.ResponseId;
                if (!providerInvoked)
                {
                    pendingAttempt.ErrorMessage = "Lượt gửi chưa thực hiện vì không ghi nhận được lần gửi trước khi gọi Google Forms.";
                }
            }

            var description =
                $"Gửi form bị gián đoạn: đã xác nhận {job.SuccessCount} thành công, {job.FailedCount} thất bại. " +
                (providerInvoked && pendingAttempt is not null && pendingAttempt.SubmittedAt is null
                    ? "Kết quả lượt gửi cuối chưa xác định; hãy kiểm tra Google Forms trước khi gửi lại."
                    : "Hãy kiểm tra kết quả đã ghi nhận trước khi gửi lại.");
            if (completionUsage is null)
            {
                await WriteUsageLogAsync(projectId, UsageLogStatuses.Failed, description, CancellationToken.None);
            }
            else
            {
                // The completion save failed; update its tracked row rather than add a contradictory second outcome.
                completionUsage.Status = UsageLogStatuses.Failed;
                completionUsage.Description = description;
            }
            try
            {
                // The runner has stopped; acknowledge cancellation without replacing it.
                using var finalizationTimeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
                await FinalizeJobAsync(job, interrupted: true, finalizationTimeout.Token);
                await SaveOutcomeAsync();
            }
            catch (Exception persistenceException)
            {
                throw new AggregateException("Submission interrupted and its final diagnostic record could not be saved.", exception, persistenceException);
            }

            throw;
        }
    }

    private async Task FinalizeJobAsync(SubmissionJob job, bool interrupted, CancellationToken ct)
    {
        var terminalStatus = interrupted || job.FailedCount > 0 ? SubmissionJobStatuses.Failed : SubmissionJobStatuses.Completed;
        var finishedAt = DateTimeOffset.UtcNow;
        if (dbContext.Database.IsRelational())
        {
            // Compare-and-set closes the race with Pause/Cancel after the last batch reload.
            await dbContext.SubmissionJobs.Where(x => x.Id == job.Id &&
                (x.Status == SubmissionJobStatuses.Running || (interrupted && x.Status == SubmissionJobStatuses.Completed)))
                .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.Status, terminalStatus)
                    .SetProperty(x => x.FinishedAt, finishedAt), ct);
            await dbContext.SubmissionJobs.Where(x => x.Id == job.Id && x.Status == SubmissionJobStatuses.Cancelled && x.FinishedAt == null)
                .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.FinishedAt, finishedAt), ct);
        }

        var persisted = await dbContext.SubmissionJobs.AsNoTracking().SingleAsync(x => x.Id == job.Id, ct);
        if (dbContext.Database.IsRelational())
        {
            // Keep unsaved confirmed counts if a prior outcome save failed, while avoiding a stale status write.
            var entry = dbContext.Entry(job);
            entry.Property(x => x.Status).CurrentValue = persisted.Status;
            entry.Property(x => x.Status).OriginalValue = persisted.Status;
            entry.Property(x => x.Status).IsModified = false;
            entry.Property(x => x.FinishedAt).CurrentValue = persisted.FinishedAt;
            entry.Property(x => x.FinishedAt).OriginalValue = persisted.FinishedAt;
            entry.Property(x => x.FinishedAt).IsModified = false;
        }
        else
        {
            job.Status = persisted.Status is SubmissionJobStatuses.Paused or SubmissionJobStatuses.Cancelled ? persisted.Status : terminalStatus;
            if (job.Status != SubmissionJobStatuses.Paused) job.FinishedAt = finishedAt;
        }
    }

    private async Task SaveOutcomeAsync()
    {
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        await dbContext.SaveChangesAsync(timeout.Token);
    }

    private static string DescribeOutcome(SubmissionJob job)
    {
        var outcome = job.Status switch
        {
            SubmissionJobStatuses.Completed => "Gửi form thành công",
            SubmissionJobStatuses.Paused => "Đã tạm dừng gửi form",
            SubmissionJobStatuses.Cancelled => "Đã hủy gửi form",
            _ when job.SuccessCount > 0 => "Gửi form hoàn tất một phần",
            _ => "Gửi form thất bại"
        };
        return $"{outcome}: {job.SuccessCount} thành công, {job.FailedCount} thất bại trên tổng {job.Total} câu trả lời.";
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

        if (dbContext.Database.IsRelational())
        {
            var changed = await dbContext.SubmissionJobs.Where(x => x.Id == jobId && x.ProjectId == projectId &&
                    (x.Status == SubmissionJobStatuses.Pending || x.Status == SubmissionJobStatuses.Running))
                .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.Status, SubmissionJobStatuses.Paused), cancellationToken);
            if (changed == 0) return null;
            await dbContext.Entry(job).ReloadAsync(cancellationToken);
        }
        else
        {
            job.Status = SubmissionJobStatuses.Paused;
            await dbContext.SaveChangesAsync(cancellationToken);
        }

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

        // Running/paused may still have a batch in flight. Only its runner can acknowledge cancellation.
        if (dbContext.Database.IsRelational())
        {
            var changed = await dbContext.SubmissionJobs.Where(x => x.Id == jobId && x.ProjectId == projectId &&
                    (x.Status == SubmissionJobStatuses.Pending || x.Status == SubmissionJobStatuses.Running || x.Status == SubmissionJobStatuses.Paused))
                .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.Status, SubmissionJobStatuses.Cancelled)
                    .SetProperty(x => x.FinishedAt, (DateTimeOffset?)null), cancellationToken);
            if (changed == 0) return null;
            await dbContext.Entry(job).ReloadAsync(cancellationToken);
        }
        else
        {
            job.Status = SubmissionJobStatuses.Cancelled;
            job.FinishedAt = null;
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        var logs = await dbContext.SubmissionLogs
            .AsNoTracking()
            .Where(log => log.JobId == jobId)
            .ToListAsync(cancellationToken);

        return job.ToResponse(logs);
    }

    private Task<UsageLog> WriteUsageLogAsync(Guid projectId, string status, string description, CancellationToken cancellationToken)
    {
        var log = new UsageLog
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
        };
        dbContext.UsageLogs.Add(log);

        return Task.FromResult(log);
    }
}
