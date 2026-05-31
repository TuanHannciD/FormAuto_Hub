using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FormAutoHub.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class NckhPhase1_FormsAndOAuth : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EncryptedAccessToken",
                table: "UserExternalLogins",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EncryptedRefreshToken",
                table: "UserExternalLogins",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Scopes",
                table: "UserExternalLogins",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "TokenExpiresAt",
                table: "UserExternalLogins",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "UpdatedAt",
                table: "UserExternalLogins",
                type: "datetimeoffset",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.CreateTable(
                name: "ResearchForms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GoogleFormId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FormUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ImportedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResearchForms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ResearchForms_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ResearchFormQuestions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FormId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GoogleQuestionId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    QuestionText = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    QuestionType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsRequired = table.Column<bool>(type: "bit", nullable: false),
                    OrderIndex = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResearchFormQuestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ResearchFormQuestions_ResearchForms_FormId",
                        column: x => x.FormId,
                        principalTable: "ResearchForms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ResearchFormQuestions_FormId_GoogleQuestionId",
                table: "ResearchFormQuestions",
                columns: new[] { "FormId", "GoogleQuestionId" });

            migrationBuilder.CreateIndex(
                name: "IX_ResearchFormQuestions_FormId_OrderIndex",
                table: "ResearchFormQuestions",
                columns: new[] { "FormId", "OrderIndex" });

            migrationBuilder.CreateIndex(
                name: "IX_ResearchForms_UserId_GoogleFormId",
                table: "ResearchForms",
                columns: new[] { "UserId", "GoogleFormId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ResearchForms_UserId_Status",
                table: "ResearchForms",
                columns: new[] { "UserId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ResearchFormQuestions");

            migrationBuilder.DropTable(
                name: "ResearchForms");

            migrationBuilder.DropColumn(
                name: "EncryptedAccessToken",
                table: "UserExternalLogins");

            migrationBuilder.DropColumn(
                name: "EncryptedRefreshToken",
                table: "UserExternalLogins");

            migrationBuilder.DropColumn(
                name: "Scopes",
                table: "UserExternalLogins");

            migrationBuilder.DropColumn(
                name: "TokenExpiresAt",
                table: "UserExternalLogins");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "UserExternalLogins");
        }
    }
}
