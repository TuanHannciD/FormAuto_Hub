using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FormAutoHub.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class Phase6AiGenerationRuns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsReadOnly",
                table: "GeneratedResponses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "GeneratedResponses",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "Rule");

            migrationBuilder.CreateTable(
                name: "AiGenerationRuns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PromptProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Mode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Provider = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Model = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RequestedCount = table.Column<int>(type: "int", nullable: false),
                    GeneratedCount = table.Column<int>(type: "int", nullable: false),
                    Multiplier = table.Column<int>(type: "int", nullable: false),
                    CreditsUsed = table.Column<int>(type: "int", nullable: false),
                    RawProviderRequestJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RawProviderResponseJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PromptSnapshotJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    QuestionSnapshotJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ValidationSummaryJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ErrorMessage = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    StartedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    CompletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiGenerationRuns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AiGenerationRuns_AiPromptProfiles_PromptProfileId",
                        column: x => x.PromptProfileId,
                        principalTable: "AiPromptProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AiGenerationRuns_FormProjects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "FormProjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AiGenerationRunItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RunId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QuestionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    GeneratedResponseId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RawAnswerJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ValidationMessage = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiGenerationRunItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AiGenerationRunItems_AiGenerationRuns_RunId",
                        column: x => x.RunId,
                        principalTable: "AiGenerationRuns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AiGenerationRunItems_FormQuestions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "FormQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AiGenerationRunItems_GeneratedResponses_GeneratedResponseId",
                        column: x => x.GeneratedResponseId,
                        principalTable: "GeneratedResponses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AiGenerationRunItems_GeneratedResponseId",
                table: "AiGenerationRunItems",
                column: "GeneratedResponseId");

            migrationBuilder.CreateIndex(
                name: "IX_AiGenerationRunItems_QuestionId",
                table: "AiGenerationRunItems",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_AiGenerationRunItems_RunId",
                table: "AiGenerationRunItems",
                column: "RunId");

            migrationBuilder.CreateIndex(
                name: "IX_AiGenerationRuns_ProjectId_CreatedAt",
                table: "AiGenerationRuns",
                columns: new[] { "ProjectId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AiGenerationRuns_PromptProfileId",
                table: "AiGenerationRuns",
                column: "PromptProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_AiGenerationRuns_UserId_CreatedAt",
                table: "AiGenerationRuns",
                columns: new[] { "UserId", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AiGenerationRunItems");

            migrationBuilder.DropTable(
                name: "AiGenerationRuns");

            migrationBuilder.DropColumn(
                name: "IsReadOnly",
                table: "GeneratedResponses");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "GeneratedResponses");
        }
    }
}
