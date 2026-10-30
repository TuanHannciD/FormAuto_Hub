using System.Data;
using System.Diagnostics;
using FormAutoHub.DbCompatibility;
using Microsoft.Data.SqlClient;
using static FormAutoHub.Tests.SqlServerMigrationFixture;

namespace FormAutoHub.Tests;

[CollectionDefinition("Owned SQL normalization", DisableParallelization = true)]
public sealed class OwnedSqlNormalizationCollection;

[Collection("Owned SQL normalization")]
public sealed class TopupEvidenceSqlServerTests
{
    [OwnedSqlFact]
    public async Task LegacyMaxColumns_PreserveUnicodeTrailingSpacesAndBinary_AndRepeatUp()
    {
        await using var connection = await OpenAsync();
        var beforeCatalog = await CatalogReader.ReadAsync(connection);
        await using (var transaction = (SqlTransaction)await connection.BeginTransactionAsync())
        {
            await ExecuteAsync(connection, transaction, Widen);
            await ExecuteAsync(connection, transaction, """
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.TopupOrderEvidenceFiles') AND name=N'IX_TopupOrderEvidenceFiles_TopupOrderId')
                    CREATE UNIQUE INDEX IX_TopupOrderEvidenceFiles_TopupOrderId ON dbo.TopupOrderEvidenceFiles (TopupOrderId) WHERE TopupOrderId IS NOT NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.TopupOrderEvidenceFiles') AND name=N'IX_TopupOrderEvidenceFiles_UserId_TopupOrderId')
                    CREATE INDEX IX_TopupOrderEvidenceFiles_UserId_TopupOrderId ON dbo.TopupOrderEvidenceFiles (UserId,TopupOrderId);
                """);
            var legacyCatalog = await CatalogReader.ReadAsync(connection, transaction);
            var name = string.Concat(Enumerable.Repeat("😀", 99)) + "x "; // exactly 400 bytes
            var mime = new string('ộ', 49) + " "; // exactly 100 bytes, trailing space preserved
            var id = Guid.NewGuid();
            await InsertAsync(connection, transaction, id, name, mime);
            var emojiId = Guid.NewGuid();
            var emojiName = string.Concat(Enumerable.Repeat("😀", 100));
            var emojiMime = string.Concat(Enumerable.Repeat("😀", 25));
            await InsertAsync(connection, transaction, emojiId, emojiName, emojiMime);
            await ExecuteAsync(connection, transaction, UpSql());
            await ExecuteAsync(connection, transaction, UpSql());
            Assert.Equal("400,100", await ScalarAsync(connection, transaction, Lengths));
            var afterCatalog = await CatalogReader.ReadAsync(connection, transaction);
            var policy = CompatibilityPolicy.Evaluate("pre-sync", [CompatibilityPolicy.PlannedMigration], [],
                [CompatibilityPolicy.PlannedMigration], false, afterCatalog, legacyCatalog);
            Assert.Empty(policy.Blocking); // only the two exact max shapes may differ; indexes/FKs/rowversions must match
            Assert.Equal(2, policy.RawDifferences.Length);
            await using var read = new SqlCommand("SELECT OriginalFileName,ContentType,Content FROM dbo.TopupOrderEvidenceFiles WHERE Id=@id", connection, transaction);
            read.Parameters.AddWithValue("@id", id);
            await using var rows = await read.ExecuteReaderAsync();
            Assert.True(await rows.ReadAsync());
            Assert.Equal(name, rows.GetString(0));
            Assert.Equal(mime, rows.GetString(1));
            Assert.Equal(new byte[] { 0, 255, 65, 0 }, (byte[])rows[2]);
            await rows.DisposeAsync();
            await using var emojiRead = new SqlCommand("SELECT OriginalFileName,ContentType FROM dbo.TopupOrderEvidenceFiles WHERE Id=@id", connection, transaction);
            emojiRead.Parameters.AddWithValue("@id", emojiId);
            await using var emojiRows = await emojiRead.ExecuteReaderAsync();
            Assert.True(await emojiRows.ReadAsync());
            Assert.Equal(emojiName, emojiRows.GetString(0));
            Assert.Equal(emojiMime, emojiRows.GetString(1));
            await emojiRows.DisposeAsync();
            await transaction.RollbackAsync();
        }
        Assert.Equal(beforeCatalog, await CatalogReader.ReadAsync(connection));
    }

