using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FormAutoHub.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class HardenHistoryNullableContractChecks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_SubmissionJobs_V2",
                table: "SubmissionJobs");

            migrationBuilder.DropCheckConstraint(
                name: "CK_GeneratedResponses_Entitlement",
                table: "GeneratedResponses");

            migrationBuilder.AddCheckConstraint(
                name: "CK_SubmissionJobs_V2",
                table: "SubmissionJobs",
                sql: "[ContractVersion] IS NULL OR ([ContractVersion]=2 AND [CommandId] IS NOT NULL AND [CommandId]=[Id] AND [UserId] IS NOT NULL AND [RequestFingerprint] IS NOT NULL AND [RouteKind] IS NOT NULL AND [RouteKind] IN ('selected','direct') AND [PricingPolicy] IS NOT NULL AND [PricingPolicy] IN ('SeparatedV1','LegacyBundledV1') AND [UnknownCount] IS NOT NULL AND [UnknownCount]>=0 AND [NotDispatchedCount] IS NOT NULL AND [NotDispatchedCount]>=0 AND [HeldCount] IS NOT NULL AND [HeldCount]>=0)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_GeneratedResponses_Entitlement",
                table: "GeneratedResponses",
                sql: "([PricingPolicy] IS NULL AND [LegacyEntitlementState] IS NULL AND [LegacyClaimItemId] IS NULL) OR ([PricingPolicy] IS NOT NULL AND [PricingPolicy]='SeparatedV1' AND [LegacyEntitlementState] IS NOT NULL AND [LegacyEntitlementState]='NotApplicable' AND [LegacyClaimItemId] IS NULL) OR ([PricingPolicy] IS NOT NULL AND [PricingPolicy]='LegacyBundledV1' AND [LegacyEntitlementState] IS NOT NULL AND (([LegacyEntitlementState] IN ('Available','Consumed') AND [LegacyClaimItemId] IS NULL) OR ([LegacyEntitlementState]='Claimed' AND [LegacyClaimItemId] IS NOT NULL) OR [LegacyEntitlementState]='ReconciliationRequired'))");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_SubmissionJobs_V2",
                table: "SubmissionJobs");

            migrationBuilder.DropCheckConstraint(
                name: "CK_GeneratedResponses_Entitlement",
                table: "GeneratedResponses");

            migrationBuilder.AddCheckConstraint(
                name: "CK_SubmissionJobs_V2",
                table: "SubmissionJobs",
                sql: "[ContractVersion] IS NULL OR ([ContractVersion]=2 AND [CommandId]=[Id] AND [UserId] IS NOT NULL AND [RequestFingerprint] IS NOT NULL AND [RouteKind] IN ('selected','direct') AND [PricingPolicy] IN ('SeparatedV1','LegacyBundledV1') AND [UnknownCount] IS NOT NULL AND [UnknownCount]>=0 AND [NotDispatchedCount] IS NOT NULL AND [NotDispatchedCount]>=0 AND [HeldCount] IS NOT NULL AND [HeldCount]>=0)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_GeneratedResponses_Entitlement",
                table: "GeneratedResponses",
                sql: "([PricingPolicy] IS NULL AND [LegacyEntitlementState] IS NULL AND [LegacyClaimItemId] IS NULL) OR ([PricingPolicy]='SeparatedV1' AND [LegacyEntitlementState] IS NOT NULL AND [LegacyEntitlementState]='NotApplicable' AND [LegacyClaimItemId] IS NULL) OR ([PricingPolicy]='LegacyBundledV1' AND [LegacyEntitlementState] IS NOT NULL AND (([LegacyEntitlementState] IN ('Available','Consumed') AND [LegacyClaimItemId] IS NULL) OR ([LegacyEntitlementState]='Claimed' AND [LegacyClaimItemId] IS NOT NULL) OR [LegacyEntitlementState]='ReconciliationRequired'))");
        }
    }
}
