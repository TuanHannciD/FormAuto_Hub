using Microsoft.EntityFrameworkCore;
using FormAutoHub.Api.Entities;

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
    }
}
