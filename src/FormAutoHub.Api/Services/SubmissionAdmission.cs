using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace FormAutoHub.Api.Services;

// Only local database work belongs here. A retried admission must never invoke a provider.
internal static class SubmissionAdmission
{
    internal sealed record Result(FormProject Project, SubmissionJob Job, IReadOnlyList<GeneratedResponse> Responses, bool Run);

    public static async Task<Result?> RunAsync(
        FormAutoHubDbContext db, Guid userId, Guid projectId, Guid jobId,
        Func<FormProject, Task<IReadOnlyList<GeneratedResponse>>> prepare, CancellationToken ct)
    {
        var attempt = 0;
        try
        {
            return await db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
            {
                for (var concurrencyAttempt = 0; ; concurrencyAttempt++)
                {
                    if (attempt++ > 0) db.ChangeTracker.Clear();
                    await using var transaction = db.Database.IsRelational()
                        ? await db.Database.BeginTransactionAsync(ct) : null;
                    try
                    {
                        // SQL Server holds this project row until the complete admission commits.
                        // The common send route and direct route use exactly the same lock.
                        var projects = db.Database.IsSqlServer()
                            ? db.FormProjects.FromSqlInterpolated($"SELECT * FROM [FormProjects] WITH (UPDLOCK, HOLDLOCK) WHERE [Id] = {projectId} AND [UserId] = {userId}")
                            : db.FormProjects.Where(x => x.Id == projectId && x.UserId == userId);
                        var project = await projects.SingleOrDefaultAsync(ct);
                        if (project is null) return null;

                        var existing = await db.SubmissionJobs.AsNoTracking().SingleOrDefaultAsync(x => x.Id == jobId, ct);
                        if (existing is not null)
                            return existing.ProjectId == projectId ? new Result(project, existing, [], false) : null;

                        if (await db.SubmissionJobs.AnyAsync(x => x.ProjectId == projectId &&
                            (x.Status == SubmissionJobStatuses.Pending || x.Status == SubmissionJobStatuses.Running ||
                             x.Status == SubmissionJobStatuses.Paused ||
                             (x.Status == SubmissionJobStatuses.Cancelled && x.FinishedAt == null)), ct))
                            throw new InvalidOperationException("Project already has an active submission job.");

                        var responses = await prepare(project);
                        var job = new SubmissionJob
                        {
                            Id = jobId, ProjectId = projectId, Total = responses.Count,
                            Status = SubmissionJobStatuses.Running,
                            RateLimitPerMinute = Phase4SafetyLimits.MaxSubmissionBatchSize,
                            CreatedAt = DateTimeOffset.UtcNow, StartedAt = DateTimeOffset.UtcNow
                        };
                        db.SubmissionJobs.Add(job);
                        await db.SaveChangesAsync(ct);
                        if (transaction is not null) await transaction.CommitAsync(ct);
                        return new Result(project, job, responses, true);
                    }
                    catch (DbUpdateConcurrencyException) when (concurrencyAttempt < 2)
                    {
                        // Another project may spend the same account. Roll back and re-read its RowVersion.
                        if (transaction is not null) await transaction.RollbackAsync(CancellationToken.None);
                    }
                }
            });
        }
        catch (Exception) when (db.Database.IsRelational())
        {
            // Commit acknowledgement can be lost; use a NEW context to observe durable state.
            // A proven commit is read-only here: never take over an uncertain runner.
            var options = (DbContextOptions<FormAutoHubDbContext>)db.GetService<IDbContextOptions>();
            await using var fresh = new FormAutoHubDbContext(options);
            var project = await fresh.FormProjects.AsNoTracking().SingleOrDefaultAsync(x => x.Id == projectId && x.UserId == userId, CancellationToken.None);
            var job = project is null ? null : await fresh.SubmissionJobs.AsNoTracking().SingleOrDefaultAsync(x => x.Id == jobId, CancellationToken.None);
            if (job is not null)
                return job.ProjectId == projectId ? new Result(project!, job, [], false) : null;
            throw;
        }
    }

    public static async Task<SubmissionJobResponse> ReadAsync(FormAutoHubDbContext db, Result result, CancellationToken ct)
    {
        var logs = await db.SubmissionLogs.AsNoTracking().Where(x => x.JobId == result.Job.Id).ToListAsync(ct);
        return result.Job.ToResponse(logs);
    }
}
