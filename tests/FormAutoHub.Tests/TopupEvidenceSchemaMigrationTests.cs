using FormAutoHub.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace FormAutoHub.Tests;

public sealed class TopupEvidenceSchemaMigrationTests
{
    // SQL Server provider generates SQL offline; this does not test SQL execution/locking.
    internal static FormAutoHubDbContext Context() => new(new DbContextOptionsBuilder<FormAutoHubDbContext>()
        .UseSqlServer("Server=localhost;Database=OfflineScriptOnly;Integrated Security=true;TrustServerCertificate=true").Options);

    [Fact]
    public void ForwardNormalization_IsDiscoverableAndDoesNotChangeTheModel()
    {
        using var context = Context();
        Assert.Single(context.Database.GetMigrations(), x => x.EndsWith("_NormalizeTopupEvidenceColumnLengths"));
        Assert.False(context.Database.HasPendingModelChanges());
    }

    [Fact]
    public void NormalizationSql_RejectsVariableLockTimeoutSyntax_AndKeepsABoundedLiteral()
    {
        // Regression for SQL Server Msg 102: SET LOCK_TIMEOUT requires a literal,
        // including statements in branches which are not executed.
        var sql = SqlServerMigrationFixture.UpSql();
        Assert.DoesNotMatch(@"(?i)SET\s+LOCK_TIMEOUT\s+@", sql);
        Assert.Matches(@"(?i)SET\s+LOCK_TIMEOUT\s+15000\s*;", sql);
    }

    [Fact]
    public void DowngradeScript_FailsBeforeReplayingLegacyDown()
    {
        using var context = Context();
        var migrations = context.Database.GetMigrations().ToArray();
        var latest = Assert.Single(migrations, x => x.EndsWith("_NormalizeTopupEvidenceColumnLengths"));
        var error = Assert.Throws<NotSupportedException>(() => context.GetService<IMigrator>()
            .GenerateScript(latest, "20261007181332_ManualCreditFlow"));
        Assert.Contains("forward", error.Message, StringComparison.OrdinalIgnoreCase);
    }
}
