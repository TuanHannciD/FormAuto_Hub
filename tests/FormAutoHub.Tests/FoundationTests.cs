using FormAutoHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Tests;

public sealed class FoundationTests
{
    [Fact]
    public void DbContextModel_IncludesDocumentedConceptualEntities()
    {
        using var context = CreateContext();

        var entityNames = context.Model.GetEntityTypes()
            .Select(entityType => entityType.ClrType.Name)
            .Order()
            .ToArray();

        Assert.Equal(
            [
                "AnswerRule",
                "AuditLog",
                "CreditPackage",
                "CreditTransaction",
                "FormProject",
                "FormQuestion",
                "GeneratedResponse",
                "SubmissionJob",
                "SubmissionLog",
                "TopupOrder",
                "UsageLog",
                "User",
                "UserCreditAccount"
            ],
            entityNames);
    }

    [Fact]
    public void DbContextModel_ConfiguresDecimalPrecisionForCreditAndMoneyFields()
    {
        using var context = CreateContext();

        AssertPrecision(context, "UserCreditAccount", "Balance");
        AssertPrecision(context, "UserCreditAccount", "TotalDeposited");
        AssertPrecision(context, "UserCreditAccount", "TotalUsed");
        AssertPrecision(context, "CreditPackage", "Price");
        AssertPrecision(context, "TopupOrder", "Amount");
        AssertPrecision(context, "CreditTransaction", "Amount");
        AssertPrecision(context, "CreditTransaction", "BalanceAfter");
    }

    private static FormAutoHubDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>()
            .UseSqlServer("Server=localhost;Database=FormAutoHubTest;Trusted_Connection=True;TrustServerCertificate=True")
            .Options;

        return new FormAutoHubDbContext(options);
    }

    private static void AssertPrecision(DbContext context, string entityName, string propertyName)
    {
        var property = context.Model.GetEntityTypes()
            .Single(entityType => entityType.ClrType.Name == entityName)
            .FindProperty(propertyName);

        Assert.NotNull(property);
        Assert.Equal(18, property.GetPrecision());
        Assert.Equal(2, property.GetScale());
    }
}
