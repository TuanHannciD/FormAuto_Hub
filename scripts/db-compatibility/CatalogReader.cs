using System.Data;
using Microsoft.Data.SqlClient;

namespace FormAutoHub.DbCompatibility;

public static class CatalogReader
{
    public static async Task<(long Names, long ContentTypes)> OversizeCountsAsync(SqlConnection connection)
    {
        await using var command = new SqlCommand("""
            SELECT COUNT_BIG(CASE WHEN DATALENGTH(OriginalFileName) > 400 THEN 1 END),
                   COUNT_BIG(CASE WHEN DATALENGTH(ContentType) > 100 THEN 1 END)
            FROM dbo.TopupOrderEvidenceFiles;
            """, connection) { CommandTimeout = 30 };
        await using var reader = await command.ExecuteReaderAsync(CommandBehavior.SingleRow);
        if (!await reader.ReadAsync()) throw new InvalidOperationException("Evidence size aggregate missing.");
        return (reader.GetInt64(0), reader.GetInt64(1));
    }

    public static async Task<CatalogObject[]> ReadAsync(SqlConnection connection, SqlTransaction? transaction = null)
    {
        using var stream = typeof(CatalogReader).Assembly.GetManifestResourceStream("DbCompatibilityProbe.catalog.sql")
            ?? throw new InvalidOperationException("Embedded catalog query missing.");
        using var text = new StreamReader(stream);
        await using var command = new SqlCommand(await text.ReadToEndAsync(), connection, transaction) { CommandTimeout = 30 };
        await using var reader = await command.ExecuteReaderAsync();
        List<CatalogObject> result = [];
        while (await reader.ReadAsync()) result.Add(new(reader.GetString(0), reader.GetString(1)));
        return [.. result];
    }

    public static async Task<(string Server, string Database, string Machine, string Collation)> IdentityAsync(SqlConnection connection)
    {
        await using var command = new SqlCommand("""
            SELECT CONVERT(nvarchar(128), SERVERPROPERTY('ServerName')), DB_NAME(),
                   CONVERT(nvarchar(128), SERVERPROPERTY('MachineName')),
                   CONVERT(nvarchar(128), DATABASEPROPERTYEX(DB_NAME(), 'Collation'));
            """, connection) { CommandTimeout = 15 };
        await using var reader = await command.ExecuteReaderAsync(CommandBehavior.SingleRow);
        if (!await reader.ReadAsync()) throw new InvalidOperationException("Target identity missing.");
        return (reader.GetString(0), reader.GetString(1), reader.GetString(2), reader.GetString(3));
    }
}
