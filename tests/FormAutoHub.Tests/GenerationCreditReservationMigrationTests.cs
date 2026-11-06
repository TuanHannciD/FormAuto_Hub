using FormAutoHub.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Microsoft.Data.SqlClient;

namespace FormAutoHub.Tests;

[Collection("Generation history SQL")]
public sealed class GenerationCreditReservationMigrationTests
{
    private const string User = "6ca5889b-4748-458f-a626-af009a300001";
    private const string Project = "6ca5889b-4748-458f-a626-af009a300002";
    private const string Response = "6ca5889b-4748-458f-a626-af009a300003";
    private const string Job = "6ca5889b-4748-458f-a626-af009a300004";

    [HistorySqlFact]
    public async Task PopulatedBaseline_PreflightRejectsDuplicateAndOrphan_ThenPreservesHistoricalRows()
    {
        Assert.Equal(GenerationHistorySqlFixture.BaselineDatabase, Environment.GetEnvironmentVariable("FAH_HISTORY_SQL_DATABASE"));
        await using var db = await GenerationHistorySqlFixture.OpenAsync();
        var applied = (await db.Database.GetAppliedMigrationsAsync()).ToList();
        var latest = db.Database.GetMigrations().Single(x => x.EndsWith("_GenerationHistoryAndReservations"));
        if (!applied.Contains(latest))
        {
            await db.GetService<IMigrator>().MigrateAsync(GenerationHistorySqlFixture.BaselineMigration);
            await db.Database.ExecuteSqlRawAsync($"""
                INSERT Users (Id,Email,FullName,Role,FailedLoginCount,CreatedAt) VALUES ('{User}','history-baseline@fixture.invalid','Baseline','User',0,SYSUTCDATETIME());
                INSERT FormProjects (Id,UserId,Name,FormUrl,FormTitle,FormActionUrl,Status,CreatedAt) VALUES ('{Project}','{User}','Historical','','','','Draft',SYSUTCDATETIME());
                INSERT UserCreditAccounts (Id,UserId,Balance,TotalDeposited,TotalUsed,UpdatedAt) VALUES (NEWID(),'{User}',9.75,10.75,1,SYSUTCDATETIME());
                INSERT GeneratedResponses (Id,ProjectId,PayloadJson,PreviewText,Source,Status,IsReadOnly,CreatedAt) VALUES ('{Response}','{Project}','[]','historical payload','Rule','Previewed',0,SYSUTCDATETIME());
                INSERT SubmissionJobs (Id,ProjectId,Total,SuccessCount,FailedCount,Status,RateLimitPerMinute,CreatedAt) VALUES ('{Job}','{Project}',1,0,1,'Failed',10,SYSUTCDATETIME());
                INSERT CreditTransactions (Id,UserId,Amount,BalanceAfter,Type,Description,ReferenceType,ReferenceId,CreatedAt) VALUES (NEWID(),'{User}',-1,9.75,'CreditUsed','historical ledger','GeneratedResponse','{Response}',SYSUTCDATETIME());
                INSERT UsageLogs (Id,UserId,ToolName,Action,CreditsUsed,Status,Description,ProjectId,CreatedAt) VALUES (NEWID(),'{User}','FormAutomation','Generate',1,'Success','historical usage','{Project}',SYSUTCDATETIME());
                INSERT SubmissionLogs (Id,JobId,ResponseId,PayloadJson,Status,ErrorMessage) VALUES (NEWID(),'{Job}','{Response}','[]','Failed','historical ambiguity');
                """);
            var migration = db.GetService<IMigrationsAssembly>().CreateMigration(db.GetService<IMigrationsAssembly>().Migrations[latest], db.Database.ProviderName!);
            var preflight = migration.UpOperations.OfType<SqlOperation>().First().Sql;
            await db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
            {
                await using var transaction = await db.Database.BeginTransactionAsync();
                await db.Database.ExecuteSqlRawAsync($"INSERT UserCreditAccounts (Id,UserId,Balance,TotalDeposited,TotalUsed,UpdatedAt) VALUES (NEWID(),'{User}',100,100,0,SYSUTCDATETIME())");
                var failure = await Assert.ThrowsAsync<SqlException>(() => db.Database.ExecuteSqlRawAsync(preflight));
                Assert.Equal(51000, failure.Number);
                await transaction.RollbackAsync();
            });
            await db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
            {
                await using var transaction = await db.Database.BeginTransactionAsync();
                await db.Database.ExecuteSqlRawAsync("INSERT FormProjects (Id,UserId,Name,FormUrl,FormTitle,FormActionUrl,Status,CreatedAt) VALUES (NEWID(),NEWID(),'orphan','','','','Draft',SYSUTCDATETIME())");
                var failure = await Assert.ThrowsAsync<SqlException>(() => db.Database.ExecuteSqlRawAsync(preflight));
                Assert.Equal(51001, failure.Number);
                await transaction.RollbackAsync();
            });
            await db.Database.MigrateAsync();
        }
        await db.Database.MigrateAsync();
        await using var read = await GenerationHistorySqlFixture.OpenAsync();
        var user = Guid.Parse(User);
        var account = await read.UserCreditAccounts.AsNoTracking().SingleAsync(x => x.UserId == user);
        Assert.Equal(9.75m, account.Balance); Assert.Equal(10.75m, account.TotalDeposited); Assert.Equal(1, account.TotalUsed);
        var ledger = Assert.Single(await read.CreditTransactions.AsNoTracking().Where(x => x.UserId == user).ToListAsync());
        Assert.Equal(-1, ledger.Amount); Assert.Equal(9.75m, ledger.BalanceAfter); Assert.Equal("historical ledger", ledger.Description);
        Assert.Equal(1, await read.UsageLogs.CountAsync(x => x.UserId == user && x.CreditsUsed == 1));
        var log = Assert.Single(await read.SubmissionLogs.Where(x => x.JobId == Guid.Parse(Job)).ToListAsync());
        Assert.Equal("Failed", log.Status); Assert.Equal("historical ambiguity", log.ErrorMessage); Assert.Null(log.ItemId);
        var response = await read.GeneratedResponses.SingleAsync(x => x.Id == Guid.Parse(Response));
        Assert.Null(response.GenerationBatchId); Assert.Null(response.PricingPolicy); Assert.Null(response.LegacyEntitlementState);
        Assert.Equal("historical payload", response.PreviewText);
        Assert.Empty(read.CreditReservations); Assert.Empty(read.CreditReservationEvents); Assert.Empty(read.SubmissionJobItems);
        Assert.Contains(latest, await read.Database.GetAppliedMigrationsAsync());
    }
}
