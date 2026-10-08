using System.Data;
using FormAutoHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

internal static class CreditWriteTransaction
{
    public static async Task<T> RunAsync<T>(FormAutoHubDbContext db, Func<Task<T>> write, CancellationToken ct)
    {
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
