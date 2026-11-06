using System.Data;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace FormAutoHub.Api.Services;

internal static class CreditWriteTransaction
{
    // Capture prepared local output once; retry SQL persistence without replaying its provider.
    public static async Task<T> RunStagedAsync<T>(FormAutoHubDbContext db, Guid userId,
        Func<FormAutoHubDbContext, CancellationToken, Task<(bool Exists, T Result)>> readCommitted, Func<Task<T>> write, CancellationToken ct)
    {
        if (db.Database.CurrentTransaction is not null) return await write();
        var staged = db.ChangeTracker.Entries().Where(e => e.Entity is not UserCreditAccount and not User)
            .Select(e => (e.Entity, e.State, Values: e.CurrentValues.Clone())).ToArray();
        var attempt = 0;
        try
        {
            return await db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
            {
                if (attempt++ > 0) db.ChangeTracker.Clear();
                await using var transaction = db.Database.IsRelational()
                    ? await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct) : null;
                await CreditAccountLock.AcquireAsync(db, userId, ct);
                var committed = await readCommitted(db, ct);
                if (committed.Exists)
                {
                    db.ChangeTracker.Clear();
                    if (transaction is not null) await transaction.CommitAsync(ct);
                    return committed.Result;
                }
                if (attempt > 1)
                    foreach (var saved in staged)
                    {
                        var entry = db.Entry(saved.Entity);
                        entry.CurrentValues.SetValues(saved.Values);
                        entry.State = saved.State;
                    }
                var result = await write();
                if (transaction is not null) await transaction.CommitAsync(ct);
                return result;
            });
        }
        catch (Exception) when (db.Database.IsRelational())
        {
            // A nontransient lost acknowledgement also needs durable observation, never provider replay.
            // Use a fresh context after disposing the failed transaction, independent of caller cancellation.
            db.ChangeTracker.Clear();
            var options = (DbContextOptions<FormAutoHubDbContext>)db.GetService<IDbContextOptions>();
            await using var fresh = new FormAutoHubDbContext(options);
            using var diagnostic = new CancellationTokenSource(TimeSpan.FromSeconds(10));
            var observed = await RunAsync(fresh, async () =>
            {
                await CreditAccountLock.AcquireAsync(fresh, userId, diagnostic.Token);
                return await readCommitted(fresh, diagnostic.Token);
            }, diagnostic.Token);
            if (observed.Exists) return observed.Result;
            throw;
        }
    }

    public static async Task<T> RunAsync<T>(FormAutoHubDbContext db, Func<Task<T>> write, CancellationToken ct)
    {
        if (db.Database.CurrentTransaction is not null) return await write();
        var attempt = 0;
        return await db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            // A retry must re-read persisted state, including row versions and a possibly committed ledger.
            if (attempt++ > 0) db.ChangeTracker.Clear();
            await using var transaction = db.Database.IsRelational()
                ? await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct) : null;
            var result = await write();
            if (transaction is not null) await transaction.CommitAsync(ct);
            return result;
        });
    }
}
