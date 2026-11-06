using FormAutoHub.Api.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace FormAutoHub.Tests;

public sealed class HistorySqlFactAttribute : FactAttribute
{
    public HistorySqlFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("FAH_HISTORY_SQL_SERVER")))
            Skip = "Opt in with FAH_HISTORY_SQL_SERVER and exact owned FAH_HISTORY_SQL_DATABASE.";
    }
}

[CollectionDefinition("Generation history SQL", DisableParallelization = true)]
public sealed class GenerationHistorySqlCollection { }

internal static class GenerationHistorySqlFixture
{
    public const string SafetyDatabase = "FormAutoHub_History_Safety_20261104";
    public const string BaselineDatabase = "FormAutoHub_History_Baseline_20261105";
    public const string BaselineMigration = "20261029142938_NormalizeTopupEvidenceColumnLengths";

    public static async Task<FormAutoHubDbContext> OpenAsync(params IInterceptor[] interceptors)
    {
        var server = Environment.GetEnvironmentVariable("FAH_HISTORY_SQL_SERVER");
        var database = Environment.GetEnvironmentVariable("FAH_HISTORY_SQL_DATABASE");
        if (server != "localhost" || database is not (SafetyDatabase or BaselineDatabase))
            throw new InvalidOperationException("History SQL requires the exact authorized localhost test database.");
        var cs = new SqlConnectionStringBuilder { DataSource = server, InitialCatalog = database,
            IntegratedSecurity = true, TrustServerCertificate = true, ConnectTimeout = 10 }.ConnectionString;
        await using var connection = new SqlConnection(cs);
        await connection.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT CONVERT(nvarchar(128),SERVERPROPERTY('ServerName')),CONVERT(nvarchar(128),SERVERPROPERTY('MachineName')),DB_NAME()";
        await using var reader = await command.ExecuteReaderAsync();
        Assert.True(await reader.ReadAsync());
        Assert.Equal("DESKTOP-TS5JR7L", reader.GetString(0));
        Assert.Equal("DESKTOP-TS5JR7L", reader.GetString(1));
        Assert.Equal(database, reader.GetString(2));
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>().UseSqlServer(cs, x => x.EnableRetryOnFailure());
        options.AddInterceptors(interceptors);
        return new FormAutoHubDbContext(options.Options);
    }

    public static async Task<T> WriteAsync<T>(FormAutoHubDbContext db, Func<Task<T>> write)
    {
        return await db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync();
            var result = await write();
            await transaction.CommitAsync();
            return result;
        });
    }
}
