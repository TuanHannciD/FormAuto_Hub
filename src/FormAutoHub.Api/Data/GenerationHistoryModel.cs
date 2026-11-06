using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Data;

internal static class GenerationHistoryModel
{
    public static void Configure(ModelBuilder model)
    {
        model.Entity<LegacyAttemptEvidence>(e =>
        {
            e.ToTable("LegacyAttemptEvidence", t => t.HasCheckConstraint("CK_LegacyAttemptEvidence_Outcome", "[OutcomeKind] IN ('ConfirmedSuccess','ConfirmedRejected','Unknown') AND LEN(LTRIM(RTRIM([Reason])))>0"));
            e.Property(x => x.LegacyEvidenceHash).HasColumnType("char(64)").UseCollation("Latin1_General_100_BIN2");
            e.Property(x => x.ArtifactSha256).HasColumnType("char(64)").UseCollation("Latin1_General_100_BIN2");
            e.Property(x => x.OutcomeKind).HasMaxLength(24).IsUnicode(false);
            e.Property(x => x.EntitlementState).HasMaxLength(24).IsUnicode(false);
            e.Property(x => x.EvidenceCode).HasMaxLength(64).IsUnicode(false);
            e.Property(x => x.ClassifierVersion).HasMaxLength(32).IsUnicode(false);
            e.Property(x => x.ArtifactReference).HasMaxLength(512);
            e.Property(x => x.Reason).HasMaxLength(1000);
            e.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne<User>().WithMany().HasForeignKey(x => x.ActorUserId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne<FormProject>().WithMany().HasForeignKey(x => new { x.ProjectId, x.UserId }).HasPrincipalKey(x => new { x.Id, x.UserId }).OnDelete(DeleteBehavior.NoAction);
            e.HasOne<GeneratedResponse>().WithMany().HasForeignKey(x => new { x.ResponseId, x.ProjectId }).HasPrincipalKey(x => new { x.Id, x.ProjectId }).OnDelete(DeleteBehavior.NoAction);
            e.HasOne<SubmissionLog>().WithMany().HasForeignKey(x => x.LegacySubmissionLogId).OnDelete(DeleteBehavior.NoAction);
            e.HasIndex(x => new { x.ResponseId, x.CreatedAt, x.Id });
            e.HasIndex(x => new { x.ResponseId, x.EvidenceId }).IsUnique();
            e.HasIndex(x => new { x.ResponseId, x.LegacyEvidenceHash }).IsUnique().HasFilter("[OutcomeKind] IN ('ConfirmedSuccess','ConfirmedRejected')");
        });
        model.Entity<FormProject>().HasAlternateKey(x => new { x.Id, x.UserId });
        model.Entity<GeneratedResponse>().HasAlternateKey(x => new { x.Id, x.ProjectId });
        model.Entity<SubmissionJob>().HasAlternateKey(x => new { x.Id, x.ProjectId });
        model.Entity<GenerationBatch>(e =>
        {
            e.HasAlternateKey(x => new { x.Id, x.ProjectId });
            e.Property(x => x.FormName).HasMaxLength(200);
            e.Property(x => x.FormUrl).HasMaxLength(2048);
            e.Property(x => x.FormActionUrl).HasMaxLength(2048);
            e.Property(x => x.LegacyGroupingEvidence).HasMaxLength(1000);
            e.Property(x => x.ObservedMetadataSha256).HasColumnType("char(64)").UseCollation("Latin1_General_100_BIN2");
            e.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne<FormProject>().WithMany().HasForeignKey(x => new { x.ProjectId, x.UserId }).HasPrincipalKey(x => new { x.Id, x.UserId }).OnDelete(DeleteBehavior.NoAction);
            e.HasOne<AiGenerationRun>().WithMany().HasForeignKey(x => x.AiGenerationRunId).OnDelete(DeleteBehavior.NoAction);
            e.HasIndex(x => new { x.UserId, x.CreatedAt, x.Id }).IsDescending(false, true, true).HasFilter("[EvictedAt] IS NULL")
                .IncludeProperties(x => new { x.ProjectId, x.Mode, x.RequestedCount, x.GeneratedCount, x.GenerationCredits, x.PricingPolicy });
            e.HasIndex(x => x.ProjectId);
            e.ToTable(t =>
            {
                t.HasCheckConstraint("CK_GenerationBatches_Counts", "[GeneratedCount]>=1 AND [GeneratedCount]<=[RequestedCount] AND [RequestedCount]<=100 AND [GenerationCredits]>=0");
                t.HasCheckConstraint("CK_GenerationBatches_Pricing", "[Mode] IN ('rules','ai-default','ai-custom') AND [PricingPolicy] IN ('SeparatedV1','LegacyBundledV1') AND ([PricingPolicy]<>'SeparatedV1' OR [GenerationCredits]=[GeneratedCount]*CASE [Mode] WHEN 'rules' THEN 0 WHEN 'ai-default' THEN 1 WHEN 'ai-custom' THEN 2 END)");
            });
        });
        model.Entity<GeneratedResponse>(e =>
        {
            e.Property(x => x.PricingPolicy).HasMaxLength(24).IsUnicode(false);
            e.Property(x => x.LegacyEntitlementState).HasMaxLength(24).IsUnicode(false);
            e.Property(x => x.LegacyEvidenceReference).HasMaxLength(1000);
            e.HasOne<GenerationBatch>().WithMany().HasForeignKey(x => new { x.GenerationBatchId, x.ProjectId }).HasPrincipalKey(x => new { x.Id, x.ProjectId }).OnDelete(DeleteBehavior.NoAction);
            e.HasOne<SubmissionJobItem>().WithMany().HasForeignKey(x => x.LegacyClaimItemId).OnDelete(DeleteBehavior.NoAction);
            e.HasIndex(x => x.GenerationBatchId);
            e.HasIndex(x => new { x.GenerationBatchId, x.BatchOrdinal }).IsUnique().HasFilter("[GenerationBatchId] IS NOT NULL AND [BatchOrdinal] IS NOT NULL");
            e.ToTable(t =>
            {
                t.HasCheckConstraint("CK_GeneratedResponses_Batch", "([GenerationBatchId] IS NULL AND [BatchOrdinal] IS NULL) OR ([GenerationBatchId] IS NOT NULL AND [BatchOrdinal] IS NOT NULL AND [BatchOrdinal]>=0 AND [BatchOrdinal]<100)");
                t.HasCheckConstraint("CK_GeneratedResponses_Entitlement", "([PricingPolicy] IS NULL AND [LegacyEntitlementState] IS NULL AND [LegacyClaimItemId] IS NULL) OR ([PricingPolicy] IS NOT NULL AND [PricingPolicy]='SeparatedV1' AND [LegacyEntitlementState] IS NOT NULL AND [LegacyEntitlementState]='NotApplicable' AND [LegacyClaimItemId] IS NULL) OR ([PricingPolicy] IS NOT NULL AND [PricingPolicy]='LegacyBundledV1' AND [LegacyEntitlementState] IS NOT NULL AND (([LegacyEntitlementState] IN ('Available','Consumed') AND [LegacyClaimItemId] IS NULL) OR ([LegacyEntitlementState]='Claimed' AND [LegacyClaimItemId] IS NOT NULL) OR [LegacyEntitlementState]='ReconciliationRequired'))");
            });
        });
        model.Entity<SubmissionJob>(e =>
        {
            e.Property(x => x.RequestFingerprint).HasColumnType("char(64)").UseCollation("Latin1_General_100_BIN2");
            e.Property(x => x.RouteKind).HasMaxLength(16).IsUnicode(false);
            e.Property(x => x.PricingPolicy).HasMaxLength(24).IsUnicode(false);
            e.Property(x => x.RowVersion).IsRowVersion();
            e.HasOne<FormProject>().WithMany().HasForeignKey(x => new { x.ProjectId, x.UserId }).HasPrincipalKey(x => new { x.Id, x.UserId }).OnDelete(DeleteBehavior.NoAction);
            e.HasOne<GenerationBatch>().WithMany().HasForeignKey(x => x.GenerationBatchId).OnDelete(DeleteBehavior.NoAction);
            e.HasIndex(x => new { x.UserId, x.CommandId }).IsUnique().HasFilter("[CommandId] IS NOT NULL");
            e.HasIndex(x => new { x.ProjectId, x.RunnerAcknowledgedAt }).IncludeProperties(x => x.Status);
            e.ToTable(t => t.HasCheckConstraint("CK_SubmissionJobs_V2", "[ContractVersion] IS NULL OR ([ContractVersion]=2 AND [CommandId] IS NOT NULL AND [CommandId]=[Id] AND [UserId] IS NOT NULL AND [RequestFingerprint] IS NOT NULL AND [RouteKind] IS NOT NULL AND [RouteKind] IN ('selected','direct') AND [PricingPolicy] IS NOT NULL AND [PricingPolicy] IN ('SeparatedV1','LegacyBundledV1') AND [UnknownCount] IS NOT NULL AND [UnknownCount]>=0 AND [NotDispatchedCount] IS NOT NULL AND [NotDispatchedCount]>=0 AND [HeldCount] IS NOT NULL AND [HeldCount]>=0)"));
        });
        model.Entity<SubmissionJobItem>(e =>
        {
            e.Property(x => x.FormActionUrl).HasMaxLength(2048);
            e.Property(x => x.PayloadSha256).HasColumnType("char(64)").UseCollation("Latin1_General_100_BIN2");
            e.Property(x => x.ObservedMetadataSha256).HasColumnType("char(64)").UseCollation("Latin1_General_100_BIN2");
            e.Property(x => x.CompatibilityEvidenceSha256).HasColumnType("char(64)").UseCollation("Latin1_General_100_BIN2");
            e.HasOne<SubmissionJob>().WithMany().HasForeignKey(x => new { x.JobId, x.ProjectId }).HasPrincipalKey(x => new { x.Id, x.ProjectId }).OnDelete(DeleteBehavior.NoAction);
            e.HasOne<GeneratedResponse>().WithMany().HasForeignKey(x => new { x.ResponseId, x.ProjectId }).HasPrincipalKey(x => new { x.Id, x.ProjectId }).OnDelete(DeleteBehavior.NoAction);
            e.HasOne<GenerationBatch>().WithMany().HasForeignKey(x => x.GenerationBatchId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne<CreditTransaction>().WithMany().HasForeignKey(x => x.SettlementCreditTransactionId).OnDelete(DeleteBehavior.NoAction);
            e.HasIndex(x => x.SettlementCreditTransactionId).IsUnique().HasFilter("[SettlementCreditTransactionId] IS NOT NULL");
            e.HasIndex(x => x.JobId);
            e.ToTable(t =>
            {
                t.HasCheckConstraint("CK_SubmissionJobItems_Price", "[Ordinal]>=0 AND [Ordinal]<100 AND (([MaximumSendCredits]=1 AND [SettlementState] IN ('Held','Settled','Released')) OR ([MaximumSendCredits]=0 AND [PricingPolicy]='LegacyBundledV1' AND [SettlementState] IN ('PrepaidHeld','PrepaidConsumed','PrepaidReleased')))");
                t.HasCheckConstraint("CK_SubmissionJobItems_Ledger", "([SettlementState]='Settled' AND [SettlementCreditTransactionId] IS NOT NULL) OR ([SettlementState]<>'Settled' AND [SettlementCreditTransactionId] IS NULL)");
                t.HasCheckConstraint("CK_SubmissionJobItems_Dispatch", "([AttemptState] IN ('PossibleDispatch','Unknown','Succeeded','Rejected') AND [PossibleDispatchAt] IS NOT NULL) OR ([AttemptState] IN ('Planned','NotDispatched') AND [PossibleDispatchAt] IS NULL)");
                t.HasCheckConstraint("CK_SubmissionJobItems_Outcome", "([AttemptState] IN ('Planned','PossibleDispatch','Unknown') AND [SettlementState] IN ('Held','PrepaidHeld')) OR ([AttemptState]='Succeeded' AND [SettlementState] IN ('Settled','PrepaidConsumed')) OR ([AttemptState] IN ('Rejected','NotDispatched') AND [SettlementState] IN ('Released','PrepaidReleased'))");
            });
        });
        model.Entity<CreditReservation>(e =>
        {
            e.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne<SubmissionJob>().WithMany().HasForeignKey(x => x.JobId).OnDelete(DeleteBehavior.NoAction);
            e.HasMany(x => x.Events).WithOne().HasForeignKey(x => x.ReservationId).OnDelete(DeleteBehavior.NoAction);
            e.HasIndex(x => new { x.UserId, x.ClosedAt }).IncludeProperties(x => x.OutstandingAmount);
            e.ToTable(t => t.HasCheckConstraint("CK_CreditReservations_Amounts", "[InitialAmount]>=0 AND [OutstandingAmount]>=0 AND [SettledAmount]>=0 AND [ReleasedAmount]>=0 AND [InitialAmount]=[OutstandingAmount]+[SettledAmount]+[ReleasedAmount] AND [InitialAmount]=FLOOR([InitialAmount]) AND [OutstandingAmount]=FLOOR([OutstandingAmount]) AND [SettledAmount]=FLOOR([SettledAmount]) AND [ReleasedAmount]=FLOOR([ReleasedAmount])"));
        });
        model.Entity<CreditReservationEvent>(e =>
        {
            e.Property(x => x.OutstandingDelta).HasPrecision(18, 2);
            e.Property(x => x.SettledDelta).HasPrecision(18, 2);
            e.Property(x => x.ReleasedDelta).HasPrecision(18, 2);
            e.Property(x => x.AttemptStateAfter).HasMaxLength(24).IsUnicode(false);
            e.Property(x => x.SettlementStateAfter).HasMaxLength(24).IsUnicode(false);
            e.Property(x => x.EvidenceCode).HasMaxLength(64).IsUnicode(false);
            e.Property(x => x.ClassifierVersion).HasMaxLength(32).IsUnicode(false);
            e.Property(x => x.ArtifactReference).HasMaxLength(512);
            e.Property(x => x.ArtifactSha256).HasColumnType("char(64)").UseCollation("Latin1_General_100_BIN2");
            e.Property(x => x.Reason).HasMaxLength(1000);
            e.HasOne<SubmissionJobItem>().WithMany().HasForeignKey(x => x.ItemId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne<CreditTransaction>().WithMany().HasForeignKey(x => x.CreditTransactionId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne<User>().WithMany().HasForeignKey(x => x.ActorUserId).OnDelete(DeleteBehavior.NoAction);
            e.HasIndex(x => x.ItemId).IsUnique().HasFilter("[Kind] IN ('Settled','Released','PrepaidConsumed','PrepaidReleased')");
            e.HasIndex(x => x.EvidenceId);
            e.ToTable(t =>
            {
                t.HasCheckConstraint("CK_CreditReservationEvents_Kind", "[Kind] IN ('Reserved','PrepaidClaimed','PossibleDispatch','OutcomeUnknown','Settled','Released','PrepaidConsumed','PrepaidReleased') AND [Sequence]>=0 AND ([ItemId] IS NULL OR ([AttemptStateAfter] IS NOT NULL AND [SettlementStateAfter] IS NOT NULL))");
            });
        });
        model.Entity<SubmissionLog>(e =>
        {
            e.HasOne<SubmissionJobItem>().WithMany().HasForeignKey(x => x.ItemId).OnDelete(DeleteBehavior.NoAction);
            e.HasIndex(x => x.ItemId).IsUnique().HasFilter("[ItemId] IS NOT NULL");
        });
        model.Entity<UsageLog>(e =>
        {
            e.HasOne<SubmissionJobItem>().WithMany().HasForeignKey(x => x.SubmissionItemId).OnDelete(DeleteBehavior.NoAction);
            e.HasIndex(x => x.SubmissionItemId).IsUnique().HasFilter("[SubmissionItemId] IS NOT NULL");
        });
    }
}
