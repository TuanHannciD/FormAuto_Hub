using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FormAutoHub.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class GenerationHistoryAndReservations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Fail closed; historical rows are never repaired, merged or deleted by this migration.
            migrationBuilder.Sql("""
                IF EXISTS (SELECT UserId FROM UserCreditAccounts GROUP BY UserId HAVING COUNT(*)>1)
                    THROW 51000, 'History preflight: duplicate credit account owner.', 1;
                IF EXISTS (SELECT 1 FROM UserCreditAccounts a LEFT JOIN Users u ON u.Id=a.UserId WHERE u.Id IS NULL)
                   OR EXISTS (SELECT 1 FROM FormProjects p LEFT JOIN Users u ON u.Id=p.UserId WHERE u.Id IS NULL)
                   OR EXISTS (SELECT 1 FROM GeneratedResponses r LEFT JOIN FormProjects p ON p.Id=r.ProjectId WHERE p.Id IS NULL)
                   OR EXISTS (SELECT 1 FROM SubmissionJobs j LEFT JOIN FormProjects p ON p.Id=j.ProjectId WHERE p.Id IS NULL)
                   OR EXISTS (SELECT 1 FROM CreditTransactions c LEFT JOIN Users u ON u.Id=c.UserId WHERE u.Id IS NULL)
                   OR EXISTS (SELECT 1 FROM SubmissionLogs l LEFT JOIN SubmissionJobs j ON j.Id=l.JobId LEFT JOIN GeneratedResponses r ON r.Id=l.ResponseId WHERE j.Id IS NULL OR r.Id IS NULL OR j.ProjectId<>r.ProjectId)
                   OR EXISTS (SELECT 1 FROM UsageLogs l LEFT JOIN Users u ON u.Id=l.UserId LEFT JOIN FormProjects p ON p.Id=l.ProjectId WHERE u.Id IS NULL OR (l.ProjectId IS NOT NULL AND (p.Id IS NULL OR p.UserId<>l.UserId)))
                    THROW 51001, 'History preflight: orphan or inconsistent historical owner/project.', 1;
                """);
            migrationBuilder.AddColumn<Guid>(
                name: "SubmissionItemId",
                table: "UsageLogs",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ItemId",
                table: "SubmissionLogs",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CommandId",
                table: "SubmissionJobs",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ContractVersion",
                table: "SubmissionJobs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "GenerationBatchId",
                table: "SubmissionJobs",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "HeldCount",
                table: "SubmissionJobs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NotDispatchedCount",
                table: "SubmissionJobs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PricingPolicy",
                table: "SubmissionJobs",
                type: "varchar(24)",
                unicode: false,
                maxLength: 24,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequestFingerprint",
                table: "SubmissionJobs",
                type: "char(64)",
                nullable: true,
                collation: "Latin1_General_100_BIN2");

            migrationBuilder.AddColumn<string>(
                name: "RouteKind",
                table: "SubmissionJobs",
                type: "varchar(16)",
                unicode: false,
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "SubmissionJobs",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "RunnerAcknowledgedAt",
                table: "SubmissionJobs",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UnknownCount",
                table: "SubmissionJobs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "SubmissionJobs",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BatchOrdinal",
                table: "GeneratedResponses",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "GenerationBatchId",
                table: "GeneratedResponses",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "LegacyClaimItemId",
                table: "GeneratedResponses",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LegacyEntitlementState",
                table: "GeneratedResponses",
                type: "varchar(24)",
                unicode: false,
                maxLength: 24,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LegacyEvidenceReference",
                table: "GeneratedResponses",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PricingPolicy",
                table: "GeneratedResponses",
                type: "varchar(24)",
                unicode: false,
                maxLength: 24,
                nullable: true);

            migrationBuilder.AddUniqueConstraint(
                name: "AK_SubmissionJobs_Id_ProjectId",
                table: "SubmissionJobs",
                columns: new[] { "Id", "ProjectId" });

            migrationBuilder.AddUniqueConstraint(
                name: "AK_GeneratedResponses_Id_ProjectId",
                table: "GeneratedResponses",
                columns: new[] { "Id", "ProjectId" });

            migrationBuilder.AddUniqueConstraint(
                name: "AK_FormProjects_Id_UserId",
                table: "FormProjects",
                columns: new[] { "Id", "UserId" });

            migrationBuilder.CreateTable(
                name: "CreditReservations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    JobId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InitialAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    OutstandingAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    SettledAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ReleasedAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ClosedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CreditReservations", x => x.Id);
                    table.CheckConstraint("CK_CreditReservations_Amounts", "[InitialAmount]>=0 AND [OutstandingAmount]>=0 AND [SettledAmount]>=0 AND [ReleasedAmount]>=0 AND [InitialAmount]=[OutstandingAmount]+[SettledAmount]+[ReleasedAmount] AND [InitialAmount]=FLOOR([InitialAmount]) AND [OutstandingAmount]=FLOOR([OutstandingAmount]) AND [SettledAmount]=FLOOR([SettledAmount]) AND [ReleasedAmount]=FLOOR([ReleasedAmount])");
                    table.ForeignKey(
                        name: "FK_CreditReservations_SubmissionJobs_JobId",
                        column: x => x.JobId,
                        principalTable: "SubmissionJobs",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CreditReservations_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "GenerationBatches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Mode = table.Column<string>(type: "varchar(16)", unicode: false, maxLength: 16, nullable: false),
                    PricingPolicy = table.Column<string>(type: "varchar(24)", unicode: false, maxLength: 24, nullable: false),
                    RequestedCount = table.Column<int>(type: "int", nullable: false),
                    GeneratedCount = table.Column<int>(type: "int", nullable: false),
                    GenerationCredits = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    EvictedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    FormName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    FormUrl = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: false),
                    FormActionUrl = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: false),
                    ObservedMetadataJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ObservedMetadataSha256 = table.Column<string>(type: "char(64)", unicode: false, maxLength: 64, nullable: false, collation: "Latin1_General_100_BIN2"),
                    AiGenerationRunId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LegacyGroupingEvidence = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GenerationBatches", x => x.Id);
                    table.UniqueConstraint("AK_GenerationBatches_Id_ProjectId", x => new { x.Id, x.ProjectId });
                    table.CheckConstraint("CK_GenerationBatches_Counts", "[GeneratedCount]>=1 AND [GeneratedCount]<=[RequestedCount] AND [RequestedCount]<=100 AND [GenerationCredits]>=0");
                    table.CheckConstraint("CK_GenerationBatches_Pricing", "[Mode] IN ('rules','ai-default','ai-custom') AND [PricingPolicy] IN ('SeparatedV1','LegacyBundledV1') AND ([PricingPolicy]<>'SeparatedV1' OR [GenerationCredits]=[GeneratedCount]*CASE [Mode] WHEN 'rules' THEN 0 WHEN 'ai-default' THEN 1 WHEN 'ai-custom' THEN 2 END)");
                    table.ForeignKey(
                        name: "FK_GenerationBatches_AiGenerationRuns_AiGenerationRunId",
                        column: x => x.AiGenerationRunId,
                        principalTable: "AiGenerationRuns",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_GenerationBatches_FormProjects_ProjectId_UserId",
                        columns: x => new { x.ProjectId, x.UserId },
                        principalTable: "FormProjects",
                        principalColumns: new[] { "Id", "UserId" });
                    table.ForeignKey(
                        name: "FK_GenerationBatches_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "LegacyAttemptEvidence",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ResponseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LegacySubmissionLogId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LegacyEvidenceHash = table.Column<string>(type: "char(64)", nullable: false, collation: "Latin1_General_100_BIN2"),
                    OutcomeKind = table.Column<string>(type: "varchar(24)", unicode: false, maxLength: 24, nullable: false),
                    EntitlementState = table.Column<string>(type: "varchar(24)", unicode: false, maxLength: 24, nullable: false),
                    EvidenceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EvidenceCode = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: false),
                    ClassifierVersion = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false),
                    ArtifactReference = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    ArtifactSha256 = table.Column<string>(type: "char(64)", nullable: false, collation: "Latin1_General_100_BIN2"),
                    ObservedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ActorUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LegacyAttemptEvidence", x => x.Id);
                    table.CheckConstraint("CK_LegacyAttemptEvidence_Outcome", "[OutcomeKind] IN ('ConfirmedSuccess','ConfirmedRejected','Unknown') AND LEN(LTRIM(RTRIM([Reason])))>0");
                    table.ForeignKey(
                        name: "FK_LegacyAttemptEvidence_FormProjects_ProjectId_UserId",
                        columns: x => new { x.ProjectId, x.UserId },
                        principalTable: "FormProjects",
                        principalColumns: new[] { "Id", "UserId" });
                    table.ForeignKey(
                        name: "FK_LegacyAttemptEvidence_GeneratedResponses_ResponseId_ProjectId",
                        columns: x => new { x.ResponseId, x.ProjectId },
                        principalTable: "GeneratedResponses",
                        principalColumns: new[] { "Id", "ProjectId" });
                    table.ForeignKey(
                        name: "FK_LegacyAttemptEvidence_SubmissionLogs_LegacySubmissionLogId",
                        column: x => x.LegacySubmissionLogId,
                        principalTable: "SubmissionLogs",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_LegacyAttemptEvidence_Users_ActorUserId",
                        column: x => x.ActorUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_LegacyAttemptEvidence_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SubmissionJobItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    JobId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ResponseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GenerationBatchId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Ordinal = table.Column<int>(type: "int", nullable: false),
                    PayloadJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ObservedMetadataJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CompatibilityEvidenceJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CompatibilityCheckedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    FormActionUrl = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: false),
                    PayloadSha256 = table.Column<string>(type: "char(64)", nullable: false, collation: "Latin1_General_100_BIN2"),
                    ObservedMetadataSha256 = table.Column<string>(type: "char(64)", nullable: false, collation: "Latin1_General_100_BIN2"),
                    CompatibilityEvidenceSha256 = table.Column<string>(type: "char(64)", nullable: false, collation: "Latin1_General_100_BIN2"),
                    PricingPolicy = table.Column<string>(type: "varchar(24)", unicode: false, maxLength: 24, nullable: false),
                    MaximumSendCredits = table.Column<int>(type: "int", nullable: false),
                    AttemptState = table.Column<string>(type: "varchar(24)", unicode: false, maxLength: 24, nullable: false),
                    SettlementState = table.Column<string>(type: "varchar(24)", unicode: false, maxLength: 24, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    PossibleDispatchAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    OutcomeAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    SettlementCreditTransactionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubmissionJobItems", x => x.Id);
                    table.CheckConstraint("CK_SubmissionJobItems_Dispatch", "([AttemptState] IN ('PossibleDispatch','Unknown','Succeeded','Rejected') AND [PossibleDispatchAt] IS NOT NULL) OR ([AttemptState] IN ('Planned','NotDispatched') AND [PossibleDispatchAt] IS NULL)");
                    table.CheckConstraint("CK_SubmissionJobItems_Ledger", "([SettlementState]='Settled' AND [SettlementCreditTransactionId] IS NOT NULL) OR ([SettlementState]<>'Settled' AND [SettlementCreditTransactionId] IS NULL)");
                    table.CheckConstraint("CK_SubmissionJobItems_Outcome", "([AttemptState] IN ('Planned','PossibleDispatch','Unknown') AND [SettlementState] IN ('Held','PrepaidHeld')) OR ([AttemptState]='Succeeded' AND [SettlementState] IN ('Settled','PrepaidConsumed')) OR ([AttemptState] IN ('Rejected','NotDispatched') AND [SettlementState] IN ('Released','PrepaidReleased'))");
                    table.CheckConstraint("CK_SubmissionJobItems_Price", "[Ordinal]>=0 AND [Ordinal]<100 AND (([MaximumSendCredits]=1 AND [SettlementState] IN ('Held','Settled','Released')) OR ([MaximumSendCredits]=0 AND [PricingPolicy]='LegacyBundledV1' AND [SettlementState] IN ('PrepaidHeld','PrepaidConsumed','PrepaidReleased')))");
                    table.ForeignKey(
                        name: "FK_SubmissionJobItems_CreditTransactions_SettlementCreditTransactionId",
                        column: x => x.SettlementCreditTransactionId,
                        principalTable: "CreditTransactions",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SubmissionJobItems_GeneratedResponses_ResponseId_ProjectId",
                        columns: x => new { x.ResponseId, x.ProjectId },
                        principalTable: "GeneratedResponses",
                        principalColumns: new[] { "Id", "ProjectId" });
                    table.ForeignKey(
                        name: "FK_SubmissionJobItems_GenerationBatches_GenerationBatchId",
                        column: x => x.GenerationBatchId,
                        principalTable: "GenerationBatches",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SubmissionJobItems_SubmissionJobs_JobId_ProjectId",
                        columns: x => new { x.JobId, x.ProjectId },
                        principalTable: "SubmissionJobs",
                        principalColumns: new[] { "Id", "ProjectId" });
                });

            migrationBuilder.CreateTable(
                name: "CreditReservationEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReservationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    EvidenceId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreditTransactionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ActorUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Sequence = table.Column<int>(type: "int", nullable: false),
                    Kind = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false),
                    OutstandingDelta = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    SettledDelta = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ReleasedDelta = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    AttemptStateAfter = table.Column<string>(type: "varchar(24)", unicode: false, maxLength: 24, nullable: true),
                    SettlementStateAfter = table.Column<string>(type: "varchar(24)", unicode: false, maxLength: 24, nullable: true),
                    EvidenceCode = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: true),
                    ClassifierVersion = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: true),
                    ArtifactReference = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    ArtifactSha256 = table.Column<string>(type: "char(64)", nullable: true, collation: "Latin1_General_100_BIN2"),
                    ObservedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    Reason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CreditReservationEvents", x => x.Id);
                    table.CheckConstraint("CK_CreditReservationEvents_Kind", "[Kind] IN ('Reserved','PrepaidClaimed','PossibleDispatch','OutcomeUnknown','Settled','Released','PrepaidConsumed','PrepaidReleased') AND [Sequence]>=0 AND ([ItemId] IS NULL OR ([AttemptStateAfter] IS NOT NULL AND [SettlementStateAfter] IS NOT NULL))");
                    table.ForeignKey(
                        name: "FK_CreditReservationEvents_CreditReservations_ReservationId",
                        column: x => x.ReservationId,
                        principalTable: "CreditReservations",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CreditReservationEvents_CreditTransactions_CreditTransactionId",
                        column: x => x.CreditTransactionId,
                        principalTable: "CreditTransactions",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CreditReservationEvents_SubmissionJobItems_ItemId",
                        column: x => x.ItemId,
                        principalTable: "SubmissionJobItems",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CreditReservationEvents_Users_ActorUserId",
                        column: x => x.ActorUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserCreditAccounts_UserId",
                table: "UserCreditAccounts",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UsageLogs_SubmissionItemId",
                table: "UsageLogs",
                column: "SubmissionItemId",
                unique: true,
                filter: "[SubmissionItemId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_SubmissionLogs_ItemId",
                table: "SubmissionLogs",
                column: "ItemId",
                unique: true,
                filter: "[ItemId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_SubmissionJobs_GenerationBatchId",
                table: "SubmissionJobs",
                column: "GenerationBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_SubmissionJobs_ProjectId_RunnerAcknowledgedAt",
                table: "SubmissionJobs",
                columns: new[] { "ProjectId", "RunnerAcknowledgedAt" })
                .Annotation("SqlServer:Include", new[] { "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_SubmissionJobs_ProjectId_UserId",
                table: "SubmissionJobs",
                columns: new[] { "ProjectId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_SubmissionJobs_UserId_CommandId",
                table: "SubmissionJobs",
                columns: new[] { "UserId", "CommandId" },
                unique: true,
                filter: "[CommandId] IS NOT NULL");

            migrationBuilder.AddCheckConstraint(
                name: "CK_SubmissionJobs_V2",
                table: "SubmissionJobs",
                sql: "[ContractVersion] IS NULL OR ([ContractVersion]=2 AND [CommandId]=[Id] AND [UserId] IS NOT NULL AND [RequestFingerprint] IS NOT NULL AND [RouteKind] IN ('selected','direct') AND [PricingPolicy] IN ('SeparatedV1','LegacyBundledV1') AND [UnknownCount] IS NOT NULL AND [UnknownCount]>=0 AND [NotDispatchedCount] IS NOT NULL AND [NotDispatchedCount]>=0 AND [HeldCount] IS NOT NULL AND [HeldCount]>=0)");

            migrationBuilder.CreateIndex(
                name: "IX_GeneratedResponses_GenerationBatchId",
                table: "GeneratedResponses",
                column: "GenerationBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_GeneratedResponses_GenerationBatchId_BatchOrdinal",
                table: "GeneratedResponses",
                columns: new[] { "GenerationBatchId", "BatchOrdinal" },
                unique: true,
                filter: "[GenerationBatchId] IS NOT NULL AND [BatchOrdinal] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_GeneratedResponses_GenerationBatchId_ProjectId",
                table: "GeneratedResponses",
                columns: new[] { "GenerationBatchId", "ProjectId" });

            migrationBuilder.CreateIndex(
                name: "IX_GeneratedResponses_LegacyClaimItemId",
                table: "GeneratedResponses",
                column: "LegacyClaimItemId");

            migrationBuilder.AddCheckConstraint(
                name: "CK_GeneratedResponses_Batch",
                table: "GeneratedResponses",
                sql: "([GenerationBatchId] IS NULL AND [BatchOrdinal] IS NULL) OR ([GenerationBatchId] IS NOT NULL AND [BatchOrdinal] IS NOT NULL AND [BatchOrdinal]>=0 AND [BatchOrdinal]<100)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_GeneratedResponses_Entitlement",
                table: "GeneratedResponses",
                sql: "([PricingPolicy] IS NULL AND [LegacyEntitlementState] IS NULL AND [LegacyClaimItemId] IS NULL) OR ([PricingPolicy]='SeparatedV1' AND [LegacyEntitlementState] IS NOT NULL AND [LegacyEntitlementState]='NotApplicable' AND [LegacyClaimItemId] IS NULL) OR ([PricingPolicy]='LegacyBundledV1' AND [LegacyEntitlementState] IS NOT NULL AND (([LegacyEntitlementState] IN ('Available','Consumed') AND [LegacyClaimItemId] IS NULL) OR ([LegacyEntitlementState]='Claimed' AND [LegacyClaimItemId] IS NOT NULL) OR [LegacyEntitlementState]='ReconciliationRequired'))");

            migrationBuilder.CreateIndex(
                name: "IX_CreditTransactions_ReferenceId",
                table: "CreditTransactions",
                column: "ReferenceId",
                unique: true,
                filter: "[Type] = 'CreditUsed' AND [ReferenceType] = 'SubmissionJobItem' AND [ReferenceId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CreditReservationEvents_ActorUserId",
                table: "CreditReservationEvents",
                column: "ActorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CreditReservationEvents_CreditTransactionId",
                table: "CreditReservationEvents",
                column: "CreditTransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_CreditReservationEvents_EvidenceId",
                table: "CreditReservationEvents",
                column: "EvidenceId");

            migrationBuilder.CreateIndex(
                name: "IX_CreditReservationEvents_ItemId",
                table: "CreditReservationEvents",
                column: "ItemId",
                unique: true,
                filter: "[Kind] IN ('Settled','Released','PrepaidConsumed','PrepaidReleased')");

            migrationBuilder.CreateIndex(
                name: "IX_CreditReservationEvents_ItemId_EvidenceId",
                table: "CreditReservationEvents",
                columns: new[] { "ItemId", "EvidenceId" },
                unique: true,
                filter: "[ItemId] IS NOT NULL AND [EvidenceId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CreditReservationEvents_ReservationId_Sequence",
                table: "CreditReservationEvents",
                columns: new[] { "ReservationId", "Sequence" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CreditReservations_JobId",
                table: "CreditReservations",
                column: "JobId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CreditReservations_UserId_ClosedAt",
                table: "CreditReservations",
                columns: new[] { "UserId", "ClosedAt" })
                .Annotation("SqlServer:Include", new[] { "OutstandingAmount" });

            migrationBuilder.CreateIndex(
                name: "IX_GenerationBatches_AiGenerationRunId",
                table: "GenerationBatches",
                column: "AiGenerationRunId",
                unique: true,
                filter: "[AiGenerationRunId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_GenerationBatches_ProjectId",
                table: "GenerationBatches",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_GenerationBatches_ProjectId_UserId",
                table: "GenerationBatches",
                columns: new[] { "ProjectId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_GenerationBatches_UserId_CreatedAt_Id",
                table: "GenerationBatches",
                columns: new[] { "UserId", "CreatedAt", "Id" },
                descending: new[] { false, true, true },
                filter: "[EvictedAt] IS NULL")
                .Annotation("SqlServer:Include", new[] { "ProjectId", "Mode", "RequestedCount", "GeneratedCount", "GenerationCredits", "PricingPolicy" });

            migrationBuilder.CreateIndex(
                name: "IX_LegacyAttemptEvidence_ActorUserId",
                table: "LegacyAttemptEvidence",
                column: "ActorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_LegacyAttemptEvidence_LegacySubmissionLogId",
                table: "LegacyAttemptEvidence",
                column: "LegacySubmissionLogId");

            migrationBuilder.CreateIndex(
                name: "IX_LegacyAttemptEvidence_ProjectId_UserId",
                table: "LegacyAttemptEvidence",
                columns: new[] { "ProjectId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_LegacyAttemptEvidence_ResponseId_CreatedAt_Id",
                table: "LegacyAttemptEvidence",
                columns: new[] { "ResponseId", "CreatedAt", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_LegacyAttemptEvidence_ResponseId_EvidenceId",
                table: "LegacyAttemptEvidence",
                columns: new[] { "ResponseId", "EvidenceId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LegacyAttemptEvidence_ResponseId_LegacyEvidenceHash",
                table: "LegacyAttemptEvidence",
                columns: new[] { "ResponseId", "LegacyEvidenceHash" },
                unique: true,
                filter: "[OutcomeKind] IN ('ConfirmedSuccess','ConfirmedRejected')");

            migrationBuilder.CreateIndex(
                name: "IX_LegacyAttemptEvidence_ResponseId_ProjectId",
                table: "LegacyAttemptEvidence",
                columns: new[] { "ResponseId", "ProjectId" });

            migrationBuilder.CreateIndex(
                name: "IX_LegacyAttemptEvidence_UserId",
                table: "LegacyAttemptEvidence",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SubmissionJobItems_GenerationBatchId",
                table: "SubmissionJobItems",
                column: "GenerationBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_SubmissionJobItems_JobId",
                table: "SubmissionJobItems",
                column: "JobId");

            migrationBuilder.CreateIndex(
                name: "IX_SubmissionJobItems_JobId_Ordinal",
                table: "SubmissionJobItems",
                columns: new[] { "JobId", "Ordinal" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SubmissionJobItems_JobId_ProjectId",
                table: "SubmissionJobItems",
                columns: new[] { "JobId", "ProjectId" });

            migrationBuilder.CreateIndex(
                name: "IX_SubmissionJobItems_JobId_ResponseId",
                table: "SubmissionJobItems",
                columns: new[] { "JobId", "ResponseId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SubmissionJobItems_ResponseId_AttemptState",
                table: "SubmissionJobItems",
                columns: new[] { "ResponseId", "AttemptState" });

            migrationBuilder.CreateIndex(
                name: "IX_SubmissionJobItems_ResponseId_ProjectId",
                table: "SubmissionJobItems",
                columns: new[] { "ResponseId", "ProjectId" });

            migrationBuilder.CreateIndex(
                name: "IX_SubmissionJobItems_SettlementCreditTransactionId",
                table: "SubmissionJobItems",
                column: "SettlementCreditTransactionId",
                unique: true,
                filter: "[SettlementCreditTransactionId] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_GeneratedResponses_GenerationBatches_GenerationBatchId_ProjectId",
                table: "GeneratedResponses",
                columns: new[] { "GenerationBatchId", "ProjectId" },
                principalTable: "GenerationBatches",
                principalColumns: new[] { "Id", "ProjectId" });

            migrationBuilder.AddForeignKey(
                name: "FK_GeneratedResponses_SubmissionJobItems_LegacyClaimItemId",
                table: "GeneratedResponses",
                column: "LegacyClaimItemId",
                principalTable: "SubmissionJobItems",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SubmissionJobs_FormProjects_ProjectId_UserId",
                table: "SubmissionJobs",
                columns: new[] { "ProjectId", "UserId" },
                principalTable: "FormProjects",
                principalColumns: new[] { "Id", "UserId" });

            migrationBuilder.AddForeignKey(
                name: "FK_SubmissionJobs_GenerationBatches_GenerationBatchId",
                table: "SubmissionJobs",
                column: "GenerationBatchId",
                principalTable: "GenerationBatches",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SubmissionLogs_SubmissionJobItems_ItemId",
                table: "SubmissionLogs",
                column: "ItemId",
                principalTable: "SubmissionJobItems",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_UsageLogs_SubmissionJobItems_SubmissionItemId",
                table: "UsageLogs",
                column: "SubmissionItemId",
                principalTable: "SubmissionJobItems",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GeneratedResponses_GenerationBatches_GenerationBatchId_ProjectId",
                table: "GeneratedResponses");

            migrationBuilder.DropForeignKey(
                name: "FK_GeneratedResponses_SubmissionJobItems_LegacyClaimItemId",
                table: "GeneratedResponses");

            migrationBuilder.DropForeignKey(
                name: "FK_SubmissionJobs_FormProjects_ProjectId_UserId",
                table: "SubmissionJobs");

            migrationBuilder.DropForeignKey(
                name: "FK_SubmissionJobs_GenerationBatches_GenerationBatchId",
                table: "SubmissionJobs");

            migrationBuilder.DropForeignKey(
                name: "FK_SubmissionLogs_SubmissionJobItems_ItemId",
                table: "SubmissionLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_UsageLogs_SubmissionJobItems_SubmissionItemId",
                table: "UsageLogs");

            migrationBuilder.DropTable(
                name: "CreditReservationEvents");

            migrationBuilder.DropTable(
                name: "LegacyAttemptEvidence");

            migrationBuilder.DropTable(
                name: "CreditReservations");

            migrationBuilder.DropTable(
                name: "SubmissionJobItems");

            migrationBuilder.DropTable(
                name: "GenerationBatches");

            migrationBuilder.DropIndex(
                name: "IX_UserCreditAccounts_UserId",
                table: "UserCreditAccounts");

            migrationBuilder.DropIndex(
                name: "IX_UsageLogs_SubmissionItemId",
                table: "UsageLogs");

            migrationBuilder.DropIndex(
                name: "IX_SubmissionLogs_ItemId",
                table: "SubmissionLogs");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_SubmissionJobs_Id_ProjectId",
                table: "SubmissionJobs");

            migrationBuilder.DropIndex(
                name: "IX_SubmissionJobs_GenerationBatchId",
                table: "SubmissionJobs");

            migrationBuilder.DropIndex(
                name: "IX_SubmissionJobs_ProjectId_RunnerAcknowledgedAt",
                table: "SubmissionJobs");

            migrationBuilder.DropIndex(
                name: "IX_SubmissionJobs_ProjectId_UserId",
                table: "SubmissionJobs");

            migrationBuilder.DropIndex(
                name: "IX_SubmissionJobs_UserId_CommandId",
                table: "SubmissionJobs");

            migrationBuilder.DropCheckConstraint(
                name: "CK_SubmissionJobs_V2",
                table: "SubmissionJobs");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_GeneratedResponses_Id_ProjectId",
                table: "GeneratedResponses");

            migrationBuilder.DropIndex(
                name: "IX_GeneratedResponses_GenerationBatchId",
                table: "GeneratedResponses");

            migrationBuilder.DropIndex(
                name: "IX_GeneratedResponses_GenerationBatchId_BatchOrdinal",
                table: "GeneratedResponses");

            migrationBuilder.DropIndex(
                name: "IX_GeneratedResponses_GenerationBatchId_ProjectId",
                table: "GeneratedResponses");

            migrationBuilder.DropIndex(
                name: "IX_GeneratedResponses_LegacyClaimItemId",
                table: "GeneratedResponses");

            migrationBuilder.DropCheckConstraint(
                name: "CK_GeneratedResponses_Batch",
                table: "GeneratedResponses");

            migrationBuilder.DropCheckConstraint(
                name: "CK_GeneratedResponses_Entitlement",
                table: "GeneratedResponses");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_FormProjects_Id_UserId",
                table: "FormProjects");

            migrationBuilder.DropIndex(
                name: "IX_CreditTransactions_ReferenceId",
                table: "CreditTransactions");

            migrationBuilder.DropColumn(
                name: "SubmissionItemId",
                table: "UsageLogs");

            migrationBuilder.DropColumn(
                name: "ItemId",
                table: "SubmissionLogs");

            migrationBuilder.DropColumn(
                name: "CommandId",
                table: "SubmissionJobs");

            migrationBuilder.DropColumn(
                name: "ContractVersion",
                table: "SubmissionJobs");

            migrationBuilder.DropColumn(
                name: "GenerationBatchId",
                table: "SubmissionJobs");

            migrationBuilder.DropColumn(
                name: "HeldCount",
                table: "SubmissionJobs");

            migrationBuilder.DropColumn(
                name: "NotDispatchedCount",
                table: "SubmissionJobs");

            migrationBuilder.DropColumn(
                name: "PricingPolicy",
                table: "SubmissionJobs");

            migrationBuilder.DropColumn(
                name: "RequestFingerprint",
                table: "SubmissionJobs");

            migrationBuilder.DropColumn(
                name: "RouteKind",
                table: "SubmissionJobs");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "SubmissionJobs");

            migrationBuilder.DropColumn(
                name: "RunnerAcknowledgedAt",
                table: "SubmissionJobs");

            migrationBuilder.DropColumn(
                name: "UnknownCount",
                table: "SubmissionJobs");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "SubmissionJobs");

            migrationBuilder.DropColumn(
                name: "BatchOrdinal",
                table: "GeneratedResponses");

            migrationBuilder.DropColumn(
                name: "GenerationBatchId",
                table: "GeneratedResponses");

            migrationBuilder.DropColumn(
                name: "LegacyClaimItemId",
                table: "GeneratedResponses");

            migrationBuilder.DropColumn(
                name: "LegacyEntitlementState",
                table: "GeneratedResponses");

            migrationBuilder.DropColumn(
                name: "LegacyEvidenceReference",
                table: "GeneratedResponses");

            migrationBuilder.DropColumn(
                name: "PricingPolicy",
                table: "GeneratedResponses");
        }
    }
}
