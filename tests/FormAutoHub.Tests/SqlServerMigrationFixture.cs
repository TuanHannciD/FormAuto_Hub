using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using FormAutoHub.DbCompatibility;

namespace FormAutoHub.Tests;

// Runtime owner alone provisions this exact disposable test DB and opts in.
// Tests never CREATE/DROP/restore databases or connect to FormAutoHub.
internal static class SqlServerMigrationFixture
{
    internal const string Database = "FormAutoHub_FAHERR001_safety_20261029_a19f7a2";

    internal static async Task<SqlConnection> OpenAsync()
    {
        var server = Environment.GetEnvironmentVariable("FORMAUTO_SQL_TEST_SERVER")
            ?? throw new InvalidOperationException("Runtime owner must opt in to SQL tests.");
        if (!new[] { ".", "localhost", Environment.MachineName }.Contains(server, StringComparer.OrdinalIgnoreCase) ||
            Environment.GetEnvironmentVariable("FORMAUTO_SQL_TEST_DATABASE") != Database)
            throw new InvalidOperationException("SQL tests require the exact owned safety clone on the local default instance.");
        var connection = new SqlConnection(new SqlConnectionStringBuilder { DataSource = server, InitialCatalog = Database,
            IntegratedSecurity = true, TrustServerCertificate = true, ConnectTimeout = 10,
            ApplicationName = "FormAutoHub.DbSync.SafetyTests" }.ConnectionString);
        try
        {
            await connection.OpenAsync();
            var identity = await CatalogReader.IdentityAsync(connection);
            if (identity.Database != Database || !identity.Server.Equals(Environment.MachineName, StringComparison.OrdinalIgnoreCase) ||
                !identity.Machine.Equals(Environment.MachineName, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("SQL safety clone identity mismatch.");
            return connection;
        }
        catch { await connection.DisposeAsync(); throw; }
    }

    internal static string UpSql()
    {
        using var context = TopupEvidenceSchemaMigrationTests.Context();
        var assembly = context.GetService<IMigrationsAssembly>();
        var migration = assembly.CreateMigration(assembly.Migrations[CompatibilityPolicy.PlannedMigration], "Microsoft.EntityFrameworkCore.SqlServer");
        return Assert.IsType<SqlOperation>(Assert.Single(migration.UpOperations)).Sql;
    }

    internal static async Task ExecuteAsync(SqlConnection connection, SqlTransaction? transaction, string sql)
    {
        await using var command = new SqlCommand(sql, connection, transaction) { CommandTimeout = 25 };
        await command.ExecuteNonQueryAsync();
    }

    internal static async Task<string> ScalarAsync(SqlConnection connection, SqlTransaction? transaction, string sql)
    {
        await using var command = new SqlCommand(sql, connection, transaction) { CommandTimeout = 25 };
        return Convert.ToString(await command.ExecuteScalarAsync(), System.Globalization.CultureInfo.InvariantCulture)!;
    }

    internal const string Widen = """
        ALTER TABLE dbo.TopupOrderEvidenceFiles ALTER COLUMN OriginalFileName nvarchar(max) NOT NULL;
        ALTER TABLE dbo.TopupOrderEvidenceFiles ALTER COLUMN ContentType nvarchar(max) NOT NULL;
        """;

    internal const string Lengths = """
        SELECT CONCAT(COL_LENGTH(N'dbo.TopupOrderEvidenceFiles', N'OriginalFileName'), ',',
                      COL_LENGTH(N'dbo.TopupOrderEvidenceFiles', N'ContentType'));
        """;
}

public sealed class OwnedSqlFactAttribute : FactAttribute
{
    public OwnedSqlFactAttribute()
    {
        if (Environment.GetEnvironmentVariable("FORMAUTO_SQL_TEST_SERVER") is null)
            Skip = "Not run: sole runtime owner must provision/authorize the exact SQL safety clone.";
    }
}

public sealed class OwnedSqlTheoryAttribute : TheoryAttribute
{
    public OwnedSqlTheoryAttribute()
    {
        if (Environment.GetEnvironmentVariable("FORMAUTO_SQL_TEST_SERVER") is null)
            Skip = "Not run: sole runtime owner must provision/authorize the exact SQL safety clone.";
    }
}
