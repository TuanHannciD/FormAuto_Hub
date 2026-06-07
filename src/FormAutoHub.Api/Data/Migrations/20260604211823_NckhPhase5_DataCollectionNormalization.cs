using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FormAutoHub.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class NckhPhase5_DataCollectionNormalization : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DataCollectionLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ModelId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ResponsesCollected = table.Column<int>(type: "int", nullable: false),
                    ResponsesSkipped = table.Column<int>(type: "int", nullable: false),
                    ErrorMessage = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StartedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DataCollectionLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DataCollectionLogs_ResearchModels_ModelId",
                        column: x => x.ModelId,
                        principalTable: "ResearchModels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SurveyResponses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ModelId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GoogleResponseId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RespondentId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    RawDataJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ResponseTimestamp = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SurveyResponses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SurveyResponses_ResearchModels_ModelId",
                        column: x => x.ModelId,
                        principalTable: "ResearchModels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NormalizedDatasets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ModelId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SurveyResponseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RespondentId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    NormalizedDataJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsStale = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    NormalizedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NormalizedDatasets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NormalizedDatasets_ResearchModels_ModelId",
                        column: x => x.ModelId,
                        principalTable: "ResearchModels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NormalizedDatasets_SurveyResponses_SurveyResponseId",
                        column: x => x.SurveyResponseId,
                        principalTable: "SurveyResponses",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_DataCollectionLogs_ModelId_StartedAt",
                table: "DataCollectionLogs",
                columns: new[] { "ModelId", "StartedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_DataCollectionLogs_ModelId_Status",
                table: "DataCollectionLogs",
                columns: new[] { "ModelId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_NormalizedDatasets_ModelId_IsStale",
                table: "NormalizedDatasets",
                columns: new[] { "ModelId", "IsStale" });

            migrationBuilder.CreateIndex(
                name: "IX_NormalizedDatasets_ModelId_NormalizedAt",
                table: "NormalizedDatasets",
                columns: new[] { "ModelId", "NormalizedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_NormalizedDatasets_ModelId_RespondentId",
                table: "NormalizedDatasets",
                columns: new[] { "ModelId", "RespondentId" });

            migrationBuilder.CreateIndex(
                name: "IX_NormalizedDatasets_ModelId_SurveyResponseId",
                table: "NormalizedDatasets",
                columns: new[] { "ModelId", "SurveyResponseId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NormalizedDatasets_SurveyResponseId",
                table: "NormalizedDatasets",
                column: "SurveyResponseId");

            migrationBuilder.CreateIndex(
                name: "IX_SurveyResponses_ModelId_GoogleResponseId",
                table: "SurveyResponses",
                columns: new[] { "ModelId", "GoogleResponseId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SurveyResponses_ModelId_RespondentId",
                table: "SurveyResponses",
                columns: new[] { "ModelId", "RespondentId" });

            migrationBuilder.CreateIndex(
                name: "IX_SurveyResponses_ModelId_ResponseTimestamp",
                table: "SurveyResponses",
                columns: new[] { "ModelId", "ResponseTimestamp" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DataCollectionLogs");

            migrationBuilder.DropTable(
                name: "NormalizedDatasets");

            migrationBuilder.DropTable(
                name: "SurveyResponses");
        }
    }
}
