using FormAutoHub.DbCompatibility;

namespace FormAutoHub.Tests;

public sealed class DbCompatibilityPolicyTests
{
    private static readonly string[] Current = ["20261007181332_ManualCreditFlow", CompatibilityPolicy.PlannedMigration];
    private static readonly CatalogObject[] Baseline =
    [
        new("column:dbo.TopupOrderEvidenceFiles.OriginalFileName", "{\"type\":\"nvarchar\",\"maxLength\":400,\"nullable\":false}"),
        new("column:dbo.TopupOrderEvidenceFiles.ContentType", "{\"type\":\"nvarchar\",\"maxLength\":100,\"nullable\":false}"),
        new("column:dbo.TopupOrders.RowVersion", "{\"type\":\"timestamp\",\"maxLength\":8,\"nullable\":false}"),
        new("fk:dbo.TopupOrders.FK_evidence", "{\"disabled\":false,\"untrusted\":false}"),
        new("check:dbo.NodePositions.CK_target", "{\"disabled\":false,\"untrusted\":false}")
    ];

    [Fact]
    public void PreSync_AllowsOnlyPlannedPendingAndTwoMaxColumns()
    {
        var actual = Baseline.Select(x => x.Key.Contains("TopupOrderEvidenceFiles")
            ? x with { Signature = x.Signature.Replace("\"maxLength\":400", "\"maxLength\":-1").Replace("\"maxLength\":100", "\"maxLength\":-1") } : x).ToArray();
        var result = CompatibilityPolicy.Evaluate("pre-sync", Current,
            [Current[0], CompatibilityPolicy.LegacyMigration], [CompatibilityPolicy.PlannedMigration], false, Baseline, actual);
        Assert.Empty(result.Blocking);
        Assert.Equal("ready-for-planned-sync", result.State);
        Assert.Equal(2, result.RawDifferences.Length);
        Assert.Equal(4, result.Information.Length); // pending, legacy history, two max baselines
        Assert.NotEmpty(CompatibilityPolicy.Evaluate("post-sync", Current, [Current[0]],
            [CompatibilityPolicy.PlannedMigration], false, Baseline, actual).Blocking);
    }

    [Fact]
    public void KnownLegacyHistory_WithCompleteCurrentSet_IsInformational()
    {
        var result = CompatibilityPolicy.Evaluate("post-sync", Current, [.. Current, CompatibilityPolicy.LegacyMigration],
            [], false, Baseline, Baseline);
        Assert.Empty(result.Blocking);
        Assert.Single(result.Information);
        Assert.Equal("compatible", result.State);
    }

    [Theory]
    [InlineData("another-migration", false)]
    [InlineData("20261029142938_NormalizeTopupEvidenceColumnLengths", true)]
    public void PreSync_DoesNotWaiveOtherPendingOrModelDrift(string pending, bool modelPending)
    {
        Assert.NotEmpty(CompatibilityPolicy.Evaluate("pre-sync", Current, [Current[0]], [pending], modelPending,
            Baseline, Baseline).Blocking);
    }

    [Theory]
    [InlineData(0)] [InlineData(1)] [InlineData(2)] [InlineData(3)] [InlineData(4)]
    public void MissingOrChangedRequiredShape_IsBlocking(int index)
    {
        Assert.NotEmpty(CompatibilityPolicy.Evaluate("pre-sync", Current, [Current[0]], [Current[1]], false,
            Baseline, Baseline.Where((_, i) => i != index).ToArray()).Blocking);
        var changed = Baseline.ToArray();
        changed[index] = changed[index] with { Signature = "{}" };
        Assert.NotEmpty(CompatibilityPolicy.Evaluate("pre-sync", Current, [Current[0]], [Current[1]], false,
            Baseline, changed).Blocking);
    }

