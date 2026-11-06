using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

// Caller owns the local transaction. Users is the serialization point even without an account.
internal static class CreditAccountLock
{
    public static async Task<UserCreditAccount?> AcquireAsync(FormAutoHubDbContext db, Guid userId, CancellationToken ct)
    {
        if (!db.Database.IsSqlServer())
            return await db.UserCreditAccounts.SingleOrDefaultAsync(x => x.UserId == userId, ct);
        if (db.ChangeTracker.Entries<User>().Any(x => x.Entity.Id == userId && x.State == EntityState.Added))
            return db.UserCreditAccounts.Local.SingleOrDefault(x => x.UserId == userId);
        if (db.Database.CurrentTransaction is null) throw new InvalidOperationException("Credit writes require a local transaction.");
        _ = await db.Users.FromSqlInterpolated($"SELECT * FROM [Users] WITH (UPDLOCK,HOLDLOCK) WHERE [Id]={userId}").AsNoTracking().SingleOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("Account owner does not exist.");
        var account = await db.UserCreditAccounts.FromSqlInterpolated($"SELECT * FROM [UserCreditAccounts] WITH (UPDLOCK,HOLDLOCK) WHERE [UserId]={userId}").SingleOrDefaultAsync(ct);
        if (account is not null && db.Entry(account).State == EntityState.Unchanged) await db.Entry(account).ReloadAsync(ct);
        return account;
    }

    public static async Task LockProjectAsync(FormAutoHubDbContext db, Guid userId, Guid projectId, CancellationToken ct)
    {
        var project = db.Database.IsSqlServer()
            ? await db.FormProjects.FromSqlInterpolated($"SELECT * FROM [FormProjects] WITH (UPDLOCK,HOLDLOCK) WHERE [Id]={projectId} AND [UserId]={userId}").SingleOrDefaultAsync(ct)
            : await db.FormProjects.SingleOrDefaultAsync(x => x.Id == projectId && x.UserId == userId, ct);
        if (project is null) throw new InvalidOperationException("Project is not owned by the account.");
    }
}
