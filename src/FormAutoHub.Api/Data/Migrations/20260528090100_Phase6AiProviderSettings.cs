using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FormAutoHub.Api.Data.Migrations
{
    /// <inheritdoc />
    [Microsoft.EntityFrameworkCore.Infrastructure.DbContext(typeof(FormAutoHubDbContext))]
    [Migration("20260528090100_Phase6AiProviderSettings")]
    public partial class Phase6AiProviderSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AiProviderSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Provider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EncryptedApiKey = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BaseUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DefaultModel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AllowedModelsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    LastCheckedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LastCheckStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastCheckMessage = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiProviderSettings", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AiProviderSettings_Provider",
                table: "AiProviderSettings",
                column: "Provider",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AiProviderSettings");
        }
    }
}
