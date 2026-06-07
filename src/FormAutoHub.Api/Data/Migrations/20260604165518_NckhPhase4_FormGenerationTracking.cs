using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FormAutoHub.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class NckhPhase4_FormGenerationTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "GeneratedFromModelId",
                table: "ResearchForms",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GenerationSource",
                table: "ResearchForms",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "Imported");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LastGeneratedAt",
                table: "ResearchForms",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LastSyncedAt",
                table: "ResearchForms",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ResearchForms_GeneratedFromModelId",
                table: "ResearchForms",
                column: "GeneratedFromModelId");

            migrationBuilder.CreateIndex(
                name: "IX_ResearchForms_UserId_GeneratedFromModelId",
                table: "ResearchForms",
                columns: new[] { "UserId", "GeneratedFromModelId" });

            migrationBuilder.AddForeignKey(
                name: "FK_ResearchForms_ResearchModels_GeneratedFromModelId",
                table: "ResearchForms",
                column: "GeneratedFromModelId",
                principalTable: "ResearchModels",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ResearchForms_ResearchModels_GeneratedFromModelId",
                table: "ResearchForms");

            migrationBuilder.DropIndex(
                name: "IX_ResearchForms_GeneratedFromModelId",
                table: "ResearchForms");

            migrationBuilder.DropIndex(
                name: "IX_ResearchForms_UserId_GeneratedFromModelId",
                table: "ResearchForms");

            migrationBuilder.DropColumn(
                name: "GeneratedFromModelId",
                table: "ResearchForms");

            migrationBuilder.DropColumn(
                name: "GenerationSource",
                table: "ResearchForms");

            migrationBuilder.DropColumn(
                name: "LastGeneratedAt",
                table: "ResearchForms");

            migrationBuilder.DropColumn(
                name: "LastSyncedAt",
                table: "ResearchForms");
        }
    }
}
