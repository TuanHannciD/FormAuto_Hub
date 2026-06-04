using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FormAutoHub.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class NckhPhase2_PersistenceFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ResearchModels",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FormId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResearchModels", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ResearchModels_ResearchForms_FormId",
                        column: x => x.FormId,
                        principalTable: "ResearchForms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ResearchModels_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ResearchVariables",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ModelId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    VariableType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ScaleType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ScalePoint = table.Column<int>(type: "int", nullable: true),
                    MinValue = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    MaxValue = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResearchVariables", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ResearchVariables_ResearchModels_ModelId",
                        column: x => x.ModelId,
                        principalTable: "ResearchModels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ObservedQuestionMappings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VariableId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FormQuestionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ObservedCode = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ObservedQuestionMappings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ObservedQuestionMappings_ResearchFormQuestions_FormQuestionId",
                        column: x => x.FormQuestionId,
                        principalTable: "ResearchFormQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ObservedQuestionMappings_ResearchVariables_VariableId",
                        column: x => x.VariableId,
                        principalTable: "ResearchVariables",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ObservedQuestionMappings_FormQuestionId",
                table: "ObservedQuestionMappings",
                column: "FormQuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_ObservedQuestionMappings_VariableId_FormQuestionId",
                table: "ObservedQuestionMappings",
                columns: new[] { "VariableId", "FormQuestionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ObservedQuestionMappings_VariableId_ObservedCode",
                table: "ObservedQuestionMappings",
                columns: new[] { "VariableId", "ObservedCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ResearchModels_FormId",
                table: "ResearchModels",
                column: "FormId",
                unique: true,
                filter: "[Status] = 'Active'");

            migrationBuilder.CreateIndex(
                name: "IX_ResearchModels_FormId_Status",
                table: "ResearchModels",
                columns: new[] { "FormId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ResearchModels_UserId_Status",
                table: "ResearchModels",
                columns: new[] { "UserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ResearchVariables_ModelId_Code",
                table: "ResearchVariables",
                columns: new[] { "ModelId", "Code" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ObservedQuestionMappings");

            migrationBuilder.DropTable(
                name: "ResearchVariables");

            migrationBuilder.DropTable(
                name: "ResearchModels");
        }
    }
}
