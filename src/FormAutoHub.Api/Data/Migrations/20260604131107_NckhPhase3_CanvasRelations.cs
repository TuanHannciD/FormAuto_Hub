using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FormAutoHub.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class NckhPhase3_CanvasRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ModelRelations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ModelId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FromVariableId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ToVariableId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Direction = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HypothesisCode = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    HypothesisText = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModelRelations", x => x.Id);
                    table.CheckConstraint("CK_ModelRelations_NoSelfRelation", "[FromVariableId] <> [ToVariableId]");
                    table.ForeignKey(
                        name: "FK_ModelRelations_ResearchModels_ModelId",
                        column: x => x.ModelId,
                        principalTable: "ResearchModels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ModelRelations_ResearchVariables_FromVariableId",
                        column: x => x.FromVariableId,
                        principalTable: "ResearchVariables",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ModelRelations_ResearchVariables_ToVariableId",
                        column: x => x.ToVariableId,
                        principalTable: "ResearchVariables",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "NodePositions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ModelId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NodeType = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    VariableId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RelationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PositionX = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    PositionY = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NodePositions", x => x.Id);
                    table.CheckConstraint("CK_NodePositions_ExactlyOneTarget", "(([VariableId] IS NOT NULL AND [RelationId] IS NULL) OR ([VariableId] IS NULL AND [RelationId] IS NOT NULL))");
                    table.ForeignKey(
                        name: "FK_NodePositions_ModelRelations_RelationId",
                        column: x => x.RelationId,
                        principalTable: "ModelRelations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NodePositions_ResearchModels_ModelId",
                        column: x => x.ModelId,
                        principalTable: "ResearchModels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_NodePositions_ResearchVariables_VariableId",
                        column: x => x.VariableId,
                        principalTable: "ResearchVariables",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ModelRelations_FromVariableId",
                table: "ModelRelations",
                column: "FromVariableId");

            migrationBuilder.CreateIndex(
                name: "IX_ModelRelations_ModelId_FromVariableId_ToVariableId",
                table: "ModelRelations",
                columns: new[] { "ModelId", "FromVariableId", "ToVariableId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ModelRelations_ModelId_HypothesisCode",
                table: "ModelRelations",
                columns: new[] { "ModelId", "HypothesisCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ModelRelations_ToVariableId",
                table: "ModelRelations",
                column: "ToVariableId");

            migrationBuilder.CreateIndex(
                name: "IX_NodePositions_ModelId_NodeType_RelationId",
                table: "NodePositions",
                columns: new[] { "ModelId", "NodeType", "RelationId" },
                unique: true,
                filter: "[RelationId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_NodePositions_ModelId_NodeType_VariableId",
                table: "NodePositions",
                columns: new[] { "ModelId", "NodeType", "VariableId" },
                unique: true,
                filter: "[VariableId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_NodePositions_RelationId",
                table: "NodePositions",
                column: "RelationId");

            migrationBuilder.CreateIndex(
                name: "IX_NodePositions_VariableId",
                table: "NodePositions",
                column: "VariableId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NodePositions");

            migrationBuilder.DropTable(
                name: "ModelRelations");
        }
    }
}
