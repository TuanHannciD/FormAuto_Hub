using Microsoft.EntityFrameworkCore;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Entities.Nckh;

namespace FormAutoHub.Api.Data;

public sealed class FormAutoHubDbContext(DbContextOptions<FormAutoHubDbContext> options)
    : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<UserCreditAccount> UserCreditAccounts => Set<UserCreditAccount>();
    public DbSet<CreditPackage> CreditPackages => Set<CreditPackage>();
    public DbSet<TopupOrder> TopupOrders => Set<TopupOrder>();
    public DbSet<CreditTransaction> CreditTransactions => Set<CreditTransaction>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<UserExternalLogin> UserExternalLogins => Set<UserExternalLogin>();
    public DbSet<UsageLog> UsageLogs => Set<UsageLog>();
    public DbSet<FormProject> FormProjects => Set<FormProject>();
    public DbSet<FormQuestion> FormQuestions => Set<FormQuestion>();
    public DbSet<AnswerRule> AnswerRules => Set<AnswerRule>();
    public DbSet<GeneratedResponse> GeneratedResponses => Set<GeneratedResponse>();
    public DbSet<SubmissionJob> SubmissionJobs => Set<SubmissionJob>();
    public DbSet<SubmissionLog> SubmissionLogs => Set<SubmissionLog>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<PaymentProviderSetting> PaymentProviderSettings => Set<PaymentProviderSetting>();
    public DbSet<PaymentRecord> PaymentRecords => Set<PaymentRecord>();
    public DbSet<AiProviderSetting> AiProviderSettings => Set<AiProviderSetting>();
    public DbSet<AiPromptProfile> AiPromptProfiles => Set<AiPromptProfile>();
    public DbSet<AiQuestionPrompt> AiQuestionPrompts => Set<AiQuestionPrompt>();
    public DbSet<AiGenerationRun> AiGenerationRuns => Set<AiGenerationRun>();
    public DbSet<AiGenerationRunItem> AiGenerationRunItems => Set<AiGenerationRunItem>();

    public DbSet<ResearchForm> ResearchForms => Set<ResearchForm>();
    public DbSet<ResearchFormQuestion> ResearchFormQuestions => Set<ResearchFormQuestion>();
    public DbSet<ResearchModel> ResearchModels => Set<ResearchModel>();
    public DbSet<ResearchVariable> ResearchVariables => Set<ResearchVariable>();
    public DbSet<ObservedQuestionMapping> ObservedQuestionMappings => Set<ObservedQuestionMapping>();
    public DbSet<ModelRelation> ModelRelations => Set<ModelRelation>();
    public DbSet<NodePosition> NodePositions => Set<NodePosition>();
    public DbSet<SurveyResponse> SurveyResponses => Set<SurveyResponse>();
    public DbSet<NormalizedDataset> NormalizedDatasets => Set<NormalizedDataset>();
    public DbSet<DataCollectionLog> DataCollectionLogs => Set<DataCollectionLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(item => item.Email).IsUnique();
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasIndex(item => item.TokenHash).IsUnique();
            entity.HasIndex(item => new { item.UserId, item.RevokedAt });
        });

        modelBuilder.Entity<UserExternalLogin>(entity =>
        {
            entity.HasIndex(item => new { item.Provider, item.ProviderUserId }).IsUnique();
            entity.HasIndex(item => item.Email);
        });

        modelBuilder.Entity<UserCreditAccount>(entity =>
        {
            entity.Property(item => item.Balance).HasPrecision(18, 2);
            entity.Property(item => item.TotalDeposited).HasPrecision(18, 2);
            entity.Property(item => item.TotalUsed).HasPrecision(18, 2);
        });

        modelBuilder.Entity<CreditPackage>()
            .Property(item => item.Price)
            .HasPrecision(18, 2);

        modelBuilder.Entity<TopupOrder>()
            .Property(item => item.Amount)
            .HasPrecision(18, 2);

        modelBuilder.Entity<CreditTransaction>(entity =>
        {
            entity.Property(item => item.Amount).HasPrecision(18, 2);
            entity.Property(item => item.BalanceAfter).HasPrecision(18, 2);
        });

        modelBuilder.Entity<PaymentProviderSetting>(entity =>
        {
            entity.HasIndex(item => item.Provider).IsUnique();
        });

        modelBuilder.Entity<AiProviderSetting>(entity =>
        {
            entity.HasIndex(item => item.Provider).IsUnique();
        });

        modelBuilder.Entity<PaymentRecord>(entity =>
        {
            entity.Property(item => item.Amount).HasPrecision(18, 2);
            entity.HasIndex(item => new { item.Provider, item.ProviderOrderCode }).IsUnique();
            entity.HasIndex(item => new { item.Provider, item.ProviderPaymentLinkId })
                .IsUnique()
                .HasFilter("[ProviderPaymentLinkId] <> ''");
            entity.HasOne(item => item.TopupOrder)
                .WithMany()
                .HasForeignKey(item => item.TopupOrderId);
        });

        modelBuilder.Entity<AiPromptProfile>(entity =>
        {
            entity.HasIndex(item => new { item.ProjectId, item.Mode }).IsUnique();
            entity.HasOne(item => item.Project)
                .WithMany()
                .HasForeignKey(item => item.ProjectId);
        });

        modelBuilder.Entity<AiQuestionPrompt>(entity =>
        {
            entity.HasIndex(item => new { item.ProfileId, item.QuestionId }).IsUnique();
            entity.HasOne(item => item.Profile)
                .WithMany()
                .HasForeignKey(item => item.ProfileId);
            entity.HasOne(item => item.Question)
                .WithMany()
                .HasForeignKey(item => item.QuestionId);
        });

        modelBuilder.Entity<GeneratedResponse>(entity =>
        {
            entity.Property(item => item.Source).HasDefaultValue("Rule");
            entity.Property(item => item.IsReadOnly).HasDefaultValue(false);
        });

        modelBuilder.Entity<AiGenerationRun>(entity =>
        {
            entity.HasIndex(item => new { item.ProjectId, item.CreatedAt });
            entity.HasIndex(item => new { item.UserId, item.CreatedAt });
            entity.HasOne(item => item.Project)
                .WithMany()
                .HasForeignKey(item => item.ProjectId);
            entity.HasOne(item => item.PromptProfile)
                .WithMany()
                .HasForeignKey(item => item.PromptProfileId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AiGenerationRunItem>(entity =>
        {
            entity.HasIndex(item => item.RunId);
            entity.HasOne(item => item.Run)
                .WithMany()
                .HasForeignKey(item => item.RunId);
            entity.HasOne(item => item.Question)
                .WithMany()
                .HasForeignKey(item => item.QuestionId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(item => item.GeneratedResponse)
                .WithMany()
                .HasForeignKey(item => item.GeneratedResponseId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ResearchForm>(entity =>
        {
            entity.Property(item => item.GenerationSource).HasDefaultValue("Imported");
            entity.HasIndex(item => new { item.UserId, item.GoogleFormId }).IsUnique();
            entity.HasIndex(item => new { item.UserId, item.Status });
            entity.HasIndex(item => new { item.UserId, item.GeneratedFromModelId });
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(item => item.UserId);
            entity.HasOne(item => item.GeneratedFromModel)
                .WithMany()
                .HasForeignKey(item => item.GeneratedFromModelId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ResearchFormQuestion>(entity =>
        {
            entity.HasIndex(item => new { item.FormId, item.GoogleQuestionId });
            entity.HasIndex(item => new { item.FormId, item.OrderIndex });
            entity.HasOne(item => item.Form)
                .WithMany(item => item.Questions)
                .HasForeignKey(item => item.FormId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ResearchModel>(entity =>
        {
            entity.HasIndex(item => new { item.UserId, item.Status });
            entity.HasIndex(item => new { item.FormId, item.Status });
            entity.HasIndex(item => item.FormId)
                .IsUnique()
                .HasFilter("[Status] = 'Active'");
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(item => item.UserId);
            entity.HasOne(item => item.Form)
                .WithMany(item => item.Models)
                .HasForeignKey(item => item.FormId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ResearchVariable>(entity =>
        {
            entity.Property(item => item.MinValue).HasPrecision(18, 2);
            entity.Property(item => item.MaxValue).HasPrecision(18, 2);
            entity.HasIndex(item => new { item.ModelId, item.Code }).IsUnique();
            entity.HasOne(item => item.Model)
                .WithMany(item => item.Variables)
                .HasForeignKey(item => item.ModelId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ObservedQuestionMapping>(entity =>
        {
            entity.HasIndex(item => new { item.VariableId, item.FormQuestionId }).IsUnique();
            entity.HasIndex(item => new { item.VariableId, item.ObservedCode }).IsUnique();
            entity.HasOne(item => item.Variable)
                .WithMany(item => item.ObservedQuestionMappings)
                .HasForeignKey(item => item.VariableId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(item => item.FormQuestion)
                .WithMany(item => item.ObservedQuestionMappings)
                .HasForeignKey(item => item.FormQuestionId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<ModelRelation>(entity =>
        {
            entity.HasIndex(item => new { item.ModelId, item.FromVariableId, item.ToVariableId }).IsUnique();
            entity.HasIndex(item => new { item.ModelId, item.HypothesisCode }).IsUnique();
            entity.ToTable(table => table.HasCheckConstraint(
                "CK_ModelRelations_NoSelfRelation",
                "[FromVariableId] <> [ToVariableId]"));
            entity.HasOne(item => item.Model)
                .WithMany(item => item.Relations)
                .HasForeignKey(item => item.ModelId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(item => item.FromVariable)
                .WithMany(item => item.OutgoingRelations)
                .HasForeignKey(item => item.FromVariableId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(item => item.ToVariable)
                .WithMany(item => item.IncomingRelations)
                .HasForeignKey(item => item.ToVariableId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<NodePosition>(entity =>
        {
            entity.Property(item => item.PositionX).HasPrecision(18, 2);
            entity.Property(item => item.PositionY).HasPrecision(18, 2);
            entity.HasIndex(item => new { item.ModelId, item.NodeType, item.VariableId })
                .IsUnique()
                .HasFilter("[VariableId] IS NOT NULL");
            entity.HasIndex(item => new { item.ModelId, item.NodeType, item.RelationId })
                .IsUnique()
                .HasFilter("[RelationId] IS NOT NULL");
            entity.ToTable(table => table.HasCheckConstraint(
                "CK_NodePositions_ExactlyOneTarget",
                "(([VariableId] IS NOT NULL AND [RelationId] IS NULL) OR ([VariableId] IS NULL AND [RelationId] IS NOT NULL))"));
            entity.HasOne(item => item.Model)
                .WithMany(item => item.NodePositions)
                .HasForeignKey(item => item.ModelId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(item => item.Variable)
                .WithMany(item => item.NodePositions)
                .HasForeignKey(item => item.VariableId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(item => item.Relation)
                .WithMany(item => item.NodePositions)
                .HasForeignKey(item => item.RelationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SurveyResponse>(entity =>
        {
            entity.HasIndex(item => new { item.ModelId, item.GoogleResponseId }).IsUnique();
            entity.HasIndex(item => new { item.ModelId, item.RespondentId });
            entity.HasIndex(item => new { item.ModelId, item.ResponseTimestamp });
            entity.HasOne(item => item.Model)
                .WithMany(item => item.SurveyResponses)
                .HasForeignKey(item => item.ModelId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<NormalizedDataset>(entity =>
        {
            entity.Property(item => item.IsStale).HasDefaultValue(false);
            entity.HasIndex(item => new { item.ModelId, item.SurveyResponseId }).IsUnique();
            entity.HasIndex(item => new { item.ModelId, item.RespondentId });
            entity.HasIndex(item => new { item.ModelId, item.IsStale });
            entity.HasIndex(item => new { item.ModelId, item.NormalizedAt });
            entity.HasOne(item => item.Model)
                .WithMany(item => item.NormalizedDatasets)
                .HasForeignKey(item => item.ModelId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(item => item.SurveyResponse)
                .WithMany(item => item.NormalizedDatasets)
                .HasForeignKey(item => item.SurveyResponseId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<DataCollectionLog>(entity =>
        {
            entity.HasIndex(item => new { item.ModelId, item.StartedAt });
            entity.HasIndex(item => new { item.ModelId, item.Status });
            entity.HasOne(item => item.Model)
                .WithMany(item => item.DataCollectionLogs)
                .HasForeignKey(item => item.ModelId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
