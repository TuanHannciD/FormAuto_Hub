using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FormAutoHub.Api.Data.Migrations;

public partial class ManualCreditFlow : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Adopt evidence already installed by the old Phase10ManualCreditOperations checkout.
        migrationBuilder.Sql("""
            IF OBJECT_ID(N'dbo.TopupOrderEvidenceFiles', N'U') IS NULL
            BEGIN
                CREATE TABLE [dbo].[TopupOrderEvidenceFiles] (
                    [Id] uniqueidentifier NOT NULL CONSTRAINT [PK_TopupOrderEvidenceFiles] PRIMARY KEY,
                    [UserId] uniqueidentifier NOT NULL,
                    [TopupOrderId] uniqueidentifier NULL,
                    [OriginalFileName] nvarchar(200) NOT NULL,
                    [ContentType] nvarchar(50) NOT NULL,
                    [Length] bigint NOT NULL,
                    [Content] varbinary(max) NOT NULL,
                    [CreatedAt] datetimeoffset NOT NULL
                );
            END;
            IF COL_LENGTH(N'dbo.TopupOrders', N'EvidenceFileId') IS NULL
                ALTER TABLE [dbo].[TopupOrders] ADD [EvidenceFileId] uniqueidentifier NULL;
            IF COL_LENGTH(N'dbo.TopupOrders', N'RowVersion') IS NULL
                ALTER TABLE [dbo].[TopupOrders] ADD [RowVersion] rowversion NOT NULL;
            IF COL_LENGTH(N'dbo.UserCreditAccounts', N'RowVersion') IS NULL
                ALTER TABLE [dbo].[UserCreditAccounts] ADD [RowVersion] rowversion NOT NULL;
            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.TopupOrders') AND name=N'IX_TopupOrders_EvidenceFileId')
                CREATE INDEX [IX_TopupOrders_EvidenceFileId] ON [dbo].[TopupOrders] ([EvidenceFileId]);
            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.TopupOrderEvidenceFiles') AND name=N'IX_TopupOrderEvidenceFiles_UserId')
                CREATE INDEX [IX_TopupOrderEvidenceFiles_UserId] ON [dbo].[TopupOrderEvidenceFiles] ([UserId]);
            IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id=OBJECT_ID(N'dbo.TopupOrders') AND name=N'FK_TopupOrders_TopupOrderEvidenceFiles_EvidenceFileId')
                ALTER TABLE [dbo].[TopupOrders] ADD CONSTRAINT [FK_TopupOrders_TopupOrderEvidenceFiles_EvidenceFileId]
                FOREIGN KEY ([EvidenceFileId]) REFERENCES [dbo].[TopupOrderEvidenceFiles] ([Id]);
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Keep evidence and links on rollback: they may predate this migration.
        migrationBuilder.Sql("""
            IF COL_LENGTH(N'dbo.TopupOrders', N'RowVersion') IS NOT NULL
                ALTER TABLE [dbo].[TopupOrders] DROP COLUMN [RowVersion];
            IF COL_LENGTH(N'dbo.UserCreditAccounts', N'RowVersion') IS NOT NULL
                ALTER TABLE [dbo].[UserCreditAccounts] DROP COLUMN [RowVersion];
            """);
    }
}