    [OwnedSqlTheory]
    [InlineData("name201")]
    [InlineData("nameTrailing")]
    [InlineData("nameEmoji")]
    [InlineData("mime51")]
    [InlineData("mimeTrailing")]
    [InlineData("mimeEmoji")]
    public async Task Oversize_ThrowsBeforeEitherAlter_AndRollbackPreservesBaseline(string scenario)
    {
        await using var connection = await OpenAsync();
        var before = await CatalogReader.ReadAsync(connection);
        await using (var transaction = (SqlTransaction)await connection.BeginTransactionAsync())
        {
            await ExecuteAsync(connection, transaction, Widen);
            var name = scenario switch { "name201" => new string('ộ', 201), "nameTrailing" => new string('a', 200) + " ",
                "nameEmoji" => string.Concat(Enumerable.Repeat("😀", 101)), _ => "safe.png" };
            var mime = scenario switch { "mime51" => new string('ộ', 51), "mimeTrailing" => new string('a', 50) + " ",
                "mimeEmoji" => string.Concat(Enumerable.Repeat("😀", 26)), _ => "image/png" };
            await InsertAsync(connection, transaction, Guid.NewGuid(), name, mime);
            var error = await Assert.ThrowsAsync<SqlException>(() => ExecuteAsync(connection, transaction, UpSql()));
            Assert.Equal(51003, error.Number);
            Assert.Equal("-1,-1", await ScalarAsync(connection, transaction, Lengths));
            await transaction.RollbackAsync();
        }
        Assert.Equal(before, await CatalogReader.ReadAsync(connection));
    }

    [OwnedSqlTheory]
    [InlineData("varchar(max) NOT NULL")]
    [InlineData("nvarchar(max) NULL")]
    [InlineData("nvarchar(201) NOT NULL")]
    [InlineData("nvarchar(max) COLLATE Latin1_General_100_BIN2 NOT NULL")]
    public async Task UnexpectedShape_RejectsBeforeOtherColumnAlter(string shape)
    {
        await using var connection = await OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync();
        await ExecuteAsync(connection, transaction, Widen);
        // The only interpolation is one of the four literal InlineData shapes above.
        await ExecuteAsync(connection, transaction, "ALTER TABLE dbo.TopupOrderEvidenceFiles ALTER COLUMN OriginalFileName " + shape);
        var error = await Assert.ThrowsAsync<SqlException>(() => ExecuteAsync(connection, transaction, UpSql()));
        Assert.Equal(51002, error.Number);
        Assert.Equal("-1", await ScalarAsync(connection, transaction, "SELECT COL_LENGTH(N'dbo.TopupOrderEvidenceFiles',N'ContentType')"));
        await transaction.RollbackAsync();
    }

    [OwnedSqlFact]
    public async Task WithoutTransaction_FailsBeforeSchemaChange()
    {
        await using var connection = await OpenAsync();
        var before = await CatalogReader.ReadAsync(connection);
        var error = await Assert.ThrowsAsync<SqlException>(() => ExecuteAsync(connection, null, UpSql()));
        Assert.Equal(51000, error.Number);
        Assert.Equal(before, await CatalogReader.ReadAsync(connection));
    }

