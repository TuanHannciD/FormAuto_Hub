using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FormAutoHub.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeTopupEvidenceColumnLengths : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // EF's transaction owns the X lock through both ALTERs and the history insert.
            // DATALENGTH includes trailing spaces and counts supplementary UTF-16 storage.
            // SQL Server restores SET options when sp_executesql returns, including THROW.
            // Keep the timeout inside that scope; a nested EXEC used only to restore it
            // would itself restore the wrong setting on return. The EF transaction is shared.
            const string normalizationSql = """
                IF @@TRANCOUNT = 0
                    THROW 51000, 'Evidence normalization requires an existing migration transaction.', 1;
                IF NOT EXISTS (SELECT 1 FROM sys.tables
                               WHERE object_id = OBJECT_ID(N'dbo.TopupOrderEvidenceFiles', N'U')
                                 AND temporal_type = 0 AND is_memory_optimized = 0 AND is_filetable = 0)
                    THROW 51001, 'Expected ordinary dbo.TopupOrderEvidenceFiles table is missing or has an unexpected shape.', 1;

                SET LOCK_TIMEOUT 15000;
                DECLARE @LockedRows bigint;
                SELECT @LockedRows = COUNT_BIG(*)
                FROM [dbo].[TopupOrderEvidenceFiles] WITH (TABLOCKX, HOLDLOCK);

                IF (SELECT COUNT(*) FROM sys.columns AS c
                    WHERE c.object_id = OBJECT_ID(N'dbo.TopupOrderEvidenceFiles', N'U')
                      AND ((c.name = N'OriginalFileName' AND c.max_length IN (-1, 400))
                        OR (c.name = N'ContentType' AND c.max_length IN (-1, 100)))
                      AND c.system_type_id = TYPE_ID(N'nvarchar')
                      AND c.user_type_id = TYPE_ID(N'nvarchar')
                      AND c.is_nullable = 0 AND c.is_computed = 0 AND c.is_identity = 0
                      AND c.is_sparse = 0 AND c.is_column_set = 0 AND c.is_filestream = 0
                      AND c.is_hidden = 0 AND c.generated_always_type = 0
                      AND c.encryption_type IS NULL AND c.default_object_id = 0
                      AND c.rule_object_id = 0
                      AND c.collation_name = CONVERT(nvarchar(128), DATABASEPROPERTYEX(DB_NAME(), 'Collation'))) <> 2
                    THROW 51002, 'Unexpected evidence column shape or collation; no normalization was performed.', 1;

                IF EXISTS (SELECT 1 FROM [dbo].[TopupOrderEvidenceFiles]
                           WHERE DATALENGTH([OriginalFileName]) > 400 OR DATALENGTH([ContentType]) > 100)
                    THROW 51003, 'Evidence exceeds 400/100 UTF-16 bytes; preserve values and resolve before normalization.', 1;

                IF COL_LENGTH(N'dbo.TopupOrderEvidenceFiles', N'OriginalFileName') = -1
                    ALTER TABLE [dbo].[TopupOrderEvidenceFiles] ALTER COLUMN [OriginalFileName] nvarchar(200) NOT NULL;
                IF COL_LENGTH(N'dbo.TopupOrderEvidenceFiles', N'ContentType') = -1
                    ALTER TABLE [dbo].[TopupOrderEvidenceFiles] ALTER COLUMN [ContentType] nvarchar(50) NOT NULL;

                """;
            // Only this constant is quoted; no user input or identifier interpolation.
            migrationBuilder.Sql("EXEC sys.sp_executesql N'" + normalizationSql.Replace("'", "''", StringComparison.Ordinal) + "';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            throw new NotSupportedException(
                "Evidence length normalization is forward-only: the previous clean or legacy lengths cannot be inferred. " +
                "Use a reviewed forward repair or the verified backup recovery runbook; never replay legacy Down migrations.");
        }
    }
}
