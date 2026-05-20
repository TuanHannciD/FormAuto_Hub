using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FormAutoHub.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class Phase8PayosPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PaymentProviderSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Provider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ClientId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EncryptedApiKey = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EncryptedChecksumKey = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReturnUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CancelUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
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
                    table.PrimaryKey("PK_PaymentProviderSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PaymentRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TopupOrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Provider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderOrderCode = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderPaymentLinkId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CheckoutUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProviderStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SignatureVerifiedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    CompletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LastWebhookAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    RawPayloadJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentRecords_TopupOrders_TopupOrderId",
                        column: x => x.TopupOrderId,
                        principalTable: "TopupOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PaymentProviderSettings_Provider",
                table: "PaymentProviderSettings",
                column: "Provider",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaymentRecords_Provider_ProviderOrderCode",
                table: "PaymentRecords",
                columns: new[] { "Provider", "ProviderOrderCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaymentRecords_Provider_ProviderPaymentLinkId",
                table: "PaymentRecords",
                columns: new[] { "Provider", "ProviderPaymentLinkId" },
                unique: true,
                filter: "[ProviderPaymentLinkId] <> ''");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentRecords_TopupOrderId",
                table: "PaymentRecords",
                column: "TopupOrderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PaymentProviderSettings");

            migrationBuilder.DropTable(
                name: "PaymentRecords");
        }
    }
}