    [OwnedSqlTheory]
    [InlineData(-1)]
    [InlineData(0)]
    [InlineData(4321)]
    public async Task LockTimeoutScope_RestoresCallerAfterSuccess_AndOriginalThrow(int timeout)
    {
        await using var connection = await OpenAsync();
        var before = await CatalogReader.ReadAsync(connection);
        await using (var transaction = (SqlTransaction)await connection.BeginTransactionAsync())
        {
            // The SET, Up and observation share one caller batch: no connection reset can
            // hide a leaked setting. Inputs are three literal timeout values above.
            var caller = "SET LOCK_TIMEOUT " + timeout.ToString(System.Globalization.CultureInfo.InvariantCulture) +
                "; DECLARE @BeforeTimeout int = @@LOCK_TIMEOUT; ";
            Assert.Equal($"{timeout},{timeout}", await ScalarAsync(connection, transaction,
                caller + UpSql() + " SELECT CONCAT(@BeforeTimeout, ',', @@LOCK_TIMEOUT);"));

            await ExecuteAsync(connection, transaction, Widen);
            await InsertAsync(connection, transaction, Guid.NewGuid(), new string('a', 201), "image/png");
            var originalError = await ScalarAsync(connection, transaction, caller +
                "BEGIN TRY " + UpSql() + """
                    THROW 51010, 'Expected oversize rejection was absent.', 1;
                END TRY
                BEGIN CATCH
                    IF ERROR_NUMBER() <> 51003 THROW;
                    IF @@LOCK_TIMEOUT <> @BeforeTimeout
                        THROW 51011, 'Normalization leaked its lock timeout into the caller.', 1;
                    SELECT CONCAT(ERROR_NUMBER(), ',', ERROR_STATE(), ',', @@LOCK_TIMEOUT, ',', ERROR_MESSAGE());
                END CATCH;
                """);
            Assert.Equal($"51003,1,{timeout},Evidence exceeds 400/100 UTF-16 bytes; preserve values and resolve before normalization.", originalError);
            Assert.Equal("-1,-1", await ScalarAsync(connection, transaction, Lengths));
            await transaction.RollbackAsync();
        }
        // Restore catalog proof is independent of the rolled back transaction.
        Assert.Equal(before, await CatalogReader.ReadAsync(connection));
    }

    [OwnedSqlFact]
    public async Task Writer_IsBlockedUntilNormalizationTransactionCommits_ThenOversizeRejected()
    {
        await using var connection = await OpenAsync();
        Assert.Equal("400,100", await ScalarAsync(connection, null, Lengths));
        await using var writer = await OpenAsync();
        await using var observer = await OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync();
        await ExecuteAsync(connection, transaction, Widen);
        await ExecuteAsync(connection, transaction, UpSql());
        var writerSession = await ScalarAsync(writer, null, "SELECT @@SPID");
        var ownerSession = await ScalarAsync(connection, transaction, "SELECT @@SPID");
        var write = InsertAsync(writer, null, Guid.NewGuid(), new string('a', 201), "image/png");
        var timer = Stopwatch.StartNew();
        var blocked = false;
        while (timer.Elapsed < TimeSpan.FromSeconds(8))
        {
            // SPIDs originate from SQL numeric scalar results; no user interpolation.
            blocked = await ScalarAsync(observer, null,
                $"SELECT COUNT(*) FROM sys.dm_exec_requests WHERE session_id={writerSession} AND blocking_session_id={ownerSession}") == "1";
            if (blocked || write.IsCompleted) break;
            await Task.Delay(25); // bounded DMV observation, not a timing-only synchronization assertion
        }
        if (!blocked)
        {
            await transaction.RollbackAsync();
            try { await write; } catch (SqlException) { /* report below; release own outstanding command */ }
            Assert.Fail("Writer blocking was not observed via sys.dm_exec_requests.");
        }
        await transaction.CommitAsync();
        var error = await Assert.ThrowsAsync<SqlException>(() => write);
        Assert.Contains(error.Number, new[] { 2628, 8152 });
        Assert.Equal("400,100", await ScalarAsync(observer, null, Lengths));
    }

    private static async Task InsertAsync(SqlConnection connection, SqlTransaction? transaction, Guid id, string name, string mime)
    {
        await using var command = new SqlCommand("""
            INSERT INTO dbo.TopupOrderEvidenceFiles (Id,UserId,TopupOrderId,OriginalFileName,ContentType,Length,Content,CreatedAt)
            VALUES (@id,@user,NULL,@name,@mime,4,0x00FF4100,SYSDATETIMEOFFSET());
            """, connection, transaction) { CommandTimeout = 15 };
        command.Parameters.AddWithValue("@id", id);
        command.Parameters.AddWithValue("@user", Guid.NewGuid());
        command.Parameters.Add("@name", SqlDbType.NVarChar, -1).Value = name;
        command.Parameters.Add("@mime", SqlDbType.NVarChar, -1).Value = mime;
        await command.ExecuteNonQueryAsync();
    }
}
