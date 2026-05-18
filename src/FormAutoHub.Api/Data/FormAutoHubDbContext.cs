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
    public DbSet<UsageLog> UsageLogs => Set<UsageLog>();
    public DbSet<FormProject> FormProjects => Set<FormProject>();
    public DbSet<FormQuestion> FormQuestions => Set<FormQuestion>();
    public DbSet<AnswerRule> AnswerRules => Set<AnswerRule>();
    public DbSet<GeneratedResponse> GeneratedResponses => Set<GeneratedResponse>();
    public DbSet<SubmissionJob> SubmissionJobs => Set<SubmissionJob>();
    public DbSet<SubmissionLog> SubmissionLogs => Set<SubmissionLog>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
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
    }
}
