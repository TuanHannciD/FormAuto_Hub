using System;
using FormAutoHub.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FormAutoHub.Api.Data.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(FormAutoHubDbContext))]
    [Migration("20260528090000_Phase6AiPromptProfiles")]
    public partial class Phase6AiPromptProfiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AiPromptProfiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Mode = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    AudienceJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GlobalPrompt = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiPromptProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AiPromptProfiles_FormProjects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "FormProjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AiQuestionPrompts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QuestionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Prompt = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UseAi = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiQuestionPrompts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AiQuestionPrompts_AiPromptProfiles_ProfileId",
                        column: x => x.ProfileId,
                        principalTable: "AiPromptProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AiQuestionPrompts_FormQuestions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "FormQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AiPromptProfiles_ProjectId_Mode",
                table: "AiPromptProfiles",
                columns: new[] { "ProjectId", "Mode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AiQuestionPrompts_ProfileId_QuestionId",
                table: "AiQuestionPrompts",
                columns: new[] { "ProfileId", "QuestionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AiQuestionPrompts_QuestionId",
                table: "AiQuestionPrompts",
                column: "QuestionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AiQuestionPrompts");

            migrationBuilder.DropTable(
                name: "AiPromptProfiles");
        }
    }
}