    [Fact]
    public void UnknownHistoryAndExtraObject_AreBlocking()
    {
        Assert.NotEmpty(CompatibilityPolicy.Evaluate("post-sync", Current, [.. Current, "unknown"], [], false,
            Baseline, Baseline).Blocking);
        Assert.NotEmpty(CompatibilityPolicy.Evaluate("post-sync", Current, Current, [], false,
            Baseline, [.. Baseline, new("index:dbo.TopupOrderEvidenceFiles.Unreviewed", "{}")]).Blocking);
    }

    [Fact]
    public void PreSync_DoesNotAllowMaxColumnsWhenNormalizationIsAlreadyApplied()
    {
        var actual = Baseline.Select(x => x.Key.Contains("TopupOrderEvidenceFiles")
            ? x with { Signature = x.Signature.Replace("\"maxLength\":400", "\"maxLength\":-1").Replace("\"maxLength\":100", "\"maxLength\":-1") } : x).ToArray();
        Assert.NotEmpty(CompatibilityPolicy.Evaluate("pre-sync", Current, Current, [], false, Baseline, actual).Blocking);
    }

    [Fact]
    public void LegacyIndexNameAlone_DoesNotEarnAllowance()
    {
        Assert.NotEmpty(CompatibilityPolicy.Evaluate("post-sync", Current, Current, [], false, Baseline,
            [.. Baseline, new("index:dbo.TopupOrderEvidenceFiles.IX_TopupOrderEvidenceFiles_TopupOrderId", "{}")]).Blocking);
    }

    [Theory]
    [InlineData(1, 0)] [InlineData(0, 1)]
    public void OversizeBytes_BlockPreSyncEvenWithOnlyExpectedPending(long names, long contentTypes)
    {
        Assert.NotEmpty(CompatibilityPolicy.Evaluate("pre-sync", Current, [Current[0]], [Current[1]], false,
            Baseline, Baseline, names, contentTypes).Blocking);
    }

    [Fact]
    public void CapturedLegacyIndexSignatures_AreInformational_ButAlteredShapesBlock()
    {
        CatalogObject unique = new("index:dbo.TopupOrderEvidenceFiles.IX_TopupOrderEvidenceFiles_TopupOrderId",
            """{"type":"NONCLUSTERED","unique":true,"primaryKey":false,"uniqueConstraint":false,"disabled":false,"hypothetical":false,"filter":"([TopupOrderId] IS NOT NULL)","columns":[{"name":"TopupOrderId","ordinal":1,"descending":false,"included":false}]}""");
        CatalogObject composite = new("index:dbo.TopupOrderEvidenceFiles.IX_TopupOrderEvidenceFiles_UserId_TopupOrderId",
            """{"type":"NONCLUSTERED","unique":false,"primaryKey":false,"uniqueConstraint":false,"disabled":false,"hypothetical":false,"filter":null,"columns":[{"name":"UserId","ordinal":1,"descending":false,"included":false},{"name":"TopupOrderId","ordinal":2,"descending":false,"included":false}]}""");
        var result = CompatibilityPolicy.Evaluate("post-sync", Current, Current, [], false, Baseline, [.. Baseline, unique, composite]);
        Assert.Empty(result.Blocking);
        Assert.Equal(2, result.Information.Length);
        foreach (var bad in new[] {
            unique with { Signature = unique.Signature.Replace("\"disabled\":false", "\"disabled\":true") },
            unique with { Signature = unique.Signature.Replace("\"descending\":false", "\"descending\":true") },
            unique with { Signature = unique.Signature.Replace("\"included\":false", "\"included\":true") },
            unique with { Signature = unique.Signature.Replace("\"unique\":true", "\"unique\":false") },
            unique with { Signature = unique.Signature.Replace("([TopupOrderId] IS NOT NULL)", "([UserId] IS NOT NULL)") },
            composite with { Signature = composite.Signature.Replace("\"name\":\"UserId\"", "\"name\":\"ContentType\"") } })
            Assert.NotEmpty(CompatibilityPolicy.Evaluate("post-sync", Current, Current, [], false, Baseline, [.. Baseline, bad]).Blocking);
    }
}
